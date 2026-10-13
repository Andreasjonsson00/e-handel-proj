import { pool } from "../db.js";

export async function importProduct(product) {
  const query = `
    INSERT INTO products (
      article_number,
      name,
      price,
      description,
      image_url
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (article_number)
    DO UPDATE SET
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url
    RETURNING id, (xmax = 0) AS inserted;
  `;

  const values = [
    product.article_number,
    product.name,
    product.price,
    product.description,
    product.image_url,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
}