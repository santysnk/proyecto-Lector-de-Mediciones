// hooks/useDragLines.js
// Hook para manejar el arrastre de líneas y textos

import { useState, useCallback } from "react";

/**
 * Estado inicial de arrastre de texto
 */
const ARRASTRE_TEXTO_INICIAL = {
   activo: false,
   textoId: null,
   offsetX: 0,
   offsetY: 0
};

/**
 * Estado inicial de arrastre de líneas
 */
const ARRASTRE_LINEAS_INICIAL = {
   activo: false,
   celdasConectadas: [],
   celdaInicialX: 0,
   celdaInicialY: 0,
   ultimaCeldaX: 0,
   ultimaCeldaY: 0
};

/**
 * Hook para manejar el arrastre de elementos
 * @param {Object} params - Parámetros del hook
 * @returns {Object} Estado y funciones de arrastre
 */
export function useDragLines({
   onActualizarTexto,
   onMoverCeldasConectadas,
   onObtenerCeldasConectadas,
   celdas
}) {
   const [arrastrando, setArrastrando] = useState(ARRASTRE_TEXTO_INICIAL);
   const [arrastrandoLineas, setArrastrandoLineas] = useState(ARRASTRE_LINEAS_INICIAL);

   /**
    * Iniciar arrastre de texto
    */
   const iniciarArrastreTexto = useCallback((textoId, coordsX, coordsY, textoX, textoY) => {
      setArrastrando({
         activo: true,
         textoId,
         offsetX: coordsX - textoX,
         offsetY: coordsY - textoY
      });
   }, []);

   /**
    * Mover texto arrastrando
    */
   const moverTextoArrastrando = useCallback((coordsX, coordsY) => {
      if (arrastrando.activo && arrastrando.textoId) {
         onActualizarTexto?.(arrastrando.textoId, {
            x: coordsX - arrastrando.offsetX,
            y: coordsY - arrastrando.offsetY
         });
      }
   }, [arrastrando, onActualizarTexto]);

   /**
    * Iniciar arrastre de líneas conectadas
    */
   const iniciarArrastreLineas = useCallback((x, y) => {
      const celdasConectadas = onObtenerCeldasConectadas?.(x, y, celdas) || [];
      if (celdasConectadas.length > 0) {
         setArrastrandoLineas({
            activo: true,
            celdasConectadas,
            celdaInicialX: x,
            celdaInicialY: y,
            ultimaCeldaX: x,
            ultimaCeldaY: y,
         });
         return true;
      }
      return false;
   }, [celdas, onObtenerCeldasConectadas]);

   /**
    * Mover líneas arrastrando
    */
   const moverLineasArrastrando = useCallback((x, y) => {
      if (!arrastrandoLineas.activo || arrastrandoLineas.celdasConectadas.length === 0) return;

      const deltaX = x - arrastrandoLineas.ultimaCeldaX;
      const deltaY = y - arrastrandoLineas.ultimaCeldaY;

      if (deltaX !== 0 || deltaY !== 0) {
         onMoverCeldasConectadas?.(arrastrandoLineas.celdasConectadas, deltaX, deltaY);

         const nuevasCeldasConectadas = arrastrandoLineas.celdasConectadas.map(clave => {
            const [cx, cy] = clave.split(",").map(Number);
            return `${cx + deltaX},${cy + deltaY}`;
         });

         setArrastrandoLineas(prev => ({
            ...prev,
            celdasConectadas: nuevasCeldasConectadas,
            ultimaCeldaX: x,
            ultimaCeldaY: y,
         }));
      }
   }, [arrastrandoLineas, onMoverCeldasConectadas]);

   /**
    * Detener todo arrastre
    */
   const detenerArrastre = useCallback(() => {
      setArrastrando(ARRASTRE_TEXTO_INICIAL);
      setArrastrandoLineas(ARRASTRE_LINEAS_INICIAL);
   }, []);

   return {
      arrastrando,
      arrastrandoLineas,
      iniciarArrastreTexto,
      moverTextoArrastrando,
      iniciarArrastreLineas,
      moverLineasArrastrando,
      detenerArrastre
   };
}
