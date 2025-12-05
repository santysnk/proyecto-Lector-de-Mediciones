/**
 * ==============================================================================
 * CONSTANTE: titulosMediciones.js
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Centraliza todos los textos y etiquetas que se muestran en las tarjetas de
 * los alimentadores.
 * 
 * CONTENIDO:
 * 1. TITULOS_MEDICIONES: El texto largo que describe qué se está midiendo
 *    (ej: "Tensión de línea (kV)").
 * 2. ETIQUETAS_POR_DEFECTO: Las letritas que van arriba de cada cajita
 *    (ej: "R", "S", "T" para corriente, o "L1", "L2", "L3" para potencia).
 * 3. DISEÑO_TARJETA_POR_DEFECTO: La configuración inicial que tiene una tarjeta
 *    nueva antes de que el usuario la personalice.
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
