import "./ProductCard.css";
import { useCurrency } from "../context/CurrencyProvider";

const ProductCard = ({ product, addToCart, getProductName }) => {
  const { currency, convertPrice } = useCurrency();

  function getProductDescription(product) {
    return product.description ?? "Ingen beskrivning ännu.";
  }

  function getProductPrice(product) {
    return product.price ?? null;
  }

  return (
    <>
      <article className="product-card" key={product.article_number}>
        <div>
          <h2>{getProductName(product)}</h2>

          <p>{getProductDescription(product)}</p>

          <img
            src={`${product.image_url}?auto=format&fit=crop&w=600&q=75`}
            alt={getProductName(product)}
            loading="lazy"
            decoding="async"
            width="600"
            height="400"
          />
        </div>

        <div className="product-footer">
          <strong className="product-price">
            {convertPrice(Number(getProductPrice(product))).toFixed(2)}{" "}
            {currency}
          </strong>

          <button type="button" onClick={() => addToCart(product)}>
            Lägg i varukorg
          </button>
        </div>
      </article>
    </>
  );
};

export default ProductCard;
