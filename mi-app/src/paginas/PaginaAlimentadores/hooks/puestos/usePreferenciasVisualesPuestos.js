// hooks/puestos/usePreferenciasVisualesPuestos.js
// Hook para aplicar preferencias visuales personales sobre puestos y alimentadores

import { useMemo } from "react";

/**
 * Hook que aplica preferencias visuales personales (color, ocultos, etc.) sobre puestos y alimentadores base.
 * Para invitados: aplica configuración personal. Para creadores: usa datos base sin cambios.
 *
 * @param {Object} params
 * @param {boolean} params.esCreador - Si el usuario es creador del workspace
 * @param {Array} params.puestos - Lista de puestos base desde BD
 * @param {Object} params.puestoSeleccionado - Puesto actualmente seleccionado
 * @param {Object|null} params.preferenciasVisuales - Objeto con funciones para obtener preferencias personales
 * @returns {Object} Puestos y alimentadores con preferencias aplicadas
 */
export const usePreferenciasVisualesPuestos = ({
   esCreador,
   puestos,
   puestoSeleccionado,
   preferenciasVisuales,
}) => {
   // Puestos con preferencias (para modal de edición)
   const puestosConPreferencias = useMemo(() => {
      if (esCreador || !preferenciasVisuales) {
         return puestos;
      }

      return puestos.map((puesto) => {
         const configPuesto = preferenciasVisuales.obtenerConfigPuesto?.(puesto.id);

         return {
            ...puesto,
            color: configPuesto?.color || puesto.color,
            bgColor: configPuesto?.bg_color || puesto.bgColor || puesto.bg_color,
            alimentadores: (puesto.alimentadores || []).map((alim) => {
               const configAlim = preferenciasVisuales.obtenerConfigAlimentador?.(alim.id, puesto.id);
               return {
                  ...alim,
                  color: configAlim?.color || alim.color,
               };
            }),
         };
      });
   }, [esCreador, puestos, preferenciasVisuales]);

   // Alimentadores del puesto seleccionado con preferencias aplicadas
   const alimentadoresConPreferencias = useMemo(() => {
      if (!puestoSeleccionado?.alimentadores) return [];
      if (esCreador || !preferenciasVisuales) {
         return puestoSeleccionado.alimentadores;
      }

      return puestoSeleccionado.alimentadores.map((alim) => {
         const configAlim = preferenciasVisuales.obtenerConfigAlimentador?.(alim.id, puestoSeleccionado.id);

         const alimConPrefs = {
            ...alim,
            color: configAlim?.color || alim.color,
         };

         // Aplicar intervalo personalizado si existe
         if (configAlim?.intervalo_consulta_ms !== undefined) {
            alimConPrefs.intervalo_consulta_ms = configAlim.intervalo_consulta_ms;
         }

         // Aplicar estados "oculto" personalizados a las zonas del card_design
         if (configAlim?.oculto_superior !== undefined || configAlim?.oculto_inferior !== undefined) {
            alimConPrefs.card_design = {
               ...alim.card_design,
               superior: {
                  ...alim.card_design?.superior,
                  ...(configAlim?.oculto_superior !== undefined && { oculto: configAlim.oculto_superior }),
               },
               inferior: {
                  ...alim.card_design?.inferior,
                  ...(configAlim?.oculto_inferior !== undefined && { oculto: configAlim.oculto_inferior }),
               },
            };
         }

         return alimConPrefs;
      });
   }, [esCreador, puestoSeleccionado, preferenciasVisuales]);

   return {
      puestosConPreferencias,
      alimentadoresConPreferencias,
   };
};
