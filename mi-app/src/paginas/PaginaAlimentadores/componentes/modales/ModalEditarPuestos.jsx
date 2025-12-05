import React, { useState, useEffect } from "react";
import "./ModalEditarPuestos.css";

/**
 * ==============================================================================
 * COMPONENTE: ModalEditarPuestos
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es una ventana emergente que permite gestionar todos los puestos a la vez.
 * Aquí puedes:
 * 1. Cambiar el nombre de cualquier puesto.
 * 2. Cambiar el color del botón del puesto.
 * 3. Cambiar el color de fondo de la pantalla cuando seleccionas ese puesto.
 * 4. Eliminar puestos que ya no necesites.
 * 
 * ¿CÓMO FUNCIONA?
 * - Recibe la lista original de puestos.
 * - Crea una copia local ("puestosEditados") para que puedas hacer cambios sin
 *   afectar la app real hasta que le des a "Guardar".
 * - Si le das a "Cancelar", descarta todos los cambios.
 * 
 * FINALIDAD:
 * Dar control total al usuario sobre la configuración de sus estaciones de trabajo.
 */

const ModalEditarPuestos = ({
	abierto, 	// ¿Debe mostrarse?
	puestos, 	// La lista real de puestos (solo lectura aquí)
	onCerrar, 	// Función para cerrar sin guardar
	onGuardar 	// Función para guardar los cambios
}) => {
	// Estado local: Copia temporal de los puestos para editar tranquilamente
	const [puestosEditados, setPuestosEditados] = useState([]);

	// Cada vez que se abre el modal, reiniciamos la copia con los datos reales
	useEffect(() => {
		if (abierto) {
			// El .map crea una copia nueva de cada objeto para no modificar el original por referencia
			setPuestosEditados(puestos.map((p) => ({ ...p })));
		}
	}, [abierto, puestos]);

	// Al guardar, enviamos la lista modificada al padre
	const handleSubmit = () => {
		onGuardar(puestosEditados);
	};

	// Función para cambiar el nombre de un puesto específico
	const cambiarNombre = (id, nombreNuevo) => {
		setPuestosEditados((prev) =>
			prev.map((p) => (p.id === id ? { ...p, nombre: nombreNuevo } : p))
		);
	};

	// Función para cambiar el color del botón
	const cambiarColorBoton = (id, colorNuevo) => {
		setPuestosEditados((prev) =>
			prev.map((p) => (p.id === id ? { ...p, color: colorNuevo } : p))
		);
	};

	// Función para cambiar el color de fondo de la pantalla
	const cambiarColorFondo = (id, colorNuevo) => {
		setPuestosEditados((prev) =>
			prev.map((p) => (p.id === id ? { ...p, bgColor: colorNuevo } : p))
		);
	};

	// Función para borrar un puesto de la lista temporal
	const eliminar = (id) => {
		setPuestosEditados((prev) => prev.filter((p) => p.id !== id));
	};

	if (!abierto) return null;

	return (
		<div className="alim-modal-overlay">
			<div className="alim-modal">
				<h2>Editar Puestos</h2>

				{/* Lista scrolleable de puestos */}
				<div className="alim-edit-list">
					{puestosEditados.map((p) => (
						<div key={p.id} className="alim-edit-row">

							{/* Input Nombre */}
							<input
								type="text"
								className="alim-edit-input"
								value={p.nombre}
								onChange={(e) => cambiarNombre(p.id, e.target.value)}
								placeholder="Nombre del puesto"
							/>

							<div className="alim-edit-right">
								{/* Selector Color Botón */}
								<div className="alim-edit-color-group">
									<span className="alim-edit-color-label">Botón</span>
									<input
										type="color"
										className="alim-edit-color-input"
										value={p.color}
										onChange={(e) =>
											cambiarColorBoton(p.id, e.target.value)
										}
										title="Color del botón"
									/>
								</div>

								{/* Selector Color Fondo */}
								<div className="alim-edit-color-group">
									<span className="alim-edit-color-label">Fondo</span>
									<input
										type="color"
										className="alim-edit-color-input"
										value={p.bgColor || "#e5e7eb"}
										onChange={(e) =>
											cambiarColorFondo(p.id, e.target.value)
										}
										title="Color de fondo de pantalla"
									/>
								</div>

								{/* Botón Eliminar */}
								<button
									type="button"
									className="alim-edit-delete"
									onClick={() => eliminar(p.id)}
								>
									Eliminar
								</button>
							</div>
						</div>
					))}
				</div>

				{/* Botones de Acción */}
				<div className="alim-modal-actions">
					<button
						type="button"
						className="alim-modal-btn alim-modal-btn-cancelar"
						onClick={onCerrar}
					>
						Cancelar
					</button>
					<button
						type="button"
						className="alim-modal-btn alim-modal-btn-guardar"
						onClick={handleSubmit}
					>
						Guardar
					</button>
				</div>
			</div>
		</div>
	);
};

export default ModalEditarPuestos;
