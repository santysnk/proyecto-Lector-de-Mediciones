// src/lib/Alimentadores/AlimentadorCard.jsx
import React from "react";
import "./AlimentadorCard.css";
import configIcon from "../../assets/imagenes/Config_Icon.png";
import mapIcon from "../../assets/imagenes/Mapeo_icon.png";

const AlimentadorCard = ({
   nombre,
   color,
   onConfigClick,
   onMapClick,
   consumo,
   tensionLinea,
   draggable = false,
   isDragging = false,
   onDragStart,
   onDragOver,
   onDrop,
   onDragEnd,
}) => {
	   // valores por defecto si todavía no hay medición
   const consumoSafe = consumo || { R: "ERROR", S: "ERROR", T: "ERROR" };
   const tensionSafe = tensionLinea || { R: "ERROR", S: "ERROR", T: "ERROR" };

   return (
		
      <div
         className={"alim-card" + (isDragging ? " alim-card-dragging" : "")}
         style={{ cursor: draggable ? "grab" : "default" }}
         draggable={draggable}
         onDragStart={onDragStart}
         onDragOver={onDragOver}
         onDrop={onDrop}
         onDragEnd={onDragEnd}
      >
         <div
            className="alim-card-header"
            style={{ backgroundColor: color || "#0ea5e9" }}
         >
            {/* 👇 contenedor de los dos iconos */}
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

         <div className="alim-card-body">
            <div className="alim-card-section">
               <h3 className="alim-card-section-title">CONSUMO (A)</h3>
               <div className="alim-card-meters">
                  {["R", "S", "T"].map((fase) => (
                     <div key={fase} className="alim-card-meter">
                        <span className="alim-card-meter-phase">{fase}</span>
                        <span className="alim-card-meter-value">
                           {consumoSafe[fase] ?? "ERROR"}
                        </span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="alim-card-section">
               <h3 className="alim-card-section-title">TENSIÓN (kV)</h3>
               <div className="alim-card-meters">
                  {["R", "S", "T"].map((fase) => (
                     <div key={fase} className="alim-card-meter">
                        <span className="alim-card-meter-phase">{fase}</span>
                        <span className="alim-card-meter-value">
                           {tensionSafe[fase] ?? "ERROR"}
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
