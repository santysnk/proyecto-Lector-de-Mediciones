/**
 * Hook para manejar el historial local de lecturas
 * Usa IndexedDB como caché inteligente que se auto-alimenta:
 * - Guarda lecturas del polling en tiempo real
 * - Cachea datos remotos cuando se consultan por primera vez
 * - Evita duplicados por timestamp
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
   abrirDB,
   guardarLectura,
   limpiarLecturasAntiguas,
   obtenerEstadisticas,
   limpiarTodo,
} from "../utilidades/indexedDBHelper";
import { HORAS_RETENCION_LOCAL } from "../constantes/historialConfig";
import {
   determinarEstrategia,
   obtenerDatosLocales,
   consultarYCachearRemoto,
   obtenerDatosHibrido,
   rangoExcede48h,
} from "./historial/logicaFuenteDatos";
import { ejecutarPrecarga48h, ejecutarPrecargaPuesto } from "./historial/logicaPrecarga";

export const useHistorialLocal = () => {
   const [cargando, setCargando] = useState(false);
   const [error, setError] = useState(null);
   const [estadisticas, setEstadisticas] = useState(null);
   const [dbLista, setDbLista] = useState(false);

   // Estado de precarga de 48h
   const [precargaProgreso, setPrecargaProgreso] = useState(0);
   const [precargaCompleta, setPrecargaCompleta] = useState(false);
   const [precargando, setPrecargando] = useState(false);
   const [datosDeBD, setDatosDeBD] = useState(false);
   const precargaAbortRef = useRef(false);

   const dbRef = useRef(null);

   // Inicializar IndexedDB
   useEffect(() => {
      const init = async () => {
         if (dbRef.current) {
            setDbLista(true);
            return;
         }

         try {
            dbRef.current = await abrirDB();

            const eliminados = await limpiarLecturasAntiguas(dbRef.current, HORAS_RETENCION_LOCAL);
            if (eliminados > 0) {
               console.log(`[Historial] Limpiados ${eliminados} registros antiguos`);
            }

            const stats = await obtenerEstadisticas(dbRef.current);
            setEstadisticas(stats);
            setDbLista(true);
         } catch (err) {
            console.error("[Historial] Error inicializando IndexedDB:", err);
         }
      };

      init();
   }, []);

   /**
    * Guarda una lectura en IndexedDB (llamado desde el polling)
    */
   const guardarLecturaLocal = useCallback(async (alimentadorId, registradorId, zona, lectura) => {
      if (!dbRef.current) return;

      try {
         await guardarLectura(dbRef.current, {
            alimentadorId,
            registradorId,
            zona,
            timestamp: lectura.timestamp || Date.now(),
            valores: lectura.valores,
            indiceInicial: lectura.indice_inicial ?? lectura.indiceInicial ?? 0,
            exito: lectura.exito !== false,
         });
      } catch {
         // No logueamos errores de guardado para no saturar la consola
      }
   }, []);

   /**
    * Obtiene datos para el gráfico (lógica híbrida con cache inteligente)
    * @param {boolean} forzarSoloLocal - Si true, fuerza usar solo datos locales
    */
   const obtenerDatosGrafico = useCallback(
      async (alimentadorId, registradorId, zona, desde, hasta, forzarSoloLocal = false) => {
         setCargando(true);
         setError(null);

         try {
            const estrategia = determinarEstrategia(desde, hasta, forzarSoloLocal);
            const excede48h = rangoExcede48h(desde, hasta);

            // MODO SOLO LOCAL (precarga completa y rango <= 48h)
            if (estrategia === "soloLocal") {
               const datosLocales = await obtenerDatosLocales(
                  dbRef.current,
                  alimentadorId,
                  registradorId,
                  zona,
                  desde,
                  hasta
               );

               console.log("[Historial] MODO SOLO LOCAL (precarga completa):", {
                  alimentadorId,
                  registradorId,
                  zona,
                  datosEncontrados: datosLocales.length,
               });

               return { datos: datosLocales, fuente: "local" };
            }

            // MODO REMOTO DIRECTO (rango > 48h)
            if (estrategia === "remoto" || excede48h) {
               console.log("[Historial] Rango excede 48h, consultando remoto");

               const datosRemotos = await consultarYCachearRemoto(
                  dbRef.current,
                  alimentadorId,
                  registradorId,
                  zona,
                  desde,
                  hasta
               );
               return { datos: datosRemotos, fuente: "remoto" };
            }

            // MODO HÍBRIDO
            return await obtenerDatosHibrido({
               db: dbRef.current,
               alimentadorId,
               registradorId,
               zona,
               desde,
               hasta,
            });
         } catch (err) {
            console.error("[Historial] Error obteniendo datos:", err);
            setError(err.message);
            return { datos: [], fuente: "error" };
         } finally {
            setCargando(false);
         }
      },
      []
   );

   /**
    * Precarga las últimas 48h de datos para ambas zonas
    */
   const precargar48h = useCallback(async (alimentadorId, registradorIdSuperior, registradorIdInferior) => {
      setPrecargaProgreso(0);
      setPrecargaCompleta(false);
      setPrecargando(true);
      setDatosDeBD(false);
      precargaAbortRef.current = false;

      try {
         const resultado = await ejecutarPrecarga48h({
            db: dbRef.current,
            alimentadorId,
            registradorIdSuperior,
            registradorIdInferior,
            onProgreso: setPrecargaProgreso,
            abortRef: precargaAbortRef,
         });

         setDatosDeBD(resultado.datosDeBD);
         setPrecargaCompleta(true);
         setPrecargando(false);
         return resultado.exito;
      } catch {
         setPrecargando(false);
         setPrecargaProgreso(0);
         setPrecargaCompleta(true);
         return false;
      }
   }, []);

   /**
    * Precarga datos para todos los alimentadores de un puesto
    */
   const precargarPuesto = useCallback(async (alimentadores) => {
      setPrecargaProgreso(0);
      setPrecargaCompleta(false);
      setPrecargando(true);
      setDatosDeBD(false);
      precargaAbortRef.current = false;

      try {
         const resultado = await ejecutarPrecargaPuesto({
            db: dbRef.current,
            alimentadores,
            onProgreso: setPrecargaProgreso,
            abortRef: precargaAbortRef,
         });

         setDatosDeBD(resultado.datosDeBD);
         setPrecargaCompleta(true);
         setPrecargando(false);
         return resultado.exito;
      } catch {
         setPrecargando(false);
         setPrecargaProgreso(0);
         setPrecargaCompleta(true);
         return false;
      }
   }, []);

   /**
    * Cancela la precarga en curso
    */
   const cancelarPrecarga = useCallback(() => {
      precargaAbortRef.current = true;
   }, []);

   /**
    * Resetea el estado de precarga (al cerrar modal)
    */
   const resetearPrecarga = useCallback(() => {
      precargaAbortRef.current = true;
      setPrecargaProgreso(0);
      setPrecargaCompleta(false);
      setPrecargando(false);
      setDatosDeBD(false);
   }, []);

   /**
    * Limpia lecturas antiguas manualmente
    */
   const limpiarHistorial = useCallback(async () => {
      if (!dbRef.current) return 0;

      try {
         const eliminados = await limpiarLecturasAntiguas(dbRef.current, HORAS_RETENCION_LOCAL);
         const stats = await obtenerEstadisticas(dbRef.current);
         setEstadisticas(stats);
         return eliminados;
      } catch (err) {
         console.error("[Historial] Error limpiando historial:", err);
         return 0;
      }
   }, []);

   /**
    * Limpia TODO el cache local
    */
   const limpiarCacheCompleto = useCallback(async () => {
      if (!dbRef.current) return false;

      try {
         await limpiarTodo(dbRef.current);
         const stats = await obtenerEstadisticas(dbRef.current);
         setEstadisticas(stats);
         setPrecargaProgreso(0);
         setPrecargaCompleta(false);
         setDatosDeBD(false);
         console.log("[Historial] Cache local limpiado completamente");
         return true;
      } catch (err) {
         console.error("[Historial] Error limpiando cache completo:", err);
         return false;
      }
   }, []);

   /**
    * Actualiza estadísticas
    */
   const actualizarEstadisticas = useCallback(async () => {
      if (!dbRef.current) return;

      try {
         const stats = await obtenerEstadisticas(dbRef.current);
         setEstadisticas(stats);
      } catch (err) {
         console.error("[Historial] Error actualizando estadísticas:", err);
      }
   }, []);

   return {
      guardarLecturaLocal,
      obtenerDatosGrafico,
      limpiarHistorial,
      limpiarCacheCompleto,
      actualizarEstadisticas,
      // Precarga 48h
      precargar48h,
      precargarPuesto,
      cancelarPrecarga,
      resetearPrecarga,
      precargaProgreso,
      precargaCompleta,
      precargando,
      datosDeBD,
      // Estado general
      dbLista,
      cargando,
      error,
      estadisticas,
      horasRetencion: HORAS_RETENCION_LOCAL,
   };
};

export default useHistorialLocal;
