/**
 * Intérprete de Registros Modbus para Relés ABB REF615/RET615
 *
 * Este módulo interpreta los valores binarios de los registros de estado
 * del relé, decodificando qué bits están activos y su significado.
 *
 * MODO DE FUNCIONAMIENTO:
 * 1. Si la plantilla tiene etiquetas personalizadas para el registro, se usan esas
 * 2. Si no, se usan las etiquetas por defecto definidas en este archivo
 *
 * Basado en documentación ABB:
 * - REF615 Modbus Point List Manual (1MRS756581)
 * - Documentación Relés ABB Serie 615 - Subestación CELTA 1
 */

// ============================================================================
// DEFINICIONES DE REGISTROS Y SUS BITS
// ============================================================================

/**
 * Registro 172 - Estado de LEDs del panel frontal
 * Cada bit representa un LED específico del relé
 */
const REGISTRO_172_LEDS = {
  nombre: "Estado LEDs",
  descripcion: "Indicadores luminosos del panel frontal del relé",
  bits: {
    0: { nombre: "Ready", descripcion: "Relé listo/operativo", tipo: "estado" },
    1: { nombre: "Start", descripcion: "Protección en arranque", tipo: "alarma" },
    2: { nombre: "Trip", descripcion: "Disparo activo", tipo: "alarma" },
    3: { nombre: "Alarm", descripcion: "Alarma general activa", tipo: "alarma" },
    4: { nombre: "Warning", descripcion: "Advertencia activa", tipo: "warning" },
    5: { nombre: "IR Fault", descripcion: "Falla interna del relé", tipo: "error" },
    6: { nombre: "Blocked", descripcion: "Protección bloqueada", tipo: "warning" },
    7: { nombre: "Test Mode", descripcion: "Modo de prueba activo", tipo: "info" },
    8: { nombre: "LED 9", descripcion: "LED programable 9", tipo: "info" },
    9: { nombre: "LED 10", descripcion: "LED programable 10", tipo: "info" },
    10: { nombre: "LED 11", descripcion: "LED programable 11", tipo: "info" },
    11: { nombre: "LED 12", descripcion: "LED programable 12", tipo: "info" },
  }
};

/**
 * Registro 170 - Estado de Disparo/Trip
 * Indica la causa del último disparo
 */
const REGISTRO_170_DISPARO = {
  nombre: "Estado Disparo",
  descripcion: "Señales de disparo y arranque de protecciones",
  bits: {
    0: { nombre: "Trip General", descripcion: "Señal de disparo general", tipo: "alarma" },
    1: { nombre: "Start General", descripcion: "Señal de arranque general", tipo: "warning" },
    2: { nombre: "Trip 50", descripcion: "Disparo por sobrecorriente instantánea", tipo: "alarma" },
    3: { nombre: "Trip 51", descripcion: "Disparo por sobrecorriente temporizada", tipo: "alarma" },
    4: { nombre: "Trip 50N", descripcion: "Disparo por falla tierra instantánea", tipo: "alarma" },
    5: { nombre: "Trip 51N", descripcion: "Disparo por falla tierra temporizada", tipo: "alarma" },
    6: { nombre: "Trip 50BF", descripcion: "Disparo por falla de interruptor", tipo: "alarma" },
    7: { nombre: "Trip 67", descripcion: "Disparo direccional", tipo: "alarma" },
  }
};

/**
 * Registro 173 - Estado del Interruptor (simplificado)
 */
const REGISTRO_173_INTERRUPTOR_SIMPLE = {
  nombre: "Estado Interruptor",
  descripcion: "Posición del interruptor de potencia",
  bits: {
    0: { nombre: "Cerrado", descripcion: "Interruptor en posición cerrada", tipo: "estado" },
    1: { nombre: "Abierto", descripcion: "Interruptor en posición abierta", tipo: "estado" },
    2: { nombre: "Transición", descripcion: "Interruptor en movimiento", tipo: "warning" },
    3: { nombre: "Error", descripcion: "Error en indicación de posición", tipo: "error" },
  }
};

