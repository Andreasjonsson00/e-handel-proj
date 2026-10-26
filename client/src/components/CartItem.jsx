import "./CartItem.css";
import { useCurrency } from "../context/CurrencyProvider";

const CartItem = ({
  item,
  getProductName,
  decreaseQuantity,
  addToCart,
  removeFromCart,
}) => {
  const { currency, convertPrice } = useCurrency();

  return (
    <li className="cart-item">
      <div>
        <h3>{getProductName(item.product)}</h3>
        <p>
          {convertPrice(Number(item.product.price) * item.quantity).toFixed(2)}{" "}
          {currency}
        </p>
      </div>

      <div className="quantity-controls">
        <button
          type="button"
          aria-label={`Minska antal ${getProductName(item.product)}`}
          onClick={() => decreaseQuantity(item.product.id)}
        >
          -
        </button>

        <span>{item.quantity}</span>

        <button
          type="button"
          aria-label={`Öka antal ${getProductName(item.product)}`}
          onClick={() => addToCart(item.product)}
        >
          +
        </button>
      </div>

      <button
        className="remove-button"
        type="button"
        onClick={() => removeFromCart(item.product.id)}
      >
        Ta bort
      </button>
    </li>
  );
};

export default CartItem;
