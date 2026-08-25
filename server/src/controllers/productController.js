import { pool } from "../db.js";

export async function getProducts(req, res) {
  try {
    const result = await pool.query(
      `SELECT * FROM products`,
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching products");
  }
}

export async function createProduct(req, res) {
  const { name, description, price, image_url } = req.product;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, price, image_url],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating product" });
  }
}

export async function updateProduct(req, res) {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Ogiltigt produkt-id." });
  }

  const { name, description, price, image_url } = req.product;

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1,
           description = $2,
           price = $3,
           image_url = $4
       WHERE id = $5
       RETURNING *`,
      [name, description, price, image_url, productId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Produkten hittades inte." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating product" });
  }
}
