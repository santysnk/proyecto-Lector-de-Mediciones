// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfiguracionPuesto.jsx

import React, { useEffect, useState, useRef } from "react";
import "./ModalConfiguracionPuesto.css";
import { usarContextoAlimentadores } from "../../contexto/ContextoAlimentadoresSupabase";

/**
 * Modal de configuración global del puesto.
 * Los cambios se guardan automáticamente al editar los inputs.
 * El botón "Descartar cambios" restaura los valores al estado inicial.
 */
const ModalConfiguracionPuesto = ({
	abierto,
	puesto,
	onCerrar,
	onGuardar,
}) => {
	const { estaMidiendo, alternarMedicion, detenerMedicion } = usarContextoAlimentadores();

	// Snapshot del estado inicial al abrir el modal (para poder restaurar)
	const estadoInicialRef = useRef(null);
	// Estado de mediciones activas al abrir el modal
	const medicionesInicialesRef = useRef({});
	// Estado para mostrar el diálogo de confirmación
	const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

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
			return; // No iniciar arrastre si se hace clic en botones o inputs
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

	// Agregar/quitar listeners globales para el arrastre
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

	// Guardar snapshot al abrir el modal
	useEffect(() => {
		if (abierto && puesto) {
			// Guardar copia profunda del estado inicial
			estadoInicialRef.current = JSON.parse(JSON.stringify(puesto.alimentadores || []));

			// Guardar qué mediciones estaban activas al abrir
			const medicionesActivas = {};
			(puesto.alimentadores || []).forEach((alim) => {
				medicionesActivas[alim.id] = {
					rele: estaMidiendo(alim.id, "rele"),
					analizador: estaMidiendo(alim.id, "analizador"),
				};
			});
			medicionesInicialesRef.current = medicionesActivas;
		}
	}, [abierto, puesto?.id]); // Solo cuando se abre o cambia el puesto

	if (!abierto || !puesto) return null;

	// Helper para convertir alimentador edit a formato de guardado
	const convertirAlimentadorParaGuardar = (alimEdit, original) => {
		return {
			...original,
			id: alimEdit.id,
			nombre: alimEdit.nombre,
			color: alimEdit.color,
			periodoSegundos: alimEdit.relePeriodo ? Number(alimEdit.relePeriodo) : null,
			rele: {
				...original.rele,
				ip: alimEdit.releIp,
				puerto: alimEdit.relePuerto ? Number(alimEdit.relePuerto) : null,
				indiceInicial: alimEdit.releIndiceInicial ? Number(alimEdit.releIndiceInicial) : null,
				cantRegistros: alimEdit.releCantRegistros ? Number(alimEdit.releCantRegistros) : null,
			},
			analizador: {
				...original.analizador,
				ip: alimEdit.analizadorIp,
				puerto: alimEdit.analizadorPuerto ? Number(alimEdit.analizadorPuerto) : null,
				indiceInicial: alimEdit.analizadorIndiceInicial ? Number(alimEdit.analizadorIndiceInicial) : null,
				cantRegistros: alimEdit.analizadorCantRegistros ? Number(alimEdit.analizadorCantRegistros) : null,
				periodoSegundos: alimEdit.analizadorPeriodo ? Number(alimEdit.analizadorPeriodo) : null,
			},
		};
	};

	// Manejar cambio en un input - guarda automáticamente
	const handleChange = (alimId, campo, valor) => {
		const alimentador = puesto.alimentadores.find((a) => a.id === alimId);
		if (!alimentador) return;

		// Crear objeto con el formato de edición
		const alimEdit = {
			id: alimentador.id,
			nombre: alimentador.nombre || "",
			color: alimentador.color || "#22c55e",
			releIp: alimentador.rele?.ip || "",
			relePuerto: alimentador.rele?.puerto != null ? String(alimentador.rele.puerto) : "",
			releIndiceInicial: alimentador.rele?.indiceInicial != null ? String(alimentador.rele.indiceInicial) : "",
			releCantRegistros: alimentador.rele?.cantRegistros != null ? String(alimentador.rele.cantRegistros) : "",
			relePeriodo: alimentador.periodoSegundos != null ? String(alimentador.periodoSegundos) : "60",
			analizadorIp: alimentador.analizador?.ip || "",
			analizadorPuerto: alimentador.analizador?.puerto != null ? String(alimentador.analizador.puerto) : "",
			analizadorIndiceInicial: alimentador.analizador?.indiceInicial != null ? String(alimentador.analizador.indiceInicial) : "",
			analizadorCantRegistros: alimentador.analizador?.cantRegistros != null ? String(alimentador.analizador.cantRegistros) : "",
			analizadorPeriodo: alimentador.analizador?.periodoSegundos != null ? String(alimentador.analizador.periodoSegundos) : "60",
			// Aplicar el cambio
			[campo]: valor,
		};

		// Convertir y guardar
		const alimentadorActualizado = convertirAlimentadorParaGuardar(alimEdit, alimentador);

		// Crear lista actualizada
		const alimentadoresActualizados = puesto.alimentadores.map((a) =>
			a.id === alimId ? alimentadorActualizado : a
		);

		// Guardar automáticamente
		onGuardar(alimentadoresActualizados);
	};

	// Mostrar diálogo de confirmación para descartar
	const handleDescartar = () => {
		setMostrarConfirmacion(true);
	};

	// Confirmar descarte - restaurar al estado inicial y cerrar modal
	const confirmarDescartar = () => {
		if (!estadoInicialRef.current) return;

		// Detener todas las mediciones actuales
		(puesto.alimentadores || []).forEach((alim) => {
			if (estaMidiendo(alim.id, "rele")) {
				detenerMedicion(alim.id, "rele");
			}
			if (estaMidiendo(alim.id, "analizador")) {
				detenerMedicion(alim.id, "analizador");
			}
		});

		// Restaurar datos al estado inicial
		onGuardar(estadoInicialRef.current);

		// Restaurar mediciones que estaban activas al abrir
		// Usamos setTimeout para que primero se apliquen los datos restaurados
		setTimeout(() => {
			Object.entries(medicionesInicialesRef.current).forEach(([alimId, estados]) => {
				const alimentadorRestaurado = estadoInicialRef.current.find(
					(a) => a.id === Number(alimId)
				);
				if (alimentadorRestaurado) {
					if (estados.rele && alimentadorRestaurado.rele?.ip && alimentadorRestaurado.rele?.puerto) {
						alternarMedicion(alimentadorRestaurado, "rele");
					}
					if (estados.analizador && alimentadorRestaurado.analizador?.ip && alimentadorRestaurado.analizador?.puerto) {
						alternarMedicion(alimentadorRestaurado, "analizador");
					}
				}
			});
		}, 100);

		// Cerrar el diálogo de confirmación y el modal
		setMostrarConfirmacion(false);
		onCerrar();
	};

	// Cancelar el descarte - solo cerrar el diálogo de confirmación
	const cancelarDescartar = () => {
		setMostrarConfirmacion(false);
	};

	// Verificar si hay cambios respecto al estado inicial
	const hayCambios = () => {
		if (!estadoInicialRef.current) return false;
		return JSON.stringify(puesto.alimentadores) !== JSON.stringify(estadoInicialRef.current);
	};

	// ===== LÓGICA DEL BOTÓN MAESTRO GLOBAL (header) =====
	// Calcular estado global de todas las cards
	const calcularEstadoGlobal = () => {
		const alimentadores = puesto.alimentadores || [];

		// Recopilar info de cada alimentador
		const infoAlimentadores = alimentadores.map((alim) => {
			const releConfigValida = alim.rele?.ip?.trim() && alim.rele?.puerto;
			const analizadorConfigValida = alim.analizador?.ip?.trim() && alim.analizador?.puerto;
			const hayAlgunaConfigValida = releConfigValida || analizadorConfigValida;

			const releMidiendo = estaMidiendo(alim.id, "rele");
			const analizadorMidiendo = estaMidiendo(alim.id, "analizador");

			// Alguno de los disponibles está midiendo
			const algunoMidiendo = (releConfigValida && releMidiendo) || (analizadorConfigValida && analizadorMidiendo);

			return {
				alim,
				releConfigValida,
				analizadorConfigValida,
				hayAlgunaConfigValida,
				releMidiendo,
				analizadorMidiendo,
				algunoMidiendo,
			};
		});

		// Hay al menos una card con configuración válida?
		const hayAlgunaCardDisponible = infoAlimentadores.some((info) => info.hayAlgunaConfigValida);

		// Alguna card disponible está midiendo?
		const algunaCardMidiendo = infoAlimentadores.some((info) => info.hayAlgunaConfigValida && info.algunoMidiendo);

		return { infoAlimentadores, hayAlgunaCardDisponible, algunaCardMidiendo };
	};

	const { infoAlimentadores, hayAlgunaCardDisponible, algunaCardMidiendo } = calcularEstadoGlobal();

	const handleMaestroGlobal = () => {
		if (!hayAlgunaCardDisponible) return;

		if (algunaCardMidiendo) {
			// Parar todas las mediciones activas
			infoAlimentadores.forEach(({ alim, releMidiendo, analizadorMidiendo }) => {
				if (releMidiendo) {
					detenerMedicion(alim.id, "rele");
				}
				if (analizadorMidiendo) {
					detenerMedicion(alim.id, "analizador");
				}
			});
		} else {
			// Iniciar todas las mediciones disponibles
			infoAlimentadores.forEach(({ alim, releConfigValida, analizadorConfigValida, releMidiendo, analizadorMidiendo }) => {
				if (releConfigValida && !releMidiendo) {
					alternarMedicion(alim, "rele");
				}
				if (analizadorConfigValida && !analizadorMidiendo) {
					alternarMedicion(alim, "analizador");
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
				{/* Header - área de arrastre */}
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
							className={`puesto-card__master-btn ${algunaCardMidiendo ? "puesto-card__master-btn--stop" : ""} ${!hayAlgunaCardDisponible ? "puesto-card__master-btn--disabled" : ""}`}
							onClick={handleMaestroGlobal}
							disabled={!hayAlgunaCardDisponible}
							title={!hayAlgunaCardDisponible ? "Sin registradores con configuración válida" : algunaCardMidiendo ? "Detener todas las mediciones" : "Iniciar todas las mediciones"}
						>
							{!hayAlgunaCardDisponible ? "⊘" : algunaCardMidiendo ? "⏹" : "▶"}
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
					{(puesto.alimentadores || []).length === 0 ? (
						<p className="puesto-modal__empty">
							No hay registradores en este puesto.
						</p>
					) : (
						<div className="puesto-cards">
							{(puesto.alimentadores || []).map((alim) => (
								<div
									key={alim.id}
									className="puesto-card"
									style={{
										borderLeftColor: alim.color || "#22c55e",
										borderBottomColor: alim.color || "#22c55e",
									}}
								>
									{/* Nombre del alimentador + botón maestro */}
									<div className="puesto-card__header">
										<span className="puesto-card__nombre">{alim.nombre}</span>
										{(() => {
											const releConfigValida = alim.rele?.ip?.trim() && alim.rele?.puerto;
											const analizadorConfigValida = alim.analizador?.ip?.trim() && alim.analizador?.puerto;
											const hayAlgunaConfigValida = releConfigValida || analizadorConfigValida;

											const releMidiendo = estaMidiendo(alim.id, "rele");
											const analizadorMidiendo = estaMidiendo(alim.id, "analizador");

											// Está midiendo si al menos uno de los disponibles está midiendo
											const algunoMidiendo = (releConfigValida && releMidiendo) || (analizadorConfigValida && analizadorMidiendo);

											const handleMaestro = () => {
												if (!hayAlgunaConfigValida) return;

												if (algunoMidiendo) {
													// Parar todos los que están midiendo
													if (releMidiendo) {
														detenerMedicion(alim.id, "rele");
													}
													if (analizadorMidiendo) {
														detenerMedicion(alim.id, "analizador");
													}
												} else {
													// Iniciar todos los disponibles que no están midiendo
													if (releConfigValida && !releMidiendo) {
														alternarMedicion(alim, "rele");
													}
													if (analizadorConfigValida && !analizadorMidiendo) {
														alternarMedicion(alim, "analizador");
													}
												}
											};

											return (
												<button
													type="button"
													className={`puesto-card__master-btn-text ${algunoMidiendo ? "puesto-card__master-btn-text--stop" : ""} ${!hayAlgunaConfigValida ? "puesto-card__master-btn-text--disabled" : ""}`}
													onClick={handleMaestro}
													disabled={!hayAlgunaConfigValida}
													title={!hayAlgunaConfigValida ? "Sin configuración válida" : algunoMidiendo ? "Detener todas las mediciones" : "Iniciar todas las mediciones"}
												>
													{!hayAlgunaConfigValida ? "⊘" : algunoMidiendo ? "PARAR" : "INICIAR"}
												</button>
											);
										})()}
									</div>

									{/* Contenido de la card */}
									<div className="puesto-card__body">
										{/* Fila Relé */}
										<div className="puesto-card__row">
											<div className="puesto-card__field puesto-card__field--tipo">
												<label>&nbsp;</label>
												<input
													type="text"
													value="Relé"
													readOnly
													className="puesto-card__tipo-input puesto-card__tipo-input--rele"
												/>
											</div>
											<div className="puesto-card__fields">
												<div className="puesto-card__field puesto-card__field--ip">
													<label>IP</label>
													<input
														type="text"
														value={alim.rele?.ip || ""}
														onChange={(e) => handleChange(alim.id, "releIp", e.target.value)}
														placeholder="172.16.0.1"
													/>
												</div>
												<div className="puesto-card__field puesto-card__field--small">
													<label>Puerto</label>
													<input
														type="number"
														value={alim.rele?.puerto != null ? alim.rele.puerto : ""}
														onChange={(e) => handleChange(alim.id, "relePuerto", e.target.value)}
														placeholder="502"
													/>
												</div>
												<div className="puesto-card__field puesto-card__field--small">
													<label>Índice</label>
													<input
														type="number"
														value={alim.rele?.indiceInicial != null ? alim.rele.indiceInicial : ""}
														onChange={(e) => handleChange(alim.id, "releIndiceInicial", e.target.value)}
														placeholder="0"
													/>
												</div>
												<div className="puesto-card__field puesto-card__field--small">
													<label>C. Reg.</label>
													<input
														type="number"
														value={alim.rele?.cantRegistros != null ? alim.rele.cantRegistros : ""}
														onChange={(e) => handleChange(alim.id, "releCantRegistros", e.target.value)}
														placeholder="10"
													/>
												</div>
												<div className="puesto-card__field puesto-card__field--small">
													<label>Período (s)</label>
													<input
														type="number"
														value={alim.periodoSegundos != null ? alim.periodoSegundos : ""}
														onChange={(e) => handleChange(alim.id, "relePeriodo", e.target.value)}
														placeholder="60"
													/>
												</div>
												<div className="puesto-card__field puesto-card__field--action">
													<label>&nbsp;</label>
													{(() => {
														const releConfigValida = alim.rele?.ip?.trim() && alim.rele?.puerto;
														const midiendo = estaMidiendo(alim.id, "rele");
														const deshabilitado = !releConfigValida;

														return (
															<button
																type="button"
																className={`puesto-card__play-btn ${midiendo ? "puesto-card__play-btn--stop" : ""} ${deshabilitado ? "puesto-card__play-btn--disabled" : ""}`}
																onClick={() => {
																	if (!deshabilitado) {
																		alternarMedicion(alim, "rele");
																	}
																}}
																disabled={deshabilitado}
																title={deshabilitado ? "Configuración incompleta (IP/Puerto)" : midiendo ? "Detener medición" : "Iniciar medición"}
															>
																{deshabilitado ? "⊘" : midiendo ? "⏹" : "▶"}
															</button>
														);
													})()}
												</div>
											</div>
										</div>

										{/* Fila Analizador */}
										<div className="puesto-card__row">
											<div className="puesto-card__field puesto-card__field--tipo">
												<input
													type="text"
													value="Analizador"
													readOnly
													className="puesto-card__tipo-input puesto-card__tipo-input--analizador"
												/>
											</div>
											<div className="puesto-card__fields">
												<div className="puesto-card__field puesto-card__field--ip">
													<input
														type="text"
														value={alim.analizador?.ip || ""}
														onChange={(e) => handleChange(alim.id, "analizadorIp", e.target.value)}
														placeholder="172.16.0.5"
													/>
												</div>
												<div className="puesto-card__field puesto-card__field--small">
													<input
														type="number"
														value={alim.analizador?.puerto != null ? alim.analizador.puerto : ""}
														onChange={(e) => handleChange(alim.id, "analizadorPuerto", e.target.value)}
														placeholder="502"
													/>
												</div>
												<div className="puesto-card__field puesto-card__field--small">
													<input
														type="number"
														value={alim.analizador?.indiceInicial != null ? alim.analizador.indiceInicial : ""}
														onChange={(e) => handleChange(alim.id, "analizadorIndiceInicial", e.target.value)}
														placeholder="0"
													/>
												</div>
												<div className="puesto-card__field puesto-card__field--small">
													<input
														type="number"
														value={alim.analizador?.cantRegistros != null ? alim.analizador.cantRegistros : ""}
														onChange={(e) => handleChange(alim.id, "analizadorCantRegistros", e.target.value)}
														placeholder="10"
													/>
												</div>
												<div className="puesto-card__field puesto-card__field--small">
													<input
														type="number"
														value={alim.analizador?.periodoSegundos != null ? alim.analizador.periodoSegundos : ""}
														onChange={(e) => handleChange(alim.id, "analizadorPeriodo", e.target.value)}
														placeholder="60"
													/>
												</div>
												<div className="puesto-card__field puesto-card__field--action">
													{(() => {
														const analizadorConfigValida = alim.analizador?.ip?.trim() && alim.analizador?.puerto;
														const midiendo = estaMidiendo(alim.id, "analizador");
														const deshabilitado = !analizadorConfigValida;

														return (
															<button
																type="button"
																className={`puesto-card__play-btn ${midiendo ? "puesto-card__play-btn--stop" : ""} ${deshabilitado ? "puesto-card__play-btn--disabled" : ""}`}
																onClick={() => {
																	if (!deshabilitado) {
																		alternarMedicion(alim, "analizador");
																	}
																}}
																disabled={deshabilitado}
																title={deshabilitado ? "Configuración incompleta (IP/Puerto)" : midiendo ? "Detener medición" : "Iniciar medición"}
															>
																{deshabilitado ? "⊘" : midiendo ? "⏹" : "▶"}
															</button>
														);
													})()}
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="puesto-modal__footer">
					<button
						type="button"
						className={`puesto-modal__btn puesto-modal__btn--descartar ${!hayCambios() ? "puesto-modal__btn--disabled" : ""}`}
						onClick={handleDescartar}
						disabled={!hayCambios()}
					>
						Descartar cambios
					</button>
					<button
						type="button"
						className="puesto-modal__btn puesto-modal__btn--cancelar"
						onClick={onCerrar}
					>
						Cerrar
					</button>
				</div>
			</div>

			{/* Diálogo de confirmación */}
			{mostrarConfirmacion && (
				<div className="puesto-confirmacion-overlay" onClick={cancelarDescartar}>
					<div className="puesto-confirmacion" onClick={(e) => e.stopPropagation()}>
						<div className="puesto-confirmacion__icono">⚠️</div>
						<h3 className="puesto-confirmacion__titulo">¿Descartar cambios?</h3>
						<p className="puesto-confirmacion__mensaje">
							Todos los cambios realizados se perderán y se restaurarán los valores iniciales.
						</p>
						<div className="puesto-confirmacion__botones">
							<button
								type="button"
								className="puesto-confirmacion__btn puesto-confirmacion__btn--cancelar"
								onClick={cancelarDescartar}
							>
								Cancelar
							</button>
							<button
								type="button"
								className="puesto-confirmacion__btn puesto-confirmacion__btn--aceptar"
								onClick={confirmarDescartar}
							>
								Aceptar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ModalConfiguracionPuesto;