/**
 * Registro 174 - Estado del Interruptor (detallado con bits 4-6)
 * Según documentación ABB, bits 4, 5, 6 indican el estado
 */
const REGISTRO_174_INTERRUPTOR = {
  nombre: "Estado Interruptor (CBXCBR)",
  descripcion: "Control y estado del interruptor principal",
  bits: {
    4: { nombre: "Cerrado", descripcion: "Interruptor CERRADO (energizado)", tipo: "estado" },
    5: { nombre: "Abierto", descripcion: "Interruptor ABIERTO (desenergizado)", tipo: "estado" },
    6: { nombre: "Error/Intermedio", descripcion: "Estado intermedio o error", tipo: "error" },
  },
  interpretacionEspecial: (valor) => {
    const cerrado = (valor >> 4) & 1;
    const abierto = (valor >> 5) & 1;
    const error = (valor >> 6) & 1;

    if (error) return { estado: "ERROR", clase: "error", descripcion: "Estado intermedio o falla de contacto auxiliar" };
    if (cerrado && !abierto) return { estado: "CERRADO", clase: "ok", descripcion: "Interruptor cerrado - circuito energizado" };
    if (abierto && !cerrado) return { estado: "ABIERTO", clase: "warning", descripcion: "Interruptor abierto - circuito desenergizado" };
    return { estado: "DESCONOCIDO", clase: "unknown", descripcion: "Estado no determinado" };
  }
};

/**
 * Registro 127 - Estado del Relé / SSR1 (Salud del dispositivo)
 *
 * IMPORTANTE: Según el manual ABB, solo los bits 0 y 1 son significativos:
 * - Bit 0: Error global del dispositivo (crítico)
 * - Bit 1: Warning global del dispositivo
 * - Bits 2-15: Reservados (ignorar)
 *
 * Un valor como 4 (bit 2) NO indica alarma - el dispositivo está OK.
 */
const REGISTRO_127_RELE = {
  nombre: "Salud Dispositivo (SSR1)",
  descripcion: "Estado de salud general del relé de protección",
  bits: {
    0: { nombre: "Error Global", descripcion: "Error crítico del dispositivo - Requiere atención inmediata", tipo: "error" },
    1: { nombre: "Warning Global", descripcion: "Advertencia del dispositivo - Revisar cuando sea posible", tipo: "warning" },
    // Bits 2-15 son reservados y se ignoran
  },
  interpretacionEspecial: (valor) => {
    const error = (valor & 0x01) !== 0;    // Bit 0
    const warning = (valor & 0x02) !== 0;  // Bit 1

    if (error) {
      return {
        estado: "ERROR",
        clase: "error",
        icono: "⛔",
        descripcion: "Error global del dispositivo - Requiere atención inmediata"
      };
    } else if (warning) {
      return {
        estado: "WARNING",
        clase: "warning",
        icono: "⚠️",
        descripcion: "Advertencia del dispositivo - Revisar cuando sea posible"
      };
    } else {
      return {
        estado: "OK",
        clase: "ok",
        icono: "✅",
        descripcion: "Dispositivo funcionando correctamente"
      };
    }
  }
};

/**
 * Registro 131 - Heartbeat / SSR5
 *
 * Este es un contador que incrementa constantemente mientras el relé está vivo.
 * NO se debe interpretar como bits - es un valor numérico de heartbeat.
 */
const REGISTRO_131_HEARTBEAT = {
  nombre: "Heartbeat (SSR5)",
  descripcion: "Contador de vida del dispositivo",
  bits: {}, // No tiene bits significativos - es un contador
  interpretacionEspecial: (valor) => {
    if (valor > 0) {
      return {
        estado: "CONECTADO",
        clase: "ok",
        icono: "💚",
        descripcion: `Dispositivo activo (contador: ${valor})`
      };
    } else {
      return {
        estado: "VERIFICAR",
        clase: "warning",
        icono: "❓",
        descripcion: "Heartbeat en cero - Verificar conexión"
      };
    }
  }
};

/**
 * Registro 179 - Estados de Protección (Sobrecorriente Fase)
 */
