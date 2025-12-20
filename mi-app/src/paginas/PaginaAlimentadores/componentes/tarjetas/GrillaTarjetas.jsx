// src/paginas/PaginaAlimentadores/componentes/tarjetas/GrillaTarjetas.jsx

import React, { useRef, useEffect, useState, useCallback } from "react";
import TarjetaAlimentador from "./TarjetaAlimentador.jsx";
import GapResizer from "./GapResizer.jsx";
import RowGapResizer from "./RowGapResizer.jsx";
import GrillaUnifilar from "./GrillaUnifilar.jsx";
import usarGrillaUnifilar from "../../hooks/usarGrillaUnifilar.js";
import "./GrillaTarjetas.css";

// Breakpoint para desactivar los controles de gap en móviles/tablets
const BREAKPOINT_MOBILE = 982;

// Gaps fijos para modo móvil
const GAP_FIJO_MOBILE = 10;
const ROW_GAP_FIJO_MOBILE = 20;

/**
 * Verifica si un alimentador tiene la configuración completa para hacer polling.
 * Requisitos:
 * - Al menos una zona (superior o inferior) con registrador_id definido
 * - intervalo_consulta_ms definido y > 0
 * - Al menos un box habilitado (enabled: true) con un índice válido en una zona que tenga registrador
 */
const puedeHacerPolling = (alim) => {
	// 1. Verificar intervalo_consulta_ms
	if (!alim.intervalo_consulta_ms || alim.intervalo_consulta_ms <= 0) {
		return false;
	}

	// 2. Verificar card_design y zonas
	const cardDesign = alim.card_design || {};
	const superior = cardDesign.superior || {};
	const inferior = cardDesign.inferior || {};

	// 3. Verificar que haya al menos una zona con registrador_id
	const tieneRegistradorSuperior = !!superior.registrador_id;
	const tieneRegistradorInferior = !!inferior.registrador_id;

	// Compatibilidad con formato antiguo: registrador_id en raíz
	const tieneRegistradorLegacy = !!alim.registrador_id;

	if (!tieneRegistradorSuperior && !tieneRegistradorInferior && !tieneRegistradorLegacy) {
		return false;
	}

	// 4. Verificar que haya al menos un box habilitado con índice válido en una zona que tenga registrador
	const tieneBoxHabilitado = (boxes) => {
		return boxes.some((box) => {
			if (!box.enabled) return false;
			// El índice puede estar en 'indice' (formato modal) o 'registro' (formato normalizado)
			const indice = box.indice !== undefined ? box.indice : box.registro;
			// Considerar válido si es un número >= 0 o un string numérico no vacío
			if (indice === null || indice === undefined || indice === "") {
				return false;
			}
			const numIndice = Number(indice);
			return Number.isFinite(numIndice) && numIndice >= 0;
		});
	};

	const boxesSuperior = superior.boxes || [];
	const boxesInferior = inferior.boxes || [];

	// Verificar si hay boxes habilitados en zonas que tienen registrador
	const superiorValido = tieneRegistradorSuperior && tieneBoxHabilitado(boxesSuperior);
	const inferiorValido = tieneRegistradorInferior && tieneBoxHabilitado(boxesInferior);
	// Compatibilidad legacy: si hay registrador en raíz, cualquier box habilitado vale
	const legacyValido = tieneRegistradorLegacy && (tieneBoxHabilitado(boxesSuperior) || tieneBoxHabilitado(boxesInferior));

	return superiorValido || inferiorValido || legacyValido;
};

/**
 * Grilla de tarjetas de alimentadores.
 *
 * Estructura:
 * - El primer RowGapResizer controla la separación del menú (está fuera del grid)
 * - Las tarjetas se renderizan en un flex container con flex-wrap
 * - El row-gap del grid se controla via CSS
 * - Los RowGapResizers se posicionan con position: absolute sobre los espacios entre filas
 * - Cada tarjeta tiene un GapResizer a la derecha para controlar el espaciado horizontal
 * - Los GapResizers se ocultan durante drag & drop
 * - En pantallas pequeñas (< 982px) los controles de gap se desactivan y se usan valores fijos
 */
