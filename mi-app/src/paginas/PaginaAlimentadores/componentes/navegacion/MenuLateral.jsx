// src/paginas/PaginaAlimentadores/componentes/navegacion/MenuLateral.jsx
// Menú lateral (drawer) para modo compacto

import React from "react";
import "./MenuLateral.css";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import { usarContextoAlimentadores } from "../../contexto/ContextoAlimentadoresSupabase";
import { ESCALA_MIN, ESCALA_MAX } from "../../constantes/escalas";

import {
   SeccionWorkspace,
   SeccionPuestos,
   SeccionEscala,
   SeccionAcciones,
} from "./componentes";

/**
 * Menú lateral (drawer) para modo compacto.
 * Muestra puestos, workspaces y acciones en un panel deslizante.
 */
const MenuLateral = ({
   abierto,
   onCerrar,
   puestos,
   puestoSeleccionado,
   onSeleccionarPuesto,
   onAbrirModalNuevoPuesto,
   onAbrirModalEditarPuestos,
   onAbrirModalConfigurarAgente,
   onAbrirModalGestionarAccesos,
   onAbrirModalPanelPermisos,
   onSalir,
   coloresSistema,
   escalaGlobal,
   onEscalaGlobalChange,
}) => {
   const {
      configuraciones,
      configuracionSeleccionada,
      seleccionarConfiguracion,
      agregarConfiguracion,
      puedeCrearWorkspaces,
      rolGlobal,
      perfil,
      workspaceDefaultId,
      toggleWorkspaceDefault,
   } = usarContextoConfiguracion();

   const { obtenerColorPuesto } = usarContextoAlimentadores();

   // Handler para seleccionar puesto y cerrar menú
   const handleSeleccionarPuesto = (id) => {
      onSeleccionarPuesto(id);
      onCerrar();
   };

   // Handler genérico para acciones (cierra menú y ejecuta)
   const handleAccion = (accion) => {
      if (!accion) return;
      onCerrar();
      accion();
   };

   return (
      <div
         className={"alim-drawer-overlay" + (abierto ? " alim-drawer-open" : "")}
         onClick={onCerrar}
      >
         <aside className="alim-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <header className="alim-drawer-header">
               <h2 className="alim-drawer-title">Panel de Alimentadores</h2>
               {puestoSeleccionado && (
                  <p className="alim-drawer-subtitle">
                     Puesto actual: <strong>{puestoSeleccionado.nombre}</strong>
                  </p>
               )}
            </header>

            {/* Info del usuario */}
            {perfil && (
               <div className="alim-drawer-usuario">
                  <span className="alim-drawer-usuario-nombre">
                     {perfil.nombre || perfil.email}
                  </span>
                  <span className="alim-drawer-usuario-rol">
                     {perfil.roles?.nombre || rolGlobal}
                  </span>
               </div>
            )}

            {/* Sección Workspace */}
            <SeccionWorkspace
               configuraciones={configuraciones}
               configuracionSeleccionada={configuracionSeleccionada}
               onSeleccionarWorkspace={seleccionarConfiguracion}
               puedeCrearWorkspaces={puedeCrearWorkspaces}
               onCrearWorkspace={agregarConfiguracion}
               workspaceDefaultId={workspaceDefaultId}
               onToggleDefault={toggleWorkspaceDefault}
            />

            {/* Sección Puestos */}
            <SeccionPuestos
               puestos={puestos}
               puestoSeleccionado={puestoSeleccionado}
               onSeleccionarPuesto={handleSeleccionarPuesto}
               obtenerColorPuesto={obtenerColorPuesto}
               coloresSistema={coloresSistema}
            />

            {/* Sección Escala Global */}
            <SeccionEscala
               escalaGlobal={escalaGlobal}
               onEscalaChange={onEscalaGlobalChange}
               ESCALA_MIN={ESCALA_MIN}
               ESCALA_MAX={ESCALA_MAX}
            />

            {/* Sección Acciones */}
            <SeccionAcciones
               configuracionSeleccionada={configuracionSeleccionada}
               rolGlobal={rolGlobal}
               puestosLength={puestos.length}
               onAccion={handleAccion}
               onAbrirGestionarAccesos={onAbrirModalGestionarAccesos}
               onAbrirNuevoPuesto={onAbrirModalNuevoPuesto}
               onAbrirEditarPuestos={onAbrirModalEditarPuestos}
               onAbrirConfigurarAgente={onAbrirModalConfigurarAgente}
               onAbrirPanelPermisos={onAbrirModalPanelPermisos}
               onSalir={onSalir}
            />
         </aside>
      </div>
   );
};

export default MenuLateral;
