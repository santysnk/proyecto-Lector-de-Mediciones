// utilidades/coordenadas.js
// Funciones para calcular coordenadas en el canvas

/**
 * Obtener coordenadas de celda desde evento de mouse
 * @param {MouseEvent} e - Evento del mouse
 * @param {HTMLCanvasElement} canvas - Elemento canvas
 * @param {number} grosorLinea - Tamaño de cada celda
 * @returns {{x: number, y: number} | null}
 */
export function obtenerCoordenadasCelda(e, canvas, grosorLinea) {
   if (!canvas) return null;

   const rect = canvas.getBoundingClientRect();
   const x = Math.floor((e.clientX - rect.left) / grosorLinea);
   const y = Math.floor((e.clientY - rect.top) / grosorLinea);

   return { x, y };
}

/**
 * Obtener coordenadas en píxeles desde evento de mouse
 * @param {MouseEvent} e - Evento del mouse
 * @param {HTMLCanvasElement} canvas - Elemento canvas
 * @returns {{x: number, y: number} | null}
 */
export function obtenerCoordenadasPixel(e, canvas) {
   if (!canvas) return null;

   const rect = canvas.getBoundingClientRect();
   return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
   };
}

/**
 * Verificar si hay una celda pintada en las coordenadas dadas
 * @param {number} x - Coordenada X de celda
 * @param {number} y - Coordenada Y de celda
 * @param {Object} celdas - Objeto con las celdas pintadas
 * @returns {boolean}
 */
export function hayCeldaEn(x, y, celdas) {
   const claveCelda = `${x},${y}`;
   return !!celdas[claveCelda];
}
