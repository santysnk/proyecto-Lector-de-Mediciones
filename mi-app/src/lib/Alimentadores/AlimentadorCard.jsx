// src/lib/Alimentadores/AlimentadorCard.jsx
import React from "react";
import "./Alimentadores.css"; // reutilizamos el mismo CSS

const AlimentadorCard = ({ nombre }) => {
  return (
    <div className="alim-card">
      <div className="alim-card-header">
        <span className="alim-card-title">{nombre}</span>
      </div>

      <div className="alim-card-body">
        <div className="alim-card-section">
          <h3 className="alim-card-section-title">CONSUMO (A)</h3>
          <div className="alim-card-meters">
            {["R", "S", "T"].map((fase) => (
              <div key={fase} className="alim-card-meter">
                <span className="alim-card-meter-phase">{fase}</span>
                <span className="alim-card-meter-value">--,--</span>
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
                <span className="alim-card-meter-value">--,--</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlimentadorCard;
