import { XMLParser } from "fast-xml-parser";

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