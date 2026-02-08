/**
 * Precarga de datos históricos para un puesto completo
 * Recopila tareas de múltiples alimentadores y las ejecuta agrupadas por registrador
 */

import { cachearLecturasRemotas } from "../../utilidades/indexedDBHelper";
import { obtenerLecturasHistoricasPorRegistrador } from "@/servicios/apiService";
import { HORAS_RETENCION_LOCAL } from "../../constantes/historialConfig";
import { verificarCacheExistente } from "./precargaAlimentador";

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

      const configTarjeta = alimentador.config_tarjeta || {};
      const regSuperior = configTarjeta.superior?.registrador_id || alimentador.registrador_id;
      const regInferior = configTarjeta.inferior?.registrador_id;

      const registradoresUnicos = new Set();
      if (regSuperior) registradoresUnicos.add(regSuperior);
      if (regInferior) registradoresUnicos.add(regInferior);

      console.log(`[Precarga] Alimentador ${alimentador.nombre}:`, {
         regSuperior,
         regInferior,
         registradoresUnicos: Array.from(registradoresUnicos),
      });

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
