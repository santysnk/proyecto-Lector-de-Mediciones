// hooks/ui/useModoCompacto.js
// Hook para detectar y manejar el modo compacto/responsive

import { useState, useEffect, useCallback } from "react";

const BREAKPOINT_COMPACTO = 900;

/**
 * Hook para detectar modo compacto (móvil) y ajustar escalas automáticamente
 *
 * @param {Object} params
 * @param {number} params.escalaGlobal - Escala global configurada
 * @param {Function} params.obtenerEscalaEfectiva - Función para obtener escala efectiva
 * @returns {Object} Estado de modo compacto y funciones ajustadas
 */
export const useModoCompacto = ({ escalaGlobal, obtenerEscalaEfectiva }) => {
   const [esCompacto, setEsCompacto] = useState(false);

   // Detectar modo compacto según el ancho de la ventana
   useEffect(() => {
      const actualizarModo = () => setEsCompacto(window.innerWidth < BREAKPOINT_COMPACTO);
      actualizarModo();
      window.addEventListener("resize", actualizarModo);
      return () => window.removeEventListener("resize", actualizarModo);
   }, []);

   // En modo compacto (móvil), forzar escala global a 1 para visualización
   const escalaGlobalEfectiva = esCompacto ? 1 : escalaGlobal;

   // Wrapper para obtenerEscalaEfectiva que considera el modo compacto
   const obtenerEscalaEfectivaConModoCompacto = useCallback(
      (alimentadorId, puestoId) => {
         if (esCompacto) {
            return 1;
         }
         return obtenerEscalaEfectiva(alimentadorId, puestoId);
      },
      [esCompacto, obtenerEscalaEfectiva]
   );

   return {
      esCompacto,
      escalaGlobalEfectiva,
      obtenerEscalaEfectivaConModoCompacto,
   };
};
