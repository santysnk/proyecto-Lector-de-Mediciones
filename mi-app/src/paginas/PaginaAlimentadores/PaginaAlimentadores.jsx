// src/paginas/PaginaAlimentadores/PaginaAlimentadores.jsx
import React, { useState } from "react";
import "./PaginaAlimentadores.css";
import TarjetaAlimentador from "./componentes/tarjetas/TarjetaAlimentador.jsx";
import ModalConfiguracionAlimentador from "./componentes/modales/ModalConfiguracionAlimentador.jsx";
import ModalMapeoMediciones from "./componentes/modales/ModalMapeoMediciones.jsx";

// Imports de la nueva estructura modular
import { COLORES_SISTEMA } from "./constantes/colores.js";
import { usarPuestos } from "./hooks/usarPuestos.js";
import { usarMediciones } from "./hooks/usarMediciones.js";
import { usarArrastrarSoltar } from "./hooks/usarArrastrarSoltar.js";
import {
	obtenerDiseñoTarjeta,
	calcularValoresLadoTarjeta
} from "./utilidades/calculosMediciones.js";

/**
 * Componente principal de la página de Alimentadores
 * Gestiona puestos, alimentadores y mediciones en tiempo real
 */
const PaginaAlimentadores = () => {
	// ===== HOOKS PERSONALIZADOS =====
	const {
		puestos,
		puestoSeleccionado,
		puestoSeleccionadoId,
		agregarPuesto,
		seleccionarPuesto,
		actualizarPuestos,
		agregarAlimentador,
		actualizarAlimentador,
		eliminarAlimentador,
		reordenarAlimentadores,
	} = usarPuestos();

	const {
		registrosEnVivo,
		medicionesActivas,
		iniciarMedicion,
		detenerMedicion,
		alternarMedicion,
		obtenerRegistros,
		estaMidiendo,
		actualizarRegistros,
	} = usarMediciones();

	const {
		elementoArrastrandoId,
		alIniciarArrastre,
		alTerminarArrastre,
		alPasarPorEncima,
		reordenarLista,
		moverAlFinal,
	} = usarArrastrarSoltar();

	// ===== ESTADOS LOCALES PARA MODALES =====
	const [mostrarModalNuevoPuesto, setMostrarModalNuevoPuesto] = useState(false);
	const [mostrarModalEditarPuestos, setMostrarModalEditarPuestos] = useState(false);
	const [mostrarModalNuevoAlim, setMostrarModalNuevoAlim] = useState(false);
	const [mostrarModalMapeo, setMostrarModalMapeo] = useState(false);

	const [nuevoNombrePuesto, setNuevoNombrePuesto] = useState("");
	const [colorPuesto, setColorPuesto] = useState(COLORES_SISTEMA[0]);
	const [puestosEditados, setPuestosEditados] = useState([]);

	const [modoAlim, setModoAlim] = useState("crear"); // "crear" | "editar"
	const [alimentadorEnEdicion, setAlimentadorEnEdicion] = useState(null);
	const [alimentadorMapeo, setAlimentadorMapeo] = useState(null);

	// Estado para lecturas calculadas (mostrar en tarjetas)
	const [lecturas, setLecturas] = useState({});

	// ===== FUNCIONES DE PUESTOS =====
	const abrirModalNuevoPuesto = () => {
		setNuevoNombrePuesto("");
		setColorPuesto(COLORES_SISTEMA[0]);
		setMostrarModalNuevoPuesto(true);
	};

	const cerrarModalNuevoPuesto = () => {
		setMostrarModalNuevoPuesto(false);
		setNuevoNombrePuesto("");
	};

	const handleCrearPuesto = (e) => {
		e.preventDefault();
		const nombre = nuevoNombrePuesto.trim();
		if (!nombre) return;

		agregarPuesto(nombre, colorPuesto);
		cerrarModalNuevoPuesto();
	};

	const abrirModalEditarPuestos = () => {
		setPuestosEditados(puestos.map((p) => ({ ...p })));
		setMostrarModalEditarPuestos(true);
	};

	const cerrarModalEditarPuestos = () => {
		setMostrarModalEditarPuestos(false);
		setPuestosEditados([]);
	};

	const cambiarNombreEditado = (id, nombreNuevo) => {
		setPuestosEditados((prev) =>
			prev.map((p) => (p.id === id ? { ...p, nombre: nombreNuevo } : p))
		);
	};

	const eliminarEditado = (id) => {
		setPuestosEditados((prev) => prev.filter((p) => p.id !== id));
	};

	const guardarCambiosPuestos = () => {
		actualizarPuestos(puestosEditados);
		cerrarModalEditarPuestos();
	};

	// ===== FUNCIONES DE ALIMENTADORES =====
	const abrirModalNuevoAlim = () => {
		setModoAlim("crear");
		setAlimentadorEnEdicion(null);
		setMostrarModalNuevoAlim(true);
	};

	const abrirModalEditarAlim = (puestoId, alimentador) => {
		setModoAlim("editar");
		setAlimentadorEnEdicion({ puestoId, alimId: alimentador.id });
		setMostrarModalNuevoAlim(true);
	};

	const cerrarModalNuevoAlim = () => {
		setMostrarModalNuevoAlim(false);
		setAlimentadorEnEdicion(null);
	};

	const handleGuardarAlimentador = (datos) => {
		if (!datos || !datos.nombre) return;

		if (modoAlim === "crear") {
			agregarAlimentador(datos);
		} else if (modoAlim === "editar" && alimentadorEnEdicion) {
			const { puestoId, alimId } = alimentadorEnEdicion;
			actualizarAlimentador(puestoId, alimId, datos);
		}

		cerrarModalNuevoAlim();
	};

	const handleEliminarAlimentador = () => {
		if (!alimentadorEnEdicion) return;

		const { puestoId, alimId } = alimentadorEnEdicion;

		// Detener mediciones si están activas
		detenerMedicion(alimId, "rele");
		detenerMedicion(alimId, "analizador");

		eliminarAlimentador(puestoId, alimId);
		cerrarModalNuevoAlim();
	};

	// ===== DRAG & DROP =====
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

	// ===== MAPEO DE MEDICIONES =====
	const abrirModalMapeo = (puestoId, alimentador) => {
		setAlimentadorMapeo({ puestoId, alimId: alimentador.id });
		setMostrarModalMapeo(true);
	};

	const cerrarModalMapeo = () => {
		setMostrarModalMapeo(false);
		setAlimentadorMapeo(null);
	};

	const handleGuardarMapeo = (nuevoMapeo) => {
		if (!alimentadorMapeo) return;
		const { puestoId, alimId } = alimentadorMapeo;

		actualizarAlimentador(puestoId, alimId, { mapeoMediciones: nuevoMapeo });

		// Preview de la tarjeta sin medición
		const diseño = obtenerDiseñoTarjeta(nuevoMapeo);
		setLecturas((prev) => ({
			...prev,
			[alimId]: {
				parteSuperior: calcularValoresLadoTarjeta(null, diseño.superior),
				parteInferior: calcularValoresLadoTarjeta(null, diseño.inferior),
			},
		}));

		cerrarModalMapeo();
	};

	// ===== FUNCIONES DE MEDICIÓN =====
	const handleToggleMedicionRele = (alimId, overrideConfig) => {
		if (!puestoSeleccionado) return;
		const alim = puestoSeleccionado.alimentadores.find((a) => a.id === alimId);
		if (!alim) return;

		if (estaMidiendo(alimId, "rele")) {
			detenerMedicion(alimId, "rele");
		} else {
			iniciarMedicionConCalculo(alim, "rele", overrideConfig);
		}
	};

	const handleToggleMedicionAnalizador = (alimId, overrideConfig) => {
		if (!puestoSeleccionado) return;
		const alim = puestoSeleccionado.alimentadores.find((a) => a.id === alimId);
		if (!alim) return;

		if (estaMidiendo(alimId, "analizador")) {
			detenerMedicion(alimId, "analizador");
		} else {
			iniciarMedicionConCalculo(alim, "analizador", overrideConfig);
		}
	};

	const iniciarMedicionConCalculo = async (alim, equipo, overrideConfig) => {
		// Iniciar medición usando el hook
		await iniciarMedicion(alim, equipo, overrideConfig);

		// Suscribirse a cambios en registros para recalcular valores
		// (El hook ya actualiza registrosEnVivo automáticamente)
	};

	// Recalcular valores cuando cambien los registros
	React.useEffect(() => {
		if (!puestoSeleccionado) return;

		puestoSeleccionado.alimentadores.forEach((alim) => {
			const regsDelAlim = registrosEnVivo[alim.id];
			if (!regsDelAlim) return;

			const diseño = obtenerDiseñoTarjeta(alim.mapeoMediciones);

			const parteSuperior = calcularValoresLadoTarjeta(regsDelAlim, diseño.superior);
			const parteInferior = calcularValoresLadoTarjeta(regsDelAlim, diseño.inferior);

			setLecturas((prev) => ({
				...prev,
				[alim.id]: { parteSuperior, parteInferior },
			}));
		});
	}, [registrosEnVivo, puestoSeleccionado]);

	// ===== DATOS PARA MODALES =====
	const alimEnEdicion =
		modoAlim === "editar" && alimentadorEnEdicion && puestoSeleccionado
			? puestoSeleccionado.alimentadores.find(
				(a) => a.id === alimentadorEnEdicion.alimId
			) || null
			: null;

	const alimMapeoObj = alimentadorMapeo
		? (() => {
			const p = puestos.find((px) => px.id === alimentadorMapeo.puestoId);
			if (!p) return null;
			return p.alimentadores.find((a) => a.id === alimentadorMapeo.alimId) || null;
		})()
		: null;

	return (
		<div className="alim-page">
			{/* ===== NAV SUPERIOR ===== */}
			<nav className="alim-navbar">
				<div className="alim-navbar-left">
					<h1 className="alim-title">Panel de Alimentadores</h1>

					{puestoSeleccionado && (
						<div className="alim-current-puesto">{puestoSeleccionado.nombre}</div>
					)}
				</div>

				<div className="alim-nav-buttons">
					{puestos.map((p) => (
						<button
							key={p.id}
							className={
								"alim-btn" +
								(puestoSeleccionado && puestoSeleccionado.id === p.id
									? " alim-btn-active"
									: "")
							}
							onClick={() => seleccionarPuesto(p.id)}
							style={{ backgroundColor: p.color || COLORES_SISTEMA[0] }}
						>
							{p.nombre}
						</button>
					))}

					<button
						type="button"
						className="alim-btn alim-btn-add"
						onClick={abrirModalNuevoPuesto}
					>
						<span className="alim-btn-add-icon">+</span>
					</button>

					<button
						type="button"
						className="alim-btn alim-btn-edit"
						onClick={abrirModalEditarPuestos}
						disabled={puestos.length === 0}
					>
						✎
					</button>
				</div>
			</nav>

			{/* ===== MAIN ===== */}
			<main
				className="alim-main"
				style={{
					backgroundColor: puestoSeleccionado?.bgColor || "#e5e7eb",
				}}
			>
				{!puestoSeleccionado ? (
					<div className="alim-empty-state">
						<p>No hay puestos creados. Haz clic en el botón "+" para agregar uno.</p>
					</div>
				) : (
					<>
						{puestoSeleccionado.alimentadores.length === 0 ? (
							<div className="alim-empty-state">
								<p>
									Este puesto no tiene alimentadores. Haz clic en el botón de abajo
									para agregar.
								</p>
							</div>
						) : (
							<div className="alim-cards-grid">
								{puestoSeleccionado.alimentadores.map((alim) => {
									const lecturasAlim = lecturas[alim.id] || {};
									const mideRele = estaMidiendo(alim.id, "rele");
									const mideAnalizador = estaMidiendo(alim.id, "analizador");

									return (
										<TarjetaAlimentador
											key={alim.id}
											nombre={alim.nombre}
											color={alim.color}
											onConfigClick={() =>
												abrirModalEditarAlim(puestoSeleccionado.id, alim)
											}
											onMapClick={() =>
												abrirModalMapeo(puestoSeleccionado.id, alim)
											}
											topSide={lecturasAlim.parteSuperior}
											bottomSide={lecturasAlim.parteInferior}
											draggable={true}
											isDragging={elementoArrastrandoId === alim.id}
											onDragStart={() => handleDragStartAlim(alim.id)}
											onDragOver={alPasarPorEncima}
											onDrop={() => handleDropAlim(alim.id)}
											onDragEnd={handleDragEndAlim}
											mideRele={mideRele}
											mideAnalizador={mideAnalizador}
											periodoRele={alim.periodoSegundos || 60}
											periodoAnalizador={alim.analizador?.periodoSegundos || 60}
										/>
									);
								})}

								{elementoArrastrandoId ? (
									<div
										className="alim-card-add"
										onDragOver={alPasarPorEncima}
										onDrop={handleDropAlimAlFinal}
									>
										<span style={{ textAlign: "center", padding: "1rem" }}>
											Soltar aquí para mover al final
										</span>
									</div>
								) : (
									<div
										className="alim-card-add"
										onClick={abrirModalNuevoAlim}
									>
										<span className="alim-card-add-plus">+</span>
										<span className="alim-card-add-text">Nuevo Registrador</span>
									</div>
								)}
							</div>
						)}
					</>
				)}
			</main>

			{/* ===== MODALES ===== */}

			{/* Modal Nuevo Puesto */}
			{mostrarModalNuevoPuesto && (
				<div className="alim-modal-overlay">
					<div className="alim-modal alim-modal-sm">
						<h2>Nuevo Puesto</h2>
						<form onSubmit={handleCrearPuesto}>
							<label className="alim-modal-label">
								Nombre del Puesto
								<input
									type="text"
									className="alim-modal-input"
									value={nuevoNombrePuesto}
									onChange={(e) => setNuevoNombrePuesto(e.target.value)}
									placeholder="Ej: PUESTO 1"
									autoFocus
								/>
							</label>

							<div className="alim-color-picker">
								<div className="alim-color-grid">
									{COLORES_SISTEMA.map((c) => (
										<button
											key={c}
											type="button"
											className={
												"alim-color-swatch" +
												(colorPuesto === c ? " alim-color-swatch-selected" : "")
											}
											style={{ backgroundColor: c }}
											onClick={() => setColorPuesto(c)}
										/>
									))}
								</div>
							</div>

							<div className="alim-modal-actions">
								<button
									type="button"
									className="alim-modal-btn alim-modal-btn-cancelar"
									onClick={cerrarModalNuevoPuesto}
								>
									Cancelar
								</button>
								<button type="submit" className="alim-modal-btn alim-modal-btn-aceptar">
									Crear
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Modal Editar Puestos */}
			{mostrarModalEditarPuestos && (
				<div className="alim-modal-overlay">
					<div className="alim-modal">
						<h2>Editar Puestos</h2>
						<div className="alim-edit-list">
							{puestosEditados.map((p) => (
								<div key={p.id} className="alim-edit-item">
									<input
										type="text"
										className="alim-modal-input"
										value={p.nombre}
										onChange={(e) => cambiarNombreEditado(p.id, e.target.value)}
									/>
									<button
										type="button"
										className="alim-edit-delete"
										onClick={() => eliminarEditado(p.id)}
									>
										🗑️
									</button>
								</div>
							))}
						</div>

						<div className="alim-modal-actions">
							<button
								type="button"
								className="alim-modal-btn alim-modal-btn-cancelar"
								onClick={cerrarModalEditarPuestos}
							>
								Cancelar
							</button>
							<button
								type="button"
								className="alim-modal-btn alim-modal-btn-aceptar"
								onClick={guardarCambiosPuestos}
							>
								Guardar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Nuevo/Editar Alimentador */}
			<ModalConfiguracionAlimentador
				abierto={mostrarModalNuevoAlim}
				puestoNombre={puestoSeleccionado?.nombre || ""}
				modo={modoAlim}
				initialData={alimEnEdicion}
				onCancelar={cerrarModalNuevoAlim}
				onConfirmar={handleGuardarAlimentador}
				onEliminar={handleEliminarAlimentador}
				isMeasuringRele={
					alimEnEdicion ? estaMidiendo(alimEnEdicion.id, "rele") : false
				}
				isMeasuringAnalizador={
					alimEnEdicion ? estaMidiendo(alimEnEdicion.id, "analizador") : false
				}
				onToggleMedicionRele={(override) =>
					alimEnEdicion && handleToggleMedicionRele(alimEnEdicion.id, override)
				}
				onToggleMedicionAnalizador={(override) =>
					alimEnEdicion &&
					handleToggleMedicionAnalizador(alimEnEdicion.id, override)
				}
				registrosRele={
					alimEnEdicion ? obtenerRegistros(alimEnEdicion.id, "rele") : []
				}
				registrosAnalizador={
					alimEnEdicion ? obtenerRegistros(alimEnEdicion.id, "analizador") : []
				}
			/>

			{/* Modal Mapeo Mediciones */}
			<ModalMapeoMediciones
				abierto={mostrarModalMapeo}
				alimentador={alimMapeoObj}
				onCerrar={cerrarModalMapeo}
				onGuardar={handleGuardarMapeo}
			/>
		</div>
	);
};

export default PaginaAlimentadores;
