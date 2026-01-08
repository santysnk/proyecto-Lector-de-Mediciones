/**
 * Subcomponente: Sección de diseño de card (superior/inferior)
 */

import { useState } from "react";
import { OPCIONES_TITULO, PLACEHOLDERS_BOX } from "./constantes";

const SeccionCardDesign = ({
   titulo,
   zona,
   design,
   registradores,
   registradorActual,
   indicesDisponibles,
   onChangeRegistrador,
   onChangeTitulo,
   onChangeTituloCustom,
   onChangeCantidad,
   onChangeBox,
   onDragOver,
   onDrop,
   onDragStart,
   estaIndiceDuplicado,
   obtenerMensajeDuplicado,
}) => {
   const [expandido, setExpandido] = useState(false);
   const [tooltipIdx, setTooltipIdx] = useState(null);
   const cant = design.cantidad || 3;
   const estaOculto = design.oculto || false;

   return (
      <div
         className={`alim-modal-card-section ${expandido ? "alim-modal-card-section--expandido" : ""} ${estaOculto ? "alim-modal-card-section--oculto" : ""}`}
      >
         <button
            type="button"
            className="alim-modal-card-section-header"
            onClick={() => setExpandido(!expandido)}
         >
            <span
               className={`alim-modal-card-section-arrow ${expandido ? "alim-modal-card-section-arrow--expandido" : ""}`}
            >
               ▶
            </span>
            <span className="alim-modal-card-section-titulo">{titulo}</span>
            {registradorActual && !estaOculto && (
               <span className="alim-modal-card-section-registrador">{registradorActual.nombre}</span>
            )}
            {estaOculto && <span className="alim-modal-card-section-oculto-badge">OCULTO</span>}
         </button>

         {expandido && (
            <div className="alim-modal-card-section-content">
               {/* Selector de registrador para esta zona */}
               <div className="alim-modal-campo">
                  <label>Registrador</label>
                  <select
                     className="alim-modal-select"
                     value={design.registrador_id || ""}
                     onChange={(e) => onChangeRegistrador(e.target.value)}
                  >
                     <option value="">-- Sin registrador --</option>
                     {registradores.map((reg) => (
                        <option key={reg.id} value={reg.id}>
                           {reg.nombre} ({reg.agenteNombre}) - {reg.ip}:{reg.puerto} | Reg:{" "}
                           {reg.indice_inicial}-{reg.indice_inicial + reg.cantidad_registros - 1}
                        </option>
                     ))}
                  </select>
               </div>

               {/* Índices arrastrables del registrador seleccionado */}
               {registradorActual && indicesDisponibles.length > 0 && (
                  <div className="alim-modal-indices">
                     <span className="alim-modal-indices-label">Índices arrastrables:</span>
                     <div className="alim-modal-indices-chips">
                        {indicesDisponibles.map((indice) => (
                           <span
                              key={indice}
                              className="alim-modal-indice-chip"
                              draggable
                              onDragStart={(e) => onDragStart(e, indice)}
                           >
                              {indice}
                           </span>
                        ))}
                     </div>
                  </div>
               )}

               <div className="alim-modal-card-header">
                  <div className="alim-modal-campo">
                     <label>Título</label>
                     <select
                        className="alim-modal-select"
                        value={design.tituloId || "corriente_132"}
                        onChange={(e) => onChangeTitulo(e.target.value)}
                     >
                        {OPCIONES_TITULO.map((op) => (
                           <option key={op.id} value={op.id}>
                              {op.label}
                           </option>
                        ))}
                     </select>
                  </div>

                  {design.tituloId === "custom" && (
                     <div className="alim-modal-campo">
                        <label>Título personalizado</label>
                        <input
                           type="text"
                           className="alim-modal-input"
                           placeholder="Ej: CONSUMO (A)"
                           value={design.tituloCustom || ""}
                           onChange={(e) => onChangeTituloCustom(e.target.value)}
                        />
                     </div>
                  )}

                  <div className="alim-modal-campo alim-modal-campo--small">
                     <label>Cantidad boxes</label>
                     <select
                        className="alim-modal-select"
                        value={cant}
                        onChange={(e) => onChangeCantidad(Number(e.target.value))}
                     >
                        {[1, 2, 3, 4].map((n) => (
                           <option key={n} value={n}>
                              {n}
                           </option>
                        ))}
                     </select>
                  </div>
               </div>

               <div className="alim-modal-boxes">
                  {Array.from({ length: cant }).map((_, idx) => {
                     const box = design.boxes[idx] || {};
                     const duplicado = estaIndiceDuplicado(zona, idx, box.indice);

                     return (
                        <div key={`${zona}-box-${idx}`} className="alim-modal-box">
                           <span className="alim-modal-box-titulo">Box {idx + 1}</span>
                           <div className="alim-modal-box-row">
                              <label className="alim-modal-box-check">
                                 <input
                                    type="checkbox"
                                    checked={!!box.enabled}
                                    onChange={(e) => onChangeBox(idx, "enabled", e.target.checked)}
                                 />
                              </label>

                              <input
                                 type="text"
                                 className="alim-modal-input alim-modal-box-label"
                                 placeholder={PLACEHOLDERS_BOX[idx] || `Ej: R o L1`}
                                 value={box.label || ""}
                                 onChange={(e) => onChangeBox(idx, "label", e.target.value)}
                              />

                              <div className="alim-modal-box-indice-wrapper">
                                 <input
                                    type="number"
                                    className={`alim-modal-input alim-modal-box-indice ${duplicado ? "alim-modal-box-indice--duplicado" : ""}`}
                                    placeholder="Índice"
                                    value={box.indice ?? ""}
                                    onChange={(e) =>
                                       onChangeBox(idx, "indice", e.target.value ? Number(e.target.value) : null)
                                    }
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDrop(e, idx)}
                                 />
                                 {duplicado && (
                                    <span
                                       className="alim-modal-box-warning"
                                       onMouseEnter={() => setTooltipIdx(idx)}
                                       onMouseLeave={() => setTooltipIdx(null)}
                                    >
                                       ⚠️
                                       {tooltipIdx === idx && (
                                          <div className="alim-modal-box-warning-tooltip">
                                             {obtenerMensajeDuplicado(zona, idx, box.indice)}
                                          </div>
                                       )}
                                    </span>
                                 )}
                              </div>

                              <input
                                 type="text"
                                 className="alim-modal-input alim-modal-box-formula"
                                 placeholder="Fórmula (ej: x*250/1000)"
                                 value={box.formula || ""}
                                 onChange={(e) => onChangeBox(idx, "formula", e.target.value)}
                              />
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}
      </div>
   );
};

export default SeccionCardDesign;
