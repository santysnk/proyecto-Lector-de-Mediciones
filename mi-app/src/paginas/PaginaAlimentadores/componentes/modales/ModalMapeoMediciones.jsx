import React, { useEffect, useState } from "react";
import "./ModalMapeoMediciones.css";
import FormularioDiseñoTarjeta from "./mapeo/FormularioDiseñoTarjeta.jsx";

/**
 * ==============================================================================
 * COMPONENTE: ModalMapeoMediciones
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es el panel donde "dibujas" cómo se verá la tarjeta del alimentador.
 * Permite decidir:
 * 1. Qué título tendrá la parte de arriba (ej: "CONSUMO").
 * 2. Qué título tendrá la parte de abajo (ej: "TENSIÓN").
 * 3. Cuántas cajitas de medición mostrar en cada parte (1 a 4).
 * 4. Qué dato exacto del Modbus va en cada cajita (ej: Registro 100).
 * 
 * ¿CÓMO FUNCIONA?
 * - Carga la configuración actual del alimentador.
 * - Si no tiene configuración, crea una por defecto (vacía).
 * - Usa el subcomponente "FormularioDiseñoTarjeta" para mostrar los controles
 *   de la parte superior e inferior.
 * - Al guardar, devuelve un objeto JSON con todo el diseño listo para usarse.
 * 
 * FINALIDAD:
 * Dar flexibilidad total para que cada tarjeta muestre datos diferentes según
 * lo que necesite el usuario (ej: una tarjeta muestra Corriente y otra Potencia).
 */

// Lista de secciones predefinidas (histórico, se mantiene por compatibilidad)
const SECCIONES_MAPEO = [
	{ id: "tension_linea", titulo: "Tensión de línea (kV)", items: ["L1", "L2", "L3"] },
	{ id: "tension_entre_lineas", titulo: "Tensión entre líneas (kV)", items: ["L1-L2", "L2-L3", "L1-L3"] },
	{ id: "corriente_linea", titulo: "Corriente de línea (A)", items: ["L1", "L2", "L3"] },
	{ id: "potencia_activa", titulo: "Potencia activa (kW)", items: ["L1", "L2", "L3", "Total"] },
	{ id: "potencia_reactiva", titulo: "Potencia reactiva (kVAr)", items: ["L1", "L2", "L3", "Total"] },
	{ id: "potencia_aparente", titulo: "Potencia aparente (kVA)", items: ["L1", "L2", "L3", "Total"] },
	{ id: "factor_potencia", titulo: "Factor de Potencia", items: ["L1", "L2", "L3"] },
	{ id: "frecuencia", titulo: "Frecuencia (Hz)", items: ["L1", "L2", "L3"] },
	{ id: "corriente_neutro", titulo: "Corriente de Neutro (A)", items: ["N"] },
];

// ---- Helpers para crear configuraciones por defecto ----

// Crea el diseño de UN lado de la tarjeta (ej: solo la parte de arriba)
function crearSideDesignDefault(tituloIdPorDefecto) {
	return {
		tituloId: tituloIdPorDefecto, // ID del título (ej: "corriente_linea")
		tituloCustom: "", 			  // Texto personalizado si el usuario quiere escribir uno propio
		cantidad: 3, 				  // Por defecto mostramos 3 cajas (R, S, T)
		boxes: [
			// Preparamos 4 espacios vacíos por si acaso
			{ enabled: false, label: "", registro: "", origen: "", formula: "" },
			{ enabled: false, label: "", registro: "", origen: "", formula: "" },
			{ enabled: false, label: "", registro: "", origen: "", formula: "" },
			{ enabled: false, label: "", registro: "", origen: "", formula: "" },
		],
	};
}

// Crea el diseño completo de la tarjeta (arriba + abajo)
function crearCardDesignDefault() {
	return {
		superior: crearSideDesignDefault("corriente_132"), // Arriba: Consumo
		inferior: crearSideDesignDefault("tension_linea"), // Abajo: Tensión
	};
}

// Crea un objeto de mapeo totalmente vacío y limpio
function crearMapeoVacio() {
	const base = {};
	// Rellenamos con la estructura antigua para evitar errores
	SECCIONES_MAPEO.forEach((sec) => {
		base[sec.id] = {};
		sec.items.forEach((item) => {
			base[sec.id][item] = { enabled: false, registro: "", formula: "", origen: "" };
		});
	});

	base.cardDesign = crearCardDesignDefault();
	return base;
}

