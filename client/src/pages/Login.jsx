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
  "not-admin": "Det här GitHub-kontot saknar administratörsbehörighet.",
  google: "Google svarar inte. Försök igen senare.",
  github: "GitHub svarar inte. Försök igen senare.",
};

function Login() {
  const { customer, isLoadingCustomer, refreshCustomer } = useCustomer();
  const navigate = useNavigate();
  const urlError = new URLSearchParams(window.location.search).get("error");

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await api.post(isRegistering ? "/api/auth/register" : "/api/auth/login", form);

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
            <h1>{isRegistering ? "Skapa konto" : "Logga in"}</h1>
            <p>{isRegistering ? "Välj ett lösenord med minst 8 tecken." : "Logga in på ditt konto."}</p>
          </div>

          <label className="form-field">
            Användarnamn
            <input
              name="username"
              value={form.username}
              onChange={updateField}
              autoComplete="username"
              minLength="3"
              maxLength="50"
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
              autoComplete={isRegistering ? "new-password" : "current-password"}
              minLength="8"
              maxLength="72"
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {urlError && <p className="form-error">{ERRORS[urlError] ?? "Något gick fel."}</p>}

          <button className="login-button" type="submit">
            {isRegistering ? "Skapa konto" : "Logga in"}
          </button>

          <button
            className="form-switch-button"
            type="button"
            onClick={() => {
              setIsRegistering((value) => !value);
              setError("");
            }}
          >
            {isRegistering ? "Har du redan ett konto? Logga in" : "Saknar du konto? Skapa ett"}
          </button>

          {!isRegistering && (
            <>
              <a className="login-button google-login-button" href={`${API_URL}/api/auth/google`}>
                Logga in med Google
              </a>
              <a className="login-button github-login-button" href={`${API_URL}/api/auth/github`}>
                Logga in med GitHub
              </a>
            </>
          )}
        </form>
      )}
    </main>
    </>
  );
}

export default Login;
