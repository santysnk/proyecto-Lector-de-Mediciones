// componentes/modales/configurar-agente/TarjetaAgente.jsx
// Tarjeta individual de un agente con estado y acciones

/**
 * Indicador de estado de conexión
 */
export const EstadoConexion = ({ conectado }) => (
   <span
      className={`config-agente-estado ${conectado ? "config-agente-estado--conectado" : "config-agente-estado--desconectado"}`}
   >
      <span className="config-agente-estado-punto"></span>
      {conectado ? "Conectado" : "Desconectado"}
   </span>
);

/**
 * Tarjeta de agente reutilizable
 *
 * @param {Object} props
 * @param {Object} props.agente - Datos del agente
 * @param {boolean} props.expandido - Si los registradores están expandidos
 * @param {Function} props.onToggleExpandir - Callback para expandir/colapsar
 * @param {Function} props.onAccionPrincipal - Callback para acción principal (vincular/desvincular)
 * @param {string} props.accionPrincipalLabel - Label del botón de acción principal
 * @param {string} props.accionPrincipalTipo - Tipo del botón ('vincular', 'desvincular', etc.)
 * @param {boolean} props.accionPrincipalDisabled - Si la acción está deshabilitada
 * @param {string} props.accionPrincipalTitle - Tooltip del botón
 * @param {boolean} props.mostrarAccionesAdmin - Si mostrar acciones de admin (rotar clave, eliminar)
 * @param {Function} props.onRotarClave - Callback para rotar clave
 * @param {Function} props.onEliminar - Callback para eliminar
 * @param {React.ReactNode} props.children - Contenido adicional (registradores)
 * @param {string} props.variante - Variante de estilo ('disponible', 'admin')
 */
export function TarjetaAgente({
   agente,
   expandido,
   onToggleExpandir,
   onAccionPrincipal,
   accionPrincipalLabel,
   accionPrincipalTipo,
   accionPrincipalDisabled,
   accionPrincipalTitle,
   mostrarAccionesAdmin,
   onRotarClave,
   onEliminar,
   children,
   variante,
}) {
   const claseVariante = variante ? `config-agente-card--${variante}` : "";

   return (
      <div className={`config-agente-card ${claseVariante}`}>
         <div className="config-agente-card-header">
            <div className="config-agente-card-info">
               <h3>{agente.nombre}</h3>
               <EstadoConexion conectado={agente.conectado} />
               {!agente.activo && (
                  <span className="config-agente-badge config-agente-badge--inactivo">Inactivo</span>
               )}
            </div>
            <div className="config-agente-card-acciones">
               {onToggleExpandir && (
                  <button
                     className="config-agente-btn-icon"
                     onClick={() => onToggleExpandir(agente.id)}
                     title="Ver registradores"
                  >
                     {expandido ? "▲" : "▼"}
                  </button>
               )}

               {/* Acción principal (vincular/desvincular) */}
               {onAccionPrincipal && accionPrincipalTipo === "vincular" && (
                  <button
                     className="config-agente-btn config-agente-btn--vincular"
                     onClick={() => onAccionPrincipal(agente.id)}
                  >
                     {accionPrincipalLabel}
                  </button>
               )}

               {onAccionPrincipal && accionPrincipalTipo === "desvincular" && (
                  <button
                     className={`config-agente-btn-icon config-agente-btn-icon--danger ${accionPrincipalDisabled ? "config-agente-btn-icon--disabled" : ""}`}
                     onClick={() => onAccionPrincipal(agente.id)}
                     title={accionPrincipalTitle || "Desvincular"}
                  >
                     ✕
                  </button>
               )}

               {/* Acciones de admin */}
               {mostrarAccionesAdmin && (
                  <>
                     <button
                        className="config-agente-btn-icon"
                        onClick={() => onRotarClave(agente.id)}
                        title="Rotar clave"
                     >
                        🔑
                     </button>
                     <button
                        className="config-agente-btn-icon config-agente-btn-icon--danger"
                        onClick={() => onEliminar(agente.id, agente.nombre)}
                        title="Eliminar"
                     >
                        🗑
                     </button>
                  </>
               )}
            </div>
         </div>

         {agente.descripcion && <p className="config-agente-card-desc">{agente.descripcion}</p>}

         {/* Contenido expandido (registradores) */}
         {expandido && children}
      </div>
   );
}
