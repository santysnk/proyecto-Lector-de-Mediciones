// servicios/api/workspaces.js
// API de workspaces

import { fetchConAuth } from './base';

/**
 * Obtiene todos los workspaces del usuario
 */
export async function obtenerWorkspaces() {
   return fetchConAuth('/api/workspaces');
}

/**
 * Crea un nuevo workspace
 */
export async function crearWorkspace(nombre, descripcion = '') {
   return fetchConAuth('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ nombre, descripcion }),
   });
}

/**
 * Actualiza un workspace
 */
export async function actualizarWorkspace(id, datos) {
   return fetchConAuth(`/api/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
   });
}

/**
 * Elimina un workspace
 */
export async function eliminarWorkspace(id) {
   return fetchConAuth(`/api/workspaces/${id}`, {
      method: 'DELETE',
   });
}
