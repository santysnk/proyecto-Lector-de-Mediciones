// @ts-check
// Cálculos para el nuevo sistema basado en funcionalidades de plantillas (config_tarjeta)

import { formatearValor } from "./calculosFormulas";

/**
 * Verifica si config_tarjeta tiene una configuración válida para una zona
 * @param {Object} configZona - Configuración de zona { registrador_id, funcionalidad_id, ... }
 * @returns {boolean} true si la zona tiene funcionalidad configurada
 */
export const tieneConfiguracionValida = (configZona) => {
	return !!(configZona?.registrador_id && configZona?.funcionalidad_id);
};

/**
 * Obtiene la lista de registros según el origen (rele o analizador).
 *
 * @param {Object} registrosPorOrigen - { rele: [...], analizador: [...] }.
 * @param {string} origen - "rele" o "analizador".
 * @returns {Array|null} Lista de registros o null.
 */
export const obtenerListaRegistros = (registrosPorOrigen, origen) => {
	if (!registrosPorOrigen) return null;
	const clave = origen === "analizador" ? "analizador" : "rele"; // default: rele
	const lista = registrosPorOrigen[clave];
	return Array.isArray(lista) ? lista : null;
};

/**
 * Aplica la fórmula de un transformador a un valor
 * @param {number} valor - Valor crudo del registro
 * @param {Object} transformador - Objeto transformador con propiedad formula
 * @returns {number|null} Valor transformado o null si hay error
 */
const aplicarFormulaTransformador = (valor, transformador) => {
	if (valor === null || valor === undefined || !transformador?.formula) {
		return valor;
	}

	try {
		const x = Number(valor);
		if (Number.isNaN(x)) return null;
		// Evaluar la fórmula (ej: "x * 400 / 1000")
		// eslint-disable-next-line no-new-func
		const resultado = new Function("x", `return ${transformador.formula}`)(x);
		return resultado;
	} catch (error) {
		console.error("Error al aplicar fórmula del transformador:", error);
		return null;
	}
};

/**
 * Calcula valores para un lado de la tarjeta usando la nueva estructura de funcionalidades
 * @param {Object} registrosPorOrigen - { rele: [...], analizador: [...] }
 * @param {Object} configZona - Configuración de zona desde config_tarjeta
 * @param {Object} funcionalidadDatos - Datos de la funcionalidad (nombre, registros, etc.)
 * @param {Function} obtenerTransformadorPorId - Función para obtener transformador por ID
 * @returns {Object} { titulo, boxes, oculto }
 */
export const calcularValoresFuncionalidad = (registrosPorOrigen, configZona, funcionalidadDatos, obtenerTransformadorPorId) => {
	if (!configZona || !funcionalidadDatos) {
		return { titulo: "", boxes: [], oculto: false };
	}

	// Título: usar personalizado si existe, sino el nombre de la funcionalidad
	const titulo = configZona.titulo_personalizado || funcionalidadDatos.nombre || "";
	const oculto = !!configZona.oculto;

	// Si está oculto, no procesar boxes
	if (oculto) {
		return { titulo, boxes: [], oculto };
	}

	// Obtener registros de la funcionalidad
	const registrosFunc = funcionalidadDatos.registros || [];
	const boxesSalida = [];

	for (let i = 0; i < registrosFunc.length; i++) {
		const regConfig = registrosFunc[i];

		// Etiqueta: usar personalizada si existe, sino la de la funcionalidad
		const etiquetaPersonalizada = configZona.etiquetas_personalizadas?.[i];
		const etiqueta = etiquetaPersonalizada || regConfig.etiqueta || `Box ${i + 1}`;

		let valorMostrado = "--,--";
		// El API devuelve "registro" como nombre del campo
		const valorRegistroRaw = regConfig.registro ?? regConfig.valor; // Dirección del registro Modbus
		// Asegurar que es número para comparación correcta
		const valorRegistro = valorRegistroRaw !== undefined && valorRegistroRaw !== null
			? Number(valorRegistroRaw)
			: null;

		if (valorRegistro !== null && !Number.isNaN(valorRegistro)) {
			// Por ahora asumimos origen "rele" para plantillas de relé
			const origen = "rele";
			const listaRegistros = obtenerListaRegistros(registrosPorOrigen, origen);
			// Obtener registrador_id de la zona para filtrar registros correctos
			const registradorIdZona = configZona.registrador_id;

			if (listaRegistros && listaRegistros.length > 0) {
				// Buscar registro que coincida en address Y registradorId (si está disponible)
				const registroEncontrado = listaRegistros.find(
					(r) => r.address === valorRegistro &&
						(!r.registradorId || !registradorIdZona || r.registradorId === registradorIdZona)
				);

				if (registroEncontrado) {
					let valorFinal = registroEncontrado.value;

					// Aplicar transformador si está configurado
					const transformadorId = regConfig.transformadorId;
					if (transformadorId && obtenerTransformadorPorId) {
						const transformador = obtenerTransformadorPorId(transformadorId);
						if (transformador) {
							valorFinal = aplicarFormulaTransformador(valorFinal, transformador);
						}
					}

					if (valorFinal != null && !Number.isNaN(valorFinal)) {
						valorMostrado = formatearValor(valorFinal);
					} else {
						valorMostrado = "ERROR";
					}
				} else {
					valorMostrado = "SIN DATO";
				}
			}
		}

		boxesSalida.push({
			etiqueta,
			valor: valorMostrado,
			enabled: true,
			origen: "rele",
		});
	}

	return { titulo, boxes: boxesSalida, oculto };
};
