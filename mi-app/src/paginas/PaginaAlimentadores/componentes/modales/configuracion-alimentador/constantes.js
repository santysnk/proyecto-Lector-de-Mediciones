/**
 * Constantes para ModalConfiguracionAlimentador
 */

// Opciones predefinidas para el título del bloque (magnitudes típicas)
export const OPCIONES_TITULO = [
   { id: "tension_linea", label: "Tensión de línea (kV)" },
   { id: "tension_entre_lineas", label: "Tensión entre líneas (kV)" },
   { id: "corriente_132", label: "Corriente de línea (A) (en 13,2 kV)" },
   { id: "corriente_33", label: "Corriente de línea (A) (en 33 kV)" },
   { id: "potencia_activa", label: "Potencia activa (kW)" },
   { id: "potencia_reactiva", label: "Potencia reactiva (kVAr)" },
   { id: "potencia_aparente", label: "Potencia aparente (kVA)" },
   { id: "factor_potencia", label: "Factor de Potencia" },
   { id: "frecuencia", label: "Frecuencia (Hz)" },
   { id: "corriente_neutro", label: "Corriente de Neutro (A)" },
   { id: "custom", label: "Otro (personalizado)..." },
];

// Placeholders sugeridos para las etiquetas de cada box
export const PLACEHOLDERS_BOX = ["Ej: R o L1", "Ej: S o L2", "Ej: T o L3", "Ej: Total"];

/**
 * Diseño por defecto para un lado de la card
 */
export const crearSideDesignDefault = (tituloId = "corriente_132") => ({
   tituloId,
   tituloCustom: "",
   registrador_id: null,
   cantidad: 3,
   oculto: false,
   boxes: [
      { enabled: false, label: "", indice: null, formula: "" },
      { enabled: false, label: "", indice: null, formula: "" },
      { enabled: false, label: "", indice: null, formula: "" },
      { enabled: false, label: "", indice: null, formula: "" },
   ],
});

/**
 * Diseño por defecto para toda la card
 */
export const crearCardDesignDefault = () => ({
   superior: crearSideDesignDefault("corriente_132"),
   inferior: crearSideDesignDefault("tension_linea"),
});

// Intervalo de consulta por defecto en segundos
export const INTERVALO_CONSULTA_DEFAULT = 60;

// Intervalo mínimo permitido en segundos
export const INTERVALO_CONSULTA_MIN = 5;
