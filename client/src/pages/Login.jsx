import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_URL } from "../api";
import { useCustomer } from "../context/CustomerProvider";
import "./Login.css";
import Header from "../components/Header";

// Servern skickar tillbaka användaren hit med ?error=… när inloggningen misslyckas
const ERRORS = {
  cancelled: "Du avbröt inloggningen hos Google.",
  state: "Inloggningen kunde inte verifieras. Försök igen.",
  "not-verified": "Din e-postadress är inte verifierad av Google.",
  google: "Google svarar inte. Försök igen senare.",
};

function Login() {
  const { customer, isLoadingCustomer, refreshCustomer } = useCustomer();
  const navigate = useNavigate();
  const urlError = new URLSearchParams(window.location.search).get("error");

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await api.post("/api/auth/login", form);

      await refreshCustomer();
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message ?? "Kunde inte logga in.");
    }
  }

  if (isLoadingCustomer) return <main>Laddar…</main>;

  return (
    <>
    <Header />
    <main className="login-page">
      {!customer && (
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-heading">
            <p>Min e-handel</p>
            <h1>Logga in</h1>
            <p>Demo: user/user123</p>
          </div>

          <label className="form-field">
            Användarnamn
            <input
              name="username"
              value={form.username}
              onChange={updateField}
              autoComplete="username"
              required
            />
          </label>

          <label className="form-field">
            Lösenord
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {urlError && <p className="form-error">{ERRORS[urlError] ?? "Något gick fel."}</p>}

          <button className="login-button" type="submit">
            Logga in
          </button>

          <a
            className="login-button google-login-button"
            href={`${API_URL}/api/auth/google`}
          >
            Logga in med Google
          </a>
        </form>
      )}
    </main>
    </>
  );
}

export default Login;
