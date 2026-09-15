import "./CartItem.css";

const CartItem = ({
  cart,
  getProductName,
  formatPrice,
  decreaseQuantity,
  addToCart,
  removeFromCart,
  getNumericPrice,
}) => {
  return (
    <>
      {cart.map((item) => (
        <li className="cart-item" key={item.product.id}>
          <div>
            <h3>{getProductName(item.product)}</h3>
            <p>{formatPrice(getNumericPrice(item.product))}</p>
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
