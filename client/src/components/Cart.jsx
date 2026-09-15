import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CartItem from "./CartItem";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const Cart = ({
  cart,
  getProductName,
  decreaseQuantity,
  addToCart,
  removeFromCart,
  setCart,
  auth,
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const navigate = useNavigate();

  const cartTotalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotalPrice = cart.reduce(
    (sum, item) => sum + getNumericPrice(item.product) * item.quantity,
    0,
  );

  function getNumericPrice(product) {
    const price = Number(product.price);
    return Number.isFinite(price) ? price : 0;
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(price);
  }
  async function handleCheckout() {
    setCheckoutMessage("");

    if (!auth) {
      navigate("/login");
      return;
    }

    try {
      setIsCheckingOut(true);

      await axios.post(
        `${API_URL}/orders`,
        {
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        },
      );

      setCart([]);
      setCheckoutMessage("Ordern är skickad! Tack för ditt köp.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingOut(false);
    }
  }

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

      {checkoutMessage && <p className="success-message">{checkoutMessage}</p>}

      {cart.length === 0 ? (
        <p className="empty-cart">Din varukorg är tom.</p>
      ) : (
        <>
          <ul className="cart-list">
            <CartItem
              cart={cart}
              getProductName={getProductName}
              formatPrice={formatPrice}
              decreaseQuantity={decreaseQuantity}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              getNumericPrice={getNumericPrice}
            />
          </ul>

          <div className="cart-total">
            <span>Totalt </span>
            <strong>{formatPrice(cartTotalPrice)}</strong>
          </div>

          <button
            className="checkout-button"
            type="button"
            disabled={isCheckingOut}
            onClick={handleCheckout}
          >
            {isCheckingOut ? "Skickar order..." : "Gå till kassan"}
          </button>
        </>
      )}
    </aside>
  );
};

export default Cart;
