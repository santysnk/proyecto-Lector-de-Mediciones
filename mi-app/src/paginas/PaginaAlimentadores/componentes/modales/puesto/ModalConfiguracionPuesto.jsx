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
		// 1. Priorizar config_tarjeta (nueva estructura)
		const regIdConfigTarjeta = alim.config_tarjeta?.[zona]?.registrador_id;
		if (regIdConfigTarjeta) return regIdConfigTarjeta;

		// 2. Fallback: card_design (estructura antigua)
		const regIdCardDesign = alim.card_design?.[zona]?.registrador_id;
		if (regIdCardDesign) return regIdCardDesign;

		// 3. Fallback: usar registrador_id de la raíz (formato legacy)
		return alim.registrador_id || null;
	};

	if (!abierto || !puesto) return null;

	const alimentadores = puesto.alimentadores || [];

	// Helper para verificar si un alimentador puede hacer polling
	const puedeHacerPolling = (alim) => {
		if (!alim.intervalo_consulta_ms || alim.intervalo_consulta_ms <= 0) return false;

		// 1. Verificar config_tarjeta (nueva estructura) primero
		if (alim.config_tarjeta) {
			const configTarjeta = alim.config_tarjeta;
			const superiorConfig = configTarjeta.superior || {};
			const inferiorConfig = configTarjeta.inferior || {};

			const tieneRegistrador = !!superiorConfig.registrador_id || !!inferiorConfig.registrador_id;
			if (!tieneRegistrador) return false;

			// Verificar que al menos una zona tenga funcionalidad configurada
			const tieneFuncionalidadSuperior = superiorConfig.registrador_id && superiorConfig.funcionalidad_id;
			const tieneFuncionalidadInferior = inferiorConfig.registrador_id && inferiorConfig.funcionalidad_id;

			return tieneFuncionalidadSuperior || tieneFuncionalidadInferior;
		}

		// 2. Fallback: card_design (estructura antigua)
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

	// Obtener nombre del registrador para mostrar
	const obtenerInfoRegistrador = (alim, zona) => {
		const regId = obtenerRegistradorIdZona(alim, zona);
		if (!regId || !buscarRegistrador) return "Sin asignar";
		const reg = buscarRegistrador(regId);
		if (!reg) return "Sin asignar";

		// Solo mostrar el nombre del registrador
		return reg.nombre;
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
										{/* Header de la card: Nombre + Play + Período */}
										<div className="puesto-card__header">
											<span className="puesto-card__nombre">{alim.nombre}</span>
											<div className="puesto-card__header-right">
												<button
													type="button"
													className={`puesto-card__play-btn ${polling ? "puesto-card__play-btn--stop" : ""} ${!puedePolling ? "puesto-card__play-btn--disabled" : ""}`}
													onClick={() => puedePolling && onPlayStopClick?.(alim.id)}
													disabled={!puedePolling}
													title={!puedePolling ? "Configuración incompleta" : polling ? "Detener lectura" : "Iniciar lectura"}
												>
													{!puedePolling ? "⊘" : polling ? "⏹" : "▶"}
												</button>
												<span className="puesto-card__periodo-badge">
													{periodoSeg ? `${periodoSeg}s` : "-"}
												</span>
											</div>
										</div>

										{/* Contenido: Superior e Inferior lado a lado */}
										<div className="puesto-card__body">
											<div className="puesto-card__zonas">
												{/* Zona Superior */}
												<div className="puesto-card__zona">
													<span className="puesto-card__tipo-badge puesto-card__tipo-badge--superior">
														Superior
													</span>
													<span className="puesto-card__registrador" title={obtenerInfoRegistrador(alim, "superior")}>
														{obtenerInfoRegistrador(alim, "superior")}
													</span>
												</div>

												{/* Zona Inferior */}
												<div className="puesto-card__zona">
													<span className="puesto-card__tipo-badge puesto-card__tipo-badge--inferior">
														Inferior
													</span>
													<span className="puesto-card__registrador" title={obtenerInfoRegistrador(alim, "inferior")}>
														{obtenerInfoRegistrador(alim, "inferior")}
													</span>
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
