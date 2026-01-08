// componentes/modales/configurar-agente/ListaRegistradores.jsx
// Lista de registradores de un agente con acciones opcionales

/**
 * Lista de registradores con acciones opcionales
 *
 * @param {Object} props
 * @param {Array} props.registradores - Lista de registradores
 * @param {boolean} props.conAcciones - Si mostrar acciones (toggle, editar, eliminar)
 * @param {string|null} props.registradorProcesando - ID del registrador procesándose
 * @param {Function} props.onToggle - Callback para toggle activar/desactivar
 * @param {Function} props.onEditar - Callback para editar
 * @param {Function} props.onEliminar - Callback para eliminar
 */
export function ListaRegistradores({
   registradores,
   conAcciones = false,
   registradorProcesando,
   onToggle,
   onEditar,
   onEliminar,
}) {
   if (registradores.length === 0) {
      return <div className="config-agente-regs-vacio">Sin registradores configurados</div>;
   }

   return (
      <div className="config-agente-regs-lista">
         {registradores.map((reg) => {
            const esRele = reg.tipo_dispositivo === "rele";
            const configRele = reg.configuracion_rele;

            return (
               <div
                  key={reg.id}
                  className={`config-agente-reg-item ${conAcciones ? "config-agente-reg-item--admin" : ""} ${esRele ? "config-agente-reg-item--rele" : ""}`}
               >
                  <div className="config-agente-reg-info">
                     <span
                        className={`config-agente-reg-estado ${reg.activo ? "config-agente-reg-estado--activo" : ""}`}
                        title={reg.activo ? "Activo" : "Inactivo"}
                     ></span>
                     <span
                        className="config-agente-reg-tipo"
                        title={esRele ? "Relé de Protección" : "Analizador de Redes"}
                     >
                        {esRele ? "🛡️" : "📊"}
                     </span>
                     <span className="config-agente-reg-nombre">{reg.nombre}</span>
                     {esRele && configRele ? (
                        <span className="config-agente-reg-detalle">
                           {reg.ip}:{reg.puerto} | {configRele.modeloId} - {configRele.configuracionId}{" "}
                           | {reg.intervalo_segundos}s
                        </span>
                     ) : (
                        <span className="config-agente-reg-detalle">
                           {reg.ip}:{reg.puerto} | Reg: {reg.indice_inicial}-
                           {reg.indice_inicial + reg.cantidad_registros - 1} | {reg.intervalo_segundos}
                           s
                        </span>
                     )}
                  </div>
                  {conAcciones && (
                     <div className="config-agente-reg-acciones">
                        <button
                           className={`config-agente-btn-icon ${reg.activo ? "config-agente-btn-icon--success" : ""}`}
                           onClick={() => onToggle(reg.id)}
                           title={reg.activo ? "Desactivar" : "Activar"}
                           disabled={registradorProcesando === reg.id}
                        >
                           {registradorProcesando === reg.id ? (
                              <span className="config-agente-spinner-mini"></span>
                           ) : reg.activo ? (
                              "⏸"
                           ) : (
                              "▶"
                           )}
                        </button>
                        <button
                           className="config-agente-btn-icon"
                           onClick={() => onEditar(reg)}
                           title="Editar"
                           disabled={registradorProcesando === reg.id}
                        >
                           ✏️
                        </button>
                        <button
                           className="config-agente-btn-icon config-agente-btn-icon--danger"
                           onClick={() => onEliminar(reg.id, reg.nombre)}
                           title="Eliminar"
                           disabled={registradorProcesando === reg.id}
                        >
                           🗑
                        </button>
                     </div>
                  )}
               </div>
            );
         })}
      </div>
   );
}

/**
 * Toolbar de acciones para registradores
 */
export function ToolbarRegistradores({
   registradores,
   registradorProcesando,
   onAgregar,
   onIniciarTodos,
   onPausarTodos,
}) {
   const hayActivos = registradores.some((r) => r.activo);
   const hayInactivos = registradores.some((r) => !r.activo);

   return (
      <div className="config-agente-regs-toolbar">
         <button className="config-agente-btn config-agente-btn--agregar-reg" onClick={onAgregar}>
            + Agregar Registrador
         </button>
         {registradores.length > 0 && (
            <div className="config-agente-regs-toolbar-acciones">
               {hayInactivos && (
                  <button
                     className="config-agente-btn config-agente-btn--iniciar-todos"
                     onClick={onIniciarTodos}
                     disabled={registradorProcesando === "todos"}
                     title="Iniciar todos los registradores pausados"
                  >
                     {registradorProcesando === "todos" ? (
                        <span className="config-agente-spinner-mini"></span>
                     ) : (
                        "▶"
                     )}{" "}
                     Iniciar todos
                  </button>
               )}
               {hayActivos && (
                  <button
                     className="config-agente-btn config-agente-btn--parar-todos"
                     onClick={onPausarTodos}
                     disabled={registradorProcesando === "todos"}
                     title="Pausar todos los registradores activos"
                  >
                     {registradorProcesando === "todos" ? (
                        <span className="config-agente-spinner-mini"></span>
                     ) : (
                        "⏸"
                     )}{" "}
                     Pausar todos
                  </button>
               )}
            </div>
         )}
      </div>
   );
}
