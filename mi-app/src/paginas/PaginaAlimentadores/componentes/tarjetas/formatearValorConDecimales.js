// src/paginas/PaginaAlimentadores/componentes/tarjetas/formatearValorConDecimales.js

/**
 * Formatea un valor según la cantidad de decimales configurada.
 * Solo afecta a valores numéricos, no modifica el valor interno.
 * @param {string} valor - Valor original (puede ser "--,--" o número con coma)
 * @param {number} decimales - Cantidad de decimales a mostrar (0, 1 o 2)
 */
export const formatearValorConDecimales = (valor, decimales) => {
	// Si no se especifica decimales, usar 2 por defecto
	if (decimales === undefined || decimales === null) return valor;

	// Si es placeholder, ajustar según decimales
	if (valor === "--,--" || valor === "--" || valor === "--,-") {
		if (decimales === 0) return "--";
		if (decimales === 1) return "--,-";
		return "--,--";
	}

	// Convertir coma a punto para parsear
	const numStr = String(valor).replace(",", ".");
	const num = parseFloat(numStr);
	if (isNaN(num)) return valor;

	return num.toFixed(decimales).replace(".", ",");
};
