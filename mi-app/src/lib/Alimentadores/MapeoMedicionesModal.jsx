import React, { useEffect, useState } from "react";
import "./MapeoMedicionesModal.css";

const SECCIONES_MAPEO = [
   {
      id: "tension_linea",
      titulo: "Tensión de línea (kV)",
      items: ["L1", "L2", "L3"],
   },
   {
      id: "tension_entre_lineas",
      titulo: "Tensión entre líneas (kV)",
      items: ["L1-L2", "L2-L3", "L1-L3"],
   },
   {
      id: "corriente_linea",
      titulo: "Corriente de línea (A)",
      items: ["L1", "L2", "L3"],
   },
   {
      id: "potencia_activa",
      titulo: "Potencia activa (kW)",
      items: ["L1", "L2", "L3", "Total"],
   },
   {
      id: "potencia_reactiva",
      titulo: "Potencia reactiva (kVAr)",
      items: ["L1", "L2", "L3", "Total"],
   },
   {
      id: "potencia_aparente",
      titulo: "Potencia aparente (kVA)",
      items: ["L1", "L2", "L3", "Total"],
   },
   {
      id: "factor_potencia",
      titulo: "Factor de Potencia",
      items: ["L1", "L2", "L3"],
   },
   {
      id: "frecuencia",
      titulo: "Frecuencia (Hz)",
      items: ["L1", "L2", "L3"],
   },
   {
      id: "corriente_neutro",
      titulo: "Corriente de Neutro (A)",
      items: ["N"],
   },
];

// Opciones para el título de la parte superior / inferior de la card
const OPCIONES_TITULO_CARD = [
   { id: "tension_linea", label: "Tensión de línea (kV)" },
   { id: "tension_entre_lineas", label: "Tensión entre líneas (kV)" },
   { id: "corriente_132", label: "Corriente de línea (A) (en 13,2 kV)" },
   { id: "corriente_33", label: "Corriente de línea (A) (en 33 kV)" },
   { id: "potencia_activa", label: "Potencia activa (kW)" },
   { id: "potencia_reactiva", label: "Potencia reactiva (kVAr)" },
   { id: "potencia_aparente", label: "Potencia aparente (kVA)" },
   { id: "factor_potencia", label: "Factor de Potencia" },
   { id: "frecuencia", label: "Frecuencia (Hz)" },
   { id: "corriente_neutro", label: "Corriente de Neutro (A)" },
   { id: "custom", label: "Otro (personalizado)..." },
];

// Placeholders para las etiquetas de los 4 boxes
const PLACEHOLDERS_BOX = [
   "Ej: R o L1",
   "Ej: S o L2",
   "Ej: T o L3",
   "Ej: Total",
];

// ---- helpers para diseño de card ----
function crearSideDesignDefault(tituloIdPorDefecto) {
   return {
      tituloId: tituloIdPorDefecto,
      tituloCustom: "",
      cantidad: 3, // sigue siendo 3 boxes por defecto
      boxes: [
         {
            enabled: false,
            label: "",
            registro: "",
            origen: "",
            formula: "",
         },
         {
            enabled: false,
            label: "",
            registro: "",
            origen: "",
            formula: "",
         },
         {
            enabled: false,
            label: "",
            registro: "",
            origen: "",
            formula: "",
         },
         {
            enabled: false,
            label: "",
            registro: "",
            origen: "",
            formula: "",
         },
      ],
   };
}


function crearCardDesignDefault() {
   return {
      superior: crearSideDesignDefault("corriente_132"), // parecido a CONSUMO
      inferior: crearSideDesignDefault("tension_linea"), // parecido a TENSIÓN
   };
}

// ---- mapeo vacío: secciones + diseño de card ----
function crearMapeoVacio() {
   const base = {};
   SECCIONES_MAPEO.forEach((sec) => {
      base[sec.id] = {};
      sec.items.forEach((item) => {
         base[sec.id][item] = {
            enabled: false,
            registro: "",
            formula: "",
            origen: "",
         };
      });
   });

   base.cardDesign = crearCardDesignDefault();
   return base;
}

