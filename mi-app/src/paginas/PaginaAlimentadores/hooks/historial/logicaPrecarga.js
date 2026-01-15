/**
 * Lógica de precarga de datos históricos
 * Maneja la precarga de 48h y precarga por puesto
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
 * @param {string} registradorIdSuperior
 * @param {string} registradorIdInferior
 * @param {boolean} cacheSuperiorOK
 * @param {boolean} cacheInferiorOK
 * @returns {Array<{registradorId: string, zonas: string[]}>}
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

/**
 * Recopila tareas pendientes de precarga para un puesto
 * ACTUALIZADO: Usa config_tarjeta en lugar de card_design
 * @param {IDBDatabase} db
 * @param {Array} alimentadores
 * @param {Object} abortRef
 * @returns {Promise<Array>}
 */
export const recopilarTareasPuesto = async (db, alimentadores, abortRef) => {
   const tareasPendientes = [];

   for (const alimentador of alimentadores) {
      if (abortRef.current) break;

      // CORREGIDO: Usar config_tarjeta en lugar de card_design
      const configTarjeta = alimentador.config_tarjeta || {};
      const regSuperior = configTarjeta.superior?.registrador_id || alimentador.registrador_id;
      const regInferior = configTarjeta.inferior?.registrador_id;

      // Recopilar registradores únicos para este alimentador
      const registradoresUnicos = new Set();
      if (regSuperior) registradoresUnicos.add(regSuperior);
      if (regInferior) registradoresUnicos.add(regInferior);

      console.log(`[Precarga] Alimentador ${alimentador.nombre}:`, {
         regSuperior,
         regInferior,
         registradoresUnicos: Array.from(registradoresUnicos),
      });

      // Para cada registrador único, verificar si necesita precarga
      // Usamos zona "datos" para simplificar (ya no distinguimos superior/inferior en el cache)
      for (const regId of registradoresUnicos) {
         const cacheOK = await verificarCacheExistente(db, alimentador.id, regId, "datos");
         console.log(`[Precarga] Verificando cache para registrador ${regId}:`, { cacheOK });
         if (!cacheOK) {
            tareasPendientes.push({
               alimentadorId: alimentador.id,
               registradorId: regId,
               zona: "datos",
            });
         }
      }
   }

   console.log(`[Precarga] Total tareas pendientes:`, tareasPendientes.length, tareasPendientes);
   return tareasPendientes;
};

/**
 * Agrupa tareas por registrador para optimizar consultas
 * @param {Array} tareasPendientes
 * @returns {Object}
 */
export const agruparPorRegistrador = (tareasPendientes) => {
   const tareasPorRegistrador = {};

   for (const tarea of tareasPendientes) {
      if (!tareasPorRegistrador[tarea.registradorId]) {
         tareasPorRegistrador[tarea.registradorId] = [];
      }
      tareasPorRegistrador[tarea.registradorId].push(tarea);
   }

   return tareasPorRegistrador;
};

/**
 * Ejecuta la precarga de un puesto completo
 * @param {Object} params
 * @returns {Promise<{exito: boolean, datosDeBD: boolean}>}
 */
export const ejecutarPrecargaPuesto = async ({ db, alimentadores, onProgreso, abortRef }) => {
   if (!alimentadores || alimentadores.length === 0) {
      onProgreso(100);
      return { exito: true, datosDeBD: false };
   }

   const ahora = Date.now();
   const desde = ahora - HORAS_RETENCION_LOCAL * 60 * 60 * 1000;
   const hasta = ahora;
   let datosDeBD = false;

   const tareasPendientes = await recopilarTareasPuesto(db, alimentadores, abortRef);

   if (tareasPendientes.length === 0) {
      console.log("[Historial] Cache del puesto ya está actualizado");
      onProgreso(100);
      return { exito: true, datosDeBD: false };
   }

   console.log(`[Historial] Precargando puesto: ${tareasPendientes.length} tareas pendientes`);

   const tareasPorRegistrador = agruparPorRegistrador(tareasPendientes);
   const totalRegistradores = Object.keys(tareasPorRegistrador).length;
   let registradoresProcesados = 0;

   try {
      for (const [registradorId, tareas] of Object.entries(tareasPorRegistrador)) {
         if (abortRef.current) {
            console.log("[Historial] Precarga de puesto abortada");
            return { exito: false, datosDeBD };
         }

         const datosRemotos = await obtenerLecturasHistoricasPorRegistrador(
            registradorId,
            new Date(desde).toISOString(),
            new Date(hasta).toISOString()
         );

         if (datosRemotos && datosRemotos.length > 0 && db) {
            datosDeBD = true;

            for (const tarea of tareas) {
               await cachearLecturasRemotas(db, tarea.alimentadorId, tarea.registradorId, tarea.zona, datosRemotos);
            }
         }

         registradoresProcesados++;
         onProgreso(Math.round((registradoresProcesados / totalRegistradores) * 100));
      }

      onProgreso(100);
      console.log("[Historial] Precarga de puesto completada");
      return { exito: true, datosDeBD };
   } catch (err) {
      console.error("[Historial] Error en precarga de puesto:", err);
      return { exito: false, datosDeBD };
   }
};
