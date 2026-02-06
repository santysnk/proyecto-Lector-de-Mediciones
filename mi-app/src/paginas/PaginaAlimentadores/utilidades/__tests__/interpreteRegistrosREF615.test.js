import { describe, it, expect } from "vitest";
import {
  interpretarRegistro,
  tieneInterpretacion,
  categoriaRequiereInterpretacion,
  obtenerClaseTipo,
  SEVERIDADES_DISPONIBLES,
  PLANTILLAS_ETIQUETAS_LEDS,
} from "../interpreteRegistrosREF615";

// ============================================================================
// tieneInterpretacion
// ============================================================================
describe("tieneInterpretacion", () => {
  it("devuelve true para registros conocidos", () => {
    expect(tieneInterpretacion(127)).toBe(true); // Salud dispositivo
    expect(tieneInterpretacion(131)).toBe(true); // Heartbeat
    expect(tieneInterpretacion(170)).toBe(true); // Disparo
    expect(tieneInterpretacion(172)).toBe(true); // LEDs
    expect(tieneInterpretacion(173)).toBe(true); // Interruptor simple
    expect(tieneInterpretacion(174)).toBe(true); // Interruptor detallado
    expect(tieneInterpretacion(179)).toBe(true); // Protección fase
    expect(tieneInterpretacion(180)).toBe(true); // Protección alta
    expect(tieneInterpretacion(181)).toBe(true); // Prot instantánea
    expect(tieneInterpretacion(182)).toBe(true); // Falla tierra
  });

  it("devuelve false para registros sin definición", () => {
    expect(tieneInterpretacion(100)).toBe(false);
    expect(tieneInterpretacion(137)).toBe(false); // Corriente — no es de estado
    expect(tieneInterpretacion(999)).toBe(false);
  });
});

// ============================================================================
// categoriaRequiereInterpretacion
// ============================================================================
describe("categoriaRequiereInterpretacion", () => {
  it("devuelve true para estados y sistema", () => {
    expect(categoriaRequiereInterpretacion("estados")).toBe(true);
    expect(categoriaRequiereInterpretacion("sistema")).toBe(true);
  });

  it("devuelve false para mediciones y otros", () => {
    expect(categoriaRequiereInterpretacion("mediciones")).toBe(false);
    expect(categoriaRequiereInterpretacion("alarmas")).toBe(false);
    expect(categoriaRequiereInterpretacion("otros")).toBe(false);
  });
});

// ============================================================================
// obtenerClaseTipo
// ============================================================================
describe("obtenerClaseTipo", () => {
  it("devuelve la clase correcta para cada tipo", () => {
    expect(obtenerClaseTipo("alarma")).toBe("interpretacion-alarma");
    expect(obtenerClaseTipo("error")).toBe("interpretacion-error");
    expect(obtenerClaseTipo("warning")).toBe("interpretacion-warning");
    expect(obtenerClaseTipo("estado")).toBe("interpretacion-estado");
    expect(obtenerClaseTipo("info")).toBe("interpretacion-info");
    expect(obtenerClaseTipo("ok")).toBe("interpretacion-ok");
  });

  it("devuelve info como fallback para tipo desconocido", () => {
    expect(obtenerClaseTipo("desconocido")).toBe("interpretacion-info");
    expect(obtenerClaseTipo(undefined)).toBe("interpretacion-info");
  });
});

