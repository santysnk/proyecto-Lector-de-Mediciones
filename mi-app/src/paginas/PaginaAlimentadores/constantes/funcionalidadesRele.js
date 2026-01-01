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
 * Obtiene las funcionalidades agrupadas por categoría
 */
export const getFuncionalidadesPorCategoria = () => {
  const agrupadas = {};

  Object.values(FUNCIONALIDADES_DISPONIBLES).forEach((func) => {
    if (!agrupadas[func.categoria]) {
      agrupadas[func.categoria] = {
        ...CATEGORIAS_FUNCIONALIDADES[func.categoria],
        funcionalidades: [],
      };
    }
    agrupadas[func.categoria].funcionalidades.push(func);
  });

  return agrupadas;
};

/**
 * Key de localStorage para las plantillas de relé
 */
export const STORAGE_KEY_PLANTILLAS = "rw-plantillas-rele";
