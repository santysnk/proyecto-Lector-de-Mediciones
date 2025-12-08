// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfiguracionAlimentador.jsx

import React, { useEffect, useState } from "react";                 // React + hooks para estado y efectos
import "./ModalConfiguracionAlimentador.css";                       // estilos específicos de este modal
import { leerRegistrosModbus } from "../../utilidades/clienteModbus"; // helper que hace la llamada Modbus vía backend
import { COLORES_SISTEMA } from "../../constantes/colores";         // paleta de colores para los alimentadores

// Subcomponentes de configuración
import FormularioDatosBasicos from "./configuracion/FormularioDatosBasicos.jsx"; // nombre + color + período
import TabConfiguracionRele from "./configuracion/TabConfiguracionRele.jsx";     // pestaña de configuración del relé
import TabConfiguracionAnalizador from "./configuracion/TabConfiguracionAnalizador.jsx"; // pestaña de configuración del analizador

const ModalConfiguracionAlimentador = ({
	abierto,                                              // si es false, el modal no se muestra
	puestoNombre,                                         // nombre del puesto donde vive este registrador
	modo = "crear",                                       // "crear" | "editar" (cambia textos y botón Eliminar)
	initialData,                                          // datos actuales del alimentador (cuando se edita)
	onCancelar,                                           // callback al cerrar sin guardar
	onConfirmar,                                          // callback al confirmar los datos
	onEliminar,                                           // callback al eliminar el registrador

	// Estado/control de medición en tiempo real (por equipo)
	isMeasuringRele = false,                              // si el relé está midiendo ahora mismo
	isMeasuringAnalizador = false,                        // si el analizador está midiendo ahora mismo
	onToggleMedicionRele,                                 // función para arrancar/detener medición de relé
	onToggleMedicionAnalizador,                           // idem para analizador
	registrosRele = [],                                   // últimas lecturas del relé (para mostrar en el tab)
	registrosAnalizador = [],                             // últimas lecturas del analizador
}) => {
	// Datos básicos del alimentador
	const [nombre, setNombre] = useState("");             // nombre visible de la tarjeta
	const [color, setColor] = useState(COLORES_SISTEMA[0]); // color de botón/tarjeta
	const [tab, setTab] = useState("rele");               // pestaña activa: "rele" | "analizador"

	// Config RELÉ (dirección Modbus + rango de registros)
	const [rele, setRele] = useState({
		ip: "",
		puerto: "",
		indiceInicial: "",
		cantRegistros: "",
	});
	const [periodoSegundos, setPeriodoSegundos] = useState("60"); // período de lectura para el relé

	// Config ANALIZADOR
	const [analizador, setAnalizador] = useState({
		ip: "",
		puerto: "",
		indiceInicial: "",
		cantRegistros: "",
		periodoSegundos: "60",
	});

	// Estado de TEST de lectura por equipo (vista previa de registros)
	const [isTestingRele, setIsTestingRele] = useState(false);
	const [testErrorRele, setTestErrorRele] = useState("");
	const [testRowsRele, setTestRowsRele] = useState([]);

	const [isTestingAnalizador, setIsTestingAnalizador] = useState(false);
	const [testErrorAnalizador, setTestErrorAnalizador] = useState("");
	const [testRowsAnalizador, setTestRowsAnalizador] = useState([]);

	// === Cargar datos al abrir ===
	useEffect(() => {
		if (!abierto) return;                             // si se cerró, no hago nada

		if (initialData) {
			// Modo edición: cargo valores guardados
			setNombre(initialData.nombre || "");
			setColor(initialData.color || COLORES_SISTEMA[0]);
			setTab("rele");

			setRele({
				ip: initialData.rele?.ip || "",
				puerto:
					initialData.rele?.puerto != null
						? String(initialData.rele.puerto)
						: "",
				indiceInicial:
					initialData.rele?.indiceInicial != null
						? String(initialData.rele.indiceInicial)
						: "",
				cantRegistros:
					initialData.rele?.cantRegistros != null
						? String(initialData.rele.cantRegistros)
						: "",
			});

			setPeriodoSegundos(
				initialData.periodoSegundos != null
					? String(initialData.periodoSegundos)
					: "60"
			);

			setAnalizador({
				ip: initialData.analizador?.ip || "",
				puerto:
					initialData.analizador?.puerto != null
						? String(initialData.analizador.puerto)
						: "",
				indiceInicial:
					initialData.analizador?.indiceInicial != null
						? String(initialData.analizador.indiceInicial)
						: "",
				cantRegistros:
					initialData.analizador?.cantRegistros != null
						? String(initialData.analizador.cantRegistros)
						: "",
				periodoSegundos:
					initialData.analizador?.periodoSegundos != null
						? String(initialData.analizador.periodoSegundos)
						: "60",
			});
		} else {
			// Modo creación: arranco con valores por defecto
			setNombre("");
			setColor(COLORES_SISTEMA[0]);
			setTab("rele");

			setRele({
				ip: "",
				puerto: "",
				indiceInicial: "",
				cantRegistros: "",
			});
			setPeriodoSegundos("60");

			setAnalizador({
				ip: "",
				puerto: "",
				indiceInicial: "",
				cantRegistros: "",
				periodoSegundos: "60",
			});
		}

		// Reset del estado de tests cada vez que se abre
		setIsTestingRele(false);
		setTestErrorRele("");
		setTestRowsRele([]);

		setIsTestingAnalizador(false);
		setTestErrorAnalizador("");
		setTestRowsAnalizador([]);
	}, [abierto, initialData]);

	if (!abierto) return null;                            // si el modal está cerrado, no renderizo nada

	// === TEST CONEXIÓN RELÉ ===
	const handleTestConexionRele = async () => {
		const ip = rele.ip.trim();
		const puerto = Number(rele.puerto);
		const inicio = Number(rele.indiceInicial);
		const cantidad = Number(rele.cantRegistros);

		if (!ip || !puerto || isNaN(inicio) || isNaN(cantidad) || cantidad <= 0) {
			setTestErrorRele(
				"Completa IP, puerto, indice inicial y cantidad de registros antes de probar."
			);
			setTestRowsRele([]);
			return;
		}

		setIsTestingRele(true);
		setTestErrorRele("");
		setTestRowsRele([]);

		try {
			const fetched = await leerRegistrosModbus({
				ip,
				puerto,
				indiceInicial: inicio,
				cantRegistros: cantidad,
			});

			setTestRowsRele(fetched || []);               // guardo las filas de prueba
		} catch (err) {
			console.error(err);
			setTestErrorRele(
				err?.message || "Error de red o al intentar leer los registros."
			);
			setTestRowsRele([]);
		} finally {
			setIsTestingRele(false);
		}
	};

	// === TEST CONEXIÓN ANALIZADOR ===
	const handleTestConexionAnalizador = async () => {
		const ip = analizador.ip.trim();
		const puerto = Number(analizador.puerto);
		const inicio = Number(analizador.indiceInicial);
		const cantidad = Number(analizador.cantRegistros);

		if (!ip || !puerto || isNaN(inicio) || isNaN(cantidad) || cantidad <= 0) {
			setTestErrorAnalizador(
				"Completa IP, puerto, indice inicial y cantidad de registros antes de probar."
			);
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
			setTestErrorAnalizador(
				err?.message || "Error de red o al intentar leer los registros."
			);
			setTestRowsAnalizador([]);
		} finally {
			setIsTestingAnalizador(false);
		}
	};

	// === SUBMIT GENERAL ===
	const handleSubmit = (e) => {
		e.preventDefault();
		const limpioNombre = nombre.trim();
		if (!limpioNombre) return;                        // si no hay nombre, no confirmo

		// Armo un objeto "plano" con números donde corresponde
		const datos = {
			nombre: limpioNombre,
			color,
			periodoSegundos: periodoSegundos ? Number(periodoSegundos) : null,

			rele: {
				...rele,
				puerto: rele.puerto ? Number(rele.puerto) : null,
				indiceInicial: rele.indiceInicial
					? Number(rele.indiceInicial)
					: null,
				cantRegistros: rele.cantRegistros
					? Number(rele.cantRegistros)
					: null,
			},

			analizador: {
				ip: analizador.ip,
				puerto: analizador.puerto ? Number(analizador.puerto) : null,
				indiceInicial: analizador.indiceInicial
					? Number(analizador.indiceInicial)
					: null,
				cantRegistros: analizador.cantRegistros
					? Number(analizador.cantRegistros)
					: null,
				periodoSegundos: analizador.periodoSegundos
					? Number(analizador.periodoSegundos)
					: null,
			},
		};

		onConfirmar(datos);                                // devuelvo todos los datos al componente padre
	};

	const handleEliminarClick = () => {
		if (!onEliminar) return;
		const seguro = window.confirm(
			"¿Seguro que querés eliminar este registrador?"
		);
		if (seguro) {
			onEliminar();
		}
	};

	// === Handlers para cambios de formularios ===
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

	// === Helpers para overrides de medición (sin guardar) ===
	// Sirven para arrancar/detener lecturas en vivo sin tocar aún los datos persistidos.
	const buildOverrideRele = () => ({
		periodoSegundos: periodoSegundos ? Number(periodoSegundos) : undefined,
		rele: {
			ip: rele.ip.trim(),
			puerto: rele.puerto ? Number(rele.puerto) : undefined,
			indiceInicial: rele.indiceInicial
				? Number(rele.indiceInicial)
				: undefined,
			cantRegistros: rele.cantRegistros
				? Number(rele.cantRegistros)
				: undefined,
		},
	});

	const buildOverrideAnalizador = () => ({
		analizador: {
			ip: analizador.ip.trim(),
			puerto: analizador.puerto ? Number(analizador.puerto) : undefined,
			indiceInicial: analizador.indiceInicial
				? Number(analizador.indiceInicial)
				: undefined,
			cantRegistros: analizador.cantRegistros
				? Number(analizador.cantRegistros)
				: undefined,
			periodoSegundos: analizador.periodoSegundos
				? Number(analizador.periodoSegundos)
				: undefined,
		},
	});

	return (
		<div className="alim-modal-overlay">
			<div className="alim-modal">
				<h2>
					{modo === "editar"
						? "EDITAR REGISTRADOR: EN "
						: "NUEVO REGISTRADOR: EN "}
					{puestoNombre}
				</h2>

				<form onSubmit={handleSubmit}>
					<div className="alim-modal-layout">
						{/* === COLUMNA IZQUIERDA: CONFIG BÁSICA === */}
						<div className="alim-modal-left">
							{/* Formulario de datos básicos (nombre, color, período general) */}
							<FormularioDatosBasicos
								nombre={nombre}
								color={color}
								onChange={handleChangeDatosBasicos}
							/>

							{/* Tabs RELÉ / ANALIZADOR */}
							<div className="alim-tabs">
								<button
									type="button"
									className={
										"alim-tab" +
										(tab === "rele" ? " alim-tab-active" : "")
									}
									onClick={() => setTab("rele")}
								>
									RELÉ
								</button>
								<button
									type="button"
									className={
										"alim-tab" +
										(tab === "analizador" ? " alim-tab-active" : "")
									}
									onClick={() => setTab("analizador")}
								>
									ANALIZADOR
								</button>
							</div>

							{/* === TAB RELÉ === */}
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

							{/* === TAB ANALIZADOR === */}
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
										onToggleMedicionAnalizador(
											buildOverrideAnalizador()
										)
									}
									registrosMedicion={registrosAnalizador}
									disabled={isMeasuringAnalizador}
								/>
							)}
						</div>
					</div>

					{/* Botones inferiores */}
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

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (ModalConfiguracionAlimentador.jsx)

 - Este modal es el "panel de configuración profunda" de cada registrador
   (alimentador). Acá defino nombre, color y cómo se conectan el relé y el
   analizador (IP, puerto, rango de registros y períodos de lectura).

 - `initialData` se usa para distinguir entre modo creación y edición. El
   efecto `useEffect` inicializa todos los estados locales a partir de esos
   datos o de valores por defecto cuando no hay nada guardado.

 - Las funciones `handleTestConexionRele` y `handleTestConexionAnalizador`
   hacen una prueba puntual de lectura usando `leerRegistrosModbus`, sólo
   para verificar conectividad y rango de registros sin guardar todavía la
   configuración.

 - `handleSubmit` construye un objeto plano `datos` con números ya convertidos
   (en vez de strings) y lo envía al padre vía `onConfirmar`, que es quien
   realmente persiste el alimentador.

 - Los helpers `buildOverrideRele` y `buildOverrideAnalizador` sirven para
   arrancar/detener mediciones en tiempo real sobre configuraciones que aún
   no fueron guardadas definitivamente, ideal para "probar" antes de confirmar.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (ModalConfiguracionAlimentador.jsx)