const REGISTRO_179_PROTECCION = {
  nombre: "Prot. Sobrecorriente Fase",
  descripcion: "Estado de funciones de sobrecorriente de fase",
  bits: {
    0: { nombre: "PHLPTOC1 Start", descripcion: "Sobrecorriente baja - Arranque", tipo: "warning" },
    1: { nombre: "PHLPTOC1 StartL1", descripcion: "Sobrecorriente baja L1 - Arranque", tipo: "warning" },
    2: { nombre: "PHLPTOC1 StartL2", descripcion: "Sobrecorriente baja L2 - Arranque", tipo: "warning" },
    3: { nombre: "PHLPTOC1 StartL3", descripcion: "Sobrecorriente baja L3 - Arranque", tipo: "warning" },
    8: { nombre: "PHLPTOC1 Operate", descripcion: "Sobrecorriente baja - DISPARO", tipo: "alarma" },
    10: { nombre: "PHHPTOC1 Start", descripcion: "Sobrecorriente alta - Arranque", tipo: "warning" },
  }
};

/**
 * Registro 180 - Estados de Protección (Sobrecorriente Alta/Instantánea)
 */
const REGISTRO_180_PROTECCION = {
  nombre: "Prot. Sobrecorriente Alta",
  descripcion: "Estado de sobrecorriente alta e instantánea",
  bits: {
    2: { nombre: "PHHPTOC1 Operate", descripcion: "Sobrecorriente alta 1 - DISPARO", tipo: "alarma" },
    12: { nombre: "PHHPTOC2 Operate", descripcion: "Sobrecorriente alta 2 - DISPARO", tipo: "alarma" },
    14: { nombre: "PHIPTOC1 Start", descripcion: "Instantánea - Arranque", tipo: "warning" },
  }
};

/**
 * Registro 181 - Estados de Protección (Instantánea y Direccional)
 */
const REGISTRO_181_PROTECCION = {
  nombre: "Prot. Instantánea/Direccional",
  descripcion: "Estado de protección instantánea y falla tierra direccional",
  bits: {
    6: { nombre: "PHIPTOC1 Operate", descripcion: "Instantánea - DISPARO", tipo: "alarma" },
    8: { nombre: "DEFLPDEF1 Start", descripcion: "Falla tierra dir. baja - Arranque", tipo: "warning" },
    10: { nombre: "DEFLPDEF1 Operate", descripcion: "Falla tierra dir. baja - DISPARO", tipo: "alarma" },
  }
};

/**
 * Registro 182 - Estados de Protección (Falla a Tierra)
 */
const REGISTRO_182_PROTECCION = {
  nombre: "Prot. Falla a Tierra",
  descripcion: "Estado de protecciones de falla a tierra",
  bits: {
    4: { nombre: "EFLPTOC1 Start", descripcion: "Falla tierra baja - Arranque", tipo: "warning" },
    6: { nombre: "EFLPTOC1 Operate", descripcion: "Falla tierra baja - DISPARO", tipo: "alarma" },
    12: { nombre: "EFHPTOC1 Start", descripcion: "Falla tierra alta - Arranque", tipo: "warning" },
    14: { nombre: "EFHPTOC1 Operate", descripcion: "Falla tierra alta - DISPARO", tipo: "alarma" },
  }
};

// ============================================================================
// MAPA DE REGISTROS INTERPRETABLES
// ============================================================================

const MAPA_REGISTROS = {
  127: REGISTRO_127_RELE,
  131: REGISTRO_131_HEARTBEAT,
  170: REGISTRO_170_DISPARO,
  172: REGISTRO_172_LEDS,
  173: REGISTRO_173_INTERRUPTOR_SIMPLE,
  174: REGISTRO_174_INTERRUPTOR,
  179: REGISTRO_179_PROTECCION,
  180: REGISTRO_180_PROTECCION,
  181: REGISTRO_181_PROTECCION,
  182: REGISTRO_182_PROTECCION,
};

// Categorías que requieren interpretación binaria
const CATEGORIAS_INTERPRETABLES = ["estados", "sistema"];

