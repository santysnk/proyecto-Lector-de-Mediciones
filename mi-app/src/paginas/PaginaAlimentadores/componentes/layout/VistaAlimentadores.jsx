// src/paginas/PaginaAlimentadores/componentes/layout/VistaAlimentadores.jsx

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";                                    // para portal del overlay
import { useNavigate } from "react-router-dom";                     // navegación entre rutas
import "./VistaAlimentadores.css";                                  // estilos específicos del layout de alimentadores
import "../navegacion/BotonGuardarCambios.css";                     // estilos del overlay de guardando

import BarraNavegacion from "../navegacion/BarraNavegacion.jsx";    // barra superior (título + botones de puestos)
import MenuLateral from "../navegacion/MenuLateral.jsx";            // menú lateral en modo compacto (mobile)
import GrillaTarjetas from "../tarjetas/GrillaTarjetas.jsx";        // grilla de tarjetas de alimentadores
import SkeletonCard from "../tarjetas/SkeletonCard.jsx";            // skeleton de tarjeta (loading state)
import ModalNuevoPuesto from "../modales/ModalNuevoPuesto.jsx";     // modal para crear puestos
import ModalEditarPuestos from "../modales/ModalEditarPuestos.jsx"; // modal para editar/renombrar/eliminar puestos
import ModalConfiguracionAlimentador from "../modales/ModalConfiguracionAlimentador.jsx"; // modal de config de registrador
import ModalMapeoMediciones from "../modales/ModalMapeoMediciones.jsx";                   // modal de mapeo de mediciones
import ModalConfiguracionPuesto from "../modales/ModalConfiguracionPuesto.jsx";           // modal de configuración global del puesto

import { COLORES_SISTEMA } from "../../constantes/colores";         // paleta de colores para botones/puestos
import { usarArrastrarSoltar } from "../../hooks/usarArrastrarSoltar"; // hook de drag & drop de tarjetas
import { usarContextoAlimentadores } from "../../contexto/ContextoAlimentadoresSupabase"; // contexto con datos y acciones (Supabase)
import { useGestorModales } from "../../hooks/useGestorModales";    // hook para abrir/cerrar modales por clave

