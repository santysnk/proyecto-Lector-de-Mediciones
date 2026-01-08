// hooks/preferencias/useGapsCombinados.js
// Hook para obtener gaps combinando localStorage + preferencias usuario + BD

import { useCallback } from "react";

/**
 * Hook para manejar gaps combinados entre localStorage, preferencias de usuario y BD
 * Prioridad: localStorage (cambios no guardados) > preferencias_usuario > BD > default
 *
 * @param {Object} params
 * @param {boolean} params.esCreador - Si el usuario es creador del workspace
 * @param {Object} params.gapsPorTarjeta - Gaps de localStorage por tarjeta
 * @param {Object} params.gapsPorFila - Gaps de localStorage por fila
 * @param {Object} params.puestoSeleccionado - Puesto actualmente seleccionado
 * @param {Array} params.puestos - Lista de puestos
 * @param {Object} params.preferenciasVisualesHook - Hook de preferencias visuales
 * @param {number} params.GAP_DEFAULT - Valor por defecto para gaps horizontales
 * @param {number} params.ROW_GAP_DEFAULT - Valor por defecto para gaps verticales
 * @returns {Object} Funciones para obtener gaps combinados
 */
export const useGapsCombinados = ({
   esCreador,
   gapsPorTarjeta,
   gapsPorFila,
   puestoSeleccionado,
   puestos,
   preferenciasVisualesHook,
   GAP_DEFAULT,
   ROW_GAP_DEFAULT,
}) => {
   /**
    * Obtiene el gap horizontal de un alimentador.
    */
   const obtenerGapCombinado = useCallback(
      (alimId) => {
         // 1. Primero mirar localStorage
         const gapLocal = gapsPorTarjeta[alimId];
         if (gapLocal !== undefined) {
            return gapLocal;
         }

         // 2. Para invitados, mirar preferencias visuales persistentes
         if (!esCreador) {
            const configAlim = preferenciasVisualesHook.obtenerConfigAlimentador(
               alimId,
               puestoSeleccionado?.id
            );
            if (configAlim?.gapHorizontal !== undefined) {
               return configAlim.gapHorizontal;
            }
         }

         // 3. Buscar en los datos de BD base
         if (puestoSeleccionado) {
            const alimentador = puestoSeleccionado.alimentadores.find((a) => a.id === alimId);
            if (alimentador && alimentador.gapHorizontal !== undefined) {
               return alimentador.gapHorizontal;
            }
         }

         // 4. Default
         return GAP_DEFAULT;
      },
      [esCreador, gapsPorTarjeta, puestoSeleccionado, GAP_DEFAULT, preferenciasVisualesHook]
   );

   /**
    * Obtiene el gap vertical de una fila en un puesto específico.
    */
   const obtenerRowGapCombinado = useCallback(
      (puestoId, rowIndex) => {
         // 1. Primero mirar localStorage
         const claveLocal = `${puestoId}:${rowIndex}`;
         const gapLocal = gapsPorFila[claveLocal];
         if (gapLocal !== undefined) {
            return gapLocal;
         }

         // 2. Para invitados, mirar preferencias visuales persistentes
         if (!esCreador) {
            const configPuesto = preferenciasVisualesHook.obtenerConfigPuesto(puestoId);
            if (configPuesto?.gapsVerticales?.[rowIndex] !== undefined) {
               return configPuesto.gapsVerticales[rowIndex];
            }
         }

         // 3. Buscar en los gaps verticales del puesto específico (BD base)
         const puesto = puestos.find((p) => p.id === puestoId);
         if (puesto && puesto.gapsVerticales) {
            const gapBD = puesto.gapsVerticales[rowIndex];
            if (gapBD !== undefined) {
               return gapBD;
            }
         }

         // 4. Default
         return ROW_GAP_DEFAULT;
      },
      [esCreador, gapsPorFila, puestos, ROW_GAP_DEFAULT, preferenciasVisualesHook]
   );

   return {
      obtenerGapCombinado,
      obtenerRowGapCombinado,
   };
};
