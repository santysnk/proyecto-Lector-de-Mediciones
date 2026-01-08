// src/paginas/PaginaAlimentadores/componentes/layout/VistaAlimentadores.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";                                    // para portal del overlay
import { useNavigate } from "react-router-dom";                     // navegación entre rutas
import { useAuth } from "../../../../contextos/AuthContext";        // contexto de autenticación
import "./VistaAlimentadores.css";                                  // estilos específicos del layout de alimentadores
import "../navegacion/BotonGuardarCambios.css";                     // estilos del overlay de guardando

import BarraNavegacion from "../navegacion/BarraNavegacion.jsx";    // barra superior (título + botones de puestos)
import MenuLateral from "../navegacion/MenuLateral.jsx";            // menú lateral en modo compacto (mobile)
import GrillaTarjetas from "../tarjetas/GrillaTarjetas.jsx";        // grilla de tarjetas de alimentadores
import SkeletonCard from "../tarjetas/SkeletonCard.jsx";            // skeleton de tarjeta (loading state)
import { ModalNuevoPuesto, ModalEditarPuestos, ModalConfiguracionPuesto } from "../modales/puesto";
import ModalConfiguracionAlimentador from "../modales/ModalConfiguracionAlimentador.jsx";
import ModalConfigurarAgente from "../modales/ModalConfigurarAgente.jsx";
import { ModalGestionarAccesos, ModalPanelPermisos } from "../modales/permisos";
import { ContenedorVentanasHistorial } from "../modales/historial";
import { useVentanasHistorial, useGestorModales } from "../../hooks/ui";
import { useVentanaConfigAgente } from "../../hooks/agentes";

import { COLORES_SISTEMA } from "../../constantes/colores";
import { useArrastrarSoltar } from "../../hooks/puestos";
import { usarContextoAlimentadores } from "../../contexto/ContextoAlimentadoresSupabase";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import { listarAgentesWorkspace, listarRegistradoresAgente } from "../../../../servicios/apiService";
import { useHistorialLocal } from "../../hooks/historial";
import { usePushNotifications } from "../../../../hooks/usePushNotifications";
import { usePollingLecturas } from "../../hooks/mediciones";

const VistaAlimentadores = () => {
	const navigate = useNavigate();                                  // para salir al login
	const { logout } = useAuth();                                    // función de logout del contexto de auth
	const {
		configuracionSeleccionada,
		perfil,
		rolGlobal,
		// Estilos globales de tarjetas
		estilosGlobales,
		guardarEstilosGlobales,
	} = usarContextoConfiguracion(); // workspace activo + perfil usuario + rol + estilos globales

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
   obtenerTimestampInicio,                // devuelve el timestamp de la última lectura (para animaciones/tiempos)
   obtenerContadorLecturas,               // cuántas lecturas se hicieron desde que arrancó la medición
   detenerMedicion,                       // detiene explícitamente la medición de un alimentador/equipo
   actualizarRegistros,                   // actualiza registros manualmente (para polling de lecturas)
   cargando,                              // estado de carga (Supabase)
   error,                                 // error si hubo problema cargando datos
   // Preferencias UI (gaps) - vienen del contexto para consistencia
   obtenerGap,                            // obtiene gap horizontal de un alimentador (localStorage > BD > default)
   establecerGap,                         // establece gap horizontal de un alimentador
   obtenerRowGap,                         // obtiene gap vertical de una fila (localStorage > BD > default)
   establecerRowGap,                      // establece gap vertical de una fila
   GAP_DEFAULT,                           // valor por defecto para gaps horizontales
   // Escala de tarjetas
   escalaGlobal,                          // escala global para todas las tarjetas
   establecerEscalaGlobal,                // establece escala global
   obtenerEscalaEfectiva,                 // obtiene escala efectiva (individual > puesto > global > default)
   establecerEscalaTarjeta,               // establece escala individual de un alimentador
   resetearEscalaTarjeta,                 // resetea escala individual de un alimentador
   obtenerEscalaPuesto,                   // obtiene escala de un puesto específico
   establecerEscalaPuesto,                // establece escala de un puesto
   ESCALA_MIN,                            // escala mínima permitida
   ESCALA_MAX,                            // escala máxima permitida
   // Limpieza al salir
   limpiarPreferenciasUI,                 // limpia localStorage de gaps al salir
   // Estado de sincronización
   sincronizando,                         // true mientras se guardan cambios en BD
   // Getters de colores (para soporte de preferencias de invitados)
   obtenerBgColorPuesto,                  // obtiene bgColor del puesto (con preferencias de invitado)
   obtenerColorPuesto,                    // obtiene color del puesto (con preferencias de invitado)
   // Info del rol del usuario en el workspace
   esCreador,                             // true si el usuario es creador del workspace
   // Preferencias visuales (para invitados)
   preferenciasVisuales,                  // objeto con funciones para obtener preferencias personales
} = usarContextoAlimentadores();          // hook que conecta esta vista con el contexto global de alimentadores


