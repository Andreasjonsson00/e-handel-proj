import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getProductName(product) {
  return product.name ?? "Namnlös produkt";
}

function getProductDescription(product) {
  return product.description ?? "Ingen beskrivning ännu.";
}

function getProductPrice(product) {
  return product.price ?? "Pris saknas";
}

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

function Frontpage({ auth, onLogout }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");

  const cartTotalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPrice = cart.reduce(
    (sum, item) => sum + getNumericPrice(item.product) * item.quantity,
    0,
  );

  function addToCart(product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentCart, { product, quantity: 1 }];
    });
  }

  function decreaseQuantity(productId) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product.id !== productId),
    );
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

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get(`${API_URL}/products`);
        setProducts(response.data);
      } catch (err) {
        console.error(err);

        setError(
          "Kunde inte hämta produkter. Kontrollera att servern är igång.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <>
      <Header auth={auth} onLogout={onLogout} />
      <main className="container">
        <section className="storefront">
          <div className="page-heading">
            <h1>Produkter</h1>

            <p>Välj produkter och lägg dem i varukorgen.</p>
          </div>

          {isLoading && <p>Hämtar produkter...</p>}

          {error && <p>{error}</p>}

          {!isLoading && !error && products.length === 0 && (
            <p>Det finns inga produkter i databasen ännu.</p>
          )}

          <div className="product-container">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div>
                  <h2>{getProductName(product)}</h2>

                  <p>{getProductDescription(product)}</p>

                  <img src={product.image_url} alt={getProductName(product)} />
                </div>

                <div className="product-footer">
                  <strong>{getProductPrice(product)}</strong>

                  <button type="button" onClick={() => addToCart(product)}>
                    Lägg i varukorg
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

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

          {checkoutMessage && (
            <p className="success-message">{checkoutMessage}</p>
          )}

          {cart.length === 0 ? (
            <p className="empty-cart">Din varukorg är tom.</p>
          ) : (
            <>
              <ul className="cart-list">
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
              </ul>

              <div className="cart-total">
                <span>Totalt</span>
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
      </main>
    </>
  );
}

export default Frontpage;