0) Visión general del componente

   `ModalConfiguracionAlimentador` es el panel de configuración completa de un
   registrador (alimentador). Desde acá se define:

   - Identidad visual:
       • nombre de la tarjeta,
       • color de botón/fondo del alimentador.

   - Conexión del relé:
       • IP, puerto, índice inicial y cantidad de registros Modbus,
       • período de lectura.

   - Conexión del analizador:
       • parámetros equivalentes para el equipo analizador,
       • período de lectura propio.

   También permite:
   - Probar la lectura de registros (TEST) sin guardar la configuración.
   - Encender/apagar mediciones en tiempo real (usando “overrides” temporales).
   - Eliminar el alimentador en modo edición.


1) Props del componente

   const ModalConfiguracionAlimentador = ({
     abierto,
     puestoNombre,
     modo = "crear",
     initialData,
     onCancelar,
     onConfirmar,
     onEliminar,
     isMeasuringRele,
     isMeasuringAnalizador,
     onToggleMedicionRele,
     onToggleMedicionAnalizador,
     registrosRele,
     registrosAnalizador,
   }) => { ... }

   - `abierto` (boolean):
       • false → el modal no se renderiza (devuelve `null`).
       • true  → se dibuja overlay + contenido del modal.

   - `puestoNombre` (string):
       • nombre del puesto donde está este registrador,
       • se muestra en el título del modal.

   - `modo` ("crear" | "editar"):
       • cambia el texto del título,
       • en modo "editar" se habilita el botón “Eliminar”.

   - `initialData` (objeto o undefined):
       • datos actuales del alimentador (al editar),
       • si no existe, se asumen valores por defecto (modo alta).

   - `onCancelar()`:
       • se llama al pulsar “Cancelar”.

   - `onConfirmar(datos)`:
       • recibe un objeto con toda la configuración:
         { nombre, color, periodoSegundos, rele: {...}, analizador: {...} }
       • el padre se encarga de persistirlo.

   - `onEliminar()` (opcional):
       • si viene definido, se invoca tras una confirmación con `window.confirm`.

   - `isMeasuringRele` / `isMeasuringAnalizador`:
       • indican si actualmente hay medición en vivo en cada equipo.

   - `onToggleMedicionRele(override?)` / `onToggleMedicionAnalizador(override?)`:
       • funciones que prenden/apagan la medición utilizando, si se pasa,
         una configuración “override” temporal (sin tocar lo persistido).

   - `registrosRele` / `registrosAnalizador`:
       • últimas lecturas reales, usadas para mostrar tablas/listas de registros
         en las pestañas.


