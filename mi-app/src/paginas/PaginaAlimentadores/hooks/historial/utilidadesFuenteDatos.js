/**
 * Utilidades puras para manejo de datos de fuentes híbridas
 * (sin dependencias de IndexedDB ni API)
 */

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
