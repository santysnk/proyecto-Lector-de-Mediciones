import React, { useState, useEffect } from "react";
import "./ModalEditarPuestos.css";

/**
 * Modal para editar puestos existentes
 * Permite renombrar, cambiar colores y eliminar puestos
 */
const ModalEditarPuestos = ({ abierto, puestos, onCerrar, onGuardar }) => {
	const [puestosEditados, setPuestosEditados] = useState([]);

	useEffect(() => {
		if (abierto) {
			setPuestosEditados(puestos.map((p) => ({ ...p })));
		}
	}, [abierto, puestos]);

	const handleSubmit = () => {
		onGuardar(puestosEditados);
	};

	const cambiarNombre = (id, nombreNuevo) => {
		setPuestosEditados((prev) =>
			prev.map((p) => (p.id === id ? { ...p, nombre: nombreNuevo } : p))
		);
	};

	const cambiarColorBoton = (id, colorNuevo) => {
		setPuestosEditados((prev) =>
			prev.map((p) => (p.id === id ? { ...p, color: colorNuevo } : p))
		);
	};

	const cambiarColorFondo = (id, colorNuevo) => {
		setPuestosEditados((prev) =>
			prev.map((p) => (p.id === id ? { ...p, bgColor: colorNuevo } : p))
		);
	};

	const eliminar = (id) => {
		setPuestosEditados((prev) => prev.filter((p) => p.id !== id));
	};

	if (!abierto) return null;

	return (
		<div className="alim-modal-overlay">
			<div className="alim-modal">
				<h2>Editar Puestos</h2>

				<div className="alim-edit-list">
					{puestosEditados.map((p) => (
						<div key={p.id} className="alim-edit-row">
							<input
								type="text"
								className="alim-edit-input"
								value={p.nombre}
								onChange={(e) => cambiarNombre(p.id, e.target.value)}
							/>

							<div className="alim-edit-right">
								<div className="alim-edit-color-group">
									<span className="alim-edit-color-label">Botón</span>
									<input
										type="color"
										className="alim-edit-color-input"
										value={p.color}
										onChange={(e) =>
											cambiarColorBoton(p.id, e.target.value)
										}
									/>
								</div>

								<div className="alim-edit-color-group">
									<span className="alim-edit-color-label">Fondo</span>
									<input
										type="color"
										className="alim-edit-color-input"
										value={p.bgColor || "#e5e7eb"}
										onChange={(e) =>
											cambiarColorFondo(p.id, e.target.value)
										}
									/>
								</div>

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
