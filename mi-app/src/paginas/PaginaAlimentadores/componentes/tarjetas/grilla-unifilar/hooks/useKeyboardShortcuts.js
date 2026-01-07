// hooks/useKeyboardShortcuts.js
// Hook para manejar atajos de teclado

import { useState, useEffect, useRef } from "react";

/**
 * Hook para manejar atajos de teclado en la grilla
 * @param {Object} params - Parámetros del hook
 * @returns {Object} Estado de teclas
 */
export function useKeyboardShortcuts({
   textoSeleccionadoId,
   herramienta,
   inputTextoVisible,
   modoEdicion,
   textos,
   onEliminarTexto,
   onCopiarTexto,
   onPegarTexto,
   posicionMouseRef
}) {
   const [shiftPresionado, setShiftPresionado] = useState(false);

   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === "Shift") {
            setShiftPresionado(true);
         }

         // Delete o Backspace para eliminar texto seleccionado
         if ((e.key === "Delete" || e.key === "Backspace") &&
             textoSeleccionadoId &&
             herramienta === "texto" &&
             !inputTextoVisible) {
            e.preventDefault();
            onEliminarTexto?.(textoSeleccionadoId);
         }

         // Ctrl+C para copiar texto seleccionado
         if (e.ctrlKey && e.key === "c" &&
             textoSeleccionadoId &&
             herramienta === "texto" &&
             modoEdicion &&
             !inputTextoVisible) {
            e.preventDefault();
            onCopiarTexto?.(textoSeleccionadoId);
         }

         // Ctrl+V para pegar texto
         if (e.ctrlKey && e.key === "v" &&
             herramienta === "texto" &&
             modoEdicion &&
             !inputTextoVisible) {
            e.preventDefault();
            const pos = posicionMouseRef?.current || { x: 100, y: 100 };
            onPegarTexto?.(pos.x, pos.y);
         }
      };

      const handleKeyUp = (e) => {
         if (e.key === "Shift") {
            setShiftPresionado(false);
         }
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      return () => {
         window.removeEventListener("keydown", handleKeyDown);
         window.removeEventListener("keyup", handleKeyUp);
      };
   }, [
      textoSeleccionadoId,
      herramienta,
      inputTextoVisible,
      modoEdicion,
      onEliminarTexto,
      onCopiarTexto,
      onPegarTexto,
      posicionMouseRef
   ]);

   return { shiftPresionado };
}
