import React from "react";
import { COLORES_SISTEMA } from "../../../constantes/colores";
import "./FormularioDatosBasicos.css";

/**
 * ==============================================================================
 * SUBCOMPONENTE: FormularioDatosBasicos
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es la primera parte del formulario de configuración de un alimentador.
 * Aquí el usuario define:
 * 1. El nombre del equipo (ej: "Horno 1").
 * 2. El color que lo identifica en la pantalla.
 * 3. Cada cuánto tiempo se deben actualizar los datos del Relé.
 * 
 * ¿CÓMO FUNCIONA?
 * Es un componente "tonto" (presentacional). Solo muestra los inputs y, cuando
 * el usuario escribe algo, avisa al padre (ModalConfiguracionAlimentador) para
 * que guarde el cambio.
 */

const FormularioDatosBasicos = ({
	nombre, 			// Valor actual del nombre
	color, 				// Valor actual del color
	periodoSegundos, 	// Valor actual del período
	onChange, 			// Función para avisar cambios: onChange("campo", "nuevoValor")
}) => {
	return (
		<div className="alim-form-basicos">
			{/* INPUT: NOMBRE */}
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

			{/* INPUT: COLOR (Grilla de botones) */}
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
							title="Seleccionar color"
						/>
					))}
				</div>
			</label>

			{/* INPUT: PERIODO DE ACTUALIZACIÓN */}
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
					title="Cada cuántos segundos se leen los datos"
				/>
			</label>
		</div>
	);
};

export default FormularioDatosBasicos;
