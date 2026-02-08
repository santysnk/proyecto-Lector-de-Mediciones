/**
 * Precarga de datos históricos para un alimentador individual
 * Incluye verificación de cache y ejecución de precarga de 48h
 */

import { obtenerLecturasRango, cachearLecturasRemotas } from "../../utilidades/indexedDBHelper";
import { obtenerLecturasHistoricasPorRegistrador } from "@/servicios/apiService";
import {
   HORAS_RETENCION_LOCAL,
   UMBRAL_COBERTURA_CACHE,
   MAX_ANTIGUEDAD_CACHE_MINUTOS,
} from "../../constantes/historialConfig";

/**
 * Verifica si ya hay datos suficientes y recientes en cache
 * @param {IDBDatabase} db
 * @param {string} alimentadorId
 * @param {string} registradorId
 * @param {string} zona
 * @returns {Promise<boolean>}
 */
export const verificarCacheExistente = async (db, alimentadorId, registradorId, zona) => {
   if (!db || !registradorId) return false;

   const ahora = Date.now();
   const desde = ahora - HORAS_RETENCION_LOCAL * 60 * 60 * 1000;
   const hasta = ahora;

   try {
      const datosLocales = await obtenerLecturasRango(db, alimentadorId, registradorId, zona, desde, hasta);

      if (datosLocales.length === 0) return false;

      // Verificar cobertura temporal
      const primerTimestamp = Math.min(...datosLocales.map((d) => d.timestamp));
      const ultimoTimestamp = Math.max(...datosLocales.map((d) => d.timestamp));
      const rangoSolicitadoMs = hasta - desde;
      const rangoCubiertoMs = hasta - primerTimestamp;
      const porcentajeCubierto = rangoCubiertoMs / rangoSolicitadoMs;

      // Verificar antigüedad del último dato
      const antiguedadUltimoDatoMs = ahora - ultimoTimestamp;
      const maxAntiguedadMs = MAX_ANTIGUEDAD_CACHE_MINUTOS * 60 * 1000;
      const datosRecientes = antiguedadUltimoDatoMs <= maxAntiguedadMs;

      const coberturaOK = porcentajeCubierto >= UMBRAL_COBERTURA_CACHE;
      const cacheValido = coberturaOK && datosRecientes;

      console.log(`[Historial] Cache existente para ${zona}:`, {
         registradorId,
         datosEncontrados: datosLocales.length,
         porcentajeCubierto: (porcentajeCubierto * 100).toFixed(1) + "%",
         antiguedadUltimoDato: Math.round(antiguedadUltimoDatoMs / 60000) + " min",
         maxAntiguedadPermitida: MAX_ANTIGUEDAD_CACHE_MINUTOS + " min",
         datosRecientes,
         cacheValido,
      });

      return cacheValido;
   } catch (err) {
      console.error("[Historial] Error verificando cache:", err);
      return false;
   }
};

/**
 * Construye las tareas de consulta para precarga
 * Agrupa por registrador para evitar consultas duplicadas
 */
export const construirTareasConsulta = (
   registradorIdSuperior,
   registradorIdInferior,
   cacheSuperiorOK,
   cacheInferiorOK
) => {
   const tareasConsulta = [];
   const mismoRegistrador = registradorIdSuperior === registradorIdInferior;

   if (registradorIdSuperior && !cacheSuperiorOK) {
      tareasConsulta.push({ registradorId: registradorIdSuperior, zonas: ["superior"] });
   }

   if (registradorIdInferior && !cacheInferiorOK) {
      if (mismoRegistrador) {
         const consultaExistente = tareasConsulta.find((t) => t.registradorId === registradorIdInferior);
         if (consultaExistente) {
            consultaExistente.zonas.push("inferior");
         } else {
            tareasConsulta.push({ registradorId: registradorIdInferior, zonas: ["inferior"] });
         }
      } else {
         tareasConsulta.push({ registradorId: registradorIdInferior, zonas: ["inferior"] });
      }
   }

   return tareasConsulta;
};

/**
 * Ejecuta la precarga de 48h para un alimentador
 * @param {Object} params
 * @returns {Promise<{exito: boolean, datosDeBD: boolean}>}
 */
export const ejecutarPrecarga48h = async ({
   db,
   alimentadorId,
   registradorIdSuperior,
   registradorIdInferior,
   onProgreso,
   abortRef,
}) => {
   const ahora = Date.now();
   const desde = ahora - HORAS_RETENCION_LOCAL * 60 * 60 * 1000;
   const hasta = ahora;
   let datosDeBD = false;

   // Verificar cache existente
   const cacheSuperiorOK = await verificarCacheExistente(db, alimentadorId, registradorIdSuperior, "superior");
   const cacheInferiorOK = await verificarCacheExistente(db, alimentadorId, registradorIdInferior, "inferior");

   if (cacheSuperiorOK && cacheInferiorOK) {
      console.log("[Historial] Cache ya válido para ambas zonas, omitiendo precarga");
      onProgreso(100);
      return { exito: true, datosDeBD: false };
   }

   const tareasConsulta = construirTareasConsulta(
      registradorIdSuperior,
      registradorIdInferior,
      cacheSuperiorOK,
      cacheInferiorOK
   );

   if (tareasConsulta.length === 0) {
      console.log("[Historial] No hay registradores configurados para precargar");
      onProgreso(100);
      return { exito: true, datosDeBD: false };
   }

   const totalZonas = tareasConsulta.reduce((sum, t) => sum + t.zonas.length, 0);
   const progresoPorZona = 100 / totalZonas;
   let progresoActual = 0;

   try {
      for (const tarea of tareasConsulta) {
         if (abortRef.current) {
            console.log("[Historial] Precarga abortada");
            return { exito: false, datosDeBD };
         }

         console.log(
            `[Historial] Precargando registrador ${tarea.registradorId} para zonas: ${tarea.zonas.join(", ")}...`
         );

         onProgreso(Math.round(progresoActual + progresoPorZona * 0.1));

         const datosRemotos = await obtenerLecturasHistoricasPorRegistrador(
            tarea.registradorId,
            new Date(desde).toISOString(),
            new Date(hasta).toISOString()
         );

         if (abortRef.current) {
            return { exito: false, datosDeBD };
         }

         onProgreso(Math.round(progresoActual + progresoPorZona * tarea.zonas.length * 0.5));

         if (datosRemotos && datosRemotos.length > 0 && db) {
            datosDeBD = true;

            for (const zona of tarea.zonas) {
               const guardadas = await cachearLecturasRemotas(
                  db,
                  alimentadorId,
                  tarea.registradorId,
                  zona,
                  datosRemotos
               );

               console.log(`[Historial] Precarga ${zona} completada:`, {
                  registradorId: tarea.registradorId,
                  lecturasRecibidas: datosRemotos.length,
                  lecturasGuardadas: guardadas,
               });

               progresoActual += progresoPorZona;
               onProgreso(Math.round(progresoActual));
            }
         } else {
            console.log(`[Historial] No hay datos remotos para registrador ${tarea.registradorId}`);
            progresoActual += progresoPorZona * tarea.zonas.length;
            onProgreso(Math.round(progresoActual));
         }
      }

      onProgreso(100);
      console.log("[Historial] Precarga de 48h completada exitosamente");
      return { exito: true, datosDeBD };
   } catch (err) {
      console.error("[Historial] Error en precarga:", err);
      return { exito: false, datosDeBD };
   }
};