const VistaAlimentadores = () => {
	const navigate = useNavigate();                                  // para salir al login

	const {
   puestos,                               // lista completa de puestos configurados en el sistema
   puestoSeleccionado,                    // puesto actualmente activo/visible en la vista
   agregarPuesto,                         // agrega un nuevo puesto (se usa desde el modal de nuevo puesto)
   eliminarPuesto,                        // elimina un puesto de la BD
   seleccionarPuesto,                     // cambia el puesto activo cuando el usuario hace clic en otro
   actualizarPuestos,                     // guarda la lista de puestos editada (nombres/colores, orden, etc.)
   agregarAlimentador,                    // agrega un alimentador al puesto seleccionado
   actualizarAlimentador,                 // actualiza los datos de un alimentador existente
   eliminarAlimentador,                   // elimina un alimentador de un puesto
   reordenarAlimentadores,                // guarda el nuevo orden de alimentadores tras el drag & drop
   lecturasTarjetas,                      // lecturas ya procesadas listas para mostrar en las tarjetas
   estaMidiendo,                          // indica si un alimentador/equipo está midiendo (true/false)
   obtenerRegistros,                      // obtiene los registros crudos de un alimentador ("rele" / "analizador")
   obtenerTimestampInicio,                // devuelve el timestamp de la última lectura (para animaciones/tiempos)
   obtenerContadorLecturas,               // cuántas lecturas se hicieron desde que arrancó la medición
   alternarMedicion,                      // prende/apaga la medición de un alimentador/equipo (toggle)
   detenerMedicion,                       // detiene explícitamente la medición de un alimentador/equipo
   cargando,                              // estado de carga (Supabase)
   error,                                 // error si hubo problema cargando datos
   // Preferencias UI (gaps) - vienen del contexto para consistencia
   obtenerGap,                            // obtiene gap horizontal de un alimentador (localStorage > BD > default)
   establecerGap,                         // establece gap horizontal de un alimentador
   obtenerRowGap,                         // obtiene gap vertical de una fila (localStorage > BD > default)
   establecerRowGap,                      // establece gap vertical de una fila
   GAP_DEFAULT,                           // valor por defecto para gaps horizontales
   // Limpieza al salir
   limpiarPreferenciasUI,                 // limpia localStorage de gaps al salir
   // Estado de sincronización
   sincronizando,                         // true mientras se guardan cambios en BD
} = usarContextoAlimentadores();          // hook que conecta esta vista con el contexto global de alimentadores


const {
   elementoArrastrandoId,                 // id del alimentador que se está arrastrando actualmente (o null)
   alIniciarArrastre,                     // handler para onDragStart: marca qué tarjeta empezó a moverse
   alTerminarArrastre,                    // handler para onDragEnd: limpia el estado de arrastre
   alPasarPorEncima,                      // handler para onDragOver: habilita que se pueda soltar en ese destino
   reordenarLista,                        // calcula una nueva lista con un elemento movido a la posición de otro
   moverAlFinal,                          // calcula una nueva lista moviendo un elemento al final
} = usarArrastrarSoltar();                // hook que encapsula el estado y la lógica de drag & drop de tarjetas


	const { abrirModal, cerrarModal, obtenerEstado } = useGestorModales(); // gestor centralizado de modales

	const [menuAbierto, setMenuAbierto] = useState(false);           // estado del drawer lateral en mobile
	const [esCompacto, setEsCompacto] = useState(false);             // flag: layout compacto (pantalla angosta)
	const [guardandoAlimentador, setGuardandoAlimentador] = useState(false); // flag: guardando alimentador (muestra skeleton)
	const [guardandoPuestos, setGuardandoPuestos] = useState(false); // flag: guardando/eliminando puestos

	// Responsive: detectar modo compacto según el ancho de la ventana
	useEffect(() => {
		const actualizarModo = () => setEsCompacto(window.innerWidth < 900);
		actualizarModo();                                            // evalúa una vez al montar
		window.addEventListener("resize", actualizarModo);
		return () => window.removeEventListener("resize", actualizarModo);
	}, []);

	const estadoModalNuevoPuesto = obtenerEstado("nuevoPuesto");     // { abierto, datos } para modal de nuevo puesto
	const estadoModalEditarPuestos = obtenerEstado("editarPuestos"); // idem para modal de edición de puestos
	const estadoModalAlimentador = obtenerEstado("alimentador");     // idem para modal de configuración de alimentador
	const estadoModalMapeo = obtenerEstado("mapeo");                 // idem para modal de mapeo de mediciones
	const estadoModalConfigPuesto = obtenerEstado("configPuesto");   // idem para modal de configuración global del puesto

	const buscarAlimentador = (alimId) =>
		puestoSeleccionado?.alimentadores.find((a) => a.id === alimId) || null; // helper para obtener el alimentador por id

	const alimentadorEnEdicion = estadoModalAlimentador.datos?.alimentadorId
		? buscarAlimentador(estadoModalAlimentador.datos.alimentadorId)
		: null;

	const modoAlimentador = estadoModalAlimentador.datos?.modo || "crear"; // "crear" o "editar" según cómo se abrió el modal

	const alimentadorParaMapeo = estadoModalMapeo.datos?.alimentadorId
		? buscarAlimentador(estadoModalMapeo.datos.alimentadorId)
		: null;

	// Navegacion
	const handleSalir = () => {
		// Limpiar localStorage de gaps antes de salir
		// Así al volver a entrar se cargan los datos frescos de BD
		limpiarPreferenciasUI();
		navigate("/");                                                 // vuelve al login
	};

	// ===== MODALES PUESTOS =====
	const abrirModalNuevoPuesto = () => abrirModal("nuevoPuesto");    // abre modal para crear puesto
	const abrirModalEditarPuestos = () => abrirModal("editarPuestos");// abre modal para editar lista de puestos
	const abrirModalConfigPuesto = () => abrirModal("configPuesto");  // abre modal de configuración global del puesto

	const handleCrearPuesto = (nombre, color) => {
		agregarPuesto(nombre, color);                                 // crea el puesto vía contexto
		cerrarModal("nuevoPuesto");
	};

	const handleGuardarPuestos = async (puestosEditados) => {
		// Cerrar modal inmediatamente y mostrar overlay a nivel de página
		cerrarModal("editarPuestos");
		setGuardandoPuestos(true);

		try {
			// Detectar puestos eliminados (están en puestos original pero no en puestosEditados)
			const idsEditados = new Set(puestosEditados.map(p => p.id));
			const puestosEliminados = puestos.filter(p => !idsEditados.has(p.id));

			// Primero eliminar los puestos que fueron removidos de la lista
			for (const puesto of puestosEliminados) {
				await eliminarPuesto(puesto.id);
			}

			// Luego actualizar los puestos restantes (nombres/colores)
			if (puestosEditados.length > 0) {
				await actualizarPuestos(puestosEditados);
			}
		} catch (error) {
			console.error('Error guardando puestos:', error);
		} finally {
			setGuardandoPuestos(false);
		}
	};

	const handleGuardarConfigPuesto = (alimentadoresActualizados) => {
		if (!puestoSeleccionado) return;
		// Actualizar el puesto con los alimentadores modificados
		const puestoActualizado = {
			...puestoSeleccionado,
			alimentadores: alimentadoresActualizados,
		};
		// Actualizar la lista de puestos
		const nuevaListaPuestos = puestos.map((p) =>
			p.id === puestoSeleccionado.id ? puestoActualizado : p
		);
		actualizarPuestos(nuevaListaPuestos);
		// No cerrar el modal - los cambios se guardan automáticamente
	};

	// ===== MODALES ALIMENTADORES =====
	const abrirModalNuevoAlim = () => abrirModal("alimentador", { modo: "crear" });

	const abrirModalEditarAlim = (_puestoId, alimentador) =>
		abrirModal("alimentador", { modo: "editar", alimentadorId: alimentador.id });

	const abrirModalMapeo = (_puestoId, alimentador) =>
		abrirModal("mapeo", { alimentadorId: alimentador.id });

	const handleGuardarAlimentador = async (datos) => {
		if (!datos || !datos.nombre || !puestoSeleccionado) return;

		// Solo mostrar skeleton si estamos creando (no al editar)
		if (modoAlimentador === "crear") {
			setGuardandoAlimentador(true);                        // activar skeleton
			cerrarModal("alimentador");                           // cerrar modal INMEDIATAMENTE para ver el skeleton
		}

		try {
			if (modoAlimentador === "crear") {
				await agregarAlimentador(datos);                      // alta de nuevo alimentador
			} else if (alimentadorEnEdicion) {
				await actualizarAlimentador(
					puestoSeleccionado.id,
					alimentadorEnEdicion.id,
					datos
				);                                                    // edición de alimentador existente
				cerrarModal("alimentador");                           // en edición, cerrar después de guardar
			}
		} catch (error) {
			console.error("Error guardando alimentador:", error);
			setGuardandoAlimentador(false);                       // desactivar skeleton si hay error
			// Aquí podrías mostrar un toast de error
		} finally {
			// Desactivar skeleton después de un pequeño delay para que se vea la transición
			if (modoAlimentador === "crear") {
				setTimeout(() => {
					setGuardandoAlimentador(false);
				}, 300);
			}
		}
	};

	const handleEliminarAlimentador = () => {
		if (!puestoSeleccionado || !alimentadorEnEdicion) return;

		// por seguridad, detiene mediciones antes de eliminar
		detenerMedicion(alimentadorEnEdicion.id, "rele");
		detenerMedicion(alimentadorEnEdicion.id, "analizador");

		eliminarAlimentador(puestoSeleccionado.id, alimentadorEnEdicion.id);
		cerrarModal("alimentador");
	};

	const handleGuardarMapeo = (nuevoMapeo) => {
		if (!puestoSeleccionado || !alimentadorParaMapeo) return;

		actualizarAlimentador(puestoSeleccionado.id, alimentadorParaMapeo.id, {
			mapeoMediciones: nuevoMapeo,                              // guarda el diseño/mapeo para ese alimentador
		});
		cerrarModal("mapeo");
	};

	// ===== MEDICIONES =====
	const handleAlternarMedicionRele = (alimId, overrideConfig) => {
		const alim = buscarAlimentador(alimId);
		if (!alim) return;
		alternarMedicion(alim, "rele", overrideConfig);               // start/stop medición de relé
	};

	const handleAlternarMedicionAnalizador = (alimId, overrideConfig) => {
		const alim = buscarAlimentador(alimId);
		if (!alim) return;
		alternarMedicion(alim, "analizador", overrideConfig);         // start/stop medición de analizador
	};

	// ===== DRAG & DROP =====
	const handleDragStartAlim = (alimId) => {
		alIniciarArrastre(alimId);                                    // guarda qué tarjeta se está arrastrando
	};

	const handleDragEndAlim = () => {
		alTerminarArrastre();                                         // limpia estado de drag
	};

	const handleDropAlim = (targetAlimId) => {
		if (!puestoSeleccionado || !elementoArrastrandoId) return;

		const nuevaLista = reordenarLista(
			puestoSeleccionado.alimentadores,
			elementoArrastrandoId,
			targetAlimId
		);                                                             // calcula nuevo orden interno

		// Resetear el gap de la tarjeta movida al valor por defecto
		establecerGap(elementoArrastrandoId, GAP_DEFAULT);

		reordenarAlimentadores(puestoSeleccionado.id, nuevaLista);     // guarda el nuevo orden en el contexto
		alTerminarArrastre();
	};

	const handleDropAlimAlFinal = () => {
		if (!puestoSeleccionado || !elementoArrastrandoId) return;

		const nuevaLista = moverAlFinal(
			puestoSeleccionado.alimentadores,
			elementoArrastrandoId
		);                                                             // mueve la tarjeta arrastrada al final

		// Resetear el gap de la tarjeta movida al valor por defecto
		establecerGap(elementoArrastrandoId, GAP_DEFAULT);

		reordenarAlimentadores(puestoSeleccionado.id, nuevaLista);
		alTerminarArrastre();
	};

	// Estado de carga (solo mostrar si NO estamos sincronizando)
	// Durante la sincronización, el overlay de "Guardando cambios..." se encarga del feedback
	if (cargando && !sincronizando) {
		return (
			<div className="alim-page alim-page--cargando">
				<div className="alim-loading">
					<div className="alim-loading__spinner"></div>
					<p>Cargando configuración...</p>
				</div>
			</div>
		);
	}

	// Estado de error
	if (error) {
		return (
			<div className="alim-page alim-page--error">
				<div className="alim-error">
					<p>Error: {error}</p>
					<button onClick={() => window.location.reload()}>Reintentar</button>
				</div>
			</div>
		);
	}

	return (
		<div className="alim-page">
			{/* Overlay de guardando puestos (portal a body) */}
			{guardandoPuestos && ReactDOM.createPortal(
				<div className="guardar-overlay">
					<div className="guardar-overlay__contenido">
						<div className="guardar-overlay__spinner" />
						<span className="guardar-overlay__texto">Guardando cambios...</span>
					</div>
				</div>,
				document.body
			)}

			{/* ===== NAV SUPERIOR ===== */}
			<BarraNavegacion
				esCompacto={esCompacto}
				puestos={puestos}
				puestoSeleccionado={puestoSeleccionado}
				onSeleccionarPuesto={seleccionarPuesto}
				onAbrirModalNuevoPuesto={abrirModalNuevoPuesto}
				onAbrirModalEditarPuestos={abrirModalEditarPuestos}
				onAbrirModalConfigPuesto={abrirModalConfigPuesto}
				onSalir={handleSalir}
				onAbrirMenu={() => setMenuAbierto(true)}
				coloresSistema={COLORES_SISTEMA}
			/>

			{/* ===== MENU LATERAL (modo compacto) ===== */}
			{esCompacto && (
				<MenuLateral
					abierto={menuAbierto}
					onCerrar={() => setMenuAbierto(false)}
					puestos={puestos}
					puestoSeleccionado={puestoSeleccionado}
					onSeleccionarPuesto={seleccionarPuesto}
					onAbrirModalNuevoPuesto={abrirModalNuevoPuesto}
					onAbrirModalEditarPuestos={abrirModalEditarPuestos}
					onSalir={handleSalir}
					coloresSistema={COLORES_SISTEMA}
				/>
			)}

			{/* ===== MAIN ===== */}
			<main
				className="alim-main"
				style={{ backgroundColor: puestoSeleccionado?.bgColor || "#e5e7eb" }} // usa bgColor del puesto o gris por defecto
			>
				{!puestoSeleccionado ? (
					<div className="alim-empty-state">
						<p>
							No hay puestos creados. Haz clic en el boton "+" para agregar
							uno.
						</p>
					</div>
				) : (
					<>
						<GrillaTarjetas
							alimentadores={puestoSeleccionado.alimentadores}
							lecturas={lecturasTarjetas}
							puestoId={puestoSeleccionado.id}
							elementoArrastrandoId={elementoArrastrandoId}
							onAbrirConfiguracion={abrirModalEditarAlim}
							onAbrirMapeo={abrirModalMapeo}
							onDragStart={handleDragStartAlim}
							onDragOver={alPasarPorEncima}
							onDrop={handleDropAlim}
							onDragEnd={handleDragEndAlim}
							skeletonCard={guardandoAlimentador ? <SkeletonCard /> : null}
							onDropAlFinal={handleDropAlimAlFinal}
							onAgregarNuevo={abrirModalNuevoAlim}
							estaMidiendo={estaMidiendo}
							obtenerTimestampInicio={obtenerTimestampInicio}
							obtenerContadorLecturas={obtenerContadorLecturas}
							obtenerGap={obtenerGap}
							onGapChange={establecerGap}
							obtenerRowGap={obtenerRowGap}
							onRowGapChange={establecerRowGap}
						/>
					</>
				)}
			</main>

			{/* ===== MODALES ===== */}
			<ModalNuevoPuesto
				abierto={estadoModalNuevoPuesto.abierto}
				onCerrar={() => cerrarModal("nuevoPuesto")}
				onCrear={handleCrearPuesto}
				coloresSistema={COLORES_SISTEMA}
			/>

			<ModalEditarPuestos
				abierto={estadoModalEditarPuestos.abierto}
				puestos={puestos}
				onCerrar={() => cerrarModal("editarPuestos")}
				onGuardar={handleGuardarPuestos}
			/>

			<ModalConfiguracionAlimentador
				abierto={estadoModalAlimentador.abierto}
				puestoNombre={puestoSeleccionado?.nombre || ""}
				modo={modoAlimentador}
				initialData={alimentadorEnEdicion}
				onCancelar={() => cerrarModal("alimentador")}
				onConfirmar={handleGuardarAlimentador}
				onEliminar={handleEliminarAlimentador}
				isMeasuringRele={
					alimentadorEnEdicion
						? estaMidiendo(alimentadorEnEdicion.id, "rele")
						: false
				}
				isMeasuringAnalizador={
					alimentadorEnEdicion
						? estaMidiendo(alimentadorEnEdicion.id, "analizador")
						: false
				}
				onToggleMedicionRele={(override) =>
					alimentadorEnEdicion &&
					handleAlternarMedicionRele(alimentadorEnEdicion.id, override)
				}
				onToggleMedicionAnalizador={(override) =>
					alimentadorEnEdicion &&
					handleAlternarMedicionAnalizador(alimentadorEnEdicion.id, override)
				}
				registrosRele={
					alimentadorEnEdicion
						? obtenerRegistros(alimentadorEnEdicion.id, "rele")
						: []
				}
				registrosAnalizador={
					alimentadorEnEdicion
						? obtenerRegistros(alimentadorEnEdicion.id, "analizador")
						: []
				}
			/>

			<ModalMapeoMediciones
				abierto={estadoModalMapeo.abierto}
				alimentador={alimentadorParaMapeo}
				onCerrar={() => cerrarModal("mapeo")}
				onGuardar={handleGuardarMapeo}
			/>

			<ModalConfiguracionPuesto
				abierto={estadoModalConfigPuesto.abierto}
				puesto={puestoSeleccionado}
				onCerrar={() => cerrarModal("configPuesto")}
				onGuardar={handleGuardarConfigPuesto}
			/>
		</div>
	);
};

