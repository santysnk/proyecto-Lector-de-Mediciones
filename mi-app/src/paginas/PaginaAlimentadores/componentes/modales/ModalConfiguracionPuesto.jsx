// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfiguracionPuesto.jsx

import React, { useEffect, useState, useRef } from "react";
import "./ModalConfiguracionPuesto.css";

/**
 * Modal de vista rápida del puesto.
 * Muestra el estado de cada alimentador con sus registradores asignados (solo lectura).
 * Permite controlar el polling de cada card y de todo el puesto.
 */
const ModalConfiguracionPuesto = ({
	abierto,
	puesto,
	onCerrar,
	// Polling
	estaPolling,              // (alimId) => boolean
	onPlayStopClick,          // (alimId) => void - alterna polling de un alimentador
	// Para obtener nombres de registradores
	buscarRegistrador,        // (regId) => registrador | null
}) => {
	// Estado para arrastrar el modal
	const [posicion, setPosicion] = useState({ x: 0, y: 0 });
	const [arrastrando, setArrastrando] = useState(false);
	const offsetRef = useRef({ x: 0, y: 0 });
	const modalRef = useRef(null);

	// Resetear posición al abrir el modal
	useEffect(() => {
		if (abierto) {
			setPosicion({ x: 0, y: 0 });
		}
	}, [abierto]);

	// Manejadores de arrastre
	const handleMouseDown = (e) => {
		if (e.target.closest('.puesto-modal__close') || e.target.closest('input') || e.target.closest('button')) {
			return;
		}
		setArrastrando(true);
		offsetRef.current = {
			x: e.clientX - posicion.x,
			y: e.clientY - posicion.y,
		};
	};

	const handleMouseMove = (e) => {
		if (!arrastrando) return;
		setPosicion({
			x: e.clientX - offsetRef.current.x,
			y: e.clientY - offsetRef.current.y,
		});
	};

	const handleMouseUp = () => {
		setArrastrando(false);
	};

	useEffect(() => {
		if (arrastrando) {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
		}
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [arrastrando]);

	// Helper para obtener registrador_id de una zona (con compatibilidad legacy)
	const obtenerRegistradorIdZona = (alim, zona) => {
		// Primero intentar obtener de card_design
		const regIdZona = alim.card_design?.[zona]?.registrador_id;
		if (regIdZona) return regIdZona;

		// Fallback: usar registrador_id de la raíz (formato legacy)
		return alim.registrador_id || null;
	};

	if (!abierto || !puesto) return null;

	const alimentadores = puesto.alimentadores || [];

	// Helper para verificar si un alimentador puede hacer polling
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

	// Obtener información completa del registrador para mostrar
	const obtenerInfoRegistrador = (alim, zona) => {
		const regId = obtenerRegistradorIdZona(alim, zona);
		if (!regId || !buscarRegistrador) return "Sin asignar";
		const reg = buscarRegistrador(regId);
		if (!reg) return "Sin asignar";

		// Formato: "Nombre (Agente) - IP:Puerto | Reg: inicio-fin"
		const rangoFin = reg.indice_inicial + (reg.cantidad_registros || 1) - 1;
		return `${reg.nombre} - ${reg.ip}:${reg.puerto} | Reg: ${reg.indice_inicial}-${rangoFin}`;
	};

	// ===== BOTÓN MAESTRO GLOBAL =====
	const alimentadoresConPolling = alimentadores.filter(puedeHacerPolling);
	const hayAlgunoPolling = alimentadoresConPolling.some((alim) => estaPolling?.(alim.id));
	const hayAlgunaCardDisponible = alimentadoresConPolling.length > 0;

	const handleMaestroGlobal = () => {
		if (!hayAlgunaCardDisponible) return;

		if (hayAlgunoPolling) {
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
		<div className="puesto-modal-overlay">
			<div
				ref={modalRef}
				className={`puesto-modal ${arrastrando ? 'puesto-modal--arrastrando' : ''}`}
				style={{
					transform: `translate(${posicion.x}px, ${posicion.y}px)`,
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					className="puesto-modal__header"
					onMouseDown={handleMouseDown}
					style={{ cursor: 'move' }}
				>
					<h2 className="puesto-modal__title">
						Configuración del Puesto: {puesto?.nombre || ""}
					</h2>
					<div className="puesto-modal__header-actions">
						{/* Botón maestro global */}
						<button
							type="button"
							className={`puesto-card__master-btn ${hayAlgunoPolling ? "puesto-card__master-btn--stop" : ""} ${!hayAlgunaCardDisponible ? "puesto-card__master-btn--disabled" : ""}`}
							onClick={handleMaestroGlobal}
							disabled={!hayAlgunaCardDisponible}
							title={!hayAlgunaCardDisponible ? "Sin alimentadores con configuración válida" : hayAlgunoPolling ? "Detener todas las lecturas" : "Iniciar todas las lecturas"}
						>
							{!hayAlgunaCardDisponible ? "⊘" : hayAlgunoPolling ? "⏹" : "▶"}
						</button>
						<button
							type="button"
							className="puesto-modal__close"
							onClick={onCerrar}
							aria-label="Cerrar"
						>
							×
						</button>
					</div>
				</div>

				{/* Contenido */}
				<div
					className="puesto-modal__content"
					style={{ backgroundColor: puesto?.bgColor || "#1e293b" }}
				>
					{alimentadores.length === 0 ? (
						<p className="puesto-modal__empty">
							No hay alimentadores en este puesto.
						</p>
					) : (
						<div className="puesto-cards">
							{alimentadores.map((alim) => {
								const periodoSeg = alim.intervalo_consulta_ms
									? Math.round(alim.intervalo_consulta_ms / 1000)
									: null;
								const puedePolling = puedeHacerPolling(alim);
								const polling = estaPolling?.(alim.id);

								return (
									<div
										key={alim.id}
										className="puesto-card"
										style={{
											borderLeftColor: alim.color || "#22c55e",
											borderBottomColor: alim.color || "#22c55e",
										}}
									>
										{/* Header de la card */}
										<div className="puesto-card__header">
											<span className="puesto-card__nombre">{alim.nombre}</span>
											<button
												type="button"
												className={`puesto-card__play-btn ${polling ? "puesto-card__play-btn--stop" : ""} ${!puedePolling ? "puesto-card__play-btn--disabled" : ""}`}
												onClick={() => puedePolling && onPlayStopClick?.(alim.id)}
												disabled={!puedePolling}
												title={!puedePolling ? "Configuración incompleta" : polling ? "Detener lectura" : "Iniciar lectura"}
											>
												{!puedePolling ? "⊘" : polling ? "⏹" : "▶"}
											</button>
										</div>

										{/* Contenido de la card */}
										<div className="puesto-card__body">
											{/* Fila Superior */}
											<div className="puesto-card__row">
												<div className="puesto-card__field puesto-card__field--tipo">
													<label>&nbsp;</label>
													<span className="puesto-card__tipo-badge puesto-card__tipo-badge--superior">
														Superior
													</span>
												</div>
												<div className="puesto-card__fields">
													<div className="puesto-card__field puesto-card__field--registrador">
														<label>Registrador</label>
														<input
															type="text"
															value={obtenerInfoRegistrador(alim, "superior")}
															readOnly
															className="puesto-card__input--readonly"
															title={obtenerInfoRegistrador(alim, "superior")}
														/>
													</div>
													<div className="puesto-card__field puesto-card__field--periodo">
														<label>Período (s)</label>
														<input
															type="text"
															value={periodoSeg ?? "-"}
															readOnly
															className="puesto-card__input--readonly"
														/>
													</div>
												</div>
											</div>

											{/* Fila Inferior */}
											<div className="puesto-card__row">
												<div className="puesto-card__field puesto-card__field--tipo">
													<span className="puesto-card__tipo-badge puesto-card__tipo-badge--inferior">
														Inferior
													</span>
												</div>
												<div className="puesto-card__fields">
													<div className="puesto-card__field puesto-card__field--registrador">
														<input
															type="text"
															value={obtenerInfoRegistrador(alim, "inferior")}
															readOnly
															className="puesto-card__input--readonly"
															title={obtenerInfoRegistrador(alim, "inferior")}
														/>
													</div>
													<div className="puesto-card__field puesto-card__field--periodo">
														<input
															type="text"
															value={periodoSeg ?? "-"}
															readOnly
															className="puesto-card__input--readonly"
														/>
													</div>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="puesto-modal__footer">
					<button
						type="button"
						className="puesto-modal__btn puesto-modal__btn--cerrar"
						onClick={onCerrar}
					>
						Cerrar
					</button>
				</div>
			</div>
		</div>
	);
};

export default ModalConfiguracionPuesto;