// ============================================================================
// FUNCIONES DE INTERPRETACIÓN
// ============================================================================

/**
 * Interpreta un valor de registro y devuelve los bits activos con su significado
 * @param {number} numeroRegistro - Número del registro Modbus
 * @param {number} valor - Valor leído del registro (0-65535)
 * @param {Object} etiquetasPersonalizadas - Etiquetas de la plantilla (opcional)
 *        Formato: { 0: { texto: "Arranque I>", severidad: "warning" }, ... }
 * @returns {Object} Interpretación del registro
 */
export function interpretarRegistro(numeroRegistro, valor, etiquetasPersonalizadas = null) {
  const definicionBase = MAPA_REGISTROS[numeroRegistro];

  // Si hay etiquetas personalizadas, usarlas; si no, usar las por defecto
  const tieneEtiquetasPersonalizadas = etiquetasPersonalizadas &&
    Object.keys(etiquetasPersonalizadas).length > 0;

  // Si no hay definición base ni etiquetas personalizadas, hacer decodificación genérica
  if (!definicionBase && !tieneEtiquetasPersonalizadas) {
    return interpretarGenerico(numeroRegistro, valor);
  }

  const bitsActivos = [];
  const bitsInactivos = [];

  // Determinar qué bits analizar (0-15 para registro de 16 bits)
  for (let posicion = 0; posicion < 16; posicion++) {
    const estaActivo = ((valor >> posicion) & 1) === 1;

    // Buscar etiqueta: primero personalizada, luego por defecto
    let etiqueta = null;
    let severidad = "info";
    let descripcion = `Bit ${posicion}`;

    if (tieneEtiquetasPersonalizadas && etiquetasPersonalizadas[posicion]) {
      const etiquetaPersonalizada = etiquetasPersonalizadas[posicion];
      etiqueta = etiquetaPersonalizada.texto || etiquetaPersonalizada;
      severidad = etiquetaPersonalizada.severidad || "info";
      descripcion = etiqueta;
    } else if (definicionBase && definicionBase.bits[posicion]) {
      const bitBase = definicionBase.bits[posicion];
      etiqueta = bitBase.nombre;
      severidad = bitBase.tipo;
      descripcion = bitBase.descripcion;
    }

    // Solo incluir bits que tienen etiqueta definida
    // IMPORTANTE: NO mostrar bits activos sin etiqueta (evita "Bit 12", "Bit 14" sin significado)
    if (etiqueta) {
      const bitData = {
        posicion,
        nombre: etiqueta,
        descripcion,
        tipo: severidad,
        activo: estaActivo
      };

      if (estaActivo) {
        bitsActivos.push(bitData);
      } else {
        // Solo incluir bits inactivos si tienen etiqueta
        bitsInactivos.push(bitData);
      }
    }
  }

  // Interpretación especial si existe en la definición base
  let interpretacionEspecial = null;
  if (definicionBase && definicionBase.interpretacionEspecial) {
    interpretacionEspecial = definicionBase.interpretacionEspecial(valor);
  }

  const nombreRegistro = definicionBase?.nombre || `Registro ${numeroRegistro}`;
  const descripcionRegistro = definicionBase?.descripcion || "Registro con etiquetas personalizadas";

  return {
    tieneInterpretacion: true,
    usaEtiquetasPersonalizadas: tieneEtiquetasPersonalizadas,
    numeroRegistro,
    valor,
    binario: valor.toString(2).padStart(16, "0"),
    hexadecimal: "0x" + valor.toString(16).toUpperCase().padStart(4, "0"),
    nombreRegistro,
    descripcionRegistro,
    bitsActivos,
    bitsInactivos,
    interpretacionEspecial,
    resumen: generarResumen(bitsActivos, interpretacionEspecial)
  };
}

/**
 * Interpretación genérica para registros sin definición
 * Muestra todos los bits activos sin etiquetas
 */
