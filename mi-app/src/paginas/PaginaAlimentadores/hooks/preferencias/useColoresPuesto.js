// hooks/preferencias/useColoresPuesto.js
// Hook para obtener colores de puestos combinando preferencias y BD

import { useCallback } from "react";

/**
 * Hook para obtener colores de puestos considerando preferencias de usuario
 *
 * @param {Object} params
 * @param {boolean} params.esCreador - Si el usuario es creador
 * @param {Array} params.puestos - Lista de puestos
 * @param {Object} params.preferenciasVisualesHook - Hook de preferencias visuales
 * @returns {Object} Funciones para obtener colores
 */
export const useColoresPuesto = ({ esCreador, puestos, preferenciasVisualesHook }) => {
   /**
    * Obtiene el color del botón de un puesto.
    * - Creador: devuelve el color de la BD
    * - Invitado: devuelve preferencia personal > BD
    */
   const obtenerColorPuesto = useCallback(
      (puestoId) => {
         const puesto = puestos.find((p) => p.id === puestoId);
         if (!puesto) return null;

         // Para invitados, verificar si tienen preferencia personal
         if (!esCreador) {
            const configPuesto = preferenciasVisualesHook.obtenerConfigPuesto(puestoId);
            if (configPuesto?.color) {
               return configPuesto.color;
            }
         }

         return puesto.color;
      },
      [esCreador, puestos, preferenciasVisualesHook]
   );

   /**
    * Obtiene el color de fondo de un puesto.
    * - Creador: devuelve el color de la BD
    * - Invitado: devuelve preferencia personal > BD
    */
   const obtenerBgColorPuesto = useCallback(
      (puestoId) => {
         const puesto = puestos.find((p) => p.id === puestoId);
         if (!puesto) return null;

         // Para invitados, verificar si tienen preferencia personal
         if (!esCreador) {
            const configPuesto = preferenciasVisualesHook.obtenerConfigPuesto(puestoId);
            if (configPuesto?.bg_color) {
               return configPuesto.bg_color;
            }
         }

         return puesto.bgColor || puesto.bg_color;
      },
      [esCreador, puestos, preferenciasVisualesHook]
   );

   return {
      obtenerColorPuesto,
      obtenerBgColorPuesto,
   };
};
