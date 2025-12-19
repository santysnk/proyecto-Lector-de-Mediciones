// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfiguracionAlimentador.jsx
// Modal unificado para configurar alimentador: nombre, color, registrador y diseño de card

import { useEffect, useState, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import "./ModalConfiguracionAlimentador.css";
import "./ColorPickerSimple.css";
import { COLORES_SISTEMA } from "../../constantes/colores";
import {
	listarAgentesWorkspace,
	listarRegistradoresAgente,
} from "../../../../servicios/apiService";

// Opciones predefinidas para el título del bloque (magnitudes típicas)
const OPCIONES_TITULO = [
	{ id: "tension_linea", label: "Tensión de línea (kV)" },
	{ id: "tension_entre_lineas", label: "Tensión entre líneas (kV)" },
	{ id: "corriente_132", label: "Corriente de línea (A) (en 13,2 kV)" },
	{ id: "corriente_33", label: "Corriente de línea (A) (en 33 kV)" },
	{ id: "potencia_activa", label: "Potencia activa (kW)" },
	{ id: "potencia_reactiva", label: "Potencia reactiva (kVAr)" },
	{ id: "potencia_aparente", label: "Potencia aparente (kVA)" },
	{ id: "factor_potencia", label: "Factor de Potencia" },
	{ id: "frecuencia", label: "Frecuencia (Hz)" },
	{ id: "corriente_neutro", label: "Corriente de Neutro (A)" },
	{ id: "custom", label: "Otro (personalizado)..." },
];

// Placeholders sugeridos para las etiquetas de cada box
const PLACEHOLDERS_BOX = ["Ej: R o L1", "Ej: S o L2", "Ej: T o L3", "Ej: Total"];

// Diseño por defecto para un lado de la card
const crearSideDesignDefault = (tituloId = "corriente_132") => ({
	tituloId,
	tituloCustom: "",
	cantidad: 3,
	boxes: [
		{ enabled: false, label: "", indice: null, formula: "" },
		{ enabled: false, label: "", indice: null, formula: "" },
		{ enabled: false, label: "", indice: null, formula: "" },
		{ enabled: false, label: "", indice: null, formula: "" },
	],
});

// Diseño por defecto para toda la card
const crearCardDesignDefault = () => ({
	superior: crearSideDesignDefault("corriente_132"),
	inferior: crearSideDesignDefault("tension_linea"),
});

const ModalConfiguracionAlimentador = ({
	abierto,
	puestoNombre,
	workspaceId,
	modo = "crear",
	initialData,
	onCancelar,
	onConfirmar,
	onEliminar,
}) => {
	// === Estado básico ===
	const [nombre, setNombre] = useState("");
	const [color, setColor] = useState(COLORES_SISTEMA[0]);
	const [mostrarPicker, setMostrarPicker] = useState(false);
	const [colorPersonalizado, setColorPersonalizado] = useState("#ff6b6b");
	const [valorHex, setValorHex] = useState("#ff6b6b");
	const pickerRef = useRef(null);
	const pickerBtnRef = useRef(null);

	// === Estado de registrador ===
	const [agentesVinculados, setAgentesVinculados] = useState([]);
	const [registradoresPorAgente, setRegistradoresPorAgente] = useState({});
	const [registradorSeleccionado, setRegistradorSeleccionado] = useState(null);
	const [cargandoAgentes, setCargandoAgentes] = useState(false);

	// === Estado de configuración ===
	const [intervaloConsultaSeg, setIntervaloConsultaSeg] = useState(60); // en segundos (default 60, mínimo 5)
	const [cardDesign, setCardDesign] = useState(crearCardDesignDefault());

	// === Helpers ===
	const esColorPersonalizado = !COLORES_SISTEMA.includes(color);

	// === Detección de índices duplicados ===
	const detectarIndicesDuplicados = () => {
		const indicesUsados = [];
		const duplicados = [];

		// Recolectar índices de parte superior
		const boxesSuperior = cardDesign.superior?.boxes || [];
		boxesSuperior.forEach((box, idx) => {
			if (box.indice !== null && box.indice !== undefined && box.indice !== "") {
				const clave = String(box.indice);
				const info = { zona: "superior", boxNum: idx + 1, indice: box.indice };

				const existente = indicesUsados.find((r) => r.clave === clave);
				if (existente) {
					duplicados.push({ ...info, duplicadoCon: existente.info });
				} else {
					indicesUsados.push({ clave, info });
				}
			}
		});

		// Recolectar índices de parte inferior
		const boxesInferior = cardDesign.inferior?.boxes || [];
		boxesInferior.forEach((box, idx) => {
			if (box.indice !== null && box.indice !== undefined && box.indice !== "") {
				const clave = String(box.indice);
				const info = { zona: "inferior", boxNum: idx + 1, indice: box.indice };

				const existente = indicesUsados.find((r) => r.clave === clave);
				if (existente) {
					duplicados.push({ ...info, duplicadoCon: existente.info });
				} else {
					indicesUsados.push({ clave, info });
				}
			}
		});

		return duplicados;
	};

	const indicesDuplicados = detectarIndicesDuplicados();

	// Crear set de claves duplicadas
	const clavesDuplicadas = new Set();
	indicesDuplicados.forEach((dup) => {
		clavesDuplicadas.add(`${dup.zona}-${dup.boxNum - 1}-${dup.indice}`);
		clavesDuplicadas.add(`${dup.duplicadoCon.zona}-${dup.duplicadoCon.boxNum - 1}-${dup.duplicadoCon.indice}`);
	});

	// Verificar si un índice específico está duplicado
	const estaIndiceDuplicado = (zona, index, indice) => {
		if (indice === null || indice === undefined || indice === "") return false;
		const clave = `${zona}-${index}-${indice}`;
		return clavesDuplicadas.has(clave);
	};

	// Obtener mensaje de duplicado para tooltip
	const obtenerMensajeDuplicado = (zona, index, indice) => {
		if (indice === null || indice === undefined || indice === "") return "";
		const dup = indicesDuplicados.find(
			(d) => d.zona === zona && d.boxNum === index + 1 && d.indice === indice
		);
		if (dup) {
			return `Este índice ya está usado en ${dup.duplicadoCon.zona === "superior" ? "Parte superior" : "Parte inferior"} Box ${dup.duplicadoCon.boxNum}`;
		}
		// También puede ser el índice original que tiene duplicados
		const original = indicesDuplicados.find(
			(d) => d.duplicadoCon.zona === zona && d.duplicadoCon.boxNum === index + 1 && d.duplicadoCon.indice === indice
		);
		if (original) {
			return `Este índice también se usa en ${original.zona === "superior" ? "Parte superior" : "Parte inferior"} Box ${original.boxNum}`;
		}
		return "";
	};

	// Generar índices arrastrables del registrador seleccionado
	const indicesRegistrador = registradorSeleccionado
		? Array.from(
				{ length: registradorSeleccionado.cantidad_registros },
				(_, i) => registradorSeleccionado.indice_inicial + i
		  )
		: [];

	// === Cargar agentes vinculados ===
	useEffect(() => {
		if (!abierto || !workspaceId) return;

		const cargarAgentes = async () => {
			setCargandoAgentes(true);
			try {
				const agentes = await listarAgentesWorkspace(workspaceId);
				setAgentesVinculados(agentes || []);

				// Cargar registradores de cada agente
				const registradoresMap = {};
				for (const agente of agentes || []) {
					try {
						const regs = await listarRegistradoresAgente(agente.id);
						registradoresMap[agente.id] = regs || [];
					} catch (err) {
						console.error(`Error cargando registradores del agente ${agente.id}:`, err);
						registradoresMap[agente.id] = [];
					}
				}
				setRegistradoresPorAgente(registradoresMap);
			} catch (err) {
				console.error("Error cargando agentes:", err);
			} finally {
				setCargandoAgentes(false);
			}
		};

		cargarAgentes();
	}, [abierto, workspaceId]);

	// === Cargar datos iniciales ===
	useEffect(() => {
		if (!abierto) return;

		if (initialData) {
			setNombre(initialData.nombre || "");
			setColor(initialData.color || COLORES_SISTEMA[0]);
			// Convertir ms a segundos para la UI
			const intervaloMs = initialData.intervalo_consulta_ms || 60000;
			setIntervaloConsultaSeg(Math.max(5, Math.round(intervaloMs / 1000)));
			setCardDesign(initialData.card_design || crearCardDesignDefault());

			// Buscar registrador seleccionado si existe
			if (initialData.registrador_id) {
				// Se buscará cuando se carguen los registradores
				setTimeout(() => {
					for (const agente of agentesVinculados) {
						const regs = registradoresPorAgente[agente.id] || [];
						const reg = regs.find((r) => r.id === initialData.registrador_id);
						if (reg) {
							setRegistradorSeleccionado(reg);
							break;
						}
					}
				}, 500);
			}
		} else {
			setNombre("");
			setColor(COLORES_SISTEMA[0]);
			setIntervaloConsultaSeg(60); // default 60 segundos
			setCardDesign(crearCardDesignDefault());
			setRegistradorSeleccionado(null);
		}
	}, [abierto, initialData]);

	// === Handlers color ===
	const handleHexInputChange = (e) => {
		const valor = e.target.value;
		setValorHex(valor);
		if (/^#[0-9A-Fa-f]{6}$/.test(valor)) {
			setColor(valor);
			setColorPersonalizado(valor);
		}
	};

	const copiarColor = () => {
		const colorActual = esColorPersonalizado ? color : colorPersonalizado;
		navigator.clipboard.writeText(colorActual);
	};

	// Cerrar picker al hacer click fuera
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				pickerRef.current &&
				!pickerRef.current.contains(event.target) &&
				pickerBtnRef.current &&
				!pickerBtnRef.current.contains(event.target)
			) {
				setMostrarPicker(false);
			}
		};

		if (mostrarPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [mostrarPicker]);

	// === Handlers registrador ===
	const handleSeleccionarRegistrador = (e) => {
		const regId = e.target.value;
		if (!regId) {
			setRegistradorSeleccionado(null);
			return;
		}

		// Buscar el registrador
		for (const agente of agentesVinculados) {
			const regs = registradoresPorAgente[agente.id] || [];
			const reg = regs.find((r) => r.id === regId);
			if (reg) {
				setRegistradorSeleccionado(reg);
				return;
			}
		}
	};

	// === Handlers card design ===
	const actualizarSide = (zona, campo, valor) => {
		setCardDesign((prev) => ({
			...prev,
			[zona]: {
				...prev[zona],
				[campo]: valor,
			},
		}));
	};

	const actualizarBox = (zona, index, campo, valor) => {
		setCardDesign((prev) => {
			const newBoxes = [...prev[zona].boxes];
			newBoxes[index] = { ...newBoxes[index], [campo]: valor };
			return {
				...prev,
				[zona]: {
					...prev[zona],
					boxes: newBoxes,
				},
			};
		});
	};

	// === Drag & Drop ===
	const handleDragStart = (e, indice) => {
		e.dataTransfer.setData("text/plain", String(indice));
		e.dataTransfer.effectAllowed = "copy";
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	};

	const handleDrop = (e, zona, boxIndex) => {
		e.preventDefault();
		const indice = parseInt(e.dataTransfer.getData("text/plain"), 10);
		if (!isNaN(indice)) {
			actualizarBox(zona, boxIndex, "indice", indice);
		}
	};

	// === Submit ===
	const handleSubmit = (e) => {
		e.preventDefault();
		const limpioNombre = nombre.trim();
		if (!limpioNombre) return;

		onConfirmar({
			nombre: limpioNombre,
			color,
			registrador_id: registradorSeleccionado?.id || null,
			intervalo_consulta_ms: intervaloConsultaSeg * 1000, // convertir a ms para guardar
			card_design: cardDesign,
		});
	};

	const handleEliminarClick = () => {
		if (!onEliminar) return;
		const seguro = window.confirm("¿Seguro que querés eliminar este alimentador?");
		if (seguro) {
			onEliminar();
		}
	};

	if (!abierto) return null;

	// Agrupar todos los registradores para el combobox
	const todosRegistradores = [];
	for (const agente of agentesVinculados) {
		const regs = registradoresPorAgente[agente.id] || [];
		for (const reg of regs) {
			todosRegistradores.push({ ...reg, agenteNombre: agente.nombre });
		}
	}

	return (
		<div className="alim-modal-overlay">
			<div className="alim-modal alim-modal--grande">
				<h2>
					{modo === "editar" ? "Editar alimentador" : "Nuevo alimentador"}
					{puestoNombre && `: ${puestoNombre}`}
				</h2>

				<form onSubmit={handleSubmit}>
					<div className="alim-modal-content">
						{/* === SECCIÓN: Nombre y Color === */}
						<div className="alim-modal-seccion">
							<div className="alim-modal-campo">
								<label>Nombre del Alimentador</label>
								<input
									id="nombre-alimentador"
									type="text"
									className="alim-modal-input"
									value={nombre}
									onChange={(e) => setNombre(e.target.value)}
									placeholder="Ej: ALIMENTADOR 1"
									required
									autoComplete="off"
									autoCorrect="off"
									spellCheck={false}
									autoFocus
								/>
							</div>

							<div className="alim-color-grid">
								{COLORES_SISTEMA.map((c) => (
									<button
										key={c}
										type="button"
										className={`alim-color-swatch ${
											color === c ? "alim-color-swatch-selected" : ""
										}`}
										style={{ backgroundColor: c }}
										onClick={() => {
											setColor(c);
											setMostrarPicker(false);
										}}
										aria-label={`Elegir color ${c}`}
									/>
								))}
								{/* Botón color personalizado */}
								<button
									ref={pickerBtnRef}
									type="button"
									className={`alim-color-swatch alim-color-custom ${
										esColorPersonalizado ? "alim-color-swatch-selected" : ""
									}`}
									onClick={() => {
										setMostrarPicker(!mostrarPicker);
										if (!mostrarPicker) {
											setValorHex(esColorPersonalizado ? color : colorPersonalizado);
										}
									}}
									aria-label="Color personalizado"
								/>
							</div>
							{/* Picker flotante */}
							{mostrarPicker && (
								<div
									ref={pickerRef}
									className="color-picker-simple-popover alim-color-picker-popover"
								>
									<HexColorPicker
										color={esColorPersonalizado ? color : colorPersonalizado}
										onChange={(nuevoColor) => {
											setColor(nuevoColor);
											setColorPersonalizado(nuevoColor);
											setValorHex(nuevoColor);
										}}
									/>
									<div className="color-picker-hex-input-wrapper">
										<input
											type="text"
											value={valorHex}
											onChange={handleHexInputChange}
											className="color-picker-hex-input"
											placeholder="#000000"
											maxLength={7}
										/>
										<button
											type="button"
											className="color-picker-copy-btn"
											onClick={copiarColor}
											title="Copiar color"
										>
											📋
										</button>
									</div>
								</div>
							)}
						</div>

						{/* === SECCIÓN: Vinculación con Registrador === */}
						<div className="alim-modal-seccion">
							<h3 className="alim-modal-seccion-titulo">Fuente de datos</h3>

							{cargandoAgentes ? (
								<p className="alim-modal-cargando">Cargando agentes...</p>
							) : agentesVinculados.length === 0 ? (
								<p className="alim-modal-aviso">
									No hay agentes vinculados a este workspace. Vinculá un agente desde el
									panel de configuración.
								</p>
							) : (
								<>
									<div className="alim-modal-campo">
										<label>Registrador</label>
										<select
											className="alim-modal-select"
											value={registradorSeleccionado?.id || ""}
											onChange={handleSeleccionarRegistrador}
										>
											<option value="">-- Sin registrador --</option>
											{todosRegistradores.map((reg) => (
												<option key={reg.id} value={reg.id}>
													{reg.nombre} ({reg.agenteNombre}) - {reg.ip}:{reg.puerto} | Reg:{" "}
													{reg.indice_inicial}-{reg.indice_inicial + reg.cantidad_registros - 1}
												</option>
											))}
										</select>
									</div>

									{registradorSeleccionado && (
										<div className="alim-modal-registrador-detalles">
											<div className="alim-modal-registrador-info">
												<span>
													<strong>IP:</strong> {registradorSeleccionado.ip}:
													{registradorSeleccionado.puerto}
												</span>
												<span>
													<strong>Unit ID:</strong> {registradorSeleccionado.unit_id}
												</span>
												<span>
													<strong>Registros:</strong> {registradorSeleccionado.indice_inicial} -{" "}
													{registradorSeleccionado.indice_inicial +
														registradorSeleccionado.cantidad_registros -
														1}
												</span>
												<span>
													<strong>Intervalo polling:</strong>{" "}
													{registradorSeleccionado.intervalo_segundos}s
												</span>
											</div>

											<div className="alim-modal-indices">
												<span className="alim-modal-indices-label">
													Índices arrastrables:
												</span>
												<div className="alim-modal-indices-chips">
													{indicesRegistrador.map((indice) => (
														<span
															key={indice}
															className="alim-modal-indice-chip"
															draggable
															onDragStart={(e) => handleDragStart(e, indice)}
														>
															{indice}
														</span>
													))}
												</div>
											</div>
										</div>
									)}
								</>
							)}
						</div>

						{/* === SECCIÓN 3: Diseño de Card === */}
						{registradorSeleccionado && (
							<div className="alim-modal-seccion">
								<h3 className="alim-modal-seccion-titulo">Diseño de la tarjeta</h3>
								<p className="alim-modal-seccion-ayuda">
									Arrastrá los índices a los campos de registro para configurar qué valor
									se muestra en cada box.
								</p>

								{/* Parte Superior */}
								<SeccionCardDesign
									titulo="Parte superior"
									zona="superior"
									design={cardDesign.superior}
									onChangeTitulo={(val) => actualizarSide("superior", "tituloId", val)}
									onChangeTituloCustom={(val) =>
										actualizarSide("superior", "tituloCustom", val)
									}
									onChangeCantidad={(val) => actualizarSide("superior", "cantidad", val)}
									onChangeBox={(idx, campo, val) => actualizarBox("superior", idx, campo, val)}
									onDragOver={handleDragOver}
									onDrop={(e, idx) => handleDrop(e, "superior", idx)}
									estaIndiceDuplicado={estaIndiceDuplicado}
									obtenerMensajeDuplicado={obtenerMensajeDuplicado}
								/>

								{/* Parte Inferior */}
								<SeccionCardDesign
									titulo="Parte inferior"
									zona="inferior"
									design={cardDesign.inferior}
									onChangeTitulo={(val) => actualizarSide("inferior", "tituloId", val)}
									onChangeTituloCustom={(val) =>
										actualizarSide("inferior", "tituloCustom", val)
									}
									onChangeCantidad={(val) => actualizarSide("inferior", "cantidad", val)}
									onChangeBox={(idx, campo, val) => actualizarBox("inferior", idx, campo, val)}
									onDragOver={handleDragOver}
									onDrop={(e, idx) => handleDrop(e, "inferior", idx)}
									estaIndiceDuplicado={estaIndiceDuplicado}
									obtenerMensajeDuplicado={obtenerMensajeDuplicado}
								/>
							</div>
						)}

						{/* === SECCIÓN: Intervalo de consulta === */}
						<div className="alim-modal-seccion">
							<h3 className="alim-modal-seccion-titulo">Intervalo de consulta</h3>
							<div className="alim-modal-campo">
								<label>Segundos entre consultas a la Base de Datos</label>
								<input
									type="number"
									className="alim-modal-input-numero"
									value={intervaloConsultaSeg}
									onChange={(e) => {
										const valor = Number(e.target.value);
										setIntervaloConsultaSeg(Math.max(5, valor)); // mínimo 5 segundos
									}}
									min={5}
									step={1}
								/>
								<span className="alim-modal-campo-ayuda">
									Cada cuánto el frontend consulta la última lectura (mín. 5s)
								</span>
							</div>
						</div>
					</div>

					{/* Botones inferiores */}
					<div className="alim-modal-actions">
						{/* Botón eliminar a la izquierda (solo en modo edición) */}
						{modo === "editar" && (
							<button
								type="button"
								className="alim-modal-btn-eliminar"
								onClick={handleEliminarClick}
							>
								Eliminar
							</button>
						)}

						<div className="alim-modal-actions-right">
							<button
								type="button"
								className="alim-modal-btn alim-modal-btn-cancelar"
								onClick={onCancelar}
							>
								Cancelar
							</button>

							<button type="submit" className="alim-modal-btn alim-modal-btn-guardar">
								Guardar
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

// === Subcomponente: Sección de diseño de card (superior/inferior) ===
const SeccionCardDesign = ({
	titulo,
	zona,
	design,
	onChangeTitulo,
	onChangeTituloCustom,
	onChangeCantidad,
	onChangeBox,
	onDragOver,
	onDrop,
	estaIndiceDuplicado,
	obtenerMensajeDuplicado,
}) => {
	const [expandido, setExpandido] = useState(false);
	const [tooltipIdx, setTooltipIdx] = useState(null); // índice del box que muestra tooltip
	const cant = design.cantidad || 3;

	return (
		<div className={`alim-modal-card-section ${expandido ? "alim-modal-card-section--expandido" : ""}`}>
			<button
				type="button"
				className="alim-modal-card-section-header"
				onClick={() => setExpandido(!expandido)}
			>
				<span className={`alim-modal-card-section-arrow ${expandido ? "alim-modal-card-section-arrow--expandido" : ""}`}>
					▶
				</span>
				<span className="alim-modal-card-section-titulo">{titulo}</span>
			</button>

			{expandido && (
				<div className="alim-modal-card-section-content">
					<div className="alim-modal-card-header">
						<div className="alim-modal-campo">
							<label>Título</label>
							<select
								className="alim-modal-select"
								value={design.tituloId || "corriente_132"}
								onChange={(e) => onChangeTitulo(e.target.value)}
							>
								{OPCIONES_TITULO.map((op) => (
									<option key={op.id} value={op.id}>
										{op.label}
									</option>
								))}
							</select>
						</div>

						{design.tituloId === "custom" && (
							<div className="alim-modal-campo">
								<label>Título personalizado</label>
								<input
									type="text"
									className="alim-modal-input"
									placeholder="Ej: CONSUMO (A)"
									value={design.tituloCustom || ""}
									onChange={(e) => onChangeTituloCustom(e.target.value)}
								/>
							</div>
						)}

						<div className="alim-modal-campo alim-modal-campo--small">
							<label>Cantidad boxes</label>
							<select
								className="alim-modal-select"
								value={cant}
								onChange={(e) => onChangeCantidad(Number(e.target.value))}
							>
								{[1, 2, 3, 4].map((n) => (
									<option key={n} value={n}>
										{n}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="alim-modal-boxes">
						{Array.from({ length: cant }).map((_, idx) => {
							const box = design.boxes[idx] || {};
							return (
								<div key={`${zona}-box-${idx}`} className="alim-modal-box">
									<span className="alim-modal-box-titulo">Box {idx + 1}</span>
									<div className="alim-modal-box-row">
										<label className="alim-modal-box-check">
											<input
												type="checkbox"
												checked={!!box.enabled}
												onChange={(e) => onChangeBox(idx, "enabled", e.target.checked)}
											/>
										</label>

										<input
											type="text"
											className="alim-modal-input alim-modal-box-label"
											placeholder={PLACEHOLDERS_BOX[idx] || `Ej: R o L1`}
											value={box.label || ""}
											onChange={(e) => onChangeBox(idx, "label", e.target.value)}
										/>

										<div className="alim-modal-box-indice-wrapper">
										<input
											type="number"
											className={`alim-modal-input alim-modal-box-indice ${estaIndiceDuplicado(zona, idx, box.indice) ? "alim-modal-box-indice--duplicado" : ""}`}
											placeholder="Índice"
											value={box.indice ?? ""}
											onChange={(e) =>
												onChangeBox(idx, "indice", e.target.value ? Number(e.target.value) : null)
											}
											onDragOver={onDragOver}
											onDrop={(e) => onDrop(e, idx)}
										/>
										{estaIndiceDuplicado(zona, idx, box.indice) && (
											<span
												className="alim-modal-box-warning"
												onMouseEnter={() => setTooltipIdx(idx)}
												onMouseLeave={() => setTooltipIdx(null)}
											>
												⚠️
												{tooltipIdx === idx && (
													<div className="alim-modal-box-warning-tooltip">
														{obtenerMensajeDuplicado(zona, idx, box.indice)}
													</div>
												)}
											</span>
										)}
									</div>

										<input
											type="text"
											className="alim-modal-input alim-modal-box-formula"
											placeholder="Fórmula (ej: x*250/1000)"
											value={box.formula || ""}
											onChange={(e) => onChangeBox(idx, "formula", e.target.value)}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};

export default ModalConfiguracionAlimentador;
