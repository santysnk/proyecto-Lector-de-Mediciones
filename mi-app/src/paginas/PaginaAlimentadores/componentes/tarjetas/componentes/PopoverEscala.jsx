// componentes/tarjetas/componentes/PopoverEscala.jsx
// Popover para controlar la escala de una tarjeta

import { createPortal } from "react-dom";

/**
 * Popover para controlar la escala de una tarjeta
 *
 * @param {Object} props
 * @param {React.Ref} props.popoverRef - Ref del popover
 * @param {Object} props.posicion - Posición { top, left } del popover
 * @param {string} props.valorInput - Valor actual del input
 * @param {number} props.escalaMin - Escala mínima
 * @param {number} props.escalaMax - Escala máxima
 * @param {Function} props.onInputChange - Handler para cambio de input
 * @param {Function} props.onKeyDown - Handler para teclas
 * @param {Function} props.onIncrementar - Handler para incrementar
 * @param {Function} props.onDecrementar - Handler para decrementar
 * @param {Function} props.onResetear - Handler para resetear
 */
export function PopoverEscala({
   popoverRef,
   posicion,
   valorInput,
   escalaMin,
   escalaMax,
   onInputChange,
   onKeyDown,
   onIncrementar,
   onDecrementar,
   onResetear,
}) {
   return createPortal(
      <div
         ref={popoverRef}
         className="alim-card-scale-popover"
         style={{ top: `${posicion.top}px`, left: `${posicion.left}px` }}
         onClick={(e) => e.stopPropagation()}
         onMouseDown={(e) => e.stopPropagation()}
      >
         <label className="alim-card-scale-label">
            Escala ({escalaMin} - {escalaMax})
         </label>
         <div className="alim-card-scale-controls">
            <button
               type="button"
               className="alim-card-scale-pm-btn"
               onClick={onDecrementar}
               disabled={parseFloat(valorInput) <= escalaMin}
               title="Reducir escala"
            >
               -
            </button>
            <input
               type="number"
               step="0.01"
               min={escalaMin}
               max={escalaMax}
               value={valorInput}
               onChange={onInputChange}
               onKeyDown={onKeyDown}
               className="alim-card-scale-input"
               autoFocus
            />
            <button
               type="button"
               className="alim-card-scale-pm-btn"
               onClick={onIncrementar}
               disabled={parseFloat(valorInput) >= escalaMax}
               title="Aumentar escala"
            >
               +
            </button>
         </div>
         <div className="alim-card-scale-actions">
            <button type="button" className="alim-card-scale-reset" onClick={onResetear}>
               Reset (1.0)
            </button>
         </div>
      </div>,
      document.body
   );
}
