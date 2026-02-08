/**
 * Indicadores de cache y fuente de datos: toggle gráfico, barra de progreso, fuente, limpiar
 */

const IndicadoresCache = ({
   graficoVisible = true,
   onToggleGrafico,
   precargaProgreso = 0,
   precargaCompleta = false,
   precargando = false,
   fuenteDatos = null,
   onLimpiarCache,
}) => {
   return (
      <div className="ventana-cache">
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
   );
};

export default IndicadoresCache;