const ModalMapeoMediciones = ({
	abierto, 		// ¿Visible?
	alimentador, 	// Datos del alimentador a configurar
	onCerrar, 		// Cancelar
	onGuardar 		// Guardar cambios
}) => {
	const nombreAlimentador = alimentador?.nombre || "";
	const initialMapeo = alimentador?.mapeoMediciones;

	// Estado local con la configuración que estamos editando
	const [mapeo, setMapeo] = useState(crearMapeoVacio);

	// Al abrir, cargamos los datos existentes o creamos unos nuevos
	useEffect(() => {
		if (!abierto) return;

		const base = crearMapeoVacio();

		if (!initialMapeo) {
			setMapeo(base); // Si es nuevo, empezamos de cero
			return;
		}

		// Si ya existe configuración, la mezclamos con la base para asegurar que no falten campos
		const combinado = { ...base };

		// 1. Recuperamos datos antiguos (compatibilidad)
		SECCIONES_MAPEO.forEach((sec) => {
			sec.items.forEach((item) => {
				const guardado = initialMapeo[sec.id]?.[item] || {};
				combinado[sec.id][item] = {
					...base[sec.id][item],
					...guardado,
					origen: guardado.origen || "rele",
				};
			});
		});

		// 2. Recuperamos el diseño visual de la tarjeta
		if (initialMapeo.cardDesign) {
			const defCD = base.cardDesign;
			const guardCD = initialMapeo.cardDesign;

			// Helper para mezclar un lado específico (superior o inferior)
			const mergeSide = (sideName) => {
				const defSide = defCD[sideName];
				const guardSide = guardCD[sideName] || {};

				const boxesDef = defSide.boxes || [];
				const boxesGuard = guardSide.boxes || [];

				// Mezclamos caja por caja
				const mergedBoxes = boxesDef.map((bDef, idx) => {
					const bGuard = boxesGuard[idx] || {};
					return {
						...bDef,
						...bGuard,
						origen: bGuard.origen || bDef.origen || "rele",
					};
				});

				// Validamos la cantidad de cajas (1 a 4)
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

			combinado.cardDesign = {
				superior: mergeSide("superior"),
				inferior: mergeSide("inferior"),
			};
		} else {
			combinado.cardDesign = base.cardDesign;
		}

		setMapeo(combinado);
	}, [abierto, initialMapeo]);

	if (!abierto) return null;

	// ==========================================================================
	// FUNCIONES PARA ACTUALIZAR EL ESTADO (Setters complejos)
	// ==========================================================================

	const asegurarCardDesign = (prev) => {
		if (!prev.cardDesign) {
			return crearCardDesignDefault();
		}
		const cd = { ...prev.cardDesign };
		if (!cd.superior) cd.superior = crearSideDesignDefault("corriente_132");
		if (!cd.inferior) cd.inferior = crearSideDesignDefault("tension_linea");
		return cd;
	};

	// Cambiar cuántas cajas se ven (1, 2, 3 o 4)
	const actualizarCantidadBoxes = (zona, nuevaCant) => {
		const cant = Math.min(4, Math.max(1, nuevaCant || 1));
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

	// Cambiar el título predefinido
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

	// Escribir un título personalizado
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

	// Cambiar datos de una cajita específica (registro, fórmula, etiqueta)
	const actualizarCardDesignCaja = (zona, index, campo, valor) => {
		setMapeo((prev) => {
			const cd = asegurarCardDesign(prev);
			const side = cd[zona];
			const boxes = side.boxes ? [...side.boxes] : [];

			// Rellenamos si faltan cajas
			while (boxes.length < 4) {
				boxes.push({
					enabled: false,
					label: "",
					registro: "",
					origen: "rele",
					formula: "",
				});
			}

			// Actualizamos el campo específico
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
		onGuardar(mapeo);
	};

	const cardDesign = mapeo.cardDesign || crearCardDesignDefault();

	return (
		<div className="alim-modal-overlay">
			<div className="map-modal">
				<h2 className="map-modal__title">
					Mapeo de mediciones – {nombreAlimentador}
				</h2>

				<form onSubmit={handleSubmit} className="map-form">
					<div className="map-design">
						<h3 className="map-design__title">Diseño de la tarjeta</h3>
						<p className="map-design__help">
							Elegí qué magnitudes se muestran en la parte superior e
							inferior de la tarjeta y cómo se alimentan los boxes de
							medición. Podés preparar boxes deshabilitados para usarlos
							más adelante.
						</p>

						{/* CONFIGURACIÓN PARTE SUPERIOR */}
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
						/>

						{/* CONFIGURACIÓN PARTE INFERIOR */}
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
						/>
					</div>

					{/* BOTONES DE ACCIÓN */}
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
	);
};

export default ModalMapeoMediciones;
export { crearMapeoVacio };
