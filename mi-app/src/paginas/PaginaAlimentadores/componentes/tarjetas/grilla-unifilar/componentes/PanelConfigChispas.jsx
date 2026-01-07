// componentes/PanelConfigChispas.jsx
// Panel de configuración de chispas

import React from "react";

/**
 * Componente de panel de configuración de chispas
 * @param {Object} props - Propiedades del componente
 */
export function PanelConfigChispas({
   visible,
   bornes,
   chispasConfig,
   onActualizarChispasConfig
}) {
   if (!visible) return null;

   const emisores = bornes.filter(b => b.tipo === "EMISOR").length;
   const receptores = bornes.filter(b => b.tipo === "RECEPTOR").length;

   return (
      <div className="grilla-unifilar__panel-chispas">
         <div className="grilla-unifilar__panel-header">
            <div className="grilla-unifilar__panel-titulo">Configuración de Chispas</div>
            <div className="grilla-unifilar__panel-info-inline">
               Emisores: {emisores} | Receptores: {receptores}
            </div>
         </div>

         <div className="grilla-unifilar__panel-columnas">
            {/* COLUMNA IZQUIERDA */}
            <div className="grilla-unifilar__panel-columna">
               {/* Forma y Color en fila */}
               <div className="grilla-unifilar__panel-fila">
                  <div className="grilla-unifilar__panel-campo grilla-unifilar__panel-campo--flex">
                     <label>Forma:</label>
                     <select
                        className="grilla-unifilar__panel-select"
                        value={chispasConfig.forma || "circulo"}
                        onChange={(e) => onActualizarChispasConfig?.({ forma: e.target.value })}
                     >
                        <option value="circulo">Círculo</option>
                        <option value="cuadrado">Cuadrado</option>
                        <option value="estrella">Estrella</option>
                        <option value="rayo">Rayo</option>
                        <option value="flecha">Flecha</option>
                        <option value="gota">Gota</option>
                        <option value="anillo">Anillo</option>
                        <option value="barra">Barra |</option>
                     </select>
                  </div>
                  <div className="grilla-unifilar__panel-campo grilla-unifilar__panel-campo--color">
                     <label>Color:</label>
                     <input
                        type="color"
                        value={chispasConfig.color || "#fef08a"}
                        onChange={(e) => onActualizarChispasConfig?.({ color: e.target.value })}
                     />
                  </div>
               </div>

               {/* Tamaño */}
               <div className="grilla-unifilar__panel-campo">
                  <label>Tamaño:</label>
                  <div className="grilla-unifilar__panel-slider-input">
                     <input
                        type="range"
                        min="2"
                        max="10"
                        value={chispasConfig.tamano || 4}
                        onChange={(e) => onActualizarChispasConfig?.({ tamano: Number(e.target.value) })}
                     />
                     <input
                        type="number"
                        className="grilla-unifilar__panel-number"
                        min="2"
                        max="10"
                        value={chispasConfig.tamano || 4}
                        onChange={(e) => {
                           const val = Math.min(10, Math.max(2, Number(e.target.value) || 2));
                           onActualizarChispasConfig?.({ tamano: val });
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                     />
                     <span className="grilla-unifilar__panel-unidad">px</span>
                  </div>
               </div>

               {/* Velocidad */}
               <div className="grilla-unifilar__panel-campo">
                  <label>Velocidad:</label>
                  <div className="grilla-unifilar__panel-slider-input">
                     <input
                        type="range"
                        min="1"
                        max="20"
                        value={chispasConfig.velocidad || 8}
                        onChange={(e) => onActualizarChispasConfig?.({ velocidad: Number(e.target.value) })}
                     />
                     <input
                        type="number"
                        className="grilla-unifilar__panel-number"
                        min="1"
                        max="20"
                        value={chispasConfig.velocidad || 8}
                        onChange={(e) => {
                           const val = Math.min(20, Math.max(1, Number(e.target.value) || 1));
                           onActualizarChispasConfig?.({ velocidad: val });
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                     />
                     <span className="grilla-unifilar__panel-unidad">cel/s</span>
                  </div>
               </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div className="grilla-unifilar__panel-columna">
               {/* Intervalo entre emisiones */}
               <div className="grilla-unifilar__panel-campo">
                  <label>Intervalo:</label>
                  <div className="grilla-unifilar__panel-slider-input">
                     <input
                        type="range"
                        min="0.3"
                        max="5"
                        step="0.1"
                        value={(chispasConfig.frecuenciaEmision || 2000) / 1000}
                        onChange={(e) => onActualizarChispasConfig?.({ frecuenciaEmision: Math.round(Number(e.target.value) * 1000) })}
                     />
                     <input
                        type="number"
                        className="grilla-unifilar__panel-number"
                        min="0.3"
                        max="5"
                        step="0.1"
                        value={((chispasConfig.frecuenciaEmision || 2000) / 1000).toFixed(1)}
                        onChange={(e) => {
                           const val = Math.min(5, Math.max(0.3, Number(e.target.value) || 0.3));
                           onActualizarChispasConfig?.({ frecuenciaEmision: Math.round(val * 1000) });
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                     />
                     <span className="grilla-unifilar__panel-unidad">seg</span>
                  </div>
               </div>

               {/* Estela checkbox */}
               <div className="grilla-unifilar__panel-campo grilla-unifilar__panel-campo--checkbox">
                  <label>
                     <input
                        type="checkbox"
                        checked={chispasConfig.estela !== false}
                        onChange={(e) => onActualizarChispasConfig?.({ estela: e.target.checked })}
                     />
                     Mostrar estela
                  </label>
               </div>

               {/* Longitud estela */}
               {chispasConfig.estela !== false && (
                  <div className="grilla-unifilar__panel-campo">
                     <label>Longitud:</label>
                     <div className="grilla-unifilar__panel-slider-input">
                        <input
                           type="range"
                           min="1"
                           max="10"
                           value={chispasConfig.longitudEstela || 5}
                           onChange={(e) => onActualizarChispasConfig?.({ longitudEstela: Number(e.target.value) })}
                        />
                        <input
                           type="number"
                           className="grilla-unifilar__panel-number"
                           min="1"
                           max="10"
                           value={chispasConfig.longitudEstela || 5}
                           onChange={(e) => {
                              const val = Math.min(10, Math.max(1, Number(e.target.value) || 1));
                              onActualizarChispasConfig?.({ longitudEstela: val });
                           }}
                           onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                        />
                        <span className="grilla-unifilar__panel-unidad">celdas</span>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