const {
   elementoArrastrandoId,                 // id del alimentador que se está arrastrando actualmente (o null)
   alIniciarArrastre,                     // handler para onDragStart: marca qué tarjeta empezó a moverse
   alTerminarArrastre,                    // handler para onDragEnd: limpia el estado de arrastre
   alPasarPorEncima,                      // handler para onDragOver: habilita que se pueda soltar en ese destino
   reordenarLista,                        // calcula una nueva lista con un elemento movido a la posición de otro
   moverAlFinal,                          // calcula una nueva lista moviendo un elemento al final
} = useArrastrarSoltar();                // hook que encapsula el estado y la lógica de drag & drop de tarjetas


	const { abrirModal, cerrarModal, obtenerEstado } = useGestorModales(); // gestor centralizado de modales
	const { guardarLecturaLocal } = useHistorialLocal(); // Hook para guardar lecturas en IndexedDB

	// Inicializar push notifications para app Android (solo se activa en plataforma nativa)
	usePushNotifications({
		habilitado: true,
		onNotificacion: (notif) => {
			console.log('[VistaAlimentadores] Notificación en primer plano:', notif);
			// TODO: Mostrar toast o notificación in-app
		},
		onNotificacionTocada: (datos) => {
			console.log('[VistaAlimentadores] Usuario tocó notificación:', datos);
			// TODO: Navegar a alimentador específico si viene en datos
		},
	});

	// Sistema de ventanas flotantes de historial
	const {
		listaVentanas,
		ventanasMinimizadas,
		abrirVentana,
		cerrarVentana,
		toggleMinimizar,
		toggleMaximizar,
		enfocarVentana,
		moverVentana,
	} = useVentanasHistorial();

	const [menuAbierto, setMenuAbierto] = useState(false);           // estado del drawer lateral en mobile
	const [esCompacto, setEsCompacto] = useState(false);             // flag: layout compacto (pantalla angosta)
	const [guardandoAlimentador, setGuardandoAlimentador] = useState(false); // flag: guardando alimentador (muestra skeleton)
	const [guardandoPuestos, setGuardandoPuestos] = useState(false); // flag: guardando/eliminando puestos
	// Hook para ventana flotante de configuración de agentes
	const {
		ventana: ventanaConfigAgente,
		abrirVentana: abrirVentanaConfigAgente,
		cerrarVentana: cerrarVentanaConfigAgente,
		toggleMinimizar: toggleMinimizarConfigAgente,
		toggleMaximizar: toggleMaximizarConfigAgente,
		enfocarVentana: enfocarVentanaConfigAgente,
		moverVentana: moverVentanaConfigAgente,
	} = useVentanaConfigAgente();
	const [modalAccesosAbierto, setModalAccesosAbierto] = useState(false); // estado del modal de gestión de accesos
	const [modalPanelPermisosAbierto, setModalPanelPermisosAbierto] = useState(false); // estado del modal de panel de permisos
	const [registradores, setRegistradores] = useState([]); // Lista de registradores del workspace

	// ===== PUESTOS CON PREFERENCIAS (PARA MODAL DE EDICIÓN) =====
	// Para invitados: aplicamos las preferencias personales sobre los puestos base
	// Esto asegura que el modal de edición muestre los colores correctos
	const puestosConPreferencias = useMemo(() => {
		if (esCreador || !preferenciasVisuales) {
			return puestos;
		}

		// Aplicar preferencias personales sobre los puestos base
		return puestos.map(puesto => {
			const configPuesto = preferenciasVisuales.obtenerConfigPuesto?.(puesto.id);

			return {
				...puesto,
				color: configPuesto?.color || puesto.color,
				bgColor: configPuesto?.bg_color || puesto.bgColor || puesto.bg_color,
				// Los alimentadores también pueden tener preferencias
				alimentadores: (puesto.alimentadores || []).map(alim => {
					const configAlim = preferenciasVisuales.obtenerConfigAlimentador?.(alim.id, puesto.id);
					return {
						...alim,
						color: configAlim?.color || alim.color,
					};
				}),
			};
		});
	}, [esCreador, puestos, preferenciasVisuales]);

	// ===== ALIMENTADORES DEL PUESTO SELECCIONADO CON PREFERENCIAS =====
	// Los alimentadores del puesto seleccionado con las preferencias aplicadas
	// (color, intervalo_consulta_ms, oculto de zonas para operadores)
	const alimentadoresConPreferencias = useMemo(() => {
		if (!puestoSeleccionado?.alimentadores) return [];
		if (esCreador || !preferenciasVisuales) {
			return puestoSeleccionado.alimentadores;
		}

		// Aplicar preferencias personales sobre los alimentadores base
		return puestoSeleccionado.alimentadores.map(alim => {
			const configAlim = preferenciasVisuales.obtenerConfigAlimentador?.(alim.id, puestoSeleccionado.id);

			// Construir el alimentador con preferencias aplicadas
			const alimConPrefs = {
				...alim,
				color: configAlim?.color || alim.color,
			};

			// Aplicar intervalo personalizado si existe
			if (configAlim?.intervalo_consulta_ms !== undefined) {
				alimConPrefs.intervalo_consulta_ms = configAlim.intervalo_consulta_ms;
			}

			// Aplicar estados "oculto" personalizados a las zonas del card_design
			if (configAlim?.oculto_superior !== undefined || configAlim?.oculto_inferior !== undefined) {
				alimConPrefs.card_design = {
					...alim.card_design,
					superior: {
						...alim.card_design?.superior,
						...(configAlim?.oculto_superior !== undefined && { oculto: configAlim.oculto_superior }),
					},
					inferior: {
						...alim.card_design?.inferior,
						...(configAlim?.oculto_inferior !== undefined && { oculto: configAlim.oculto_inferior }),
					},
				};
			}

			return alimConPrefs;
		});
	}, [esCreador, puestoSeleccionado, preferenciasVisuales]);

	// Responsive: detectar modo compacto según el ancho de la ventana
	useEffect(() => {
		const actualizarModo = () => setEsCompacto(window.innerWidth < 900);
		actualizarModo();                                            // evalúa una vez al montar
		window.addEventListener("resize", actualizarModo);
		return () => window.removeEventListener("resize", actualizarModo);
	}, []);

	// En modo compacto (móvil), forzar escala global a 1 para visualización
	// Esto es solo visual, NO se persiste en BD ni en preferencias de usuario
	const escalaGlobalEfectiva = esCompacto ? 1 : escalaGlobal;

	// Wrapper para obtenerEscalaEfectiva que considera el modo compacto
	// En móvil, si no hay escala individual ni de puesto, usa 1 en vez de escalaGlobal
	const obtenerEscalaEfectivaConModoCompacto = useCallback((alimentadorId, puestoId) => {
		if (esCompacto) {
			// En modo compacto, forzar escala 1
			// No importa qué tenga configurado el usuario, en móvil siempre es 1
			return 1;
		}
		return obtenerEscalaEfectiva(alimentadorId, puestoId);
	}, [esCompacto, obtenerEscalaEfectiva]);

	// Cargar registradores del workspace (a través de los agentes vinculados)
	useEffect(() => {
		if (!configuracionSeleccionada?.id) return;
		const cargarRegistradores = async () => {
			try {
				// Primero obtener los agentes vinculados al workspace
				const agentes = await listarAgentesWorkspace(configuracionSeleccionada.id);

				// Luego cargar los registradores de cada agente
				const todosRegistradores = [];
				for (const agente of agentes || []) {
					try {
						const regs = await listarRegistradoresAgente(agente.id);
						if (regs && regs.length > 0) {
							todosRegistradores.push(...regs);
						}
					} catch (err) {
						console.error(`Error cargando registradores del agente ${agente.id}:`, err);
					}
				}
				setRegistradores(todosRegistradores);
			} catch (err) {
				console.error("Error cargando registradores:", err);
			}
		};
		cargarRegistradores();
	}, [configuracionSeleccionada?.id]);

	const estadoModalNuevoPuesto = obtenerEstado("nuevoPuesto");     // { abierto, datos } para modal de nuevo puesto
	const estadoModalEditarPuestos = obtenerEstado("editarPuestos"); // idem para modal de edición de puestos
	const estadoModalAlimentador = obtenerEstado("alimentador");     // idem para modal de configuración de alimentador
	const estadoModalConfigPuesto = obtenerEstado("configPuesto");   // idem para modal de configuración global del puesto

	const buscarAlimentador = useCallback((alimId) =>
		alimentadoresConPreferencias.find((a) => a.id === alimId) || null, [alimentadoresConPreferencias]); // helper para obtener el alimentador por id (con preferencias aplicadas)

	const buscarRegistrador = useCallback((regId) =>
		registradores.find((r) => r.id === regId) || null, [registradores]); // helper para obtener el registrador por id

	// ===== HOOK DE POLLING DE LECTURAS =====
	const {
		estaPolling,
		obtenerContadorPolling,
		obtenerErrorPolling,
		handlePlayStopClick,
		limpiarTodosIntervalos,
		hayProblemaConexion,
	} = usePollingLecturas({
		actualizarRegistros,
		guardarLecturaLocal,
		buscarAlimentador,
	});

	const alimentadorEnEdicion = estadoModalAlimentador.datos?.alimentadorId
		? buscarAlimentador(estadoModalAlimentador.datos.alimentadorId)
		: null;

	const modoAlimentador = estadoModalAlimentador.datos?.modo || "crear"; // "crear" o "editar" según cómo se abrió el modal

	// Navegacion
	const handleSalir = async () => {
		// Limpiar localStorage de gaps antes de salir
		// Así al volver a entrar se cargan los datos frescos de BD
		limpiarPreferenciasUI();
		// Cerrar sesión de Supabase y limpiar localStorage de configuración
		// Esto evita que al loguearse otro usuario se intente acceder a workspaces del anterior
		await logout();
		navigate("/");                                                 // vuelve al login
	};

	// ===== MODALES PUESTOS =====
	const abrirModalNuevoPuesto = () => abrirModal("nuevoPuesto");    // abre modal para crear puesto
	const abrirModalEditarPuestos = () => abrirModal("editarPuestos");// abre modal para editar lista de puestos
	const abrirModalConfigPuesto = () => abrirModal("configPuesto");  // abre modal de configuración global del puesto
	const abrirModalConfigurarAgente = () => abrirVentanaConfigAgente(configuracionSeleccionada?.id); // abre ventana de configuración del agente
	const abrirModalGestionarAccesos = () => setModalAccesosAbierto(true); // abre modal de gestión de accesos
	const abrirModalPanelPermisos = () => setModalPanelPermisosAbierto(true); // abre modal de panel de permisos

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

	// Handler para cambio de escala de puesto: establece la escala y limpia las escalas individuales
	const handleEscalaPuestoChange = useCallback((puestoId, escala) => {
		// Encontrar el puesto para obtener sus alimentadores
		const puesto = puestos.find(p => p.id === puestoId);
		if (puesto && puesto.alimentadores) {
			// Limpiar las escalas individuales de todos los alimentadores del puesto
			puesto.alimentadores.forEach(alim => {
				resetearEscalaTarjeta(alim.id);
			});
		}
		// Establecer la nueva escala del puesto
		establecerEscalaPuesto(puestoId, escala);
	}, [puestos, establecerEscalaPuesto, resetearEscalaTarjeta]);

	// ===== MODALES ALIMENTADORES =====
	const abrirModalNuevoAlim = () => abrirModal("alimentador", { modo: "crear" });

	const abrirModalEditarAlim = (_puestoId, alimentador) =>
		abrirModal("alimentador", { modo: "editar", alimentadorId: alimentador.id });

	const handleGuardarAlimentador = async (datos) => {
		if (!datos || !datos.nombre || !puestoSeleccionado) return;

		// Solo mostrar skeleton si estamos creando (no al editar)
		if (modoAlimentador === "crear") {
			setGuardandoAlimentador(true);                        // activar skeleton
			cerrarModal("alimentador");                           // cerrar modal INMEDIATAMENTE para ver el skeleton
		}

		try {
			if (modoAlimentador === "crear") {
				const nuevoAlimentador = await agregarAlimentador(datos); // alta de nuevo alimentador
				// Establecer gap horizontal inicial de 10px para el nuevo alimentador
				if (nuevoAlimentador?.id) {
					establecerGap(nuevoAlimentador.id, 10);
				}
			} else if (alimentadorEnEdicion) {
				if (esCreador) {
					// CREADOR: Guardar todo en BASE (BD)
					const gapActual = obtenerGap(alimentadorEnEdicion.id);
					await actualizarAlimentador(
						puestoSeleccionado.id,
						alimentadorEnEdicion.id,
						{
							...datos,
							gapHorizontal: gapActual, // mantener el gap actual
						}
					);
				} else {
					// INVITADO (operador/observador): Solo guardar el color en preferencias personales
					if (datos.color && preferenciasVisuales?.guardarPreferenciasAlimentador) {
						await preferenciasVisuales.guardarPreferenciasAlimentador(
							alimentadorEnEdicion.id,
							{ color: datos.color }
						);
					}
				}
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

	// Limpiar intervalos de polling al desmontar el componente
	useEffect(() => {
		return () => limpiarTodosIntervalos();
	}, [limpiarTodosIntervalos]);

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
				onAbrirModalConfigurarAgente={abrirModalConfigurarAgente}
				onAbrirModalGestionarAccesos={abrirModalGestionarAccesos}
				onAbrirModalPanelPermisos={abrirModalPanelPermisos}
				onSalir={handleSalir}
				onAbrirMenu={() => setMenuAbierto(true)}
				coloresSistema={COLORES_SISTEMA}
				estaPolling={estaPolling}
				onPlayStopClick={handlePlayStopClick}
			/>

			{/* ===== MENU LATERAL (modo compacto) ===== */}
			{/* En modo compacto (móvil), NO se muestra la sección de Escala Global */}
			{/* La escala se fuerza a 1 automáticamente (ver escalaGlobalEfectiva) */}
			{esCompacto && (
				<MenuLateral
					abierto={menuAbierto}
					onCerrar={() => setMenuAbierto(false)}
					puestos={puestos}
					puestoSeleccionado={puestoSeleccionado}
					onSeleccionarPuesto={seleccionarPuesto}
					onAbrirModalNuevoPuesto={abrirModalNuevoPuesto}
					onAbrirModalEditarPuestos={abrirModalEditarPuestos}
					onAbrirModalConfigurarAgente={abrirModalConfigurarAgente}
					onAbrirModalGestionarAccesos={abrirModalGestionarAccesos}
					onAbrirModalPanelPermisos={abrirModalPanelPermisos}
					onSalir={handleSalir}
					coloresSistema={COLORES_SISTEMA}
				/>
			)}

			{/* ===== MAIN ===== */}
			<main
				className="alim-main"
				style={{ backgroundColor: puestoSeleccionado ? (obtenerBgColorPuesto(puestoSeleccionado.id) || "#e5e7eb") : "#e5e7eb" }} // usa bgColor del puesto (con preferencias de invitado)
			>
				{/* Overlay de problema de conexión (errores de red) */}
				{hayProblemaConexion && (
					<div className="alim-overlay-conexion">
						<div className="alim-overlay-conexion__contenido">
							<span className="alim-overlay-conexion__icono">⚠</span>
							<span className="alim-overlay-conexion__titulo">SIN CONEXIÓN</span>
							<span className="alim-overlay-conexion__texto">
								No se pueden obtener lecturas del servidor
							</span>
						</div>
					</div>
				)}

				{/* Caso 1: Sin workspace asignado */}
				{!configuracionSeleccionada ? (
					<div className="alim-sin-workspace">
						<h2>Sin acceso a workspaces</h2>
						<p>No tienes ningún workspace asignado.</p>
						<p>Contacta a un administrador para que te asigne acceso a un workspace.</p>
						<button onClick={handleSalir}>Volver al inicio</button>
					</div>
				) : !puestoSeleccionado ? (
					/* Caso 2: Tiene workspace pero sin puestos */
					<div className="alim-empty-state">
						<p>
							No hay puestos creados. Haz clic en el boton "+" para agregar
							uno.
						</p>
					</div>
				) : (
					/* Caso 3: Tiene workspace y puestos */
					<>
						<GrillaTarjetas
							alimentadores={alimentadoresConPreferencias}
							lecturas={lecturasTarjetas}
							puestoId={puestoSeleccionado.id}
							workspaceId={configuracionSeleccionada?.id}
							elementoArrastrandoId={elementoArrastrandoId}
							onAbrirConfiguracion={abrirModalEditarAlim}
							onAbrirHistorial={(puestoId, alim) => {
								abrirVentana(alim, alim.card_design);
							}}
							onDragStart={handleDragStartAlim}
							onDragOver={alPasarPorEncima}
							onDrop={handleDropAlim}
							onDragEnd={handleDragEndAlim}
							skeletonCard={guardandoAlimentador ? <SkeletonCard /> : null}
							onDropAlFinal={handleDropAlimAlFinal}
							onAgregarNuevo={abrirModalNuevoAlim}
							puedeAgregarNuevo={
								configuracionSeleccionada?.esCreador
									? (rolGlobal === 'superadmin' || rolGlobal === 'admin')
									: (configuracionSeleccionada?.rol === 'admin')
							}
							// Observador no puede ver estadísticas (ni global ni en workspace)
							esObservador={rolGlobal === 'observador' || configuracionSeleccionada?.rol === 'observador'}
							estaMidiendo={estaMidiendo}
							obtenerTimestampInicio={obtenerTimestampInicio}
							obtenerContadorLecturas={obtenerContadorLecturas}
							obtenerGap={obtenerGap}
							onGapChange={establecerGap}
							obtenerRowGap={obtenerRowGap}
							onRowGapChange={establecerRowGap}
							// Polling de lecturas
							estaPolling={estaPolling}
							onPlayStopClick={handlePlayStopClick}
							obtenerContadorPolling={obtenerContadorPolling}
							obtenerErrorPolling={obtenerErrorPolling}
							// Escala de tarjetas (usa wrapper que fuerza 1 en modo compacto/móvil)
							obtenerEscalaEfectiva={obtenerEscalaEfectivaConModoCompacto}
							onEscalaChange={establecerEscalaTarjeta}
							ESCALA_MIN={ESCALA_MIN}
							ESCALA_MAX={ESCALA_MAX}
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
				puestos={puestosConPreferencias}
				onCerrar={() => cerrarModal("editarPuestos")}
				onGuardar={handleGuardarPuestos}
				esCreador={configuracionSeleccionada?.esCreador}
				rolEnWorkspace={configuracionSeleccionada?.rol}
				// En modo compacto (móvil), no mostrar controles de escala de puesto
				obtenerEscalaPuesto={!esCompacto ? obtenerEscalaPuesto : undefined}
				onEscalaPuestoChange={!esCompacto ? handleEscalaPuestoChange : undefined}
				ESCALA_MIN={ESCALA_MIN}
				ESCALA_MAX={ESCALA_MAX}
				// Estilos globales de tarjetas (pestaña Apariencia)
				estilosGlobales={estilosGlobales}
				onGuardarEstilos={guardarEstilosGlobales}
			/>

			<ModalConfiguracionAlimentador
				abierto={estadoModalAlimentador.abierto}
				puestoNombre={puestoSeleccionado?.nombre || ""}
				workspaceId={configuracionSeleccionada?.id}
				modo={modoAlimentador}
				initialData={alimentadorEnEdicion}
				onCancelar={() => cerrarModal("alimentador")}
				onConfirmar={handleGuardarAlimentador}
				onEliminar={handleEliminarAlimentador}
				esCreador={configuracionSeleccionada?.esCreador}
				rolEnWorkspace={configuracionSeleccionada?.rol}
			/>

			<ModalConfiguracionPuesto
				abierto={estadoModalConfigPuesto.abierto}
				puesto={puestoSeleccionado}
				onCerrar={() => cerrarModal("configPuesto")}
				estaPolling={estaPolling}
				onPlayStopClick={handlePlayStopClick}
				buscarRegistrador={buscarRegistrador}
			/>

			<ModalConfigurarAgente
				abierto={ventanaConfigAgente.abierta}
				workspaceId={ventanaConfigAgente.workspaceId}
				onCerrar={cerrarVentanaConfigAgente}
				minimizada={ventanaConfigAgente.minimizada}
				maximizada={ventanaConfigAgente.maximizada}
				posicion={ventanaConfigAgente.posicion}
				zIndex={ventanaConfigAgente.zIndex}
				onMinimizar={toggleMinimizarConfigAgente}
				onMaximizar={toggleMaximizarConfigAgente}
				onEnfocar={enfocarVentanaConfigAgente}
				onMover={moverVentanaConfigAgente}
			/>

			<ModalGestionarAccesos
				abierto={modalAccesosAbierto}
				workspaceId={configuracionSeleccionada?.id}
				workspaceNombre={configuracionSeleccionada?.nombre}
				usuarioActualId={perfil?.id}
				onCerrar={() => setModalAccesosAbierto(false)}
			/>

			<ModalPanelPermisos
				abierto={modalPanelPermisosAbierto}
				onCerrar={() => setModalPanelPermisosAbierto(false)}
			/>

			{/* Sistema de ventanas flotantes de historial */}
			<ContenedorVentanasHistorial
				listaVentanas={listaVentanas}
				ventanasMinimizadas={ventanasMinimizadas}
				cerrarVentana={cerrarVentana}
				toggleMinimizar={toggleMinimizar}
				toggleMaximizar={toggleMaximizar}
				enfocarVentana={enfocarVentana}
				moverVentana={moverVentana}
			/>
		</div>
	);
};

export default VistaAlimentadores;
