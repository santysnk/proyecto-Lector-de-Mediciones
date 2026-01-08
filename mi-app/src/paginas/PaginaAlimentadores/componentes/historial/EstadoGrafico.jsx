// componentes/historial/EstadoGrafico.jsx
// Componente que muestra estados de carga/error/vacío del gráfico

/**
 * Renderiza estados de carga, error o sin datos del gráfico
 * @param {Object} props
 * @param {boolean} props.cargando - Si está cargando
 * @param {string|null} props.error - Mensaje de error
 * @param {boolean} props.precargando - Si está precargando datos
 * @param {number} props.datosLength - Cantidad de datos
 * @param {Function} props.onReintentar - Callback para reintentar carga
 * @param {React.ReactNode} props.children - Gráfico a renderizar cuando hay datos
 */
const EstadoGrafico = ({
   cargando,
   error,
   precargando,
   datosLength,
   onReintentar,
   children,
}) => {
   if (cargando) {
      return (
         <div className="ventana-estado">
            <div className="ventana-spinner" />
            <span>Cargando...</span>
         </div>
      );
   }

   if (error) {
      return (
         <div className="ventana-estado ventana-estado--error">
            <span>Error: {error}</span>
            <button onClick={onReintentar}>Reintentar</button>
         </div>
      );
   }

   if (precargando && datosLength === 0) {
      return (
         <div className="ventana-estado">
            <div className="ventana-spinner" />
            <span>Descargando datos de la base de datos...</span>
         </div>
      );
   }

   if (datosLength === 0) {
      return (
         <div className="ventana-estado">
            <span>No hay datos en el período seleccionado</span>
         </div>
      );
   }

   return children;
};

export default EstadoGrafico;
