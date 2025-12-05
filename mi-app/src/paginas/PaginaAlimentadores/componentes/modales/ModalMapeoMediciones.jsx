import React, { useEffect, useState } from "react";
import "./ModalMapeoMediciones.css";
import FormularioDiseñoTarjeta from "./mapeo/FormularioDiseñoTarjeta.jsx";

const SECCIONES_MAPEO = [
	{
		id: "tension_linea",
		titulo: "Tensión de línea (kV)",
		items: ["L1", "L2", "L3"],
	},
	{
		id: "tension_entre_lineas",
		titulo: "Tensión entre líneas (kV)",
		items: ["L1-L2", "L2-L3", "L1-L3"],
	},
	{
		id: "corriente_linea",
		titulo: "Corriente de línea (A)",
		items: ["L1", "L2", "L3"],
	},
	{
		id: "potencia_activa",
		titulo: "Potencia activa (kW)",
		items: ["L1", "L2", "L3", "Total"],
	},
	{
		id: "potencia_reactiva",
		titulo: "Potencia reactiva (kVAr)",
		items: ["L1", "L2", "L3", "Total"],
	},
	{
		id: "potencia_aparente",
		titulo: "Potencia aparente (kVA)",
		items: ["L1", "L2", "L3", "Total"],
	},
	{
		id: "factor_potencia",
		titulo: "Factor de Potencia",
		items: ["L1", "L2", "L3"],
	},
	{
		id: "frecuencia",
		titulo: "Frecuencia (Hz)",
		items: ["L1", "L2", "L3"],
	},
	{
		id: "corriente_neutro",
		titulo: "Corriente de Neutro (A)",
		items: ["N"],
	},
];

// ---- helpers para diseño de card ----
function crearSideDesignDefault(tituloIdPorDefecto) {
	return {
		tituloId: tituloIdPorDefecto,
		tituloCustom: "",
		cantidad: 3, // sigue siendo 3 boxes por defecto
		boxes: [
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
		superior: crearSideDesignDefault("corriente_132"), // parecido a CONSUMO
		inferior: crearSideDesignDefault("tension_linea"), // parecido a TENSIÓN
	};
}

// ---- mapeo vacío: secciones + diseño de card ----
function crearMapeoVacio() {
	const base = {};
	SECCIONES_MAPEO.forEach((sec) => {
		base[sec.id] = {};
		sec.items.forEach((item) => {
			base[sec.id][item] = {
				enabled: false,
				registro: "",
				formula: "",
				origen: "",
			};
		});
	});

	base.cardDesign = crearCardDesignDefault();
	return base;
}

const ModalMapeoMediciones = ({ abierto, alimentador, onCerrar, onGuardar }) => {
	const nombreAlimentador = alimentador?.nombre || "";
	const initialMapeo = alimentador?.mapeoMediciones;
	const [mapeo, setMapeo] = useState(crearMapeoVacio);

	useEffect(() => {
		if (!abierto) return;

		const base = crearMapeoVacio();

		if (!initialMapeo) {
			setMapeo(base);
			return;
		}

		// Mezcla mapeo guardado (viejo) con el esqueleto vacío
		const combinado = { ...base };

		// 1) secciones clásicas (aunque ya no se muestran, las preservamos)
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

		// 2) diseño de tarjeta
		if (initialMapeo.cardDesign) {
			const defCD = base.cardDesign;
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

	// --- helpers actualización cardDesign ---
	const asegurarCardDesign = (prev) => {
		if (!prev.cardDesign) {
			return crearCardDesignDefault();
		}
		const cd = { ...prev.cardDesign };
		if (!cd.superior) cd.superior = crearSideDesignDefault("corriente_132");
		if (!cd.inferior) cd.inferior = crearSideDesignDefault("tension_linea");
		return cd;
	};

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
