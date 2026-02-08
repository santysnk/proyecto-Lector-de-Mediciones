/**
 * Consultas a fuentes de datos (IndexedDB local y API remota)
 */

import { obtenerLecturasRango, cachearLecturasRemotas } from "../../utilidades/indexedDBHelper";
import { obtenerLecturasHistoricasPorRegistrador } from "@/servicios/apiService";
import { normalizarTimestamps } from "./utilidadesFuenteDatos";

/**
 * Consulta datos remotos y los cachea en IndexedDB
 * @param {IDBDatabase} db - Referencia a IndexedDB
 * @param {string} alimentadorId
 * @param {string} registradorId
 * @param {string} zona
 * @param {number} desde
 * @param {number} hasta
 * @returns {Promise<Array>} Datos remotos normalizados
 */
export const consultarYCachearRemoto = async (db, alimentadorId, registradorId, zona, desde, hasta) => {
   const datosRemotos = await obtenerLecturasHistoricasPorRegistrador(
      registradorId,
      new Date(desde).toISOString(),
      new Date(hasta).toISOString()
   );

   if (!datosRemotos || datosRemotos.length === 0) {
      return [];
   }

   // Cachear los datos remotos
   if (db) {
      try {
         const guardadas = await cachearLecturasRemotas(db, alimentadorId, registradorId, zona, datosRemotos);
         console.log("[Historial] CACHEO COMPLETADO:", {
            alimentadorId,
            registradorId,
            zona,
            lecturasRecibidas: datosRemotos.length,
            lecturasGuardadas: guardadas,
            rangoGuardado:
               datosRemotos.length > 0
                  ? {
                       desde: new Date(
                          Math.min(
                             ...datosRemotos.map((d) =>
                                typeof d.timestamp === "string" ? new Date(d.timestamp).getTime() : d.timestamp
                             )
                          )
                       ).toISOString(),
                       hasta: new Date(
                          Math.max(
                             ...datosRemotos.map((d) =>
                                typeof d.timestamp === "string" ? new Date(d.timestamp).getTime() : d.timestamp
                             )
                          )
                       ).toISOString(),
                    }
                  : null,
         });
      } catch (err) {
         console.error("[Historial] Error en cacheo:", err);
      }
   }

   return normalizarTimestamps(datosRemotos);
};

/**
 * Obtiene datos locales de IndexedDB
 * @param {IDBDatabase} db
 * @param {string} alimentadorId
 * @param {string} registradorId
 * @param {string} zona
 * @param {number} desde
 * @param {number} hasta
 * @returns {Promise<Array>}
 */
export const obtenerDatosLocales = async (db, alimentadorId, registradorId, zona, desde, hasta) => {
   if (!db) return [];
   return obtenerLecturasRango(db, alimentadorId, registradorId, zona, desde, hasta);
};
