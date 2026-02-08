// componentes/navegacion/ComponentesSelectorConfig.jsx
// Sub-componentes extraídos de SelectorConfiguracion.jsx

import React from "react";

const NOMBRES_ROL = { superadmin: "SuperAdmin", admin: "Admin", operador: "Operador", observador: "Observador" };

export const HeaderUsuario = ({ perfil, rolGlobal, configuracionSeleccionada }) => {
   if (!perfil) return null;
   const rolEnWs = configuracionSeleccionada?.rol;
   const esCreador = configuracionSeleccionada?.esCreador;

   return (
      <div className="selector-config__usuario-header">
         <div className="selector-config__usuario-linea">
            <span className="selector-config__usuario-nombre">{perfil.nombre || perfil.email}</span>
            <span className="selector-config__rol-global">
               [ <svg className="selector-config__rol-icono" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
               </svg>
               {NOMBRES_ROL[rolGlobal] || "Observador"} ]
            </span>
         </div>
         {esCreador === false && rolEnWs && (
            <span className="selector-config__rol-workspace">
               Rol en Workspace: {NOMBRES_ROL[rolEnWs] || "Observador"}
            </span>
         )}
      </div>
   );
};

export const HeaderUsuarioSimple = ({ perfil, rolGlobal }) => {
   if (!perfil) return null;
   return (
      <div className="selector-config__usuario-header">
         <span className="selector-config__usuario-nombre">{perfil.nombre || perfil.email}</span>
         <span className="selector-config__usuario-rol">{perfil.roles?.nombre || rolGlobal}</span>
      </div>
   );
};

export const SubmenuWorkspaces = ({
   submenuRef, submenuAbierto, onMouseEnter, onMouseLeave, onClick,
   configuraciones, configuracionSeleccionada, workspaceDefaultId,
   onSeleccionar, onToggleDefault,
}) => (
   <div className="selector-config__submenu-container" ref={submenuRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button type="button" className={`selector-config__submenu-trigger ${submenuAbierto ? "selector-config__submenu-trigger--activo" : ""}`} onClick={onClick}>
         <span className={`selector-config__submenu-flecha ${submenuAbierto ? "selector-config__submenu-flecha--abierto" : ""}`}>▼</span>
         <span>Workspace</span>
      </button>
      {submenuAbierto && (
         <div className="selector-config__submenu" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {configuraciones.length > 0 ? (
               <ul className="selector-config__lista">
                  {configuraciones.map((config) => (
                     <li key={config.id} className={`selector-config__item ${config.id === configuracionSeleccionada?.id ? "selector-config__item--activo" : ""}`}>
                        <button type="button" className="selector-config__default-btn" onClick={(e) => onToggleDefault(e, config.id)} title={config.id === workspaceDefaultId ? "Quitar como default" : "Establecer como default"}>
                           {config.id === workspaceDefaultId ? "★" : "☆"}
                        </button>
                        <button type="button" className="selector-config__item-btn" onClick={() => onSeleccionar(config.id)} role="option" aria-selected={config.id === configuracionSeleccionada?.id}>
                           <span className="selector-config__item-nombre">
                              {config.nombre}
                              {!config.esCreador && <em className="selector-config__item-invitado">(invitado)</em>}
                           </span>
                           {!config.esCreador && (
                              <span className="selector-config__item-rol"><em>rol: {config.rol || "observador"}</em></span>
                           )}
                        </button>
                     </li>
                  ))}
               </ul>
            ) : (
               <div className="selector-config__vacio">No hay workspaces</div>
            )}
         </div>
      )}
   </div>
);

export const FormNuevoWorkspace = ({ nombreNueva, setNombreNueva, creando, onSubmit, onCancelar }) => (
   <form className="selector-config__form" onSubmit={onSubmit}>
      <input type="text" className="selector-config__input" placeholder="Nombre del workspace" value={nombreNueva} onChange={(e) => setNombreNueva(e.target.value)} autoFocus disabled={creando} />
      <div className="selector-config__form-btns">
         <button type="button" className="selector-config__btn-cancelar" onClick={onCancelar} disabled={creando}>Cancelar</button>
         <button type="submit" className="selector-config__btn-crear" disabled={!nombreNueva.trim() || creando}>{creando ? "Creando..." : "Crear"}</button>
      </div>
   </form>
);

export const OpcionesMenu = ({
   configuracionSeleccionada, configuraciones, rolGlobal, puedeCrearWorkspaces, puestosLength,
   onCerrarMenu, onAbrirModalGestionarAccesos, onAbrirModalNuevoPuesto, onAbrirModalEditarPuestos,
   onAbrirModalConfigurarAgente, onAbrirModalPanelPermisos, onEliminarActivo, onMostrarForm,
}) => {
   const rolEnWorkspace = configuracionSeleccionada?.rol;
   const esCreador = configuracionSeleccionada?.esCreador;
   const puedeCrearPuesto = esCreador || rolEnWorkspace === "admin";
   const esOperadorEnWorkspace = puedeCrearPuesto || rolEnWorkspace === "operador";

   return (
      <>
         {esCreador && (
            <button type="button" className="selector-config__opcion-secundaria" onClick={() => { onCerrarMenu(); onAbrirModalGestionarAccesos?.(); }}>
               <svg className="selector-config__opcion-icono-svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
               </svg>
               Gestionar Accesos
            </button>
         )}
         {puedeCrearPuesto && (
            <button type="button" className="selector-config__opcion-secundaria" onClick={() => { onCerrarMenu(); onAbrirModalNuevoPuesto?.(); }}>
               <span className="selector-config__opcion-icono">+</span>
               Nuevo puesto
            </button>
         )}
         {esOperadorEnWorkspace && (
            <button type="button" className="selector-config__opcion-secundaria" onClick={() => { onCerrarMenu(); onAbrirModalEditarPuestos?.(); }} disabled={puestosLength === 0}>
               <span className="selector-config__opcion-icono">✎</span>
               Editar puestos
            </button>
         )}
         {puedeCrearPuesto && (
            <button type="button" className="selector-config__opcion-secundaria" onClick={() => { onCerrarMenu(); onAbrirModalConfigurarAgente?.(); }}>
               <span className="selector-config__opcion-icono">⚙</span>
               Configurar Agente
            </button>
         )}
         {rolGlobal === "superadmin" && (
            <button type="button" className="selector-config__opcion-secundaria" onClick={() => { onCerrarMenu(); onAbrirModalPanelPermisos?.(); }}>
               <span className="selector-config__opcion-icono">🔐</span>
               Panel de Permisos
            </button>
         )}
         {configuraciones.length > 1 && esCreador && (
            <button type="button" className="selector-config__eliminar-activo" onClick={onEliminarActivo}>
               <span className="selector-config__eliminar-icono">🗑</span>
               Eliminar workspace
            </button>
         )}
         {puedeCrearWorkspaces && (
            <button type="button" className="selector-config__nueva" onClick={onMostrarForm}>+ Nuevo workspace</button>
         )}
      </>
   );
};
