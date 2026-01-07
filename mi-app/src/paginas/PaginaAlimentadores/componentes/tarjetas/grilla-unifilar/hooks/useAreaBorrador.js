// hooks/useAreaBorrador.js
// Hook para manejar la selección de área del borrador

import { useState, useCallback } from "react";

/**
 * Estado inicial del área de borrador
 */
const AREA_INICIAL = {
   activo: false,
   inicioX: 0,
   inicioY: 0,
   actualX: 0,
   actualY: 0
};

/**
 * Hook para manejar la selección de área del borrador
 * @param {Object} params - Parámetros del hook
 * @returns {Object} Estado y funciones del borrador
 */
export function useAreaBorrador({ onBorrarArea }) {
   const [areaBorrador, setAreaBorrador] = useState(AREA_INICIAL);

   /**
    * Iniciar selección de área
    */
   const iniciarSeleccion = useCallback((x, y) => {
      setAreaBorrador({
         activo: true,
         inicioX: x,
         inicioY: y,
         actualX: x,
         actualY: y,
      });
   }, []);

   /**
    * Actualizar área de selección
    */
   const actualizarSeleccion = useCallback((x, y) => {
      if (areaBorrador.activo) {
         setAreaBorrador(prev => ({
            ...prev,
            actualX: x,
            actualY: y,
         }));
      }
   }, [areaBorrador.activo]);

   /**
    * Confirmar borrado del área
    */
   const confirmarBorrado = useCallback(() => {
      if (areaBorrador.activo) {
         onBorrarArea?.(
            areaBorrador.inicioX,
            areaBorrador.inicioY,
            areaBorrador.actualX,
            areaBorrador.actualY
         );
         setAreaBorrador(AREA_INICIAL);
      }
   }, [areaBorrador, onBorrarArea]);

   /**
    * Cancelar selección
    */
   const cancelarSeleccion = useCallback(() => {
      setAreaBorrador(AREA_INICIAL);
   }, []);

   return {
      areaBorrador,
      iniciarSeleccion,
      actualizarSeleccion,
      confirmarBorrado,
      cancelarSeleccion
   };
}
