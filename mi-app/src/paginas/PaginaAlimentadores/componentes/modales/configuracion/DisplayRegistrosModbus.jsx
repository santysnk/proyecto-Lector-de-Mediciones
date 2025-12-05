import React from "react";
import "./DisplayRegistrosModbus.css";

/**
 * ==============================================================================
 * SUBCOMPONENTE: DisplayRegistrosModbus
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es un componente visual simple que muestra una lista de registros Modbus.
 * Se usa para mostrar los resultados de las pruebas de conexión.
 * 
 * ¿CÓMO FUNCIONA?
 * Recibe una lista de objetos { index, address, value } y los dibuja en una grilla.
 * Si la lista está vacía, no muestra nada.
 */

const DisplayRegistrosModbus = ({
	registros, 				// Lista de registros a mostrar
	titulo = "Registros leídos" // Título opcional de la sección
}) => {
	// Si no hay datos, no renderizamos nada para no ocupar espacio
	if (!registros || registros.length === 0) {
		return null;
	}

	return (
		<div className="alim-registros-display">
			<h4 className="alim-registros-title">{titulo}</h4>

			<div className="alim-registros-grid">
				{registros.map((reg, idx) => (
					<div key={idx} className="alim-registro-item">
						{/* Muestra el índice relativo y la dirección Modbus real */}
						<span className="alim-registro-label">
							Índice {reg.index} (Dir: {reg.address})
						</span>

						{/* Muestra el valor leído */}
						<span className="alim-registro-value">{reg.value}</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default DisplayRegistrosModbus;
