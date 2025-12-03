import React from "react";
import "./AlimentadorCard.css";
import configIcon from "../../assets/imagenes/Config_Icon.png";
import mapIcon from "../../assets/imagenes/Mapeo_icon.png";

const AlimentadorCard = ({
   nombre,
   color,
   onConfigClick,
   onMapClick,
   topSide,
   bottomSide,
   draggable = false,
   isDragging = false,
   onDragStart,
   onDragOver,
   onDrop,
   onDragEnd,
}) => {
   // ===== Helpers para armar cada lado de la tarjeta =====
   const buildSideDisplay = (side, tituloDefault) => {
      // Si todavía no hay lecturas / mapeo, mantenemos el comportamiento viejo:
      // título fijo y 3 boxes R, S, T con "--,--"
      const defaultBoxes = ["R", "S", "T"].map((label) => ({
         etiqueta: label,
         valor: "--,--",
      }));

      if (!side) {
         return {
            titulo: tituloDefault,
            boxes: defaultBoxes,
         };
      }

      const titulo =
         (side.titulo && String(side.titulo).trim()) || tituloDefault;

      let boxes = Array.isArray(side.boxes) ? side.boxes : [];

      // Limitamos a 4 como máximo
      boxes = boxes.slice(0, 4);

      // Si por alguna razón no hay boxes, usamos los defaults
      if (boxes.length === 0) {
         boxes = defaultBoxes;
      } else {
         // Normalizamos cada box: etiqueta y valor con fallback
         boxes = boxes.map((b, idx) => ({
            etiqueta:
               (b?.etiqueta && String(b.etiqueta).trim()) || `Box ${idx + 1}`,
            valor:
               b?.valor == null || b.valor === "" ? "--,--" : String(b.valor),
         }));
      }

      return { titulo, boxes };
   };

   const sup = buildSideDisplay(topSide, "CONSUMO (A)");
   const inf = buildSideDisplay(bottomSide, "TENSIÓN (kV)");

   // detectar si algún lado tiene 4 boxes
   const maxBoxes = Math.max(sup.boxes.length, inf.boxes.length);
   const isWide = maxBoxes >= 4;

   // armar clases de la card
   const clasesCard = ["alim-card"];
   if (isWide) clasesCard.push("alim-card-wide");
   if (isDragging) clasesCard.push("alim-card-dragging");

   return (
      <div
         className={clasesCard.join(" ")}
         style={{ cursor: draggable ? "grab" : "default" }}
         draggable={draggable}
         onDragStart={onDragStart}
         onDragOver={onDragOver}
         onDrop={onDrop}
         onDragEnd={onDragEnd}
      >
         {/* Header con nombre y botones */}
         <div
            className="alim-card-header"
            style={{ backgroundColor: color || "#0ea5e9" }}
         >
            <div className="alim-card-icons">
               <button
                  type="button"
                  className="alim-card-icon-btn"
                  onClick={onConfigClick}
                  title="Configurar registrador"
               >
                  <img
                     src={configIcon}
                     alt="Configurar"
                     className="alim-card-icon"
                  />
               </button>

               <button
                  type="button"
                  className="alim-card-icon-btn alim-card-map-btn"
                  onClick={onMapClick}
                  title="Mapeo"
               >
                  <img src={mapIcon} alt="Mapeo" className="alim-card-icon" />
               </button>
            </div>

            <span className="alim-card-title">{nombre}</span>
         </div>

         {/* Cuerpo con los 2 bloques (superior / inferior) */}
         <div className="alim-card-body">
            {/* ===== PARTE SUPERIOR ===== */}
            <div className="alim-card-section">
               <h3 className="alim-card-section-title">{sup.titulo}</h3>
               <div className="alim-card-meters">
                  {sup.boxes.map((box, idx) => (
                     <div key={idx} className="alim-card-meter">
                        <span className="alim-card-meter-phase">
                           {box.etiqueta}
                        </span>
                        <span className="alim-card-meter-value">
                           {box.valor ?? "--,--"}
                        </span>
                     </div>
                  ))}
               </div>
            </div>

            {/* ===== PARTE INFERIOR ===== */}
            <div className="alim-card-section">
               <h3 className="alim-card-section-title">{inf.titulo}</h3>
               <div className="alim-card-meters">
                  {inf.boxes.map((box, idx) => (
                     <div key={idx} className="alim-card-meter">
                        <span className="alim-card-meter-phase">
                           {box.etiqueta}
                        </span>
                        <span className="alim-card-meter-value">
                           {box.valor ?? "--,--"}
                        </span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export default AlimentadorCard;
