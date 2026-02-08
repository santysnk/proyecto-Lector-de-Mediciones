// hooks/puestos/detectarCambiosPendientes.js
// Función pura para detectar diferencias entre estado local (Pnavegador) y BD (Pbase)

/**
 * Detecta cambios entre el estado actual y el snapshot de BD.
 * Detecta: cambios de valores, elementos nuevos, eliminados, y cambios de orden.
 */
export function detectarCambiosEntre(puestosActuales, snapshot, gapsPorTarjeta = {}, gapsPorFilaPorPuesto = {}, escalasPorPuesto = {}, escalasPorTarjeta = {}) {
   const cambios = { puestos: [], alimentadores: [], ordenPorPuesto: {} };
   const alimentadoresActualesIds = new Set();
   let hayNuevosElementos = false;
   let hayElementosEliminados = false;

   puestosActuales.forEach((puesto) => {
      const puestoIdStr = String(puesto.id);
      const original = snapshot.puestos[puestoIdStr];
      const alimentadoresDelPuesto = puesto.alimentadores || [];

      // Recolectar IDs y detectar nuevos
      alimentadoresDelPuesto.forEach((alim) => {
         const alimIdStr = String(alim.id);
         alimentadoresActualesIds.add(alimIdStr);
         if (!snapshot.alimentadoresIds.has(alimIdStr)) hayNuevosElementos = true;
      });

      // Detectar cambio de orden
      const ordenActualIds = alimentadoresDelPuesto.map(a => String(a.id));
      const ordenOriginalIds = Object.entries(snapshot.alimentadores)
         .filter(([, data]) => data.puestoId === puestoIdStr)
         .sort((a, b) => a[1].orden - b[1].orden)
         .map(([id]) => id);

      if (ordenActualIds.length === ordenOriginalIds.length && ordenActualIds.length > 0) {
         if (ordenActualIds.some((id, idx) => id !== ordenOriginalIds[idx])) {
            cambios.ordenPorPuesto[puesto.id] = alimentadoresDelPuesto.map(a => a.id);
         }
      }

      // Puesto nuevo
      if (!original) {
         const gapsFilaActuales = gapsPorFilaPorPuesto[puesto.id] || puesto.gapsVerticales || { "0": 40 };
         if (JSON.stringify(gapsFilaActuales) !== JSON.stringify({ "0": 40 })) {
            cambios.puestos.push({ id: puesto.id, campos: { gapsVerticales: gapsFilaActuales } });
         }
         return;
      }

      // Comparar valores del puesto
      const cambiosPuesto = {};
      const bgColorActual = puesto.bgColor || puesto.bg_color;
      if (puesto.color !== original.color) cambiosPuesto.color = puesto.color;
      if (bgColorActual !== original.bgColor) cambiosPuesto.bgColor = bgColorActual;

      const gapsFilaActuales = gapsPorFilaPorPuesto[puesto.id] || puesto.gapsVerticales || { "0": 40 };
      if (JSON.stringify(gapsFilaActuales) !== original.gapsVerticales) cambiosPuesto.gapsVerticales = gapsFilaActuales;
      if (alimentadoresDelPuesto.length !== original.cantidadAlimentadores && !cambiosPuesto.gapsVerticales) {
         cambiosPuesto.gapsVerticales = gapsFilaActuales;
      }

      const puestoIdStrLS = String(puesto.id);
      const escalaLocalPuesto = escalasPorPuesto[puestoIdStrLS] ?? escalasPorPuesto[puesto.id];
      const escalaActualPuesto = escalaLocalPuesto !== undefined ? escalaLocalPuesto : puesto.escala;
      if (escalaActualPuesto !== original.escala) cambiosPuesto.escala = escalaActualPuesto;

      if (Object.keys(cambiosPuesto).length > 0) cambios.puestos.push({ id: puesto.id, campos: cambiosPuesto });

      // Comparar alimentadores
      alimentadoresDelPuesto.forEach((alim) => {
         const alimIdStr = String(alim.id);
         const originalAlim = snapshot.alimentadores[alimIdStr];

         if (!originalAlim) {
            const gapActual = gapsPorTarjeta[alimIdStr] ?? gapsPorTarjeta[alim.id] ?? alim.gapHorizontal ?? 10;
            if (gapActual !== 10) cambios.alimentadores.push({ id: alim.id, campos: { gapHorizontal: gapActual } });
            return;
         }

         const cambiosAlim = {};
         if (alim.color !== originalAlim.color) cambiosAlim.color = alim.color;

         const gapActual = gapsPorTarjeta[alimIdStr] ?? gapsPorTarjeta[alim.id] ?? alim.gapHorizontal ?? 10;
         if (gapActual !== originalAlim.gapHorizontal) cambiosAlim.gapHorizontal = gapActual;

         const escalaLocalAlim = escalasPorTarjeta[alimIdStr] ?? escalasPorTarjeta[alim.id];
         const escalaActualAlim = escalaLocalAlim !== undefined ? escalaLocalAlim : alim.escala;
         if (escalaActualAlim !== originalAlim.escala) cambiosAlim.escala = escalaActualAlim;

         if (Object.keys(cambiosAlim).length > 0) cambios.alimentadores.push({ id: alim.id, campos: cambiosAlim });
      });
   });

   // Detectar eliminados
   snapshot.alimentadoresIds.forEach((idBase) => {
      if (!alimentadoresActualesIds.has(idBase)) hayElementosEliminados = true;
   });
   Object.keys(gapsPorTarjeta).forEach((alimIdStr) => {
      if (!alimentadoresActualesIds.has(alimIdStr) && snapshot.alimentadoresIds.has(alimIdStr)) hayElementosEliminados = true;
   });

   const hayCambios = cambios.puestos.length > 0 || cambios.alimentadores.length > 0 ||
      Object.keys(cambios.ordenPorPuesto).length > 0 || hayNuevosElementos || hayElementosEliminados;

   return { hayCambios, cambios, hayNuevosElementos, hayElementosEliminados };
}