export default VistaAlimentadores;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (VistaAlimentadores.jsx)

 - Es el "tablero de control" visual de los alimentadores: aquí se ensamblan
   la barra de navegación, el menú lateral, la grilla de tarjetas y todos los
   modales de creación/edición/mapeo.

 - Lee todos los datos y acciones desde `usarContextoAlimentadores()` y los
   reparte a los distintos componentes (nav, tarjetas, modales) sin guardar
   lógica de negocio acá adentro.

 - `useGestorModales` centraliza qué modal está abierto y con qué datos, lo que
   permite abrir/cerrar cada uno con una simple clave (`"nuevoPuesto"`,
   `"editarPuestos"`, `"alimentador"`, `"mapeo"`).

 - `usarArrastrarSoltar` se encarga del drag & drop de tarjetas; esta vista solo
   coordina cuándo llamar a `reordenarAlimentadores` con la nueva lista.

 - A nivel mental:
   * ContextoAlimentadores = sala de máquinas (datos + lógica).
   * VistaAlimentadores = tablero de control que el usuario ve y manipula.
---------------------------------------------------------------------------*/}

{/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (VistaAlimentadores.jsx)

0) Visión general del archivo

   `VistaAlimentadores` es el “tablero de control” que ve el usuario:

   - Muestra:
       • barra superior con puestos y botón de salir,
       • menú lateral en pantallas chicas,
       • grilla de tarjetas de alimentadores,
       • modales para crear/editar puestos,
       • modales para configurar alimentadores y mapear mediciones.

   - No calcula negocios pesados por su cuenta:
       • lee datos y funciones del contexto (`usarContextoAlimentadores`),
       • usa hooks auxiliares (`useGestorModales`, `usarArrastrarSoltar`),
       • y simplemente coordina quién ve qué, y cuándo.


