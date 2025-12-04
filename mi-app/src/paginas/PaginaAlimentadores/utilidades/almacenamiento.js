/**
 * Funciones para trabajar con localStorage de forma segura
 * Manejan errores automáticamente para evitar crashes
 */

/**
 * Guarda datos en localStorage
 * Convierte automáticamente a JSON
 * 
 * @param {string} clave - Clave del storage
 * @param {any} datos - Datos a guardar (se convierten a JSON)
 * @returns {boolean} true si guardó correctamente, false si hubo error
 */
export const guardarEnStorage = (clave, datos) => {
	try {
		const textoJSON = JSON.stringify(datos);
		localStorage.setItem(clave, textoJSON);
		return true;
	} catch (error) {
		console.error(`Error al guardar ${clave}:`, error);
		return false;
	}
};

/**
 * Lee datos de localStorage
 * Si no existe o hay error, devuelve valorPorDefecto
 * 
 * @param {string} clave - Clave del storage
 * @param {any} valorPorDefecto - Valor si no existe o hay error
 * @returns {any} Datos leídos o valorPorDefecto
 */
export const leerDeStorage = (clave, valorPorDefecto = null) => {
	try {
		const textoGuardado = localStorage.getItem(clave);

		// Si no existe, devolver por defecto
		if (!textoGuardado) return valorPorDefecto;

		// Parsear JSON y devolver
		return JSON.parse(textoGuardado);
	} catch (error) {
		console.error(`Error al leer ${clave}:`, error);
		return valorPorDefecto;
	}
};

/**
 * Elimina un item de localStorage
 * 
 * @param {string} clave - Clave a eliminar
 */
export const eliminarDeStorage = (clave) => {
	try {
		localStorage.removeItem(clave);
	} catch (error) {
		console.error(`Error al eliminar ${clave}:`, error);
	}
};
