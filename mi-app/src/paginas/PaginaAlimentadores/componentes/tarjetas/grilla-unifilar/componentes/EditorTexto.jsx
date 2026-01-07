// componentes/EditorTexto.jsx
// Editor de texto flotante con redimensionamiento

import React from "react";

/**
 * Icono de check
 */
const IconoCheck = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
   </svg>
);

/**
 * Icono de undo
 */
const IconoUndo = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
   </svg>
);

/**
 * Icono de cerrar
 */
const IconoCerrar = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
   </svg>
);

/**
 * Componente de editor de texto
 * @param {Object} props - Propiedades del componente
 */
export function EditorTexto({
   visible,
   x,
   y,
   valor,
   ancho,
   alto,
   editandoId,
   configTexto,
   colorSeleccionado,
   textareaRef,
   onCambiarValor,
   onKeyDown,
   onConfirmar,
   onCancelar,
   onIniciarRedimension
}) {
   if (!visible) return null;

   return (
      <div
         className="grilla-unifilar__input-texto"
         style={{ left: x, top: y }}
      >
         <div className="grilla-unifilar__input-wrapper">
            <div
               className="grilla-unifilar__textarea-container"
               style={{ width: ancho, height: alto }}
            >
               <textarea
                  ref={textareaRef}
                  autoFocus
                  value={valor}
                  onChange={(e) => onCambiarValor(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Escribir texto... (Alt+Enter para nueva línea)"
                  style={{
                     fontFamily: configTexto.fuente,
                     fontSize: `${configTexto.tamano}px`,
                     fontWeight: configTexto.negrita ? "bold" : "normal",
                     fontStyle: configTexto.cursiva ? "italic" : "normal",
                     color: colorSeleccionado,
                  }}
               />

               {/* Handles de redimensionamiento - Esquinas */}
               <div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--nw" onMouseDown={(e) => onIniciarRedimension(e, "nw")} />
               <div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--ne" onMouseDown={(e) => onIniciarRedimension(e, "ne")} />
               <div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--sw" onMouseDown={(e) => onIniciarRedimension(e, "sw")} />
               <div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--se" onMouseDown={(e) => onIniciarRedimension(e, "se")} />

               {/* Handles de redimensionamiento - Lados */}
               <div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--n" onMouseDown={(e) => onIniciarRedimension(e, "n")} />
               <div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--s" onMouseDown={(e) => onIniciarRedimension(e, "s")} />
               <div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--e" onMouseDown={(e) => onIniciarRedimension(e, "e")} />
               <div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--w" onMouseDown={(e) => onIniciarRedimension(e, "w")} />
            </div>

            {/* Botones de acción */}
            <div className="grilla-unifilar__input-acciones">
               <button
                  type="button"
                  className="grilla-unifilar__input-btn grilla-unifilar__input-btn--aceptar"
                  onClick={onConfirmar}
                  title="Aceptar (Enter)"
               >
                  <IconoCheck />
               </button>

               <button
                  type="button"
                  className={`grilla-unifilar__input-btn ${editandoId ? "grilla-unifilar__input-btn--volver" : "grilla-unifilar__input-btn--cerrar"}`}
                  onClick={onCancelar}
                  title={editandoId ? "Volver (Esc)" : "Cerrar (Esc)"}
               >
                  {editandoId ? <IconoUndo /> : <IconoCerrar />}
               </button>
            </div>
         </div>
      </div>
   );
}