1) Imports principales

   import React, { useEffect, useState } from "react";
   import { useNavigate } from "react-router-dom";
   import "./VistaAlimentadores.css";

   - React + hooks para estado y efectos (`useState`, `useEffect`).
   - `useNavigate` sirve para volver al login cuando el usuario quiere salir.
   - El CSS define el layout (grid, espaciados, colores de fondo, etc.).

   Luego se importan componentes de UI:

   - `BarraNavegacion`, `MenuLateral`, `GrillaTarjetas`,
   - `ModalNuevoPuesto`, `ModalEditarPuestos`,
   - `ModalConfiguracionAlimentador`, `ModalMapeoMediciones`.

   Y hooks/constantes de apoyo:

   - `COLORES_SISTEMA`              → define la paleta que se usa para los puestos.
   - `usarArrastrarSoltar`          → lógica de drag & drop.
   - `usarContextoAlimentadores`    → acceso a datos y acciones del contexto.
   - `useGestorModales`             → quién está abierto, con qué datos, etc.


2) Inicio del componente y lectura de contexto

   const VistaAlimentadores = () => {
     const navigate = useNavigate();

     const {
       puestos,
       puestoSeleccionado,
       agregarPuesto,
       seleccionarPuesto,
       actualizarPuestos,
       agregarAlimentador,
       actualizarAlimentador,
       eliminarAlimentador,
       reordenarAlimentadores,
       lecturasTarjetas,
       estaMidiendo,
       obtenerRegistros,
       obtenerTimestampInicio,
       obtenerContadorLecturas,
       alternarMedicion,
       detenerMedicion,
     } = usarContextoAlimentadores();

   - `useNavigate()`:
       • da la función `navigate`, usada para volver al login (`navigate("/")`).

   - `usarContextoAlimentadores()`:
       • trae todo lo que el contexto ofrece:
           - datos: lista de `puestos`, `puestoSeleccionado`, `lecturasTarjetas`,
           - acciones sobre puestos y alimentadores,
           - acciones y helpers de mediciones (`estaMidiendo`, `obtenerRegistros`, etc.).

   En resumen: acá “enchufás” la vista al motor de datos.


3) Hook de drag & drop

   const {
     elementoArrastrandoId,
     alIniciarArrastre,
     alTerminarArrastre,
     alPasarPorEncima,
     reordenarLista,
     moverAlFinal,
   } = usarArrastrarSoltar();

   - `usarArrastrarSoltar` encapsula:
       • qué tarjeta se está arrastrando,
       • cómo reordenar una lista,
       • cómo mover un ítem al final.

   - Esta vista no se preocupa por los detalles internos de drag & drop:
       • solo llama a estas funciones en los momentos correctos (onDragStart, onDragOver, onDrop, etc.).


