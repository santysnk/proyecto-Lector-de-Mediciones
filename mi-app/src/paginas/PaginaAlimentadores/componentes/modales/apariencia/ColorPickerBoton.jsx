// componentes/modales/apariencia/ColorPickerBoton.jsx
// Botón de color con popover usando react-colorful

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";

/**
 * Botón de color con popover usando react-colorful
 *
 * @param {Object} props
 * @param {string} props.color - Color actual en formato hex (#RRGGBB)
 * @param {Function} props.onChange - Callback cuando cambia el color
 */
export function ColorPickerBoton({ color, onChange }) {
   const [abierto, setAbierto] = useState(false);
   const [posicion, setPosicion] = useState({ top: 0, left: 0 });
   const [valorHex, setValorHex] = useState(color);
   const pickerRef = useRef(null);
   const buttonRef = useRef(null);

   // Sincronizar valor cuando cambia el color externo
   useEffect(() => {
      setValorHex(color);
   }, [color]);

   // Calcular posición del picker al abrirlo
   const togglePicker = (e) => {
      e.stopPropagation();
      if (abierto) {
         setAbierto(false);
         return;
      }

      if (buttonRef.current) {
         const rect = buttonRef.current.getBoundingClientRect();
         const alturaPopover = 260;
         const anchoPopover = 240;

         // Calcular posición vertical (preferir abajo)
         let top = rect.bottom + 8;
         if (top + alturaPopover > window.innerHeight - 10) {
            top = rect.top - alturaPopover - 8;
         }

         // Calcular posición horizontal centrada
         let left = rect.left + rect.width / 2 - anchoPopover / 2;
         if (left < 10) left = 10;
         if (left + anchoPopover > window.innerWidth - 10) {
            left = window.innerWidth - anchoPopover - 10;
         }

         setPosicion({ top, left });
         setAbierto(true);
      }
   };

   // Cerrar al hacer clic fuera
   useEffect(() => {
      if (!abierto) return;
      const handleClickFuera = (e) => {
         if (
            pickerRef.current &&
            !pickerRef.current.contains(e.target) &&
            buttonRef.current &&
            !buttonRef.current.contains(e.target)
         ) {
            setAbierto(false);
         }
      };
      const timeoutId = setTimeout(() => {
         document.addEventListener("mousedown", handleClickFuera);
      }, 10);
      return () => {
         clearTimeout(timeoutId);
         document.removeEventListener("mousedown", handleClickFuera);
      };
   }, [abierto]);

   const handleColorChange = (nuevoColor) => {
      setValorHex(nuevoColor);
      onChange(nuevoColor);
   };

   const handleInputChange = (e) => {
      const valor = e.target.value;
      setValorHex(valor);
      if (/^#[0-9A-Fa-f]{6}$/.test(valor)) {
         onChange(valor);
      }
   };

   return (
      <div className="apariencia-colorpicker-wrapper">
         <button
            ref={buttonRef}
            type="button"
            className="apariencia-color-picker-btn"
            style={{ backgroundColor: color }}
            onClick={togglePicker}
            title="Color personalizado"
         />
         {abierto &&
            createPortal(
               <div
                  ref={pickerRef}
                  className="apariencia-colorpicker-popover"
                  style={{ top: `${posicion.top}px`, left: `${posicion.left}px` }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
               >
                  <HexColorPicker color={color} onChange={handleColorChange} />
                  <div className="apariencia-colorpicker-input-row">
                     <input
                        type="text"
                        value={valorHex}
                        onChange={handleInputChange}
                        className="apariencia-colorpicker-hex-input"
                        placeholder="#000000"
                        maxLength={7}
                     />
                     <button
                        type="button"
                        className="apariencia-colorpicker-copy-btn"
                        onClick={() => navigator.clipboard.writeText(valorHex)}
                        title="Copiar color"
                     >
                        📋
                     </button>
                  </div>
               </div>,
               document.body
            )}
      </div>
   );
}
