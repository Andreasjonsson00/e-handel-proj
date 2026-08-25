import { Link } from "react-router-dom";
import "./Header.css";

const Header = ({ auth, onLogout }) => {
  return (
    <>
      <header className="site-header">
        <Link to="/">
          <h1>Min e-handel</h1>
        </Link>

        {auth && <strong>{auth.user.role}</strong>}

        <nav>
          {auth?.user.role === "admin" && (
            <>
              <Link to="/admin/products">
                <button type="button">Produkter</button>
              </Link>

              <Link to="/orders">
                <button type="button">Ordrar</button>
              </Link>
            </>
          )}

          {auth ? (
            <button type="button" onClick={onLogout}>
              Logga ut
            </button>
          ) : (
            <Link to="/login">Logga in</Link>
          )}
        </nav>
      </header>
    </>
  );
};

export default Header;
