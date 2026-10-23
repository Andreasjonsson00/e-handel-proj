import express, { Router } from "express";
import { verifyWebhook } from "../integrations/paymentAdapter.js";
import { pool } from "../db.js";

const router = Router();

/* --- WEBHOOK: POST /api/stripe/webhook – called by STRIPE, not by React --- */
// express.raw: keep the body as raw bytes. The signature is calculated on the bytes exactly as Stripe
// sent them. After express.json() they are gone, and the verification always fails.
// That's why this router is registered BEFORE app.use(express.json()) in index.ts.
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // 1. Verify that the request comes from Stripe
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
      res.status(400).send("Missing Stripe-Signature");
      return;
    }

    let event;
    try {
      event = verifyWebhook(req.body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      res.status(400).send("Invalid signature"); // not from Stripe – ignore it
      return;
    }
    console.log("\n[WEBHOOK] Event:", event.type, event.id);

    // 2. Handle the events we care about. Stripe sends many others – we ignore them.
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;

        // 1. Kontrollera att betalningen är genomförd
        if (session.payment_status !== "paid") break;

        // 2. Hämta orderns ID från Stripe-sessionen
        const orderId = session.client_reference_id;

        if (!orderId || !/^\d+$/.test(orderId)) {
          console.error("[WEBHOOK] Invalid order ID:", orderId);
          return res.status(400).send("Invalid order ID");
        }

        const client = await pool.connect();

        try {
          await client.query("BEGIN");

          // 3. Markera ordern som betald, men bara om den är pending
          const orderResult = await client.query(
            `UPDATE orders
              SET status = 'paid'
              WHERE id = $1
              AND status = 'pending'
              AND stripe_session_id = $2
              RETURNING id`,
            [orderId, session.id],
          );

          // 4. Om ingen order uppdaterades har ordern redan hanterats
          // eller så stämmer inte ordern med Stripe-sessionen.
          if (orderResult.rowCount === 0) {
            await client.query("ROLLBACK");

            console.log(
              "[WEBHOOK] Order already processed or not found:",
              orderId,
            );

            break;
          }

          // 5. Dra av lagret för varje produkt i ordern
          const stockResult = await client.query(
            `UPDATE products AS p
              SET stock = p.stock - oi.quantity
              FROM order_items AS oi
              WHERE oi.order_id = $1
              AND oi.product_id = p.id
              AND p.stock >= oi.quantity
              RETURNING p.id`,
            [orderId],
          );

          // 6. Kontrollera att alla orderrader kunde uppdateras
          const itemsResult = await client.query(
            `SELECT COUNT(*)::int AS count
              FROM order_items
              WHERE order_id = $1`,
            [orderId],
          );

          if (
            Number(itemsResult.rows[0].count) === 0 ||
            stockResult.rowCount !== Number(itemsResult.rows[0].count)
          ) {
            throw new Error(
              `Could not update stock for every item in order ${orderId}`,
            );
          }

          // 7. Bekräfta båda ändringarna samtidigt
          await client.query("COMMIT");

          console.log("[WEBHOOK] Order paid and stock updated:", orderId);
        } catch (error) {
          await client.query("ROLLBACK");
          console.error("[WEBHOOK] Order processing failed:", error);
          return res.status(500).send("Order processing failed");
        } finally {
          client.release();
        }

        break;
      }

      // The customer never paid: the Checkout Session expired (after 24 hours by default).
      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.client_reference_id;

        if (!orderId) {
          console.error("[WEBHOOK] Invalid order ID:", orderId);
          return res.status(400).send("Invalid order ID");
        }

        // In your shop: cancel the order, but only if it is still pending –
        // an order that is already paid is never cancelled:
        try {
          const result = await pool.query(
            `UPDATE orders
              SET status = 'cancelled'
              WHERE id = $1
              AND status = 'pending'
              AND stripe_session_id = $2
              RETURNING id`,
            [orderId, session.id],
          );

          if (result.rowCount > 0) {
            console.log("[WEBHOOK] Order cancelled:", orderId);
          } else {
            console.log(
              "[WEBHOOK] Order already processed or not found:",
              orderId,
            );
          }
        } catch (error) {
          console.error("[WEBHOOK] Failed to cancel order:", error);
          return res.status(500).send("Failed to cancel order");
        }

        break;
      }

      default:
        console.log("[WEBHOOK] Ignored event type:", event.type);
    }

    return res.status(200).json({ received: true });
  },
);

export default router;
