// componentes/modales/configurar-agente/FormularioRegistrador.jsx
// Formulario para crear/editar registradores (analizador o relé)

import { ConfiguracionRele } from "../rele";

/**
 * Formulario de analizador de redes
 */
const FormularioAnalizador = ({
   nuevoRegistrador,
   setNuevoRegistrador,
   guardandoRegistrador,
   testEnCurso,
   onTest,
   onCancelar,
   onSubmit,
   registradorEditando,
}) => (
   <div className="config-agente-analizador">
      {/* Nombre del registrador */}
      <div className="config-agente-analizador-nombre">
         <label>Nombre del Registrador</label>
         <input
            type="text"
            value={nuevoRegistrador.nombre}
            onChange={(e) => setNuevoRegistrador((prev) => ({ ...prev, nombre: e.target.value }))}
            placeholder="Ej: Analizador Trafo 1"
            disabled={guardandoRegistrador}
         />
      </div>

      {/* Secciones en dos columnas */}
      <div className="config-agente-analizador-grid">
         {/* Sección Conexión */}
         <div className="config-agente-analizador-seccion">
            <h6>📡 Conexión Modbus TCP</h6>
            <div className="config-agente-analizador-campos">
               <div className="config-agente-campo-inline">
                  <label>IP</label>
                  <input
                     type="text"
                     value={nuevoRegistrador.ip}
                     onChange={(e) =>
                        setNuevoRegistrador((prev) => ({ ...prev, ip: e.target.value }))
                     }
                     placeholder="192.168.1.100"
                     disabled={guardandoRegistrador}
                  />
               </div>
               <div className="config-agente-campo-inline">
                  <label>Puerto</label>
                  <input
                     type="number"
                     value={nuevoRegistrador.puerto}
                     onChange={(e) =>
                        setNuevoRegistrador((prev) => ({ ...prev, puerto: e.target.value }))
                     }
                     placeholder="502"
                     disabled={guardandoRegistrador}
                  />
               </div>
               <div className="config-agente-campo-inline">
                  <label>Unit ID</label>
                  <input
                     type="number"
                     value={nuevoRegistrador.unitId}
                     onChange={(e) =>
                        setNuevoRegistrador((prev) => ({ ...prev, unitId: e.target.value }))
                     }
                     placeholder="1"
                     disabled={guardandoRegistrador}
                  />
               </div>
            </div>
         </div>

         {/* Sección Registros */}
         <div className="config-agente-analizador-seccion">
            <h6>📋 Registros Modbus</h6>
            <div className="config-agente-analizador-campos">
               <div className="config-agente-campo-inline">
                  <label>Índice Inicial</label>
                  <input
                     type="number"
                     value={nuevoRegistrador.indiceInicial}
                     onChange={(e) =>
                        setNuevoRegistrador((prev) => ({ ...prev, indiceInicial: e.target.value }))
                     }
                     placeholder="0"
                     disabled={guardandoRegistrador}
                  />
               </div>
               <div className="config-agente-campo-inline">
                  <label>Cantidad</label>
                  <input
                     type="number"
                     value={nuevoRegistrador.cantidadRegistros}
                     onChange={(e) =>
                        setNuevoRegistrador((prev) => ({
                           ...prev,
                           cantidadRegistros: e.target.value,
                        }))
                     }
                     placeholder="20"
                     disabled={guardandoRegistrador}
                  />
               </div>
               <div className="config-agente-campo-inline">
                  <label>Intervalo</label>
                  <div className="config-agente-input-con-sufijo">
                     <input
                        type="number"
                        value={nuevoRegistrador.intervaloSegundos}
                        onChange={(e) =>
                           setNuevoRegistrador((prev) => ({
                              ...prev,
                              intervaloSegundos: e.target.value,
                           }))
                        }
                        placeholder="60"
                        disabled={guardandoRegistrador}
                     />
                     <span>seg</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="config-agente-form-acciones">
         <button
            type="button"
            className="config-agente-btn config-agente-btn--test"
            onClick={onTest}
            disabled={
               guardandoRegistrador ||
               testEnCurso ||
               !nuevoRegistrador.ip.trim() ||
               !nuevoRegistrador.puerto ||
               !nuevoRegistrador.indiceInicial ||
               !nuevoRegistrador.cantidadRegistros
            }
            title="Probar conexión antes de guardar"
         >
            {testEnCurso ? "Probando..." : "Test"}
         </button>
         <div className="config-agente-form-acciones-derecha">
            <button
               type="button"
               className="config-agente-btn config-agente-btn--secundario"
               onClick={onCancelar}
               disabled={guardandoRegistrador || testEnCurso}
            >
               Cancelar
            </button>
            <button
               type="submit"
               className="config-agente-btn config-agente-btn--primario"
               disabled={
                  guardandoRegistrador ||
                  testEnCurso ||
                  !nuevoRegistrador.nombre.trim() ||
                  !nuevoRegistrador.ip.trim() ||
                  !nuevoRegistrador.puerto ||
                  !nuevoRegistrador.indiceInicial ||
                  !nuevoRegistrador.cantidadRegistros
               }
            >
               {guardandoRegistrador ? "Guardando..." : registradorEditando ? "Guardar" : "Crear"}
            </button>
         </div>
      </div>
   </div>
);

