// utilidades/coloresGrafico.js
// Utilidades de colores para gráficos de historial

import { COLORES_GRADIENTE } from "../constantes/historialConfig";

/**
 * Interpola color de verde a rojo basado en porcentaje (0-1)
 * 0 = verde, 0.5 = amarillo, 1 = rojo
 * @param {number} porcentaje - Valor entre 0 y 1
 * @returns {string} Color en formato rgb()
 */
export const interpolarColorVerdeRojo = (porcentaje) => {
   const p = Math.max(0, Math.min(1, porcentaje));
   const { verde, amarillo, rojo } = COLORES_GRADIENTE;

   let r, g, b;

   if (p <= 0.5) {
      // Verde a Amarillo (0 a 0.5)
      const t = p * 2;
      r = Math.round(verde.r + (amarillo.r - verde.r) * t);
      g = Math.round(verde.g + (amarillo.g - verde.g) * t);
      b = Math.round(verde.b + (amarillo.b - verde.b) * t);
   } else {
      // Amarillo a Rojo (0.5 a 1)
      const t = (p - 0.5) * 2;
      r = Math.round(amarillo.r + (rojo.r - amarillo.r) * t);
      g = Math.round(amarillo.g + (rojo.g - amarillo.g) * t);
      b = Math.round(amarillo.b + (rojo.b - amarillo.b) * t);
   }

   return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Genera colores para gráfico de barras basado en valores normalizados min-max
 * @param {Array<{y: number}>} datos - Datos con valores y
 * @returns {string[]} Array de colores rgb
 */
export const generarColoresBarras = (datos) => {
   if (!datos || datos.length === 0) return [];

   const valores = datos.map((d) => d.y);
   const minVal = Math.min(...valores);
   const maxVal = Math.max(...valores);
   const rango = maxVal - minVal;

   return valores.map((val) => {
      const porcentaje = rango > 0 ? (val - minVal) / rango : 0;
      return interpolarColorVerdeRojo(porcentaje);
   });
};
