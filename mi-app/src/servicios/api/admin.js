// servicios/api/admin.js
// API de administración (solo superadmin)

import { fetchConAuth } from './base';

/**
 * Lista todos los usuarios del sistema (excepto superadmins)
 * @returns {Promise<Array>} Lista de usuarios con sus permisos de agentes
 */
export async function listarUsuariosAdmin() {
   return fetchConAuth('/api/admin/usuarios');
}

/**
 * Cambia el rol global de un usuario
 * @param {string} usuarioId - ID del usuario
 * @param {string} rolCodigo - Código del rol ('admin', 'operador', 'observador')
 * @returns {Promise<Object>} Usuario actualizado
 */
export async function cambiarRolUsuarioAdmin(usuarioId, rolCodigo) {
   return fetchConAuth(`/api/admin/usuarios/${usuarioId}/rol`, {
      method: 'PUT',
      body: JSON.stringify({ rolCodigo }),
   });
}

/**
 * Actualiza los agentes a los que un usuario tiene acceso
 * @param {string} usuarioId - ID del usuario
 * @param {boolean} accesoTotal - Si es true, tiene acceso a todos los agentes
 * @param {string[]} agentesIds - Array de IDs de agentes (ignorado si accesoTotal es true)
 * @returns {Promise<Object>} Permisos actualizados
 */
export async function actualizarAgentesUsuarioAdmin(usuarioId, accesoTotal, agentesIds = []) {
   return fetchConAuth(`/api/admin/usuarios/${usuarioId}/agentes`, {
      method: 'PUT',
      body: JSON.stringify({ accesoTotal, agentesIds }),
   });
}

/**
 * Lista todos los agentes disponibles para asignar permisos
 * @returns {Promise<Array>} Lista de agentes con id, nombre y activo
 */
export async function listarAgentesParaPermisos() {
   return fetchConAuth('/api/admin/agentes-disponibles');
}

/**
 * Obtiene detalles completos de un usuario (workspaces, puestos, agentes, invitados)
 * @param {string} usuarioId - ID del usuario
 * @returns {Promise<Object>} Detalles del usuario con workspaces propios e invitado
 */
export async function obtenerDetallesUsuarioAdmin(usuarioId) {
   return fetchConAuth(`/api/admin/usuarios/${usuarioId}/detalles`);
}
