import { pool } from "../db.js";
import { indexProducts } from "../integrations/searchAdapter.js";

/* --- INDEX ALL: POST /api/admin/search/index --- */
// Sends ALL products to Algolia. Needed the first time, and when the index has fallen behind the DB.
export async function indexAllProducts(req, res, next) {
  try {
    const result = await pool.query(`SELECT * FROM products`);
    const indexedProducts = await indexProducts(result.rows);

    res.json(indexedProducts);
  } catch (err) {
    next(err);
  }
}


export async function getProducts(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT * FROM products`,
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  const { name, description, price, image_url, category } = req.product;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, image_url, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, price, image_url, category],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Ogiltigt produkt-id." });
  }

  const { name, description, price, image_url, category } = req.product;

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1,
           description = $2,
           price = $3,
           image_url = $4,
            category = $5
       WHERE id = $6
       RETURNING *`,
      [name, description, price, image_url, category, productId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Produkten hittades inte." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Ogiltigt produkt-id." });
  }

  try {
    const result = await pool.query(
      `DELETE FROM products WHERE id = $1 RETURNING *`,
      [productId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Produkten hittades inte." });
    }

    res.json({ message: "Produkten har tagits bort." });
  } catch (err) {
    next(err);
  }
}
