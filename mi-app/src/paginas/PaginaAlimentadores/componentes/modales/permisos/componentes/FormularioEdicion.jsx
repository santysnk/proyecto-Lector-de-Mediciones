// componentes/FormularioEdicion.jsx
// Formulario de edición de permisos de usuario

/**
 * Formulario para editar rol y acceso a agentes de un usuario
 * @param {Object} props
 * @param {Object} props.cambiosPendientes - Estado de cambios actuales
 * @param {Array} props.rolesDisponibles - Roles disponibles para asignar
 * @param {Array} props.agentesDisponibles - Agentes disponibles
 * @param {boolean} props.guardando - Si está guardando
 * @param {boolean} props.tieneModificaciones - Si hay cambios pendientes
 * @param {Function} props.onCambioRol - Handler para cambio de rol
 * @param {Function} props.onToggleAccesoTotal - Handler para toggle acceso total
 * @param {Function} props.onToggleAgente - Handler para toggle agente
 * @param {Function} props.onGuardar - Handler para guardar
 * @param {Function} props.onCancelar - Handler para cancelar
 */
const FormularioEdicion = ({
   cambiosPendientes,
   rolesDisponibles,
   agentesDisponibles,
   guardando,
   tieneModificaciones,
   onCambioRol,
   onToggleAccesoTotal,
   onToggleAgente,
   onGuardar,
   onCancelar,
}) => {
   return (
      <div className="permisos-detalle-edicion">
         <h4>Editar Permisos</h4>

         <div className="permisos-campo">
            <label className="permisos-label">Rol Global</label>
            <select
               className="permisos-select"
               value={cambiosPendientes.rolGlobal || ""}
               onChange={(e) => onCambioRol(e.target.value)}
               disabled={guardando}
            >
               {rolesDisponibles.map((rol) => (
                  <option key={rol.codigo} value={rol.codigo}>
                     {rol.nombre}
                  </option>
               ))}
            </select>
         </div>

         <div className="permisos-campo">
            <label className="permisos-label">Acceso a Agentes</label>
            <label className="permisos-checkbox permisos-checkbox--destacado">
               <input
                  type="checkbox"
                  checked={cambiosPendientes.accesoTotal}
                  onChange={onToggleAccesoTotal}
                  disabled={guardando}
               />
               <span>Acceso a todos los agentes</span>
            </label>

            {!cambiosPendientes.accesoTotal && (
               <div className="permisos-agentes-lista">
                  {agentesDisponibles.length === 0 ? (
                     <span className="permisos-agentes-vacio">No hay agentes disponibles</span>
                  ) : (
                     agentesDisponibles.map((agente) => (
                        <label key={agente.id} className="permisos-checkbox">
                           <input
                              type="checkbox"
                              checked={cambiosPendientes.agentesIds.includes(agente.id)}
                              onChange={() => onToggleAgente(agente.id)}
                              disabled={guardando}
                           />
                           <span>{agente.nombre}</span>
                           {!agente.activo && (
                              <span className="permisos-agente-inactivo">(inactivo)</span>
                           )}
                        </label>
                     ))
                  )}
               </div>
            )}
         </div>

         <div className="permisos-edicion-acciones">
            <button
               type="button"
               className="permisos-btn permisos-btn--cancelar"
               onClick={onCancelar}
               disabled={guardando}
            >
               Cancelar
            </button>
            <button
               type="button"
               className="permisos-btn permisos-btn--guardar"
               onClick={onGuardar}
               disabled={guardando || !tieneModificaciones}
            >
               {guardando ? "Guardando..." : "Guardar"}
            </button>
         </div>
      </div>
   );
};

export default FormularioEdicion;