2) Estado local principal

   - Datos básicos:

     const [nombre, setNombre] = useState("");
     const [color, setColor] = useState(COLORES_SISTEMA[0]);
     const [tab, setTab] = useState("rele");

     • `nombre`: texto que se muestra en la tarjeta/alimentador.
     • `color`: color base que se usará en la UI.
     • `tab`: pestaña activa ("rele" o "analizador").

   - Configuración relé:

     const [rele, setRele] = useState({
       ip: "",
       puerto: "",
       indiceInicial: "",
       cantRegistros: "",
     });
     const [periodoSegundos, setPeriodoSegundos] = useState("60");

     • `rele`: guarda los campos de configuración Modbus del relé en formato string.
     • `periodoSegundos`: período de lectura general del relé (string en la UI,
       luego se convierte a número en el submit).

   - Configuración analizador:

     const [analizador, setAnalizador] = useState({
       ip: "",
       puerto: "",
       indiceInicial: "",
       cantRegistros: "",
       periodoSegundos: "60",
     });

     • Similar a `rele`, pero con `periodoSegundos` específico del analizador.

   - Estado de TEST:

     Para cada equipo (relé / analizador) se guarda:

     • `isTestingRele` / `isTestingAnalizador`: bandera de “estoy probando”.
     • `testErrorRele` / `testErrorAnalizador`: mensaje de error si falla el test.
     • `testRowsRele` / `testRowsAnalizador`: registros devueltos en la prueba.


