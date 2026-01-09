// componentes/modales/configurar-agente/FormularioRegistrador.jsx
// Formulario para crear/editar registradores (analizador o relé)

import { ConfiguracionAnalizador, ConfiguracionRele } from "../registradores";

/**
 * Formulario de analizador de redes
 */
const FormularioAnalizador = ({
   nuevoRegistrador,
   setNuevoRegistrador,
   guardandoRegistrador,
   onCancelar,
   registradorEditando,
   agenteId,
   workspaceId,
}) => (
   <>
      {/* Nombre del registrador */}
      <div className="config-agente-rele-nombre">
         <label>Nombre del Registrador</label>
         <input
            type="text"
            value={nuevoRegistrador.nombre}
            onChange={(e) => setNuevoRegistrador((prev) => ({ ...prev, nombre: e.target.value }))}
            placeholder="Ej: Analizador Trafo 1"
            disabled={guardandoRegistrador}
         />
      </div>
      <ConfiguracionAnalizador
         configuracionInicial={nuevoRegistrador.configuracionAnalizador}
         onChange={(config) =>
            setNuevoRegistrador((prev) => ({
               ...prev,
               configuracionAnalizador: config,
            }))
         }
         agenteId={agenteId}
         workspaceId={workspaceId}
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
                  !nuevoRegistrador.configuracionAnalizador
               }
            >
               {guardandoRegistrador ? "Guardando..." : registradorEditando ? "Guardar" : "Crear"}
            </button>
         </div>
      </div>
   </>
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
   workspaceId,
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
         workspaceId={workspaceId}
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
 * @param {string} props.workspaceId - ID del workspace
 * @param {Object} props.nuevoRegistrador - Estado del formulario
 * @param {Function} props.setNuevoRegistrador - Setter del estado
 * @param {Object|null} props.registradorEditando - Registrador en edición
 * @param {boolean} props.guardandoRegistrador - Si está guardando
 * @param {Function} props.onSubmit - Callback al enviar
 * @param {Function} props.onCancelar - Callback para cancelar
 */
export function FormularioRegistrador({
   agenteId,
   workspaceId,
   nuevoRegistrador,
   setNuevoRegistrador,
   registradorEditando,
   guardandoRegistrador,
   onSubmit,
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
                     configuracionAnalizador: e.target.value === "rele" ? null : prev.configuracionAnalizador,
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
               onCancelar={onCancelar}
               registradorEditando={registradorEditando}
               agenteId={agenteId}
               workspaceId={workspaceId}
            />
         ) : (
            <FormularioRele
               nuevoRegistrador={nuevoRegistrador}
               setNuevoRegistrador={setNuevoRegistrador}
               guardandoRegistrador={guardandoRegistrador}
               onCancelar={onCancelar}
               registradorEditando={registradorEditando}
               agenteId={agenteId}
               workspaceId={workspaceId}
            />
         )}
      </form>
   );
}
