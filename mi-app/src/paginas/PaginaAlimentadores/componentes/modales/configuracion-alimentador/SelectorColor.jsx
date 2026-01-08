/**
 * Componente selector de color con picker personalizado
 */

import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { COLORES_SISTEMA } from "../../../constantes/colores";

const SelectorColor = ({ color, onChange }) => {
   const [mostrarPicker, setMostrarPicker] = useState(false);
   const [colorPersonalizado, setColorPersonalizado] = useState("#ff6b6b");
   const [valorHex, setValorHex] = useState("#ff6b6b");
   const pickerRef = useRef(null);
   const pickerBtnRef = useRef(null);

   const esColorPersonalizado = !COLORES_SISTEMA.includes(color);

   // Cerrar picker al hacer click fuera
   useEffect(() => {
      const handleClickOutside = (event) => {
         if (
            pickerRef.current &&
            !pickerRef.current.contains(event.target) &&
            pickerBtnRef.current &&
            !pickerBtnRef.current.contains(event.target)
         ) {
            setMostrarPicker(false);
         }
      };

      if (mostrarPicker) {
         document.addEventListener("mousedown", handleClickOutside);
      }
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, [mostrarPicker]);

   const handleHexInputChange = (e) => {
      const valor = e.target.value;
      setValorHex(valor);
      if (/^#[0-9A-Fa-f]{6}$/.test(valor)) {
         onChange(valor);
         setColorPersonalizado(valor);
      }
   };

   const copiarColor = () => {
      navigator.clipboard.writeText(color);
   };

   return (
      <>
         <div className="alim-color-grid">
            {COLORES_SISTEMA.map((c) => (
               <button
                  key={c}
                  type="button"
                  className={`alim-color-swatch ${color === c ? "alim-color-swatch-selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                     onChange(c);
                     setMostrarPicker(false);
                  }}
                  aria-label={`Elegir color ${c}`}
               />
            ))}
            {/* Botón color personalizado */}
            <button
               ref={pickerBtnRef}
               type="button"
               className={`alim-color-swatch alim-color-custom ${esColorPersonalizado ? "alim-color-swatch-selected" : ""}`}
               onClick={() => {
                  setMostrarPicker(!mostrarPicker);
                  if (!mostrarPicker) {
                     setValorHex(color);
                  }
               }}
               aria-label="Color personalizado"
            />
            {/* Preview del color seleccionado */}
            <div className="alim-color-preview" style={{ backgroundColor: color }} title={color}>
               <span className="alim-color-preview-text">COLOR</span>
            </div>
         </div>

         {/* Picker flotante */}
         {mostrarPicker && (
            <div ref={pickerRef} className="color-picker-simple-popover alim-color-picker-popover">
               <HexColorPicker
                  color={color}
                  onChange={(nuevoColor) => {
                     onChange(nuevoColor);
                     setColorPersonalizado(nuevoColor);
                     setValorHex(nuevoColor);
                  }}
               />
               <div className="color-picker-hex-input-wrapper">
                  <input
                     type="text"
                     value={valorHex}
                     onChange={handleHexInputChange}
                     className="color-picker-hex-input"
                     placeholder="#000000"
                     maxLength={7}
                  />
                  <button type="button" className="color-picker-copy-btn" onClick={copiarColor} title="Copiar color">
                     📋
                  </button>
               </div>
            </div>
         )}
      </>
   );
};

export default SelectorColor;
