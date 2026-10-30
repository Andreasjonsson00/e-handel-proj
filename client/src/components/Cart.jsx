import { useNavigate } from "react-router-dom";
import { useCurrency } from "../context/CurrencyProvider";
import CartItemList from "./CartItemList";

const Cart = ({
  cart,
  getProductName,
  decreaseQuantity,
  addToCart,
  removeFromCart,
  setCart,
  auth,
  cartTotalPrice,
  cartTotalQuantity,
}) => {
  const { currency, convertPrice } = useCurrency();
  const navigate = useNavigate();

  return (
    <aside className="cart" aria-label="Varukorg">
      <div className="cart-header">
        <div>
          <p>Varukorg</p>
          <h2>{cartTotalQuantity} varor</h2>
        </div>

        {cart.length > 0 && (
          <button
            className="empty-button"
            type="button"
            onClick={() => setCart([])}
          >
            Töm
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <p className="empty-cart">Din varukorg är tom.</p>
      ) : (
        <>
          <ul className="cart-list">
            <CartItemList
              cart={cart}
              getProductName={getProductName}
              decreaseQuantity={decreaseQuantity}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
            />
          </ul>

          <div className="cart-total">
            <span>Totalt </span>
            <strong>{convertPrice(cartTotalPrice).toFixed(2)}</strong>
            {currency}
          </div>

          <button
            className="checkout-button"
            type="button"
            onClick={() => {
              if (!auth) {
                navigate("/login");
                return;
              }

              navigate("/checkout");
            }}
          >
            Gå till kassan
          </button>
        </>
      )}
    </aside>
  );
};

export default Cart;
