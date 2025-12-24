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

// Intervalos de filtro para panel de datos (en minutos)
export const INTERVALOS_FILTRO = [
  { value: 0, label: "Todos" },
  { value: 15, label: "cada 15m" },
  { value: 30, label: "cada 30m" },
  { value: 60, label: "cada 60m" },
];

// Colores del gradiente verde-amarillo-rojo
export const COLORES_GRADIENTE = {
  verde: { r: 34, g: 197, b: 94 },     // #22c55e
  amarillo: { r: 234, g: 179, b: 8 },  // #eab308
  rojo: { r: 239, g: 68, b: 68 },      // #ef4444
};

// Configuración de IndexedDB
export const INDEXEDDB_CONFIG = {
  nombre: "RelayWatchHistorial",
  version: 1,
  store: "lecturas",
};

// Estilos del gráfico base (tema oscuro)
export const ESTILOS_GRAFICO_BASE = {
  background: "#0f172a",
  foreColor: "#e2e8f0",
  gridColor: "#334155",
  labelColor: "#94a3b8",
  borderColor: "#334155",
};

// Estilos del gráfico para exportación (tema claro)
export const ESTILOS_GRAFICO_EXPORT = {
  background: "#ffffff",
  foreColor: "#1a1a1a",
  gridColor: "#bbbbbb",
  labelColor: "#1a1a1a",
  borderColor: "#333333",
  fontSize: "16px",
  fontSizeTitle: "17px",
  fontWeight: 600,
  fontWeightTitle: 700,
};
