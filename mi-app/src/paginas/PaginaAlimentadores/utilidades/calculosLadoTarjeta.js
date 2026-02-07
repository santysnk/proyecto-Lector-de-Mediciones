// @ts-check
// Cálculos para el sistema legacy basado en card_design (superior/inferior)

import { aplicarFormula, formatearValor } from "./calculosFormulas";
import {
	TITULOS_MEDICIONES,
	ETIQUETAS_POR_DEFECTO,
	DISEÑO_TARJETA_POR_DEFECTO,
} from "../constantes/titulosMediciones";
import { obtenerListaRegistros } from "./calculosFuncionalidad";

/**
 * Obtiene el diseño de la tarjeta desde card_design o mapeoMediciones (legacy).
 * Si no hay configuración, devuelve el diseño por defecto.
 *
 * @param {Object} cardDesign - Configuración directa de card_design (nuevo formato)
 *                              o mapeoMediciones.cardDesign (legacy).
 * @returns {Object} Diseño con estructura { superior: {...}, inferior: {...} }.
 */
export const obtenerDisenoTarjeta = (cardDesign) => {
	// Si no hay diseño, usar por defecto
	if (!cardDesign || Object.keys(cardDesign).length === 0) {
		return DISEÑO_TARJETA_POR_DEFECTO;
	}

	// Nuevo formato: card_design ya tiene { superior, inferior } directamente
	// Legacy: mapeoMediciones tenía cardDesign.superior/inferior
	const diseño = cardDesign.cardDesign || cardDesign;

	// Si el diseño tiene superior/inferior, usarlo
	if (diseño.superior || diseño.inferior) {
		return {
			superior: normalizarLadoDiseno(diseño.superior, DISEÑO_TARJETA_POR_DEFECTO.superior),
			inferior: normalizarLadoDiseno(diseño.inferior, DISEÑO_TARJETA_POR_DEFECTO.inferior),
		};
	}

	return DISEÑO_TARJETA_POR_DEFECTO;
};

/**
 * Normaliza un lado del diseño, convirtiendo el formato del modal al formato esperado.
 * El modal guarda: { tituloId, tituloCustom, cantidad, boxes: [{ enabled, label, indice, formula }] }
 * El cálculo espera: { tituloId, tituloCustom, cantidad, boxes: [{ enabled, label, registro, formula, origen }] }
 */
const normalizarLadoDiseno = (lado, ladoDefault) => {
	if (!lado) return ladoDefault;

	// Normalizar los boxes: convertir 'indice' a 'registro' si es necesario
	const boxesNormalizados = (lado.boxes || []).map((box) => ({
		enabled: !!box.enabled,
		label: box.label || "",
		// El modal guarda 'indice', el cálculo espera 'registro'
		registro: box.registro !== undefined ? box.registro : box.indice,
		formula: box.formula || "",
		origen: box.origen || "rele", // por defecto relé
	}));

	return {
		...ladoDefault,
		...lado,
		boxes: boxesNormalizados,
		oculto: !!lado.oculto, // preservar si la zona está marcada como oculta
	};
};

/**
 * Resuelve el título de un lado de la tarjeta.
 * Puede ser un título predefinido o uno personalizado.
 *
 * @param {Object} diseñoLado - { tituloId, tituloCustom, ... }.
 * @returns {string} Título a mostrar.
 */
export const resolverTituloLado = (diseñoLado) => {
	if (!diseñoLado) return "";

	// Si es custom, usar el título personalizado
	if (diseñoLado.tituloId === "custom") {
		return (diseñoLado.tituloCustom || "").trim();
	}

	// Sino, buscar en la lista de títulos predefinidos
	return TITULOS_MEDICIONES[diseñoLado.tituloId] || "";
};

/**
 * Calcula los valores para mostrar en un lado de la tarjeta (superior o inferior).
 * Aplica fórmulas, formatea valores y maneja errores.
 *
 * @param {Object} registrosPorOrigen - { rele: [...], analizador: [...] }.
 * @param {Object} diseñoLado - Configuración del lado de la tarjeta.
 * @returns {Object} { titulo: string, boxes: [{ etiqueta, valor, enabled, origen }] }.
 */
export const calcularValoresLadoTarjeta = (registrosPorOrigen, diseñoLado) => {
	if (!diseñoLado) {
		return {
			titulo: "",
			boxes: [],
		};
	}

	const titulo = resolverTituloLado(diseñoLado); // texto que va arriba del grupo
	const cantidad = Math.min(
		4,
		Math.max(1, Number(diseñoLado.cantidad) || 1)
	); // fuerza cantidad a [1,4]
	const boxesSalida = [];

	const etiquetasDefault = ETIQUETAS_POR_DEFECTO[diseñoLado.tituloId] || [];

	for (let i = 0; i < cantidad; i++) {
		const configuracion = diseñoLado.boxes?.[i] || {};
		const etiqueta =
			(configuracion.label || "").trim() ||
			etiquetasDefault[i] ||
			`Box ${i + 1}`; // etiqueta efectiva que se verá

		let valorMostrado = "--,--"; // placeholder por defecto

		if (configuracion.enabled) {
			const numeroRegistro = Number(configuracion.registro);

			// Si hay registro configurado (número válido o 0, y no string vacío)
			if (
				(Number.isFinite(numeroRegistro) || numeroRegistro === 0) &&
				configuracion.registro !== ""
			) {
				const origen = configuracion.origen || "rele"; // default: rele
				const listaRegistros = obtenerListaRegistros(
					registrosPorOrigen,
					origen
				);

				if (listaRegistros && listaRegistros.length > 0) {
					// Buscar el registro por su dirección (address)
					const registroEncontrado = listaRegistros.find(
						(r) => r.address === numeroRegistro
					);

					if (!registroEncontrado) {
						valorMostrado = "ERROR"; // no se encontró el registro
					} else {
						// Aplicar fórmula al valor del registro
						const valorCalculado = aplicarFormula(
							configuracion.formula || "x",
							registroEncontrado.value
						);

						if (
							valorCalculado == null ||
							Number.isNaN(valorCalculado)
						) {
							valorMostrado = "ERROR";
						} else {
							valorMostrado = formatearValor(valorCalculado);
						}
					}
				}
			}
		}

		boxesSalida.push({
			etiqueta,
			valor: valorMostrado,
			enabled: !!configuracion.enabled,
			origen: configuracion.origen || "rele",
		});
	}

	return { titulo, boxes: boxesSalida, oculto: !!diseñoLado.oculto };
};
