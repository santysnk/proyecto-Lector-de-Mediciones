// src/paginas/PaginaAlimentadores/componentes/modales/ModalMapeoMediciones.jsx

import React, { useEffect, useState } from "react";              // React + hooks para estado y efectos
import "./ModalMapeoMediciones.css";                             // estilos específicos del modal de mapeo
import FormularioDiseñoTarjeta from "./mapeo/FormularioDiseñoTarjeta.jsx"; // subformulario para configurar cada lado de la tarjeta
import { leerRegistrosModbus } from "../../utilidades/clienteModbus";     // cliente Modbus para cargar registros
import { COLORES_SISTEMA } from "../../constantes/colores";               // paleta de colores para fallback

// ---- helpers para diseño de card ----
function crearSideDesignDefault(tituloIdPorDefecto) {
	return {
		tituloId: tituloIdPorDefecto, // id de magnitud (corriente_132, tension_linea, etc.)
		tituloCustom: "",             // texto libre si se elige "custom"
		cantidad: 3,                  // por defecto mostramos 3 boxes
		boxes: [
			// 4 boxes potenciales, aunque `cantidad` puede ser 1..4
			{
				enabled: false,
				label: "",
				registro: "",
				origen: "",
				formula: "",
			},
			{
				enabled: false,
				label: "",
				registro: "",
				origen: "",
				formula: "",
			},
			{
				enabled: false,
				label: "",
				registro: "",
				origen: "",
				formula: "",
			},
			{
				enabled: false,
				label: "",
				registro: "",
				origen: "",
				formula: "",
			},
		],
	};
}

function crearCardDesignDefault() {
	return {
		superior: crearSideDesignDefault("corriente_132"), // por defecto parecido a "CONSUMO (A)"
		inferior: crearSideDesignDefault("tension_linea"), // por defecto parecido a "TENSIÓN (kV)"
	};
}

// ---- mapeo vacío: sólo diseño de tarjeta ----
// Como no usamos más las "secciones clásicas", el mapeo se reduce a `cardDesign`.
function crearMapeoVacio() {
	return {
		cardDesign: crearCardDesignDefault(),
	};
}

