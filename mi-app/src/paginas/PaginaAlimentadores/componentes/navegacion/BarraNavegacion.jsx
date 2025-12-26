// src/paginas/PaginaAlimentadores/componentes/navegacion/BarraNavegacion.jsx

import React, { useState } from "react";
import "./BarraNavegacion.css";            // estilos específicos de la barra superior
import { usarContextoAlimentadores } from "../../contexto/ContextoAlimentadoresSupabase";
import SelectorConfiguracion from "./SelectorConfiguracion.jsx";
import BotonGuardarCambios from "./BotonGuardarCambios.jsx";

/**
 * Barra de navegación superior.
 * Muestra título, botones de selección de puesto y controles globales.
 */
const BarraNavegacion = ({
	esCompacto,                             // true en pantallas angostas (modo compacto)
	puestos,                                // lista de puestos disponibles
	puestoSeleccionado,                     // puesto actualmente activo
	onSeleccionarPuesto,                    // callback al hacer clic en un botón de puesto
	onAbrirModalNuevoPuesto,                // callback para abrir modal "Nuevo puesto"
	onAbrirModalEditarPuestos,              // callback para abrir modal "Editar puestos"
	onAbrirModalConfigPuesto,               // callback para abrir modal de configuración del puesto
	onAbrirModalConfigurarAgente,           // callback para abrir modal de configuración del agente
	onAbrirModalGestionarAccesos,           // callback para abrir modal de gestión de accesos
	onAbrirModalPanelPermisos,              // callback para abrir modal de panel de permisos (solo superadmin)
	onSalir,                                // callback para cerrar sesión / volver al inicio
	onAbrirMenu,                            // callback para abrir el menú lateral en modo compacto
	coloresSistema,                         // paleta de colores para botones de puesto
	estaPolling,                            // (alimId) => boolean - verifica si un alimentador está en polling
	onPlayStopClick,                        // (alimId) => void - alterna polling de un alimentador
}) => {
	const {
		hayCambiosPendientes,
		sincronizando,
		sincronizarCambios,
		descartarCambios,
	} = usarContextoAlimentadores();

	// Estado para el diálogo de confirmación
	const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

	// ===== LÓGICA DEL BOTÓN MAESTRO GLOBAL =====
	// Helper para verificar si un alimentador puede hacer polling (misma lógica que ModalConfiguracionPuesto)
	const puedeHacerPolling = (alim) => {
		if (!alim.intervalo_consulta_ms || alim.intervalo_consulta_ms <= 0) return false;

		const cardDesign = alim.card_design || {};
		const superior = cardDesign.superior || {};
		const inferior = cardDesign.inferior || {};

		const tieneRegistrador = !!superior.registrador_id || !!inferior.registrador_id || !!alim.registrador_id;
		if (!tieneRegistrador) return false;

		// Verificar que al menos un box esté habilitado con índice válido
		const boxesSuperior = superior.boxes || [];
		const boxesInferior = inferior.boxes || [];
		const todosLosBoxes = [...boxesSuperior, ...boxesInferior];

		const tieneBoxHabilitado = todosLosBoxes.some(
			(box) => box.enabled && box.indice !== null && box.indice !== undefined && box.indice !== ""
		);

		return tieneBoxHabilitado;
	};

	const calcularEstadoGlobal = () => {
		if (!puestoSeleccionado) {
			return { alimentadoresConPolling: [], hayAlgunaCardDisponible: false, algunaCardMidiendo: false };
		}

		const alimentadores = puestoSeleccionado.alimentadores || [];

		// Filtrar solo los alimentadores que pueden hacer polling
		const alimentadoresConPolling = alimentadores.filter(puedeHacerPolling);

		const hayAlgunaCardDisponible = alimentadoresConPolling.length > 0;
		// Verificar si algún alimentador está actualmente en polling
		const algunaCardMidiendo = alimentadoresConPolling.some((alim) => estaPolling?.(alim.id));

		return { alimentadoresConPolling, hayAlgunaCardDisponible, algunaCardMidiendo };
	};

	const { alimentadoresConPolling, hayAlgunaCardDisponible, algunaCardMidiendo } = calcularEstadoGlobal();

	// Abre el diálogo de confirmación
	const handleClickMaestro = () => {
		if (!hayAlgunaCardDisponible) return;
		setMostrarConfirmacion(true);
	};

	// Ejecuta la acción después de confirmar - inicia o detiene el polling de todos los alimentadores
	const ejecutarMaestroGlobal = () => {
		setMostrarConfirmacion(false);

		if (algunaCardMidiendo) {
			// Detener todos los que están en polling
			alimentadoresConPolling.forEach((alim) => {
				if (estaPolling?.(alim.id)) {
					onPlayStopClick?.(alim.id);
				}
			});
		} else {
			// Iniciar todos los disponibles
			alimentadoresConPolling.forEach((alim) => {
				if (!estaPolling?.(alim.id)) {
					onPlayStopClick?.(alim.id);
				}
			});
		}
	};

	return (
		<>
		<nav
			className={
				"alim-navbar" + (esCompacto ? " alim-navbar-compact" : "")
			}                                  // aplica clase extra cuando está en modo compacto
		>
			{esCompacto ? (
				<>
					{/* Botón menú (solo en modo compacto / mobile) */}
					<button
						type="button"
						className="alim-navbar-menu-btn"
						onClick={onAbrirMenu}
						aria-label="Abrir menú"
					>
						☰
					</button>

					{/* Centro: nombre del puesto o texto genérico */}
					{puestoSeleccionado ? (
						<button
							type="button"
							className="alim-current-puesto-btn"
							onClick={onAbrirModalConfigPuesto}
							title="Configurar puesto"
						>
							{puestoSeleccionado.nombre}
						</button>
					) : (
						<div className="alim-navbar-compact-title">
							Panel de Alimentadores
						</div>
					)}

					{/* Botón maestro a la derecha (solo si hay puesto seleccionado) */}
					{puestoSeleccionado && (
						<button
							type="button"
							className={`alim-maestro-btn ${algunaCardMidiendo ? "alim-maestro-btn--stop" : ""} ${!hayAlgunaCardDisponible ? "alim-maestro-btn--disabled" : ""}`}
							onClick={handleClickMaestro}
							disabled={!hayAlgunaCardDisponible}
							title={!hayAlgunaCardDisponible ? "Sin registradores con configuración válida" : algunaCardMidiendo ? "Detener todas las mediciones" : "Iniciar todas las mediciones"}
						>
							{!hayAlgunaCardDisponible ? "⊘" : algunaCardMidiendo ? "⏹" : "▶"}
						</button>
					)}
				</>
			) : (
				<>
					{/* Lado izquierdo: título grande y nombre del puesto actual */}
					<div className="alim-navbar-left">
						<h1 className="alim-title">Panel de Alimentadores</h1>

						{puestoSeleccionado && (
							<div className="alim-puesto-row">
								<button
									type="button"
									className="alim-puesto-nombre-btn"
									onClick={onAbrirModalConfigPuesto}
									title="Configurar puesto"
								>
									{puestoSeleccionado.nombre}
								</button>
								<button
									type="button"
									className={`alim-maestro-btn-texto ${algunaCardMidiendo ? "alim-maestro-btn-texto--stop" : ""} ${!hayAlgunaCardDisponible ? "alim-maestro-btn-texto--disabled" : ""}`}
									onClick={handleClickMaestro}
									disabled={!hayAlgunaCardDisponible}
									title={!hayAlgunaCardDisponible ? "Sin registradores con configuración válida" : algunaCardMidiendo ? "Detener todas las mediciones" : "Iniciar todas las mediciones"}
								>
									{!hayAlgunaCardDisponible ? "⊘" : algunaCardMidiendo ? "PARAR MEDICIONES" : "INICIAR MEDICIONES"}
								</button>
							</div>
						)}
					</div>

					{/* Lado derecho: botones de puestos + controles */}
					<div className="alim-nav-buttons">
						{/* Bloque 2: botones de puestos (uno por cada puesto creado) */}
						<div className="alim-nav-bloque-puestos">
							{puestos.map((p) => (
								<button
									key={p.id}
									className={
										"alim-btn" +
										(puestoSeleccionado &&
										puestoSeleccionado.id === p.id
											? " alim-btn-active"
											: "")
									}
									onClick={() => onSeleccionarPuesto(p.id)}
									style={{
										backgroundColor:
											p.color || coloresSistema[0],
									}}                           // usa el color configurado para el botón
								>
									{p.nombre}
								</button>
							))}
						</div>

						{/* Bloque 1: botones de control fijo (nuevo, editar, config, salir) */}
						<div className="alim-nav-bloque-controles">
							<BotonGuardarCambios
								hayCambios={hayCambiosPendientes}
								sincronizando={sincronizando}
								onGuardar={sincronizarCambios}
								onDescartar={descartarCambios}
							/>

							<SelectorConfiguracion
								onAbrirModalNuevoPuesto={onAbrirModalNuevoPuesto}
								onAbrirModalEditarPuestos={onAbrirModalEditarPuestos}
								onAbrirModalConfigurarAgente={onAbrirModalConfigurarAgente}
								onAbrirModalGestionarAccesos={onAbrirModalGestionarAccesos}
								onAbrirModalPanelPermisos={onAbrirModalPanelPermisos}
								puestosLength={puestos.length}
							/>

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

		{/* Diálogo de confirmación para el botón maestro */}
		{mostrarConfirmacion && (
			<div className="alim-confirmacion-overlay">
				<div className="alim-confirmacion">
					<div className="alim-confirmacion__icono">
						{algunaCardMidiendo ? "⏹️" : "▶️"}
					</div>
					<h3 className="alim-confirmacion__titulo">
						{algunaCardMidiendo ? "¿Detener todas las mediciones?" : "¿Iniciar todas las mediciones?"}
					</h3>
					<p className="alim-confirmacion__mensaje">
						{algunaCardMidiendo
							? "Se detendrán las mediciones de todos los registradores activos en este puesto."
							: "Se iniciarán las mediciones de todos los registradores con configuración válida en este puesto."}
					</p>
					<div className="alim-confirmacion__botones">
						<button
							type="button"
							className="alim-confirmacion__btn alim-confirmacion__btn--cancelar"
							onClick={() => setMostrarConfirmacion(false)}
						>
							Cancelar
						</button>
						<button
							type="button"
							className={`alim-confirmacion__btn ${algunaCardMidiendo ? "alim-confirmacion__btn--detener" : "alim-confirmacion__btn--iniciar"}`}
							onClick={ejecutarMaestroGlobal}
						>
							{algunaCardMidiendo ? "Detener" : "Iniciar"}
						</button>
					</div>
				</div>
			</div>
		)}
		</>
	);
};

export default BarraNavegacion;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (BarraNavegacion.jsx)

 - Este componente es la barra superior fija del panel de alimentadores.
   En modo escritorio muestra el título, el puesto actual y todos los botones
   de puestos; en modo compacto solo muestra el botón de menú y el título.

 - La prop `esCompacto` viene de `VistaAlimentadores` y decide si se muestra la
   versión completa (desktop) o la versión reducida (mobile).

 - El array `puestos` se recorre para dibujar un botón por puesto; el que está
   seleccionado recibe la clase `alim-btn-active` y el color que tenga
   configurado (`p.color`).

 - Los callbacks `onSeleccionarPuesto`, `onAbrirModalNuevoPuesto`,
   `onAbrirModalEditarPuestos` y `onSalir` se conectan directamente con la
   lógica del contexto y la navegación, pero este componente se limita a
   dispararlos cuando corresponde (no sabe la lógica interna).
---------------------------------------------------------------------------*/}

{/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (BarraNavegacion.jsx)

0) Visión general del componente

   `BarraNavegacion` es la barra superior fija del panel de alimentadores.

   - En modo escritorio:
       • muestra el título grande “Panel de Alimentadores”,
       • debajo, el nombre del puesto actualmente seleccionado,
       • a la derecha, todos los botones de puestos,
       • y los controles globales: nuevo puesto, editar puestos, salir.

   - En modo compacto (pantallas angostas):
       • muestra solo:
           - un botón de menú (☰) para abrir el panel lateral,
           - un título centrado (nombre del puesto actual o texto genérico).


1) Props del componente

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
   }) => { ... }

   - `esCompacto` (boolean):
       • true  → se usa el layout reducido (mobile),
       • false → se usa el layout completo (desktop).

   - `puestos` (array):
       • lista de todos los puestos creados,
       • cada puesto suele tener `{ id, nombre, color, ... }`.

   - `puestoSeleccionado` (objeto o null):
       • el puesto actualmente activo,
       • si existe, se muestra su nombre y se marca su botón.

   - `onSeleccionarPuesto(idPuesto)`:
       • callback que se llama al hacer clic en el botón de un puesto.

   - `onAbrirModalNuevoPuesto()`:
       • se ejecuta al hacer clic en el botón "+".

   - `onAbrirModalEditarPuestos()`:
       • se ejecuta al hacer clic en el botón de edición (✎).

   - `onSalir()`:
       • se ejecuta al hacer clic en el botón “Salir” (volver al login).

   - `onAbrirMenu()`:
       • se usa solo en modo compacto para abrir el menú lateral.

   - `coloresSistema` (array de colores):
       • paleta de fallback para botones de puestos,
       • si un puesto no tiene `color`, se usa `coloresSistema[0]`.