// ============================================================================
// interpretarRegistro — Registro 172 (LEDs)
// ============================================================================
describe("interpretarRegistro — Registro 172 (LEDs)", () => {
  it("interpreta valor 0 — sin bits activos", () => {
    const resultado = interpretarRegistro(172, 0);
    expect(resultado.tieneInterpretacion).toBe(true);
    expect(resultado.bitsActivos).toHaveLength(0);
    expect(resultado.resumen).toBe("Sin señales activas");
  });

  it("interpreta bit 0 (Ready) activo", () => {
    const resultado = interpretarRegistro(172, 1); // bit 0 = 1
    expect(resultado.bitsActivos).toHaveLength(1);
    expect(resultado.bitsActivos[0].nombre).toBe("Ready");
    expect(resultado.bitsActivos[0].tipo).toBe("estado");
  });

  it("interpreta bit 2 (Trip) activo", () => {
    const resultado = interpretarRegistro(172, 4); // bit 2 = 1
    expect(resultado.bitsActivos).toHaveLength(1);
    expect(resultado.bitsActivos[0].nombre).toBe("Trip");
    expect(resultado.bitsActivos[0].tipo).toBe("alarma");
  });

  it("interpreta múltiples bits activos (Ready + Trip + Alarm)", () => {
    const resultado = interpretarRegistro(172, 0b00001101); // bits 0, 2, 3
    const nombres = resultado.bitsActivos.map((b) => b.nombre);
    expect(nombres).toContain("Ready");
    expect(nombres).toContain("Trip");
    expect(nombres).toContain("Alarm");
  });

  it("interpreta todos los LEDs activos (0xFFF = 12 bits)", () => {
    const resultado = interpretarRegistro(172, 0x0FFF); // 12 bits activos
    expect(resultado.bitsActivos).toHaveLength(12);
  });

  it("ignora bits 12-15 que no tienen definición", () => {
    // Valor con bits 12-15 activos pero sin etiqueta → NO deben aparecer
    const resultado = interpretarRegistro(172, 0xF000);
    expect(resultado.bitsActivos).toHaveLength(0);
  });

  it("genera binario y hexadecimal correctos", () => {
    const resultado = interpretarRegistro(172, 5); // 0b0000000000000101
    expect(resultado.binario).toBe("0000000000000101");
    expect(resultado.hexadecimal).toBe("0x0005");
  });

  it("incluye el resumen con alarmas priorizadas", () => {
    const resultado = interpretarRegistro(172, 0b00000110); // Start + Trip
    expect(resultado.resumen).toContain("ALARMAS");
  });
});

// ============================================================================
// interpretarRegistro — Registro 170 (Disparo/Trip)
// ============================================================================
describe("interpretarRegistro — Registro 170 (Disparo)", () => {
  it("interpreta Trip General (bit 0)", () => {
    const resultado = interpretarRegistro(170, 1);
    expect(resultado.bitsActivos[0].nombre).toBe("Trip General");
    expect(resultado.bitsActivos[0].tipo).toBe("alarma");
  });

  it("interpreta Start General (bit 1)", () => {
    const resultado = interpretarRegistro(170, 2);
    expect(resultado.bitsActivos[0].nombre).toBe("Start General");
    expect(resultado.bitsActivos[0].tipo).toBe("warning");
  });

  it("interpreta Trip 50 + Trip 51 (bits 2 + 3)", () => {
    const resultado = interpretarRegistro(170, 0b00001100);
    const nombres = resultado.bitsActivos.map((b) => b.nombre);
    expect(nombres).toContain("Trip 50");
    expect(nombres).toContain("Trip 51");
  });
});

// ============================================================================
// interpretarRegistro — Registro 127 (Salud del dispositivo)
// ============================================================================
describe("interpretarRegistro — Registro 127 (Salud)", () => {
  it("interpreta valor 0 como OK con interpretación especial", () => {
    const resultado = interpretarRegistro(127, 0);
    expect(resultado.interpretacionEspecial.estado).toBe("OK");
    expect(resultado.interpretacionEspecial.clase).toBe("ok");
  });

  it("interpreta bit 0 como Error Global", () => {
    const resultado = interpretarRegistro(127, 1);
    expect(resultado.interpretacionEspecial.estado).toBe("ERROR");
    expect(resultado.bitsActivos[0].nombre).toBe("Error Global");
  });

  it("interpreta bit 1 como Warning Global", () => {
    const resultado = interpretarRegistro(127, 2);
    expect(resultado.interpretacionEspecial.estado).toBe("WARNING");
    expect(resultado.bitsActivos[0].nombre).toBe("Warning Global");
  });

  it("valor 4 (bit 2 reservado) NO es alarma — solo OK sin bits definidos", () => {
    // Bit 2 está activo pero es reservado, así que no tiene etiqueta
    const resultado = interpretarRegistro(127, 4);
    expect(resultado.interpretacionEspecial.estado).toBe("OK");
    expect(resultado.bitsActivos).toHaveLength(0);
  });
});