const ModalMapeoMediciones = ({ abierto, alimentador, onCerrar, onGuardar }) => {
	const nombreAlimentador = alimentador?.nombre || "";          // solo para mostrar en el título
	const initialMapeo = alimentador?.mapeoMediciones;            // mapeo previamente guardado (si existe)
	const [mapeo, setMapeo] = useState(crearMapeoVacio);          // estado completo del mapeo (por ahora, sólo cardDesign)

	// Estado para la carga de registros Modbus
	const [registrosRele, setRegistrosRele] = useState([]);           // registros cargados del relé
	const [registrosAnalizador, setRegistrosAnalizador] = useState([]); // registros cargados del analizador
	const [cargandoRele, setCargandoRele] = useState(false);          // loading del relé
	const [cargandoAnalizador, setCargandoAnalizador] = useState(false); // loading del analizador
	const [errorRele, setErrorRele] = useState("");                   // error al cargar relé
	const [errorAnalizador, setErrorAnalizador] = useState("");       // error al cargar analizador
	const [registrosColapsados, setRegistrosColapsados] = useState(false); // toggle para colapsar vista previa


	// Al abrir el modal, mezclamos el mapeo anterior con la estructura base del cardDesign
	useEffect(() => {
		if (!abierto) return;

		// Resetear registros cargados al abrir
		setRegistrosRele([]);
		setRegistrosAnalizador([]);
		setErrorRele("");
		setErrorAnalizador("");

		const baseCardDesign = crearCardDesignDefault();

		// Si nunca se configuró, arrancamos con el diseño por defecto
		if (!initialMapeo || !initialMapeo.cardDesign) {
			setMapeo({ cardDesign: baseCardDesign });
			return;
		}

		// Mezcla cardDesign guardado con el esqueleto por defecto
		const defCD = baseCardDesign;
		const guardCD = initialMapeo.cardDesign;

		const mergeSide = (sideName) => {
			const defSide = defCD[sideName];
			const guardSide = guardCD[sideName] || {};

			const boxesDef = defSide.boxes || [];
			const boxesGuard = guardSide.boxes || [];

			const mergedBoxes = boxesDef.map((bDef, idx) => {
				const bGuard = boxesGuard[idx] || {};
				return {
					...bDef,
					...bGuard,
					origen: bGuard.origen || bDef.origen || "rele",
				};
			});

			const cantGuard = guardSide.cantidad;
			const cantidad =
				typeof cantGuard === "number" &&
				cantGuard >= 1 &&
				cantGuard <= 4
					? cantGuard
					: defSide.cantidad;

			return {
				...defSide,
				...guardSide,
				boxes: mergedBoxes,
				cantidad,
				tituloId: guardSide.tituloId || defSide.tituloId,
				tituloCustom: guardSide.tituloCustom || "",
			};
		};

		setMapeo({
			cardDesign: {
				superior: mergeSide("superior"),
				inferior: mergeSide("inferior"),
			},
		});
	}, [abierto, initialMapeo]);

	if (!abierto) return null;

	// --- funciones para cargar registros Modbus ---
	const cargarRegistrosRele = async () => {
		const config = alimentador?.rele;
		if (!config?.ip || !config?.puerto || config?.indiceInicial == null || !config?.cantRegistros) {
			setErrorRele("El relé no tiene configuración completa (IP, puerto, índice, cantidad).");
			return;
		}

		setCargandoRele(true);
		setErrorRele("");

		try {
			const registros = await leerRegistrosModbus({
				ip: config.ip,
				puerto: config.puerto,
				indiceInicial: config.indiceInicial,
				cantRegistros: config.cantRegistros,
			});
			setRegistrosRele(registros || []);
		} catch (err) {
			console.error("Error cargando registros del relé:", err);
			setErrorRele(err?.message || "Error al leer registros del relé.");
			setRegistrosRele([]);
		} finally {
			setCargandoRele(false);
		}
	};

	const cargarRegistrosAnalizador = async () => {
		const config = alimentador?.analizador;
		if (!config?.ip || !config?.puerto || config?.indiceInicial == null || !config?.cantRegistros) {
			setErrorAnalizador("El analizador no tiene configuración completa (IP, puerto, índice, cantidad).");
			return;
		}

		setCargandoAnalizador(true);
		setErrorAnalizador("");

		try {
			const registros = await leerRegistrosModbus({
				ip: config.ip,
				puerto: config.puerto,
				indiceInicial: config.indiceInicial,
				cantRegistros: config.cantRegistros,
			});
			setRegistrosAnalizador(registros || []);
		} catch (err) {
			console.error("Error cargando registros del analizador:", err);
			setErrorAnalizador(err?.message || "Error al leer registros del analizador.");
			setRegistrosAnalizador([]);
		} finally {
			setCargandoAnalizador(false);
		}
	};

	// --- helpers actualización cardDesign ---
	const asegurarCardDesign = (prev) => {
		const base = prev.cardDesign || crearCardDesignDefault();
		const cd = { ...base };
		if (!cd.superior)
			cd.superior = crearSideDesignDefault("corriente_132");
		if (!cd.inferior)
			cd.inferior = crearSideDesignDefault("tension_linea");
		return cd;
	};

	const actualizarCantidadBoxes = (zona, nuevaCant) => {
		const cant = Math.min(4, Math.max(1, nuevaCant || 1));    // limita a [1,4]
		setMapeo((prev) => {
			const cd = asegurarCardDesign(prev);
			return {
				...prev,
				cardDesign: {
					...cd,
					[zona]: {
						...cd[zona],
						cantidad: cant,
					},
				},
			};
		});
	};

	const actualizarTituloSeleccionado = (zona, tituloId) => {
		setMapeo((prev) => {
			const cd = asegurarCardDesign(prev);
			const side = cd[zona];
			return {
				...prev,
				cardDesign: {
					...cd,
					[zona]: {
						...side,
						tituloId,
					},
				},
			};
		});
	};

	const actualizarTituloCustom = (zona, texto) => {
		setMapeo((prev) => {
			const cd = asegurarCardDesign(prev);
			const side = cd[zona];
			return {
				...prev,
				cardDesign: {
					...cd,
					[zona]: {
						...side,
						tituloId: "custom",
						tituloCustom: texto,
					},
				},
			};
		});
	};

	const actualizarCardDesignCaja = (zona, index, campo, valor) => {
		setMapeo((prev) => {
			const cd = asegurarCardDesign(prev);
			const side = cd[zona];
			const boxes = side.boxes ? [...side.boxes] : [];
			// aseguramos tener siempre 4 posiciones
			while (boxes.length < 4) {
				boxes.push({
					enabled: false,
					label: "",
					registro: "",
					origen: "rele",
					formula: "",
				});
			}
			boxes[index] = {
				...boxes[index],
				[campo]: valor,
			};

			return {
				...prev,
				cardDesign: {
					...cd,
					[zona]: {
						...side,
						boxes,
					},
				},
			};
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		onGuardar(mapeo);                                           // devuelve todo el mapeo al componente padre
	};

	const cardDesign = mapeo.cardDesign || crearCardDesignDefault();

	// --- Detectar registros duplicados ---
	const detectarRegistrosDuplicados = () => {
		const registrosUsados = [];
		const duplicados = [];

		// Recolectar registros de parte superior
		const boxesSuperior = cardDesign.superior?.boxes || [];
		boxesSuperior.forEach((box, idx) => {
			if (box.registro && box.registro.toString().trim() !== "") {
				const clave = `${box.origen || "rele"}-${box.registro}`;
				const info = { zona: "superior", boxNum: idx + 1, registro: box.registro, origen: box.origen || "rele" };

				const existente = registrosUsados.find(r => r.clave === clave);
				if (existente) {
					duplicados.push({ ...info, duplicadoCon: existente.info });
				} else {
					registrosUsados.push({ clave, info });
				}
			}
		});

		// Recolectar registros de parte inferior
		const boxesInferior = cardDesign.inferior?.boxes || [];
		boxesInferior.forEach((box, idx) => {
			if (box.registro && box.registro.toString().trim() !== "") {
				const clave = `${box.origen || "rele"}-${box.registro}`;
				const info = { zona: "inferior", boxNum: idx + 1, registro: box.registro, origen: box.origen || "rele" };

				const existente = registrosUsados.find(r => r.clave === clave);
				if (existente) {
					duplicados.push({ ...info, duplicadoCon: existente.info });
				} else {
					registrosUsados.push({ clave, info });
				}
			}
		});

		return duplicados;
	};

	const registrosDuplicados = detectarRegistrosDuplicados();

	// Crear set de claves duplicadas para pasar a los ConfiguradorBox
	const clavesDuplicadas = new Set();
	registrosDuplicados.forEach((dup) => {
		// Agregar tanto el duplicado como el original
		clavesDuplicadas.add(`${dup.zona}-${dup.boxNum - 1}-${dup.origen}-${dup.registro}`);
		clavesDuplicadas.add(`${dup.duplicadoCon.zona}-${dup.duplicadoCon.boxNum - 1}-${dup.duplicadoCon.origen}-${dup.duplicadoCon.registro}`);
	});

	// Verificar si un registro específico está duplicado
	const estaRegistroDuplicado = (zona, index, origen, registro) => {
		if (!registro || registro.toString().trim() === "") return false;
		const clave = `${zona}-${index}-${origen || "rele"}-${registro}`;
		return clavesDuplicadas.has(clave);
	};

	// Obtener mensaje de duplicado para tooltip
	const obtenerMensajeDuplicado = (zona, index, origen, registro) => {
		if (!registro || registro.toString().trim() === "") return "";
		const dup = registrosDuplicados.find(
			(d) => d.zona === zona && d.boxNum === index + 1 && d.registro === registro
		);
		if (dup) {
			return `Este registro ya está usado en ${dup.duplicadoCon.zona} Box ${dup.duplicadoCon.boxNum}`;
		}
		// También puede ser el registro original que tiene duplicados
		const original = registrosDuplicados.find(
			(d) => d.duplicadoCon.zona === zona && d.duplicadoCon.boxNum === index + 1 && d.duplicadoCon.registro === registro
		);
		if (original) {
			return `Este registro también se usa en ${original.zona} Box ${original.boxNum}`;
		}
		return "";
	};

	// Color del header: usa el color del alimentador o el primer color del sistema como fallback
	const colorHeader = alimentador?.color || COLORES_SISTEMA[0];

	return (
		<div className="alim-modal-overlay">
			<div className="map-modal">
				{/* Header con fondo del color de la tarjeta del alimentador */}
				<div className="map-modal__header" style={{ backgroundColor: colorHeader }}>
					<h2 className="map-modal__title">
						Mapeo de mediciones – {nombreAlimentador}
					</h2>
				</div>

				{/* Contenido con scroll */}
				<div className="map-modal__content">
					<form onSubmit={handleSubmit} className="map-form">
						<div className="map-design">
							<p className="map-design__help">
								Elegí qué magnitudes se muestran en la parte superior e
								inferior de la tarjeta y cómo se alimentan los boxes de
								medición. Podés dejar boxes deshabilitados listos para usarlos
								más adelante.
							</p>

							{/* === SECCIÓN DE CARGA DE REGISTROS === */}
							<div className="map-registros">
								{/* Header clickeable para colapsar/expandir */}
								<div
									className="map-registros__header"
									onClick={() => setRegistrosColapsados(!registrosColapsados)}
								>
									<h4 className="map-registros__title">Vista previa de registros</h4>
									<span className={`map-registros__toggle ${registrosColapsados ? "map-registros__toggle--collapsed" : ""}`}>
										▲
									</span>
								</div>

								{/* Body colapsable */}
								<div className={`map-registros__body ${registrosColapsados ? "map-registros__body--collapsed" : ""}`}>
									<p className="map-registros__help">
										Cargá los registros del relé o analizador y <strong>arrastralos</strong> hasta
										los campos de registro de cada box para completarlos automáticamente.
									</p>

									<div className="map-registros__botones">
										<button
											type="button"
											className="map-registros__btn"
											onClick={cargarRegistrosRele}
											disabled={cargandoRele}
										>
											{cargandoRele ? "Cargando..." : "Cargar Relé"}
										</button>
										<button
											type="button"
											className="map-registros__btn"
											onClick={cargarRegistrosAnalizador}
											disabled={cargandoAnalizador}
										>
											{cargandoAnalizador ? "Cargando..." : "Cargar Analizador"}
										</button>
									</div>

									{/* Errores */}
									{errorRele && <p className="map-registros__error">{errorRele}</p>}
									{errorAnalizador && <p className="map-registros__error">{errorAnalizador}</p>}

									{/* Tablas de registros */}
									<div className="map-registros__tablas">
										{registrosRele.length > 0 && (
											<div className="map-registros__tabla-container">
												<span className="map-registros__tabla-titulo">Relé</span>
												<div className="map-registros__tabla">
													{registrosRele.map((reg) => (
														<div
															key={`rele-${reg.address}`}
															className="map-registros__chip"
															draggable
															onDragStart={(e) => {
																e.dataTransfer.setData("application/json", JSON.stringify({
																	address: reg.address,
																	origen: "rele"
																}));
																e.dataTransfer.effectAllowed = "copy";
																e.currentTarget.classList.add("dragging");
															}}
															onDragEnd={(e) => {
																e.currentTarget.classList.remove("dragging");
															}}
														>
															{reg.address}
														</div>
													))}
												</div>
											</div>
										)}

										{registrosAnalizador.length > 0 && (
											<div className="map-registros__tabla-container">
												<span className="map-registros__tabla-titulo">Analizador</span>
												<div className="map-registros__tabla">
													{registrosAnalizador.map((reg) => (
														<div
															key={`analizador-${reg.address}`}
															className="map-registros__chip"
															draggable
															onDragStart={(e) => {
																e.dataTransfer.setData("application/json", JSON.stringify({
																	address: reg.address,
																	origen: "analizador"
																}));
																e.dataTransfer.effectAllowed = "copy";
																e.currentTarget.classList.add("dragging");
															}}
															onDragEnd={(e) => {
																e.currentTarget.classList.remove("dragging");
															}}
														>
															{reg.address}
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							<FormularioDiseñoTarjeta
							zona="superior"
							tituloBloque="Parte superior"
							placeholderTitulo="CONSUMO (A)"
							design={cardDesign.superior}
							onChangeTitulo={(tituloId) =>
								actualizarTituloSeleccionado("superior", tituloId)
							}
							onChangeTituloCustom={(texto) =>
								actualizarTituloCustom("superior", texto)
							}
							onChangeCantidad={(cant) =>
								actualizarCantidadBoxes("superior", cant)
							}
							onChangeBox={(index, campo, valor) =>
								actualizarCardDesignCaja("superior", index, campo, valor)
							}
							estaRegistroDuplicado={(index, origen, registro) =>
								estaRegistroDuplicado("superior", index, origen, registro)
							}
							obtenerMensajeDuplicado={(index, origen, registro) =>
								obtenerMensajeDuplicado("superior", index, origen, registro)
							}
						/>

						<FormularioDiseñoTarjeta
							zona="inferior"
							tituloBloque="Parte inferior"
							placeholderTitulo="TENSIÓN (kV)"
							design={cardDesign.inferior}
							onChangeTitulo={(tituloId) =>
								actualizarTituloSeleccionado("inferior", tituloId)
							}
							onChangeTituloCustom={(texto) =>
								actualizarTituloCustom("inferior", texto)
							}
							onChangeCantidad={(cant) =>
								actualizarCantidadBoxes("inferior", cant)
							}
							onChangeBox={(index, campo, valor) =>
								actualizarCardDesignCaja("inferior", index, campo, valor)
							}
							estaRegistroDuplicado={(index, origen, registro) =>
								estaRegistroDuplicado("inferior", index, origen, registro)
							}
							obtenerMensajeDuplicado={(index, origen, registro) =>
								obtenerMensajeDuplicado("inferior", index, origen, registro)
							}
						/>

						</div>

						<div className="alim-modal-actions">
							<button
								type="button"
								className="alim-modal-btn alim-modal-btn-cancelar"
								onClick={onCerrar}
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
		</div>
	);
};

export default ModalMapeoMediciones;
export { crearMapeoVacio };

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (ModalMapeoMediciones.jsx)

 - Este modal permite configurar "qué" se muestra en cada lado de la tarjeta
   de un alimentador y "de dónde" salen esos valores (registro Modbus, origen,
   fórmula, etc.), usando `cardDesign.superior` e `inferior`.

 - `crearMapeoVacio` ahora sólo genera un objeto con `cardDesign` por defecto,
   porque las viejas secciones de mapeo (tensión, corriente, potencias, etc.)
   ya no se usan en la UI ni en los cálculos.

 - El `useEffect` toma cualquier `mapeoMediciones` guardado, extrae su
   `cardDesign` (si existe) y lo mezcla con el diseño por defecto para asegurar
   que siempre haya 4 boxes potenciales y valores coherentes.

 - Los helpers `actualizarCantidadBoxes`, `actualizarTituloSeleccionado`,
   `actualizarTituloCustom` y `actualizarCardDesignCaja` modifican sólo la
   parte correspondiente del `cardDesign`, manteniendo inmutabilidad del
   estado y evitando nulls con `asegurarCardDesign`.

 - Al guardar, se devuelve el objeto `mapeo` completo al padre, que lo guarda
   dentro del alimentador para que `calculosMediciones.js` pueda construir las
   lecturas que se muestran en cada tarjeta.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (ModalMapeoMediciones.jsx)

0) Visión general del componente

   `ModalMapeoMediciones` es el editor del “diseño visual” de la tarjeta de un
   alimentador. Acá no se decide cómo se calcula cada valor, sino:

   - qué título tiene cada mitad de la tarjeta (superior / inferior),
   - cuántos boxes se muestran (1 a 4),
   - y cómo está configurado cada box (etiqueta, registro, origen, fórmula).

   Toda esa información queda guardada dentro de `alimentador.mapeoMediciones`
   en la propiedad `cardDesign`, que luego usan otros módulos para construir
   las lecturas que se ven en la UI.


1) Helpers de diseño: `crearSideDesignDefault`, `crearCardDesignDefault`, `crearMapeoVacio`

   function crearSideDesignDefault(tituloIdPorDefecto) {
     return {
       tituloId: tituloIdPorDefecto,
       tituloCustom: "",
       cantidad: 3,
       boxes: [ { ... }, { ... }, { ... }, { ... } ],
     };
   }

   - Representa la configuración de UN lado de la tarjeta:
       • `tituloId`        → id de magnitud predefinida (corriente_132, tension_linea, etc.).
       • `tituloCustom`    → texto libre si se elige un título personalizado.
       • `cantidad`        → cuántos boxes se mostrarán (1..4).
       • `boxes`           → array fijo de 4 posiciones potenciales, cada una con:
                               { enabled, label, registro, origen, formula }.

   - El hecho de tener siempre 4 posiciones facilita luego:
       • limitar visualmente a 1..4 boxes,
       • pero conservar configuraciones parciales para “boxes futuros”.

   function crearCardDesignDefault() {
     return {
       superior: crearSideDesignDefault("corriente_132"),
       inferior: crearSideDesignDefault("tension_linea"),
     };
   }

   - Construye el diseño completo de la tarjeta:
       • lado superior por defecto orientado a corrientes (“CONSUMO (A)”),
       • lado inferior por defecto orientado a tensiones (“TENSIÓN (kV)”).

   function crearMapeoVacio() {
     return {
       cardDesign: crearCardDesignDefault(),
     };
   }

   - Estructura mínima de `mapeoMediciones` en esta versión:
       • ya no hay secciones clásicas, sólo `cardDesign`.
       • se usa para inicializar estado cuando nunca se configuró el mapeo.


2) Estado inicial y props

   const ModalMapeoMediciones = ({ abierto, alimentador, onCerrar, onGuardar }) => {
     const nombreAlimentador = alimentador?.nombre || "";
     const initialMapeo = alimentador?.mapeoMediciones;
     const [mapeo, setMapeo] = useState(crearMapeoVacio);
     ...
   }

   - `abierto`:
       • controla si el modal está visible; si es `false`, el componente devuelve `null`.

   - `alimentador`:
       • objeto con la configuración del alimentador actual,
       • de él se toma `nombre` para el título y `mapeoMediciones` (si existe).

   - `initialMapeo`:
       • referencia al mapeo guardado anteriormente, para poder mezclarlo
         con la estructura por defecto.

   - `mapeo`:
       • estado local que contiene al menos `{ cardDesign }`,
       • es lo que finalmente se devuelve al padre en `onGuardar(mapeo)`.


3) useEffect de apertura: mezclar diseño guardado con el default

   useEffect(() => {
     if (!abierto) return;

     const baseCardDesign = crearCardDesignDefault();

     if (!initialMapeo || !initialMapeo.cardDesign) {
       setMapeo({ cardDesign: baseCardDesign });
       return;
     }

     const defCD = baseCardDesign;
     const guardCD = initialMapeo.cardDesign;

     const mergeSide = (sideName) => { ... };

     setMapeo({
       cardDesign: {
         superior: mergeSide("superior"),
         inferior: mergeSide("inferior"),
       },
     });
   }, [abierto, initialMapeo]);

   - Se ejecuta cada vez que:
       • el modal se abre (`abierto` pasa a true),
       • o cambia `initialMapeo` (por ejemplo, si se cargara otro alimentador).

   - Comportamiento:

       a) Si no hay nada guardado:
          → se usa `crearCardDesignDefault()` y listo.

       b) Si sí hay `initialMapeo.cardDesign`:
          → se llama a `mergeSide("superior")` y `mergeSide("inferior")` para
            combinar lo guardado con el esqueleto por defecto.


4) `mergeSide`: combinación segura de un lado de la tarjeta

   const mergeSide = (sideName) => {
     const defSide = defCD[sideName];
     const guardSide = guardCD[sideName] || {};

     const boxesDef = defSide.boxes || [];
     const boxesGuard = guardSide.boxes || [];

     const mergedBoxes = boxesDef.map((bDef, idx) => {
       const bGuard = boxesGuard[idx] || {};
       return {
         ...bDef,
         ...bGuard,
         origen: bGuard.origen || bDef.origen || "rele",
       };
     });

     const cantGuard = guardSide.cantidad;
     const cantidad =
       typeof cantGuard === "number" && cantGuard >= 1 && cantGuard <= 4
         ? cantGuard
         : defSide.cantidad;

     return {
       ...defSide,
       ...guardSide,
       boxes: mergedBoxes,
       cantidad,
       tituloId: guardSide.tituloId || defSide.tituloId,
       tituloCustom: guardSide.tituloCustom || "",
     };
   };

   - Objetivo:
       • permitir que el formato de `cardDesign` evolucione sin romper mapeos viejos.

   - Detalles importantes:
       • Siempre parte de `defSide` (estructura completa por defecto).
       • Mezcla cada box por índice:
           - si hay datos guardados, los sobreescribe encima del default,
           - si falta el `origen`, cae a `bDef.origen` o `"rele"`.
       • Normaliza `cantidad` para que siempre esté entre 1 y 4.
       • Asegura que `tituloId` y `tituloCustom` tengan valores coherentes.


