// src/paginas/PaginaAlimentadores/componentes/tarjetas/GrillaTarjetas.jsx

import React, { useRef, useEffect, useState, useCallback } from "react";
import TarjetaAlimentador from "./TarjetaAlimentador.jsx";
import GapResizer from "./GapResizer.jsx";
import RowGapResizer from "./RowGapResizer.jsx";
import "./GrillaTarjetas.css";

// Breakpoint para desactivar los controles de gap en móviles/tablets
const BREAKPOINT_MOBILE = 982;

// Gaps fijos para modo móvil
const GAP_FIJO_MOBILE = 10;
const ROW_GAP_FIJO_MOBILE = 20;

/**
 * Verifica si un alimentador tiene la configuración completa para hacer polling.
 * Requisitos:
 * - registrador_id definido
 * - intervalo_consulta_ms definido y > 0
 * - Al menos un box habilitado (enabled: true) con un índice válido en superior o inferior
 */
const puedeHacerPolling = (alim) => {
	// 1. Verificar registrador_id
	if (!alim.registrador_id) {
		return false;
	}

	// 2. Verificar intervalo_consulta_ms
	if (!alim.intervalo_consulta_ms || alim.intervalo_consulta_ms <= 0) {
		return false;
	}

	// 3. Verificar que haya al menos un box habilitado con índice válido
	const cardDesign = alim.card_design || {};
	const superior = cardDesign.superior || {};
	const inferior = cardDesign.inferior || {};

	const boxesSuperior = superior.boxes || [];
	const boxesInferior = inferior.boxes || [];

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

	return tieneBoxHabilitado(boxesSuperior) || tieneBoxHabilitado(boxesInferior);
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
	elementoArrastrandoId,
	onAbrirConfiguracion,
	onAbrirMapeo,
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
									onMapClick={() => onAbrirMapeo(puestoId, alim)}
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