// ============================================================================
// interpretarRegistro — Registro 131 (Heartbeat)
// ============================================================================
describe("interpretarRegistro — Registro 131 (Heartbeat)", () => {
  it("valor > 0 indica CONECTADO", () => {
    const resultado = interpretarRegistro(131, 12345);
    expect(resultado.interpretacionEspecial.estado).toBe("CONECTADO");
    expect(resultado.interpretacionEspecial.clase).toBe("ok");
  });

  it("valor 0 indica VERIFICAR", () => {
    const resultado = interpretarRegistro(131, 0);
    expect(resultado.interpretacionEspecial.estado).toBe("VERIFICAR");
    expect(resultado.interpretacionEspecial.clase).toBe("warning");
  });
});

// ============================================================================
// interpretarRegistro — Registro 174 (Interruptor detallado)
// ============================================================================
describe("interpretarRegistro — Registro 174 (Interruptor)", () => {
  it("bit 4 activo = CERRADO", () => {
    const resultado = interpretarRegistro(174, 0b00010000); // bit 4
    expect(resultado.interpretacionEspecial.estado).toBe("CERRADO");
    expect(resultado.interpretacionEspecial.clase).toBe("ok");
  });

  it("bit 5 activo = ABIERTO", () => {
    const resultado = interpretarRegistro(174, 0b00100000); // bit 5
    expect(resultado.interpretacionEspecial.estado).toBe("ABIERTO");
    expect(resultado.interpretacionEspecial.clase).toBe("warning");
  });

  it("bit 6 activo = ERROR", () => {
    const resultado = interpretarRegistro(174, 0b01000000); // bit 6
    expect(resultado.interpretacionEspecial.estado).toBe("ERROR");
    expect(resultado.interpretacionEspecial.clase).toBe("error");
  });

  it("ningún bit de estado = DESCONOCIDO", () => {
    const resultado = interpretarRegistro(174, 0);
    expect(resultado.interpretacionEspecial.estado).toBe("DESCONOCIDO");
  });
});

// ============================================================================
// interpretarRegistro — Con etiquetas personalizadas
// ============================================================================
describe("interpretarRegistro — Etiquetas personalizadas", () => {
  it("usa etiquetas personalizadas sobre las por defecto", () => {
    const etiquetas = {
      0: { texto: "Mi Alarma Custom", severidad: "alarma" },
      1: { texto: "Mi Estado Custom", severidad: "estado" },
    };
    const resultado = interpretarRegistro(172, 3, etiquetas); // bits 0 y 1

    expect(resultado.usaEtiquetasPersonalizadas).toBe(true);
    expect(resultado.bitsActivos).toHaveLength(2);
    expect(resultado.bitsActivos[0].nombre).toBe("Mi Alarma Custom");
    expect(resultado.bitsActivos[0].tipo).toBe("alarma");
    expect(resultado.bitsActivos[1].nombre).toBe("Mi Estado Custom");
  });

  it("funciona con registro sin definición base pero con etiquetas custom", () => {
    const etiquetas = {
      0: { texto: "Bit especial", severidad: "warning" },
    };
    const resultado = interpretarRegistro(999, 1, etiquetas);
    expect(resultado.tieneInterpretacion).toBe(true);
    expect(resultado.usaEtiquetasPersonalizadas).toBe(true);
    expect(resultado.bitsActivos[0].nombre).toBe("Bit especial");
  });

  it("no muestra bits sin etiqueta personalizada ni por defecto", () => {
    // Registro 172 con solo bit 13 activo — sin definición para bit 13
    const etiquetas = { 0: { texto: "Ready", severidad: "info" } };
    const resultado = interpretarRegistro(172, 1 << 13, etiquetas);
    // Bit 13 no tiene etiqueta personalizada ni en la definición base
    expect(resultado.bitsActivos).toHaveLength(0);
  });
});

