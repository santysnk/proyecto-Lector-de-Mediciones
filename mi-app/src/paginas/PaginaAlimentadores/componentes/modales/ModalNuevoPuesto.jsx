import React, { useState } from "react";
import "./ModalNuevoPuesto.css";

/**
 * ==============================================================================
 * COMPONENTE: ModalNuevoPuesto
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es una ventana emergente (pop-up) que permite crear un nuevo puesto (estación).
 * Pide dos cosas:
 * 1. El nombre del puesto (ej: "Torno CNC 1").
 * 2. Un color para identificarlo.
 * 
 * ¿CÓMO FUNCIONA?
 * - Se muestra solo cuando "abierto" es true.
 * - Al darle "Crear", llama a la función "onCrear" pasándole los datos.
 * - Al darle "Cancelar" o tocar afuera, se cierra sin hacer nada.
 * 
 * FINALIDAD:
 * Facilitar la creación rápida de nuevos puestos de trabajo.
 */

const ModalNuevoPuesto = ({
	abierto, 			// ¿Debe mostrarse?
	onCerrar, 			// Función para cerrar
	onCrear, 			// Función para guardar el nuevo puesto
	coloresSistema 		// Lista de colores disponibles para elegir
}) => {
	// Estados locales para el formulario
	const [nombrePuesto, setNombrePuesto] = useState("");
	const [colorPuesto, setColorPuesto] = useState(coloresSistema[0]);

	// Maneja el envío del formulario
	const handleSubmit = (e) => {
		e.preventDefault(); // Evita que se recargue la página
		const nombre = nombrePuesto.trim();

		if (!nombre) return; // No permitir nombres vacíos

		onCrear(nombre, colorPuesto);

		// Limpiar el formulario para la próxima vez
		setNombrePuesto("");
		setColorPuesto(coloresSistema[0]);
	};

	// Maneja el cierre sin guardar
	const handleCerrar = () => {
		setNombrePuesto("");
		setColorPuesto(coloresSistema[0]);
		onCerrar();
	};

	// Si no está abierto, no renderizamos nada (invisible)
	if (!abierto) return null;

	return (
		// Fondo oscuro
		<div className="alim-modal-overlay">
			{/* Ventana blanca */}
			<div className="alim-modal alim-modal-sm">
				<h2>Nuevo Puesto</h2>

				<form onSubmit={handleSubmit}>
					{/* Input de Nombre */}
					<label className="alim-modal-label">
						Nombre del Puesto
						<input
							type="text"
							className="alim-modal-input"
							value={nombrePuesto}
							onChange={(e) => setNombrePuesto(e.target.value)}
							placeholder="Ej: PUESTO 1"
							autoFocus // Pone el cursor aquí automáticamente
						/>
					</label>

					{/* Selector de Color */}
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
									title="Seleccionar color"
								/>
							))}
						</div>
					</div>

					{/* Botones de Acción */}
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
