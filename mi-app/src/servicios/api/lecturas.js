// servicios/api/lecturas.js
// API de lecturas y mediciones

import { fetchConAuth } from './base';

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
