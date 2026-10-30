import { searchProducts } from "../integrations/searchAdapter.js";
import { searchQuerySchema } from "../schemas/searchQuerySchema.js";
// Validate data from the USER before sending it on to another system.

// GET /api/search?q=hoodie → search in Algolia
// Anyone may do this: it only READS, with the search key.
export async function search(req, res, next) {
  // const searchText = typeof req.query.q === 'string' ? req.query.q : ''
  // 1. Validate the parameters
  const result = searchQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({
      error: "Invalid search parameters",
      details: z.prettifyError(result.error),
    });
    return;
  }

  // 2. The adapter searches and returns OUR model: a list of products
  try {
    const products = await searchProducts(
      result.data.q,
      result.data.page,
      result.data.pageSize,
    );
    res.json(products);
  } catch (error) {
    next(error);
  }
}
