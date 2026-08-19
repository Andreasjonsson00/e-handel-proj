import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function Login({ onLogin }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await axios.post(`${API_URL}/login`, form);
      onLogin(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message ?? "Kunde inte logga in.");
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-heading">
          <p>Min e-handel</p>
          <h1>Logga in</h1>
          <p>Demo: user/user123 eller admin/admin123.</p>
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

        <button className="login-button" type="submit">
          Logga in
        </button>
      </form>
    </main>
  );
}

export default Login;
