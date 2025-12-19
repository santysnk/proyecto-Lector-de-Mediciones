// src/paginas/PaginaAlimentadores/componentes/layout/VistaAlimentadores.jsx

import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";                                    // para portal del overlay
import { useNavigate } from "react-router-dom";                     // navegación entre rutas
import { useAuth } from "../../../../contextos/AuthContext";        // contexto de autenticación
import "./VistaAlimentadores.css";                                  // estilos específicos del layout de alimentadores
import "../navegacion/BotonGuardarCambios.css";                     // estilos del overlay de guardando

import BarraNavegacion from "../navegacion/BarraNavegacion.jsx";    // barra superior (título + botones de puestos)
import MenuLateral from "../navegacion/MenuLateral.jsx";            // menú lateral en modo compacto (mobile)
import GrillaTarjetas from "../tarjetas/GrillaTarjetas.jsx";        // grilla de tarjetas de alimentadores
import SkeletonCard from "../tarjetas/SkeletonCard.jsx";            // skeleton de tarjeta (loading state)
import ModalNuevoPuesto from "../modales/ModalNuevoPuesto.jsx";     // modal para crear puestos
import ModalEditarPuestos from "../modales/ModalEditarPuestos.jsx"; // modal para editar/renombrar/eliminar puestos
import ModalConfiguracionAlimentador from "../modales/ModalConfiguracionAlimentador.jsx"; // modal de config de registrador
import ModalConfiguracionPuesto from "../modales/ModalConfiguracionPuesto.jsx";           // modal de configuración global del puesto
import ModalConfigurarAgente from "../modales/ModalConfigurarAgente.jsx";                 // modal de configuración del agente
import ModalGestionarAccesos from "../modales/ModalGestionarAccesos.jsx";                 // modal de gestión de accesos al workspace

import { COLORES_SISTEMA } from "../../constantes/colores";         // paleta de colores para botones/puestos
import { usarArrastrarSoltar } from "../../hooks/usarArrastrarSoltar"; // hook de drag & drop de tarjetas
import { usarContextoAlimentadores } from "../../contexto/ContextoAlimentadoresSupabase"; // contexto con datos y acciones (Supabase)
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion"; // contexto de workspaces
import { useGestorModales } from "../../hooks/useGestorModales";    // hook para abrir/cerrar modales por clave
import { obtenerUltimasLecturasPorRegistrador, listarAgentesWorkspace, listarRegistradoresAgente } from "../../../../servicios/apiService"; // API para polling de lecturas

