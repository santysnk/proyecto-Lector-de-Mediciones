// componentes/historial/EstadisticasHistorial.jsx
// Barra de estadísticas del historial con botones de exportación

/**
 * Muestra estadísticas (puntos, min, max, promedio) y botones de exportación
 * @param {Object} props
 * @param {Object|null} props.estadisticas - Estadísticas calculadas
 * @param {Function} props.onExportarCSV - Handler para exportar CSV
 * @param {Function} props.onAbrirInforme - Handler para abrir modal de informe
 * @param {boolean} props.datosDisponibles - Si hay datos para exportar
 */
const EstadisticasHistorial = ({
   estadisticas,
   onExportarCSV,
   onAbrirInforme,
   datosDisponibles,
}) => {
   if (!estadisticas) return null;

   return (
      <div className="ventana-stats">
         <span className="ventana-stat">
            <b>Puntos:</b>
            <input
               type="text"
               className="ventana-stat-input"
               value={estadisticas.puntos}
               size={String(estadisticas.puntos).length || 1}
               readOnly
            />
         </span>

         <span className="ventana-stat">
            <b>Mín:</b>
            <input
               type="text"
               className="ventana-stat-input"
               value={estadisticas.min}
               size={estadisticas.min.length || 1}
               readOnly
            />
            {estadisticas.minFecha && (
               <span className="ventana-stat-fecha">({estadisticas.minFecha})</span>
            )}
         </span>

         <span className="ventana-stat">
            <b>Máx:</b>
            <input
               type="text"
               className="ventana-stat-input"
               value={estadisticas.max}
               size={estadisticas.max.length || 1}
               readOnly
            />
            {estadisticas.maxFecha && (
               <span className="ventana-stat-fecha">({estadisticas.maxFecha})</span>
            )}
         </span>

         <span className="ventana-stat">
            <b>Prom:</b>
            <input
               type="text"
               className="ventana-stat-input"
               value={estadisticas.promedio}
               size={estadisticas.promedio.length || 1}
               readOnly
            />
         </span>

         <button
            type="button"
            className="ventana-btn-exportar ventana-btn--desktop-only"
            onClick={onExportarCSV}
            disabled={!datosDisponibles}
         >
            CSV
         </button>

         <button
            type="button"
            className="ventana-btn-exportar ventana-btn-informe ventana-btn--desktop-only"
            onClick={onAbrirInforme}
            disabled={!datosDisponibles}
         >
            Informe
         </button>
      </div>
   );
};

export default EstadisticasHistorial;
