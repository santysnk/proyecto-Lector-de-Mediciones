// componentes/layout/OverlayConexion.jsx
// Overlay de problema de conexión

/**
 * Overlay que se muestra cuando hay problema de conexión
 * @param {Object} props
 * @param {boolean} props.visible - Si mostrar el overlay
 */
const OverlayConexion = ({ visible }) => {
   if (!visible) return null;

   return (
      <div className="alim-overlay-conexion">
         <div className="alim-overlay-conexion__contenido">
            <span className="alim-overlay-conexion__icono">⚠</span>
            <span className="alim-overlay-conexion__titulo">SIN CONEXIÓN</span>
            <span className="alim-overlay-conexion__texto">
               No se pueden obtener lecturas del servidor
            </span>
         </div>
      </div>
   );
};

export default OverlayConexion;
