// src/servicios/api/transformadores.js
// Funciones API para transformadores (TI/TV)

import { fetchConAuth } from './base';

/**
 * Obtiene todos los transformadores del workspace
 * @param {string} workspaceId - ID del workspace
 * @returns {Promise<{transformadores: Array}>}
 */
export async function obtenerTransformadoresAPI(workspaceId) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/transformadores`);
}

/**
 * Crea un nuevo transformador
 * @param {string} workspaceId - ID del workspace
 * @param {Object} datos - {tipo, nombre, formula, descripcion}
 * @returns {Promise<{transformador: Object}>}
 */
export async function crearTransformadorAPI(workspaceId, datos) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/transformadores`, {
      method: 'POST',
      body: JSON.stringify(datos),
   });
}

/**
 * Actualiza un transformador existente
 * @param {string} transformadorId - ID del transformador
 * @param {Object} datos - {tipo?, nombre?, formula?, descripcion?}
 * @returns {Promise<{transformador: Object}>}
 */
export async function actualizarTransformadorAPI(transformadorId, datos) {
   return fetchConAuth(`/api/transformadores/${transformadorId}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
   });
}

/**
 * Elimina un transformador
 * @param {string} transformadorId - ID del transformador
 * @returns {Promise<{mensaje: string}>}
 */
export async function eliminarTransformadorAPI(transformadorId) {
   return fetchConAuth(`/api/transformadores/${transformadorId}`, {
      method: 'DELETE',
   });
}

/**
 * Migra transformadores desde localStorage
 * @param {string} workspaceId - ID del workspace
 * @param {Array} transformadores - Array de transformadores a migrar
 * @returns {Promise<{mensaje: string, transformadores: Array}>}
 */
export async function migrarTransformadoresAPI(workspaceId, transformadores) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/transformadores/migrar`, {
      method: 'POST',
      body: JSON.stringify({ transformadores }),
   });
}
