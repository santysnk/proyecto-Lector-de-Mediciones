/**
 * Lógica para determinar y obtener datos de diferentes fuentes
 * Separada del hook principal para mejor testabilidad y mantenibilidad
 */

import { obtenerLecturasRango, cachearLecturasRemotas } from "../../utilidades/indexedDBHelper";
import { obtenerLecturasHistoricasPorRegistrador } from "@/servicios/apiService";
import {
   HORAS_RETENCION_LOCAL,
   UMBRAL_COBERTURA_REMOTO,
   MARGEN_LIMITE_LOCAL_MS,
} from "../../constantes/historialConfig";

/**
 * Normaliza timestamps a milisegundos
 * @param {Array} datos - Datos con timestamps en cualquier formato
 * @returns {Array} Datos con timestamps normalizados
 */
export const normalizarTimestamps = (datos) =>
   datos.map((l) => ({
      ...l,
      timestamp: typeof l.timestamp === "string" ? new Date(l.timestamp).getTime() : l.timestamp,
      indiceInicial: l.indice_inicial ?? l.indiceInicial ?? 0,
   }));

/**
 * Combina y deduplica datos por timestamp
 * @param {Array} datosRemotos - Datos de fuente remota
 * @param {Array} datosLocales - Datos de fuente local
 * @returns {Array} Datos combinados y ordenados
 */
export const combinarYDeduplicar = (datosRemotos, datosLocales) => {
   const mapaTimestamps = new Map();

   for (const dato of datosRemotos) {
      mapaTimestamps.set(dato.timestamp, dato);
   }
   for (const dato of datosLocales) {
      mapaTimestamps.set(dato.timestamp, dato);
   }

   const datosCombinados = Array.from(mapaTimestamps.values());
   datosCombinados.sort((a, b) => a.timestamp - b.timestamp);
   return datosCombinados;
};

/**
 * Calcula el límite temporal para datos locales
 * @returns {number} Timestamp del límite local
 */
export const calcularLimiteLocal = () => {
   const ahora = Date.now();
   return ahora - HORAS_RETENCION_LOCAL * 60 * 60 * 1000 - MARGEN_LIMITE_LOCAL_MS;
};

/**
 * Verifica si un rango excede el período de retención local
 * @param {number} desde - Timestamp inicio
 * @param {number} hasta - Timestamp fin
 * @returns {boolean}
 */
export const rangoExcede48h = (desde, hasta) => {
   const rangoSolicitadoMs = hasta - desde;
   const rangoMaximoLocalMs = HORAS_RETENCION_LOCAL * 60 * 60 * 1000;
   return rangoSolicitadoMs > rangoMaximoLocalMs;
};

/**
 * Calcula el porcentaje de cobertura de datos locales
 * @param {Array} datosLocales - Datos locales encontrados
 * @param {number} desde - Timestamp inicio solicitado
 * @param {number} hasta - Timestamp fin solicitado
 * @returns {number} Porcentaje de cobertura (0-1)
 */
export const calcularCobertura = (datosLocales, desde, hasta) => {
   if (datosLocales.length === 0) return 0;

   const primerTimestamp = Math.min(...datosLocales.map((d) => d.timestamp));
   const rangoSolicitadoMs = hasta - desde;
   const rangoCubiertoMs = hasta - primerTimestamp;
   return rangoCubiertoMs / rangoSolicitadoMs;
};

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

/**
 * Determina la estrategia de obtención de datos según el rango
 * @param {number} desde
 * @param {number} hasta
 * @param {boolean} forzarSoloLocal
 * @returns {'soloLocal' | 'remoto' | 'hibrido'}
 */
export const determinarEstrategia = (desde, hasta, forzarSoloLocal) => {
   const limiteLocal = calcularLimiteLocal();
   const excede48h = rangoExcede48h(desde, hasta);

   // Modo precarga completa y rango dentro de 48h
   if (forzarSoloLocal && !excede48h) {
      return "soloLocal";
   }

   // Rango excede 48h
   if (excede48h) {
      return "remoto";
   }

   // Rango dentro del período local
   if (desde >= limiteLocal) {
      return "hibrido";
   }

   // Rango mixto o fuera de período local
   return "hibrido";
};

/**
 * Obtiene datos usando estrategia híbrida (local + remoto si necesario)
 * @param {Object} params
 * @returns {Promise<{datos: Array, fuente: string}>}
 */
