import React from "react";
import "./BarraNavegacion.css";

/**
 * Barra de navegación superior
 * Muestra botones de puestos, controles y título
 */
const BarraNavegacion = ({
	esCompacto,
	puestos,
	puestoSeleccionado,
	onSeleccionarPuesto,
	onAbrirModalNuevoPuesto,
	onAbrirModalEditarPuestos,
	onSalir,
	onAbrirMenu,
	coloresSistema,
}) => {
	return (
		<nav className={"alim-navbar" + (esCompacto ? " alim-navbar-compact" : "")}>
			{esCompacto ? (
				<>
					{/* Botón menú en modo compacto */}
					<button
						type="button"
						className="alim-navbar-menu-btn"
						onClick={onAbrirMenu}
						aria-label="Abrir menú"
					>
						☰
					</button>

					{/* Título centrado */}
					<div className="alim-navbar-compact-title">
						{puestoSeleccionado
							? puestoSeleccionado.nombre
							: "Panel de Alimentadores"}
					</div>
				</>
			) : (
				<>
					<div className="alim-navbar-left">
						<h1 className="alim-title">Panel de Alimentadores</h1>

						{puestoSeleccionado && (
							<div className="alim-current-puesto">
								{puestoSeleccionado.nombre}
							</div>
						)}
					</div>

					<div className="alim-nav-buttons">
						{/* BLOQUE 2: botones de puestos (dinámicos) */}
						<div className="alim-nav-bloque-puestos">
							{puestos.map((p) => (
								<button
									key={p.id}
									className={
										"alim-btn" +
										(puestoSeleccionado && puestoSeleccionado.id === p.id
											? " alim-btn-active"
											: "")
									}
									onClick={() => onSeleccionarPuesto(p.id)}
									style={{
										backgroundColor: p.color || coloresSistema[0],
									}}
								>
									{p.nombre}
								</button>
							))}
						</div>

						{/* BLOQUE 1: botones fijos */}
						<div className="alim-nav-bloque-controles">
							<button
								type="button"
								className="alim-btn alim-btn-add"
								onClick={onAbrirModalNuevoPuesto}
							>
								<span className="alim-btn-add-icon">+</span>
							</button>

							<button
								type="button"
								className="alim-btn alim-btn-edit"
								onClick={onAbrirModalEditarPuestos}
								disabled={puestos.length === 0}
							>
								✎
							</button>

							<button
								type="button"
								className="alim-btn-exit"
								onClick={onSalir}
							>
								Salir
							</button>
						</div>
					</div>
				</>
			)}
		</nav>
	);
};

export default BarraNavegacion;
