import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import Header from "../components/Header";
import "./AdminProducts.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  image_url: "",
};

function AdminProducts({ auth, onLogout }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isEditing = editingProductId !== null;

  function updateField(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function startEditing(product) {
    setEditingProductId(product.id);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: product.price ?? "",
      image_url: product.image_url ?? "",
    });
    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditingProductId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...form,
      price: Number(form.price),
    };

    try {
      setIsSaving(true);

      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      };

      if (isEditing) {
        const response = await axios.put(
          `${API_URL}/products/${editingProductId}`,
          payload,
          config,
        );

        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === editingProductId ? response.data : product,
          ),
        );
        setMessage("Produkten har uppdaterats.");
      } else {
        const response = await axios.post(`${API_URL}/products`, payload, config);
        setProducts((currentProducts) => [...currentProducts, response.data]);
        setMessage("Produkten har lagts till.");
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message ?? "Kunde inte spara produkten.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError("");

        const response = await axios.get(`${API_URL}/products`);
        setProducts(response.data);
      } catch (err) {
        console.error(err);
        setError("Kunde inte hämta produkter.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (!auth || auth.user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header auth={auth} onLogout={onLogout} />
      <main className="admin-products-page">
        <div className="page-heading">
          <h1>Produkter</h1>
          <p>Lägg till nya produkter och uppdatera befintliga.</p>
        </div>

        <section className="admin-products-layout">
          <form className="product-form" onSubmit={handleSubmit}>
            <h2>{isEditing ? "Redigera produkt" : "Ny produkt"}</h2>

            <label className="form-field">
              Namn
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                required
              />
            </label>

            <label className="form-field">
              Beskrivning
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows="4"
                required
              />
            </label>

            <label className="form-field">
              Pris
              <input
                name="price"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={updateField}
                required
              />
            </label>

            <label className="form-field">
              Bildlänk
              <input
                name="image_url"
                type="url"
                value={form.image_url}
                onChange={updateField}
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <div className="form-actions">
              <button type="submit" disabled={isSaving}>
                {isSaving ? "Sparar..." : isEditing ? "Spara ändringar" : "Lägg till"}
              </button>

              {isEditing && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={resetForm}
                >
                  Avbryt
                </button>
              )}
            </div>
          </form>

          <section className="admin-products-list" aria-label="Produktlista">
            {isLoading ? (
              <p>Hämtar produkter...</p>
            ) : products.length === 0 ? (
              <p>Det finns inga produkter ännu.</p>
            ) : (
              products.map((product) => (
                <article className="admin-product-row" key={product.id}>
                  <img src={product.image_url} alt={product.name} />

                  <div>
                    <h2>{product.name}</h2>
                    <p>{product.description}</p>
                    <strong>{product.price}:-</strong>
                  </div>

                  <button type="button" onClick={() => startEditing(product)}>
                    Redigera
                  </button>
                </article>
              ))
            )}
          </section>
        </section>
      </main>
    </>
  );
}

export default AdminProducts;