const MapeoMedicionesModal = ({
   abierto,
   nombreAlimentador,
   initialMapeo,
   onCancelar,
   onGuardar,
}) => {
   const [mapeo, setMapeo] = useState(crearMapeoVacio);

   useEffect(() => {
      if (!abierto) return;

      const base = crearMapeoVacio();

      if (!initialMapeo) {
         setMapeo(base);
         return;
      }

      // Mezcla mapeo guardado (viejo) con el esqueleto vacío
      const combinado = { ...base };

      // 1) secciones clásicas (aunque ya no se muestran, las preservamos)
      SECCIONES_MAPEO.forEach((sec) => {
         sec.items.forEach((item) => {
            const guardado = initialMapeo[sec.id]?.[item] || {};
            combinado[sec.id][item] = {
               ...base[sec.id][item],
               ...guardado,
               origen: guardado.origen || "rele",
            };
         });
      });

      // 2) diseño de tarjeta
      if (initialMapeo.cardDesign) {
         const defCD = base.cardDesign;
         const guardCD = initialMapeo.cardDesign;

         const mergeSide = (sideName) => {
            const defSide = defCD[sideName];
            const guardSide = guardCD[sideName] || {};

            const boxesDef = defSide.boxes || [];
            const boxesGuard = guardSide.boxes || [];

            const mergedBoxes = boxesDef.map((bDef, idx) => {
               const bGuard = boxesGuard[idx] || {};
               return {
                  ...bDef,
                  ...bGuard,
                  origen: bGuard.origen || bDef.origen || "rele",
               };
            });

            const cantGuard = guardSide.cantidad;
            const cantidad =
               typeof cantGuard === "number" && cantGuard >= 1 && cantGuard <= 4
                  ? cantGuard
                  : defSide.cantidad;

            return {
               ...defSide,
               ...guardSide,
               boxes: mergedBoxes,
               cantidad,
               tituloId: guardSide.tituloId || defSide.tituloId,
               tituloCustom: guardSide.tituloCustom || "",
            };
         };

         combinado.cardDesign = {
            superior: mergeSide("superior"),
            inferior: mergeSide("inferior"),
         };
      } else {
         combinado.cardDesign = base.cardDesign;
      }

      setMapeo(combinado);
   }, [abierto, initialMapeo]);

   if (!abierto) return null;

   // --- helpers actualización cardDesign ---
   const asegurarCardDesign = (prev) => {
      if (!prev.cardDesign) {
         return crearCardDesignDefault();
      }
      const cd = { ...prev.cardDesign };
      if (!cd.superior) cd.superior = crearSideDesignDefault("corriente_132");
      if (!cd.inferior) cd.inferior = crearSideDesignDefault("tension_linea");
      return cd;
   };

   const actualizarCantidadBoxes = (zona, nuevaCant) => {
      const cant = Math.min(4, Math.max(1, nuevaCant || 1));
      setMapeo((prev) => {
         const cd = asegurarCardDesign(prev);
         return {
            ...prev,
            cardDesign: {
               ...cd,
               [zona]: {
                  ...cd[zona],
                  cantidad: cant,
               },
            },
         };
      });
   };

   const actualizarTituloSeleccionado = (zona, tituloId) => {
      setMapeo((prev) => {
         const cd = asegurarCardDesign(prev);
         const side = cd[zona];
         return {
            ...prev,
            cardDesign: {
               ...cd,
               [zona]: {
                  ...side,
                  tituloId,
               },
            },
         };
      });
   };

   const actualizarTituloCustom = (zona, texto) => {
      setMapeo((prev) => {
         const cd = asegurarCardDesign(prev);
         const side = cd[zona];
         return {
            ...prev,
            cardDesign: {
               ...cd,
               [zona]: {
                  ...side,
                  tituloId: "custom",
                  tituloCustom: texto,
               },
            },
         };
      });
   };

   const actualizarCardDesignCaja = (zona, index, campo, valor) => {
      setMapeo((prev) => {
         const cd = asegurarCardDesign(prev);
         const side = cd[zona];
         const boxes = side.boxes ? [...side.boxes] : [];
         while (boxes.length < 4) {
            boxes.push({
               enabled: false,
               label: "",
               registro: "",
               origen: "rele",
               formula: "",
            });
         }
         boxes[index] = {
            ...boxes[index],
            [campo]: valor,
         };

         return {
            ...prev,
            cardDesign: {
               ...cd,
               [zona]: {
                  ...side,
                  boxes,
               },
            },
         };
      });
   };

   const handleSubmit = (e) => {
      e.preventDefault();
      onGuardar(mapeo);
   };

   const cardDesign = mapeo.cardDesign || crearCardDesignDefault();

   // Render de Parte superior / inferior
   const renderSideDesign = (zona, tituloBloque, placeholderTitulo) => {
      const side = cardDesign[zona];
      const cant = side.cantidad || 1;

      return (
         <section className="map-part">
            <h4 className="map-part__title">{tituloBloque}</h4>

            {/* Título + Cantidad de boxes */}
            <div className="map-part__header">
               {/* Campo Título */}
               <div className="map-field map-field--grow">
                  <span className="map-field__label">Título</span>
                  <div className="map-field__inline">
                     <select
                        className="map-select"
                        value={side.tituloId || "corriente_132"}
                        onChange={(e) =>
                           actualizarTituloSeleccionado(zona, e.target.value)
                        }
                     >
                        {OPCIONES_TITULO_CARD.map((op) => (
                           <option key={op.id} value={op.id}>
                              {op.label}
                           </option>
                        ))}
                     </select>

                     {side.tituloId === "custom" && (
                        <input
                           type="text"
                           className="map-input map-input--full"
                           placeholder={placeholderTitulo}
                           value={side.tituloCustom || ""}
                           onChange={(e) =>
                              actualizarTituloCustom(zona, e.target.value)
                           }
                        />
                     )}
                  </div>
               </div>

               {/* Campo Cantidad */}
               <div className="map-field map-field--small">
                  <span className="map-field__label">
                     Cantidad de boxes de medición
                  </span>
                  <select
                     className="map-select"
                     value={cant}
                     onChange={(e) =>
                        actualizarCantidadBoxes(zona, Number(e.target.value))
                     }
                  >
                     {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                           {n}
                        </option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Lista de boxes */}
            <div className="map-box-list">
               {Array.from({ length: cant }).map((_, idx) => {
                  const box = side.boxes[idx] || {};
                  const placeholderLabel =
                     PLACEHOLDERS_BOX[idx] || `Box ${idx + 1}`;

                  return (
                     <div key={idx} className="map-box">
                        {/* Checkbox + texto "Box N" */}
                        <label className="map-box__check">
                           <input
                              type="checkbox"
                              checked={!!box.enabled}
                              onChange={(e) =>
                                 actualizarCardDesignCaja(
                                    zona,
                                    idx,
                                    "enabled",
                                    e.target.checked
                                 )
                              }
                           />
                           <span>Box {idx + 1}</span>
                        </label>

                        {/* Etiqueta visible en la card */}
                        <input
                           type="text"
                           className="map-input map-box__label"
                           placeholder={placeholderLabel}
                           value={box.label || ""}
                           onChange={(e) =>
                              actualizarCardDesignCaja(
                                 zona,
                                 idx,
                                 "label",
                                 e.target.value
                              )
                           }
                        />

                        {/* Registro Modbus */}
                        <input
                           type="number"
                           className="map-input map-box__registro"
                           placeholder="Registro"
                           value={box.registro || ""}
                           onChange={(e) =>
                              actualizarCardDesignCaja(
                                 zona,
                                 idx,
                                 "registro",
                                 e.target.value
                              )
                           }
                        />

                        {/* Origen: relé / analizador */}
                        <select
                           className="map-select map-box__origen"
                           value={box.origen || "rele"}
                           onChange={(e) =>
                              actualizarCardDesignCaja(
                                 zona,
                                 idx,
                                 "origen",
                                 e.target.value
                              )
                           }
                        >
                           <option value="rele">Relé</option>
                           <option value="analizador">Analizador</option>
                        </select>

                        {/* Fórmula */}
                        <input
                           type="text"
                           className="map-input map-box__formula"
                           placeholder="Fórmula (ej: x * 500 / 1000)"
                           value={box.formula || ""}
                           onChange={(e) =>
                              actualizarCardDesignCaja(
                                 zona,
                                 idx,
                                 "formula",
                                 e.target.value
                              )
                           }
                        />
                     </div>
                  );
               })}
            </div>
         </section>
      );
   };

   return (
      <div className="alim-modal-overlay">
         <div className="map-modal">
            <h2 className="map-modal__title">
               Mapeo de mediciones – {nombreAlimentador}
            </h2>

            <form onSubmit={handleSubmit} className="map-form">
               <div className="map-design">
                  <h3 className="map-design__title">Diseño de la tarjeta</h3>
                  <p className="map-design__help">
                     Elegí qué magnitudes se muestran en la parte superior e
                     inferior de la tarjeta y cómo se alimentan los boxes de
                     medición. Podés preparar boxes deshabilitados para usarlos
                     más adelante.
                  </p>

                  {renderSideDesign(
                     "superior",
                     "Parte superior",
                     "CONSUMO (A)"
                  )}
                  {renderSideDesign(
                     "inferior",
                     "Parte inferior",
                     "TENSIÓN (kV)"
                  )}
               </div>

               <div className="alim-modal-actions">
                  <button
                     type="button"
                     className="alim-modal-btn alim-modal-btn-cancelar"
                     onClick={onCancelar}
                  >
                     Cancelar
                  </button>
                  <button
                     type="submit"
                     className="alim-modal-btn alim-modal-btn-aceptar"
                  >
                     Guardar
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export default MapeoMedicionesModal;
export { crearMapeoVacio };
