import { pool } from "../db.js";
import {
  indexProducts,
  removeProducts,
} from "../integrations/searchAdapter.js";

/* --- INDEX ALL: POST /api/admin/search/index --- */
// Sends ALL products to Algolia. Needed the first time, and when the index has fallen behind the DB.
export async function indexAllProducts(req, res, next) {
  try {
    const result = await pool.query(`SELECT * FROM products`);
    const indexedProducts = await indexProducts(result.rows);

    res.json({ indexedProducts, searchIndexed: true });
  } catch (err) {
    next(err);
  }
}

export async function getProducts(req, res, next) {
  const page = Math.max(
    1,

    Number.parseInt(req.query.page, 10) || 1,
  );

  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10),
  );

  const offset = (page - 1) * pageSize;

  try {
    const result = await pool.query(
      `SELECT *
      FROM products
      ORDER BY id
      LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
   FROM products`,
    );

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / pageSize);

    res.json({
      data: result.rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  const { name, description, price, image_url, category } = req.product;

  // 1. Save first in DB
  // 2. If all is well,  index the new product in Algolia.
  let newProduct;
  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, image_url, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, price, image_url, category],
    );

    newProduct = result.rows[0];
  } catch (err) {
    return next(err);
  }

  try {
    await indexProducts([newProduct]);
    res.status(201).json({ newProduct, searchIndexed: true });
  } catch (err) {
    console.warn("Could not index the new product to Algolia:", err);
    res.status(201).json({ newProduct, searchIndexed: false });
  }
}

export async function updateProduct(req, res, next) {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Ogiltigt produkt-id." });
  }

  const { name, description, price, image_url, category } = req.product;

  let updatedProduct;
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

    updatedProduct = result.rows[0];
  } catch (err) {
    return next(err);
  }

  try {
    await indexProducts([updatedProduct]);
    res.status(200).json({ updatedProduct, searchIndexed: true });
  } catch (err) {
    console.warn("Could not index the updated product to Algolia:", err);
    res.status(201).json({ updatedProduct, searchIndexed: false });
  }
}

export async function deleteProduct(req, res, next) {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Ogiltigt produkt-id." });
  }

  let deletedProduct;
  try {
    const result = await pool.query(
      `DELETE FROM products WHERE id = $1 RETURNING *`,
      [productId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Produkten hittades inte." });
    }

    deletedProduct = result.rows[0];
  } catch (err) {
    return next(err);
  }

  try {
    await removeProducts([deletedProduct.article_number]);
    res.status(200).json({ deletedProduct, searchIndexed: true });
  } catch (err) {
    console.warn("Could not index the deleted product to Algolia:", err);
    res.status(201).json({ deletedProduct, searchIndexed: false });
  }
}
