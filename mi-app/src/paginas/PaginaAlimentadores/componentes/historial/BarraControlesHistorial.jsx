/**
 * Barra de controles para la ventana de historial
 * REDISEÑADO: Usa selectores de funcionalidad y tabsMedicion según modo
 */

import PropTypes from "prop-types";
import { RANGOS_TIEMPO, TIPOS_GRAFICO } from "../../constantes/historialConfig";
import { MODOS_HISTORIAL } from "../../constantes/funcionalidadesRele";
import SelectorFecha from "../../../../componentes/comunes/SelectorFecha";

// Nombres de categorías para mostrar
const NOMBRES_CATEGORIAS = {
   mediciones: "📊 Mediciones",
   estados: "🚦 Estados",
   alarmas: "⚠️ Alarmas",
   sistema: "⚙️ Sistema",
   otros: "📋 Otros",
};

const BarraControlesHistorial = ({
   panelDatosAbierto,
   onTogglePanel,
   // Registradores
   registradoresUnicos = [],
   registradorSeleccionadoId,
   onRegistradorChange,
   // Funcionalidades
   funcionalidades = [],
   funcionalidadesPorCategoria = {},
   funcionalidadSeleccionadaId,
   onFuncionalidadChange,
   cargandoFuncionalidades = false,
   // Medición específica (tabsMedicion viene del hook)
   tabsMedicion = [],
   indiceMedicionSeleccionado = 0,
   onMedicionChange,
   // Modo de visualización (del hook)
   modoVisualizacion = MODOS_HISTORIAL.INDIVIDUAL,
   // Rango
   rangoSeleccionado,
   onRangoChange,
   fechaRangoDesde,
   fechaRangoHasta,
   onFechaRangoChange,
   tipoGrafico,
   onTipoGraficoChange,
   alimentadorId,
   alimentadores,
   onAlimentadorChange,
   precargaProgreso,
   precargaCompleta,
   precargando,
   fuenteDatos,
   onLimpiarCache,
   graficoVisible,
   onToggleGrafico,
}) => {
   // Mostrar tabs si hay más de uno y no es modo bits
   const mostrarTabsMedicion = tabsMedicion.length > 1 && modoVisualizacion !== MODOS_HISTORIAL.BITS;
   // Ocultar controles de tipo de gráfico en modo bits
   const mostrarTipoGrafico = modoVisualizacion !== MODOS_HISTORIAL.BITS;

   return (
      <div className="ventana-controles">
         {/* Boton toggle para panel de datos */}
         <button
            type="button"
            className={`ventana-toggle-datos ${panelDatosAbierto ? "ventana-toggle-datos--activo" : ""}`}
            onClick={onTogglePanel}
            title={panelDatosAbierto ? "Ocultar datos" : "Ver datos"}
         >
            <span className="ventana-toggle-icono">▲</span>
         </button>

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

         {/* Selector de Medición específica (según tabsMedicion del hook) */}
         {mostrarTabsMedicion && (
            <div className="ventana-selector-medicion">
               <div className="ventana-tabs ventana-tabs--medicion">
                  {tabsMedicion.map((tab) => (
                     <button
                        key={tab.indice}
                        type="button"
                        className={`ventana-tab ventana-tab--medicion ${indiceMedicionSeleccionado === tab.indice ? "ventana-tab--activo" : ""}`}
                        onClick={() => onMedicionChange(tab.indice)}
                        title={tab.etiqueta}
                     >
                        {tab.etiqueta}
                     </button>
                  ))}
               </div>
            </div>
         )}

         {/* Selector de rango */}
         <div className="ventana-rango">
            {RANGOS_TIEMPO.filter((r) => r.id !== "custom").map((r) => (
               <button
                  key={r.id}
                  type="button"
                  className={`ventana-rango-btn ${rangoSeleccionado === r.id && !fechaRangoDesde ? "ventana-rango-btn--activo" : ""}`}
                  onClick={() => onRangoChange(r.id)}
               >
                  {r.label}
               </button>
            ))}
         </div>

         {/* Grupo: Selector de fechas + Tipo de gráfico */}
         <div className="ventana-grupo-graficos">
            {/* Selector de rango de fechas */}
            <div className="ventana-selector-dia">
               <SelectorFecha
                  value={fechaRangoDesde}
                  valueHasta={fechaRangoHasta}
                  modoRango={true}
                  onChange={() => {}}
                  onChangeRango={onFechaRangoChange}
                  minDate={null}
                  maxDate={new Date()}
                  placeholder="Seleccionar fechas"
               />
               {fechaRangoDesde && fechaRangoHasta && (
                  <span className="ventana-dia-seleccionado">
                     {new Date(fechaRangoDesde).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                     })}
                     {fechaRangoDesde.getTime() !== fechaRangoHasta.getTime() && (
                        <>
                           {" "}
                           -{" "}
                           {new Date(fechaRangoHasta).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                           })}
                        </>
                     )}
                  </span>
               )}
            </div>

            {/* Selector de tipo de grafico (oculto en modo bits) */}
            {mostrarTipoGrafico && (
               <div className="ventana-tipo-grafico">
                  {TIPOS_GRAFICO.map((tipo) => (
                     <button
                        key={tipo.id}
                        type="button"
                        className={`ventana-tipo-btn ${tipoGrafico === tipo.id ? "ventana-tipo-btn--activo" : ""}`}
                        onClick={() => onTipoGraficoChange(tipo.id)}
                        title={tipo.label}
                     >
                        {tipo.icon}
                     </button>
                  ))}
               </div>
            )}
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

         {/* Cache + Fuente */}
         <div className="ventana-cache">
            {/* Botón toggle gráfico - solo visible en móvil portrait */}
            <button
               type="button"
               className={`ventana-toggle-grafico ${graficoVisible ? "" : "ventana-toggle-grafico--cerrado"}`}
               onClick={onToggleGrafico}
               title={graficoVisible ? "Ocultar gráfico" : "Mostrar gráfico"}
            >
               <span className="ventana-toggle-grafico-icono">▼</span>
            </button>
            <div className="ventana-cache-barra">
               <div
                  className={`ventana-cache-progreso ${precargaCompleta ? "ventana-cache-progreso--completo" : ""}`}
                  style={{ width: `${precargaProgreso}%` }}
               />
            </div>
            <span className="ventana-cache-texto">
               {precargaCompleta ? "✓" : `${precargaProgreso}%`}
            </span>
            {fuenteDatos && (
               <span className={`ventana-fuente ventana-fuente--${fuenteDatos}`}>
                  {fuenteDatos === "local" ? "Local" : fuenteDatos === "remoto" ? "BD" : "Mixto"}
               </span>
            )}
            <button
               type="button"
               className="ventana-btn-limpiar"
               onClick={onLimpiarCache}
               disabled={precargando}
               title="Limpiar cache"
            >
               🗑
            </button>
         </div>
      </div>
   );
};

