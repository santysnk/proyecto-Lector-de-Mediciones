import React, { useState } from "react";
import "./ModalNuevoPuesto.css";

/**
 * Modal para crear un nuevo puesto
 * Permite ingresar nombre y seleccionar color
 */
const ModalNuevoPuesto = ({ abierto, onCerrar, onCrear, coloresSistema }) => {
	const [nombrePuesto, setNombrePuesto] = useState("");
	const [colorPuesto, setColorPuesto] = useState(coloresSistema[0]);

	const handleSubmit = (e) => {
		e.preventDefault();
		const nombre = nombrePuesto.trim();
		if (!nombre) return;

		onCrear(nombre, colorPuesto);

		// Limpiar y cerrar
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

					<div className="alim-color-picker">
						<div className="alim-color-grid">
							{coloresSistema.map((c) => (
								<button
									key={c}
									type="button"
									className={
										"alim-color-swatch" +
										(colorPuesto === c ? " alim-color-swatch-selected" : "")
									}
									style={{ backgroundColor: c }}
									onClick={() => setColorPuesto(c)}
								/>
							))}
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
							className="alim-modal-btn alim-modal-btn-aceptar"
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