// ============================================================================
// interpretarRegistro — Genérico (registro sin definición)
// ============================================================================
describe("interpretarRegistro — Registro genérico", () => {
  it("decodifica bits activos genéricos para registro desconocido", () => {
    const resultado = interpretarRegistro(999, 5); // bits 0 y 2
    expect(resultado.bitsActivos).toHaveLength(2);
    expect(resultado.bitsActivos[0].nombre).toBe("Bit 0");
    expect(resultado.bitsActivos[1].nombre).toBe("Bit 2");
  });

  it("genera resumen con cantidad de bits activos", () => {
    const resultado = interpretarRegistro(999, 7); // bits 0, 1, 2
    expect(resultado.resumen).toContain("3 bit(s) activo(s)");
  });

  it("valor 0 sin bits activos", () => {
    const resultado = interpretarRegistro(999, 0);
    expect(resultado.bitsActivos).toHaveLength(0);
    expect(resultado.resumen).toBe("Sin bits activos");
  });

  it("valor 65535 (todos los bits activos)", () => {
    const resultado = interpretarRegistro(999, 65535);
    expect(resultado.bitsActivos).toHaveLength(16);
  });
});

// ============================================================================
// interpretarRegistro — Registros de protección (179-182)
// ============================================================================
describe("interpretarRegistro — Protecciones (179-182)", () => {
  it("registro 179: PHLPTOC1 Start (bit 0)", () => {
    const resultado = interpretarRegistro(179, 1);
    expect(resultado.bitsActivos[0].nombre).toContain("PHLPTOC1 Start");
    expect(resultado.bitsActivos[0].tipo).toBe("warning");
  });

  it("registro 179: PHLPTOC1 Operate (bit 8) — disparo", () => {
    const resultado = interpretarRegistro(179, 1 << 8);
    expect(resultado.bitsActivos[0].nombre).toContain("PHLPTOC1 Operate");
    expect(resultado.bitsActivos[0].tipo).toBe("alarma");
  });

  it("registro 180: PHHPTOC1 Operate (bit 2)", () => {
    const resultado = interpretarRegistro(180, 1 << 2);
    expect(resultado.bitsActivos[0].nombre).toContain("PHHPTOC1 Operate");
    expect(resultado.bitsActivos[0].tipo).toBe("alarma");
  });

  it("registro 182: falla tierra baja Start + Operate (bits 4 y 6)", () => {
    const resultado = interpretarRegistro(182, (1 << 4) | (1 << 6));
    expect(resultado.bitsActivos).toHaveLength(2);
    const tipos = resultado.bitsActivos.map((b) => b.tipo);
    expect(tipos).toContain("warning"); // Start
    expect(tipos).toContain("alarma");  // Operate
  });
});

// ============================================================================
// Constantes exportadas
// ============================================================================
describe("Constantes exportadas", () => {
  it("SEVERIDADES_DISPONIBLES tiene 5 severidades", () => {
    expect(SEVERIDADES_DISPONIBLES).toHaveLength(5);
    const ids = SEVERIDADES_DISPONIBLES.map((s) => s.id);
    expect(ids).toContain("info");
    expect(ids).toContain("estado");
    expect(ids).toContain("warning");
    expect(ids).toContain("alarma");
    expect(ids).toContain("error");
  });

  it("PLANTILLAS_ETIQUETAS_LEDS tiene alimentador, terna y trafoDif", () => {
    expect(PLANTILLAS_ETIQUETAS_LEDS.alimentador).toBeDefined();
    expect(PLANTILLAS_ETIQUETAS_LEDS.terna).toBeDefined();
    expect(PLANTILLAS_ETIQUETAS_LEDS.trafoDif).toBeDefined();
  });

  it("plantilla alimentador tiene etiquetas de bits esperadas", () => {
    const etiquetas = PLANTILLAS_ETIQUETAS_LEDS.alimentador.etiquetas;
    expect(etiquetas[0].texto).toContain("Arranque");
    expect(etiquetas[1].texto).toContain("Disparo");
    expect(etiquetas[1].severidad).toBe("alarma");
  });
});
