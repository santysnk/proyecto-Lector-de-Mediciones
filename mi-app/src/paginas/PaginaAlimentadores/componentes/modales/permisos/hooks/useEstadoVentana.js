// hooks/useEstadoVentana.js
// Hook para manejar el estado de ventana (normal, minimizado, maximizado)

import { useState, useCallback } from "react";

/**
 * Hook para manejar estados de ventana tipo escritorio
 * @returns {Object} Estado y funciones de control de ventana
 */
export const useEstadoVentana = () => {
   const [estadoVentana, setEstadoVentana] = useState("normal");
   const [posicion, setPosicion] = useState({ x: null, y: null });

   const handleMinimizar = useCallback(() => {
      setEstadoVentana((prev) => (prev === "minimizado" ? "normal" : "minimizado"));
   }, []);

   const handleMaximizar = useCallback(() => {
      setEstadoVentana((prev) => {
         if (prev === "maximizado") {
            return "normal";
         }
         setPosicion({ x: null, y: null });
         return "maximizado";
      });
   }, []);

   const resetearEstado = useCallback(() => {
      setEstadoVentana("normal");
      setPosicion({ x: null, y: null });
   }, []);

   const getModalClase = useCallback(
      (claseBase, arrastrando = false) => {
         let clase = claseBase;
         if (estadoVentana === "minimizado") clase += ` ${claseBase}--minimizado`;
         if (estadoVentana === "maximizado") clase += ` ${claseBase}--maximizado`;
         if (arrastrando) clase += ` ${claseBase}--arrastrando`;
         return clase;
      },
      [estadoVentana]
   );

   const getModalEstilo = useCallback(() => {
      if (estadoVentana === "maximizado") {
         return {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
         };
      }
      if (estadoVentana === "minimizado") {
         return { position: "fixed", bottom: "1rem", left: "1rem" };
      }
      if (posicion.x !== null && posicion.y !== null) {
         return { position: "fixed", top: posicion.y, left: posicion.x };
      }
      return {};
   }, [estadoVentana, posicion]);

   const getOverlayClase = useCallback(
      (claseBase) => {
         let clase = claseBase;
         if (estadoVentana === "minimizado") clase += ` ${claseBase}--minimizado`;
         if (estadoVentana === "maximizado") clase += ` ${claseBase}--maximizado`;
         return clase;
      },
      [estadoVentana]
   );

   return {
      estadoVentana,
      posicion,
      setPosicion,
      handleMinimizar,
      handleMaximizar,
      resetearEstado,
      getModalClase,
      getModalEstilo,
      getOverlayClase,
   };
};