const GrillaTarjetas = ({
	alimentadores,
	lecturas,
	puestoId,
	workspaceId,             // ID del workspace para la grilla unifiliar
	elementoArrastrandoId,
	onAbrirConfiguracion,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	onDropAlFinal,
	onAgregarNuevo,
	estaMidiendo,
	obtenerTimestampInicio,
	obtenerContadorLecturas,
	// Gaps horizontales (entre tarjetas)
	obtenerGap,
	onGapChange,
	// Gaps verticales (entre filas)
	obtenerRowGap,
	onRowGapChange,
	// Skeleton card (opcional, se muestra mientras se guarda)
	skeletonCard = null,
	// Polling de lecturas
	estaPolling,              // (alimId) => boolean
	onPlayStopClick,          // (alimId) => void
	obtenerContadorPolling,   // (alimId) => number - contador de lecturas para animación
	obtenerErrorPolling,      // (alimId) => { mensaje, timestamp } | null - error de lectura
}) => {
	const gridRef = useRef(null);
	// Posiciones Y de los espacios entre filas (para posicionar los RowGapResizers)
	const [posicionesEntreFilas, setPosicionesEntreFilas] = useState([]);
	// Mapa de filas por tarjeta para detectar cambios de fila
	const filasAnterioresRef = useRef({});
	// Snapshot de TODOS los gaps cuando se detecta un cambio de layout por resize
	// Se guarda una vez y se restaura cuando se vuelve a la configuración original
	const snapshotGapsRef = useRef(null);
	// Número de filas en el snapshot (para saber cuándo restaurar)
	const numFilasSnapshotRef = useRef(null);
	// Estado para detectar si estamos en modo móvil (< 982px)
	const [esModoMobile, setEsModoMobile] = useState(() =>
		typeof window !== 'undefined' ? window.innerWidth < BREAKPOINT_MOBILE : false
	);

	// Mapa de fila por tarjeta (para aplicar margin-top individual)
	const [filasPorTarjeta, setFilasPorTarjeta] = useState({});
	// Primera tarjeta de cada fila (para saber dónde poner el RowGapResizer)
	const [primerasTarjetasPorFila, setPrimerasTarjetasPorFila] = useState({});

	// Hook para la grilla unifiliar (dibujo de diagramas)
	const grillaUnifilar = usarGrillaUnifilar(puestoId, workspaceId);

	// Detectar las posiciones entre filas y manejar gaps de tarjetas que cambian de fila
	const detectarFilasYFinales = useCallback(() => {
		if (!gridRef.current) return;

		const nuevasPosiciones = [];
		const nuevasFilasPorTarjeta = {};
		const nuevasPrimerasPorFila = {}; // { filaIndex: alimId }
		let ultimoLeft = null;
		let ultimoBottom = null;
		let filaIndex = 0;

		// Incluir todos los wrappers de alimentadores y la tarjeta "Nuevo Registrador"
		const tarjetas = Array.from(gridRef.current.querySelectorAll('.alim-card-wrapper, .alim-card-add'));
		const gridRect = gridRef.current.getBoundingClientRect();

		tarjetas.forEach((wrapper, index) => {
			const alimId = wrapper.dataset.alimId || 'nuevo-registrador';
			const rect = wrapper.getBoundingClientRect();

			// Detectar cambio de fila: si esta tarjeta está más a la izquierda que la anterior,
			// significa que saltó a una nueva fila (flex-wrap)
			// Usamos left en lugar de top porque top se ve afectado por margin-top
			if (ultimoLeft !== null && rect.left < ultimoLeft) {
				// Guardar la posición Y entre filas (relativa al grid)
				const posY = ultimoBottom - gridRect.top;
				nuevasPosiciones.push({
					filaIndex: filaIndex + 1,
					top: posY
				});
				filaIndex++;
				// Esta tarjeta es la primera de la nueva fila
				nuevasPrimerasPorFila[filaIndex] = alimId;
			} else if (index === 0) {
				// La primera tarjeta es la primera de la fila 0
				nuevasPrimerasPorFila[0] = alimId;
			}

			// Guardar en qué fila está cada tarjeta
			nuevasFilasPorTarjeta[alimId] = filaIndex;

			ultimoLeft = rect.left;
			ultimoBottom = rect.bottom;
		});

		const numFilasActual = filaIndex + 1; // Número total de filas
		const filasAnteriores = filasAnterioresRef.current;
		const numFilasAnterior = Object.keys(filasAnteriores).length > 0
			? Math.max(...Object.values(filasAnteriores)) + 1
			: numFilasActual;

		// Detectar si aumentó el número de filas (se achicó la pantalla)
		if (numFilasActual > numFilasAnterior) {
			// Si no hay snapshot, guardar todos los gaps actuales
			if (snapshotGapsRef.current === null) {
				const snapshot = {};
				alimentadores.forEach((alim) => {
					snapshot[alim.id] = obtenerGap(alim.id);
				});
				snapshotGapsRef.current = snapshot;
				numFilasSnapshotRef.current = numFilasAnterior;
			}

			// Resetear gaps de tarjetas que bajaron de fila
			Object.keys(nuevasFilasPorTarjeta).forEach((alimId) => {
				if (alimId === 'nuevo-registrador') return;
				const filaAnterior = filasAnteriores[alimId];
				const filaNueva = nuevasFilasPorTarjeta[alimId];

				if (filaAnterior !== undefined && filaNueva > filaAnterior) {
					onGapChange(alimId, 10);
				}
			});
		}
		// Detectar si disminuyó el número de filas (se ensanchó la pantalla)
		else if (numFilasActual < numFilasAnterior) {
			// Si volvimos al número de filas del snapshot (o menos), restaurar todos los gaps
			if (snapshotGapsRef.current !== null && numFilasActual <= numFilasSnapshotRef.current) {
				Object.keys(snapshotGapsRef.current).forEach((alimId) => {
					onGapChange(alimId, snapshotGapsRef.current[alimId]);
				});
				// Limpiar el snapshot
				snapshotGapsRef.current = null;
				numFilasSnapshotRef.current = null;
			}
		}

		// Actualizar referencia de filas anteriores
		filasAnterioresRef.current = nuevasFilasPorTarjeta;

		// Solo actualizar posiciones si realmente cambió
		const posicionesStr = JSON.stringify(nuevasPosiciones);
		setPosicionesEntreFilas(prev => {
			const prevStr = JSON.stringify(prev);
			if (prevStr !== posicionesStr) {
				return nuevasPosiciones;
			}
			return prev;
		});

		// Actualizar mapa de filas por tarjeta
		const filasStr = JSON.stringify(nuevasFilasPorTarjeta);
		setFilasPorTarjeta(prev => {
			if (JSON.stringify(prev) !== filasStr) {
				return nuevasFilasPorTarjeta;
			}
			return prev;
		});

		// Actualizar primeras tarjetas por fila
		const primerasStr = JSON.stringify(nuevasPrimerasPorFila);
		setPrimerasTarjetasPorFila(prev => {
			if (JSON.stringify(prev) !== primerasStr) {
				return nuevasPrimerasPorFila;
			}
			return prev;
		});
	}, [onGapChange, obtenerGap, alimentadores]);

	// Ejecutar detección después del primer render y cuando cambian dependencias
	useEffect(() => {
		const raf = requestAnimationFrame(() => {
			detectarFilasYFinales();
		});
		return () => cancelAnimationFrame(raf);
	}, [alimentadores, detectarFilasYFinales]);

	// Re-detectar en resize
	useEffect(() => {
		const handleResize = () => {
			requestAnimationFrame(detectarFilasYFinales);
		};

		window.addEventListener('resize', handleResize);

		// ResizeObserver para el grid
		const resizeObserver = new ResizeObserver(() => {
			requestAnimationFrame(detectarFilasYFinales);
		});

		if (gridRef.current) {
			resizeObserver.observe(gridRef.current);
		}

		return () => {
			window.removeEventListener('resize', handleResize);
			resizeObserver.disconnect();
		};
	}, [detectarFilasYFinales]);

	// Re-detectar cuando cambian los row gaps
	useEffect(() => {
		const timer = setTimeout(() => {
			requestAnimationFrame(detectarFilasYFinales);
		}, 50);
		return () => clearTimeout(timer);
	}, [obtenerRowGap, detectarFilasYFinales]);

	// Detectar modo móvil al cambiar el tamaño de ventana
	useEffect(() => {
		const handleResize = () => {
			const nuevoEsMobile = window.innerWidth < BREAKPOINT_MOBILE;
			setEsModoMobile(nuevoEsMobile);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// En modo móvil, usar gaps fijos; en desktop, usar los configurados
	const rowGapPrimero = esModoMobile ? ROW_GAP_FIJO_MOBILE : obtenerRowGap(0);

	// Función para obtener el margin-top de una tarjeta según su fila
	const obtenerMarginTop = (alimId) => {
		const fila = filasPorTarjeta[alimId];
		if (fila === undefined || fila === 0) return 0; // Primera fila no tiene margin
		// Buscar si esta tarjeta es la primera de su fila
		if (primerasTarjetasPorFila[fila] === alimId) {
			return esModoMobile ? ROW_GAP_FIJO_MOBILE : obtenerRowGap(fila);
		}
		return esModoMobile ? ROW_GAP_FIJO_MOBILE : obtenerRowGap(fila);
	};

	return (
		<div className="grilla-con-row-gaps">
			{/* Grilla unifiliar para dibujar diagramas */}
			<GrillaUnifilar
				celdas={grillaUnifilar.celdas}
				textos={grillaUnifilar.textos}
				modoEdicion={grillaUnifilar.modoEdicion}
				colorSeleccionado={grillaUnifilar.colorSeleccionado}
				herramienta={grillaUnifilar.herramienta}
				estaPintando={grillaUnifilar.estaPintando}
				coloresDisponibles={grillaUnifilar.coloresDisponibles}
				fuentesDisponibles={grillaUnifilar.fuentesDisponibles}
				tamanosDisponibles={grillaUnifilar.tamanosDisponibles}
				grosoresDisponibles={grillaUnifilar.grosoresDisponibles}
				grosorLinea={grillaUnifilar.grosorLinea}
				onCambiarGrosor={grillaUnifilar.cambiarGrosor}
				configTexto={grillaUnifilar.configTexto}
				onConfigTextoChange={grillaUnifilar.setConfigTexto}
				textoSeleccionadoId={grillaUnifilar.textoSeleccionadoId}
				onTextoSeleccionadoChange={grillaUnifilar.setTextoSeleccionadoId}
				onPintarCelda={grillaUnifilar.pintarCelda}
				onIniciarPintado={grillaUnifilar.iniciarPintado}
				onDetenerPintado={grillaUnifilar.detenerPintado}
				onCambiarColor={grillaUnifilar.setColorSeleccionado}
				onSeleccionarPincel={grillaUnifilar.seleccionarPincel}
				onSeleccionarBorrador={grillaUnifilar.seleccionarBorrador}
				onSeleccionarTexto={grillaUnifilar.seleccionarTexto}
				onSeleccionarBalde={grillaUnifilar.seleccionarBalde}
				onSeleccionarMover={grillaUnifilar.seleccionarMover}
				onRellenarConectadas={grillaUnifilar.rellenarConectadas}
				onBorrarArea={grillaUnifilar.borrarArea}
				onObtenerCeldasConectadas={grillaUnifilar.obtenerCeldasConectadas}
				onMoverCeldasConectadas={grillaUnifilar.moverCeldasConectadas}
				onAgregarTexto={grillaUnifilar.agregarTexto}
				onActualizarTexto={grillaUnifilar.actualizarTexto}
				onEliminarTexto={grillaUnifilar.eliminarTexto}
				onLimpiarTodo={grillaUnifilar.limpiarTodo}
				onCerrarEdicion={grillaUnifilar.desactivarEdicion}
			/>

			{/* Botón flotante para activar/desactivar modo edición de diagrama */}
			{!grillaUnifilar.modoEdicion && (
				<button
					type="button"
					className="grilla-btn-editar-diagrama"
					onClick={grillaUnifilar.activarEdicion}
					title="Editar diagrama unifiliar"
				>
					<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
						<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
					</svg>
				</button>
			)}

			{/* Botones flotantes para guardar/cargar diagrama - solo en modo edición */}
			{grillaUnifilar.modoEdicion && (
				<div className="grilla-btns-archivo">
					{/* Botón guardar (arriba) */}
					<button
						type="button"
						className="grilla-btn-archivo grilla-btn-archivo--guardar"
						onClick={grillaUnifilar.exportarAArchivo}
						title="Guardar diagrama a archivo"
					>
						<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
							<path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
						</svg>
					</button>
					{/* Botón abrir (abajo) */}
					<label
						className="grilla-btn-archivo grilla-btn-archivo--abrir"
						title="Cargar diagrama desde archivo"
					>
						<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
							<path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
						</svg>
						<input
							type="file"
							accept=".json"
							style={{ display: "none" }}
							onChange={async (e) => {
								const archivo = e.target.files?.[0];
								if (archivo) {
									const exito = await grillaUnifilar.importarDesdeArchivo(archivo);
									if (!exito) {
										alert("Error al cargar el archivo. Verifica que sea un archivo JSON válido.");
									}
								}
								e.target.value = "";
							}}
						/>
					</label>
				</div>
			)}

			{/* RowGapResizer para la primera fila (separación del menú) - solo en desktop */}
			{!elementoArrastrandoId && !esModoMobile && (
				<RowGapResizer
					gap={obtenerRowGap(0)}
					onGapChange={(nuevoGap) => onRowGapChange(0, nuevoGap)}
					rowIndex={0}
				/>
			)}
			{/* Spacer fijo durante drag o en modo móvil */}
			{(elementoArrastrandoId || esModoMobile) && (
				<div style={{ height: rowGapPrimero }} />
			)}

			{/* Mensaje cuando no hay alimentadores */}
			{alimentadores.length === 0 && (
				<p className="alim-empty-message">
					Este puesto no tiene alimentadores. Haz clic en el botón de abajo para agregar.
				</p>
			)}

			<div
				ref={gridRef}
				className="alim-cards-grid"
			>
				{alimentadores.map((alim) => {
					const lecturasAlim = lecturas[alim.id] || {};
					const mideRele = estaMidiendo(alim.id, "rele");
					const mideAnalizador = estaMidiendo(alim.id, "analizador");
					const gapTarjeta = obtenerGap(alim.id);
					const marginTop = obtenerMarginTop(alim.id);

					return (
						<React.Fragment key={alim.id}>
							{/* Tarjeta del alimentador */}
							<div
								className="alim-card-wrapper"
								data-alim-id={alim.id}
								style={{ marginTop: marginTop > 0 ? `${marginTop}px` : undefined }}
							>
								<TarjetaAlimentador
									nombre={alim.nombre}
									color={alim.color}
									onConfigClick={() => onAbrirConfiguracion(puestoId, alim)}
									topSide={lecturasAlim.parteSuperior}
									bottomSide={lecturasAlim.parteInferior}
									draggable={true}
									isDragging={elementoArrastrandoId === alim.id}
									onDragStart={() => onDragStart(alim.id)}
									onDragOver={onDragOver}
									onDrop={(e) => {
										e.preventDefault();
										onDrop(alim.id);
									}}
									onDragEnd={onDragEnd}
									mideRele={mideRele}
									mideAnalizador={mideAnalizador}
									periodoRele={alim.periodoSegundos || 60}
									periodoAnalizador={alim.analizador?.periodoSegundos || 60}
									timestampInicioRele={obtenerTimestampInicio(alim.id, "rele")}
									timestampInicioAnalizador={obtenerTimestampInicio(alim.id, "analizador")}
									contadorRele={obtenerContadorLecturas(alim.id, "rele")}
									contadorAnalizador={obtenerContadorLecturas(alim.id, "analizador")}
									// Polling de lecturas
									estaPolling={estaPolling ? estaPolling(alim.id) : false}
									puedePolling={puedeHacerPolling(alim)}
									onPlayStopClick={() => onPlayStopClick && onPlayStopClick(alim.id)}
									contadorPolling={obtenerContadorPolling ? obtenerContadorPolling(alim.id) : 0}
									periodoPolling={(alim.intervalo_consulta_ms || 60000) / 1000}
									errorPolling={obtenerErrorPolling ? obtenerErrorPolling(alim.id) : null}
								/>
							</div>
							{/* GapResizer a la derecha de cada tarjeta (elemento hermano independiente) */}
							{/* Usa el mismo marginTop que la tarjeta para alinearse verticalmente */}
							{!elementoArrastrandoId && !esModoMobile ? (
								<div style={{ marginTop: marginTop > 0 ? `${marginTop}px` : undefined }}>
									<GapResizer
										gap={gapTarjeta}
										onGapChange={(nuevoGap) => onGapChange(alim.id, nuevoGap)}
									/>
								</div>
							) : (
								<div className="gap-spacer" style={{ width: esModoMobile ? GAP_FIJO_MOBILE : gapTarjeta, marginTop: marginTop > 0 ? `${marginTop}px` : undefined }} />
							)}
						</React.Fragment>
					);
				})}

				{/* Skeleton card (se muestra mientras se guarda un nuevo alimentador) */}
				{skeletonCard && (() => {
					const marginTopSkeleton = obtenerMarginTop('nuevo-registrador');
					return (
						<React.Fragment>
							<div
								className="alim-card-wrapper"
								data-alim-id="skeleton"
								style={{ marginTop: marginTopSkeleton > 0 ? `${marginTopSkeleton}px` : undefined }}
							>
								{skeletonCard}
							</div>
							{/* Gap después del skeleton */}
							<div className="gap-spacer" style={{ width: esModoMobile ? GAP_FIJO_MOBILE : 10 }} />
						</React.Fragment>
					);
				})()}

				{/* Tarjeta "Nuevo Registrador" o zona de drop */}
				{(() => {
					const marginTopNuevo = obtenerMarginTop('nuevo-registrador');
					const styleNuevo = {
						width: 304, minWidth: 304, maxWidth: 304, height: 279, minHeight: 279,
						...(marginTopNuevo > 0 && { marginTop: `${marginTopNuevo}px` })
					};

					return elementoArrastrandoId ? (
						<div
							className="alim-card-add"
							style={styleNuevo}
							onDragOver={onDragOver}
							onDrop={(e) => {
								e.preventDefault();
								onDropAlFinal();
							}}
						>
							<span style={{ textAlign: "center", padding: "1rem" }}>
								Soltar aquí para mover al final
							</span>
						</div>
					) : (
						<div
							className="alim-card-add"
							style={styleNuevo}
							onClick={onAgregarNuevo}
						>
							<span className="alim-card-add-plus">+</span>
							<span className="alim-card-add-text">Nuevo Registrador</span>
						</div>
					);
				})()}

				{/* RowGapResizers posicionados absolutamente sobre los espacios entre filas - solo en desktop */}
				{!elementoArrastrandoId && !esModoMobile && posicionesEntreFilas.map((pos) => (
					<div
						key={`row-gap-${pos.filaIndex}`}
						className="row-gap-resizer-overlay"
						style={{ top: `${pos.top}px` }}
					>
						<RowGapResizer
							gap={obtenerRowGap(pos.filaIndex)}
							onGapChange={(nuevoGap) => onRowGapChange(pos.filaIndex, nuevoGap)}
							rowIndex={pos.filaIndex}
						/>
					</div>
				))}
			</div>
		</div>
	);
};

export default GrillaTarjetas;
