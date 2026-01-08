// componentes/PanelDetalles.jsx
// Panel de detalles del usuario seleccionado

import PanelDetallesVacio from "./PanelDetallesVacio";
import FormularioEdicion from "./FormularioEdicion";
import WorkspacesGrid from "./WorkspacesGrid";

/**
 * Obtiene el texto descriptivo del acceso a agentes
 */
const getAccesoTexto = (usuario) => {
   if (usuario.permisoAgentes?.accesoTotal) return "Todos";
   const count = usuario.permisoAgentes?.agentes?.length || 0;
   if (count === 0) return "Sin acceso a agentes";
   return `${count} agente${count > 1 ? "s" : ""}`;
};

/**
 * Panel de detalles de usuario
 * @param {Object} props
 * @param {Object} props.usuarioSeleccionado - Usuario seleccionado
 * @param {boolean} props.cargandoDetalles - Si está cargando detalles
 * @param {string} props.errorDetalles - Error al cargar detalles
 * @param {Object} props.detallesUsuario - Detalles del usuario
 * @param {boolean} props.modoEdicion - Si está en modo edición
 * @param {Object} props.edicionProps - Props para el formulario de edición
 */
const PanelDetalles = ({
   usuarioSeleccionado,
   cargandoDetalles,
   errorDetalles,
   detallesUsuario,
   modoEdicion,
   edicionProps,
}) => {
   if (!usuarioSeleccionado) {
      return <PanelDetallesVacio />;
   }

   if (cargandoDetalles) {
      return (
         <div className="permisos-detalle-cargando">
            <div className="permisos-spinner"></div>
            <span>Cargando detalles...</span>
         </div>
      );
   }

   if (errorDetalles) {
      return (
         <div className="permisos-detalle-error">
            <span>Error: {errorDetalles}</span>
         </div>
      );
   }

   const {
      workspacesPropios = [],
      workspacesComoInvitado = [],
      resumen = {},
   } = detallesUsuario || {};

   return (
      <div className="permisos-detalle">
         {/* Header del usuario */}
         <div className="permisos-detalle-header">
            <div className="permisos-detalle-usuario">
               <span className="permisos-detalle-nombre">
                  {usuarioSeleccionado.nombre || "Sin nombre"}
               </span>
               <span className="permisos-detalle-email">{usuarioSeleccionado.email}</span>
            </div>
            <div className="permisos-detalle-badges">
               <span
                  className={`permisos-badge permisos-badge--${usuarioSeleccionado.rolGlobal}`}
               >
                  {usuarioSeleccionado.rolNombre}
               </span>
               <span className="permisos-detalle-acceso">{getAccesoTexto(usuarioSeleccionado)}</span>
            </div>
            {!modoEdicion && (
               <button
                  type="button"
                  className="permisos-btn-editar"
                  onClick={edicionProps.iniciarEdicion}
               >
                  Editar permisos
               </button>
            )}
         </div>

         {/* Modo edición */}
         {modoEdicion && <FormularioEdicion {...edicionProps} />}

         {/* Resumen y workspaces */}
         {!modoEdicion && detallesUsuario && (
            <>
               <div className="permisos-detalle-stats">
                  <div className="permisos-stat-item">
                     <span className="permisos-stat-numero">
                        {resumen.totalWorkspacesPropios ?? workspacesPropios.length}
                     </span>
                     <span className="permisos-stat-label">Workspaces propios</span>
                  </div>
                  <div className="permisos-stat-item">
                     <span className="permisos-stat-numero">{resumen.totalPuestos ?? 0}</span>
                     <span className="permisos-stat-label">Puestos totales</span>
                  </div>
                  <div className="permisos-stat-item">
                     <span className="permisos-stat-numero">
                        {resumen.totalWorkspacesInvitado ?? workspacesComoInvitado.length}
                     </span>
                     <span className="permisos-stat-label">Como invitado</span>
                  </div>
               </div>

               <WorkspacesGrid
                  workspacesPropios={workspacesPropios}
                  workspacesComoInvitado={workspacesComoInvitado}
               />
            </>
         )}
      </div>
   );
};

export default PanelDetalles;
