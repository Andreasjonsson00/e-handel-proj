import {
  fetchElectronicsCSV,
  fetchElectronicsXML,
} from "../services/supplierService.js";
import { parseProductsCSV } from "../services/csvParser.js";
import { parseProductsXML } from "../services/xmlParser.js";
import { supplierProductSchema } from "../schemas/supplierProductSchema.js";
import { adaptSupplierProduct } from "../integrations/productAdapter.js";
import { importProduct } from "../services/productImportService.js";

async function handleProductImport(req, res, next, fetchData, parseData) {
  try {
    const rawData = await fetchData();
    const supplierProducts = parseData(rawData);

    let newProducts = 0;
    let updatedProducts = 0;
    const skippedProducts = [];

    for (const product of supplierProducts) {
      const validation = supplierProductSchema.safeParse(product);

      if (!validation.success) {
        skippedProducts.push({
          artNr: product.artNr,
          reason: validation.error.issues.map((issue) => issue.message),
        });

        continue;
      }

      const adaptedProduct = adaptSupplierProduct(validation.data);
      const result = await importProduct(adaptedProduct);

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
    fetchElectronicsCSV,
    parseProductsCSV
  );
}

export async function importXML(req, res, next) {
  return handleProductImport(
    req,
    res,
    next,
    fetchElectronicsXML,
    parseProductsXML
  );
}