/**
 * Formulario de relé de protección
 */
const FormularioRele = ({
   nuevoRegistrador,
   setNuevoRegistrador,
   guardandoRegistrador,
   onCancelar,
   registradorEditando,
   agenteId,
}) => (
   <>
      {/* Nombre del registrador */}
      <div className="config-agente-rele-nombre">
         <label>Nombre del Registrador</label>
         <input
            type="text"
            value={nuevoRegistrador.nombre}
            onChange={(e) => setNuevoRegistrador((prev) => ({ ...prev, nombre: e.target.value }))}
            placeholder="Ej: Relé REF615 Bahía 1"
            disabled={guardandoRegistrador}
         />
      </div>
      <ConfiguracionRele
         configuracionInicial={nuevoRegistrador.configuracionRele}
         onChange={(config) =>
            setNuevoRegistrador((prev) => ({
               ...prev,
               configuracionRele: config,
            }))
         }
         agenteId={agenteId}
      />
      <div className="config-agente-form-acciones">
         <div className="config-agente-form-acciones-derecha">
            <button
               type="button"
               className="config-agente-btn config-agente-btn--secundario"
               onClick={onCancelar}
               disabled={guardandoRegistrador}
            >
               Cancelar
            </button>
            <button
               type="submit"
               className="config-agente-btn config-agente-btn--primario"
               disabled={
                  guardandoRegistrador ||
                  !nuevoRegistrador.nombre.trim() ||
                  !nuevoRegistrador.configuracionRele
               }
            >
               {guardandoRegistrador ? "Guardando..." : registradorEditando ? "Guardar" : "Crear"}
            </button>
         </div>
      </div>
   </>
);

/**
 * Formulario principal para crear/editar registradores
 *
 * @param {Object} props
 * @param {string} props.agenteId - ID del agente
 * @param {Object} props.nuevoRegistrador - Estado del formulario
 * @param {Function} props.setNuevoRegistrador - Setter del estado
 * @param {Object|null} props.registradorEditando - Registrador en edición
 * @param {boolean} props.guardandoRegistrador - Si está guardando
 * @param {boolean} props.testEnCurso - Si hay test en curso
 * @param {Function} props.onSubmit - Callback al enviar
 * @param {Function} props.onTest - Callback para test
 * @param {Function} props.onCancelar - Callback para cancelar
 */
export function FormularioRegistrador({
   agenteId,
   nuevoRegistrador,
   setNuevoRegistrador,
   registradorEditando,
   guardandoRegistrador,
   testEnCurso,
   onSubmit,
   onTest,
   onCancelar,
}) {
   return (
      <form className="config-agente-reg-form" onSubmit={onSubmit}>
         <h5>{registradorEditando ? "Editar Registrador" : "Nuevo Registrador"}</h5>

         {/* Selector de tipo de dispositivo */}
         <div className="config-agente-tipo-row">
            <label className="config-agente-tipo-label">Tipo de Dispositivo:</label>
            <select
               value={nuevoRegistrador.tipoDispositivo}
               onChange={(e) =>
                  setNuevoRegistrador((prev) => ({
                     ...prev,
                     tipoDispositivo: e.target.value,
                     configuracionRele: e.target.value === "analizador" ? null : prev.configuracionRele,
                  }))
               }
               disabled={guardandoRegistrador}
               className="config-agente-select-tipo"
            >
               <option value="analizador">📊 Analizador de Redes</option>
               <option value="rele">🛡️ Relé de Protección</option>
            </select>
         </div>

         {/* Formulario específico según tipo */}
         {nuevoRegistrador.tipoDispositivo === "analizador" ? (
            <FormularioAnalizador
               nuevoRegistrador={nuevoRegistrador}
               setNuevoRegistrador={setNuevoRegistrador}
               guardandoRegistrador={guardandoRegistrador}
               testEnCurso={testEnCurso}
               onTest={onTest}
               onCancelar={onCancelar}
               onSubmit={onSubmit}
               registradorEditando={registradorEditando}
            />
         ) : (
            <FormularioRele
               nuevoRegistrador={nuevoRegistrador}
               setNuevoRegistrador={setNuevoRegistrador}
               guardandoRegistrador={guardandoRegistrador}
               onCancelar={onCancelar}
               registradorEditando={registradorEditando}
               agenteId={agenteId}
            />
         )}
      </form>
   );
}
