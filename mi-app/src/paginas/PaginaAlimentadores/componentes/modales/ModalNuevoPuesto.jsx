// src/paginas/PaginaAlimentadores/componentes/modales/ModalNuevoPuesto.jsx

import React, { useState } from "react";
import "./ModalConfiguracionAlimentador.css"; // estilos base del modal (overlay, fondo, input, etc.)
import "./ModalNuevoPuesto.css";              // estilos específicos del modal nuevo puesto
import ColorPickerSimple from "./ColorPickerSimple"; // componente reutilizable del picker

/**
 * Modal para crear un nuevo puesto.
 * Permite ingresar nombre y seleccionar color.
 */
const ModalNuevoPuesto = ({
	abierto,                                   // boolean: controla si el modal se muestra
	onCerrar,                                  // callback para cerrar sin crear
	onCrear,                                   // callback que recibe (nombre, color)
	coloresSistema,                            // array de colores disponibles
}) => {
	const [nombrePuesto, setNombrePuesto] = useState("");
	const [colorPuesto, setColorPuesto] = useState(coloresSistema[0]);

	const handleSubmit = (e) => {
		e.preventDefault();
		const nombre = nombrePuesto.trim();
		if (!nombre) return;

		onCrear(nombre, colorPuesto);

		// Limpiar (el cierre lo maneja el padre)
		setNombrePuesto("");
		setColorPuesto(coloresSistema[0]);
	};

	const handleCerrar = () => {
		setNombrePuesto("");
		setColorPuesto(coloresSistema[0]);
		onCerrar();
	};

	if (!abierto) return null;

	return (
		<div className="alim-modal-overlay">
			<div className="alim-modal alim-modal-sm">
				<h2>Nuevo Puesto</h2>
				<form onSubmit={handleSubmit}>
					<div className="nuevo-puesto-contenedor">
						<label className="alim-modal-label">
							Nombre del Puesto
							<input
								type="text"
								className="alim-modal-input"
								value={nombrePuesto}
								onChange={(e) => setNombrePuesto(e.target.value)}
								placeholder="Ej: PUESTO 1"
								autoFocus
							/>
						</label>

						<div className="nuevo-puesto-color-section">
							{/* Grid de colores predefinidos */}
							<div className="nuevo-puesto-color-grid">
								{coloresSistema.slice(0, 8).map((c) => (
									<button
										key={c}
										type="button"
										className={`nuevo-puesto-color-swatch ${
											colorPuesto === c ? "nuevo-puesto-color-swatch--selected" : ""
										}`}
										style={{ backgroundColor: c }}
										onClick={() => setColorPuesto(c)}
										aria-label={`Elegir color ${c}`}
									/>
								))}
								{/* Picker personalizado (círculo multicolor) */}
								<ColorPickerSimple
									color={colorPuesto}
									onChange={setColorPuesto}
									label=""
								/>
							</div>

							{/* Preview del color seleccionado */}
							<div
								className="nuevo-puesto-color-preview"
								style={{ backgroundColor: colorPuesto }}
								title={colorPuesto}
							>
								<span className="nuevo-puesto-color-preview-text">COLOR</span>
							</div>
						</div>
					</div>

					<div className="alim-modal-actions">
						<button
							type="button"
							className="alim-modal-btn alim-modal-btn-cancelar"
							onClick={handleCerrar}
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="alim-modal-btn alim-modal-btn-guardar"
						>
							Crear
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ModalNuevoPuesto;
