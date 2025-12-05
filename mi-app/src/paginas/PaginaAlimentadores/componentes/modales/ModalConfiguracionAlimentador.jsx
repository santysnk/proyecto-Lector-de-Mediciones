// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfiguracionAlimentador.jsx
import React, { useEffect, useState } from "react";
import "./ModalConfiguracionAlimentador.css";
import { leerRegistrosModbus } from "../../utilidades/clienteModbus";
import { COLORES_SISTEMA } from "../../constantes/colores";

// Subcomponentes para organizar mejor el código
import FormularioDatosBasicos from "./configuracion/FormularioDatosBasicos.jsx";
import TabConfiguracionRele from "./configuracion/TabConfiguracionRele.jsx";
import TabConfiguracionAnalizador from "./configuracion/TabConfiguracionAnalizador.jsx";

/**
 * ==============================================================================
 * COMPONENTE: ModalConfiguracionAlimentador
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es el panel de control principal de cada equipo. Aquí puedes:
 * 1. Cambiar el nombre y color del alimentador.
 * 2. Configurar la conexión con el RELÉ (IP, puerto, registros).
 * 3. Configurar la conexión con el ANALIZADOR DE RED.
 * 4. Probar si la conexión funciona (Botón "Probar Conexión").
 * 5. Iniciar o detener la medición en tiempo real.
 * 
 * ¿CÓMO FUNCIONA?
 * - Es un modal complejo con pestañas (Tabs) para separar la configuración del Relé y del Analizador.
 * - Maneja muchos estados locales para guardar temporalmente los datos que escribes.
 * - Solo guarda los cambios definitivos cuando le das a "Guardar".
 * 
 * FINALIDAD:
 * Centralizar toda la configuración técnica de cada punto de medición.
 */

