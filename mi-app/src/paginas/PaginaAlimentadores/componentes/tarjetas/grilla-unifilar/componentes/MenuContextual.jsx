// componentes/MenuContextual.jsx
// Menú contextual para copiar/pegar/eliminar texto

import React from "react";

/**
 * Icono de copiar
 */
const IconoCopiar = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
   </svg>
);

/**
 * Icono de pegar
 */
const IconoPegar = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/>
   </svg>
);

/**
 * Icono de eliminar
 */
const IconoEliminar = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
   </svg>
);

/**
 * Componente de menú contextual
 * @param {Object} props - Propiedades del componente
 */
export function MenuContextual({
   visible,
   x,
   y,
   hayTextoEnPosicion,
   textoCopiado,
   onCopiar,
   onPegar,
   onEliminar
}) {
   if (!visible) return null;

   return (
      <div
         className="grilla-unifilar__menu-contextual"
         style={{ left: x, top: y }}
         onClick={(e) => e.stopPropagation()}
         onContextMenu={(e) => e.preventDefault()}
      >
         <button
            type="button"
            className={`grilla-unifilar__menu-item ${!hayTextoEnPosicion ? "grilla-unifilar__menu-item--disabled" : ""}`}
            onClick={onCopiar}
            disabled={!hayTextoEnPosicion}
         >
            <IconoCopiar />
            <span>Copiar</span>
            <span className="grilla-unifilar__menu-shortcut">Ctrl+C</span>
         </button>

         <button
            type="button"
            className={`grilla-unifilar__menu-item ${!textoCopiado ? "grilla-unifilar__menu-item--disabled" : ""}`}
            onClick={onPegar}
            disabled={!textoCopiado}
         >
            <IconoPegar />
            <span>Pegar</span>
            <span className="grilla-unifilar__menu-shortcut">Ctrl+V</span>
         </button>

         {hayTextoEnPosicion && (
            <div className="grilla-unifilar__menu-separator" />
         )}

         <button
            type="button"
            className={`grilla-unifilar__menu-item grilla-unifilar__menu-item--eliminar ${!hayTextoEnPosicion ? "grilla-unifilar__menu-item--disabled" : ""}`}
            onClick={onEliminar}
            disabled={!hayTextoEnPosicion}
         >
            <IconoEliminar />
            <span>Eliminar</span>
            <span className="grilla-unifilar__menu-shortcut">Delete</span>
         </button>
      </div>
   );
}
