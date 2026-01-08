// hooks/useDeteccionFilas.js
// Hook para detectar filas y posiciones en la grilla de tarjetas

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Hook para detectar las posiciones entre filas y manejar gaps
 * @param {Object} params
 * @param {React.RefObject} params.gridRef - Referencia al elemento grid
 * @param {Array} params.alimentadores - Lista de alimentadores
 * @param {Function} params.obtenerGap - Función para obtener gap de tarjeta
 * @param {Function} params.onGapChange - Handler para cambiar gap
 * @param {string} params.puestoId - ID del puesto
 * @param {Function} params.obtenerRowGap - Función para obtener row gap
 * @returns {Object} Estado y funciones de detección
 */
export const useDeteccionFilas = ({
   gridRef,
   alimentadores,
   obtenerGap,
   onGapChange,
   puestoId,
   obtenerRowGap,
}) => {
   const [posicionesEntreFilas, setPosicionesEntreFilas] = useState([]);
   const [filasPorTarjeta, setFilasPorTarjeta] = useState({});
   const [primerasTarjetasPorFila, setPrimerasTarjetasPorFila] = useState({});

   const filasAnterioresRef = useRef({});
   const snapshotGapsRef = useRef(null);
   const numFilasSnapshotRef = useRef(null);

   const detectarFilasYFinales = useCallback(() => {
      if (!gridRef.current) return;

      const nuevasPosiciones = [];
      const nuevasFilasPorTarjeta = {};
      const nuevasPrimerasPorFila = {};
      let ultimoLeft = null;
      let ultimoBottom = null;
      let filaIndex = 0;

      const tarjetas = Array.from(
         gridRef.current.querySelectorAll(".alim-card-wrapper, .alim-card-add")
      );
      const gridRect = gridRef.current.getBoundingClientRect();

      tarjetas.forEach((wrapper, index) => {
         const alimId = wrapper.dataset.alimId || "nuevo-registrador";
         const rect = wrapper.getBoundingClientRect();

         if (ultimoLeft !== null && rect.left < ultimoLeft) {
            const posY = ultimoBottom - gridRect.top;
            nuevasPosiciones.push({ filaIndex: filaIndex + 1, top: posY });
            filaIndex++;
            nuevasPrimerasPorFila[filaIndex] = alimId;
         } else if (index === 0) {
            nuevasPrimerasPorFila[0] = alimId;
         }

         nuevasFilasPorTarjeta[alimId] = filaIndex;
         ultimoLeft = rect.left;
         ultimoBottom = rect.bottom;
      });

      const numFilasActual = filaIndex + 1;
      const filasAnteriores = filasAnterioresRef.current;
      const numFilasAnterior =
         Object.keys(filasAnteriores).length > 0
            ? Math.max(...Object.values(filasAnteriores)) + 1
            : numFilasActual;

      // Detectar aumento de filas
      if (numFilasActual > numFilasAnterior) {
         if (snapshotGapsRef.current === null) {
            const snapshot = {};
            alimentadores.forEach((alim) => {
               snapshot[alim.id] = obtenerGap(alim.id);
            });
            snapshotGapsRef.current = snapshot;
            numFilasSnapshotRef.current = numFilasAnterior;
         }

         Object.keys(nuevasFilasPorTarjeta).forEach((alimId) => {
            if (alimId === "nuevo-registrador") return;
            const filaAnterior = filasAnteriores[alimId];
            const filaNueva = nuevasFilasPorTarjeta[alimId];

            if (filaAnterior !== undefined && filaNueva > filaAnterior) {
               onGapChange(alimId, 10);
            }
         });
      } else if (numFilasActual < numFilasAnterior) {
         if (
            snapshotGapsRef.current !== null &&
            numFilasActual <= numFilasSnapshotRef.current
         ) {
            Object.keys(snapshotGapsRef.current).forEach((alimId) => {
               onGapChange(alimId, snapshotGapsRef.current[alimId]);
            });
            snapshotGapsRef.current = null;
            numFilasSnapshotRef.current = null;
         }
      }

      filasAnterioresRef.current = nuevasFilasPorTarjeta;

      // Actualizar estado solo si cambió
      const posicionesStr = JSON.stringify(nuevasPosiciones);
      setPosicionesEntreFilas((prev) => {
         if (JSON.stringify(prev) !== posicionesStr) return nuevasPosiciones;
         return prev;
      });

      const filasStr = JSON.stringify(nuevasFilasPorTarjeta);
      setFilasPorTarjeta((prev) => {
         if (JSON.stringify(prev) !== filasStr) return nuevasFilasPorTarjeta;
         return prev;
      });

      const primerasStr = JSON.stringify(nuevasPrimerasPorFila);
      setPrimerasTarjetasPorFila((prev) => {
         if (JSON.stringify(prev) !== primerasStr) return nuevasPrimerasPorFila;
         return prev;
      });
   }, [onGapChange, obtenerGap, alimentadores, gridRef]);

   // Ejecutar después del primer render
   useEffect(() => {
      const raf = requestAnimationFrame(detectarFilasYFinales);
      return () => cancelAnimationFrame(raf);
   }, [alimentadores, detectarFilasYFinales]);

   // Re-detectar en resize
   useEffect(() => {
      const handleResize = () => requestAnimationFrame(detectarFilasYFinales);
      window.addEventListener("resize", handleResize);

      const resizeObserver = new ResizeObserver(() =>
         requestAnimationFrame(detectarFilasYFinales)
      );
      if (gridRef.current) resizeObserver.observe(gridRef.current);

      return () => {
         window.removeEventListener("resize", handleResize);
         resizeObserver.disconnect();
      };
   }, [detectarFilasYFinales, gridRef]);

   // Re-detectar cuando cambian row gaps o puesto
   useEffect(() => {
      const timer = setTimeout(() => requestAnimationFrame(detectarFilasYFinales), 50);
      return () => clearTimeout(timer);
   }, [obtenerRowGap, puestoId, detectarFilasYFinales]);

   return {
      posicionesEntreFilas,
      filasPorTarjeta,
      primerasTarjetasPorFila,
      detectarFilasYFinales,
   };
};
