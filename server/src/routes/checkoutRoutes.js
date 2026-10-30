import { Router } from "express";
import { z } from "zod";
import { createHostedCheckout } from "../integrations/paymentAdapter.js";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// React only sends WHAT the customer wants to buy – never the price.
// The expected request body:
//   {
//     "items": [
//       { "sku": "LEV-1001", "quantity": 1 },
//       { "sku": "LEV-1003", "quantity": 2 }
//     ]
//   }

// Zod validation: make sure the recieved data is an array with objects,
// every object has "sku: string" and "quantity: number"
const Cart = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  shippingMethod: z.enum(["pickup", "home_delivery"]),
  postalCode: z.string().trim().min(3).max(10),
});

async function createOrder(cart, userId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Hämta produkt-ID:n från varukorgen
    const productIds = cart.items.map((item) => item.productId);

    // 2. Hämta produkterna och lås raderna under transaktionen
    const result = await client.query(
      `SELECT id, name, price, stock
       FROM products
       WHERE id = ANY($1::int[])
       FOR UPDATE`,
      [productIds],
    );

    // 3. Kontrollera att alla produkter finns
    if (result.rows.length !== productIds.length) {
      throw new Error("En eller flera produkter finns inte.");
    }

    // 4. Kontrollera lagersaldo och bygg orderns produkter
    const items = cart.items.map((item) => {
      const product = result.rows.find(
        (product) => product.id === item.productId,
      );

      if (item.quantity > product.stock) {
        throw new Error(`Otillräckligt lager för ${product.name}.`);
      }

      return {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: item.quantity,
      };
    });

    // 5. Beräkna produktbeloppet från databasens priser.
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    // 6. Beräkna frakten på servern.
    const freeShippingThreshold = 500;

    let shippingCost = 0;

    if (subtotal < freeShippingThreshold) {
      shippingCost = cart.shippingMethod === "pickup" ? 59 : 99;
    }

    const totalPrice = subtotal + shippingCost;

    // 7. Skapa ordern och spara fraktinformationen.
    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id,
        subtotal,
        shipping_method,
        shipping_cost,
        shipping_postal_code,
        total_price,
        status
  )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        userId,
        subtotal,
        cart.shippingMethod,
        shippingCost,
        cart.postalCode,
        totalPrice,
        "pending",
      ],
    );

    const orderId = orderResult.rows[0].id;

    // 7. Spara varje produkt i order_items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items
          (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.productId, item.quantity, item.price],
      );
    }

    // 8. Bekräfta transaktionen
    await client.query("COMMIT");

    return {
      orderId,
      items,
      subtotal,
      shippingCost,
      shippingMethod: cart.shippingMethod,
      postalCode: cart.postalCode,
      totalPrice,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/* --- HOSTED: POST /api/checkout/hosted  { items: [{ sku, quantity }] } → { url } --- */
router.post("/hosted", requireAuth, async (req, res, next) => {
  // 1. Validera varukorgen
  const cart = Cart.safeParse(req.body);

  if (!cart.success) {
    return res.status(400).json({
      error: "Invalid cart",
      details: z.prettifyError(cart.error),
    });
  }

  let order;

  try {
    // 2. Skapa ordern med priser från databasen
    order = await createOrder(cart.data, req.user.id);

    // 3. Skapa en Stripe Checkout-session
    const checkout = await createHostedCheckout(
      order.orderId,
      order.items,
      order.shippingCost,
      order.shippingMethod,
    );

    // 4. Spara Stripe-sessionens ID på ordern
    await pool.query(
      `UPDATE orders
       SET stripe_session_id = $1
       WHERE id = $2`,
      [checkout.sessionId, order.orderId],
    );

    // 5. Skicka Checkout-URL till frontend
    return res.status(200).json({
      url: checkout.url,
      orderId: order.orderId,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/checkout/status?session_id=...
router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const { session_id: sessionId } = req.query;

    // 1. Validera session_id
    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return res.status(400).json({
        error: "Ogiltigt eller saknat session_id.",
      });
    }

    // 2. Hämta ordern som tillhör den inloggade användaren
    const result = await pool.query(
      `SELECT
        o.id,
        o.status,
        o.total_price,
        json_agg(
          json_build_object(
            'id', p.id,
            'name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) AS products
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.stripe_session_id = $1
        AND o.user_id = $2
      GROUP BY o.id, o.status, o.total_price`,
      [sessionId, req.user.id],
    );

    // 3. Kontrollera att ordern finns
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Ordern kunde inte hittas.",
      });
    }

    const order = result.rows[0];

    // 4. Skicka orderstatusen till frontend
    return res.status(200).json(order);
  } catch (error) {
    return next(error);
  }
});

export default router;
