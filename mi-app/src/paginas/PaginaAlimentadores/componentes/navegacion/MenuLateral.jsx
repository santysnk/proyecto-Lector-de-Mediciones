// src/paginas/PaginaAlimentadores/componentes/navegacion/MenuLateral.jsx

import React, { useState } from "react";
import "./MenuLateral.css";             // estilos del drawer lateral
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";

/**
 * Menú lateral (drawer) para modo compacto.
 * Muestra puestos, workspaces y acciones en un panel deslizante.
 */
const MenuLateral = ({
	abierto,                            // boolean: controla si el drawer está visible
	onCerrar,                           // callback para cerrar el drawer
	puestos,                            // lista de puestos
	puestoSeleccionado,                 // puesto actualmente activo
	onSeleccionarPuesto,                // callback al elegir un puesto
	onAbrirModalNuevoPuesto,            // callback para abrir modal "Nuevo puesto"
	onAbrirModalEditarPuestos,          // callback para abrir modal "Editar puestos"
	onAbrirModalConfigurarAgente,       // callback para abrir modal "Configurar Agente"
	onAbrirModalGestionarAccesos,       // callback para abrir modal "Gestionar Accesos"
	onSalir,                            // callback para salir al login
	coloresSistema,                     // paleta de colores para botones de puesto
}) => {
	const {
		configuraciones,
		configuracionSeleccionada,
		seleccionarConfiguracion,
		agregarConfiguracion,
		puedeCrearWorkspaces,
		rolGlobal,
		perfil,
	} = usarContextoConfiguracion();

	const [submenuWorkspaceAbierto, setSubmenuWorkspaceAbierto] = useState(false);
	const [mostrarFormNuevoWorkspace, setMostrarFormNuevoWorkspace] = useState(false);
	const [nombreNuevoWorkspace, setNombreNuevoWorkspace] = useState("");
	const [creandoWorkspace, setCreandoWorkspace] = useState(false);

	const handleSeleccionarPuesto = (id) => {
		onSeleccionarPuesto(id);        // selecciona el puesto
		onCerrar();                     // cierra el menú después de elegir
	};

	const handleAccion = (accion) => {
		if (!accion) return;
		onCerrar();                     // primero cierra el menú
		accion();                       // luego ejecuta la acción (nuevo, editar, salir)
	};

	const handleSeleccionarWorkspace = (id) => {
		seleccionarConfiguracion(id);
		setSubmenuWorkspaceAbierto(false);
	};

	const handleCrearWorkspace = async (e) => {
		e.preventDefault();
		if (!nombreNuevoWorkspace.trim()) return;

		try {
			setCreandoWorkspace(true);
			await agregarConfiguracion(nombreNuevoWorkspace.trim());
			setNombreNuevoWorkspace("");
			setMostrarFormNuevoWorkspace(false);
		} catch (err) {
			console.error("Error creando workspace:", err);
		} finally {
			setCreandoWorkspace(false);
		}
	};

	return (
		<div
			className={
				"alim-drawer-overlay" + (abierto ? " alim-drawer-open" : "")
			}                             // overlay oscuro + animación de apertura
			onClick={onCerrar}            // clic fuera del panel cierra el drawer
		>
			<aside
				className="alim-drawer"
				onClick={(e) => e.stopPropagation()} // evita que el clic dentro cierre el drawer
			>
				<header className="alim-drawer-header">
					<h2 className="alim-drawer-title">Panel de Alimentadores</h2>
					{puestoSeleccionado && (
						<p className="alim-drawer-subtitle">
							Puesto actual:{" "}
							<strong>{puestoSeleccionado.nombre}</strong>
						</p>
					)}
				</header>

				{/* Info del usuario */}
				{perfil && (
					<div className="alim-drawer-usuario">
						<span className="alim-drawer-usuario-nombre">{perfil.nombre || perfil.email}</span>
						<span className="alim-drawer-usuario-rol">{perfil.roles?.nombre || rolGlobal}</span>
					</div>
				)}

				{/* Sección Workspace */}
				<section className="alim-drawer-section">
					<h3 className="alim-drawer-section-title">Workspace</h3>

					{/* Botón para expandir/colapsar lista de workspaces */}
					<button
						type="button"
						className="alim-drawer-workspace-trigger"
						onClick={() => setSubmenuWorkspaceAbierto(!submenuWorkspaceAbierto)}
					>
						<span className={`alim-drawer-workspace-flecha ${submenuWorkspaceAbierto ? 'alim-drawer-workspace-flecha--abierto' : ''}`}>▶</span>
						<span>{configuracionSeleccionada?.nombre || "Sin workspace"}</span>
					</button>

					{/* Lista de workspaces (submenú) */}
					{submenuWorkspaceAbierto && (
						<div className="alim-drawer-workspace-lista">
							{configuraciones.map((config) => (
								<button
									key={config.id}
									type="button"
									className={`alim-drawer-workspace-item ${config.id === configuracionSeleccionada?.id ? 'alim-drawer-workspace-item--activo' : ''}`}
									onClick={() => handleSeleccionarWorkspace(config.id)}
								>
									{config.nombre}
									{!config.esCreador && <em className="alim-drawer-workspace-invitado">(invitado)</em>}
								</button>
							))}
						</div>
					)}
				</section>

				<section className="alim-drawer-section">
					<h3 className="alim-drawer-section-title">Puestos</h3>
					<div className="alim-drawer-puestos">
						{puestos.map((p) => (
							<button
								key={p.id}
								className={
									"alim-btn alim-drawer-btn-puesto" +
									(puestoSeleccionado &&
									puestoSeleccionado.id === p.id
										? " alim-btn-active"
										: "")
								}
								style={{
									backgroundColor:
										p.color || coloresSistema[0],
								}}           // usa el color propio del puesto o uno por defecto
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
						{/* Gestionar Accesos (solo admin/superadmin o creador) */}
						{(rolGlobal === 'superadmin' || rolGlobal === 'admin' || configuracionSeleccionada?.esCreador) && (
							<button
								type="button"
								className="alim-drawer-btn-action alim-drawer-btn-accesos"
								onClick={() => handleAccion(onAbrirModalGestionarAccesos)}
							>
								<svg className="alim-drawer-btn-icon-svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
									<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
								</svg>
								Gestionar Accesos
							</button>
						)}

						{/* Nuevo puesto (solo admin/superadmin) */}
						{(rolGlobal === 'superadmin' || rolGlobal === 'admin') && (
							<button
								type="button"
								className="alim-drawer-btn-action alim-drawer-btn-add"
								onClick={() => handleAccion(onAbrirModalNuevoPuesto)}
							>
								<span className="alim-drawer-btn-icon">+</span>
								<span>Nuevo puesto</span>
							</button>
						)}

						<button
							type="button"
							className="alim-drawer-btn-action alim-drawer-btn-edit"
							onClick={() =>
								handleAccion(onAbrirModalEditarPuestos)
							}
							disabled={puestos.length === 0} // deshabilitado si no hay puestos
						>
							<span className="alim-drawer-btn-icon">✎</span>
							<span>Editar puestos</span>
						</button>

						{/* Configurar Agente (solo admin/superadmin) */}
						{(rolGlobal === 'superadmin' || rolGlobal === 'admin') && (
							<button
								type="button"
								className="alim-drawer-btn-action alim-drawer-btn-config"
								onClick={() => handleAccion(onAbrirModalConfigurarAgente)}
							>
								<span className="alim-drawer-btn-icon">⚙</span>
								Configurar Agente
							</button>
						)}

						{/* Crear nuevo workspace (solo si tiene permisos) */}
						{puedeCrearWorkspaces && (
							<>
								{mostrarFormNuevoWorkspace ? (
									<form className="alim-drawer-form-workspace" onSubmit={handleCrearWorkspace}>
										<input
											type="text"
											className="alim-drawer-input"
											placeholder="Nombre del workspace"
											value={nombreNuevoWorkspace}
											onChange={(e) => setNombreNuevoWorkspace(e.target.value)}
											autoFocus
											disabled={creandoWorkspace}
										/>
										<div className="alim-drawer-form-btns">
											<button
												type="button"
												className="alim-drawer-btn-cancelar"
												onClick={() => {
													setMostrarFormNuevoWorkspace(false);
													setNombreNuevoWorkspace("");
												}}
												disabled={creandoWorkspace}
											>
												Cancelar
											</button>
											<button
												type="submit"
												className="alim-drawer-btn-crear"
												disabled={!nombreNuevoWorkspace.trim() || creandoWorkspace}
											>
												{creandoWorkspace ? "..." : "Crear"}
											</button>
										</div>
									</form>
								) : (
									<button
										type="button"
										className="alim-drawer-btn-action alim-drawer-btn-nuevo-workspace"
										onClick={() => setMostrarFormNuevoWorkspace(true)}
									>
										<span className="alim-drawer-btn-icon">+</span>
										Nuevo workspace
									</button>
								)}
							</>
						)}

						<button
							type="button"
							className="alim-drawer-btn-action alim-drawer-btn-salir"
							onClick={() => handleAccion(onSalir)}
						>
							<span className="alim-drawer-btn-icon">↩</span>
							<span>Salir</span>
						</button>
					</div>
				</section>
			</aside>
		</div>
	);
};

export default MenuLateral;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (MenuLateral.jsx)

 - Este componente es el "menú hamburguesa" del modo compacto: un panel que
   se desliza desde la izquierda y permite cambiar de puesto o ejecutar
   acciones (nuevo puesto, editar puestos, salir).

 - La prop `abierto` decide si se aplican las clases de apertura en el overlay
   y el drawer; `onCerrar` se dispara al hacer clic fuera del panel o en alguna
   acción interna.

 - `handleSeleccionarPuesto` combina selección de puesto + cierre del menú para
   que la navegación se sienta más natural en mobile.

 - `handleAccion` es un pequeño helper que cierra el menú y luego ejecuta la
   acción que se le pase (abrir modal, salir, etc.), evitando repetir lógica.
---------------------------------------------------------------------------*/}

{/*---------------------------------------------------------------------------
CÓDIGO + EXPLICIÓN DE CADA PARTE (MenuLateral.jsx)

0) Visión general del componente

   `MenuLateral` es el menú tipo “hamburguesa” para el modo compacto (mobile):

   - Se muestra como un overlay oscuro que cubre la pantalla.
   - Desde la izquierda se desliza un panel (`aside`) con:
       • lista de puestos (para cambiar de puesto),
       • acciones rápidas: nuevo puesto, editar puestos, salir.

   La idea es que en pantallas chicas no haya una barra superior recargada, sino
   un panel lateral más cómodo para el dedo.


1) Props del componente

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
   }) => { ... }

   - `abierto` (boolean):
       • true  → el drawer se muestra (overlay activo + panel deslizado),
       • false → el drawer se oculta.

   - `onCerrar()`:
       • callback que se llama para cerrar el menú,
       • se usa tanto al hacer clic fuera del panel como dentro de algunas acciones.

   - `puestos` (array):
       • lista de todos los puestos,
       • se usa para dibujar un botón por cada uno.

   - `puestoSeleccionado` (objeto o null):
       • el puesto actualmente activo,
       • se muestra en el header y se marca su botón.

   - `onSeleccionarPuesto(idPuesto)`:
       • callback que cambia el puesto activo.

   - `onAbrirModalNuevoPuesto()`:
       • abre el modal de alta de puesto.

   - `onAbrirModalEditarPuestos()`:
       • abre el modal de edición masiva de puestos.

   - `onSalir()`:
       • vuelve al login / pantalla inicial.

   - `coloresSistema` (array):
       • paleta para colorear los botones de puestos (fallback si un puesto no tiene `color`).


2) Helpers internos: handleSeleccionarPuesto y handleAccion

   const handleSeleccionarPuesto = (id) => {
     onSeleccionarPuesto(id);
     onCerrar();
   };

   - Combina dos acciones típicas en mobile:
       • cambiar el puesto seleccionado,
       • cerrar el menú inmediatamente después.
   - Mejora la experiencia: el usuario toca un puesto → se aplica el cambio y
     el panel se pliega solo.

   const handleAccion = (accion) => {
     onCerrar();
     accion();
   };

   - Recibe una función `accion` (por ejemplo, `onAbrirModalNuevoPuesto`).
   - Siempre hace dos pasos, en este orden:
       1) cierra el menú (`onCerrar()`),
       2) ejecuta la acción recibida.
   - Evita repetir la lógica "cerrar + hacer algo" en cada botón.


3) Overlay principal (fondo oscuro + click fuera)

   return (
     <div
       className={
         "alim-drawer-overlay" + (abierto ? " alim-drawer-open" : "")
       }
       onClick={onCerrar}
     >
       ...
     </div>
   );

   - `className`:
       • `"alim-drawer-overlay"`      → base del overlay (cubre toda la pantalla),
       • si `abierto` es true         → agrega `" alim-drawer-open"`, que normalmente
                                        activa opacidad/animación para mostrar el panel.

   - `onClick={onCerrar}`:
       • cualquier clic sobre el overlay (fuera del panel) cierra el menú,
       • es el comportamiento típico de un drawer en mobile.


4) Panel lateral <aside> y cabecera

   <aside
     className="alim-drawer"
     onClick={(e) => e.stopPropagation()}
   >
     <header className="alim-drawer-header">
       <h2 className="alim-drawer-title">Panel de Alimentadores</h2>
       {puestoSeleccionado && (
         <p className="alim-drawer-subtitle">
           Puesto actual: <strong>{puestoSeleccionado.nombre}</strong>
         </p>
       )}
     </header>
     ...
   </aside>

   - `<aside className="alim-drawer">`:
       • es el panel blanco que se desliza desde la izquierda.

   - `onClick={(e) => e.stopPropagation()}`:
       • evita que el clic dentro del panel “suba” al overlay,
       • si no estuviera, cualquier clic adentro también dispararía `onCerrar`.

   - Header:
       • título fijo: “Panel de Alimentadores”,
       • si hay `puestoSeleccionado`, muestra “Puesto actual: <nombre>”
         para que el usuario sepa dónde está parado.


5) Sección de puestos

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

   - Se recorre el array `puestos` y se crea un botón por cada puesto.

   - `className`:
       • `"alim-btn alim-drawer-btn-puesto"` → estilo base del botón dentro del drawer,
       • si el puesto es el actual (`puestoSeleccionado.id === p.id`), se agrega
         `" alim-btn-active"` para resaltarlo visualmente.

   - `style={{ backgroundColor: p.color || coloresSistema[0] }}`:
       • usa el color específico del puesto (`p.color`),
       • si no tiene, usa el primer color de la paleta.

   - `onClick={() => handleSeleccionarPuesto(p.id)}`:
       • selecciona el puesto y cierra el menú (por cómo se implementó el helper).


6) Sección de acciones

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

   - “Nuevo puesto”:
       • botón con ícono “+” y texto “Nuevo puesto”,
       • `onClick={() => handleAccion(onAbrirModalNuevoPuesto)}`:
           - cierra el menú,
           - abre el modal de creación de puesto.

   - “Editar puestos”:
       • muestra ícono ✎ + texto “Editar puestos”,
       • `onClick={() => handleAccion(onAbrirModalEditarPuestos)}`,
       • `disabled={puestos.length === 0}`:
           - si no hay ningún puesto, no tiene sentido editar → se deshabilita.

   - “Salir”:
       • botón con estilo de salida (`alim-btn-exit`),
       • `onClick={() => handleAccion(onSalir)}`:
           - cierra el menú,
           - y luego ejecuta la lógica de salida (normalmente `navigate("/")`). 


7) Export

   export default MenuLateral;

   - Exporta el componente para que `VistaAlimentadores` pueda usarlo.

   - Esa vista controla:
       • cuándo abrirlo (`abierto`),
       • y qué callbacks pasarle (seleccionar puesto, nuevo, editar, salir).

---------------------------------------------------------------------------*/}