5) Helper `asegurarCardDesign` y funciones de actualización

   const asegurarCardDesign = (prev) => {
     const base = prev.cardDesign || crearCardDesignDefault();
     const cd = { ...base };
     if (!cd.superior) cd.superior = crearSideDesignDefault("corriente_132");
     if (!cd.inferior) cd.inferior = crearSideDesignDefault("tension_linea");
     return cd;
   };

   - Garantiza que, al actualizar el estado:
       • siempre exista `cardDesign`,
       • y que tenga ambos lados (`superior` e `inferior`) con estructura válida.

   a) `actualizarCantidadBoxes(zona, nuevaCant)`

      - Recorta `nuevaCant` al rango [1, 4].
      - Usa `setMapeo` y `asegurarCardDesign` para modificar sólo:
          `cardDesign[zona].cantidad`.

   b) `actualizarTituloSeleccionado(zona, tituloId)`

      - Cambia el `tituloId` del lado superior o inferior sin tocar el resto
        de la configuración.

   c) `actualizarTituloCustom(zona, texto)`

      - Fuerza `tituloId: "custom"` y guarda el texto en `tituloCustom`.

   d) `actualizarCardDesignCaja(zona, index, campo, valor)`

      - Se asegura de que el array `boxes` tenga siempre 4 posiciones.
      - Actualiza sólo el campo indicado de la box `index`:
          • `enabled`, `label`, `registro`, `origen` o `formula`.
      - Devuelve un nuevo objeto `cardDesign` inmutable.


