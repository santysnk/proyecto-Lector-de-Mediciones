// componentes/tarjetas/componentes/MenuFlotante.jsx
// Menú flotante desplegable para acciones de tarjeta

import { createPortal } from "react-dom";
import configIcon from "../../../../../assets/imagenes/Config_Icon.png";

/**
 * Menú flotante desplegable con acciones de la tarjeta
 *
 * @param {Object} props
 * @param {React.Ref} props.menuRef - Ref del menú
 * @param {Object} props.posicion - Posición { top, left, width } del menú
 * @param {Function} props.onConfigClick - Callback para configuración
 * @param {Function} props.onHistorialClick - Callback para historial
 * @param {boolean} props.esObservador - Si el usuario es observador (oculta historial)
 * @param {Function} props.onCerrar - Callback para cerrar el menú
 */
export function MenuFlotante({
   menuRef,
   posicion,
   onConfigClick,
   onHistorialClick,
   esObservador,
   onCerrar,
}) {
   return createPortal(
      <div
         ref={menuRef}
         className="alim-card-menu-flotante"
         style={{
            top: `${posicion.top}px`,
            left: `${posicion.left}px`,
            width: `${posicion.width}px`,
         }}
         onClick={(e) => e.stopPropagation()}
         onMouseDown={(e) => e.stopPropagation()}
      >
         <div className="alim-card-menu-flotante-content">
            {/* Botón de configuración */}
            <button
               type="button"
               className="alim-card-menu-flotante-btn"
               onClick={(e) => {
                  e.stopPropagation();
                  onCerrar();
                  onConfigClick?.();
               }}
               title="Configurar registrador"
            >
               <img
                  src={configIcon}
                  alt="Configurar"
                  className="alim-card-menu-flotante-icon"
               />
            </button>

            {/* Botón de historial/estadísticas (oculto para observadores) */}
            {onHistorialClick && !esObservador && (
               <button
                  type="button"
                  className="alim-card-menu-flotante-btn"
                  onClick={(e) => {
                     e.stopPropagation();
                     onCerrar();
                     onHistorialClick();
                  }}
                  title="Ver historial de lecturas"
               >
                  <span className="alim-card-menu-flotante-emoji">📈</span>
               </button>
            )}
         </div>
      </div>,
      document.body
   );
}
