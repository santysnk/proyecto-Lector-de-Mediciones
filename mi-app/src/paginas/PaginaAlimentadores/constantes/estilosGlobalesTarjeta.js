/**
 * Constantes de estilos globales para las tarjetas de alimentador
 * Estos valores son los defaults que se usan si el usuario no ha personalizado nada
 */

// Lista curada de fuentes disponibles (ordenada alfabéticamente)
export const FUENTES_DISPONIBLES = [
  // Opción por defecto (siempre primera)
  { id: "inherit", label: "Por defecto" },
  // Resto ordenado alfabéticamente
  { id: "'Arial', sans-serif", label: "Arial" },
  { id: "'Barlow', sans-serif", label: "Barlow" },
  { id: "'Bebas Neue', sans-serif", label: "Bebas Neue" },
  { id: "'Cabin', sans-serif", label: "Cabin" },
  { id: "'Comfortaa', sans-serif", label: "Comfortaa" },
  { id: "'Consolas', monospace", label: "Consolas" },
  { id: "'Digital-7', 'Courier New', monospace", label: "Digital-7" },
  { id: "'Digital-7-Mono', 'Courier New', monospace", label: "Digital-7 Mono" },
  { id: "'DS-Digital', 'Courier New', monospace", label: "DS-Digital" },
  { id: "'DS-Digital-Bold', 'Courier New', monospace", label: "DS-Digital Bold" },
  { id: "'Exo 2', sans-serif", label: "Exo 2" },
  { id: "'Fira Code', monospace", label: "Fira Code" },
  { id: "'IBM Plex Sans', sans-serif", label: "IBM Plex Sans" },
  { id: "'Inconsolata', monospace", label: "Inconsolata" },
  { id: "'Inter', sans-serif", label: "Inter" },
  { id: "'JetBrains Mono', monospace", label: "JetBrains Mono" },
  { id: "'Kanit', sans-serif", label: "Kanit" },
  { id: "'Lato', sans-serif", label: "Lato" },
  { id: "'Montserrat', sans-serif", label: "Montserrat" },
  { id: "'Nunito', sans-serif", label: "Nunito" },
  { id: "'Open Sans', sans-serif", label: "Open Sans" },
  { id: "'Orbitron', sans-serif", label: "Orbitron" },
  { id: "'Oswald', sans-serif", label: "Oswald" },
  { id: "'Oxanium', sans-serif", label: "Oxanium" },
  { id: "'Play', sans-serif", label: "Play" },
  { id: "'Playfair Display', serif", label: "Playfair Display" },
  { id: "'Poppins', sans-serif", label: "Poppins" },
  { id: "'Quicksand', sans-serif", label: "Quicksand" },
  { id: "'Rajdhani', sans-serif", label: "Rajdhani" },
  { id: "'Roboto', sans-serif", label: "Roboto" },
  { id: "'Roboto Mono', monospace", label: "Roboto Mono" },
  { id: "'Rubik', sans-serif", label: "Rubik" },
  { id: "'Russo One', sans-serif", label: "Russo One" },
  { id: "'Segoe UI', sans-serif", label: "Segoe UI" },
  { id: "'Share Tech Mono', monospace", label: "Share Tech Mono" },
  { id: "'Source Sans 3', sans-serif", label: "Source Sans" },
  { id: "'Space Mono', monospace", label: "Space Mono" },
  { id: "'Teko', sans-serif", label: "Teko" },
  { id: "'Titillium Web', sans-serif", label: "Titillium Web" },
  { id: "'Ubuntu', sans-serif", label: "Ubuntu" },
  { id: "'Work Sans', sans-serif", label: "Work Sans" },
  { id: "'Zilla Slab', serif", label: "Zilla Slab" },
];

// Key para localStorage
export const ESTILOS_GLOBALES_STORAGE_KEY = "alimentadores_estilos_globales";

// Valores por defecto (extraídos del CSS actual)
export const ESTILOS_GLOBALES_DEFAULT = {
  // 1. Header de la tarjeta (título como "TRAFO 1")
  header: {
    fontFamily: "inherit",
    fontSize: "1rem",        // ~16px
    fontWeight: 700,
  },

  // 2. Títulos de zona (superior e inferior como conjunto)
  // Ej: "CORRIENTE DE LÍNEA (A) (EN 33 KV)"
  tituloZona: {
    fontFamily: "inherit",
    fontSize: "0.8rem",      // ~12.8px
  },

  // 3. Títulos de los boxes (R, S, T) como conjunto
  tituloBox: {
    fontFamily: "inherit",
    fontSize: "1rem",        // ~16px
  },

  // 4. Contenido de los boxes (valores como "--,--")
  valorBox: {
    fontFamily: "'DS-Digital', 'Courier New', monospace",
    fontSize: "1.5rem",      // ~24px
    color: "#ffff00",        // amarillo
    decimales: 2,            // cantidad de decimales a mostrar (0, 1 o 2)
  },

  // 5. Configuración del box contenedor
  box: {
    gap: "18px",                  // espacio entre boxes (igual a CSS: gap: 18px)
    width: "80px",                // ancho fijo del box
    height: "auto",               // alto del box ("auto" = se ajusta al contenido)
  },
};

// Límites para los sliders de tamaño
export const LIMITES_TAMAÑO = {
  header: { min: 0.7, max: 1.6, step: 0.05 },           // rem
  tituloZona: { min: 0.6, max: 1.2, step: 0.05 },       // rem
  tituloBox: { min: 0.7, max: 1.4, step: 0.05 },        // rem
  valorBox: { min: 0, max: 2.5, step: 0.1 },             // rem (0 a 2.5)
  gap: { min: 5, max: 40, step: 1 },                    // px (espacio entre boxes)
  boxWidth: { min: 60, max: 120, step: 2 },             // px (ancho del box)
  boxHeight: { min: 24, max: 60, step: 2 },             // px (alto del box, 0 = auto)
};

// Opciones de decimales para los valores
export const OPCIONES_DECIMALES = [
  { valor: 2, label: "2 decimales" },
  { valor: 1, label: "1 decimal" },
  { valor: 0, label: "Sin decimales" },
];

// Colores predefinidos para el texto de los valores
export const COLORES_VALOR_PREDEFINIDOS = [
  "#ffff00", // amarillo (default)
  "#00ff00", // verde
  "#00ffff", // cyan
  "#ff9900", // naranja
  "#ff6666", // rojo claro
  "#ffffff", // blanco
  "#99ccff", // azul claro
];
