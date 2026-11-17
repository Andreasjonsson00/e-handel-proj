import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { CurrencyProvider } from "./context/CurrencyProvider.jsx";
import { CustomerProvider } from "./context/CustomerProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CurrencyProvider>
      <CustomerProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CustomerProvider>
    </CurrencyProvider>
  </StrictMode>,
);
