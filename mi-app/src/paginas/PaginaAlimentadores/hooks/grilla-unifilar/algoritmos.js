/**
 * Algoritmos para manipulación de celdas en la grilla
 */

/**
 * Obtiene todas las celdas conectadas a una celda dada (BFS)
 * @param {number} x - Coordenada X de la celda inicial
 * @param {number} y - Coordenada Y de la celda inicial
 * @param {Object} celdasActuales - Objeto de celdas actual
 * @returns {Array<string>} Array de claves de celdas conectadas
 */
export const obtenerCeldasConectadas = (x, y, celdasActuales) => {
   const claveCelda = `${x},${y}`;
   const colorOriginal = celdasActuales[claveCelda];

   if (!colorOriginal) return [];

   const visitadas = new Set();
   const cola = [[x, y]];
   const celdasConectadas = [];

   while (cola.length > 0) {
      const [cx, cy] = cola.shift();
      const claveActual = `${cx},${cy}`;

      if (visitadas.has(claveActual)) continue;
      visitadas.add(claveActual);

      if (celdasActuales[claveActual] !== colorOriginal) continue;

      celdasConectadas.push(claveActual);

      // Agregar vecinos (arriba, abajo, izquierda, derecha)
      cola.push([cx, cy - 1]);
      cola.push([cx, cy + 1]);
      cola.push([cx - 1, cy]);
      cola.push([cx + 1, cy]);
   }

   return celdasConectadas;
};

/**
 * Calcula las nuevas celdas después de mover un grupo de celdas conectadas
 * @param {Object} celdasActuales - Objeto de celdas actual
 * @param {Array<string>} celdasAMover - Array de claves a mover
 * @param {number} deltaX - Desplazamiento en X
 * @param {number} deltaY - Desplazamiento en Y
 * @returns {Object} Nuevo objeto de celdas
 */
export const calcularCeldasMovidas = (celdasActuales, celdasAMover, deltaX, deltaY) => {
   if (deltaX === 0 && deltaY === 0) return celdasActuales;
   if (celdasAMover.length === 0) return celdasActuales;

   const nuevasCeldas = { ...celdasActuales };

   // Remover todas las celdas que vamos a mover
   const coloresOriginales = {};
   celdasAMover.forEach((clave) => {
      coloresOriginales[clave] = celdasActuales[clave];
      delete nuevasCeldas[clave];
   });

   // Agregar las celdas en sus nuevas posiciones
   celdasAMover.forEach((clave) => {
      const [x, y] = clave.split(",").map(Number);
      const nuevaClave = `${x + deltaX},${y + deltaY}`;
      nuevasCeldas[nuevaClave] = coloresOriginales[clave];
   });

   return nuevasCeldas;
};

/**
 * Calcula las celdas a rellenar con flood fill (BFS)
 * @param {Object} celdasActuales - Objeto de celdas actual
 * @param {number} x - Coordenada X inicial
 * @param {number} y - Coordenada Y inicial
 * @param {string} nuevoColor - Color a aplicar
 * @returns {Object|null} Nuevo objeto de celdas o null si no hay cambios
 */
export const calcularFloodFill = (celdasActuales, x, y, nuevoColor) => {
   const claveCelda = `${x},${y}`;
   const colorOriginal = celdasActuales[claveCelda];

   if (!colorOriginal) return null;
   if (colorOriginal === nuevoColor) return null;

   const visitadas = new Set();
   const cola = [[x, y]];
   const celdasARellenar = [];

   while (cola.length > 0) {
      const [cx, cy] = cola.shift();
      const claveActual = `${cx},${cy}`;

      if (visitadas.has(claveActual)) continue;
      visitadas.add(claveActual);

      if (celdasActuales[claveActual] !== colorOriginal) continue;

      celdasARellenar.push(claveActual);

      cola.push([cx, cy - 1]);
      cola.push([cx, cy + 1]);
      cola.push([cx - 1, cy]);
      cola.push([cx + 1, cy]);
   }

   const nuevasCeldas = { ...celdasActuales };
   celdasARellenar.forEach((clave) => {
      nuevasCeldas[clave] = nuevoColor;
   });

   return nuevasCeldas;
};

/**
 * Calcula las celdas después de borrar un área rectangular
 * @param {Object} celdasActuales - Objeto de celdas actual
 * @param {number} x1 - Coordenada X esquina 1
 * @param {number} y1 - Coordenada Y esquina 1
 * @param {number} x2 - Coordenada X esquina 2
 * @param {number} y2 - Coordenada Y esquina 2
 * @returns {{celdas: Object, huboCambios: boolean}}
 */
export const calcularBorradoArea = (celdasActuales, x1, y1, x2, y2) => {
   const minX = Math.min(x1, x2);
   const maxX = Math.max(x1, x2);
   const minY = Math.min(y1, y2);
   const maxY = Math.max(y1, y2);

   const nuevasCeldas = { ...celdasActuales };
   let huboCambios = false;

   for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
         const clave = `${x},${y}`;
         if (nuevasCeldas[clave]) {
            delete nuevasCeldas[clave];
            huboCambios = true;
         }
      }
   }

   return { celdas: nuevasCeldas, huboCambios };
};

/**
 * Calcula la posición restringida para línea recta con Shift
 * @param {number} x - Coordenada X actual
 * @param {number} y - Coordenada Y actual
 * @param {{x: number, y: number}|null} puntoInicial - Punto inicial
 * @param {string|null} direccionBloqueada - Dirección bloqueada
 * @returns {{x: number, y: number, direccion: string|null}}
 */
export const calcularPosicionLineaRecta = (x, y, puntoInicial, direccionBloqueada) => {
   if (!puntoInicial) {
      return { x, y, direccion: direccionBloqueada };
   }

   const { x: xInicial, y: yInicial } = puntoInicial;
   const deltaX = Math.abs(x - xInicial);
   const deltaY = Math.abs(y - yInicial);

   let nuevaDireccion = direccionBloqueada;

   // Determinar dirección si no está bloqueada
   if (nuevaDireccion === null && (deltaX > 1 || deltaY > 1)) {
      nuevaDireccion = deltaX > deltaY ? "horizontal" : "vertical";
   }

   // Aplicar restricción según dirección
   let xFinal = x;
   let yFinal = y;

   if (nuevaDireccion === "horizontal") {
      yFinal = yInicial;
   } else if (nuevaDireccion === "vertical") {
      xFinal = xInicial;
   }

   return { x: xFinal, y: yFinal, direccion: nuevaDireccion };
};
