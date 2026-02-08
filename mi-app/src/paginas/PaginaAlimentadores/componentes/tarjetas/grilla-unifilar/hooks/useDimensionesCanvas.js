/**
 * Hook para observar y mantener las dimensiones del canvas de la grilla
 */

import { useState, useEffect } from "react";

/**
 * Observa el contenedor padre y devuelve sus dimensiones actualizadas
 * @param {React.RefObject} contenedorRef - Ref del contenedor
 * @param {boolean} modoEdicion - Si está en modo edición
 * @returns {{ ancho: number, alto: number }}
 */
export const useDimensionesCanvas = (contenedorRef, modoEdicion) => {
   const [dimensiones, setDimensiones] = useState({ ancho: 0, alto: 0 });

   useEffect(() => {
      let resizeObserver = null;
      let mutationObserver = null;
      const timers = [];

      const actualizarDimensiones = () => {
         if (!contenedorRef.current) return;
         const padre = contenedorRef.current.parentElement;
         if (!padre) return;

         const rect = padre.getBoundingClientRect();
         if (rect.width > 0 && rect.height > 0) {
            setDimensiones((prev) => {
               if (prev.ancho !== rect.width || prev.alto !== rect.height) {
                  return { ancho: rect.width, alto: rect.height };
               }
               return prev;
            });
         }
      };

      // Múltiples intentos de actualización para capturar el layout estable
      requestAnimationFrame(actualizarDimensiones);
      timers.push(setTimeout(actualizarDimensiones, 50));
      timers.push(setTimeout(actualizarDimensiones, 150));
      timers.push(setTimeout(actualizarDimensiones, 300));
      timers.push(setTimeout(actualizarDimensiones, 500));

      resizeObserver = new ResizeObserver(actualizarDimensiones);
      if (contenedorRef.current?.parentElement) {
         resizeObserver.observe(contenedorRef.current.parentElement);
      }

      // Observar cambios en el body para detectar modales que se abren/cierran
      mutationObserver = new MutationObserver(() => {
         requestAnimationFrame(actualizarDimensiones);
         setTimeout(actualizarDimensiones, 100);
      });
      mutationObserver.observe(document.body, { childList: true, subtree: false });

      const handleVisibilityChange = () => {
         if (document.visibilityState === 'visible') {
            requestAnimationFrame(actualizarDimensiones);
         }
      };

      window.addEventListener("resize", actualizarDimensiones);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
         timers.forEach(clearTimeout);
         if (resizeObserver) resizeObserver.disconnect();
         if (mutationObserver) mutationObserver.disconnect();
         window.removeEventListener("resize", actualizarDimensiones);
         document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
   }, [modoEdicion, contenedorRef]);

   return dimensiones;
};