3) Carga de datos al abrir (useEffect)

   useEffect(() => {
     if (!abierto) return;

     if (initialData) {
       // modo edición: cargo valores guardados
       ...
     } else {
       // modo creación: valores por defecto
       ...
     }

     // reset de estados de test
     ...
   }, [abierto, initialData]);

   - El efecto se dispara cuando:
       • el modal pasa a `abierto = true`,
       • o cambian los datos iniciales (`initialData`).

   - Modo edición:
       • `setNombre(initialData.nombre || "")`,
       • `setColor(initialData.color || COLORES_SISTEMA[0])`,
       • rellena objetos `rele` y `analizador` a partir de `initialData.rele`
         e `initialData.analizador`,
       • todos los campos numéricos (puerto, índice, cantidad, períodos) se
         transforman a string para mostrarlos en inputs de texto.

   - Modo creación:
       • limpia nombre,
       • setea color por defecto,
       • deja IP/puerto/índices/cantidades vacíos,
       • períodos en "60".

   - Siempre que se abre:
       • se resetean estados de test (`isTesting*`, `testError*`, `testRows*`),
       • para evitar que queden mensajes o resultados de pruebas anteriores.


4) Test de conexión del relé

   const handleTestConexionRele = async () => {
     const ip = rele.ip.trim();
     const puerto = Number(rele.puerto);
     const inicio = Number(rele.indiceInicial);
     const cantidad = Number(rele.cantRegistros);

     // validación mínima
     if (!ip || !puerto || isNaN(inicio) || isNaN(cantidad) || cantidad <= 0) {
       ...
       return;
     }

     setIsTestingRele(true);
     setTestErrorRele("");
     setTestRowsRele([]);

     try {
       const fetched = await leerRegistrosModbus({...});
       setTestRowsRele(fetched || []);
     } catch (err) {
       setTestErrorRele(...);
       setTestRowsRele([]);
     } finally {
       setIsTestingRele(false);
     }
   };

   - Objetivo: hacer una lectura puntual para verificar:
       • que la IP responde,
       • que el puerto está escuchando,
       • que el rango de registros es válido.

   - Pasos:
       1) Toma los valores del estado `rele`, los convierte a número.
       2) Valida que estén completos y bien formados.
       3) Marca `isTestingRele = true` y limpia errores/resultados previos.
       4) Llama a `leerRegistrosModbus` (cliente que habla con el backend).
       5) Si funciona, guarda las filas en `testRowsRele` (para mostrarlas en la UI).
       6) Si falla, captura el mensaje en `testErrorRele`.
       7) En el `finally`, deja `isTestingRele = false` (se terminó la prueba).