4) Gestor de modales

   const { abrirModal, cerrarModal, obtenerEstado } = useGestorModales();

   - `useGestorModales` es un “mini gestor de ventanas”:
       • cada modal se identifica con una clave string:
           - "nuevoPuesto",
           - "editarPuestos",
           - "alimentador",
           - "mapeo".
       • cada clave tiene un estado `{ abierto, datos }`.

   - `abrirModal(id, datos?)`     → abre el modal y puede asociarle datos.
   - `cerrarModal(id)`            → lo cierra.
   - `obtenerEstado(id)`          → devuelve siempre `{ abierto, datos }` (aunque nunca se haya usado).


5) Estados locales de layout (menu y modo compacto)

   const [menuAbierto, setMenuAbierto] = useState(false);
   const [esCompacto, setEsCompacto] = useState(false);

   - `menuAbierto`:
       • controla si el menú lateral (drawer) está desplegado en modo mobile.

   - `esCompacto`:
       • indica si la pantalla se considera “angosta” (por ejemplo mobile o tablet)
         y activa la versión con menú lateral.


6) useEffect para detectar modo compacto (responsive)

   useEffect(() => {
     const actualizarModo = () => setEsCompacto(window.innerWidth < 900);
     actualizarModo();
     window.addEventListener("resize", actualizarModo);
     return () => window.removeEventListener("resize", actualizarModo);
   }, []);

   - Al montar la vista:
       • ejecuta `actualizarModo()` una vez para decidir si es compacto o no,
       • agrega un listener a `resize` para que, si cambia el tamaño de ventana,
         se actualice `esCompacto`.

   - Al desmontar:
       • remueve el listener para evitar fugas de memoria o comportamientos raros.

   - Regla:
       • si el ancho de ventana es menor a 900 px → `esCompacto = true`,
       • si no → `esCompacto = false`.


