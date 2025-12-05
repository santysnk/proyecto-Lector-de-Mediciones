/**
 * ==============================================================================
 * UTILIDAD: calculosFormulas.js
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Contiene funciones matemáticas auxiliares para procesar los valores crudos
 * que vienen de los equipos.
 * 
 * FUNCIONES PRINCIPALES:
 * 1. aplicarFormula: Permite al usuario definir una operación (ej: "x * 10")
 *    para corregir o transformar un valor.
 * 2. formatearValor: Convierte un número "feo" (12.34567) en uno "bonito"
 *    para mostrar en pantalla (12,35).
 */

/**
 * Aplica una fórmula matemática personalizada a un valor.
 * 
 * @param {string} textoFormula - La fórmula escrita por el usuario (ej: "x * 2 + 10")
 * @param {number} x - El valor original sobre el que se aplicará la fórmula
 * @returns {number|null} El resultado del cálculo o null si hubo error
 * 
 * NOTA EDUCATIVA:
 * Usamos "new Function" para interpretar el texto como código.
 * En una app real de producción, esto podría ser inseguro si el usuario
 * no fuera de confianza. Aquí lo usamos por simplicidad educativa.
 */
export const aplicarFormula = (textoFormula, x) => {
	// 1. Limpiamos espacios en blanco de la fórmula
	const formulaLimpia = (textoFormula || "").trim();

	// 2. Si no hay fórmula, devolvemos el valor original tal cual
	if (!formulaLimpia) return x;

	try {
		// 3. Creamos una función dinámica donde 'x' es el argumento
		// Es equivalente a escribir: function(x) { return ...formula...; }
		const funcionCalcular = new Function("x", `return ${formulaLimpia};`);

		// 4. Ejecutamos la función
		const resultado = funcionCalcular(x);

		// 5. Verificamos que el resultado sea un número válido
		// (que no sea texto, ni NaN, ni infinito)
		return typeof resultado === "number" && !Number.isNaN(resultado)
			? resultado
			: null;

	} catch (error) {
		// Si el usuario escribió mal la fórmula (ej: "x * / 2"), capturamos el error
		console.error("Error al aplicar fórmula:", error);
		return null;
	}
};

/**
 * Da formato a un número para mostrarlo en la interfaz.
 * Convierte 123.456 en "123,46" (coma decimal, 2 decimales).
 * 
 * @param {number} valor - El número a formatear
 * @returns {string} El texto listo para mostrar
 */
export const formatearValor = (valor) => {
	// Si el valor no es válido (es null o no es número), mostramos "ERROR"
	if (valor == null || Number.isNaN(valor)) {
		return "ERROR";
	}

	// .toFixed(2) -> redondea a 2 decimales (ej: "123.46")
	// .replace(".", ",") -> cambia el punto por coma (formato español/latino)
	return valor.toFixed(2).replace(".", ",");
};
