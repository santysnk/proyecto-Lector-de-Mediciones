// hooks/preferencias/useEscalasCombinadas.js
// Hook para obtener escalas combinando localStorage + preferencias usuario + BD

import { useCallback } from "react";

/**
 * Hook para manejar escalas combinadas entre localStorage, preferencias de usuario y BD
 * Prioridad: localStorage (cambios no guardados) > preferencias_usuario > BD > null/default
 *
 * @param {Object} params
 * @param {boolean} params.esCreador - Si el usuario es creador del workspace
 * @param {Object} params.escalasPorPuesto - Escalas de localStorage por puesto
 * @param {Object} params.escalasPorTarjeta - Escalas de localStorage por tarjeta
 * @param {Object} params.puestoSeleccionado - Puesto actualmente seleccionado
 * @param {Array} params.puestos - Lista de puestos
 * @param {Object} params.preferenciasVisualesHook - Hook de preferencias visuales
 * @param {number} params.escalaGlobal - Escala global configurada
 * @param {number} params.ESCALA_DEFAULT - Valor por defecto para escala
 * @returns {Object} Funciones para obtener escalas combinadas
 */
export const useEscalasCombinadas = ({
   esCreador,
   escalasPorPuesto,
   escalasPorTarjeta,
   puestoSeleccionado,
   puestos,
   preferenciasVisualesHook,
   escalaGlobal,
   ESCALA_DEFAULT,
}) => {
   /**
    * Obtiene la escala de un puesto.
    */
   const obtenerEscalaPuestoCombinada = useCallback(
      (puestoId) => {
         if (!puestoId) return null;

         // 1. Primero mirar localStorage
         const escalaLocal = escalasPorPuesto[puestoId];
         if (escalaLocal !== undefined) {
            return escalaLocal;
         }

         // 2. Para invitados, mirar preferencias visuales persistentes
         if (!esCreador) {
            const configPuesto = preferenciasVisualesHook.obtenerConfigPuesto(puestoId);
            if (configPuesto?.escala !== undefined && configPuesto?.escala !== null) {
               return configPuesto.escala;
            }
         }

         // 3. Buscar en los datos de BD base
         const puesto = puestos.find((p) => String(p.id) === String(puestoId));
         if (puesto && puesto.escala !== undefined && puesto.escala !== null) {
            return puesto.escala;
         }

         // 4. No hay escala definida (usar jerarquía global)
         return null;
      },
      [esCreador, escalasPorPuesto, puestos, preferenciasVisualesHook]
   );

   /**
    * Obtiene la escala de un alimentador (tarjeta individual).
    */
   const obtenerEscalaTarjetaCombinada = useCallback(
      (alimId) => {
         if (!alimId) return null;

         // 1. Primero mirar localStorage
         const escalaLocal = escalasPorTarjeta[alimId];
         // Si es null explícito, significa "ignorar escala individual"
         if (escalaLocal === null) {
            return null;
         }
         if (escalaLocal !== undefined) {
            return escalaLocal;
         }

         // 2. Para invitados, mirar preferencias visuales persistentes
         if (!esCreador) {
            const configAlim = preferenciasVisualesHook.obtenerConfigAlimentador(
               alimId,
               puestoSeleccionado?.id
            );
            if (configAlim?.escala !== undefined && configAlim?.escala !== null) {
               return configAlim.escala;
            }
         }

         // 3. Buscar en los datos de BD base
         if (puestoSeleccionado) {
            const alimentador = puestoSeleccionado.alimentadores.find(
               (a) => String(a.id) === String(alimId)
            );
            if (alimentador && alimentador.escala !== undefined && alimentador.escala !== null) {
               return alimentador.escala;
            }
         }

         // 4. No hay escala definida
         return null;
      },
      [esCreador, escalasPorTarjeta, puestoSeleccionado, preferenciasVisualesHook]
   );

   /**
    * Obtiene la escala efectiva de una tarjeta considerando toda la jerarquía:
    * Individual > Por puesto > Global > Default
    */
   const obtenerEscalaEfectivaCombinada = useCallback(
      (alimId, puestoId) => {
         // 1. Escala individual (máxima prioridad)
         const escalaIndividual = obtenerEscalaTarjetaCombinada(alimId);
         if (escalaIndividual !== null) return escalaIndividual;

         // 2. Escala por puesto
         const escalaPuesto = obtenerEscalaPuestoCombinada(puestoId);
         if (escalaPuesto !== null) return escalaPuesto;

         // 3. Escala global (solo localStorage)
         if (escalaGlobal !== ESCALA_DEFAULT) {
            return escalaGlobal;
         }

         // 4. Default
         return ESCALA_DEFAULT;
      },
      [obtenerEscalaTarjetaCombinada, obtenerEscalaPuestoCombinada, escalaGlobal, ESCALA_DEFAULT]
   );

   return {
      obtenerEscalaPuestoCombinada,
      obtenerEscalaTarjetaCombinada,
      obtenerEscalaEfectivaCombinada,
   };
};
