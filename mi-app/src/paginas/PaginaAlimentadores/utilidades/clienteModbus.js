/**
 * ==============================================================================
 * UTILIDAD: clienteModbus
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es el encargado de la comunicación técnica con los equipos físicos (Relés y Analizadores).
 * Actúa como un "traductor" que envía peticiones en un formato que los equipos entienden
 * y recibe sus respuestas.
 * 
 * ¿CÓMO FUNCIONA?
 * Tiene dos modos de operación:
 * 1. MODO SIMULADO: Genera números aleatorios. Útil cuando no estamos conectados a la red
 *    de la planta y queremos probar que la interfaz gráfica funciona.
 * 2. MODO REAL: Se conecta a un servidor intermediario (backend) que habla el protocolo Modbus real.
 * 
 * FINALIDAD:
 * Aislar la complejidad de la red. El resto de la aplicación solo pide "leer registros"
 * y no necesita saber si vienen de un simulador o de un cable Ethernet real.
 */

// Configuración del modo de operación
// "simulado" = Genera datos falsos para desarrollo
// "real"     = Intenta conectar a equipos reales
export const MODO_MODBUS = "simulado";

// Variable derivada para usar en condiciones (true/false)
export const USAR_MODBUS_REAL = MODO_MODBUS === "real";

// Dirección del servidor intermediario que hace el puente con Modbus
const URL_BASE = "http://localhost:5000/api/modbus/test";

/**
 * Función principal para leer datos.
 * 
 * @param {Object} config - Objeto con los detalles de conexión
 * @param {string} config.ip - Dirección IP del equipo (ej: "192.168.1.10")
 * @param {number} config.puerto - Puerto de red (estándar Modbus es 502)
 * @param {number} config.indiceInicial - Número de registro donde empezar a leer
 * @param {number} config.cantRegistros - Cuántos registros leer en total
 * 
 * @returns {Promise<Array>} Una lista de objetos con los valores leídos
 */
export async function leerRegistrosModbus({
	ip,
	puerto,
	indiceInicial,
	cantRegistros,
}) {
	// Aseguramos que los números sean realmente números
	const inicio = Number(indiceInicial);
	const cantidad = Number(cantRegistros);
	const puertoNum = Number(puerto);

	// Validación de seguridad: Si falta algún dato importante, cancelamos
	if (!ip || !puertoNum || Number.isNaN(inicio) || Number.isNaN(cantidad) || cantidad <= 0) {
		return null;
	}

	// ==========================================================================
	// CASO 1: MODO SIMULADO (Para pruebas)
	// ==========================================================================
	if (!USAR_MODBUS_REAL) {
		// Creamos un array falso con números aleatorios
		return Array.from({ length: cantidad }, (_, i) => ({
			index: i,
			address: inicio + i,
			value: Math.floor(Math.random() * 501), // Genera un valor entre 0 y 500
		}));
	}

	// ==========================================================================
	// CASO 2: MODO REAL (Producción)
	// ==========================================================================

	// Hacemos una petición HTTP al servidor backend
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

	const datos = await respuesta.json(); // Convertimos la respuesta a JSON

	// Si hubo un error en el servidor, lanzamos una excepción
	if (!respuesta.ok || !datos.ok) {
		throw new Error(datos.error || "Error en lectura Modbus");
	}

	// Transformamos los datos crudos al formato que usa nuestra app
	// Formato: { index: 0, address: 100, value: 230 }
	return datos.registros.map((valorRegistro, indice) => ({
		index: indice,
		address: inicio + indice,
		value: valorRegistro,
	}));
}
