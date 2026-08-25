import { pool } from "../db.js";

export async function createOrder(req, res) {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "Ordern måste innehålla minst en produkt." });
  }

  const orderItems = items.map((item) => ({
    productId: Number(item.productId),
    quantity: Number(item.quantity),
  }));

  const hasInvalidItem = orderItems.some(
    (item) =>
      !Number.isInteger(item.productId) ||
      item.productId <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0,
  );

  if (hasInvalidItem) {
    return res.status(400).json({
      message: "Varje orderrad måste ha productId och quantity större än 0.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productIds = orderItems.map((item) => item.productId);
    const productsResult = await client.query(
      `SELECT id, price
       FROM products
       WHERE id = ANY($1::int[])`,
      [productIds],
    );

    if (productsResult.rowCount !== new Set(productIds).size) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "En eller flera produkter finns inte." });
    }

    const productsById = new Map(
      productsResult.rows.map((product) => [product.id, product]),
    );

    const totalPrice = orderItems.reduce((sum, item) => {
      const product = productsById.get(item.productId);
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_price)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, totalPrice],
    );

    const order = orderResult.rows[0];

    for (const item of orderItems) {
      const product = productsById.get(item.productId);

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.productId, item.quantity, product.price],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Ordern skapades.",
      order,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Error creating order" });
  } finally {
    client.release();
  }
}

export async function getOrders(req, res) {
  try {
    const params = [];
    let whereClause = "";

    if (req.user.role !== "admin") {
      params.push(req.user.id);
      whereClause = "WHERE o.user_id = $1";
    }

    const result = await pool.query(
      `SELECT
        o.id,
        o.user_id,
        o.total_price,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'product_name', p.name
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       ${whereClause}
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      params,
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching orders" });
  }
}