7) Estado de modales (leído desde useGestorModales)

   const estadoModalNuevoPuesto = obtenerEstado("nuevoPuesto");
   const estadoModalEditarPuestos = obtenerEstado("editarPuestos");
   const estadoModalAlimentador = obtenerEstado("alimentador");
   const estadoModalMapeo = obtenerEstado("mapeo");

   - Cada uno devuelve un objeto de la forma:
       { abierto: boolean, datos: any }

   - Así se sabe:
       • si el modal está visible (`abierto`),
       • y qué datos se pasaron al abrirlo (`datos`).


8) Helpers para obtener un alimentador y derivar datos para modales

   const buscarAlimentador = (alimId) =>
     puestoSeleccionado?.alimentadores.find((a) => a.id === alimId) || null;

   const alimentadorEnEdicion = estadoModalAlimentador.datos?.alimentadorId
     ? buscarAlimentador(estadoModalAlimentador.datos.alimentadorId)
     : null;

   const modoAlimentador = estadoModalAlimentador.datos?.modo || "crear";

   const alimentadorParaMapeo = estadoModalMapeo.datos?.alimentadorId
     ? buscarAlimentador(estadoModalMapeo.datos.alimentadorId)
     : null;

   - `buscarAlimentador(alimId)`:
       • busca dentro de `puestoSeleccionado.alimentadores` el que tiene ese id,
       • si no existe o no hay puesto seleccionado, devuelve null.

   - `alimentadorEnEdicion`:
       • si el modal `"alimentador"` fue abierto con `{ alimentadorId }`,
         se busca ese alimentador y se usa como base para el formulario.

   - `modoAlimentador`:
       • puede ser "crear" o "editar",
       • según cómo se haya abierto el modal.

   - `alimentadorParaMapeo`:
       • similar a `alimentadorEnEdicion`, pero exclusivo para el modal de `"mapeo"`.


