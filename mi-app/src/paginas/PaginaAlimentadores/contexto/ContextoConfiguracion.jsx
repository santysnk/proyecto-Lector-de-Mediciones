// src/paginas/PaginaAlimentadores/contexto/ContextoConfiguracion.jsx
// Contexto global para manejar el workspace activo del usuario

import React, { createContext, useContext } from "react";
import { useConfiguracion } from "../hooks/useConfiguracion";

const ContextoConfiguracion = createContext(null);

/**
 * Provider que maneja los workspaces del usuario.
 * Debe envolver a ProveedorAlimentadores para que este tenga acceso
 * al workspace seleccionado.
 */
export const ProveedorConfiguracion = ({ children }) => {
  const configuracionHook = useConfiguracion();

  return (
    <ContextoConfiguracion.Provider value={configuracionHook}>
      {children}
    </ContextoConfiguracion.Provider>
  );
};

/**
 * Hook para acceder al contexto de workspace
 */
export const usarContextoConfiguracion = () => {
  const contexto = useContext(ContextoConfiguracion);

  if (!contexto) {
    throw new Error(
      "usarContextoConfiguracion debe usarse dentro de ProveedorConfiguracion"
    );
  }

  return contexto;
};
