import "./CartItem.css";
import { useCurrency } from "../context/CurrencyProvider";

const CartItem = ({
  cart,
  getProductName,
  decreaseQuantity,
  addToCart,
  removeFromCart,
  cartTotalPrice,
}) => {
  const { currency, convertPrice } = useCurrency();

  return (
    <>
      {cart.map((item) => (
        <li className="cart-item" key={item.product.id}>
          <div>
            <h3>{getProductName(item.product)}</h3>
            <p>
              {convertPrice(cartTotalPrice).toFixed(2)} {currency}
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
      ))}
    </>
  );
};

export default CartItem;
