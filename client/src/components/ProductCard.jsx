import "./ProductCard.css";

const ProductCard = ({ products, addToCart, getProductName }) => {
  function getProductDescription(product) {
    return product.description ?? "Ingen beskrivning ännu.";
  }

  function getProductPrice(product) {
    return product.price ?? "Pris saknas";
  }

  return (
    <>
      {products.map((product) => (
        <article className="product-card" key={product.id}>
          <div>
            <h2>{getProductName(product)}</h2>

            <p>{getProductDescription(product)}</p>

            <img src={product.image_url} alt={getProductName(product)} />
          </div>

          <div className="product-footer">
            <strong className="product-price">
              {getProductPrice(product)}:-
            </strong>

            <button type="button" onClick={() => addToCart(product)}>
              Lägg i varukorg
            </button>
          </div>
        </article>
      ))}
    </>
  );
};

export default ProductCard;
