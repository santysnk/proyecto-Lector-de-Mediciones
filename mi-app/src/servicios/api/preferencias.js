// servicios/api/preferencias.js
// API de preferencias de usuario

import { fetchConAuth } from './base';

/**
 * Obtiene las preferencias del usuario para un workspace
 */
export async function obtenerPreferencias(workspaceId) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/preferencias`);
}

/**
 * Guarda las preferencias del usuario
 */
export async function guardarPreferencias(workspaceId, preferencias) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/preferencias`, {
      method: 'POST',
      body: JSON.stringify(preferencias),
   });
}
