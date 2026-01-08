// servicios/api/agentes.js
// API de agentes y registradores

import { fetchConAuth } from './base';

/**
 * Desvincula el agente del workspace (legacy)
 */
export async function desvincularAgente(workspaceId) {
   return fetchConAuth('/api/agentes/desvincular', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
   });
}

// --- Panel Admin (solo superadmin) ---

/**
 * Lista todos los agentes del sistema (solo superadmin)
 */
export async function listarTodosLosAgentes() {
   return fetchConAuth('/api/admin/agentes');
}

/**
 * Crea un nuevo agente (solo superadmin)
 */
export async function crearAgente(nombre, descripcion = '') {
   return fetchConAuth('/api/admin/agentes', {
      method: 'POST',
      body: JSON.stringify({ nombre, descripcion }),
   });
}

/**
 * Actualiza un agente (solo superadmin)
 */
export async function actualizarAgente(agenteId, datos) {
   return fetchConAuth(`/api/admin/agentes/${agenteId}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
   });
}

/**
 * Elimina un agente (solo superadmin)
 */
export async function eliminarAgente(agenteId) {
   return fetchConAuth(`/api/admin/agentes/${agenteId}`, {
      method: 'DELETE',
   });
}

/**
 * Rota la clave de un agente (solo superadmin)
 */
export async function rotarClaveAgentePorId(agenteId) {
   return fetchConAuth(`/api/admin/agentes/${agenteId}/rotar-clave`, {
      method: 'POST',
   });
}

// --- Agentes disponibles (admin+) ---

/**
 * Lista agentes disponibles para vincular (admin+)
 */
export async function listarAgentesDisponibles() {
   return fetchConAuth('/api/agentes/disponibles');
}

// --- Vinculación workspace-agente (N:M) ---

/**
 * Lista agentes vinculados a un workspace
 */
export async function listarAgentesWorkspace(workspaceId) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/agentes`);
}

/**
 * Vincula un agente a un workspace (admin+)
 */
export async function vincularAgenteWorkspace(workspaceId, agenteId) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/agentes`, {
      method: 'POST',
      body: JSON.stringify({ agenteId }),
   });
}

/**
 * Desvincula un agente de un workspace (admin+)
 */
export async function desvincularAgenteWorkspace(workspaceId, agenteId) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/agentes/${agenteId}`, {
      method: 'DELETE',
   });
}