9) Navegación: salir al login

   const handleSalir = () => navigate("/");

   - Se pasa a la barra superior y al menú lateral.
   - Cuando se invoca, redirige a la ruta raíz (login).


10) Lógica de modales de puestos

   const abrirModalNuevoPuesto = () => abrirModal("nuevoPuesto");
   const abrirModalEditarPuestos = () => abrirModal("editarPuestos");

   const handleCrearPuesto = (nombre, color) => {
     agregarPuesto(nombre, color);
     cerrarModal("nuevoPuesto");
   };

   const handleGuardarPuestos = (puestosEditados) => {
     actualizarPuestos(puestosEditados);
     cerrarModal("editarPuestos");
   };

   - `abrirModalNuevoPuesto`:
       • abre el modal de alta de puesto.

   - `abrirModalEditarPuestos`:
       • abre el modal de edición masiva (nombres, colores, etc.).

   - `handleCrearPuesto`:
       • llama a `agregarPuesto` del contexto,
       • cierra el modal.

   - `handleGuardarPuestos`:
       • recibe la lista editada desde el modal,
       • llama a `actualizarPuestos` para guardarla,
       • cierra el modal.


11) Lógica de modales de alimentadores

   const abrirModalNuevoAlim = () => abrirModal("alimentador", { modo: "crear" });

   const abrirModalEditarAlim = (_puestoId, alimentador) =>
     abrirModal("alimentador", { modo: "editar", alimentadorId: alimentador.id });

   const abrirModalMapeo = (_puestoId, alimentador) =>
     abrirModal("mapeo", { alimentadorId: alimentador.id });

   const handleGuardarAlimentador = (datos) => {
     if (!datos || !datos.nombre || !puestoSeleccionado) return;

     if (modoAlimentador === "crear") {
       agregarAlimentador(datos);
     } else if (alimentadorEnEdicion) {
       actualizarAlimentador(
         puestoSeleccionado.id,
         alimentadorEnEdicion.id,
         datos
       );
     }

     cerrarModal("alimentador");
   };

   const handleEliminarAlimentador = () => {
     if (!puestoSeleccionado || !alimentadorEnEdicion) return;

     detenerMedicion(alimentadorEnEdicion.id, "rele");
     detenerMedicion(alimentadorEnEdicion.id, "analizador");

     eliminarAlimentador(puestoSeleccionado.id, alimentadorEnEdicion.id);
     cerrarModal("alimentador");
   };

   const handleGuardarMapeo = (nuevoMapeo) => {
     if (!puestoSeleccionado || !alimentadorParaMapeo) return;

     actualizarAlimentador(puestoSeleccionado.id, alimentadorParaMapeo.id, {
       mapeoMediciones: nuevoMapeo,
     });
     cerrarModal("mapeo");
   };

   - Aperturas:
       • nuevo alimentador → modo "crear",
       • editar alimentador → modo "editar" + id del alimentador,
       • mapeo → solo id del alimentador.

   - Guardar alimentador:
       • si el modo es "crear"       → alta nueva,
       • si el modo es "editar"      → actualiza el alimentador existente.

   - Eliminar alimentador:
       • por seguridad, corta medición de rele y analizador,
       • luego lo elimina del puesto.

   - Guardar mapeo:
       • actualiza solo `mapeoMediciones` del alimentador,
       • el resto de datos queda intacto.


