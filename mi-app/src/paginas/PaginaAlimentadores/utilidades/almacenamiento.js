/**
 * ==============================================================================
 * UTILIDAD: almacenamiento.js
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Provee funciones seguras para guardar y leer datos del navegador (localStorage).
 * "Seguras" significa que si algo falla (ej: memoria llena), la app no se rompe,
 * simplemente avisa del error en la consola.
 * 
 * FUNCIONES:
 * 1. guardarEnStorage: Guarda cualquier dato (texto, números, objetos).
 * 2. leerDeStorage: Recupera los datos guardados.
 * 3. eliminarDeStorage: Borra un dato específico.
 */

/**
 * Guarda datos en el almacenamiento local del navegador (localStorage).
 * Convierte automáticamente objetos a texto JSON antes de guardar.
 * 
 * @param {string} clave - Nombre único para identificar el dato (ej: "MIS_PUESTOS")
 * @param {any} datos - La información a guardar (puede ser un objeto, array, etc.)
 * @returns {boolean} true si se guardó bien, false si hubo error
 */
export const guardarEnStorage = (clave, datos) => {
	try {
		// Convertimos el dato a texto (JSON) porque localStorage solo guarda texto
		const textoJSON = JSON.stringify(datos);
		localStorage.setItem(clave, textoJSON);
		return true;
	} catch (error) {
		// Si falla (ej: disco lleno, modo incógnito estricto), avisamos pero no rompemos la app
		console.error(`Error al guardar ${clave}:`, error);
		return false;
	}
};

/**
 * Recupera datos del almacenamiento local.
 * 
 * @param {string} clave - El nombre del dato a recuperar
 * @param {any} valorPorDefecto - Qué devolver si el dato no existe (opcional, default: null)
 * @returns {any} Los datos originales (convertidos de vuelta a objeto/array)
 */
export const leerDeStorage = (clave, valorPorDefecto = null) => {
	try {
		const textoGuardado = localStorage.getItem(clave);

		// Si no hay nada guardado con esa clave, devolvemos el valor por defecto
		if (!textoGuardado) return valorPorDefecto;

		// Convertimos el texto JSON de vuelta a datos reales (objeto, array, etc.)
		return JSON.parse(textoGuardado);
	} catch (error) {
		console.error(`Error al leer ${clave}:`, error);
		return valorPorDefecto;
	}
};

/**
 * Elimina un dato específico del almacenamiento.
 * 
 * @param {string} clave - El nombre del dato a borrar
 */
export const eliminarDeStorage = (clave) => {
	try {
		localStorage.removeItem(clave);
	} catch (error) {
		console.error(`Error al eliminar ${clave}:`, error);
	}
};
