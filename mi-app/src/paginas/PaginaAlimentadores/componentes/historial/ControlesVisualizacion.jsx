/**
 * Controles de visualización: Tabs de medición, Rango de tiempo, Selector de fechas, Tipo de gráfico
 */

import { RANGOS_TIEMPO, TIPOS_GRAFICO } from "../../constantes/historialConfig";
import { MODOS_HISTORIAL } from "../../constantes/funcionalidadesRele";
import SelectorFecha from "../../../../componentes/comunes/SelectorFecha";

const ControlesVisualizacion = ({
   tabsMedicion = [],
   indiceMedicionSeleccionado = 0,
   onMedicionChange,
   modoVisualizacion = MODOS_HISTORIAL.INDIVIDUAL,
   rangoSeleccionado,
   onRangoChange,
   fechaRangoDesde,
   fechaRangoHasta,
   onFechaRangoChange,
   tipoGrafico,
   onTipoGraficoChange,
}) => {
   const mostrarTabsMedicion = tabsMedicion.length > 1 && modoVisualizacion !== MODOS_HISTORIAL.BITS;
   const mostrarTipoGrafico = modoVisualizacion !== MODOS_HISTORIAL.BITS;

   return (
      <>
         {/* Selector de Medición específica */}
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
      </>
   );
};

export default ControlesVisualizacion;
