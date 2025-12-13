// src/paginas/PaginaAlimentadores/PaginaAlimentadoresSupabase.jsx
// Versión de la página que usa Supabase para persistencia

import React from "react";

import { ProveedorConfiguracion } from "./contexto/ContextoConfiguracion";
import { ProveedorAlimentadoresSupabase } from "./contexto/ContextoAlimentadoresSupabase";

import VistaAlimentadores from "./componentes/layout/VistaAlimentadores.jsx";

/**
 * Página de alimentadores conectada a Supabase.
 *
 * Estructura de providers:
 * - ProveedorConfiguracion: maneja los workspaces del usuario
 * - ProveedorAlimentadoresSupabase: maneja puestos y alimentadores con Supabase
 */
const PaginaAlimentadoresSupabase = () => {
  return (
    <ProveedorConfiguracion>
      <ProveedorAlimentadoresSupabase>
        <VistaAlimentadores />
      </ProveedorAlimentadoresSupabase>
    </ProveedorConfiguracion>
  );
};

export default PaginaAlimentadoresSupabase;
