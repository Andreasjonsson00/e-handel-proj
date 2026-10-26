import { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import "./Frontpage.css";
import ProductList from "../components/ProductList";
import Cart from "../components/Cart";
import SearchBar from "../components/SearchBar";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getProductName(product) {
  return product.name ?? "Namnlös produkt";
}

function Frontpage({ auth, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLoader, setShowLoader] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch() {
    setPage(1);
    setSearchQuery(searchInput.trim());
  }

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
    const timer = setTimeout(() => {
      setShowLoader(true);
    }, 500);

    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const endpoint = searchQuery
          ? `${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}&pageSize=9`
          : `${API_URL}/api/products?page=${page}&pageSize=9`;

        const response = await axios.get(endpoint);

        setProducts(response.data);

        setTotalPages(response.data.meta.totalPages);
      } catch (err) {
        console.error(err);

        setError(
          "Kunde inte hämta produkter. Kontrollera att servern är igång.",
        );
      } finally {
        setIsLoading(false);
        clearTimeout(timer);
      }
    }

    fetchProducts();
    return () => clearTimeout(timer);
  }, [page, searchQuery]);

  return (
    <>
      <Header auth={auth} onLogout={onLogout} />
      <main className="container">
        <section className="storefront">
          <div className="page-heading">
            <h1>Produkter</h1>

            <p>Välj produkter och lägg dem i varukorgen.</p>
          </div>

          <SearchBar
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            onSearch={handleSearch}
          />
          {error && <p>{error}</p>}

          {!isLoading && !error && products.length === 0 && (
            <p>Det finns inga produkter i databasen ännu.</p>
          )}

          <div className="product-container">
            {isLoading ? (
              showLoader && (
                <div className="loader-container">
                  <div className="loader"></div>
                </div>
              )
            ) : error ? (
              <p>{error}</p>
            ) : products.length === 0 ? (
              <p>Det finns inga produkter i databasen ännu.</p>
            ) : (
              <ProductList
                products={products}
                addToCart={addToCart}
                getProductName={getProductName}
              />
            )}
          </div>
          {!isLoading && !error && totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((currentPage) => currentPage - 1)}
                disabled={page === 1}
              >
                Föregående
              </button>

              <span>
                Sida {page} av {totalPages}
              </span>

              <button
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={page >= totalPages}
              >
                Nästa
              </button>
            </div>
          )}
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
