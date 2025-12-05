import React from "react";
import "./MenuLateral.css";
import "./BotonesComunes.css";

/**
 * ==============================================================================
 * COMPONENTE: MenuLateral (Drawer)
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es el menú deslizante que aparece en celulares y tablets cuando tocas el botón
 * de las tres rayitas (hamburguesa).
 * 
 * ¿CÓMO FUNCIONA?
 * - Se muestra solo cuando la propiedad "abierto" es true.
 * - Tiene dos secciones principales:
 *   1. Lista de Puestos: Para cambiar entre estaciones.
 *   2. Acciones: Botones para crear, editar o salir.
 * 
 * FINALIDAD:
 * Ofrecer una navegación cómoda en pantallas pequeñas donde no cabe la barra
 * superior completa.
 */

const MenuLateral = ({
	abierto, 					// true = visible, false = oculto
	onCerrar, 					// Función para cerrar el menú
	puestos, 					// Lista de puestos a mostrar
	puestoSeleccionado, 		// Cuál está activo ahora
	onSeleccionarPuesto, 		// Función al hacer click en un puesto
	onAbrirModalNuevoPuesto, 	// Función para crear nuevo
	onAbrirModalEditarPuestos, 	// Función para editar
	onSalir, 					// Función para salir
	coloresSistema, 			// Colores para los botones
}) => {

	// Helper: Selecciona un puesto y cierra el menú automáticamente
	const handleSeleccionarPuesto = (id) => {
		onSeleccionarPuesto(id);
		onCerrar();
	};

	// Helper: Ejecuta una acción (ej: abrir modal) y cierra el menú
	const handleAccion = (accion) => {
		onCerrar();
		accion();
	};

	return (
		// El overlay es el fondo oscuro semitransparente detrás del menú
		<div
			className={"alim-drawer-overlay" + (abierto ? " alim-drawer-open" : "")}
			onClick={onCerrar} // Si tocas el fondo oscuro, se cierra el menú
		>
			{/* El aside es el panel deslizante en sí */}
			<aside className="alim-drawer" onClick={(e) => e.stopPropagation()}>

				{/* Encabezado del menú */}
				<header className="alim-drawer-header">
					<h2 className="alim-drawer-title">Panel de Alimentadores</h2>
					{puestoSeleccionado && (
						<p className="alim-drawer-subtitle">
							Puesto actual: <strong>{puestoSeleccionado.nombre}</strong>
						</p>
					)}
				</header>

				{/* SECCIÓN 1: Lista de Puestos */}
				<section className="alim-drawer-section">
					<h3 className="alim-drawer-section-title">Puestos</h3>
					<div className="alim-drawer-puestos">
						{puestos.map((p) => (
							<button
								key={p.id}
								className={
									"alim-btn alim-drawer-btn-puesto" +
									(puestoSeleccionado && puestoSeleccionado.id === p.id
										? " alim-btn-active" // Resaltar si es el actual
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

				{/* SECCIÓN 2: Botones de Acción */}
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
