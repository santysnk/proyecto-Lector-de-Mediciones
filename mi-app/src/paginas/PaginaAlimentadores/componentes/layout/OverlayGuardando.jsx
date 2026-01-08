// componentes/layout/OverlayGuardando.jsx
// Overlay de guardando cambios

import ReactDOM from "react-dom";

/**
 * Overlay que se muestra mientras se guardan cambios
 * @param {Object} props
 * @param {boolean} props.visible - Si mostrar el overlay
 * @param {string} props.texto - Texto a mostrar (default: "Guardando cambios...")
 */
const OverlayGuardando = ({ visible, texto = "Guardando cambios..." }) => {
   if (!visible) return null;

   return ReactDOM.createPortal(
      <div className="guardar-overlay">
         <div className="guardar-overlay__contenido">
            <div className="guardar-overlay__spinner" />
            <span className="guardar-overlay__texto">{texto}</span>
         </div>
      </div>,
      document.body
   );
};

export default OverlayGuardando;
