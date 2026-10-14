import { parse } from "csv-parse/sync";
import { XMLParser } from "fast-xml-parser";
import { supplierProductSchema } from "../schemas/supplierProductSchema.js";

const API_URL = "https://leverantor-api.vercel.app/v1/export";

export async function fetchProductsCSV() {
  const response = await fetch(`${API_URL}/products.csv?bransch=elektronik`, {
    headers: {
      "X-Api-Key": process.env.SUPPLIER_API_KEY,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch supplier CSV: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();

  const decoder = new TextDecoder("windows-1252");
  const csvData = decoder.decode(buffer);

  return csvData;
}

export async function fetchProductsXML() {
  const response = await fetch(`${API_URL}/products.xml?bransch=elektronik`, {
    headers: {
      "X-Api-Key": process.env.SUPPLIER_API_KEY,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch supplier XML: ${response.status}`);
  }

  return await response.text();
}

export function parseProductsCSV(csvData) {
  const records = parse(csvData, {
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });
  return records;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: false,
});

export function parseProductsXML(xmlData) {
  const parsedData = parser.parse(xmlData);

  const products = parsedData.katalog?.produkt;

  if (!Array.isArray(products)) {
    throw new Error("Invalid XML: expected a product list");
  }

  return products.map((product) => ({
    artNr: product["@_artNr"],
    ean: product.ean,
    benamning: product.benamning,
    kategori: product.kategori,
    pris: String(product.pris?.["#text"] ?? "").replace(".", ","),
    valuta: product.pris?.["@_valuta"],
    lagersaldo: product.lagersaldo,
    varianter: product.varianter?.variant ?? [],
    uppdaterad: product.uppdaterad,
  }));
}

export function adaptSupplierProduct(product) {
  return {
    article_number: product.artNr,
    name: product.benamning,
    price: Number(product.pris.replace(",", ".")),
    description: product.kategori,
    image_url: null,
  };
}

export function validateAndAdaptProducts(products) {
  const validProducts = [];
  const skippedProducts = [];

  for (const product of products) {
    const validation = supplierProductSchema.safeParse(product);

    if (!validation.success) {
      skippedProducts.push({
        artNr: product.artNr,
        reason: validation.error.issues.map((issue) => issue.message),
      });

      continue;
    }

    validProducts.push(adaptSupplierProduct(validation.data));
  }

  return {
    products: validProducts,
    skippedProducts,
  };
}