2) Contenedor principal <nav>

   return (
     <nav
       className={
         "alim-navbar" + (esCompacto ? " alim-navbar-compact" : "")
       }
     >
       {esCompacto ? ( ... ) : ( ... )}
     </nav>
   );

   - El `<nav>` usa siempre la clase base `"alim-navbar"`.

   - Si `esCompacto` es true, agrega también `"alim-navbar-compact"`,
     que aplica estilos específicos para el modo reducido (CSS).

   - Dentro del nav se hace un condicional:
       • si `esCompacto` es true → renderiza la versión compacta,
       • si es false → renderiza la versión completa.


3) Modo compacto (mobile)

   {esCompacto ? (
     <>
       <button ... onClick={onAbrirMenu}>☰</button>
       <div className="alim-navbar-compact-title">
         {puestoSeleccionado ? puestoSeleccionado.nombre : "Panel de Alimentadores"}
       </div>
     </>
   ) : ( ... )}

   - Botón de menú:
       • solo aparece en modo compacto,
       • tiene texto “☰” (ícono tipo hamburguesa),
       • `onClick={onAbrirMenu}`: dispara la apertura del menú lateral,
       • `aria-label="Abrir menú"`: mejora la accesibilidad.

   - Título centrado:
       • si hay `puestoSeleccionado`, muestra su nombre,
       • si no, muestra el texto genérico `"Panel de Alimentadores"`.

   - En este modo NO se muestran los botones de puestos ni los controles
     de nuevo/editar/salir; esas funciones se acceden desde el menú lateral.