12) Lógica de mediciones (rele y analizador)

   const handleAlternarMedicionRele = (alimId, overrideConfig) => {
     const alim = buscarAlimentador(alimId);
     if (!alim) return;
     alternarMedicion(alim, "rele", overrideConfig);
   };

   const handleAlternarMedicionAnalizador = (alimId, overrideConfig) => {
     const alim = buscarAlimentador(alimId);
     if (!alim) return;
     alternarMedicion(alim, "analizador", overrideConfig);
   };

   - Estas funciones:
       • buscan el alimentador por id,
       • llaman al helper `alternarMedicion` del contexto,
       • pasan el `overrideConfig` si viene desde el modal (periodo, ip, etc.).

   - La vista no decide si iniciar o detener:
       • solo dice “alterná”, el hook resuelve.


13) Lógica de drag & drop

   const handleDragStartAlim = (alimId) => {
     alIniciarArrastre(alimId);
   };

   const handleDragEndAlim = () => {
     alTerminarArrastre();
   };

   const handleDropAlim = (targetAlimId) => {
     if (!puestoSeleccionado || !elementoArrastrandoId) return;

     const nuevaLista = reordenarLista(
       puestoSeleccionado.alimentadores,
       elementoArrastrandoId,
       targetAlimId
     );

     reordenarAlimentadores(puestoSeleccionado.id, nuevaLista);
     alTerminarArrastre();
   };

   const handleDropAlimAlFinal = () => {
     if (!puestoSeleccionado || !elementoArrastrandoId) return;

     const nuevaLista = moverAlFinal(
       puestoSeleccionado.alimentadores,
       elementoArrastrandoId
     );

     reordenarAlimentadores(puestoSeleccionado.id, nuevaLista);
     alTerminarArrastre();
   };

   - `handleDragStartAlim`:
       • se engancha a `onDragStart` de cada tarjeta,
       • marca qué alimentador se está arrastrando.

   - `handleDragEndAlim`:
       • limpia el estado de drag cuando termina el arrastre.

   - `handleDropAlim(targetAlimId)`:
       • se llama al soltar sobre otra tarjeta,
       • calcula el nuevo orden de la lista usando `reordenarLista`,
       • guarda ese orden con `reordenarAlimentadores` (contexto),
       • resetea el estado de drag.

   - `handleDropAlimAlFinal`:
       • se activa en la zona de “soltar para mandar al final”,
       • calcula la lista con `moverAlFinal`,
       • guarda el nuevo orden,
       • limpia estado de drag.


14) Render principal (JSX)

   return (
     <div className="alim-page">

       // NAV SUPERIOR 
       <BarraNavegacion ... />

       // MENU LATERAL (solo si esCompacto) 
       {esCompacto && <MenuLateral ... />}

       // MAIN 
       <main className="alim-main" style={{ backgroundColor: ... }}>
         { !puestoSeleccionado ? (
           // estado vacío sin puestos
         ) : (
           <>
             { puestoSeleccionado.alimentadores.length === 0 && (
               // mensaje “no hay alimentadores”
             )}

             <GrillaTarjetas
               // lista de alimentadores
               // lecturas procesadas
               // handlers de drag, de configuración, de mapeo, etc.
             />
           </>
         )}
       </main>

       // MODALES 
       <ModalNuevoPuesto ... />
       <ModalEditarPuestos ... />
       <ModalConfiguracionAlimentador ... />
       <ModalMapeoMediciones ... />
     </div>
   );

   - La estructura visual queda así:
       • `BarraNavegacion` arriba,
       • `MenuLateral` solo en modo compacto,
       • `main` con fondo según `bgColor` del puesto,
       • `GrillaTarjetas` para las cards,
       • todos los modales montados al final (solo se ven cuando `abierto = true`).

   - `GrillaTarjetas` recibe:
       • alimentadores,
       • lecturas ya procesadas (`lecturasTarjetas`),
       • callbacks para abrir modales,
       • callbacks para drag & drop,
       • helpers de estado de medición y contadores.


15) Export

   export default VistaAlimentadores;

   - Exporta el componente para usarlo en la ruta `/alimentadores` de la app.
   - Es la vista principal del panel de alimentadores.

---------------------------------------------------------------------------------------*/}
