// servicios/api/alimentadores.js
// API de alimentadores

import { fetchConAuth } from './base';

/**
 * Obtiene los alimentadores de un puesto
 */
export async function obtenerAlimentadores(puestoId) {
   return fetchConAuth(`/api/puestos/${puestoId}/alimentadores`);
}

/**
 * Crea un nuevo alimentador
 */
export async function crearAlimentador(puestoId, datos) {
   return fetchConAuth(`/api/puestos/${puestoId}/alimentadores`, {
      method: 'POST',
      body: JSON.stringify(datos),
   });
}

/**
 * Actualiza un alimentador
 */
export async function actualizarAlimentadorAPI(alimentadorId, datos) {
   return fetchConAuth(`/api/alimentadores/${alimentadorId}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
   });
}

/**
 * Elimina un alimentador
 */
export async function eliminarAlimentadorAPI(alimentadorId) {
   return fetchConAuth(`/api/alimentadores/${alimentadorId}`, {
      method: 'DELETE',
   });
}

/**
 * Reordena los alimentadores de un puesto
 * @param {number} puestoId - ID del puesto
 * @param {number[]} ordenIds - Array de IDs de alimentadores en el nuevo orden
 */
export async function reordenarAlimentadores(puestoId, ordenIds) {
   const ordenes = ordenIds.map((id, index) => ({ id, orden: index }));
   return fetchConAuth(`/api/puestos/${puestoId}/alimentadores/reordenar`, {
      method: 'PUT',
      body: JSON.stringify({ ordenes }),
   });
}

/**
 * Mueve un alimentador a otro puesto
 */
export async function moverAlimentador(alimentadorId, nuevoPuestoId) {
   return fetchConAuth(`/api/alimentadores/${alimentadorId}/mover`, {
      method: 'PUT',
      body: JSON.stringify({ nuevo_puesto_id: nuevoPuestoId }),
   });
}
