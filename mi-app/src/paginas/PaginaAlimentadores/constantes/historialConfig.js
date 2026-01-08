/**
 * Configuración y constantes para el sistema de historial y gráficos
 */

// Retención de datos en IndexedDB (horas)
export const HORAS_RETENCION_LOCAL = 48;

// Umbral de cobertura para considerar cache válido (85%)
export const UMBRAL_COBERTURA_CACHE = 0.85;

// Umbral de cobertura para complementar con datos remotos (90%)
export const UMBRAL_COBERTURA_REMOTO = 0.90;

// Margen adicional al límite de 48h para evitar edge cases (5 minutos en ms)
export const MARGEN_LIMITE_LOCAL_MS = 5 * 60 * 1000;

// Antigüedad máxima permitida para el último dato en cache (minutos)
// Si el último dato es más antiguo que esto, se fuerza recarga del servidor
export const MAX_ANTIGUEDAD_CACHE_MINUTOS = 15;

// Opciones de rango de tiempo predefinidas
export const RANGOS_TIEMPO = [
  { id: "1h", label: "1h", ms: 60 * 60 * 1000 },
  { id: "2h", label: "2h", ms: 2 * 60 * 60 * 1000 },
  { id: "6h", label: "6h", ms: 6 * 60 * 60 * 1000 },
  { id: "12h", label: "12h", ms: 12 * 60 * 60 * 1000 },
  { id: "24h", label: "24h", ms: 24 * 60 * 60 * 1000 },
  { id: "48h", label: "48h", ms: 48 * 60 * 60 * 1000 },
  { id: "7d", label: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "custom", label: "Custom", ms: null },
];

// Tipos de gráfico disponibles
export const TIPOS_GRAFICO = [
  { id: "line", label: "Línea", icon: "📈" },
  { id: "area", label: "Área", icon: "📊" },
  { id: "bar", label: "Barras", icon: "📶" },
];

// Intervalos de muestreo para informes (en minutos)
export const INTERVALOS_INFORME = [
  { id: 15, label: "15 min", minutos: 15 },
  { id: 30, label: "30 min", minutos: 30 },
  { id: 60, label: "1 hora", minutos: 60 },
  { id: 180, label: "3 horas", minutos: 180 },
  { id: 360, label: "6 horas", minutos: 360 },
  { id: 720, label: "12 horas", minutos: 720 },
];

// Colores del gradiente verde-amarillo-rojo
export const COLORES_GRADIENTE = {
  verde: { r: 34, g: 197, b: 94 },     // #22c55e
  amarillo: { r: 234, g: 179, b: 8 },  // #eab308
  rojo: { r: 239, g: 68, b: 68 },      // #ef4444
};

