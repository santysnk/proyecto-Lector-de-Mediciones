// componentes/WorkspacesGrid.jsx
// Grid de workspaces propios y como invitado

/**
 * Agrupa invitados por rol
 */
const agruparInvitadosPorRol = (invitados) => {
   const grupos = {};
   invitados.forEach((inv) => {
      const rol = inv.rol || "observador";
      if (!grupos[rol]) grupos[rol] = [];
      grupos[rol].push(inv);
   });
   return grupos;
};

/**
 * Tarjeta de workspace propio
 */
const WorkspacePropio = ({ workspace }) => {
   const invitadosAgrupados = agruparInvitadosPorRol(workspace.invitados || []);

   return (
      <div className="permisos-workspace-card">
         <div className="permisos-workspace-header">
            <span className="permisos-workspace-nombre">{workspace.nombre}</span>
            <span className="permisos-workspace-puestos">
               {workspace.cantidadPuestos} puesto{workspace.cantidadPuestos !== 1 ? "s" : ""}
            </span>
         </div>

         {/* Agentes */}
         <div className="permisos-workspace-row">
            <span className="permisos-workspace-label">Agentes:</span>
            {workspace.agentes.length === 0 ? (
               <span className="permisos-workspace-vacio">Sin agente</span>
            ) : (
               <div className="permisos-workspace-chips">
                  {workspace.agentes.map((a) => (
                     <span
                        key={a.id}
                        className={`permisos-chip ${!a.activo ? "permisos-chip--inactivo" : ""}`}
                     >
                        {a.nombre}
                     </span>
                  ))}
               </div>
            )}
         </div>

         {/* Invitados agrupados por rol */}
         <div className="permisos-workspace-row">
            <span className="permisos-workspace-label">Invitados:</span>
            {workspace.invitados.length === 0 ? (
               <span className="permisos-workspace-vacio">Sin invitados</span>
            ) : (
               <div className="permisos-invitados-grupos">
                  {Object.entries(invitadosAgrupados).map(([rol, invs]) => (
                     <div key={rol} className="permisos-invitados-grupo">
                        <span className={`permisos-rol-badge permisos-rol-badge--${rol}`}>
                           {rol.toUpperCase()} ({invs.length})
                        </span>
                        <span className="permisos-invitados-nombres">
                           {invs.map((inv) => inv.nombre || inv.email).join(", ")}
                        </span>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
};

/**
 * Tarjeta de workspace como invitado
 */
const WorkspaceInvitado = ({ workspace }) => (
   <div className="permisos-workspace-card permisos-workspace-card--invitado">
      <div className="permisos-workspace-header">
         <span className="permisos-workspace-nombre">{workspace.nombre}</span>
         <span className={`permisos-rol-badge permisos-rol-badge--${workspace.rol}`}>
            {workspace.rol?.toUpperCase()}
         </span>
      </div>
      <div className="permisos-workspace-row">
         <span className="permisos-workspace-label">Propietario:</span>
         <span className="permisos-workspace-propietario">
            {workspace.propietario?.nombre || workspace.propietario?.email || "Desconocido"}
         </span>
      </div>
   </div>
);

/**
 * Grid de workspaces del usuario
 * @param {Object} props
 * @param {Array} props.workspacesPropios - Workspaces propios del usuario
 * @param {Array} props.workspacesComoInvitado - Workspaces donde es invitado
 */
const WorkspacesGrid = ({ workspacesPropios = [], workspacesComoInvitado = [] }) => {
   const sinDatos = workspacesPropios.length === 0 && workspacesComoInvitado.length === 0;

   if (sinDatos) {
      return (
         <div className="permisos-detalle-sin-datos">
            Este usuario no tiene workspaces propios ni acceso como invitado.
         </div>
      );
   }

   return (
      <div className="permisos-detalle-contenido">
         {/* Workspaces propios */}
         {workspacesPropios.length > 0 && (
            <div className="permisos-seccion">
               <h4 className="permisos-seccion-titulo">Workspaces Propios</h4>
               <div className="permisos-workspaces-grid">
                  {workspacesPropios.map((ws) => (
                     <WorkspacePropio key={ws.id} workspace={ws} />
                  ))}
               </div>
            </div>
         )}

         {/* Workspaces como invitado */}
         {workspacesComoInvitado.length > 0 && (
            <div className="permisos-seccion">
               <h4 className="permisos-seccion-titulo">Acceso como Invitado</h4>
               <div className="permisos-workspaces-grid">
                  {workspacesComoInvitado.map((ws) => (
                     <WorkspaceInvitado key={ws.id} workspace={ws} />
                  ))}
               </div>
            </div>
         )}
      </div>
   );
};

export default WorkspacesGrid;
