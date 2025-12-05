import React from "react";
import { COLORES_SISTEMA } from "../../../constantes/colores";
import "./FormularioDatosBasicos.css";

/**
 * Formulario de datos básicos del alimentador  
 * Nombre, color y período de actualización del relé
 */
const FormularioDatosBasicos = ({
	nombre,
	color,
	periodoSegundos,
	onChange,
}) => {
	return (
		<div className="alim-form-basicos">
			<label className="alim-modal-label">
				Nombre del Alimentador
				<input
					type="text"
					className="alim-modal-input"
					value={nombre}
					onChange={(e) => onChange("nombre", e.target.value)}
					placeholder="Ej: ALIMENTADOR 1"
					required
				/>
			</label>

			<label className="alim-modal-label">
				Color
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
						/>
					))}
				</div>
			</label>

			<label className="alim-modal-label">
				Período de actualización Relé (segundos)
				<input
					type="number"
					className="alim-modal-input"
					min="1"
					max="3600"
					value={periodoSegundos}
					onChange={(e) =>
						onChange("periodoSegundos", parseInt(e.target.value) || 60)
					}
				/>
			</label>
		</div>
	);
};

export default FormularioDatosBasicos;
