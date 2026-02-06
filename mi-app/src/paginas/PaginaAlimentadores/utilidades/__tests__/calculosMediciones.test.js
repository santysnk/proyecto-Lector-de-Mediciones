import { describe, it, expect } from "vitest";
import {
  tieneConfiguracionValida,
  obtenerListaRegistros,
  obtenerDisenoTarjeta,
  resolverTituloLado,
  calcularValoresLadoTarjeta,
  calcularValoresFuncionalidad,
} from "../calculosMediciones";

// ============================================================================
// Helpers de datos de prueba
// ============================================================================

/** Crea registros Modbus simulados */
const crearRegistros = (pares) =>
  pares.map(([address, value]) => ({ address, value }));

const registrosRele = crearRegistros([
  [137, 250],  // IL1 = 250 (valor Modbus crudo)
  [138, 300],  // IL2
  [139, 280],  // IL3
  [151, 1000], // UL1
  [152, 980],  // UL2
  [153, 1010], // UL3
  [160, 500],  // P total
  [0, 0],      // Registro en dirección 0
]);

const registrosPorOrigen = {
  rele: registrosRele,
  analizador: [{ address: 10, value: 42 }],
};

// ============================================================================
// tieneConfiguracionValida
// ============================================================================
describe("tieneConfiguracionValida", () => {
  it("devuelve true con registrador_id y funcionalidad_id presentes", () => {
    expect(tieneConfiguracionValida({
      registrador_id: "abc",
      funcionalidad_id: "xyz",
    })).toBe(true);
  });

  it("devuelve false si falta registrador_id", () => {
    expect(tieneConfiguracionValida({ funcionalidad_id: "xyz" })).toBe(false);
  });

  it("devuelve false si falta funcionalidad_id", () => {
    expect(tieneConfiguracionValida({ registrador_id: "abc" })).toBe(false);
  });

  it("devuelve false para null/undefined", () => {
    expect(tieneConfiguracionValida(null)).toBe(false);
    expect(tieneConfiguracionValida(undefined)).toBe(false);
  });

  it("devuelve false para objeto vacío", () => {
    expect(tieneConfiguracionValida({})).toBe(false);
  });
});

// ============================================================================
// obtenerListaRegistros
// ============================================================================
describe("obtenerListaRegistros", () => {
  it("devuelve lista de relé por defecto", () => {
    const lista = obtenerListaRegistros(registrosPorOrigen, "rele");
    expect(lista).toBe(registrosRele);
  });

  it("devuelve lista de analizador si se pide", () => {
    const lista = obtenerListaRegistros(registrosPorOrigen, "analizador");
    expect(lista).toHaveLength(1);
    expect(lista[0].value).toBe(42);
  });

  it("cae a rele para origen desconocido", () => {
    const lista = obtenerListaRegistros(registrosPorOrigen, "otro");
    expect(lista).toBe(registrosRele);
  });

  it("devuelve null si registrosPorOrigen es null", () => {
    expect(obtenerListaRegistros(null, "rele")).toBeNull();
  });

  it("devuelve null si la clave no es array", () => {
    expect(obtenerListaRegistros({ rele: "no-array" }, "rele")).toBeNull();
  });
});

// ============================================================================
// obtenerDisenoTarjeta
// ============================================================================
describe("obtenerDisenoTarjeta", () => {
  it("devuelve diseño por defecto si no hay cardDesign", () => {
    const diseño = obtenerDisenoTarjeta(null);
    expect(diseño.superior).toBeDefined();
    expect(diseño.inferior).toBeDefined();
    expect(diseño.superior.tituloId).toBe("corriente_132");
  });

  it("devuelve diseño por defecto para objeto vacío", () => {
    const diseño = obtenerDisenoTarjeta({});
    expect(diseño.superior.tituloId).toBe("corriente_132");
  });

  it("fusiona diseño personalizado con el por defecto", () => {
    const diseño = obtenerDisenoTarjeta({
      superior: { tituloId: "tension_linea", cantidad: 4, boxes: [] },
    });
    expect(diseño.superior.tituloId).toBe("tension_linea");
    expect(diseño.inferior).toBeDefined();
  });

  it("maneja formato legacy con cardDesign anidado", () => {
    const diseño = obtenerDisenoTarjeta({
      cardDesign: {
        superior: { tituloId: "potencia_activa", cantidad: 4, boxes: [] },
      },
    });
    expect(diseño.superior.tituloId).toBe("potencia_activa");
  });
});

