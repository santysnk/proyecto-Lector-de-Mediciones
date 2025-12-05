import { aplicarFormula, formatearValor } from './calculosFormulas';
import { TITULOS_MEDICIONES, ETIQUETAS_POR_DEFECTO, DISEÑO_TARJETA_POR_DEFECTO } from '../constantes/titulosMediciones';

/**
 * ==============================================================================
 * UTILIDAD: calculosMediciones
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es el cerebro matemático que prepara los datos para que se vean bonitos en las tarjetas.
 * Toma los datos crudos del Modbus (números difíciles de leer) y los transforma en
 * información útil para el usuario (con etiquetas, unidades y formato correcto).
 * 
 * ¿CÓMO SE VINCULA?
 * - Se usa en "PaginaAlimentadores.jsx" para calcular qué mostrar en cada tarjeta.
 * - Usa "calculosFormulas.js" para aplicar matemáticas (ej: multiplicar por 10).
 * - Usa constantes de "titulosMediciones.js" para saber qué nombres poner por defecto.
 * 
 * FINALIDAD:
 * Separar la lógica de presentación (React) de la lógica de negocio (cálculos).
 */

/**
 * Ayuda a encontrar la lista correcta de registros (del Relé o del Analizador).
 */
export const obtenerListaRegistros = (registrosPorOrigen, origen) => {
	if (!registrosPorOrigen) return null;
	const clave = origen === "analizador" ? "analizador" : "rele";
	const lista = registrosPorOrigen[clave];
	return Array.isArray(lista) ? lista : null;
};

/**
 * Recupera la configuración visual de una tarjeta (qué mostrar arriba y abajo).
 * Si la tarjeta no tiene configuración propia, devuelve una por defecto.
 */
export const obtenerDisenoTarjeta = (mapeoMediciones) => {
	const diseño = mapeoMediciones?.cardDesign;

	if (!diseño) return DISEÑO_TARJETA_POR_DEFECTO;

	// Mezclamos el diseño guardado con el diseño por defecto para asegurar que
	// siempre haya datos válidos, incluso si falta alguna propiedad.
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
 * Decide qué título ponerle a un bloque de mediciones (ej: "CORRIENTE", "TENSIÓN").
 */
export const resolverTituloLado = (diseñoLado) => {
	if (!diseñoLado) return "";

	// Si el usuario escribió un título a mano, usamos ese
	if (diseñoLado.tituloId === "custom") {
		return (diseñoLado.tituloCustom || "").trim();
	}

	// Si eligió uno de la lista, buscamos el texto correspondiente
	return TITULOS_MEDICIONES[diseñoLado.tituloId] || "";
};

/**
 * LA FUNCIÓN MÁS IMPORTANTE:
 * Calcula exactamente qué texto y valor mostrar en cada cajita de la tarjeta.
 * 
 * @param {Object} registrosPorOrigen - Todos los datos que llegaron del Modbus
 * @param {Object} diseñoLado - Configuración de qué queremos ver (ej: "mostrar registro 100")
 * 
 * @returns {Object} Un objeto listo para que React lo dibuje:
 * {
 *    titulo: "CORRIENTE",
 *    boxes: [
 *       { etiqueta: "R", valor: "220.5", enabled: true, ... },
 *       { etiqueta: "S", valor: "221.0", enabled: true, ... }
 *    ]
 * }
 */
export const calcularValoresLadoTarjeta = (registrosPorOrigen, diseñoLado) => {
	if (!diseñoLado) {
		return { titulo: "", boxes: [] };
	}

	const titulo = resolverTituloLado(diseñoLado);

	// Aseguramos que la cantidad de cajas sea válida (entre 1 y 4)
	const cantidad = Math.min(4, Math.max(1, Number(diseñoLado.cantidad) || 1));
	const boxesSalida = [];

	const etiquetasDefault = ETIQUETAS_POR_DEFECTO[diseñoLado.tituloId] || [];

	// Recorremos cada cajita configurada
	for (let i = 0; i < cantidad; i++) {
		const configuracion = diseñoLado.boxes?.[i] || {};

		// Si no tiene etiqueta, le inventamos una (ej: "Box 1")
		const etiqueta = (configuracion.label || "").trim() || etiquetasDefault[i] || `Box ${i + 1}`;

		let valorMostrado = "--,--"; // Valor por defecto si no hay datos

		// Solo calculamos si la cajita está habilitada
		if (configuracion.enabled) {
			const numeroRegistro = Number(configuracion.registro);

			// Verificamos que tenga un número de registro válido configurado
			if ((Number.isFinite(numeroRegistro) || numeroRegistro === 0) && configuracion.registro !== "") {
				const origen = configuracion.origen || "rele";
				const listaRegistros = obtenerListaRegistros(registrosPorOrigen, origen);

				if (listaRegistros && listaRegistros.length > 0) {
					// Buscamos el dato exacto que necesitamos
					const registroEncontrado = listaRegistros.find((r) => r.address === numeroRegistro);

					if (!registroEncontrado) {
						valorMostrado = "ERROR"; // No encontramos el registro que pidió el usuario
					} else {
						// Aplicamos la fórmula matemática (ej: "x * 0.1")
						const valorCalculado = aplicarFormula(
							configuracion.formula || "x",
							registroEncontrado.value
						);

						if (valorCalculado == null || Number.isNaN(valorCalculado)) {
							valorMostrado = "ERROR"; // La fórmula falló
						} else {
							valorMostrado = formatearValor(valorCalculado); // Todo salió bien
						}
					}
				}
			}
		}

		// Guardamos el resultado final para esta cajita
		boxesSalida.push({
			etiqueta,
			valor: valorMostrado,
			enabled: !!configuracion.enabled,
			origen: configuracion.origen || "rele",
		});
	}

	return { titulo, boxes: boxesSalida };
};