function interpretarGenerico(numeroRegistro, valor) {
  const bitsActivos = [];

  for (let posicion = 0; posicion < 16; posicion++) {
    if (((valor >> posicion) & 1) === 1) {
      bitsActivos.push({
        posicion,
        nombre: `Bit ${posicion}`,
        descripcion: `Bit ${posicion} activo`,
        tipo: "info",
        activo: true
      });
    }
  }

  return {
    tieneInterpretacion: true,
    usaEtiquetasPersonalizadas: false,
    numeroRegistro,
    valor,
    binario: valor.toString(2).padStart(16, "0"),
    hexadecimal: "0x" + valor.toString(16).toUpperCase().padStart(4, "0"),
    nombreRegistro: `Registro ${numeroRegistro}`,
    descripcionRegistro: "Sin definición de etiquetas",
    bitsActivos,
    bitsInactivos: [],
    interpretacionEspecial: null,
    resumen: bitsActivos.length > 0
      ? `${bitsActivos.length} bit(s) activo(s): ${bitsActivos.map(b => b.posicion).join(", ")}`
      : "Sin bits activos"
  };
}

/**
 * Genera un resumen legible de los bits activos
 */
function generarResumen(bitsActivos, interpretacionEspecial) {
  if (interpretacionEspecial) {
    return interpretacionEspecial.descripcion;
  }

  if (bitsActivos.length === 0) {
    return "Sin señales activas";
  }

  // Priorizar alarmas y errores en el resumen
  const alarmas = bitsActivos.filter(b => b.tipo === "alarma");
  const errores = bitsActivos.filter(b => b.tipo === "error");
  const warnings = bitsActivos.filter(b => b.tipo === "warning");
  const estados = bitsActivos.filter(b => b.tipo === "estado" || b.tipo === "info");

  const partes = [];

  if (errores.length > 0) {
    partes.push(`ERRORES: ${errores.map(e => e.nombre).join(", ")}`);
  }
  if (alarmas.length > 0) {
    partes.push(`ALARMAS: ${alarmas.map(a => a.nombre).join(", ")}`);
  }
  if (warnings.length > 0) {
    partes.push(`Warnings: ${warnings.map(w => w.nombre).join(", ")}`);
  }
  if (estados.length > 0 && partes.length === 0) {
    partes.push(estados.map(e => e.nombre).join(", "));
  }

  return partes.join(" | ");
}

/**
 * Verifica si un registro tiene interpretación disponible
 * @param {number} numeroRegistro - Número del registro
 * @returns {boolean}
 */
export function tieneInterpretacion(numeroRegistro) {
  return Object.prototype.hasOwnProperty.call(MAPA_REGISTROS, numeroRegistro);
}

/**
 * Obtiene la definición de un registro
 * @param {number} numeroRegistro - Número del registro
 * @returns {Object|null}
 */
export function obtenerDefinicionRegistro(numeroRegistro) {
  return MAPA_REGISTROS[numeroRegistro] || null;
}

/**
 * Verifica si una categoría de funcionalidad requiere interpretación
 * @param {string} categoriaId - ID de la categoría
 * @returns {boolean}
 */
export function categoriaRequiereInterpretacion(categoriaId) {
  return CATEGORIAS_INTERPRETABLES.includes(categoriaId);
}

/**
 * Obtiene el tipo CSS para un bit según su tipo
 * @param {string} tipo - Tipo del bit (alarma, error, warning, estado, info)
 * @returns {string} Clase CSS a aplicar
 */
export function obtenerClaseTipo(tipo) {
  const clases = {
    alarma: "interpretacion-alarma",
    error: "interpretacion-error",
    warning: "interpretacion-warning",
    estado: "interpretacion-estado",
    info: "interpretacion-info",
    ok: "interpretacion-ok",
    unknown: "interpretacion-unknown"
  };
  return clases[tipo] || "interpretacion-info";
}

/**
 * Obtiene las etiquetas por defecto de un registro para usar en el formulario
 * @param {number} numeroRegistro - Número del registro
 * @returns {Object} - { bit: { texto, severidad }, ... }
 */
