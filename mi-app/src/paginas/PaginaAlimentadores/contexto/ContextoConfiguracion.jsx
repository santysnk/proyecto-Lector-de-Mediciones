// src/paginas/PaginaAlimentadores/contexto/ContextoConfiguracion.jsx
// Contexto global para manejar la configuración activa del usuario

import React, { createContext, useContext } from "react";
import { usarConfiguracion } from "../hooks/usarConfiguracion";

const ContextoConfiguracion = createContext(null);

/**
 * Provider que maneja las configuraciones del usuario.
 * Debe envolver a ProveedorAlimentadores para que este tenga acceso
 * a la configuración seleccionada.
 */
export const ProveedorConfiguracion = ({ children }) => {
  const configuracionHook = usarConfiguracion();

  return (
    <ContextoConfiguracion.Provider value={configuracionHook}>
      {children}
    </ContextoConfiguracion.Provider>
  );
};

/**
 * Hook para acceder al contexto de configuración
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
