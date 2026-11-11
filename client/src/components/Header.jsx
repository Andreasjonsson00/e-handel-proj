import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import { useCurrency } from "../context/CurrencyProvider";
import { useState } from "react";

const Header = ({ customer, onLogout }) => {
  const { currency, setCurrency } = useCurrency();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);

  const navigate = useNavigate();

  return (
    <>
      <header className="site-header">
        <Link to="/">
          <h1>Min e-handel</h1>
        </Link>

        <nav>
          <div className="currency-dropdown">
            <button
              type="button"
              className="currency-dropdown-toggle"
              aria-label="Välj valuta"
              aria-expanded={isCurrencyMenuOpen}
              onClick={() => setIsCurrencyMenuOpen((open) => !open)}
            >
              {currency} ▾
            </button>

            {isCurrencyMenuOpen && (
              <div className="currency-dropdown-menu">
                {["SEK", "EUR", "USD", "GBP"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={currency === option ? "selected" : ""}
                    onClick={() => {
                      setCurrency(option);

                      setIsCurrencyMenuOpen(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          {customer?.role === "admin" && (
            <div className="admin-dropdown">
              <button
                type="button"
                className="admin-dropdown-toggle"
                aria-expanded={isAdminMenuOpen}
                onClick={() => setIsAdminMenuOpen((open) => !open)}
              >
                Admin ▾
              </button>

              {isAdminMenuOpen && (
                <div className="admin-dropdown-menu">
                  <Link to="/orders" onClick={() => setIsAdminMenuOpen(false)}>
                    Alla ordrar
                  </Link>

                  <Link
                    to="/admin/products"
                    onClick={() => setIsAdminMenuOpen(false)}
                  >
                    Produkter
                  </Link>
                </div>
              )}
            </div>
          )}

          {customer && customer.role !== "admin" && (
            <button>
              <Link to="/orders">Mina ordrar</Link>
            </button>
          )}

          {customer ? (
            <button type="button" onClick={onLogout}>
              Logga ut
            </button>
          ) : (
            <button type="button" onClick={() => navigate("/login")}>
              Logga in
            </button>
          )}
        </nav>
      </header>
    </>
  );
};

export default Header;
