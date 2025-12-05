import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VistaAlimentadores.css";

import BarraNavegacion from "../navegacion/BarraNavegacion.jsx";
import MenuLateral from "../navegacion/MenuLateral.jsx";
import GrillaTarjetas from "../tarjetas/GrillaTarjetas.jsx";
import ModalNuevoPuesto from "../modales/ModalNuevoPuesto.jsx";
import ModalEditarPuestos from "../modales/ModalEditarPuestos.jsx";
import ModalConfiguracionAlimentador from "../modales/ModalConfiguracionAlimentador.jsx";
import ModalMapeoMediciones from "../modales/ModalMapeoMediciones.jsx";

import { COLORES_SISTEMA } from "../../constantes/colores";
import { usarArrastrarSoltar } from "../../hooks/usarArrastrarSoltar";
import { usarContextoAlimentadores } from "../../contexto/ContextoAlimentadores";
import { useGestorModales } from "../../hooks/useGestorModales";

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

	const {
		elementoArrastrandoId,
		alIniciarArrastre,
		alTerminarArrastre,
		alPasarPorEncima,
		reordenarLista,
		moverAlFinal,
	} = usarArrastrarSoltar();

	const { abrirModal, cerrarModal, obtenerEstado } = useGestorModales();

	const [menuAbierto, setMenuAbierto] = useState(false);
	const [esCompacto, setEsCompacto] = useState(false);

	// Responsive: detectar modo compacto
	useEffect(() => {
		const actualizarModo = () => setEsCompacto(window.innerWidth < 900);
		actualizarModo();
		window.addEventListener("resize", actualizarModo);
		return () => window.removeEventListener("resize", actualizarModo);
	}, []);

	const estadoModalNuevoPuesto = obtenerEstado("nuevoPuesto");
	const estadoModalEditarPuestos = obtenerEstado("editarPuestos");
	const estadoModalAlimentador = obtenerEstado("alimentador");
	const estadoModalMapeo = obtenerEstado("mapeo");

	const buscarAlimentador = (alimId) =>
		puestoSeleccionado?.alimentadores.find((a) => a.id === alimId) || null;

	const alimentadorEnEdicion = estadoModalAlimentador.datos?.alimentadorId
		? buscarAlimentador(estadoModalAlimentador.datos.alimentadorId)
		: null;

	const modoAlimentador = estadoModalAlimentador.datos?.modo || "crear";

	const alimentadorParaMapeo = estadoModalMapeo.datos?.alimentadorId
		? buscarAlimentador(estadoModalMapeo.datos.alimentadorId)
		: null;

	// Navegacion
	const handleSalir = () => navigate("/");

	// ===== MODALES PUESTOS =====
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

	// ===== MODALES ALIMENTADORES =====
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
			actualizarAlimentador(puestoSeleccionado.id, alimentadorEnEdicion.id, datos);
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

	// ===== MEDICIONES =====
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
				style={{ backgroundColor: puestoSeleccionado?.bgColor || "#e5e7eb" }}
			>
				{!puestoSeleccionado ? (
					<div className="alim-empty-state">
						<p>
							No hay puestos creados. Haz clic en el boton "+" para agregar
							uno.
						</p>
					</div>
				) : (
					<>
						{puestoSeleccionado.alimentadores.length === 0 && (
							<div className="alim-empty-state">
								<p>
									Este puesto no tiene alimentadores. Haz clic en el boton de
									abajo para agregar.
								</p>
							</div>
						)}

						<GrillaTarjetas
							alimentadores={puestoSeleccionado.alimentadores}
							lecturas={lecturasTarjetas}
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
							obtenerContadorLecturas={obtenerContadorLecturas}
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
				modo={modoAlimentador}
				initialData={alimentadorEnEdicion}
				onCancelar={() => cerrarModal("alimentador")}
				onConfirmar={handleGuardarAlimentador}
				onEliminar={handleEliminarAlimentador}
				isMeasuringRele={
					alimentadorEnEdicion
						? estaMidiendo(alimentadorEnEdicion.id, "rele")
						: false
				}
				isMeasuringAnalizador={
					alimentadorEnEdicion
						? estaMidiendo(alimentadorEnEdicion.id, "analizador")
						: false
				}
				onToggleMedicionRele={(override) =>
					alimentadorEnEdicion &&
					handleAlternarMedicionRele(alimentadorEnEdicion.id, override)
				}
				onToggleMedicionAnalizador={(override) =>
					alimentadorEnEdicion &&
					handleAlternarMedicionAnalizador(alimentadorEnEdicion.id, override)
				}
				registrosRele={
					alimentadorEnEdicion
						? obtenerRegistros(alimentadorEnEdicion.id, "rele")
						: []
				}
				registrosAnalizador={
					alimentadorEnEdicion
						? obtenerRegistros(alimentadorEnEdicion.id, "analizador")
						: []
				}
			/>

			<ModalMapeoMediciones
				abierto={estadoModalMapeo.abierto}
				alimentador={alimentadorParaMapeo}
				onCerrar={() => cerrarModal("mapeo")}
				onGuardar={handleGuardarMapeo}
			/>
		</div>
	);
};

export default VistaAlimentadores;
