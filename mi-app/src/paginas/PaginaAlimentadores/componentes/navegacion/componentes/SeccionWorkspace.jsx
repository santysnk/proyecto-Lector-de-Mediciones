// componentes/SeccionWorkspace.jsx
// Sección de workspaces del menú lateral

import React, { useState } from "react";

/**
 * Sección de selección de workspace
 * @param {Object} props
 * @param {Array} props.configuraciones - Lista de workspaces disponibles
 * @param {Object} props.configuracionSeleccionada - Workspace actualmente seleccionado
 * @param {Function} props.onSeleccionarWorkspace - Handler para seleccionar workspace
 * @param {boolean} props.puedeCrearWorkspaces - Si puede crear workspaces
 * @param {Function} props.onCrearWorkspace - Handler para crear workspace
 * @param {string} props.workspaceDefaultId - ID del workspace por defecto
 * @param {Function} props.onToggleDefault - Handler para toggle default
 */
const SeccionWorkspace = ({
   configuraciones,
   configuracionSeleccionada,
   onSeleccionarWorkspace,
   puedeCrearWorkspaces,
   onCrearWorkspace,
   workspaceDefaultId,
   onToggleDefault,
}) => {
   const [submenuAbierto, setSubmenuAbierto] = useState(false);
   const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
   const [nombreNuevo, setNombreNuevo] = useState("");
   const [creando, setCreando] = useState(false);

   const handleSeleccionar = (id) => {
      onSeleccionarWorkspace(id);
      setSubmenuAbierto(false);
   };

   const handleCrear = async (e) => {
      e.preventDefault();
      if (!nombreNuevo.trim()) return;

      try {
         setCreando(true);
         await onCrearWorkspace(nombreNuevo.trim());
         setNombreNuevo("");
         setMostrarFormNuevo(false);
      } catch (err) {
         console.error("Error creando workspace:", err);
      } finally {
         setCreando(false);
      }
   };

   const handleToggle = async (e, id) => {
      e.stopPropagation();
      try {
         await onToggleDefault(id);
      } catch (err) {
         console.error("Error cambiando workspace default:", err);
      }
   };

   return (
      <section className="alim-drawer-section">
         <h3 className="alim-drawer-section-title">Workspace</h3>

         {/* Botón trigger */}
         <button
            type="button"
            className="alim-drawer-workspace-trigger"
            onClick={() => setSubmenuAbierto(!submenuAbierto)}
         >
            <span
               className={`alim-drawer-workspace-flecha ${
                  submenuAbierto ? "alim-drawer-workspace-flecha--abierto" : ""
               }`}
            >
               ▶
            </span>
            <span>{configuracionSeleccionada?.nombre || "Sin workspace"}</span>
         </button>

         {/* Lista de workspaces */}
         {submenuAbierto && (
            <div className="alim-drawer-workspace-lista">
               {configuraciones.map((config) => (
                  <div key={config.id} className="alim-drawer-workspace-row">
                     <button
                        type="button"
                        className="alim-drawer-workspace-default-btn"
                        onClick={(e) => handleToggle(e, config.id)}
                        title={
                           config.id === workspaceDefaultId
                              ? "Quitar como default"
                              : "Establecer como default"
                        }
                     >
                        {config.id === workspaceDefaultId ? "★" : "☆"}
                     </button>
                     <button
                        type="button"
                        className={`alim-drawer-workspace-item ${
                           config.id === configuracionSeleccionada?.id
                              ? "alim-drawer-workspace-item--activo"
                              : ""
                        }`}
                        onClick={() => handleSeleccionar(config.id)}
                     >
                        {config.nombre}
                        {!config.esCreador && (
                           <em className="alim-drawer-workspace-invitado">(invitado)</em>
                        )}
                     </button>
                  </div>
               ))}
            </div>
         )}

         {/* Formulario nuevo workspace (en Acciones) */}
         {puedeCrearWorkspaces && (
            <div className="alim-drawer-nuevo-workspace">
               {mostrarFormNuevo ? (
                  <form className="alim-drawer-form-workspace" onSubmit={handleCrear}>
                     <input
                        type="text"
                        className="alim-drawer-input"
                        placeholder="Nombre del workspace"
                        value={nombreNuevo}
                        onChange={(e) => setNombreNuevo(e.target.value)}
                        autoFocus
                        disabled={creando}
                     />
                     <div className="alim-drawer-form-btns">
                        <button
                           type="button"
                           className="alim-drawer-btn-cancelar"
                           onClick={() => {
                              setMostrarFormNuevo(false);
                              setNombreNuevo("");
                           }}
                           disabled={creando}
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           className="alim-drawer-btn-crear"
                           disabled={!nombreNuevo.trim() || creando}
                        >
                           {creando ? "..." : "Crear"}
                        </button>
                     </div>
                  </form>
               ) : (
                  <button
                     type="button"
                     className="alim-drawer-btn-action alim-drawer-btn-nuevo-workspace"
                     onClick={() => setMostrarFormNuevo(true)}
                  >
                     <span className="alim-drawer-btn-icon">+</span>
                     Nuevo workspace
                  </button>
               )}
            </div>
         )}
      </section>
   );
};

export default SeccionWorkspace;
