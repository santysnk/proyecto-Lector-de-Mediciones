import { aplicarFormula, formatearValor } from './calculosFormulas';
import { TITULOS_MEDICIONES, ETIQUETAS_POR_DEFECTO, DISEÑO_TARJETA_POR_DEFECTO } from '../constantes/titulosMediciones';

/**
 * Obtiene la lista de registros según el origen (rele o analizador)
 * 
 * @param {Object} registrosPorOrigen - { rele: [...], analizador: [...] }
 * @param {string} origen - "rele" o "analizador"
 * @returns {Array|null} Lista de registros o null
 */
export const obtenerListaRegistros = (registrosPorOrigen, origen) => {
	if (!registrosPorOrigen) return null;
	const clave = origen === "analizador" ? "analizador" : "rele";
	const lista = registrosPorOrigen[clave];
	return Array.isArray(lista) ? lista : null;
};

/**
 * Obtiene el diseño de la tarjeta desde el mapeo de mediciones
 * Si no hay mapeo, devuelve el diseño por defecto
 * 
 * @param {Object} mapeoMediciones - Configuración de mapeo
 * @returns {Object} Diseño con estructura { superior: {...}, inferior: {...} }
 */
export const obtenerDiseñoTarjeta = (mapeoMediciones) => {
	const diseño = mapeoMediciones?.cardDesign;

	if (!diseño) return DISEÑO_TARJETA_POR_DEFECTO;

	return {
		superior: {
			...DISEÑO_TARJETA_POR_DEFECTO.superior,
			...(diseño.superior || {}),
		},
		inferior: {
			...DISEÑO_TARJETA_POR_DEFECTO.inferior,
			...(diseño.inferior || {}),
		},
	};
};

/**
 * Resuelve el título de un lado de la tarjeta
 * Puede ser un título predefinido o uno personalizado
 * 
 * @param {Object} diseñoLado - { tituloId, tituloCustom, ... }
 * @returns {string} Título a mostrar
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
 * Calcula los valores para mostrar en un lado de la tarjeta (superior o inferior)
 * Aplica fórmulas, formatea valores y maneja errores
 * 
 * @param {Object} registrosPorOrigen - { rele: [...], analizador: [...] }
 * @param {Object} diseñoLado - Configuración del lado de la tarjeta
 * @returns {Object} { titulo: string, boxes: [{ etiqueta, valor, enabled, origen }] }
 */
export const calcularValoresLadoTarjeta = (registrosPorOrigen, diseñoLado) => {
	if (!diseñoLado) {
		return {
			titulo: "",
			boxes: [],
		};
	}

	const titulo = resolverTituloLado(diseñoLado);
	const cantidad = Math.min(4, Math.max(1, Number(diseñoLado.cantidad) || 1));
	const boxesSalida = [];

	const etiquetasDefault = ETIQUETAS_POR_DEFECTO[diseñoLado.tituloId] || [];

	for (let i = 0; i < cantidad; i++) {
		const configuracion = diseñoLado.boxes?.[i] || {};
		const etiqueta = (configuracion.label || "").trim() || etiquetasDefault[i] || `Box ${i + 1}`;

		let valorMostrado = "--,--";

		if (configuracion.enabled) {
			const numeroRegistro = Number(configuracion.registro);

			// Si hay registro configurado
			if ((Number.isFinite(numeroRegistro) || numeroRegistro === 0) && configuracion.registro !== "") {
				const origen = configuracion.origen || "rele";
				const listaRegistros = obtenerListaRegistros(registrosPorOrigen, origen);

				if (listaRegistros && listaRegistros.length > 0) {
					// Buscar el registro por su dirección (address)
					const registroEncontrado = listaRegistros.find((r) => r.address === numeroRegistro);

					if (!registroEncontrado) {
						valorMostrado = "ERROR";
					} else {
						// Aplicar fórmula al valor del registro
						const valorCalculado = aplicarFormula(
							configuracion.formula || "x",
							registroEncontrado.value
						);

						if (valorCalculado == null || Number.isNaN(valorCalculado)) {
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

	return { titulo, boxes: boxesSalida };
};
