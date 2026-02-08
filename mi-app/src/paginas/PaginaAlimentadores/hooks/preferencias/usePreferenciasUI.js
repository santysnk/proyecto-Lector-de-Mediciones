// hooks/preferencias/usePreferenciasUI.js

import { useState, useEffect, useCallback } from "react";
import { CLAVES_STORAGE } from "../../constantes/clavesAlmacenamiento";
import {
   GAP_DEFAULT, GAP_MIN, GAP_MAX,
   ROW_GAP_DEFAULT, ROW_GAP_MIN, ROW_GAP_MAX,
   ESCALA_DEFAULT, ESCALA_MIN, ESCALA_MAX,
} from "../../constantes/escalas";
import { leerMapaDeLocalStorage, leerNumeroDeLocalStorage, calcularEscalaEfectiva } from "./preferenciasUIUtils";

export const usePreferenciasUI = () => {
   // ===== GAPS HORIZONTALES =====
   const [gapsPorTarjeta, setGapsPorTarjetaState] = useState(() => leerMapaDeLocalStorage(CLAVES_STORAGE.GAP_TARJETAS));
   useEffect(() => { localStorage.setItem(CLAVES_STORAGE.GAP_TARJETAS, JSON.stringify(gapsPorTarjeta)); }, [gapsPorTarjeta]);

   const obtenerGap = useCallback((alimId) => gapsPorTarjeta[alimId] ?? GAP_DEFAULT, [gapsPorTarjeta]);
   const establecerGap = useCallback((alimId, nuevoGap) => {
      setGapsPorTarjetaState(prev => ({ ...prev, [alimId]: Math.max(GAP_MIN, Math.min(GAP_MAX, nuevoGap)) }));
   }, []);
   const resetearGap = useCallback((alimId) => {
      setGapsPorTarjetaState(prev => { const nuevo = { ...prev }; delete nuevo[alimId]; return nuevo; });
   }, []);
   const resetearTodosLosGaps = useCallback(() => { setGapsPorTarjetaState({}); }, []);

   // ===== GAPS VERTICALES =====
   const [gapsPorFila, setGapsPorFilaState] = useState(() => leerMapaDeLocalStorage(CLAVES_STORAGE.GAP_FILAS));
   useEffect(() => { localStorage.setItem(CLAVES_STORAGE.GAP_FILAS, JSON.stringify(gapsPorFila)); }, [gapsPorFila]);

   const generarClaveRowGap = (puestoId, rowIndex) => `${puestoId}:${rowIndex}`;

   const obtenerRowGap = useCallback((puestoId, rowIndex) => {
      if (!puestoId) return ROW_GAP_DEFAULT;
      return gapsPorFila[generarClaveRowGap(puestoId, rowIndex)] ?? ROW_GAP_DEFAULT;
   }, [gapsPorFila]);
   const establecerRowGap = useCallback((puestoId, rowIndex, nuevoGap) => {
      if (!puestoId) return;
      setGapsPorFilaState(prev => ({ ...prev, [generarClaveRowGap(puestoId, rowIndex)]: Math.max(ROW_GAP_MIN, Math.min(ROW_GAP_MAX, nuevoGap)) }));
   }, []);
   const resetearRowGap = useCallback((puestoId, rowIndex) => {
      if (!puestoId) return;
      setGapsPorFilaState(prev => { const nuevo = { ...prev }; delete nuevo[generarClaveRowGap(puestoId, rowIndex)]; return nuevo; });
   }, []);
   const resetearTodosLosRowGaps = useCallback(() => { setGapsPorFilaState({}); }, []);

   // ===== ESCALA GLOBAL =====
   const [escalaGlobal, setEscalaGlobalState] = useState(() => leerNumeroDeLocalStorage(CLAVES_STORAGE.ESCALA_GLOBAL, ESCALA_DEFAULT));
   useEffect(() => { localStorage.setItem(CLAVES_STORAGE.ESCALA_GLOBAL, escalaGlobal.toString()); }, [escalaGlobal]);

   const establecerEscalaGlobal = useCallback((nuevaEscala) => {
      setEscalaGlobalState(Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, nuevaEscala)));
   }, []);
   const resetearEscalaGlobal = useCallback(() => { setEscalaGlobalState(ESCALA_DEFAULT); }, []);

   // ===== ESCALA POR PUESTO =====
   const [escalasPorPuesto, setEscalasPorPuestoState] = useState(() => leerMapaDeLocalStorage(CLAVES_STORAGE.ESCALA_PUESTOS));
   useEffect(() => { localStorage.setItem(CLAVES_STORAGE.ESCALA_PUESTOS, JSON.stringify(escalasPorPuesto)); }, [escalasPorPuesto]);

   const obtenerEscalaPuesto = useCallback((puestoId) => puestoId ? escalasPorPuesto[puestoId] : null, [escalasPorPuesto]);
   const establecerEscalaPuesto = useCallback((puestoId, nuevaEscala) => {
      if (!puestoId) return;
      setEscalasPorPuestoState(prev => ({ ...prev, [puestoId]: Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, nuevaEscala)) }));
   }, []);
   const resetearEscalaPuesto = useCallback((puestoId) => {
      if (!puestoId) return;
      setEscalasPorPuestoState(prev => { const nuevo = { ...prev }; delete nuevo[puestoId]; return nuevo; });
   }, []);
   const resetearTodasLasEscalasPuestos = useCallback(() => { setEscalasPorPuestoState({}); }, []);

   // ===== ESCALA POR TARJETA =====
   const [escalasPorTarjeta, setEscalasPorTarjetaState] = useState(() => leerMapaDeLocalStorage(CLAVES_STORAGE.ESCALA_TARJETAS));
   useEffect(() => { localStorage.setItem(CLAVES_STORAGE.ESCALA_TARJETAS, JSON.stringify(escalasPorTarjeta)); }, [escalasPorTarjeta]);

   const obtenerEscalaTarjeta = useCallback((alimId) => alimId ? escalasPorTarjeta[alimId] : null, [escalasPorTarjeta]);
   const establecerEscalaTarjeta = useCallback((alimId, nuevaEscala) => {
      if (!alimId) return;
      setEscalasPorTarjetaState(prev => ({ ...prev, [alimId]: Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, nuevaEscala)) }));
   }, []);
   const resetearEscalaTarjeta = useCallback((alimId) => {
      if (!alimId) return;
      setEscalasPorTarjetaState(prev => ({ ...prev, [alimId]: null }));
   }, []);
   const resetearTodasLasEscalasTarjetas = useCallback(() => { setEscalasPorTarjetaState({}); }, []);

   const obtenerEscalaEfectiva = useCallback(
      (alimId, puestoId) => calcularEscalaEfectiva(alimId, puestoId, escalasPorTarjeta, escalasPorPuesto, escalaGlobal, ESCALA_DEFAULT),
      [escalasPorTarjeta, escalasPorPuesto, escalaGlobal]
   );

   const resetearTodasLasEscalas = useCallback(() => {
      setEscalaGlobalState(ESCALA_DEFAULT);
      setEscalasPorPuestoState({});
      setEscalasPorTarjetaState({});
   }, []);

   return {
      gapsPorTarjeta, obtenerGap, establecerGap, resetearGap, resetearTodosLosGaps,
      GAP_MIN, GAP_MAX, GAP_DEFAULT,
      gapsPorFila, obtenerRowGap, establecerRowGap, resetearRowGap, resetearTodosLosRowGaps,
      ROW_GAP_MIN, ROW_GAP_MAX, ROW_GAP_DEFAULT,
      escalaGlobal, establecerEscalaGlobal, resetearEscalaGlobal,
      escalasPorPuesto, obtenerEscalaPuesto, establecerEscalaPuesto, resetearEscalaPuesto, resetearTodasLasEscalasPuestos,
      escalasPorTarjeta, obtenerEscalaTarjeta, establecerEscalaTarjeta, resetearEscalaTarjeta, resetearTodasLasEscalasTarjetas,
      obtenerEscalaEfectiva, resetearTodasLasEscalas,
      ESCALA_MIN, ESCALA_MAX, ESCALA_DEFAULT,
   };
};
