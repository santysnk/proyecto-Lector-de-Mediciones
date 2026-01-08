// hooks/useArrastrarModal.js
// Hook para arrastrar un modal por la pantalla

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Hook para habilitar arrastrar un modal
 * @param {Object} params
 * @param {string} params.estadoVentana - Estado actual de la ventana
 * @param {Object} params.posicion - Posición {x, y}
 * @param {Function} params.setPosicion - Setter de posición
 * @param {React.RefObject} params.modalRef - Referencia al elemento modal
 * @returns {Object} Estado y manejadores de arrastre
 */
export const useArrastrarModal = ({ estadoVentana, posicion, setPosicion, modalRef }) => {
   const [arrastrando, setArrastrando] = useState(false);
   const dragOffset = useRef({ x: 0, y: 0 });

   const handleMouseDownDrag = useCallback(
      (e) => {
         if (e.button !== 0 || estadoVentana === "maximizado") return;
         if (e.target.closest(".permisos-controles")) return;

         const modal = modalRef.current;
         if (!modal) return;

         const rect = modal.getBoundingClientRect();
         dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
         };

         if (posicion.x === null) {
            setPosicion({ x: rect.left, y: rect.top });
         }

         setArrastrando(true);
         e.preventDefault();
      },
      [estadoVentana, posicion.x, setPosicion, modalRef]
   );

   const handleMouseMoveDrag = useCallback(
      (e) => {
         if (!arrastrando) return;

         const newX = e.clientX - dragOffset.current.x;
         const newY = e.clientY - dragOffset.current.y;

         const modal = modalRef.current;
         if (modal) {
            const maxX = window.innerWidth - modal.offsetWidth;
            const maxY = window.innerHeight - modal.offsetHeight;
            setPosicion({
               x: Math.max(0, Math.min(newX, maxX)),
               y: Math.max(0, Math.min(newY, maxY)),
            });
         }
      },
      [arrastrando, setPosicion, modalRef]
   );

   const handleMouseUpDrag = useCallback(() => {
      setArrastrando(false);
   }, []);

   useEffect(() => {
      if (arrastrando) {
         window.addEventListener("mousemove", handleMouseMoveDrag);
         window.addEventListener("mouseup", handleMouseUpDrag);
         return () => {
            window.removeEventListener("mousemove", handleMouseMoveDrag);
            window.removeEventListener("mouseup", handleMouseUpDrag);
         };
      }
   }, [arrastrando, handleMouseMoveDrag, handleMouseUpDrag]);

   return {
      arrastrando,
      handleMouseDownDrag,
   };
};
