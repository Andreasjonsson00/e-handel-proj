import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import Frontpage from "./pages/Frontpage";
import Login from "./pages/Login";
import Orders from "./pages/Orders";

function App() {
  const [auth, setAuth] = useState(() => {
    const savedAuth = localStorage.getItem("auth");
    return savedAuth ? JSON.parse(savedAuth) : null;
  });

  function handleLogin(nextAuth) {
    localStorage.setItem("auth", JSON.stringify(nextAuth));
    setAuth(nextAuth);
  }

  function handleLogout() {
    localStorage.removeItem("auth");
    setAuth(null);
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Frontpage auth={auth} onLogout={handleLogout} />}
      />
      <Route
        path="/login"
        element={
          auth ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
        }
      />
      <Route
        path="/orders"
        element={<Orders auth={auth} onLogout={handleLogout} />}
      />
    </Routes>
  );
}

export default App;
