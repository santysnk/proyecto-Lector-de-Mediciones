/**
 * Funcionalidades disponibles para configurar relés de protección ABB Serie 615.
 * Cada funcionalidad define qué datos se pueden monitorear y su registro Modbus por defecto.
 */

export const FUNCIONALIDADES_DISPONIBLES = {
  // MEDICIONES
  corrientes: {
    id: "corrientes",
    nombre: "Corrientes de fase (IL1, IL2, IL3)",
    categoria: "mediciones",
    registroDefault: 137,
    cantidad: 3,
  },
  tensiones: {
    id: "tensiones",
    nombre: "Tensiones (VA, VB, VC, VAB, VBC, VCA)",
    categoria: "mediciones",
    registroDefault: 151,
    cantidad: 6,
  },
  corrienteResidual: {
    id: "corrienteResidual",
    nombre: "Corriente residual Io",
    categoria: "mediciones",
    registroDefault: 141,
    cantidad: 1,
  },
  potencias: {
    id: "potencias",
    nombre: "Potencias (P, Q, S, FP)",
    categoria: "mediciones",
    registroDefault: 160,
    cantidad: 7,
  },

  // ESTADOS Y ALARMAS
  estadoRele: {
    id: "estadoRele",
    nombre: "Estado del relé (Ready/Start/Trip)",
    categoria: "estados",
    registroDefault: 170,
    cantidad: 1,
  },
  leds: {
    id: "leds",
    nombre: "LEDs del panel (alarmas visibles)",
    categoria: "estados",
    registroDefault: 172,
    cantidad: 1,
  },
  posicionCB: {
    id: "posicionCB",
    nombre: "Posición del interruptor (CB)",
    categoria: "estados",
    registroDefault: 175,
    cantidad: 1,
  },

  // SISTEMA
  saludDispositivo: {
    id: "saludDispositivo",
    nombre: "Salud del dispositivo (SSR1 - Ready)",
    categoria: "sistema",
    registroDefault: 127,
    cantidad: 1,
  },
  heartbeat: {
    id: "heartbeat",
    nombre: "Heartbeat (SSR5 - Alive counter)",
    categoria: "sistema",
    registroDefault: 131,
    cantidad: 1,
  },
};

/**
 * Categorías de funcionalidades para agrupar en la UI
 */
export const CATEGORIAS_FUNCIONALIDADES = {
  mediciones: {
    id: "mediciones",
    nombre: "Mediciones",
    icono: "📊",
  },
  estados: {
    id: "estados",
    nombre: "Estados y Alarmas",
    icono: "🚦",
  },
  sistema: {
    id: "sistema",
    nombre: "Sistema",
    icono: "⚙️",
  },
};

/**
 * Key de localStorage para las plantillas de relé
 */
export const STORAGE_KEY_PLANTILLAS = "rw-plantillas-rele";

/**
 * Modos de visualización para el historial
 * Usados internamente para determinar cómo renderizar los datos
 * El modo se calcula en base a los flags de configHistorial
 */
export const MODOS_HISTORIAL = {
   /** Muestra cada registro como un tab separado (comportamiento por defecto) */
   INDIVIDUAL: "individual",
   /** Combina 2 registros en valor de 32 bits: (HIGH << 16) | LOW */
   COMBINAR_32BITS: "combinar32bits",
   /** Muestra timeline visual de bits activos (para estados/alarmas) */
   BITS: "bits",
};

/**
 * Configuración por defecto para el historial de una funcionalidad
 * Se usa cuando la funcionalidad no tiene configHistorial definido
 *
 * Campos:
 * - habilitado: Si se muestra en el selector de historial
 * - mostrarPromedio: Agrega tab "Prom" que muestra promedio de todos los registros
 * - combinar32bits: Combina registros HIGH/LOW en valor de 32 bits
 * - timelineBits: Muestra timeline visual de bits activos (para estados/alarmas)
 * - unidad: Unidad de medida para mostrar en gráfico
 * - decimales: Precisión decimal
 */
export const DEFAULT_CONFIG_HISTORIAL = {
   habilitado: true,
   mostrarPromedio: false,
   combinar32bits: false,
   timelineBits: false,
   unidad: null,
   decimales: 2,
};
