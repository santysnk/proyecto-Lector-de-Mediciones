import React from "react";
import { COLORES_SISTEMA } from "../../../constantes/colores";
import "./FormularioDatosBasicos.css";

/**
 * Formulario de datos básicos del alimentador
 * Nombre y color (el periodo quede en las pestañas técnica)
 */
const FormularioDatosBasicos = ({ nombre, color, onChange }) => {
   return (
      <div className="alim-form-basicos">
         <label className="alim-modal-label" htmlFor="nombre-alimentador">
            Nombre del Alimentador
            <input
               id="nombre-alimentador"
               type="text"
               className="alim-modal-input"
               value={nombre}
               onChange={(e) => onChange("nombre", e.target.value)}
               placeholder="Ej: ALIMENTADOR 1"
               required
            />
         </label>

         <label className="alim-modal-label">
            
            <div className="alim-color-grid">
               {COLORES_SISTEMA.map((c) => (
                  <button
                     key={c}
                     type="button"
                     className={
                        "alim-color-swatch" +
                        (color === c ? " alim-color-swatch-selected" : "")
                     }
                     style={{ backgroundColor: c }}
                     onClick={() => onChange("color", c)}
                     aria-label={`Elegir color ${c}`}
                  />
               ))}
            </div>
         </label>
      </div>
   );
};

export default FormularioDatosBasicos;
