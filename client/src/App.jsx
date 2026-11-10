import { Navigate, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import Frontpage from "./pages/Frontpage";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import AdminProducts from "./pages/AdminProducts";
import ReturnPage from "./pages/ReturnPage";
import CheckoutPage from "./pages/CheckoutPage";
import { useCustomer } from "./context/CustomerProvider";

function App() {
  const { customer, isLoadingCustomer, logout } = useCustomer();
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

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

  const cartTotalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotalPrice = cart.reduce(
    (sum, item) => sum + getNumericPrice(item.product) * item.quantity,
    0,
  );

  function getNumericPrice(product) {
    const price = Number(product.price);
    return Number.isFinite(price) ? price : 0;
  }

  function getProductName(product) {
    return product.name ?? "Namnlös produkt";
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Frontpage
            customer={customer}
            onLogout={logout}
            cart={cart}
            setCart={setCart}
            addToCart={addToCart}
            decreaseQuantity={decreaseQuantity}
            removeFromCart={removeFromCart}
            cartTotalQuantity={cartTotalQuantity}
            cartTotalPrice={cartTotalPrice}
            getProductName={getProductName}
          />
        }
      />
      <Route
        path="/login"
        element={
          isLoadingCustomer ? null : customer ? <Navigate to="/" replace /> : <Login />
        }
      />
      <Route
        path="/orders"
        element={<Orders customer={customer} onLogout={logout} />}
      />
      <Route
        path="/admin/products"
        element={<AdminProducts customer={customer} onLogout={logout} />}
      />
      <Route
        path="/return"
        element={<ReturnPage customer={customer} onLogout={logout} />}
      />
      <Route
        path="/checkout"
        element={
          <CheckoutPage
            customer={customer}
            onLogout={logout}
            cart={cart}
            setCart={setCart}
            addToCart={addToCart}
            decreaseQuantity={decreaseQuantity}
            removeFromCart={removeFromCart}
            cartTotalQuantity={cartTotalQuantity}
            cartTotalPrice={cartTotalPrice}
            getProductName={getProductName}
          />
        }
      />
    </Routes>
  );
}

export default App;
