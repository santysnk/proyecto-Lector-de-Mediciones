// servicios/api/lecturas.js
// API de lecturas y mediciones

import { fetchConAuth } from './base';

/**
 * Obtiene las últimas lecturas de un alimentador
 */
export async function obtenerUltimasLecturas(alimentadorId, tipo = null, limite = 1) {
   let url = `/api/alimentadores/${alimentadorId}/lecturas?limite=${limite}`;
   if (tipo) {
      url += `&tipo=${tipo}`;
   }
   return fetchConAuth(url);
}

/**
 * Obtiene lecturas históricas de un alimentador
 */
export async function obtenerLecturasHistoricas(alimentadorId, desde, hasta, tipo = null) {
   let url = `/api/alimentadores/${alimentadorId}/lecturas/historico?desde=${desde}&hasta=${hasta}`;
   if (tipo) {
      url += `&tipo=${tipo}`;
   }
   return fetchConAuth(url);
}

/**
 * Obtiene las últimas lecturas de un registrador
 * @param {string} registradorId - ID del registrador
 * @param {number} limite - Cantidad de lecturas a obtener (default 1)
 */
export async function obtenerUltimasLecturasPorRegistrador(registradorId, limite = 1) {
   return fetchConAuth(`/api/registradores/${registradorId}/lecturas?limite=${limite}`);
}

/**
 * Obtiene lecturas históricas de un registrador en un rango de tiempo
 * @param {string} registradorId - ID del registrador
 * @param {string} desde - Fecha ISO de inicio del rango
 * @param {string} hasta - Fecha ISO de fin del rango
 * @returns {Promise<Array>} Array de lecturas con indice_inicial incluido
 */
export async function obtenerLecturasHistoricasPorRegistrador(registradorId, desde, hasta) {
   return fetchConAuth(`/api/registradores/${registradorId}/lecturas/historico?desde=${desde}&hasta=${hasta}`);
}
