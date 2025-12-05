import React from "react";
import "./BarraNavegacion.css";
import "./BotonesComunes.css";

/**
 * ==============================================================================
 * COMPONENTE: BarraNavegacion
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es la barra superior que ves en la aplicación. Contiene:
 * 1. El título de la aplicación.
 * 2. Los botones para cambiar entre diferentes puestos (estaciones).
 * 3. Botones de control: Agregar puesto (+), Editar (lápiz) y Salir.
 * 
 * ¿CÓMO FUNCIONA?
 * Recibe toda la información que necesita (lista de puestos, cuál está seleccionado, etc.)
 * a través de sus "props" (parámetros). No maneja datos por sí mismo, solo muestra
 * lo que le dicen.
 * 
 * Tiene dos modos visuales:
 * - Normal (Escritorio): Muestra todo completo.
 * - Compacto (Móvil): Muestra un menú hamburguesa y esconde los botones para ahorrar espacio.
 */

const BarraNavegacion = ({
	esCompacto, 				// true si la pantalla es pequeña
	puestos, 					// Lista de todos los puestos disponibles
	puestoSeleccionado, 		// El puesto que se está viendo ahora
	onSeleccionarPuesto, 		// Función para cambiar de puesto
	onAbrirModalNuevoPuesto, 	// Función para abrir el modal de crear
	onAbrirModalEditarPuestos, 	// Función para abrir el modal de editar
	onSalir, 					// Función para salir de la app
	onAbrirMenu, 				// Función para abrir el menú lateral (solo móvil)
	coloresSistema, 			// Lista de colores disponibles
}) => {
	return (
		<nav className={"alim-navbar" + (esCompacto ? " alim-navbar-compact" : "")}>

			{/* =================================================================
			    MODO COMPACTO (Móviles y Tablets pequeñas)
			    ================================================================= */}
			{esCompacto ? (
				<>
					{/* Botón de 3 rayitas (hamburguesa) */}
					<button
						type="button"
						className="alim-navbar-menu-btn"
						onClick={onAbrirMenu}
						aria-label="Abrir menú"
					>
						☰
					</button>

					{/* Título simple centrado */}
					<div className="alim-navbar-compact-title">
						{puestoSeleccionado
							? puestoSeleccionado.nombre
							: "Panel de Alimentadores"}
					</div>
				</>
			) : (
				/* =================================================================
					MODO ESCRITORIO (Pantallas grandes)
					================================================================= */
				<>
					{/* Lado Izquierdo: Títulos */}
					<div className="alim-navbar-left">
						<h1 className="alim-title">Panel de Alimentadores</h1>

						{puestoSeleccionado && (
							<div className="alim-current-puesto">
								{puestoSeleccionado.nombre}
							</div>
						)}
					</div>

					{/* Lado Derecho: Botones */}
					<div className="alim-nav-buttons">

						{/* GRUPO 1: Botones de Puestos (Se generan dinámicamente) */}
						<div className="alim-nav-bloque-puestos">
							{puestos.map((p) => (
								<button
									key={p.id}
									className={
										"alim-btn" +
										(puestoSeleccionado && puestoSeleccionado.id === p.id
											? " alim-btn-active" // Clase especial si está seleccionado
											: "")
									}
									onClick={() => onSeleccionarPuesto(p.id)}
									style={{
										backgroundColor: p.color || coloresSistema[0], // Color personalizado del puesto
									}}
								>
									{p.nombre}
								</button>
							))}
						</div>

						{/* GRUPO 2: Controles Fijos (+, Editar, Salir) */}
						<div className="alim-nav-bloque-controles">
							<button
								type="button"
								className="alim-btn alim-btn-add"
								onClick={onAbrirModalNuevoPuesto}
								title="Nuevo Puesto"
							>
								<span className="alim-btn-add-icon">+</span>
							</button>

							<button
								type="button"
								className="alim-btn alim-btn-edit"
								onClick={onAbrirModalEditarPuestos}
								disabled={puestos.length === 0} // Deshabilitado si no hay puestos
								title="Editar Puestos"
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