export function obtenerEtiquetasDefecto(numeroRegistro) {
  const definicion = MAPA_REGISTROS[numeroRegistro];
  if (!definicion) return {};

  const etiquetas = {};
  Object.entries(definicion.bits).forEach(([bitPos, bitInfo]) => {
    etiquetas[bitPos] = {
      texto: bitInfo.nombre,
      severidad: bitInfo.tipo
    };
  });

  return etiquetas;
}

/**
 * Lista de severidades disponibles para etiquetas
 */
export const SEVERIDADES_DISPONIBLES = [
  { id: "info", nombre: "Info", color: "#93c5fd" },
  { id: "estado", nombre: "Estado", color: "#93c5fd" },
  { id: "warning", nombre: "Advertencia", color: "#fde68a" },
  { id: "alarma", nombre: "Alarma", color: "#fca5a5" },
  { id: "error", nombre: "Error", color: "#fca5a5" }
];

/**
 * Plantillas predefinidas de etiquetas para diferentes tipos de relés
 * El usuario puede seleccionar una de estas como base
 */
export const PLANTILLAS_ETIQUETAS_LEDS = {
  alimentador: {
    nombre: "Alimentador (FE03)",
    etiquetas: {
      0: { texto: "Arranque I>", severidad: "warning" },
      1: { texto: "Disparo I>", severidad: "alarma" },
      2: { texto: "Falla a Tierra / Disparo I>>", severidad: "alarma" },
      3: { texto: "Disparo I>>", severidad: "alarma" },
      4: { texto: "Arranque Io>", severidad: "warning" },
      5: { texto: "Disparo Falla a Tierra", severidad: "alarma" },
      6: { texto: "Desbalance de Fases", severidad: "warning" },
      7: { texto: "Recierre Habilitado", severidad: "info" },
      8: { texto: "Recierre en Progreso", severidad: "info" },
      9: { texto: "Pos CB Abierto", severidad: "estado" },
      10: { texto: "Pos CB Cerrado", severidad: "estado" }
    }
  },
  terna: {
    nombre: "TERNA (FE06)",
    etiquetas: {
      0: { texto: "Sobreintensidad", severidad: "warning" },
      1: { texto: "Falta a tierra", severidad: "alarma" },
      2: { texto: "Sobre/sub tensión", severidad: "warning" },
      3: { texto: "Desbalance de fases", severidad: "warning" },
      4: { texto: "Sobrecarga térmica", severidad: "warning" },
      5: { texto: "Fallo de interruptor", severidad: "error" },
      6: { texto: "Disparo reg. perturb.", severidad: "info" },
      7: { texto: "Monitorización interruptor", severidad: "info" },
      8: { texto: "Supervisión", severidad: "info" }
    }
  },
  trafoDif: {
    nombre: "TRAFO Diferencial (TE02)",
    etiquetas: {
      0: { texto: "Prot dif pol. etapa baja", severidad: "warning" },
      1: { texto: "Prot. dif. etapa alta", severidad: "alarma" },
      2: { texto: "Sobreintensidad", severidad: "warning" },
      3: { texto: "Falta a tierra restringida", severidad: "alarma" },
      4: { texto: "Falta a tierra", severidad: "alarma" },
      5: { texto: "Fallo de interruptor", severidad: "error" },
      6: { texto: "F. sec. neg. / sobrecarga 1°", severidad: "warning" },
      7: { texto: "Disparo reg. perturb.", severidad: "info" },
      8: { texto: "Supervisión", severidad: "info" },
      9: { texto: "Disparo externo", severidad: "alarma" }
    }
  }
};

/**
 * Exportar mapa de registros para referencia
 */
export const REGISTROS_INTERPRETABLES = MAPA_REGISTROS;

export default {
  interpretarRegistro,
  tieneInterpretacion,
  obtenerDefinicionRegistro,
  categoriaRequiereInterpretacion,
  obtenerClaseTipo,
  obtenerEtiquetasDefecto,
  REGISTROS_INTERPRETABLES,
  SEVERIDADES_DISPONIBLES,
  PLANTILLAS_ETIQUETAS_LEDS
};
