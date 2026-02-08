/**
 * Hook para el sistema de bornes y configuración de chispas
 */

import { useState, useCallback } from "react";
import { TIPOS_BORNE } from ".";

/**
 * @param {Object} params
 * @param {Object} params.celdas - Estado actual de las celdas
 * @param {number} params.grosorLinea - Grosor de línea actual
 * @param {Object} params.chispasConfigInicial - Configuración inicial de chispas
 * @param {Array} params.bornesIniciales - Bornes iniciales
 * @param {Function} params.guardarConBornes - Función para guardar con bornes y chispas
 */
export const useBornesYChispas = ({
   celdas,
   grosorLinea,
   chispasConfigInicial,
   bornesIniciales,
   guardarConBornes,
}) => {
   const [bornes, setBornes] = useState(bornesIniciales);
   const [chispasConfig, setChispasConfig] = useState(chispasConfigInicial);

   const agregarBorne = useCallback(
      (x, y, tipo) => {
         const claveCelda = `${x},${y}`;
         if (!celdas[claveCelda]) {
            console.warn("Solo se pueden colocar bornes sobre líneas pintadas");
            return false;
         }
         if (bornes.some((b) => b.x === x && b.y === y)) {
            console.warn("Ya existe un borne en esta posición");
            return false;
         }

         const contadorTipo = bornes.filter((b) => b.tipo === tipo).length + 1;
         const nuevoBorne = {
            id: `borne-${Date.now()}`,
            tipo,
            x,
            y,
            color: tipo === TIPOS_BORNE.EMISOR ? "#22d3ee" : "#f97316",
            activo: true,
            frecuenciaMs: chispasConfig.frecuenciaEmision,
            nombre: `${tipo === TIPOS_BORNE.EMISOR ? "E" : "R"}${contadorTipo}`,
         };

         const nuevosBornes = [...bornes, nuevoBorne];
         setBornes(nuevosBornes);
         guardarConBornes(grosorLinea, nuevosBornes, null);
         return true;
      },
      [celdas, bornes, chispasConfig.frecuenciaEmision, grosorLinea, guardarConBornes]
   );

   const eliminarBorne = useCallback(
      (borneId) => {
         const nuevosBornes = bornes.filter((b) => b.id !== borneId);
         setBornes(nuevosBornes);
         guardarConBornes(grosorLinea, nuevosBornes, null);
      },
      [bornes, grosorLinea, guardarConBornes]
   );

   const eliminarBorneEnPosicion = useCallback(
      (x, y) => {
         const borneEnPosicion = bornes.find((b) => b.x === x && b.y === y);
         if (borneEnPosicion) {
            eliminarBorne(borneEnPosicion.id);
            return true;
         }
         return false;
      },
      [bornes, eliminarBorne]
   );

   const actualizarBorne = useCallback(
      (borneId, cambios) => {
         const nuevosBornes = bornes.map((b) => (b.id === borneId ? { ...b, ...cambios } : b));
         setBornes(nuevosBornes);
         guardarConBornes(grosorLinea, nuevosBornes, null);
      },
      [bornes, grosorLinea, guardarConBornes]
   );

   const obtenerBorneEnPosicion = useCallback(
      (x, y) => bornes.find((b) => b.x === x && b.y === y) || null,
      [bornes]
   );

   const actualizarChispasConfig = useCallback(
      (nuevaConfig) => {
         const configActualizada = { ...chispasConfig, ...nuevaConfig };
         setChispasConfig(configActualizada);
         guardarConBornes(grosorLinea, bornes, configActualizada);
      },
      [chispasConfig, grosorLinea, bornes, guardarConBornes]
   );

   return {
      bornes,
      setBornes,
      chispasConfig,
      setChispasConfig,
      agregarBorne,
      eliminarBorne,
      eliminarBorneEnPosicion,
      actualizarBorne,
      obtenerBorneEnPosicion,
      actualizarChispasConfig,
   };
};
