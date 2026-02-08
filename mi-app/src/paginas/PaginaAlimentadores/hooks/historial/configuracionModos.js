/**
 * Configuración de historial y modos de visualización de funcionalidades
 */

import { MODOS_HISTORIAL, DEFAULT_CONFIG_HISTORIAL } from "../../constantes/funcionalidadesRele";

/**
 * Obtiene la configuración de historial de una funcionalidad
 * @param {Object} funcionalidad - Funcionalidad con posible configHistorial
 * @returns {Object} Configuración de historial (con defaults si no existe)
 */
export const obtenerConfigHistorial = (funcionalidad) => {
   if (!funcionalidad) return DEFAULT_CONFIG_HISTORIAL;
   return { ...DEFAULT_CONFIG_HISTORIAL, ...funcionalidad.configHistorial };
};

/**
 * Determina el modo efectivo de visualización basado en los flags de configHistorial
 * @param {Object} config - Configuración de historial con flags
 * @returns {string} Modo efectivo (INDIVIDUAL, COMBINAR_32BITS, BITS)
 */
export const determinarModoEfectivo = (config) => {
   // Prioridad: timelineBits > combinar32bits > individual
   if (config.timelineBits) return MODOS_HISTORIAL.BITS;
   if (config.combinar32bits) return MODOS_HISTORIAL.COMBINAR_32BITS;
   return MODOS_HISTORIAL.INDIVIDUAL;
};

/**
 * Genera los tabs de medición según la configuración de la funcionalidad
 * @param {Object} funcionalidad - Funcionalidad con registros y configHistorial
 * @returns {Array<{indice: number, etiqueta: string}>} Tabs a mostrar
 */
export const generarTabsMedicion = (funcionalidad) => {
   if (!funcionalidad) return [];

   const config = obtenerConfigHistorial(funcionalidad);
   const registros = funcionalidad.registros || [];
   const modoEfectivo = determinarModoEfectivo(config);

   // Timeline de bits: sin tabs (usa visualización especial)
   if (modoEfectivo === MODOS_HISTORIAL.BITS) {
      return [];
   }

   // Combinar 32 bits: un solo tab con el nombre de la funcionalidad
   if (modoEfectivo === MODOS_HISTORIAL.COMBINAR_32BITS) {
      return [{ indice: 0, etiqueta: funcionalidad.nombre }];
   }

   // Modo individual: un tab por cada registro
   const tabs = registros.map((reg, i) => ({
      indice: i,
      etiqueta: reg.etiqueta || `#${i + 1}`,
   }));

   // Si mostrarPromedio está activo, agregar tab de promedio al final
   if (config.mostrarPromedio && registros.length > 1) {
      tabs.push({ indice: registros.length, etiqueta: "Prom" });
   }

   return tabs;
};
