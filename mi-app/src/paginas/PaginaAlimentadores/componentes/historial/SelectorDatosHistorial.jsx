/**
 * Selectores de datos: Registrador, Funcionalidad y Alimentador
 */

const NOMBRES_CATEGORIAS = {
   mediciones: "📊 Mediciones",
   estados: "🚦 Estados",
   alarmas: "⚠️ Alarmas",
   sistema: "⚙️ Sistema",
   otros: "📋 Otros",
};

const SelectorDatosHistorial = ({
   registradoresUnicos = [],
   registradorSeleccionadoId,
   onRegistradorChange,
   funcionalidades = [],
   funcionalidadesPorCategoria = {},
   funcionalidadSeleccionadaId,
   onFuncionalidadChange,
   cargandoFuncionalidades = false,
   alimentadorId,
   alimentadores = [],
   onAlimentadorChange,
}) => {
   return (
      <>
         {/* Selector de Registrador (solo si hay más de uno) */}
         {registradoresUnicos.length > 1 && (
            <div className="ventana-selector-registrador">
               <select
                  className="ventana-select ventana-select--registrador"
                  value={registradorSeleccionadoId || ""}
                  onChange={(e) => onRegistradorChange(e.target.value)}
                  title="Seleccionar registrador"
               >
                  {registradoresUnicos.map((reg) => (
                     <option key={reg.id} value={reg.id}>
                        {reg.zona ? `Zona ${reg.zona}` : "Principal"}
                     </option>
                  ))}
               </select>
            </div>
         )}

         {/* Selector de Funcionalidad */}
         <div className="ventana-selector-funcionalidad">
            <select
               className="ventana-select ventana-select--funcionalidad"
               value={funcionalidadSeleccionadaId || ""}
               onChange={(e) => onFuncionalidadChange(e.target.value)}
               disabled={cargandoFuncionalidades || funcionalidades.length === 0}
               title="Seleccionar medición"
            >
               {cargandoFuncionalidades ? (
                  <option value="">Cargando...</option>
               ) : funcionalidades.length === 0 ? (
                  <option value="">Sin funcionalidades</option>
               ) : (
                  Object.entries(funcionalidadesPorCategoria).map(([categoria, funcs]) => (
                     <optgroup key={categoria} label={NOMBRES_CATEGORIAS[categoria] || categoria}>
                        {funcs.map((f) => (
                           <option key={f.id} value={f.id}>
                              {f.nombre}
                           </option>
                        ))}
                     </optgroup>
                  ))
               )}
            </select>
         </div>

         {/* Selector de alimentador */}
         {alimentadores && alimentadores.length > 1 && (
            <div className="ventana-selector-alimentador-container">
               <select
                  className="ventana-selector-alimentador"
                  value={alimentadorId}
                  onChange={(e) => onAlimentadorChange(e.target.value)}
                  title="Cambiar alimentador"
               >
                  {alimentadores.map((alim) => (
                     <option key={alim.id} value={alim.id}>
                        {alim.nombre}
                     </option>
                  ))}
               </select>
            </div>
         )}
      </>
   );
};

export default SelectorDatosHistorial;
