import { describe, it, expect } from "vitest";
import { aplicarFormula, formatearValor } from "../calculosFormulas";

// ============================================================================
// aplicarFormula
// ============================================================================
describe("aplicarFormula", () => {
  it("devuelve x sin cambios si la fórmula está vacía", () => {
    expect(aplicarFormula("", 500)).toBe(500);
    expect(aplicarFormula("  ", 123)).toBe(123);
  });

  it("devuelve x sin cambios si la fórmula es null/undefined", () => {
    expect(aplicarFormula(null, 42)).toBe(42);
    expect(aplicarFormula(undefined, 42)).toBe(42);
  });

  it("aplica fórmula identidad 'x'", () => {
    expect(aplicarFormula("x", 100)).toBe(100);
  });

  it("aplica fórmula de ratio TI alimentador (x * 400 / 1000)", () => {
    // Valor Modbus 250 → corriente real = 250 * 400 / 1000 = 100 A
    expect(aplicarFormula("x * 400 / 1000", 250)).toBe(100);
  });

  it("aplica fórmula de ratio TI TERNA (x * 100 / 5 / 1000)", () => {
    // Valor Modbus 500 → corriente = 500 * 100 / 5 / 1000 = 10 A
    expect(aplicarFormula("x * 100 / 5 / 1000", 500)).toBe(10);
  });

  it("aplica fórmula de ratio TV (x * 33000 / 110 / 1000)", () => {
    // Valor Modbus 1000 → tensión = 1000 * 33000 / 110 / 1000 = 300 V
    expect(aplicarFormula("x * 33000 / 110 / 1000", 1000)).toBe(300);
  });

  it("funciona con valor 0", () => {
    expect(aplicarFormula("x * 400 / 1000", 0)).toBe(0);
  });

  it("funciona con valores negativos", () => {
    expect(aplicarFormula("x * 2", -5)).toBe(-10);
  });

  it("funciona con valores decimales", () => {
    expect(aplicarFormula("x / 3", 9)).toBeCloseTo(3, 10);
  });

  it("maneja fórmulas con constantes", () => {
    expect(aplicarFormula("x + 100", 50)).toBe(150);
    expect(aplicarFormula("x - 273.15", 373.15)).toBeCloseTo(100, 5);
  });

  it("devuelve null para fórmula con error de sintaxis", () => {
    expect(aplicarFormula("x ***", 10)).toBeNull();
  });

  it("devuelve null si el resultado no es número", () => {
    expect(aplicarFormula("'texto'", 10)).toBeNull();
  });

  it("maneja valores Modbus máximos (65535)", () => {
    expect(aplicarFormula("x * 400 / 1000", 65535)).toBeCloseTo(26214, 0);
  });
});

// ============================================================================
// formatearValor
// ============================================================================
describe("formatearValor", () => {
  it("formatea número con 2 decimales y coma", () => {
    expect(formatearValor(123.456)).toBe("123,46");
  });

  it("agrega decimales a enteros", () => {
    expect(formatearValor(7)).toBe("7,00");
  });

  it("formatea 0 correctamente", () => {
    expect(formatearValor(0)).toBe("0,00");
  });

  it("formatea negativos correctamente", () => {
    expect(formatearValor(-5.5)).toBe("-5,50");
  });

  it("devuelve ERROR para null", () => {
    expect(formatearValor(null)).toBe("ERROR");
  });

  it("devuelve ERROR para undefined", () => {
    expect(formatearValor(undefined)).toBe("ERROR");
  });

  it("devuelve ERROR para NaN", () => {
    expect(formatearValor(NaN)).toBe("ERROR");
  });

  it("formatea valores muy grandes", () => {
    expect(formatearValor(999999.999)).toBe("1000000,00");
  });

  it("formatea valores muy pequeños", () => {
    expect(formatearValor(0.001)).toBe("0,00");
    expect(formatearValor(0.005)).toBe("0,01");
  });
});
