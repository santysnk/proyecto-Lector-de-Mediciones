// servicios/api/permisos.js
// API de permisos de workspace

import { fetchConAuth } from './base';

/**
 * Obtiene los usuarios con acceso a un workspace
 * @param {string} workspaceId - ID del workspace
 * @returns {Promise<Array>} Lista de permisos con datos de usuario y rol
 */
export async function obtenerPermisosWorkspace(workspaceId) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/permisos`);
}

/**
 * Invita/agrega un usuario a un workspace
 * @param {string} workspaceId - ID del workspace
 * @param {string} email - Email del usuario a invitar
 * @param {string} rol - Rol a asignar ('observador', 'operador', 'admin')
 * @returns {Promise<Object>} Permiso creado
 */
export async function agregarPermisoWorkspace(workspaceId, email, rol) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/permisos`, {
      method: 'POST',
      body: JSON.stringify({ email, rol }),
   });
}

/**
 * Actualiza el rol de un usuario en un workspace
 * @param {string} permisoId - ID del permiso a actualizar
 * @param {string} rol - Nuevo rol ('observador', 'operador', 'admin')
 * @returns {Promise<Object>} Permiso actualizado
 */
export async function actualizarPermisoWorkspace(permisoId, rol) {
   return fetchConAuth(`/api/permisos/${permisoId}`, {
      method: 'PUT',
      body: JSON.stringify({ rol }),
   });
}

/**
 * Elimina el acceso de un usuario a un workspace
 * @param {string} permisoId - ID del permiso a eliminar
 * @returns {Promise<Object>} Mensaje de confirmación
 */
export async function eliminarPermisoWorkspace(permisoId) {
   return fetchConAuth(`/api/permisos/${permisoId}`, {
      method: 'DELETE',
   });
}
