// servicios/api/registradores.js
// API de registradores

import { fetchConAuth } from './base';

// ============================================
// REGISTRADORES DE AGENTES (solo superadmin)
// ============================================

/**
 * Lista registradores de un agente específico
 */
export async function listarRegistradoresAgente(agenteId) {
   return fetchConAuth(`/api/agentes/${agenteId}/registradores`);
}

/**
 * Crea un registrador para un agente (solo superadmin)
 */
export async function crearRegistradorAgente(agenteId, datos) {
   return fetchConAuth(`/api/agentes/${agenteId}/registradores`, {
      method: 'POST',
      body: JSON.stringify(datos),
   });
}

/**
 * Actualiza un registrador de un agente (solo superadmin)
 */
export async function actualizarRegistradorAgente(agenteId, registradorId, datos) {
   return fetchConAuth(`/api/agentes/${agenteId}/registradores/${registradorId}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
   });
}

/**
 * Elimina un registrador de un agente (solo superadmin)
 */
export async function eliminarRegistradorAgente(agenteId, registradorId) {
   return fetchConAuth(`/api/agentes/${agenteId}/registradores/${registradorId}`, {
      method: 'DELETE',
   });
}

/**
 * Toggle activo de un registrador (solo superadmin)
 */
export async function toggleRegistradorAgente(agenteId, registradorId) {
   return fetchConAuth(`/api/agentes/${agenteId}/registradores/${registradorId}/toggle`, {
      method: 'POST',
   });
}

/**
 * Solicita un test de conexión para un registrador (ejecutado por el agente)
 * @param {string} agenteId - ID del agente que ejecutará el test
 * @param {object} datos - Datos del test: ip, puerto, unitId, indiceInicial, cantidadRegistros
 * @returns {Promise<{testId: string, mensaje: string, timeoutSegundos: number}>}
 */
export async function solicitarTestRegistrador(agenteId, datos) {
   return fetchConAuth(`/api/agentes/${agenteId}/test-registrador`, {
      method: 'POST',
      body: JSON.stringify(datos),
   });
}

/**
 * Consulta el estado/resultado de un test de registrador
 * @param {string} agenteId - ID del agente
 * @param {string} testId - ID del test
 * @returns {Promise<{estado: string, valores?: number[], error_mensaje?: string, tiempo_respuesta_ms?: number}>}
 */
export async function consultarTestRegistrador(agenteId, testId) {
   return fetchConAuth(`/api/agentes/${agenteId}/test-registrador/${testId}`);
}

/**
 * Solicita un test de lectura de coils (Modbus función 01)
 * @param {string} agenteId - ID del agente que ejecutará el test
 * @param {object} datos - Datos del test: ip, puerto, unitId, direccionCoil, cantidadBits
 * @returns {Promise<{testId: string, mensaje: string, timeoutSegundos: number}>}
 */
export async function solicitarTestCoils(agenteId, datos) {
   return fetchConAuth(`/api/agentes/${agenteId}/test-coils`, {
      method: 'POST',
      body: JSON.stringify(datos),
   });
}

// ============================================
// TEST DE CONEXIÓN MODBUS
// ============================================

/**
 * Prueba la conexión a un dispositivo Modbus y lee registros
 */
export async function testConexionModbus(ip, puerto, unitId = 1, indiceInicial = 0, cantRegistros = 10) {
   return fetchConAuth('/api/test-conexion', {
      method: 'POST',
      body: JSON.stringify({ ip, puerto, unitId, indiceInicial, cantRegistros }),
   });
}

