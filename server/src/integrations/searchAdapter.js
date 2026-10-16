import { algoliasearch } from "algoliasearch";

const APP_ID = process.env.ALGOLIA_APP_ID ?? "";
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY ?? "";
const SEARCH_KEY = process.env.ALGOLIA_SEARCH_KEY ?? "";
const INDEX_NAME = process.env.ALGOLIA_INDEX ?? "walkthrough_products";

const adminClient = algoliasearch(APP_ID, ADMIN_KEY);

export async function indexProducts(products) {
  // 1. Our model → Algolia's model. sku becomes objectID.
  const records = [];
  for (const product of products) {
    records.push({
      objectID: product.article_number,
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      image_url: product.image_url
    });
  }

  // 2. Send them to Algolia. Same objectID again → the product is updated, not duplicated (upsert).
  // waitForTasks: wait until Algolia is done, so a search right after finds the products.
  await adminClient.saveObjects({
    indexName: INDEX_NAME,
    objects: records,
    waitForTasks: true,
  });

  return records.length;
}

// Removes products from Algolia, e.g. when they are deleted in the shop.
// Otherwise the search still finds products that no longer exist.
export async function removeProducts(skus) {
  if (!skus.length) return 0;

  await adminClient.deleteObjects({
    indexName: INDEX_NAME,
    objectIDs: skus,
    waitForTasks: true,
  });

  return skus.length;
}

/**
 *  --- 2. SEARCH ---
 */
// The search key may only SEARCH. If it leaks, nobody can change our products.
const searchClient = algoliasearch(APP_ID, SEARCH_KEY);

export async function searchProducts(searchText, page = 1, pageSize = 10) {
  const searchParams = {
    query: searchText,
    page: page - 1,
    hitsPerPage: pageSize,
  };

  // We are only sending in the searchText through ?q=
  // But we can send in lots of params through querystring to make the searchresult much more functional with filters and pagination

  // 1. Ask Algolia. Typos are forgiven: "hodie" finds "Hoodie".
  const response = await searchClient.searchSingleIndex({
    indexName: INDEX_NAME,
    searchParams,
  });

  // 2. Algolia's model → our model. objectID becomes sku again.
  const products = [];
  for (const hit of response.hits) {
    products.push({
      article_number: hit.objectID,
      name: hit.name,
      category: hit.category,
      price: hit.price,
      description: hit.description,
      image_url: hit.image_url
    });
  }

  const total = response.nbHits;
  return {
    data: products,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
