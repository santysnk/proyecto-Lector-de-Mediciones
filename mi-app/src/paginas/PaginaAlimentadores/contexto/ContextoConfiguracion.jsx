// src/paginas/PaginaAlimentadores/contexto/ContextoConfiguracion.jsx
// Contexto global para manejar el workspace activo del usuario y estilos globales

import React, { createContext, useContext, useMemo } from "react";
import { useConfiguracion } from "../hooks/mediciones";
import { useEstilosGlobales } from "../hooks/preferencias";

const ContextoConfiguracion = createContext(null);

/**
 * Provider que maneja los workspaces del usuario y los estilos globales de tarjetas.
 * Debe envolver a ProveedorAlimentadores para que este tenga acceso
 * al workspace seleccionado.
 */
export const ProveedorConfiguracion = ({ children }) => {
  const configuracionHook = useConfiguracion();
  const estilosGlobalesHook = useEstilosGlobales();

  // Combinar ambos hooks en un solo valor de contexto
  const valorContexto = useMemo(() => ({
    ...configuracionHook,
    // Estilos globales de tarjetas
    estilosGlobales: estilosGlobalesHook.estilos,
    guardarEstilosGlobales: estilosGlobalesHook.aplicarTodosEstilos,
    obtenerEstilosCSS: estilosGlobalesHook.obtenerEstilosCSS,
  }), [configuracionHook, estilosGlobalesHook]);

  return (
    <ContextoConfiguracion.Provider value={valorContexto}>
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
