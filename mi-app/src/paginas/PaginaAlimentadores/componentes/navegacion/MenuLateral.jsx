import React from "react";
import "./MenuLateral.css";

/**
 * Menú lateral (drawer) para modo compacto
 * Muestra puestos y acciones en un panel deslizante
 */
const MenuLateral = ({
	abierto,
	onCerrar,
	puestos,
	puestoSeleccionado,
	onSeleccionarPuesto,
	onAbrirModalNuevoPuesto,
	onAbrirModalEditarPuestos,
	onSalir,
	coloresSistema,
}) => {
	const handleSeleccionarPuesto = (id) => {
		onSeleccionarPuesto(id);
		onCerrar();
	};

	const handleAccion = (accion) => {
		onCerrar();
		accion();
	};

	return (
		<div
			className={"alim-drawer-overlay" + (abierto ? " alim-drawer-open" : "")}
			onClick={onCerrar}
		>
			<aside className="alim-drawer" onClick={(e) => e.stopPropagation()}>
				<header className="alim-drawer-header">
					<h2 className="alim-drawer-title">Panel de Alimentadores</h2>
					{puestoSeleccionado && (
						<p className="alim-drawer-subtitle">
							Puesto actual: <strong>{puestoSeleccionado.nombre}</strong>
						</p>
					)}
				</header>

				<section className="alim-drawer-section">
					<h3 className="alim-drawer-section-title">Puestos</h3>
					<div className="alim-drawer-puestos">
						{puestos.map((p) => (
							<button
								key={p.id}
								className={
									"alim-btn alim-drawer-btn-puesto" +
									(puestoSeleccionado && puestoSeleccionado.id === p.id
										? " alim-btn-active"
										: "")
								}
								style={{
									backgroundColor: p.color || coloresSistema[0],
								}}
								onClick={() => handleSeleccionarPuesto(p.id)}
							>
								{p.nombre}
							</button>
						))}
					</div>
				</section>

				<section className="alim-drawer-section">
					<h3 className="alim-drawer-section-title">Acciones</h3>
					<div className="alim-drawer-actions">
						<button
							type="button"
							className="alim-btn alim-drawer-btn-action alim-drawer-btn-add"
							onClick={() => handleAccion(onAbrirModalNuevoPuesto)}
						>
							<span className="alim-drawer-btn-add-icon">+</span>
							<span>Nuevo puesto</span>
						</button>

						<button
							type="button"
							className="alim-btn alim-drawer-btn-action alim-btn-edit"
							onClick={() => handleAccion(onAbrirModalEditarPuestos)}
							disabled={puestos.length === 0}
						>
							✎ Editar puestos
						</button>

						<button
							type="button"
							className="alim-btn-exit alim-drawer-btn-action"
							onClick={() => handleAccion(onSalir)}
						>
							Salir
						</button>
					</div>
				</section>
			</aside>
		</div>
	);
};

export default MenuLateral;
