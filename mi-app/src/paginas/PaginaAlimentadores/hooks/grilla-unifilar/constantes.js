/**
 * Constantes para el sistema de grilla unifiliar
 */

/** Clave base para localStorage */
export const CLAVE_BASE = "rw-grilla-unifilar";

/** Colores predefinidos para dibujar el diagrama unifiliar */
export const COLORES_UNIFILAR = [
   { id: "rojo", color: "#dc2626", nombre: "Rojo" },
   { id: "azul", color: "#2563eb", nombre: "Azul" },
   { id: "verde", color: "#16a34a", nombre: "Verde" },
   { id: "amarillo", color: "#ca8a04", nombre: "Amarillo" },
   { id: "naranja", color: "#ea580c", nombre: "Naranja" },
   { id: "rosa", color: "#db2777", nombre: "Rosa" },
   { id: "violeta", color: "#7c3aed", nombre: "Violeta" },
   { id: "celeste", color: "#0891b2", nombre: "Celeste" },
   { id: "blanco", color: "#ffffff", nombre: "Blanco" },
   { id: "negro", color: "#000000", nombre: "Negro" },
];

/** Fuentes disponibles para texto */
export const FUENTES_DISPONIBLES = [
   { id: "arial", nombre: "Arial", familia: "Arial, sans-serif" },
   { id: "helvetica", nombre: "Helvetica", familia: "Helvetica, Arial, sans-serif" },
   { id: "times", nombre: "Times New Roman", familia: "Times New Roman, serif" },
   { id: "courier", nombre: "Courier", familia: "Courier New, monospace" },
   { id: "georgia", nombre: "Georgia", familia: "Georgia, serif" },
   { id: "verdana", nombre: "Verdana", familia: "Verdana, sans-serif" },
];

/** Tamaños de fuente disponibles */
export const TAMANOS_FUENTE = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48];

/** Grosores de línea disponibles (en píxeles) */
export const GROSORES_LINEA = [
   { id: "fino", valor: 8, nombre: "Fino" },
   { id: "normal", valor: 12, nombre: "Normal" },
   { id: "medio", valor: 16, nombre: "Medio" },
   { id: "grueso", valor: 20, nombre: "Grueso" },
   { id: "extra", valor: 28, nombre: "Extra" },
];

/** Tipos de bornes para el sistema de chispas */
export const TIPOS_BORNE = {
   EMISOR: "EMISOR",
   RECEPTOR: "RECEPTOR",
};

/** Configuración por defecto de chispas */
export const CONFIG_CHISPAS_DEFAULT = {
   velocidad: 8, // celdas por segundo
   tamano: 4, // radio en píxeles
   color: "#fef08a", // amarillo brillante
   estela: true, // mostrar estela
   longitudEstela: 5, // cantidad de posiciones en la estela
   frecuenciaEmision: 2000, // ms entre emisiones
};

/** Estado inicial del hook */
export const ESTADO_INICIAL = {
   celdas: {},
   textos: [],
   grosorLinea: GROSORES_LINEA[1].valor,
   bornes: [],
   chispasConfig: CONFIG_CHISPAS_DEFAULT,
};

/** Estado inicial de configuración de texto */
export const CONFIG_TEXTO_INICIAL = {
   fuente: FUENTES_DISPONIBLES[0].familia,
   tamano: 16,
   negrita: false,
   cursiva: false,
};
