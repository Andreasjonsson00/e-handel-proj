import Header from "../components/Header";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const Orders = ({ auth, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!auth) {
        setError("Du måste vara inloggad för att se ordrar.");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/orders`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        setOrders(response.data);
      } catch (err) {
        console.error(err);
        setError("Kunde inte hämta ordrar. Logga in igen och försök på nytt.");
      }
      finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [auth]);
  return (
    <>
      <Header auth={auth} onLogout={onLogout} />
      <main className="orders-page">
        <div className="page-heading">
          <h1>Ordrar</h1>
          <p>Här visas skapade ordrar och produkterna i varje order.</p>
        </div>

        {error ? (
          <p>{error}</p>
        ) : isLoading ? (
          <p>Laddar ordrar...</p>
        ) : orders.length === 0 ? (
          <p>Inga ordrar hittades.</p>
        ) : (
          <ul className="orders-list">
            {orders.map((order) => (
              <li className="order-card" key={order.id}>
                <div className="order-header">
                  <h2>Order {order.id}</h2>
                  <strong>{order.total_price}:-</strong>
                </div>

                <h3>Produkter</h3>
                <ul className="order-items">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span>{item.product_name}</span>
                      <span>{item.quantity} st</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
};

export default Orders;
