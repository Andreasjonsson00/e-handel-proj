import Header from "../components/Header";
import { useState, useEffect } from "react";
import api from "../api";
import "./Orders.css";

const Orders = ({ customer, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(true);
    }, 500);

    async function fetchOrders() {
      if (!customer) {
        setError("Du måste vara inloggad för att se ordrar.");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get("/api/orders");
        setOrders(response.data);
      } catch (err) {
        console.error(err);
        setError("Kunde inte hämta ordrar. Logga in igen och försök på nytt.");
      } finally {
        setIsLoading(false);
        clearTimeout(timer);
      }
    }

    fetchOrders();
    return () => clearTimeout(timer);
  }, [customer]);
  return (
    <>
      <Header customer={customer} onLogout={onLogout} />
      <main className="orders-page">
        <div className="page-heading">
          <h1>Ordrar</h1>
          <p>Här visas skapade ordrar och produkterna i varje order.</p>
        </div>

        {isLoading ? (
          showLoader && (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          )
        ) : error ? (
          <p>{error}</p>
        ) : orders.length === 0 ? (
          <p>Inga ordrar hittades.</p>
        ) : (
          <ul className="orders-list">
            {orders.map((order) => (
              <li className="order-card" key={order.id}>
                <div className="order-header">
                  <h2>Order {order.id}</h2>
                  <h3>{new Date(order.created_at).toLocaleString()}</h3>
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
