import {
  fetchProductsCSV,
  fetchProductsXML,
  parseProductsCSV,
  parseProductsXML,
  validateAndAdaptProducts,
} from "../integrations/productAdapter.js";

import { importProduct } from "../services/productImportService.js";

async function handleProductImport(req, res, next, fetchData, parseData) {
  try {
    const rawData = await fetchData();
    const supplierProducts = parseData(rawData);

    const { products, skippedProducts } =
      validateAndAdaptProducts(supplierProducts);

    let newProducts = 0;
    let updatedProducts = 0;

    for (const product of products) {
      const result = await importProduct(product);

      if (result.inserted) {
        newProducts++;
      } else {
        updatedProducts++;
      }
    }

    return res.status(200).json({
      message: "Produktimporten är klar.",
      newProducts,
      updatedProducts,
      skippedProducts,
    });
  } catch (error) {
    next(error);
  }
}

export async function importCSV(req, res, next) {
  return handleProductImport(
    req,
    res,
    next,
    fetchProductsCSV,
    parseProductsCSV,
  );
}

export async function importXML(req, res, next) {
  return handleProductImport(
    req,
    res,
    next,
    fetchProductsXML,
    parseProductsXML,
  );
}
