/**
 * Cliente para comunicación con Modbus
 * Puede trabajar en modo simulado (para desarrollo) o real (con hardware)
 */

/**
 * Modo de operación: "simulado" o "real"
 * En modo simulado genera datos aleatorios para pruebas
 */
export const MODO_MODBUS = "simulado";

/**
 * Indica si se debe usar Modbus real
 */
export const USAR_MODBUS_REAL = MODO_MODBUS === "real";

/**
 * URL del servidor Modbus (Express backend)
 */
const URL_BASE = "http://localhost:5000/api/modbus/test";

/**
 * Lee registros desde un dispositivo Modbus
 * Puede trabajar en modo simulado o real
 * 
 * @param {Object} config - Configuración de lectura
 * @param {string} config.ip - Dirección IP del dispositivo
 * @param {number} config.puerto - Puerto Modbus (usualmente 502)
 * @param {number} config.indiceInicial - Primer registro a leer
 * @param {number} config.cantRegistros - Cantidad de registros a leer
 * @returns {Promise<Array>} Lista de registros [{index, address, value}, ...]
 */
export async function leerRegistrosModbus({
	ip,
	puerto,
	indiceInicial,
	cantRegistros,
}) {
	const inicio = Number(indiceInicial);
	const cantidad = Number(cantRegistros);
	const puertoNum = Number(puerto);

	// Validación básica de parámetros
	if (!ip || !puertoNum || Number.isNaN(inicio) || Number.isNaN(cantidad) || cantidad <= 0) {
		return null;
	}

	// 🧪 MODO SIMULADO: Generar datos falsos para pruebas
	if (!USAR_MODBUS_REAL) {
		return Array.from({ length: cantidad }, (_, i) => ({
			index: i,
			address: inicio + i,
			value: Math.floor(Math.random() * 501), // Valores entre 0 y 500
		}));
	}

	// 🌐 MODO REAL: Llamar al servidor Express que se comunica con Modbus
	const respuesta = await fetch(URL_BASE, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			ip,
			puerto: puertoNum,
			indiceInicial: inicio,
			cantRegistros: cantidad,
		}),
	});

	const datos = await respuesta.json();

	if (!respuesta.ok || !datos.ok) {
		throw new Error(datos.error || "Error en lectura Modbus");
	}

	// Convertir registros del servidor a nuestro formato
	return datos.registros.map((valorRegistro, indice) => ({
		index: indice,
		address: inicio + indice,
		value: valorRegistro,
	}));
}
