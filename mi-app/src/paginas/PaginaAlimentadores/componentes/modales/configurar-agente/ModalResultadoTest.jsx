// componentes/modales/configurar-agente/ModalResultadoTest.jsx
// Modal que muestra el resultado de un test de conexión

/**
 * Modal de resultado del test de conexión
 *
 * @param {Object} props
 * @param {Object} props.resultadoTest - Resultado del test
 * @param {Function} props.onCerrar - Callback para cerrar
 */
export function ModalResultadoTest({ resultadoTest, onCerrar }) {
   if (!resultadoTest) return null;

   return (
      <div className="config-agente-test-overlay" onClick={onCerrar}>
         <div className="config-agente-test-modal" onClick={(e) => e.stopPropagation()}>
            <div className="config-agente-test-header">
               <h3>Resultado del Test</h3>
               <button className="config-agente-cerrar" onClick={onCerrar}>
                  ×
               </button>
            </div>
            <div className="config-agente-test-contenido">
               <div className="config-agente-test-info">
                  <strong>{resultadoTest.registrador?.nombre}</strong>
                  <span className="config-agente-test-detalle">
                     {resultadoTest.registrador?.ip}:{resultadoTest.registrador?.puerto}
                  </span>
               </div>

               {resultadoTest.exito ? (
                  <div className="config-agente-test-exito">
                     <div className="config-agente-test-icono">✓</div>
                     <h4>Conexión Exitosa</h4>
                     <p className="config-agente-test-tiempo">
                        Tiempo de respuesta: <strong>{resultadoTest.tiempo_respuesta_ms}ms</strong>
                     </p>
                     {resultadoTest.valores && resultadoTest.valores.length > 0 && (
                        <div className="config-agente-test-valores">
                           <h5>Valores leídos ({resultadoTest.valores.length} registros):</h5>
                           <div className="config-agente-test-valores-grid">
                              {resultadoTest.valores.map((valor, idx) => (
                                 <div key={idx} className="config-agente-test-valor">
                                    <span className="config-agente-test-valor-idx">
                                       [{resultadoTest.registrador?.indice_inicial + idx}]
                                    </span>
                                    <span className="config-agente-test-valor-num">{valor}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="config-agente-test-error">
                     <div className="config-agente-test-icono config-agente-test-icono--error">
                        ✗
                     </div>
                     <h4>
                        {resultadoTest.estado === "timeout" && "Tiempo Agotado"}
                        {resultadoTest.estado === "cooldown" && "Espera Requerida"}
                        {resultadoTest.estado === "error" && "Error de Conexión"}
                     </h4>
                     <p className="config-agente-test-mensaje">{resultadoTest.error_mensaje}</p>
                     {resultadoTest.tiempo_respuesta_ms && (
                        <p className="config-agente-test-tiempo">
                           Tiempo transcurrido: {resultadoTest.tiempo_respuesta_ms}ms
                        </p>
                     )}
                  </div>
               )}
            </div>
            <div className="config-agente-test-acciones">
               <button className="config-agente-btn config-agente-btn--primario" onClick={onCerrar}>
                  Cerrar
               </button>
            </div>
         </div>
      </div>
   );
}

/**
 * Indicador de test en progreso
 */
export function IndicadorTestProgreso({ testEnCurso }) {
   if (!testEnCurso) return null;

   return (
      <div className="config-agente-test-progreso">
         <div className="config-agente-test-progreso-contenido">
            <span className="config-agente-spinner"></span>
            <span>Esperando respuesta del agente...</span>
            <div className="config-agente-test-progreso-barra">
               <div
                  className="config-agente-test-progreso-fill"
                  style={{ width: `${testEnCurso.progreso}%` }}
               ></div>
            </div>
         </div>
      </div>
   );
}
