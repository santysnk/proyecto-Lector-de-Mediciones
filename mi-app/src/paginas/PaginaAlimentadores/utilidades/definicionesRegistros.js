// @ts-check
/**
 * Definiciones de registros Modbus para relés ABB REF615/RET615
 * Cada registro mapea sus bits a significados específicos.
 *
 * Basado en documentación ABB:
 * - REF615 Modbus Point List Manual (1MRS756581)
 * - Documentación Relés ABB Serie 615 - Subestación CELTA 1
 */

/** Registro 172 - Estado de LEDs del panel frontal */
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

/** Registro 170 - Estado de Disparo/Trip */
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

/** Registro 173 - Estado del Interruptor (simplificado) */
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

/** Registro 174 - Estado del Interruptor (detallado con bits 4-6) */
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
 * Solo bits 0 y 1 son significativos. Bits 2-15 son reservados.
 */
const REGISTRO_127_RELE = {
  nombre: "Salud Dispositivo (SSR1)",
  descripcion: "Estado de salud general del relé de protección",
  bits: {
    0: { nombre: "Error Global", descripcion: "Error crítico del dispositivo - Requiere atención inmediata", tipo: "error" },
    1: { nombre: "Warning Global", descripcion: "Advertencia del dispositivo - Revisar cuando sea posible", tipo: "warning" },
  },
  interpretacionEspecial: (valor) => {
    const error = (valor & 0x01) !== 0;
    const warning = (valor & 0x02) !== 0;

    if (error) {
      return { estado: "ERROR", clase: "error", icono: "⛔", descripcion: "Error global del dispositivo - Requiere atención inmediata" };
    } else if (warning) {
      return { estado: "WARNING", clase: "warning", icono: "⚠️", descripcion: "Advertencia del dispositivo - Revisar cuando sea posible" };
    } else {
      return { estado: "OK", clase: "ok", icono: "✅", descripcion: "Dispositivo funcionando correctamente" };
    }
  }
};

/** Registro 131 - Heartbeat / SSR5 (contador de vida, no interpretar como bits) */
const REGISTRO_131_HEARTBEAT = {
  nombre: "Heartbeat (SSR5)",
  descripcion: "Contador de vida del dispositivo",
  bits: {},
  interpretacionEspecial: (valor) => {
    if (valor > 0) {
      return { estado: "CONECTADO", clase: "ok", icono: "💚", descripcion: `Dispositivo activo (contador: ${valor})` };
    } else {
      return { estado: "VERIFICAR", clase: "warning", icono: "❓", descripcion: "Heartbeat en cero - Verificar conexión" };
    }
  }
};

/** Registro 179 - Estados de Protección (Sobrecorriente Fase) */
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

/** Registro 180 - Estados de Protección (Sobrecorriente Alta/Instantánea) */
const REGISTRO_180_PROTECCION = {
  nombre: "Prot. Sobrecorriente Alta",
  descripcion: "Estado de sobrecorriente alta e instantánea",
  bits: {
    2: { nombre: "PHHPTOC1 Operate", descripcion: "Sobrecorriente alta 1 - DISPARO", tipo: "alarma" },
    12: { nombre: "PHHPTOC2 Operate", descripcion: "Sobrecorriente alta 2 - DISPARO", tipo: "alarma" },
    14: { nombre: "PHIPTOC1 Start", descripcion: "Instantánea - Arranque", tipo: "warning" },
  }
};

/** Registro 181 - Estados de Protección (Instantánea y Direccional) */
const REGISTRO_181_PROTECCION = {
  nombre: "Prot. Instantánea/Direccional",
  descripcion: "Estado de protección instantánea y falla tierra direccional",
  bits: {
    6: { nombre: "PHIPTOC1 Operate", descripcion: "Instantánea - DISPARO", tipo: "alarma" },
    8: { nombre: "DEFLPDEF1 Start", descripcion: "Falla tierra dir. baja - Arranque", tipo: "warning" },
    10: { nombre: "DEFLPDEF1 Operate", descripcion: "Falla tierra dir. baja - DISPARO", tipo: "alarma" },
  }
};

/** Registro 182 - Estados de Protección (Falla a Tierra) */
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

/** Mapa completo de registros interpretables por dirección */
export const MAPA_REGISTROS = {
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

/** Categorías que requieren interpretación binaria */
export const CATEGORIAS_INTERPRETABLES = ["estados", "sistema"];
