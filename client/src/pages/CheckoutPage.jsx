import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import "./CheckoutPage.css";
import { useCurrency } from "../context/CurrencyProvider";
import Cart from "../components/Cart";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function CheckoutPage({
  cart,
  setCart,
  auth,
  onLogout,
  cartTotalPrice,
  addToCart,
  decreaseQuantity,
  removeFromCart,
  getProductName,
}) {
  const navigate = useNavigate();

  const [shippingMethod, setShippingMethod] = useState("pickup");
  const [postalCode, setPostalCode] = useState("");
  const [servicePoints, setServicePoints] = useState([]);
  const [selectedServicePoint, setSelectedServicePoint] = useState("");
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");

  const { currency, convertPrice } = useCurrency();

  const subtotal =
    cartTotalPrice ??
    cart.reduce(
      (total, item) => total + Number(item.product.price) * item.quantity,
      0,
    );

  const shippingCost =
    subtotal >= 500 ? 0 : shippingMethod === "pickup" ? 59 : 99;

  async function fetchServicePoints() {
    setLoadingPoints(true);
    setError("");
    setServicePoints([]);
    setSelectedServicePoint("");

    try {
      const response = await axios.get(
        `${API_URL}/api/shipping/service-points`,
        {
          params: { postalCode },
        },
      );

      setServicePoints(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Kunde inte hämta PostNord-ombud. Försök igen.",
      );
    } finally {
      setLoadingPoints(false);
    }
  }

  async function handleCheckout(event) {
    event.preventDefault();
    setError("");

    if (!auth?.token) {
      navigate("/login");
      return;
    }

    if (!/^\d{5}$/.test(postalCode.trim())) {
      setError("Ange ett giltigt postnummer med fem siffror.");
      return;
    }

    if (shippingMethod === "pickup" && !selectedServicePoint) {
      setError("Välj ett PostNord-ombud innan du fortsätter.");
      return;
    }

    try {
      setIsCheckingOut(true);

      const response = await axios.post(
        `${API_URL}/api/checkout/hosted`,
        {
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          shippingMethod,
          postalCode: postalCode.trim(),
          servicePointId:
            shippingMethod === "pickup" ? selectedServicePoint : null,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        },
      );

      window.location.href = response.data.url;
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Kunde inte starta betalningen. Försök igen.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (!cart?.length) {
    return (
      <main className="checkout-page-container">
        <h1>Kassan</h1>
        <p>Din varukorg är tom.</p>
        <button type="button" onClick={() => navigate("/")}>
          Fortsätt handla
        </button>
      </main>
    );
  }

  return (
    <>
      <Header auth={auth} onLogout={onLogout} />
      <main className="checkout-page-container">
        <form className="checkout-form" onSubmit={handleCheckout}>
          <h1 className="checkout-page-heading">Kassan</h1>
          <section>
            <h2 className="checkout-section-heading">Leverans</h2>

            <label htmlFor="postalCode">Sök ombud efter postnummer</label>
            <input
              className="postal-code-input"
              id="postalCode"
              name="postalCode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(event) => {
                setPostalCode(event.target.value);
                setServicePoints([]);
                setSelectedServicePoint("");
              }}
              placeholder="Exempelvis 13230"
              required
            />

            <fieldset>
              <legend>Välj fraktsätt</legend>

              <label className="shipping-method-option">
                <input
                  className="shipping-method-radio"
                  type="radio"
                  name="shippingMethod"
                  value="pickup"
                  checked={shippingMethod === "pickup"}
                  onChange={() => setShippingMethod("pickup")}
                />
                <span>
                  Hämta hos PostNord-ombud{" "}
                  <p>
                    Frakt:{" "}
                    {subtotal > 500
                      ? "Gratis"
                      : `${convertPrice(59).toFixed(2)} ${currency}`}
                  </p>
                </span>
              </label>

              <label className="shipping-method-option">
                <input
                  className="shipping-method-radio"
                  type="radio"
                  name="shippingMethod"
                  value="home_delivery"
                  checked={shippingMethod === "home_delivery"}
                  onChange={() => setShippingMethod("home_delivery")}
                />

                <span>
                  Hemleverans{" "}
                  <p>
                    Frakt:{" "}
                    {subtotal > 500
                      ? "Gratis"
                      : `${convertPrice(99).toFixed(2)} ${currency}`}
                  </p>
                </span>
              </label>
            </fieldset>

            {shippingMethod === "pickup" && (
              <div>
                <button
                  className="fetch-points-button"
                  type="button"
                  onClick={fetchServicePoints}
                  disabled={loadingPoints || !/^\d{5}$/.test(postalCode.trim())}
                >
                  {loadingPoints ? "Hämtar ombud..." : "Sök PostNord-ombud"}
                </button>

                {servicePoints.length > 0 && (
                  <fieldset>
                    <legend>Välj ombud</legend>

                    {servicePoints.map((point) => (
                      <label key={point.id} className="service-point-option">
                        <input
                          className="service-point-radio"
                          type="radio"
                          name="servicePoint"
                          value={point.id}
                          checked={selectedServicePoint === point.id}
                          onChange={() => setSelectedServicePoint(point.id)}
                        />
                        <div className="service-point-info">
                          <strong>{point.name}</strong>
                          <br />
                          {point.address}
                        </div>
                      </label>
                    ))}
                  </fieldset>
                )}

                {servicePoints.length === 0 && !loadingPoints && (
                  <p>Sök efter ombud med ditt postnummer.</p>
                )}
              </div>
            )}
          </section>

          <section>
            <h2>Din beställning</h2>

            {cart.map((item) => (
              <div key={item.product.id}>
                <span>{item.product.name}</span>
                {"  "}
                <span> x {item.quantity} st</span>
              </div>
            ))}
          </section>

          <div className="checkout-totals">
            <p>
              Delsumma: {convertPrice(subtotal).toFixed(2)} {currency}
            </p>

            <p>
              Frakt:{" "}
              {shippingCost === 0
                ? "Gratis"
                : `${convertPrice(shippingCost).toFixed(2)} ${currency}`}
            </p>

            <p>
              <strong>
                Totalt: {convertPrice(subtotal + shippingCost).toFixed(2)}{" "}
                {currency}
              </strong>
            </p>
          </div>

          {error && <p role="alert">{error}</p>}

          <button
            className="checkout-button"
            type="submit"
            disabled={
              isCheckingOut ||
              (shippingMethod === "pickup" && !selectedServicePoint)
            }
          >
            {isCheckingOut ? "Skickar vidare..." : "Fortsätt till betalning"}
          </button>
        </form>

        <Cart
          className="checkout-cart"
          cart={cart}
          setCart={setCart}
          getProductName={getProductName}
          decreaseQuantity={decreaseQuantity}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          auth={auth}
          cartTotalPrice={cartTotalPrice}
        />
      </main>
    </>
  );
}

export default CheckoutPage;
