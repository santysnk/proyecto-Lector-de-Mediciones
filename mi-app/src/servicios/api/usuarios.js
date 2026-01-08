// servicios/api/usuarios.js
// API de usuarios y perfiles

import { fetchConAuth } from './base';

/**
 * Obtiene el perfil del usuario autenticado (incluye rol global)
 */
export async function obtenerPerfil() {
   return fetchConAuth('/api/usuarios/perfil');
}

/**
 * Crea el perfil del usuario después del registro en Supabase Auth
 * @param {string} nombre - Nombre del usuario
 */
export async function crearPerfilUsuario(nombre) {
   return fetchConAuth('/api/usuarios/perfil', {
      method: 'POST',
      body: JSON.stringify({ nombre }),
   });
}

/**
 * Actualiza el workspace por defecto del usuario
 * @param {string|null} workspaceId - ID del workspace o null para quitar el default
 */
export async function actualizarWorkspaceDefault(workspaceId) {
   return fetchConAuth('/api/usuarios/workspace-default', {
      method: 'PUT',
      body: JSON.stringify({ workspaceId }),
   });
}
