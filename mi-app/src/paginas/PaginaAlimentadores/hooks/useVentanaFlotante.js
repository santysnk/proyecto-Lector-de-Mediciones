// hooks/useVentanaFlotante.js
// Hook para manejar el comportamiento de ventanas flotantes (drag, resize)

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook para manejar el comportamiento de arrastrar y redimensionar ventanas flotantes
 * @param {Object} params - Parámetros del hook
 * @param {boolean} params.maximizada - Si la ventana está maximizada
 * @param {Function} params.onMover - Callback cuando se mueve la ventana
 * @param {Function} params.onEnfocar - Callback cuando se enfoca la ventana
 * @param {Object} params.dimensionesMinimas - Dimensiones mínimas { width, height }
 * @param {Object} params.dimensionesIniciales - Dimensiones iniciales { width, height }
 * @returns {Object} Estado y funciones de la ventana flotante
 */
export function useVentanaFlotante({
   maximizada = false,
   onMover,
   onEnfocar,
   dimensionesMinimas = { width: 600, height: 400 },
   dimensionesIniciales = { width: 900, height: 600 },
}) {
   const ventanaRef = useRef(null);
   const headerRef = useRef(null);

   // Estados para drag
   const [arrastrando, setArrastrando] = useState(false);
   const [offsetArrastre, setOffsetArrastre] = useState({ x: 0, y: 0 });

   // Estados para resize
   const [redimensionando, setRedimensionando] = useState(false);
   const [dimensiones, setDimensiones] = useState(dimensionesIniciales);
   const [dimensionesInicialesResize, setDimensionesInicialesResize] = useState({ width: 0, height: 0 });
   const [posicionInicialResize, setPosicionInicialResize] = useState({ x: 0, y: 0 });

   /**
    * Inicia el arrastre de la ventana
    */
   const handleMouseDownDrag = useCallback((e) => {
      if (maximizada) return;
      if (e.target.closest("button")) return;
      if (onEnfocar) onEnfocar();

      setArrastrando(true);
      const rect = ventanaRef.current?.getBoundingClientRect();
      if (rect) {
         setOffsetArrastre({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
         });
      }
   }, [maximizada, onEnfocar]);

   /**
    * Inicia el redimensionado de la ventana
    */
   const handleMouseDownResize = useCallback((e) => {
      if (maximizada) return;
      e.preventDefault();
      e.stopPropagation();

      setRedimensionando(true);
      setPosicionInicialResize({ x: e.clientX, y: e.clientY });

      const rect = ventanaRef.current?.getBoundingClientRect();
      if (rect) {
         setDimensionesInicialesResize({ width: rect.width, height: rect.height });
      }
   }, [maximizada]);

   // Efecto para manejar el movimiento durante el arrastre
   useEffect(() => {
      if (!arrastrando) return;

      const handleMouseMove = (e) => {
         const newX = Math.max(0, e.clientX - offsetArrastre.x);
         const newY = Math.max(0, e.clientY - offsetArrastre.y);
         if (onMover) {
            onMover({ x: newX, y: newY });
         }
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

   // Efecto para manejar el redimensionado
   useEffect(() => {
      if (!redimensionando) return;

      const handleMouseMove = (e) => {
         const deltaX = e.clientX - posicionInicialResize.x;
         const deltaY = e.clientY - posicionInicialResize.y;
         const newWidth = Math.max(dimensionesMinimas.width, dimensionesInicialesResize.width + deltaX);
         const newHeight = Math.max(dimensionesMinimas.height, dimensionesInicialesResize.height + deltaY);
         setDimensiones({ width: newWidth, height: newHeight });
      };

      const handleMouseUp = () => {
         setRedimensionando(false);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
         document.removeEventListener("mousemove", handleMouseMove);
         document.removeEventListener("mouseup", handleMouseUp);
      };
   }, [redimensionando, posicionInicialResize, dimensionesInicialesResize, dimensionesMinimas]);

   return {
      ventanaRef,
      headerRef,
      dimensiones,
      arrastrando,
      redimensionando,
      handleMouseDownDrag,
      handleMouseDownResize,
   };
}
