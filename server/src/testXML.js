import "dotenv/config";
import { fetchProductsXML } from "./integrations/productAdapter.js";
import { parseProductsXML } from "./integrations/productAdapter.js";
import { adaptSupplierProduct } from "./integrations/productAdapter.js";
import { supplierProductSchema } from "./schemas/supplierProductSchema.js";
import { importProduct } from "./services/productImportService.js";

const xmlData = await fetchProductsXML();
const products = parseProductsXML(xmlData);

const validProducts = [];
const skippedProducts = [];

for (const product of products) {
  const result = supplierProductSchema.safeParse(product);

  if (result.success) {
    validProducts.push(result.data);
  } else {
    skippedProducts.push({
      artNr: product.artNr,
      reason: result.error.issues,
    });
  }
}

console.log("Giltiga produkter:", validProducts.length);

const adaptedProducts = validProducts.map(adaptSupplierProduct);

let newProducts = 0;
let updatedProducts = 0;

for (const product of adaptedProducts) {
  const result = await importProduct(product);

  if (result.inserted) {
    newProducts++;
  } else {
    updatedProducts++;
  }
}

console.log("Importen till databasen är klar.");
console.log("Nya produkter:", newProducts);
console.log("Uppdaterade produkter:", updatedProducts);
console.log("Överhoppade produkter:", skippedProducts.length);