const VistaAlimentadores = () => {
	const navigate = useNavigate();                                  // para salir al login
	const { logout } = useAuth();                                    // función de logout del contexto de auth
	const { configuracionSeleccionada, perfil } = usarContextoConfiguracion(); // workspace activo + perfil usuario

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
	const [modalAgenteAbierto, setModalAgenteAbierto] = useState(false); // estado del modal de configuración del agente
	const [modalAccesosAbierto, setModalAccesosAbierto] = useState(false); // estado del modal de gestión de accesos
	const [alimentadoresPolling, setAlimentadoresPolling] = useState({}); // { [alimId]: true/false } para tracking de polling
	const [lecturasPolling, setLecturasPolling] = useState({}); // { [alimId]: { valores, timestamp, ... } } - últimas lecturas obtenidas
	const [contadoresPolling, setContadoresPolling] = useState({}); // { [alimId]: number } - contador de lecturas para animación
	const pollingIntervalsRef = useRef({}); // { [alimId]: intervalId } - para limpiar intervalos
	const [registradores, setRegistradores] = useState([]); // Lista de registradores del workspace

	// Responsive: detectar modo compacto según el ancho de la ventana
	useEffect(() => {
		const actualizarModo = () => setEsCompacto(window.innerWidth < 900);
		actualizarModo();                                            // evalúa una vez al montar
		window.addEventListener("resize", actualizarModo);
		return () => window.removeEventListener("resize", actualizarModo);
	}, []);

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

	const buscarAlimentador = (alimId) =>
		puestoSeleccionado?.alimentadores.find((a) => a.id === alimId) || null; // helper para obtener el alimentador por id

	const buscarRegistrador = useCallback((regId) =>
		registradores.find((r) => r.id === regId) || null, [registradores]); // helper para obtener el registrador por id

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
	const abrirModalConfigurarAgente = () => setModalAgenteAbierto(true); // abre modal de configuración del agente
	const abrirModalGestionarAccesos = () => setModalAccesosAbierto(true); // abre modal de gestión de accesos

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
				// Preservar el gapHorizontal existente durante la edición
				const gapActual = obtenerGap(alimentadorEnEdicion.id);
				await actualizarAlimentador(
					puestoSeleccionado.id,
					alimentadorEnEdicion.id,
					{
						...datos,
						gapHorizontal: gapActual, // mantener el gap actual
					}
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

	// ===== POLLING DE LECTURAS =====
	// Verifica si un alimentador está haciendo polling
	const estaPolling = (alimId) => !!alimentadoresPolling[alimId];

	// Obtiene el contador de lecturas de polling para un alimentador
	const obtenerContadorPolling = (alimId) => contadoresPolling[alimId] || 0;

	// Función para obtener lecturas de un registrador y actualizar el estado
	const fetchLecturasRegistrador = useCallback(async (alimId, registradorId, zona = null) => {
		try {
			const lecturas = await obtenerUltimasLecturasPorRegistrador(registradorId, 1);
			if (lecturas && lecturas.length > 0) {
				const lectura = lecturas[0];

				// Guardar lectura por zona si se especifica, o global si no
				const clavePolling = zona ? `${alimId}_${zona}` : alimId;
				setLecturasPolling((prev) => ({
					...prev,
					[clavePolling]: lectura,
				}));

				// Transformar los valores al formato esperado por calcularValoresLadoTarjeta
				// La lectura tiene: { id, registrador_id, timestamp, valores: [...], indice_inicial, cantidad_registros, ... }
				// El formato esperado es: { rele: [{ index, address, value }, ...] }
				if (lectura.valores && Array.isArray(lectura.valores)) {
					const indiceInicial = lectura.indice_inicial ?? 0;

					const registrosTransformados = lectura.valores.map((valor, idx) => ({
						index: idx,
						address: indiceInicial + idx,
						value: valor,
					}));

					// Actualizar registrosEnVivo acumulando con registros existentes
					// Esto permite que múltiples registradores contribuyan datos a la misma card
					actualizarRegistros(alimId, (prevRegistros) => {
						const registrosAnteriores = prevRegistros?.rele || [];
						// Filtrar registros anteriores que no estén en el rango del nuevo registrador
						// para evitar duplicados, luego agregar los nuevos
						const rangoNuevo = new Set(registrosTransformados.map(r => r.address));
						const registrosFiltrados = registrosAnteriores.filter(r => !rangoNuevo.has(r.address));
						return {
							rele: [...registrosFiltrados, ...registrosTransformados]
						};
					});

					// Incrementar contador de lecturas para reiniciar la animación de borde
					setContadoresPolling((prev) => ({
						...prev,
						[alimId]: (prev[alimId] || 0) + 1,
					}));
				}
			}
		} catch (error) {
			console.error(`[Polling] Error obteniendo lecturas para alimentador ${alimId}:`, error);
		}
	}, [actualizarRegistros]);

	// Extrae los registrador_id únicos del card_design de un alimentador
	const obtenerRegistradoresDeAlim = useCallback((alim) => {
		const registradores = [];
		const card_design = alim.card_design;

		if (card_design?.superior?.registrador_id) {
			registradores.push({ zona: "superior", id: card_design.superior.registrador_id });
		}
		if (card_design?.inferior?.registrador_id) {
			// Solo agregar si es diferente al superior
			const yaTieneSuperior = registradores.some(r => r.id === card_design.inferior.registrador_id);
			if (!yaTieneSuperior) {
				registradores.push({ zona: "inferior", id: card_design.inferior.registrador_id });
			} else {
				// Si es el mismo, marcar que el superior también cubre inferior
				registradores[0].zonas = ["superior", "inferior"];
			}
		}

		// Compatibilidad: si no hay registradores en zonas, usar el de la raíz (formato antiguo)
		if (registradores.length === 0 && alim.registrador_id) {
			registradores.push({ zona: "legacy", id: alim.registrador_id });
		}

		return registradores;
	}, []);

	// Inicia el polling para un alimentador
	const iniciarPolling = useCallback((alim) => {
		const registradores = obtenerRegistradoresDeAlim(alim);

		if (registradores.length === 0) {
			console.warn(`[Polling] Alimentador ${alim.id} no tiene registradores configurados`);
			return;
		}

		if (!alim.intervalo_consulta_ms) {
			console.warn(`[Polling] Alimentador ${alim.id} no tiene intervalo de consulta configurado`);
			return;
		}

		// Limpiar intervalos existentes si hay
		if (pollingIntervalsRef.current[alim.id]) {
			// Puede ser un array de intervalos si hay múltiples registradores
			const intervalos = pollingIntervalsRef.current[alim.id];
			if (Array.isArray(intervalos)) {
				intervalos.forEach(clearInterval);
			} else {
				clearInterval(intervalos);
			}
		}

		// Crear intervalos para cada registrador único
		const intervalos = [];

		registradores.forEach(({ zona, id: registradorId }) => {
			// Hacer la primera lectura inmediatamente
			fetchLecturasRegistrador(alim.id, registradorId, zona);

			// Configurar intervalo para lecturas periódicas
			const intervalId = setInterval(() => {
				fetchLecturasRegistrador(alim.id, registradorId, zona);
			}, alim.intervalo_consulta_ms);

			intervalos.push(intervalId);
		});

		pollingIntervalsRef.current[alim.id] = intervalos.length === 1 ? intervalos[0] : intervalos;
	}, [fetchLecturasRegistrador, obtenerRegistradoresDeAlim]);

	// Detiene el polling para un alimentador
	const detenerPolling = useCallback((alimId) => {
		if (pollingIntervalsRef.current[alimId]) {
			// Puede ser un array de intervalos si hay múltiples registradores
			const intervalos = pollingIntervalsRef.current[alimId];
			if (Array.isArray(intervalos)) {
				intervalos.forEach(clearInterval);
			} else {
				clearInterval(intervalos);
			}
			delete pollingIntervalsRef.current[alimId];
		}
		// Limpiar las lecturas de polling para ese alimentador (incluyendo las de zonas)
		setLecturasPolling((prev) => {
			const nuevo = { ...prev };
			delete nuevo[alimId];
			delete nuevo[`${alimId}_superior`];
			delete nuevo[`${alimId}_inferior`];
			delete nuevo[`${alimId}_legacy`];
			return nuevo;
		});
		// Resetear el contador de lecturas para ese alimentador
		setContadoresPolling((prev) => {
			const nuevo = { ...prev };
			delete nuevo[alimId];
			return nuevo;
		});
	}, []);

	// Alterna el polling de un alimentador (play/stop)
	const handlePlayStopClick = useCallback((alimId) => {
		const alimentador = buscarAlimentador(alimId);
		if (!alimentador) return;

		const estaActivo = alimentadoresPolling[alimId];

		if (estaActivo) {
			// Detener polling
			detenerPolling(alimId);
		} else {
			// Iniciar polling
			iniciarPolling(alimentador);
		}

		// Actualizar estado visual
		setAlimentadoresPolling((prev) => ({
			...prev,
			[alimId]: !prev[alimId],
		}));
	}, [alimentadoresPolling, buscarAlimentador, detenerPolling, iniciarPolling]);

	// Helper para limpiar intervalos (puede ser un solo intervalo o un array)
	const limpiarIntervalos = (intervalos) => {
		if (Array.isArray(intervalos)) {
			intervalos.forEach(clearInterval);
		} else {
			clearInterval(intervalos);
		}
	};

	// Limpiar todos los intervalos al desmontar el componente
	useEffect(() => {
		return () => {
			Object.values(pollingIntervalsRef.current).forEach(limpiarIntervalos);
		};
	}, []);

	// Detener polling cuando cambia el puesto seleccionado
	useEffect(() => {
		// Limpiar todos los intervalos de polling
		Object.values(pollingIntervalsRef.current).forEach(limpiarIntervalos);
		pollingIntervalsRef.current = {};
		// Resetear estados
		setAlimentadoresPolling({});
		setLecturasPolling({});
		setContadoresPolling({});
	}, [puestoSeleccionado?.id]);

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
				onSalir={handleSalir}
				onAbrirMenu={() => setMenuAbierto(true)}
				coloresSistema={COLORES_SISTEMA}
				estaPolling={estaPolling}
				onPlayStopClick={handlePlayStopClick}
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
							alimentadores={puestoSeleccionado.alimentadores}
							lecturas={lecturasTarjetas}
							puestoId={puestoSeleccionado.id}
							elementoArrastrandoId={elementoArrastrandoId}
							onAbrirConfiguracion={abrirModalEditarAlim}
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
							// Polling de lecturas
							estaPolling={estaPolling}
							onPlayStopClick={handlePlayStopClick}
							obtenerContadorPolling={obtenerContadorPolling}
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
				workspaceId={configuracionSeleccionada?.id}
				modo={modoAlimentador}
				initialData={alimentadorEnEdicion}
				onCancelar={() => cerrarModal("alimentador")}
				onConfirmar={handleGuardarAlimentador}
				onEliminar={handleEliminarAlimentador}
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
				abierto={modalAgenteAbierto}
				workspaceId={configuracionSeleccionada?.id}
				onCerrar={() => setModalAgenteAbierto(false)}
			/>

			<ModalGestionarAccesos
				abierto={modalAccesosAbierto}
				workspaceId={configuracionSeleccionada?.id}
				workspaceNombre={configuracionSeleccionada?.nombre}
				usuarioActualId={perfil?.id}
				onCerrar={() => setModalAccesosAbierto(false)}
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
