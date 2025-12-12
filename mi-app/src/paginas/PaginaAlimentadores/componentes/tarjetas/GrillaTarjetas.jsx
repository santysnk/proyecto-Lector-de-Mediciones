// src/paginas/PaginaAlimentadores/componentes/tarjetas/GrillaTarjetas.jsx

import React, { useRef, useEffect, useState, useCallback } from "react";
import TarjetaAlimentador from "./TarjetaAlimentador.jsx";
import GapResizer from "./GapResizer.jsx";
import RowGapResizer from "./RowGapResizer.jsx";
import "./GrillaTarjetas.css";

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

	// Detectar las posiciones entre filas y manejar gaps de tarjetas que cambian de fila
	const detectarFilasYFinales = useCallback(() => {
		if (!gridRef.current) return;

		const nuevasPosiciones = [];
		const nuevasFilasPorTarjeta = {};
		let ultimoTop = null;
		let ultimoBottom = null;
		let filaIndex = 0;

		// Incluir todos los wrappers de alimentadores y la tarjeta "Nuevo Registrador"
		const tarjetas = Array.from(gridRef.current.querySelectorAll('.alim-card-wrapper, .alim-card-add'));
		const gridRect = gridRef.current.getBoundingClientRect();

		tarjetas.forEach((wrapper) => {
			const alimId = wrapper.dataset.alimId || 'nuevo-registrador';
			const rect = wrapper.getBoundingClientRect();

			// Detectar cambio de fila comparando posición vertical
			if (ultimoTop !== null && Math.abs(rect.top - ultimoTop) > 10) {
				// Guardar la posición Y entre filas (relativa al grid)
				const posY = ultimoBottom - gridRect.top;
				nuevasPosiciones.push({
					filaIndex: filaIndex + 1,
					top: posY
				});
				filaIndex++;
			}

			// Guardar en qué fila está cada tarjeta
			nuevasFilasPorTarjeta[alimId] = filaIndex;

			ultimoTop = rect.top;
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

	// Calcular el row-gap general (usamos el de fila 1)
	const rowGapGeneral = obtenerRowGap(1);

	return (
		<div className="grilla-con-row-gaps">
			{/* RowGapResizer para la primera fila (separación del menú) */}
			{!elementoArrastrandoId && (
				<RowGapResizer
					gap={obtenerRowGap(0)}
					onGapChange={(nuevoGap) => onRowGapChange(0, nuevoGap)}
					rowIndex={0}
				/>
			)}
			{elementoArrastrandoId && (
				<div style={{ height: obtenerRowGap(0) }} />
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
				style={{ rowGap: `${rowGapGeneral}px` }}
			>
				{alimentadores.map((alim) => {
					const lecturasAlim = lecturas[alim.id] || {};
					const mideRele = estaMidiendo(alim.id, "rele");
					const mideAnalizador = estaMidiendo(alim.id, "analizador");
					const gapTarjeta = obtenerGap(alim.id);

					return (
						<div
							key={alim.id}
							className="alim-card-wrapper"
							data-alim-id={alim.id}
							style={{ display: 'flex', alignItems: 'stretch' }}
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
							/>
							{/* Siempre mostrar GapResizer o spacer fijo */}
							{!elementoArrastrandoId ? (
								<GapResizer
									gap={gapTarjeta}
									onGapChange={(nuevoGap) => onGapChange(alim.id, nuevoGap)}
								/>
							) : (
								<div style={{ width: gapTarjeta }} />
							)}
						</div>
					);
				})}

				{/* Tarjeta "Nuevo Registrador" o zona de drop */}
				{elementoArrastrandoId ? (
					<div
						className="alim-card-add"
						style={{ width: 304, minWidth: 304, maxWidth: 304, height: 279, minHeight: 279 }}
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
						style={{ width: 304, minWidth: 304, maxWidth: 304, height: 279, minHeight: 279 }}
						onClick={onAgregarNuevo}
					>
						<span className="alim-card-add-plus">+</span>
						<span className="alim-card-add-text">Nuevo Registrador</span>
					</div>
				)}

				{/* RowGapResizers posicionados absolutamente sobre los espacios entre filas */}
				{!elementoArrastrandoId && posicionesEntreFilas.map((pos) => (
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