// ============================================================================
// resolverTituloLado
// ============================================================================
describe("resolverTituloLado", () => {
  it("devuelve título predefinido para tituloId válido", () => {
    expect(resolverTituloLado({ tituloId: "corriente_132" }))
      .toBe("Corriente de línea (A) (en 13,2 kV)");
  });

  it("devuelve título custom", () => {
    expect(resolverTituloLado({
      tituloId: "custom",
      tituloCustom: "Mi título",
    })).toBe("Mi título");
  });

  it("devuelve string vacío para custom sin texto", () => {
    expect(resolverTituloLado({ tituloId: "custom", tituloCustom: "" })).toBe("");
  });

  it("devuelve string vacío si tituloId no existe en el mapa", () => {
    expect(resolverTituloLado({ tituloId: "inexistente" })).toBe("");
  });

  it("devuelve string vacío para null", () => {
    expect(resolverTituloLado(null)).toBe("");
  });
});

// ============================================================================
// calcularValoresLadoTarjeta
// ============================================================================
describe("calcularValoresLadoTarjeta", () => {
  it("devuelve título y boxes vacíos si diseñoLado es null", () => {
    const resultado = calcularValoresLadoTarjeta(registrosPorOrigen, null);
    expect(resultado.titulo).toBe("");
    expect(resultado.boxes).toEqual([]);
  });

  it("calcula valores correctamente con registros que existen", () => {
    const diseño = {
      tituloId: "corriente_132",
      cantidad: 3,
      boxes: [
        { enabled: true, registro: 137, formula: "x", label: "R" },
        { enabled: true, registro: 138, formula: "x", label: "S" },
        { enabled: true, registro: 139, formula: "x", label: "T" },
      ],
    };
    const resultado = calcularValoresLadoTarjeta(registrosPorOrigen, diseño);
    expect(resultado.boxes[0].valor).toBe("250,00");
    expect(resultado.boxes[1].valor).toBe("300,00");
    expect(resultado.boxes[2].valor).toBe("280,00");
  });

  it("aplica fórmula de ratio TI a los valores", () => {
    const diseño = {
      tituloId: "corriente_132",
      cantidad: 1,
      boxes: [
        { enabled: true, registro: 137, formula: "x * 400 / 1000", label: "R" },
      ],
    };
    const resultado = calcularValoresLadoTarjeta(registrosPorOrigen, diseño);
    // 250 * 400 / 1000 = 100
    expect(resultado.boxes[0].valor).toBe("100,00");
  });

  it("muestra '--,--' para boxes deshabilitados", () => {
    const diseño = {
      tituloId: "corriente_132",
      cantidad: 1,
      boxes: [{ enabled: false, registro: 137, formula: "x", label: "R" }],
    };
    const resultado = calcularValoresLadoTarjeta(registrosPorOrigen, diseño);
    expect(resultado.boxes[0].valor).toBe("--,--");
    expect(resultado.boxes[0].enabled).toBe(false);
  });

  it("muestra 'ERROR' si el registro no existe", () => {
    const diseño = {
      tituloId: "corriente_132",
      cantidad: 1,
      boxes: [{ enabled: true, registro: 999, formula: "x", label: "X" }],
    };
    const resultado = calcularValoresLadoTarjeta(registrosPorOrigen, diseño);
    expect(resultado.boxes[0].valor).toBe("ERROR");
  });

  it("limita cantidad a máximo 4", () => {
    const diseño = { tituloId: "corriente_132", cantidad: 10, boxes: [] };
    const resultado = calcularValoresLadoTarjeta(registrosPorOrigen, diseño);
    expect(resultado.boxes).toHaveLength(4);
  });

  it("usa etiquetas por defecto si no hay label", () => {
    const diseño = {
      tituloId: "corriente_132",
      cantidad: 3,
      boxes: [
        { enabled: false, registro: 137, label: "" },
        { enabled: false, registro: 138, label: "" },
        { enabled: false, registro: 139, label: "" },
      ],
    };
    const resultado = calcularValoresLadoTarjeta(registrosPorOrigen, diseño);
    expect(resultado.boxes[0].etiqueta).toBe("R");
    expect(resultado.boxes[1].etiqueta).toBe("S");
    expect(resultado.boxes[2].etiqueta).toBe("T");
  });

  it("funciona con registro en dirección 0", () => {
    const diseño = {
      tituloId: "custom",
      tituloCustom: "Test",
      cantidad: 1,
      boxes: [{ enabled: true, registro: 0, formula: "x", label: "Zero" }],
    };
    const resultado = calcularValoresLadoTarjeta(registrosPorOrigen, diseño);
    expect(resultado.boxes[0].valor).toBe("0,00");
  });

  it("maneja registros de analizador con origen 'analizador'", () => {
    const diseño = {
      tituloId: "custom",
      tituloCustom: "Analizador",
      cantidad: 1,
      boxes: [{ enabled: true, registro: 10, formula: "x", label: "V", origen: "analizador" }],
    };
    const resultado = calcularValoresLadoTarjeta(registrosPorOrigen, diseño);
    expect(resultado.boxes[0].valor).toBe("42,00");
    expect(resultado.boxes[0].origen).toBe("analizador");
  });
});