4) Modo escritorio (layout completo)

   : (
     <>
       // Lado izquierdo: título y puesto actual 
       <div className="alim-navbar-left">
         <h1 className="alim-title">Panel de Alimentadores</h1>

         {puestoSeleccionado && (
           <div className="alim-current-puesto">
             {puestoSeleccionado.nombre}
           </div>
         )}
       </div>

       // Lado derecho: botones de puestos + controles 
       <div className="alim-nav-buttons">
         // Bloque de puestos 
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

         // Bloque de controles
         <div className="alim-nav-bloque-controles">
           <button ... onClick={onAbrirModalNuevoPuesto}>+</button>
           <button ... onClick={onAbrirModalEditarPuestos} disabled={puestos.length === 0}>✎</button>
           <button ... onClick={onSalir}>Salir</button>
         </div>
       </div>
     </>
   )

   4.1) Lado izquierdo

   - `<h1 className="alim-title">Panel de Alimentadores</h1>`:
       • título fijo de la pantalla.

   - `puestoSeleccionado && <div className="alim-current-puesto">...`:
       • si hay puesto seleccionado, se muestra su nombre debajo del título,
       • si no hay, directamente no se renderiza ese div.


   4.2) Botones de puestos (lado derecho, bloque de puestos)

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
       style={{ backgroundColor: p.color || coloresSistema[0] }}
     >
       {p.nombre}
     </button>
   ))}

   - Se recorre el array `puestos` y se dibuja un botón por cada puesto.

   - `key={p.id}`:
       • clave única para que React identifique cada botón.

   - `className`:
       • siempre tiene la clase base `"alim-btn"`,
       • si este puesto es el seleccionado (`puestoSeleccionado.id === p.id`),
         se agrega `"alim-btn-active"`, lo que aplica estilos de “botón activo”.

   - `onClick={() => onSeleccionarPuesto(p.id)}`:
       • al hacer clic, se llama al callback con el id del puesto,
       • la lógica de cambio de puesto vive afuera, en la vista/contexto.

   - `style={{ backgroundColor: p.color || coloresSistema[0] }}`:
       • usa el color configurado en el puesto (`p.color`),
       • si el puesto no tiene color, cae al primer color del sistema.


   4.3) Botones de control (lado derecho, bloque de controles)

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

   - Botón de “nuevo puesto”:
       • muestra un “+”,
       • dispara `onAbrirModalNuevoPuesto` → abre modal de alta de puesto.

   - Botón de “editar puestos”:
       • muestra un ícono ✎,
       • dispara `onAbrirModalEditarPuestos`,
       • está `disabled` mientras `puestos.length === 0` (no hay nada que editar).

   - Botón “Salir”:
       • dispara `onSalir`,
       • normalmente vuelve al login o pantalla inicial.


5) Export

   export default BarraNavegacion;

   - Exporta el componente para ser usado en `VistaAlimentadores`.
	
   - Esa vista le pasa:
       • los datos (puestos, puesto actual, colores),
       • y los callbacks (seleccionar, nuevo, editar, salir, abrir menú).

---------------------------------------------------------------------------*/}