5) Test de conexión del analizador

   - `handleTestConexionAnalizador` es simétrico a la función del relé, pero
     trabajando sobre el objeto `analizador` y sus estados de test.

   - Permite comprobar la conexión de ese equipo sin afectar la configuración
     guardada ni el ciclo normal de mediciones.


6) Submit general (guardar configuración)

   const handleSubmit = (e) => {
     e.preventDefault();
     const limpioNombre = nombre.trim();
     if (!limpioNombre) return;

     const datos = {
       nombre: limpioNombre,
       color,
       periodoSegundos: periodoSegundos ? Number(periodoSegundos) : null,
       rele: { ... },
       analizador: { ... },
     };

     onConfirmar(datos);
   };

   - Se ejecuta al enviar el formulario principal.

   - Valida que haya un nombre no vacío:
       • si el nombre queda vacío, simplemente no hace nada.

   - Construye un objeto `datos`:
       • `nombre` sin espacios sobrantes,
       • `color` tal cual,
       • `periodoSegundos` convertido a número o `null` si está vacío,
       • `rele` y `analizador` con sus campos numéricos ya parseados.

   - Llama a `onConfirmar(datos)`:
       • el componente padre decidirá si ese objeto se guarda como nuevo
         alimentador o actualiza uno existente.


7) Eliminación del registrador

   const handleEliminarClick = () => {
     if (!onEliminar) return;
     const seguro = window.confirm("¿Seguro que querés eliminar este registrador?");
     if (seguro) onEliminar();
   };

   - Solo tiene sentido en modo edición (por eso el botón se muestra solo cuando
     `modo === "editar"`).

   - Pide confirmación al usuario con `window.confirm`.
   - Si el usuario acepta, llama a `onEliminar()` y el padre se encarga de:
       • detener mediciones,
       • quitar el alimentador de la lista,
       • persistir el cambio.


