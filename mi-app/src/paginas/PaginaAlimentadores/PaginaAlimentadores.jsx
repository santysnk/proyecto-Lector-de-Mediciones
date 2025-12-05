import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PaginaAlimentadores.css";

// Componentes
import BarraNavegacion from "./componentes/navegacion/BarraNavegacion.jsx";
import MenuLateral from "./componentes/navegacion/MenuLateral.jsx";
import ModalNuevoPuesto from "./componentes/modales/ModalNuevoPuesto.jsx";
import ModalEditarPuestos from "./componentes/modales/ModalEditarPuestos.jsx";
import GrillaTarjetas from "./componentes/tarjetas/GrillaTarjetas.jsx";
import ModalConfiguracionAlimentador from "./componentes/modales/ModalConfiguracionAlimentador.jsx";
import ModalMapeoMediciones from "./componentes/modales/ModalMapeoMediciones.jsx";

// Hooks y utilidades
import { COLORES_SISTEMA } from "./constantes/colores.js";
import { usarPuestos } from "./hooks/usarPuestos.js";
import { usarMediciones } from "./hooks/usarMediciones.js";
import { usarArrastrarSoltar } from "./hooks/usarArrastrarSoltar.js";
import {
	obtenerDiseñoTarjeta,
	calcularValoresLadoTarjeta,
} from "./utilidades/calculosMediciones.js";

/**
 * Componente principal de la página de Alimentadores
 * Gestiona puestos, alimentadores y mediciones en tiempo real
 */
const PaginaAlimentadores = () => {
	const navigate = useNavigate();

	const handleSalir = () => {
		navigate("/");
	};

	// Estado del menú lateral + modo compacto
	const [menuAbierto, setMenuAbierto] = useState(false);
	const [esCompacto, setEsCompacto] = useState(false);

	// Detectar cuándo pasamos a layout compacto (según ancho)
	useEffect(() => {
		const actualizarModo = () => {
			setEsCompacto(window.innerWidth < 900);
		};

		actualizarModo();
		window.addEventListener("resize", actualizarModo);
		return () => window.removeEventListener("resize", actualizarModo);
	}, []);

	// ===== HOOKS PERSONALIZADOS =====
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
	} = usarPuestos();

	const {
		registrosEnVivo,
		iniciarMedicion,
		detenerMedicion,
		obtenerRegistros,
		estaMidiendo,
		obtenerTimestampInicio,
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

	const [modoAlim, setModoAlim] = useState("crear"); // "crear" | "editar"
	const [alimentadorEnEdicion, setAlimentadorEnEdicion] = useState(null);
	const [alimentadorMapeo, setAlimentadorMapeo] = useState(null);

	// Estado para lecturas calculadas (mostrar en tarjetas)
	const [lecturas, setLecturas] = useState({});

	// ===== FUNCIONES DE PUESTOS =====
	const abrirModalNuevoPuesto = () => {
		setMostrarModalNuevoPuesto(true);
	};

	const cerrarModalNuevoPuesto = () => {
		setMostrarModalNuevoPuesto(false);
	};

	const handleCrearPuesto = (nombre, color) => {
		agregarPuesto(nombre, color);
		cerrarModalNuevoPuesto();
	};

	const abrirModalEditarPuestos = () => {
		setMostrarModalEditarPuestos(true);
	};

	const cerrarModalEditarPuestos = () => {
		setMostrarModalEditarPuestos(false);
	};

	const handleGuardarPuestos = (puestosEditados) => {
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
		// El hook ya actualiza registrosEnVivo automáticamente
	};

	// Recalcular valores cuando cambien los registros
	useEffect(() => {
		if (!puestoSeleccionado) return;

		setLecturas(() => {
			const nuevo = {};

			puestoSeleccionado.alimentadores.forEach((alim) => {
				const regsDelAlim = registrosEnVivo[alim.id] || null;
				const diseño = obtenerDiseñoTarjeta(alim.mapeoMediciones);

				const parteSuperior = calcularValoresLadoTarjeta(
					regsDelAlim,
					diseño.superior
				);
				const parteInferior = calcularValoresLadoTarjeta(
					regsDelAlim,
					diseño.inferior
				);

				nuevo[alim.id] = { parteSuperior, parteInferior };
			});

			return nuevo;
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
			<BarraNavegacion
				esCompacto={esCompacto}
				puestos={puestos}
				puestoSeleccionado={puestoSeleccionado}
				onSeleccionarPuesto={seleccionarPuesto}
				onAbrirModalNuevoPuesto={abrirModalNuevoPuesto}
				onAbrirModalEditarPuestos={abrirModalEditarPuestos}
				onSalir={handleSalir}
				onAbrirMenu={() => setMenuAbierto(true)}
				coloresSistema={COLORES_SISTEMA}
			/>

			{/* ===== MENÚ LATERAL (solo en modo compacto) ===== */}
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
				style={{
					backgroundColor: puestoSeleccionado?.bgColor || "#e5e7eb",
				}}
			>
				{!puestoSeleccionado ? (
					<div className="alim-empty-state">
						<p>
							No hay puestos creados. Haz clic en el botón "+" para
							agregar uno.
						</p>
					</div>
				) : (
					<>
						{puestoSeleccionado.alimentadores.length === 0 && (
							<div className="alim-empty-state">
								<p>
									Este puesto no tiene alimentadores. Haz clic en el
									botón de abajo para agregar.
								</p>
							</div>
						)}

						<GrillaTarjetas
							alimentadores={puestoSeleccionado.alimentadores}
							lecturas={lecturas}
							puestoId={puestoSeleccionado.id}
							elementoArrastrandoId={elementoArrastrandoId}
							onAbrirConfiguracion={abrirModalEditarAlim}
							onAbrirMapeo={abrirModalMapeo}
							onDragStart={handleDragStartAlim}
							onDragOver={alPasarPorEncima}
							onDrop={handleDropAlim}
							onDragEnd={handleDragEndAlim}
							onDropAlFinal={handleDropAlimAlFinal}
							onAgregarNuevo={abrirModalNuevoAlim}
							estaMidiendo={estaMidiendo}
							obtenerTimestampInicio={obtenerTimestampInicio}
						/>
					</>
				)}
			</main>

			{/* ===== MODALES ===== */}

			{/* Modal Nuevo Puesto */}
			<ModalNuevoPuesto
				abierto={mostrarModalNuevoPuesto}
				onCerrar={cerrarModalNuevoPuesto}
				onCrear={handleCrearPuesto}
				coloresSistema={COLORES_SISTEMA}
			/>

			{/* Modal Editar Puestos */}
			<ModalEditarPuestos
				abierto={mostrarModalEditarPuestos}
				puestos={puestos}
				onCerrar={cerrarModalEditarPuestos}
				onGuardar={handleGuardarPuestos}
			/>

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
					alimEnEdicion
						? estaMidiendo(alimEnEdicion.id, "analizador")
						: false
				}
				onToggleMedicionRele={(override) =>
					alimEnEdicion &&
					handleToggleMedicionRele(alimEnEdicion.id, override)
				}
				onToggleMedicionAnalizador={(override) =>
					alimEnEdicion &&
					handleToggleMedicionAnalizador(
						alimEnEdicion.id,
						override
					)
				}
				registrosRele={
					alimEnEdicion ? obtenerRegistros(alimEnEdicion.id, "rele") : []
				}
				registrosAnalizador={
					alimEnEdicion
						? obtenerRegistros(alimEnEdicion.id, "analizador")
						: []
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
