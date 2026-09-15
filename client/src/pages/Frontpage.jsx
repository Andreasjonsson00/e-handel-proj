import { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import "./Frontpage.css";
import ProductCard from "../components/ProductCard";
import Cart from "../components/Cart";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getProductName(product) {
  return product.name ?? "Namnlös produkt";
}

function Frontpage({ auth, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
            <h2>Produkter</h2>

            <p>Välj produkter och lägg dem i varukorgen.</p>
          </div>

          {isLoading && <p>Hämtar produkter...</p>}

          {error && <p>{error}</p>}

          {!isLoading && !error && products.length === 0 && (
            <p>Det finns inga produkter i databasen ännu.</p>
          )}

          <div className="product-container">
            <ProductCard
              products={products}
              addToCart={addToCart}
              getProductName={getProductName}
            />
          </div>
        </section>
        <Cart
          cart={cart}
          setCart={setCart}
          getProductName={getProductName}
          decreaseQuantity={decreaseQuantity}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          auth={auth}
        />
      </main>
    </>
  );
}

export default Frontpage;
