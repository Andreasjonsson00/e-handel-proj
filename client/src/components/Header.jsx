import { Link } from "react-router-dom";

const Header = ({ auth, onLogout }) => {
  return (
    <>
      <header className="site-header">
        {" "}
        <h1>Min e-handel</h1> {auth && <strong>{auth.user.role}</strong>}{" "}
        <nav>
          {" "}
          {auth?.user.role === "admin" && (
            <Link to="/orders">
              <button type="button">Ordrar</button>
            </Link>
          )}{" "}
          {auth ? (
            <button type="button" onClick={onLogout}>
              {" "}
              Logga ut{" "}
            </button>
          ) : (
            <Link to="/login">Logga in</Link>
          )}{" "}
        </nav>{" "}
      </header>
    </>
  );
};

export default Header;
