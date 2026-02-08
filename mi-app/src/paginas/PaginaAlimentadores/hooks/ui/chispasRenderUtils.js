// hooks/ui/chispasRenderUtils.js
// Utilidades puras de renderizado para chispas (posición e interpolación)

/**
 * Obtiene posición en píxeles de una chispa con interpolación lineal.
 */
export function calcularPosicionPixel(chispa, grosorLinea) {
   const { ruta, posicion, progreso } = chispa;
   if (!ruta || ruta.length === 0) return { x: 0, y: 0 };

   const [x1, y1] = ruta[posicion].split(",").map(Number);
   if (posicion >= ruta.length - 1) {
      return { x: x1 * grosorLinea + grosorLinea / 2, y: y1 * grosorLinea + grosorLinea / 2 };
   }

   const [x2, y2] = ruta[posicion + 1].split(",").map(Number);
   return {
      x: (x1 + (x2 - x1) * progreso) * grosorLinea + grosorLinea / 2,
      y: (y1 + (y2 - y1) * progreso) * grosorLinea + grosorLinea / 2,
   };
}

/**
 * Obtiene posiciones de estela con opacidades decrecientes.
 */
export function calcularEstelaPixeles(chispa, grosorLinea) {
   const { estela } = chispa;
   if (!estela || estela.length === 0) return [];

   const resultado = [];
   for (let i = 0; i < estela.length; i++) {
      const clave = estela[i];
      if (!clave) continue;
      const [x, y] = clave.split(",").map(Number);
      resultado.push({
         x: x * grosorLinea + grosorLinea / 2,
         y: y * grosorLinea + grosorLinea / 2,
         opacidad: 1 - (i + 1) / (estela.length + 1),
      });
   }
   return resultado;
}

/**
 * Actualiza chispas in-place (mutación directa para performance).
 * Retorna true si hubo cambios.
 */
export function actualizarChispasInPlace(chispas, avance, longitudEstela) {
   for (let i = chispas.length - 1; i >= 0; i--) {
      const chispa = chispas[i];
      chispa.progreso += avance;

      while (chispa.progreso >= 1) {
         const estela = chispa.estela;
         for (let j = Math.min(estela.length, longitudEstela - 1); j > 0; j--) {
            estela[j] = estela[j - 1];
         }
         estela[0] = chispa.ruta[chispa.posicion];
         if (estela.length < longitudEstela) estela.length = Math.min(estela.length + 1, longitudEstela);
         else if (estela.length > longitudEstela) estela.length = longitudEstela;

         chispa.posicion += 1;
         chispa.progreso -= 1;

         if (chispa.posicion >= chispa.ruta.length - 1) {
            chispas.splice(i, 1);
            break;
         }
      }
   }
}
