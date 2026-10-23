import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "../components/Header";
import "./ReturnPage.css";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const ReturnPage = ({ auth, onLogout }) => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState("checking");
  const [orderInfo, setOrderInfo] = useState(null);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const checkPayment = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to check payment status: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        setOrderInfo({
          id: data.id,
          status: data.status,
          totalPrice: data.total_price,
        });

        setProducts(data.products ?? []);

        if (data.status === "paid") {
          setStatus("success");
        } else if (data.status === "pending") {
          setStatus("pending");
        } else {
          setStatus("unconfirmed");
        }
      } catch (error) {
        setError(error.message);
        setStatus("unconfirmed");
      }
    };

    checkPayment();
  }, [sessionId, auth?.token]);

  if (!sessionId) {
    return (
      <main>
        <h1>Kunde inte bekräfta betalningen</h1>

        <p>Det saknas ett sessions-ID för betalningen.</p>

        <Link to="/">Tillbaka till butiken</Link>
      </main>
    );
  }

  if (status === "checking") {
    return (
      <main>
        <p>Kontrollerar din betalning...</p>
      </main>
    );
  }

  if (status === "pending") {
    return (
      <main>
        <h1>Betalningen behandlas</h1>
        <p>Vi väntar på bekräftelse från betalningsleverantören.</p>
        <Link to="/">Tillbaka till butiken</Link>
      </main>
    );
  }

  if (status === "unconfirmed") {
    return (
      <main>
        <h1>Kunde inte bekräfta betalningen</h1>

        <p>
          {error ??
            "Vi kunde inte kontrollera betalningens status. Kontrollera dina ordrar innan du försöker betala igen."}
        </p>

        <Link to="/">Tillbaka till butiken</Link>
      </main>
    );
  }

  return (
    <>
      <Header auth={auth} onLogout={onLogout} />
      <main className="return-page-container">
        <h1>Tack för din beställning!</h1>
        <p>Din betalning är bekräftad.</p>
        {orderInfo && <p>Ordernummer: #{orderInfo.id}</p>}
        {orderInfo && <p>Summa: {orderInfo.totalPrice}:-</p>}
        {orderInfo && <p>Status: {orderInfo.status}</p>}
        {products.length > 0 && (
          <div className="product-list">
            <h2>Produkter i din beställning:</h2>
            <ul>
              {products.map((product) => (
                <li key={product.id}>
                  {product.name} - {product.quantity} st
                  {product.price && <span> ({product.price}:-)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <Link to="/" className="return-link">
          Tillbaka till butiken
        </Link>
      </main>
    </>
  );
};

export default ReturnPage;
