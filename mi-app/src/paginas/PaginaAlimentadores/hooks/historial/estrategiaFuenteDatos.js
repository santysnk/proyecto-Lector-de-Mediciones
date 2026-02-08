/**
 * Estrategia y orquestación para obtención híbrida de datos
 */

import { UMBRAL_COBERTURA_REMOTO } from "../../constantes/historialConfig";
import { calcularLimiteLocal, rangoExcede48h, combinarYDeduplicar, calcularCobertura } from "./utilidadesFuenteDatos";
import { consultarYCachearRemoto, obtenerDatosLocales } from "./consultasFuenteDatos";

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
