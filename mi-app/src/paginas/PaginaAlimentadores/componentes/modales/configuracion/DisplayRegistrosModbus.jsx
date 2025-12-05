import React from "react";
import "./DisplayRegistrosModbus.css";

/**
 * Componente reutilizable para mostrar registros Modbus
 * Muestra índice, dirección y valor de cada registro leído
 */
const DisplayRegistrosModbus = ({ registros, titulo = "Registros leídos" }) => {
	if (!registros || registros.length === 0) {
		return null;
	}

	return (
		<div className="alim-registros-display">
			<h4 className="alim-registros-title">{titulo}</h4>
			<div className="alim-registros-grid">
				{registros.map((reg, idx) => (
					<div key={idx} className="alim-registro-item">
						<span className="alim-registro-label">
							Índice {reg.index} (Dir: {reg.address})
						</span>
						<span className="alim-registro-value">{reg.value}</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default DisplayRegistrosModbus;