const ModalConfiguracionAlimentador = ({
	abierto, 			// ¿Debe mostrarse?
	puestoNombre, 		// Nombre del puesto al que pertenece
	modo = "crear", 	// "crear" o "editar"
	initialData, 		// Datos actuales (si estamos editando)
	onCancelar, 		// Cerrar sin guardar
	onConfirmar, 		// Guardar cambios
	onEliminar, 		// Eliminar este alimentador

	// Control de medición en tiempo real (vienen desde el hook usarMediciones)
	isMeasuringRele = false,
	isMeasuringAnalizador = false,
	onToggleMedicionRele,
	onToggleMedicionAnalizador,
	registrosRele = [],
	registrosAnalizador = [],
}) => {
	// ==========================================================================
	// ESTADOS LOCALES (Datos temporales del formulario)
	// ==========================================================================

	const [nombre, setNombre] = useState("");
	const [color, setColor] = useState(COLORES_SISTEMA[0]);
	const [tab, setTab] = useState("rele"); // Pestaña activa: "rele" o "analizador"

	// Configuración del RELÉ
	const [rele, setRele] = useState({
		ip: "",
		puerto: "",
		indiceInicial: "",
		cantRegistros: "",
	});
	const [periodoSegundos, setPeriodoSegundos] = useState("60"); // Cada cuánto mide el relé

	// Configuración del ANALIZADOR
	const [analizador, setAnalizador] = useState({
		ip: "",
		puerto: "",
		indiceInicial: "",
		cantRegistros: "",
		periodoSegundos: "60",
	});

	// Estados para la prueba de conexión (Test)
	const [isTestingRele, setIsTestingRele] = useState(false);
	const [testErrorRele, setTestErrorRele] = useState("");
	const [testRowsRele, setTestRowsRele] = useState([]);

	const [isTestingAnalizador, setIsTestingAnalizador] = useState(false);
	const [testErrorAnalizador, setTestErrorAnalizador] = useState("");
	const [testRowsAnalizador, setTestRowsAnalizador] = useState([]);

	// ==========================================================================
	// EFECTO: CARGAR DATOS AL ABRIR
	// ==========================================================================
	useEffect(() => {
		if (!abierto) return;

		if (initialData) {
			// Si estamos editando, rellenamos el formulario con los datos existentes
			setNombre(initialData.nombre || "");
			setColor(initialData.color || COLORES_SISTEMA[0]);
			setTab("rele");

			setRele({
				ip: initialData.rele?.ip || "",
				puerto: initialData.rele?.puerto != null ? String(initialData.rele.puerto) : "",
				indiceInicial: initialData.rele?.indiceInicial != null ? String(initialData.rele.indiceInicial) : "",
				cantRegistros: initialData.rele?.cantRegistros != null ? String(initialData.rele.cantRegistros) : "",
			});

			setPeriodoSegundos(initialData.periodoSegundos != null ? String(initialData.periodoSegundos) : "60");

			setAnalizador({
				ip: initialData.analizador?.ip || "",
				puerto: initialData.analizador?.puerto != null ? String(initialData.analizador.puerto) : "",
				indiceInicial: initialData.analizador?.indiceInicial != null ? String(initialData.analizador.indiceInicial) : "",
				cantRegistros: initialData.analizador?.cantRegistros != null ? String(initialData.analizador.cantRegistros) : "",
				periodoSegundos: initialData.analizador?.periodoSegundos != null ? String(initialData.analizador.periodoSegundos) : "60",
			});
		} else {
			// Si es nuevo, limpiamos todo
			setNombre("");
			setColor(COLORES_SISTEMA[0]);
			setTab("rele");
			setRele({ ip: "", puerto: "", indiceInicial: "", cantRegistros: "" });
			setPeriodoSegundos("60");
			setAnalizador({ ip: "", puerto: "", indiceInicial: "", cantRegistros: "", periodoSegundos: "60" });
		}

		// Reiniciamos los estados de prueba
		setIsTestingRele(false);
		setTestErrorRele("");
		setTestRowsRele([]);
		setIsTestingAnalizador(false);
		setTestErrorAnalizador("");
		setTestRowsAnalizador([]);
	}, [abierto, initialData]);

	if (!abierto) return null;

	// ==========================================================================
	// LÓGICA DE PRUEBA DE CONEXIÓN (TEST)
	// ==========================================================================

	const handleTestConexionRele = async () => {
		const ip = rele.ip.trim();
		const puerto = Number(rele.puerto);
		const inicio = Number(rele.indiceInicial);
		const cantidad = Number(rele.cantRegistros);

		// Validamos que todos los campos estén llenos
		if (!ip || !puerto || isNaN(inicio) || isNaN(cantidad) || cantidad <= 0) {
			setTestErrorRele("Completa IP, puerto, índice inicial y cantidad de registros antes de probar.");
			setTestRowsRele([]);
			return;
		}

		setIsTestingRele(true);
		setTestErrorRele("");
		setTestRowsRele([]);

		try {
			// Intentamos leer datos reales (o simulados)
			const fetched = await leerRegistrosModbus({
				ip,
				puerto,
				indiceInicial: inicio,
				cantRegistros: cantidad,
			});
			setTestRowsRele(fetched || []);
		} catch (err) {
			console.error(err);
			setTestErrorRele(err?.message || "Error de red o al intentar leer los registros.");
			setTestRowsRele([]);
		} finally {
			setIsTestingRele(false);
		}
	};

	// (La lógica para el Analizador es idéntica a la del Relé)
	const handleTestConexionAnalizador = async () => {
		const ip = analizador.ip.trim();
		const puerto = Number(analizador.puerto);
		const inicio = Number(analizador.indiceInicial);
		const cantidad = Number(analizador.cantRegistros);

		if (!ip || !puerto || isNaN(inicio) || isNaN(cantidad) || cantidad <= 0) {
			setTestErrorAnalizador("Completa IP, puerto, índice inicial y cantidad de registros antes de probar.");
			setTestRowsAnalizador([]);
			return;
		}

		setIsTestingAnalizador(true);
		setTestErrorAnalizador("");
		setTestRowsAnalizador([]);

		try {
			const fetched = await leerRegistrosModbus({
				ip,
				puerto,
				indiceInicial: inicio,
				cantRegistros: cantidad,
			});
			setTestRowsAnalizador(fetched || []);
		} catch (err) {
			console.error(err);
			setTestErrorAnalizador(err?.message || "Error de red o al intentar leer los registros.");
			setTestRowsAnalizador([]);
		} finally {
			setIsTestingAnalizador(false);
		}
	};

	// ==========================================================================
	// GUARDAR CAMBIOS
	// ==========================================================================
	const handleSubmit = (e) => {
		e.preventDefault();
		const limpioNombre = nombre.trim();
		if (!limpioNombre) return;

		// Preparamos el objeto final con todos los datos limpios y convertidos a número
		const datos = {
			nombre: limpioNombre,
			color,
			periodoSegundos: periodoSegundos ? Number(periodoSegundos) : null,

			rele: {
				...rele,
				puerto: rele.puerto ? Number(rele.puerto) : null,
				indiceInicial: rele.indiceInicial ? Number(rele.indiceInicial) : null,
				cantRegistros: rele.cantRegistros ? Number(rele.cantRegistros) : null,
			},

			analizador: {
				ip: analizador.ip,
				puerto: analizador.puerto ? Number(analizador.puerto) : null,
				indiceInicial: analizador.indiceInicial ? Number(analizador.indiceInicial) : null,
				cantRegistros: analizador.cantRegistros ? Number(analizador.cantRegistros) : null,
				periodoSegundos: analizador.periodoSegundos ? Number(analizador.periodoSegundos) : null,
			},
		};

		onConfirmar(datos);
	};

	const handleEliminarClick = () => {
		if (!onEliminar) return;
		const seguro = window.confirm("¿Seguro que querés eliminar este registrador?");
		if (seguro) {
			onEliminar();
		}
	};

	// ==========================================================================
	// HANDLERS DE CAMBIOS EN INPUTS
	// ==========================================================================
	const handleChangeDatosBasicos = (campo, valor) => {
		if (campo === "nombre") setNombre(valor);
		else if (campo === "color") setColor(valor);
		else if (campo === "periodoSegundos") setPeriodoSegundos(valor);
	};

	const handleChangeRele = (campo, valor) => {
		setRele((prev) => ({ ...prev, [campo]: valor }));
	};

	const handleChangeAnalizador = (campo, valor) => {
		setAnalizador((prev) => ({ ...prev, [campo]: valor }));
	};

	// Helpers para construir la configuración actual al vuelo (para iniciar medición sin guardar)
	const buildOverrideRele = () => ({
		periodoSegundos: periodoSegundos ? Number(periodoSegundos) : undefined,
		rele: {
			ip: rele.ip.trim(),
			puerto: rele.puerto ? Number(rele.puerto) : undefined,
			indiceInicial: rele.indiceInicial ? Number(rele.indiceInicial) : undefined,
			cantRegistros: rele.cantRegistros ? Number(rele.cantRegistros) : undefined,
		},
	});

	const buildOverrideAnalizador = () => ({
		analizador: {
			ip: analizador.ip.trim(),
			puerto: analizador.puerto ? Number(analizador.puerto) : undefined,
			indiceInicial: analizador.indiceInicial ? Number(analizador.indiceInicial) : undefined,
			cantRegistros: analizador.cantRegistros ? Number(analizador.cantRegistros) : undefined,
			periodoSegundos: analizador.periodoSegundos ? Number(analizador.periodoSegundos) : undefined,
		},
	});

	return (
		<div className="alim-modal-overlay">
			<div className="alim-modal">
				<h2>
					{modo === "editar" ? "EDITAR REGISTRADOR: EN " : "NUEVO REGISTRADOR: EN "}
					{puestoNombre}
				</h2>

				<form onSubmit={handleSubmit}>
					<div className="alim-modal-layout">
						{/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
						<div className="alim-modal-left">

							{/* 1. Datos Básicos (Nombre, Color) */}
							<FormularioDatosBasicos
								nombre={nombre}
								color={color}
								periodoSegundos={periodoSegundos}
								onChange={handleChangeDatosBasicos}
							/>

							{/* 2. Pestañas para elegir qué configurar */}
							<div className="alim-tabs">
								<button
									type="button"
									className={"alim-tab" + (tab === "rele" ? " alim-tab-active" : "")}
									onClick={() => setTab("rele")}
								>
									RELÉ
								</button>
								<button
									type="button"
									className={"alim-tab" + (tab === "analizador" ? " alim-tab-active" : "")}
									onClick={() => setTab("analizador")}
								>
									ANALIZADOR
								</button>
							</div>

							{/* 3. Contenido de la Pestaña RELÉ */}
							{tab === "rele" && (
								<TabConfiguracionRele
									config={rele}
									periodoSegundos={periodoSegundos}
									onChange={handleChangeRele}
									onChangePeriodo={setPeriodoSegundos}
									onTestConexion={handleTestConexionRele}
									isTesting={isTestingRele}
									testError={testErrorRele}
									testRows={testRowsRele}
									isMeasuring={isMeasuringRele}
									onToggleMedicion={() =>
										onToggleMedicionRele &&
										onToggleMedicionRele(buildOverrideRele())
									}
									registrosMedicion={registrosRele}
									disabled={isMeasuringRele}
								/>
							)}

							{/* 4. Contenido de la Pestaña ANALIZADOR */}
							{tab === "analizador" && (
								<TabConfiguracionAnalizador
									config={analizador}
									onChange={handleChangeAnalizador}
									onTestConexion={handleTestConexionAnalizador}
									isTesting={isTestingAnalizador}
									testError={testErrorAnalizador}
									testRows={testRowsAnalizador}
									isMeasuring={isMeasuringAnalizador}
									onToggleMedicion={() =>
										onToggleMedicionAnalizador &&
										onToggleMedicionAnalizador(buildOverrideAnalizador())
									}
									registrosMedicion={registrosAnalizador}
									disabled={isMeasuringAnalizador}
								/>
							)}
						</div>
					</div>

					{/* BOTONES INFERIORES */}
					<div className="alim-modal-actions">
						{modo === "editar" && (
							<button
								type="button"
								className="alim-modal-btn alim-modal-btn-eliminar"
								onClick={handleEliminarClick}
							>
								Eliminar
							</button>
						)}

						<button
							type="button"
							className="alim-modal-btn alim-modal-btn-cancelar"
							onClick={onCancelar}
						>
							Cancelar
						</button>

						<button
							type="submit"
							className="alim-modal-btn alim-modal-btn-aceptar"
						>
							Guardar
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ModalConfiguracionAlimentador;
