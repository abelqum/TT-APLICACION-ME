"use client";

import { createContext, useContext } from "react";

const ContextoSesionDashboard = createContext(null);

export function ProveedorSesionDashboard({ valor, children }) {
  return (
    <ContextoSesionDashboard.Provider value={valor}>
      {children}
    </ContextoSesionDashboard.Provider>
  );
}

export function useSesionDashboard() {
  const contexto = useContext(ContextoSesionDashboard);

  if (contexto === null) {
    throw new Error("useSesionDashboard debe utilizarse dentro del dashboard.");
  }

  return contexto;
}
