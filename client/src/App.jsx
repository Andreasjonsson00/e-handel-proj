import { useEffect, useState } from "react";
import axios from "axios";

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

function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
    <main className="container">
      <section className="storefront">
        <div className="page-heading">
          <p>Min e-handel</p>

          <h1>Produkter</h1>

          <p>Välj produkter och lägg dem i varukorgen.</p>
        </div>

        {isLoading && <p>Hämtar produkter...</p>}

        {error && <p >{error}</p>}

        {!isLoading && !error && products.length === 0 && (
          <p>
            Det finns inga produkter i databasen ännu.
          </p>
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

                <button type="button">Lägg i varukorg</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