BarraControlesHistorial.propTypes = {
   panelDatosAbierto: PropTypes.bool.isRequired,
   onTogglePanel: PropTypes.func.isRequired,
   // Registradores
   registradoresUnicos: PropTypes.array,
   registradorSeleccionadoId: PropTypes.string,
   onRegistradorChange: PropTypes.func,
   // Funcionalidades
   funcionalidades: PropTypes.array,
   funcionalidadesPorCategoria: PropTypes.object,
   funcionalidadSeleccionadaId: PropTypes.string,
   onFuncionalidadChange: PropTypes.func,
   cargandoFuncionalidades: PropTypes.bool,
   // Medición específica (tabsMedicion del hook)
   tabsMedicion: PropTypes.arrayOf(
      PropTypes.shape({
         indice: PropTypes.number.isRequired,
         etiqueta: PropTypes.string.isRequired,
      })
   ),
   indiceMedicionSeleccionado: PropTypes.number,
   onMedicionChange: PropTypes.func,
   // Modo de visualización
   modoVisualizacion: PropTypes.oneOf(["individual", "fases", "combinar32bits", "bits"]),
   // Rango
   rangoSeleccionado: PropTypes.string.isRequired,
   onRangoChange: PropTypes.func.isRequired,
   fechaRangoDesde: PropTypes.instanceOf(Date),
   fechaRangoHasta: PropTypes.instanceOf(Date),
   onFechaRangoChange: PropTypes.func.isRequired,
   tipoGrafico: PropTypes.oneOf(["line", "area", "bar"]).isRequired,
   onTipoGraficoChange: PropTypes.func.isRequired,
   alimentadorId: PropTypes.string,
   alimentadores: PropTypes.array,
   onAlimentadorChange: PropTypes.func,
   precargaProgreso: PropTypes.number,
   precargaCompleta: PropTypes.bool,
   precargando: PropTypes.bool,
   fuenteDatos: PropTypes.oneOf(["local", "remoto", "mixto", null]),
   onLimpiarCache: PropTypes.func.isRequired,
   graficoVisible: PropTypes.bool,
   onToggleGrafico: PropTypes.func,
};

BarraControlesHistorial.defaultProps = {
   registradoresUnicos: [],
   registradorSeleccionadoId: null,
   onRegistradorChange: () => {},
   funcionalidades: [],
   funcionalidadesPorCategoria: {},
   funcionalidadSeleccionadaId: null,
   onFuncionalidadChange: () => {},
   cargandoFuncionalidades: false,
   // Medición específica
   tabsMedicion: [],
   indiceMedicionSeleccionado: 0,
   onMedicionChange: () => {},
   modoVisualizacion: "individual",
   // Otros
   fechaRangoDesde: null,
   fechaRangoHasta: null,
   alimentadorId: "",
   alimentadores: [],
   onAlimentadorChange: () => {},
   precargaProgreso: 0,
   precargaCompleta: false,
   precargando: false,
   fuenteDatos: null,
   graficoVisible: true,
   onToggleGrafico: () => {},
};

export default BarraControlesHistorial;
