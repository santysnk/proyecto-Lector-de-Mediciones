/**
 * Aplica una fórmula matemática a un valor 'x'
 * Ejemplo: aplicarFormula("x * 2 + 10", 5) => 20
 * 
 * NOTA EDUCATIVA: Usamos new Function() solo para ambiente de aprendizaje.
 * En producción se usaría una librería como mathjs para mayor seguridad.
 * 
 * @param {string} textoFormula - Fórmula en texto, ej: "x / 100"
 * @param {number} x - Valor al que aplicar la fórmula
 * @returns {number|null} Resultado o null si hay error
 */
export const aplicarFormula = (textoFormula, x) => {
	const formulaLimpia = (textoFormula || "").trim();

	// Si no hay fórmula, devolver el valor sin cambios
	if (!formulaLimpia) return x;

	try {
		// Crear función dinámica (solo para ambiente educativo!)
		const funcionCalcular = new Function("x", `return ${formulaLimpia};`);
		const resultado = funcionCalcular(x);

		// Verificar que sea número válido
		return typeof resultado === "number" && !Number.isNaN(resultado)
			? resultado
			: null;
	} catch (error) {
		console.error("Error al aplicar fórmula:", error);
		return null;
	}
};

/**
 * Formatea un número para mostrarlo en la interfaz
 * Ejemplos: 
 *   - 123.456 => "123,46"
 *   - null => "ERROR"
 *   - NaN => "ERROR"
 * 
 * @param {number} valor - Número a formatear
 * @returns {string} Valor formateado con 2 decimales y coma
 */
export const formatearValor = (valor) => {
	// Si es inválido, mostrar ERROR
	if (valor == null || Number.isNaN(valor)) {
		return "ERROR";
	}

	// Convertir a 2 decimales y cambiar punto por coma
	return valor.toFixed(2).replace(".", ",");
};