export const obtenerDatosHibrido = async ({
   db,
   alimentadorId,
   registradorId,
   zona,
   desde,
   hasta,
}) => {
   const limiteLocal = calcularLimiteLocal();

   // Caso 1: Todo el rango está dentro del periodo local
   if (desde >= limiteLocal) {
      const datosLocales = await obtenerDatosLocales(db, alimentadorId, registradorId, zona, desde, hasta);

      console.log("[Historial] CONSULTA LOCAL:", {
         alimentadorId,
         registradorId,
         zona,
         rangoBuscado: {
            desde: new Date(desde).toISOString(),
            hasta: new Date(hasta).toISOString(),
            horasSolicitadas: (hasta - desde) / (1000 * 60 * 60),
         },
         datosEncontrados: datosLocales.length,
         rangoEncontrado:
            datosLocales.length > 0
               ? {
                    primero: new Date(Math.min(...datosLocales.map((d) => d.timestamp))).toISOString(),
                    ultimo: new Date(Math.max(...datosLocales.map((d) => d.timestamp))).toISOString(),
                 }
               : null,
      });

      // Verificar cobertura
      if (datosLocales.length > 0) {
         const porcentajeCubierto = calcularCobertura(datosLocales, desde, hasta);

         console.log("[Historial] COBERTURA:", {
            rangoSolicitadoHoras: (hasta - desde) / (1000 * 60 * 60),
            porcentaje: (porcentajeCubierto * 100).toFixed(1) + "%",
            decision: porcentajeCubierto < UMBRAL_COBERTURA_REMOTO ? "IR A REMOTO" : "USAR LOCAL",
         });

         // Si cobertura insuficiente, complementar con remoto
         if (porcentajeCubierto < UMBRAL_COBERTURA_REMOTO) {
            const datosRemotos = await consultarYCachearRemoto(
               db,
               alimentadorId,
               registradorId,
               zona,
               desde,
               hasta
            );
            const datosCombinados = combinarYDeduplicar(datosRemotos, datosLocales);
            return { datos: datosCombinados, fuente: "mixto" };
         }

         return { datos: datosLocales, fuente: "local" };
      }

      // Sin datos locales, ir a remoto
      const datosRemotos = await consultarYCachearRemoto(db, alimentadorId, registradorId, zona, desde, hasta);
      return { datos: datosRemotos, fuente: "remoto" };
   }

   // Caso 2: Todo el rango está fuera del periodo local
   if (hasta < limiteLocal) {
      const datosLocales = await obtenerDatosLocales(db, alimentadorId, registradorId, zona, desde, hasta);

      if (datosLocales.length > 0) {
         return { datos: datosLocales, fuente: "local" };
      }

      const datosRemotos = await consultarYCachearRemoto(db, alimentadorId, registradorId, zona, desde, hasta);
      return { datos: datosRemotos, fuente: "remoto" };
   }

   // Caso 3: Rango mixto
   const datosLocalesCompletos = await obtenerDatosLocales(db, alimentadorId, registradorId, zona, desde, hasta);

   if (datosLocalesCompletos.length > 0) {
      const primerTimestamp = Math.min(...datosLocalesCompletos.map((d) => d.timestamp));
      // Si el primer dato está cerca del inicio, asumir completo
      if (primerTimestamp <= desde + 5 * 60 * 1000) {
         return { datos: datosLocalesCompletos, fuente: "local" };
      }
   }

   // Combinar remoto (parte antigua) + local (parte reciente)
   const datosRemotosAntiguos = await consultarYCachearRemoto(
      db,
      alimentadorId,
      registradorId,
      zona,
      desde,
      limiteLocal
   );

   let datosLocalesRecientes = await obtenerDatosLocales(
      db,
      alimentadorId,
      registradorId,
      zona,
      limiteLocal,
      hasta
   );

   if (datosLocalesRecientes.length === 0) {
      datosLocalesRecientes = await consultarYCachearRemoto(
         db,
         alimentadorId,
         registradorId,
         zona,
         limiteLocal,
         hasta
      );
   }

   const datosCombinados = combinarYDeduplicar(datosRemotosAntiguos, datosLocalesRecientes);
   return { datos: datosCombinados, fuente: "mixto" };
};
