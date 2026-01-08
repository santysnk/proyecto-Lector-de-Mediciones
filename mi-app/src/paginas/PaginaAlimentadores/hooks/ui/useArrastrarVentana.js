// hooks/ui/useArrastrarVentana.js
// Hook para manejar drag & drop de ventanas flotantes

import { useState, useEffect, useCallback } from "react";

/**
 * Hook para manejar el arrastre de ventanas flotantes
 * @param {Object} params - Parámetros
 * @param {React.RefObject} params.ventanaRef - Referencia al elemento de la ventana
 * @param {boolean} params.maximizada - Si la ventana está maximizada
 * @param {Function} params.onEnfocar - Callback al enfocar la ventana
 * @param {Function} params.onMover - Callback para mover la ventana ({x, y})
 * @returns {Object} Estado y handlers del arrastre
 */
export const useArrastrarVentana = ({ ventanaRef, maximizada, onEnfocar, onMover }) => {
   const [arrastrando, setArrastrando] = useState(false);
   const [offsetArrastre, setOffsetArrastre] = useState({ x: 0, y: 0 });

   const handleMouseDown = useCallback(
      (e) => {
         if (maximizada) return;
         if (e.target.closest("button")) return;
         onEnfocar();
         setArrastrando(true);
         const rect = ventanaRef.current.getBoundingClientRect();
         setOffsetArrastre({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
         });
      },
      [maximizada, onEnfocar, ventanaRef]
   );

   useEffect(() => {
      if (!arrastrando) return;

      const handleMouseMove = (e) => {
         const newX = Math.max(0, e.clientX - offsetArrastre.x);
         const newY = Math.max(0, e.clientY - offsetArrastre.y);
         onMover({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
         setArrastrando(false);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
         document.removeEventListener("mousemove", handleMouseMove);
         document.removeEventListener("mouseup", handleMouseUp);
      };
   }, [arrastrando, offsetArrastre, onMover]);

   return {
      arrastrando,
      handleMouseDown,
   };
};
