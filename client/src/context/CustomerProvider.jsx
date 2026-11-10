import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api";

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  const refreshCustomer = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      setCustomer(data.customer);
      return data.customer;
    } catch (error) {
      if (error.response?.status !== 401) console.error(error);
      setCustomer(null);
      return null;
    } finally {
      setIsLoadingCustomer(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refreshCustomer);
  }, [refreshCustomer]);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setCustomer(null);
    }
  }, []);

  return (
    <CustomerContext.Provider
      value={{ customer, isLoadingCustomer, refreshCustomer, logout }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used within CustomerProvider");
  return context;
}