8) Handlers de los subformularios

   - Datos básicos:

     const handleChangeDatosBasicos = (campo, valor) => {
       if (campo === "nombre") setNombre(valor);
       else if (campo === "color") setColor(valor);
       else if (campo === "periodoSegundos") setPeriodoSegundos(valor);
     };

     • `FormularioDatosBasicos` llama a este handler con pares (campo, valor).
     • Centraliza cómo se mapean esos cambios al estado principal.

   - Relé:

     const handleChangeRele = (campo, valor) => {
       setRele((prev) => ({ ...prev, [campo]: valor }));
     };

   - Analizador:

     const handleChangeAnalizador = (campo, valor) => {
       setAnalizador((prev) => ({ ...prev, [campo]: valor }));
     };

   - En ambos casos se usa el patrón inmutable:
       • copiar el estado anterior,
       • sobreescribir solo la propiedad modificada.


9) Overrides de medición (prueba sin guardar)

   - buildOverrideRele:

     const buildOverrideRele = () => ({
       periodoSegundos: periodoSegundos ? Number(periodoSegundos) : undefined,
       rele: {
         ip: rele.ip.trim(),
         puerto: rele.puerto ? Number(rele.puerto) : undefined,
         indiceInicial: ...,
         cantRegistros: ...,
       },
     });

   - buildOverrideAnalizador:

     const buildOverrideAnalizador = () => ({
       analizador: {
         ip: analizador.ip.trim(),
         puerto: ...,
         indiceInicial: ...,
         cantRegistros: ...,
         periodoSegundos: ...,
       },
     });

   - Idea de “override”:
       • Es un objeto parcial de configuración que se pasa a `onToggleMedicion*`.
       • Le dice al sistema de mediciones:
           “Para esta medición puntual, usá estos parámetros en vez de los
            guardados en el alimentador”.
       • No modifica la copia persistida; solo afecta a la medición en vivo.

   - Uso en los tabs:

     onToggleMedicion={() =>
       onToggleMedicionRele &&
       onToggleMedicionRele(buildOverrideRele())
     }

     • Si existe `onToggleMedicionRele`, se llama pasándole el override armado
       con los datos que el usuario ve actualmente en el modal.


10) JSX y estructura general

   - Overlay y contenedor:

     <div className="alim-modal-overlay">
       <div className="alim-modal">
         <h2>...</h2>
         <form onSubmit={handleSubmit}>...</form>
       </div>
     </div>

     • `alim-modal-overlay` oscurece el fondo.
     • `alim-modal` es la caja central del diálogo.

   - Título:

     {modo === "editar" ? "EDITAR REGISTRADOR: EN " : "NUEVO REGISTRADOR: EN "}
     {puestoNombre}

     • Cambia el texto según se esté creando o editando.
     • Siempre muestra el nombre del puesto al final.

   - Layout principal:

     <div className="alim-modal-layout">
       <div className="alim-modal-left">
         <FormularioDatosBasicos ... />
         // tabs RELÉ / ANALIZADOR
         // contenido de cada tab (TabConfiguracionRele / TabConfiguracionAnalizador)
       </div>
     </div>

     • La columna izquierda concentra:
         - datos básicos,
         - tabs de configuración de relé y analizador,
         - formularios completos de cada equipo.

   - Tabs:

     Dos botones:
       • “RELÉ” → activa `tab === "rele"`,
       • “ANALIZADOR” → activa `tab === "analizador"`.

     La clase `"alim-tab-active"` marca visualmente la pestaña activa.

   - Subcomponentes de pestañas:

     • `TabConfiguracionRele` recibe:
         - `config` (IP/puerto/índices/cantRegistros),
         - `periodoSegundos` del relé,
         - handlers de cambio y test,
         - estado de test,
         - flags de medición en vivo,
         - `registrosMedicion` para mostrar lecturas de prueba o en vivo,
         - `disabled` para deshabilitar campos si ya está midiendo.

     • `TabConfiguracionAnalizador` recibe argumentos análogos, pero específicos
       del analizador.

   - Botones inferiores:

     • “Eliminar” (solo en modo edición):
         - llama a `handleEliminarClick`.

     • “Cancelar”:
         - llama a `onCancelar`,
         - no guarda nada.

     • “Guardar”:
         - envía el formulario (`handleSubmit`),
         - dispara `onConfirmar(datos)`.

---------------------------------------------------------------------------*/