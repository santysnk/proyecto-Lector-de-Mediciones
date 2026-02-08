// hooks/ui/useChispas.js
// Hook para animación de chispas en diagrama unifilar (optimizado con refs mutables)

import { useState, useCallback, useRef, useEffect } from "react";
import { construirGrafo, calcularRutasDesdeEmisor } from "../../utilidades/calculadorRutas.js";
import { calcularPosicionPixel, calcularEstelaPixeles, actualizarChispasInPlace } from "./chispasRenderUtils";

const MAX_CHISPAS = 100;

const useChispas = ({ bornes = [], celdas = {}, chispasConfig = {}, grosorLinea = 12 }) => {
   const [animando, setAnimando] = useState(false);
   const animandoRef = useRef(false);
   const chispasRef = useRef([]);
   const animationFrameRef = useRef(null);
   const lastTimeRef = useRef(0);
   const emisionTimersRef = useRef({});
   const grafoRef = useRef({});
   const rutasRef = useRef({});
   const configRef = useRef(chispasConfig);
   const bornesRef = useRef(bornes);
   const grosorLineaRef = useRef(grosorLinea);
   const chispaIdRef = useRef(0);

   useEffect(() => { configRef.current = chispasConfig; }, [chispasConfig]);
   useEffect(() => { bornesRef.current = bornes; }, [bornes]);
   useEffect(() => { grosorLineaRef.current = grosorLinea; }, [grosorLinea]);
   useEffect(() => { grafoRef.current = construirGrafo(celdas); }, [celdas]);

   useEffect(() => {
      const emisores = bornes.filter(b => b.tipo === "EMISOR");
      const nuevasRutas = {};
      emisores.forEach(emisor => { nuevasRutas[emisor.id] = calcularRutasDesdeEmisor(emisor, bornes, grafoRef.current); });
      rutasRef.current = nuevasRutas;
   }, [bornes, celdas]);

   const crearChispa = useCallback((emisor) => {
      const rutas = rutasRef.current[emisor.id] || [];
      if (rutas.length === 0) return null;
      const rutaElegida = rutas[Math.floor(Math.random() * rutas.length)];
      chispaIdRef.current += 1;
      return { id: chispaIdRef.current, ruta: rutaElegida.ruta, posicion: 0, progreso: 0, emisorId: emisor.id, receptorId: rutaElegida.receptorId, estela: [] };
   }, []);

   const emitirDesdeEmisor = useCallback((emisorId) => {
      const emisor = bornesRef.current.find(b => b.id === emisorId && b.tipo === "EMISOR");
      if (!emisor?.activo || chispasRef.current.length >= MAX_CHISPAS) return;
      const nuevaChispa = crearChispa(emisor);
      if (nuevaChispa) chispasRef.current.push(nuevaChispa);
   }, [crearChispa]);

   const loopAnimacion = useCallback((timestamp) => {
      if (!animandoRef.current) return;
      const deltaTime = lastTimeRef.current === 0 ? 16 : timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      const velocidad = configRef.current.velocidad || 8;
      const longitudEstela = configRef.current.longitudEstela || 5;
      const avance = (velocidad * deltaTime) / 1000;
      actualizarChispasInPlace(chispasRef.current, avance, longitudEstela);
      animationFrameRef.current = requestAnimationFrame(loopAnimacion);
   }, []);

   const detenerEmisiones = useCallback(() => {
      Object.values(emisionTimersRef.current).forEach(clearInterval);
      emisionTimersRef.current = {};
   }, []);

   const iniciarEmisiones = useCallback(() => {
      detenerEmisiones();
      const emisores = bornesRef.current.filter(b => b.tipo === "EMISOR" && b.activo);
      const frecuencia = configRef.current.frecuenciaEmision || 2000;
      emisores.forEach(emisor => {
         emitirDesdeEmisor(emisor.id);
         emisionTimersRef.current[emisor.id] = setInterval(() => { if (animandoRef.current) emitirDesdeEmisor(emisor.id); }, frecuencia);
      });
   }, [emitirDesdeEmisor, detenerEmisiones]);

   const frecuenciaActual = chispasConfig.frecuenciaEmision || 2000;
   useEffect(() => {
      if (!animandoRef.current) return;
      Object.values(emisionTimersRef.current).forEach(clearInterval);
      emisionTimersRef.current = {};
      const emisores = bornesRef.current.filter(b => b.tipo === "EMISOR" && b.activo);
      emisores.forEach(emisor => {
         emisionTimersRef.current[emisor.id] = setInterval(() => { if (animandoRef.current) emitirDesdeEmisor(emisor.id); }, frecuenciaActual);
      });
   }, [frecuenciaActual, emitirDesdeEmisor]);

   const iniciarAnimacion = useCallback(() => {
      const emisores = bornesRef.current.filter(b => b.tipo === "EMISOR" && b.activo);
      const receptores = bornesRef.current.filter(b => b.tipo === "RECEPTOR");
      if (emisores.length === 0 || receptores.length === 0) return;
      animandoRef.current = true;
      setAnimando(true);
      lastTimeRef.current = 0;
      chispasRef.current = [];
      iniciarEmisiones();
      animationFrameRef.current = requestAnimationFrame(loopAnimacion);
   }, [iniciarEmisiones, loopAnimacion]);

   const detenerAnimacion = useCallback(() => {
      animandoRef.current = false;
      setAnimando(false);
      detenerEmisiones();
      chispasRef.current = [];
      if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
   }, [detenerEmisiones]);

   const toggleAnimacion = useCallback(() => {
      if (animandoRef.current) detenerAnimacion(); else iniciarAnimacion();
   }, [iniciarAnimacion, detenerAnimacion]);

   const obtenerPosicionPixel = useCallback((chispa) => calcularPosicionPixel(chispa, grosorLineaRef.current), []);
   const obtenerEstelaPixeles = useCallback((chispa) => calcularEstelaPixeles(chispa, grosorLineaRef.current), []);

   useEffect(() => {
      return () => {
         animandoRef.current = false;
         detenerEmisiones();
         if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
         chispasRef.current = [];
      };
   }, [detenerEmisiones]);

   return {
      animando, chispas: chispasRef.current, chispasRef,
      iniciarAnimacion, detenerAnimacion, toggleAnimacion,
      obtenerPosicionPixel, obtenerEstelaPixeles,
   };
};

export default useChispas;
