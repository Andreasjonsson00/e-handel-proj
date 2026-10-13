export function adaptSupplierProduct(product) {
  return {
    article_number: product.artNr,
    name: product.benamning,
    price: Number(product.pris.replace(",", ".")),
    description: product.kategori,
    image_url: null,
  };
}