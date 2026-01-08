// componentes/SeccionAcciones.jsx
// Sección de acciones del menú lateral

/**
 * Sección de acciones en el menú lateral
 * @param {Object} props
 * @param {Object} props.configuracionSeleccionada - Configuración actual
 * @param {string} props.rolGlobal - Rol global del usuario
 * @param {number} props.puestosLength - Cantidad de puestos
 * @param {Function} props.onAccion - Handler genérico para acciones
 * @param {Function} props.onAbrirGestionarAccesos - Handler para gestionar accesos
 * @param {Function} props.onAbrirNuevoPuesto - Handler para nuevo puesto
 * @param {Function} props.onAbrirEditarPuestos - Handler para editar puestos
 * @param {Function} props.onAbrirConfigurarAgente - Handler para configurar agente
 * @param {Function} props.onAbrirPanelPermisos - Handler para panel de permisos
 * @param {Function} props.onSalir - Handler para salir
 */
const SeccionAcciones = ({
   configuracionSeleccionada,
   rolGlobal,
   puestosLength,
   onAccion,
   onAbrirGestionarAccesos,
   onAbrirNuevoPuesto,
   onAbrirEditarPuestos,
   onAbrirConfigurarAgente,
   onAbrirPanelPermisos,
   onSalir,
}) => {
   const esCreador = configuracionSeleccionada?.esCreador;
   const esAdmin = configuracionSeleccionada?.rol === "admin";
   const puedeEditar = esCreador || esAdmin;
   const esSuperadmin = rolGlobal === "superadmin";

   return (
      <section className="alim-drawer-section">
         <h3 className="alim-drawer-section-title">Acciones</h3>
         <div className="alim-drawer-actions">
            {/* Gestionar Accesos (SOLO el creador del workspace) */}
            {esCreador && (
               <button
                  type="button"
                  className="alim-drawer-btn-action alim-drawer-btn-accesos"
                  onClick={() => onAccion(onAbrirGestionarAccesos)}
               >
                  <svg
                     className="alim-drawer-btn-icon-svg"
                     viewBox="0 0 24 24"
                     fill="currentColor"
                     width="18"
                     height="18"
                  >
                     <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  Gestionar Accesos
               </button>
            )}

            {/* Nuevo puesto (creador o admin) */}
            {puedeEditar && (
               <button
                  type="button"
                  className="alim-drawer-btn-action alim-drawer-btn-add"
                  onClick={() => onAccion(onAbrirNuevoPuesto)}
               >
                  <span className="alim-drawer-btn-icon">+</span>
                  <span>Nuevo puesto</span>
               </button>
            )}

            <button
               type="button"
               className="alim-drawer-btn-action alim-drawer-btn-edit"
               onClick={() => onAccion(onAbrirEditarPuestos)}
               disabled={puestosLength === 0}
            >
               <span className="alim-drawer-btn-icon">✎</span>
               <span>Editar puestos</span>
            </button>

            {/* Configurar Agente (creador o admin) */}
            {puedeEditar && (
               <button
                  type="button"
                  className="alim-drawer-btn-action alim-drawer-btn-config"
                  onClick={() => onAccion(onAbrirConfigurarAgente)}
               >
                  <span className="alim-drawer-btn-icon">⚙</span>
                  Configurar Agente
               </button>
            )}

            {/* Panel de Permisos (solo superadmin) */}
            {esSuperadmin && (
               <button
                  type="button"
                  className="alim-drawer-btn-action alim-drawer-btn-permisos"
                  onClick={() => onAccion(onAbrirPanelPermisos)}
               >
                  <span className="alim-drawer-btn-icon">🔐</span>
                  Panel de Permisos
               </button>
            )}

            <button
               type="button"
               className="alim-drawer-btn-action alim-drawer-btn-salir"
               onClick={() => onAccion(onSalir)}
            >
               <span className="alim-drawer-btn-icon">↩</span>
               <span>Salir</span>
            </button>
         </div>
      </section>
   );
};

export default SeccionAcciones;
