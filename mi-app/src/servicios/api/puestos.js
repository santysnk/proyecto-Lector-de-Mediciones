// servicios/api/puestos.js
// API de puestos

import { fetchConAuth } from './base';

/**
 * Obtiene los puestos de un workspace
 */
export async function obtenerPuestos(workspaceId) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/puestos`);
}

/**
 * Crea un nuevo puesto
 */
export async function crearPuesto(workspaceId, datos) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/puestos`, {
      method: 'POST',
      body: JSON.stringify(datos),
   });
}

/**
 * Actualiza un puesto
 */
export async function actualizarPuesto(puestoId, datos) {
   return fetchConAuth(`/api/puestos/${puestoId}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
   });
}

/**
 * Elimina un puesto
 */
export async function eliminarPuesto(puestoId) {
   return fetchConAuth(`/api/puestos/${puestoId}`, {
      method: 'DELETE',
   });
}