// ============================================================================
// calcularValoresFuncionalidad
// ============================================================================
describe("calcularValoresFuncionalidad", () => {
  it("devuelve vacío si configZona o funcionalidadDatos es null", () => {
    const resultado = calcularValoresFuncionalidad(registrosPorOrigen, null, null, null);
    expect(resultado.titulo).toBe("");
    expect(resultado.boxes).toEqual([]);
  });

  it("calcula valores con funcionalidad configurada", () => {
    const configZona = { registrador_id: "r1", funcionalidad_id: "f1" };
    const funcionalidadDatos = {
      nombre: "Corrientes",
      registros: [
        { registro: 137, etiqueta: "IL1" },
        { registro: 138, etiqueta: "IL2" },
      ],
    };
    const resultado = calcularValoresFuncionalidad(
      registrosPorOrigen, configZona, funcionalidadDatos, null
    );
    expect(resultado.titulo).toBe("Corrientes");
    expect(resultado.boxes).toHaveLength(2);
    expect(resultado.boxes[0].valor).toBe("250,00");
    expect(resultado.boxes[1].valor).toBe("300,00");
  });

  it("usa título personalizado si existe en configZona", () => {
    const configZona = {
      registrador_id: "r1",
      funcionalidad_id: "f1",
      titulo_personalizado: "Mi Título",
    };
    const funcionalidadDatos = { nombre: "Original", registros: [] };
    const resultado = calcularValoresFuncionalidad(
      registrosPorOrigen, configZona, funcionalidadDatos, null
    );
    expect(resultado.titulo).toBe("Mi Título");
  });

  it("devuelve boxes vacíos si zona está oculta", () => {
    const configZona = {
      registrador_id: "r1",
      funcionalidad_id: "f1",
      oculto: true,
    };
    const funcionalidadDatos = {
      nombre: "Test",
      registros: [{ registro: 137, etiqueta: "IL1" }],
    };
    const resultado = calcularValoresFuncionalidad(
      registrosPorOrigen, configZona, funcionalidadDatos, null
    );
    expect(resultado.oculto).toBe(true);
    expect(resultado.boxes).toEqual([]);
  });

  it("aplica transformador cuando se provee", () => {
    const configZona = { registrador_id: "r1", funcionalidad_id: "f1" };
    const funcionalidadDatos = {
      nombre: "Corrientes",
      registros: [{ registro: 137, etiqueta: "IL1", transformadorId: "t1" }],
    };
    const obtenerTransformador = (id) =>
      id === "t1" ? { formula: "x * 400 / 1000" } : null;

    const resultado = calcularValoresFuncionalidad(
      registrosPorOrigen, configZona, funcionalidadDatos, obtenerTransformador
    );
    // 250 * 400 / 1000 = 100
    expect(resultado.boxes[0].valor).toBe("100,00");
  });

  it("muestra 'SIN DATO' si el registro no se encuentra", () => {
    const configZona = { registrador_id: "r1", funcionalidad_id: "f1" };
    const funcionalidadDatos = {
      nombre: "Test",
      registros: [{ registro: 999, etiqueta: "X" }],
    };
    const resultado = calcularValoresFuncionalidad(
      registrosPorOrigen, configZona, funcionalidadDatos, null
    );
    expect(resultado.boxes[0].valor).toBe("SIN DATO");
  });
});