6) Submit del formulario

   const handleSubmit = (e) => {
     e.preventDefault();
     onGuardar(mapeo);
   };

   - No hace validaciones complejas: asume que el diseño siempre es consistente.
   - Entrega al padre el objeto `mapeo` completo (hoy sólo `cardDesign`), para
     que se guarde dentro del alimentador.


7) Render del modal

   - Estructura general:

       <div className="alim-modal-overlay">
         <div className="map-modal">
           <h2>Mapeo de mediciones – {nombreAlimentador}</h2>

           <form onSubmit={handleSubmit} className="map-form">
             <div className="map-design">
               <h3>Diseño de la tarjeta</h3>
               <p>Texto de ayuda...</p>

               <FormularioDiseñoTarjeta ... zona="superior" ... />
               <FormularioDiseñoTarjeta ... zona="inferior" ... />
             </div>

             <div className="alim-modal-actions">
               <button type="button" onClick={onCerrar}>Cancelar</button>
               <button type="submit">Guardar</button>
             </div>
           </form>
         </div>
       </div>

   - `FormularioDiseñoTarjeta` se llama dos veces:
       • una para la parte superior (placeholder "CONSUMO (A)"),
       • otra para la parte inferior (placeholder "TENSIÓN (kV)").

   - Cada formulario hijo recibe:
       • el objeto `design` correspondiente (`cardDesign.superior` / `inferior`),
       • callbacks específicos para cambiar título, cantidad y boxes.


8) Export

   export default ModalMapeoMediciones;
   export { crearMapeoVacio };

   - `ModalMapeoMediciones`:
       • se usa dentro de la vista principal de alimentadores,
       • recibe el alimentador actual y devuelve el nuevo `mapeo`.

   - `crearMapeoVacio`:
       • se expone por separado para que otros módulos puedan crear un
         mapeo por defecto (por ejemplo, al inicializar nuevos alimentadores).

---------------------------------------------------------------------------*/
