// src/lib/Alimentadores/AlimentadorCard.jsx
import React from "react";
import "./Alimentadores.css";
import configIcon from "../../assets/imagenes/Config_Icon.png";

const AlimentadorCard = ({
   nombre,
   color,
   onConfigClick,
   draggable = false,
   isDragging = false,
   onDragStart,
   onDragOver,
   onDrop,
   onDragEnd,
}) => {
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
            <button
               type="button"
               className="alim-card-config-btn"
               onClick={onConfigClick}
               title="Configurar registrador"
            >
               <img
                  src={configIcon}
                  alt="Configurar"
                  className="alim-card-config-icon"
               />
            </button>

            <span className="alim-card-title">{nombre}</span>
         </div>

         {/* resto del cuerpo igual que ya lo tenías */}
         <div className="alim-card-body">
            <div className="alim-card-section">
               <h3 className="alim-card-section-title">CONSUMO (A)</h3>
               <div className="alim-card-meters">
                  {["R", "S", "T"].map((fase) => (
                     <div key={fase} className="alim-card-meter">
                        <span className="alim-card-meter-phase">{fase}</span>
                        <span className="alim-card-meter-value">34,21</span>
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
                        <span className="alim-card-meter-value">21,23</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export default AlimentadorCard;
