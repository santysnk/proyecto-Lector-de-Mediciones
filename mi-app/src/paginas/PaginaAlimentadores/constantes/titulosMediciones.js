/**
 * Títulos descriptivos para cada tipo de medición
 * Aparecen en las tarjetas de alimentadores
 */
export const TITULOS_MEDICIONES = {
	tension_linea: "Tensión de línea (kV)",
	tension_entre_lineas: "Tensión entre líneas (kV)",
	corriente_132: "Corriente de línea (A) (en 13,2 kV)",
	corriente_33: "Corriente de línea (A) (en 33 kV)",
	potencia_activa: "Potencia activa (kW)",
	potencia_reactiva: "Potencia reactiva (kVAr)",
	potencia_aparente: "Potencia aparente (kVA)",
	factor_potencia: "Factor de Potencia",
	frecuencia: "Frecuencia (Hz)",
	corriente_neutro: "Corriente de Neutro (A)",
};

/**
 * Etiquetas que aparecen en cada medidor (R, S, T, etc.)
 * Organizadas por tipo de medición
 */
export const ETIQUETAS_POR_DEFECTO = {
	corriente_132: ["R", "S", "T", "N"],
	corriente_33: ["R", "S", "T", "N"],
	tension_linea: ["R", "S", "T", "N"],
	tension_entre_lineas: ["L1-L2", "L2-L3", "L1-L3", ""],
	potencia_activa: ["L1", "L2", "L3", "Total"],
	potencia_reactiva: ["L1", "L2", "L3", "Total"],
	potencia_aparente: ["L1", "L2", "L3", "Total"],
	factor_potencia: ["L1", "L2", "L3", ""],
	frecuencia: ["L1", "L2", "L3", ""],
	corriente_neutro: ["N", "", "", ""],
};

/**
 * Diseño por defecto de una tarjeta de alimentador
 * Define qué se muestra en la parte superior e inferior
 */
export const DISEÑO_TARJETA_POR_DEFECTO = {
	superior: {
		tituloId: "corriente_132",
		tituloCustom: "",
		cantidad: 3,
		boxes: [],
	},
	inferior: {
		tituloId: "tension_linea",
		tituloCustom: "",
		cantidad: 3,
		boxes: [],
	},
};
