// src/servicios/api/plantillasDispositivo.js
// Funciones API para plantillas de dispositivo (relés y analizadores)

import { fetchConAuth } from './base';

/**
 * Obtiene todas las plantillas del workspace
 * @param {string} workspaceId - ID del workspace
 * @param {string} tipo - Tipo de dispositivo: 'rele' | 'analizador' (opcional)
 * @returns {Promise<{plantillas: Array}>}
 */
export async function obtenerPlantillasAPI(workspaceId, tipo = null) {
   const query = tipo ? `?tipo=${tipo}` : '';
   return fetchConAuth(`/api/workspaces/${workspaceId}/plantillas-dispositivo${query}`);
}

/**
 * Obtiene una plantilla específica
 * @param {string} plantillaId - ID de la plantilla
 * @returns {Promise<{plantilla: Object}>}
 */
export async function obtenerPlantillaAPI(plantillaId) {
   return fetchConAuth(`/api/plantillas-dispositivo/${plantillaId}`);
}

/**
 * Crea una nueva plantilla
 * @param {string} workspaceId - ID del workspace
 * @param {Object} datos - {tipo_dispositivo, nombre, descripcion, funcionalidades, etiquetas_bits, plantilla_etiquetas_id}
 * @returns {Promise<{plantilla: Object}>}
 */
export async function crearPlantillaAPI(workspaceId, datos) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/plantillas-dispositivo`, {
      method: 'POST',
      body: JSON.stringify(datos),
   });
}

/**
 * Actualiza una plantilla existente
 * @param {string} plantillaId - ID de la plantilla
 * @param {Object} datos - {nombre?, descripcion?, funcionalidades?, etiquetas_bits?, plantilla_etiquetas_id?}
 * @returns {Promise<{plantilla: Object}>}
 */
export async function actualizarPlantillaAPI(plantillaId, datos) {
   return fetchConAuth(`/api/plantillas-dispositivo/${plantillaId}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
   });
}

/**
 * Elimina una plantilla
 * @param {string} plantillaId - ID de la plantilla
 * @returns {Promise<{mensaje: string}>}
 */
export async function eliminarPlantillaAPI(plantillaId) {
   return fetchConAuth(`/api/plantillas-dispositivo/${plantillaId}`, {
      method: 'DELETE',
   });
}

/**
 * Migra plantillas desde localStorage
 * @param {string} workspaceId - ID del workspace
 * @param {Array} plantillas - Array de plantillas a migrar
 * @param {string} tipo_dispositivo - 'rele' | 'analizador'
 * @returns {Promise<{mensaje: string, plantillas: Array}>}
 */
export async function migrarPlantillasAPI(workspaceId, plantillas, tipo_dispositivo) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/plantillas-dispositivo/migrar`, {
      method: 'POST',
      body: JSON.stringify({ plantillas, tipo_dispositivo }),
   });
}

// ============================================
// CATÁLOGOS (solo lectura)
// ============================================

/**
 * Obtiene todos los modelos de dispositivo
 * @param {string} tipo - Tipo de dispositivo: 'rele' | 'analizador' (opcional)
 * @returns {Promise<{modelos: Array}>}
 */
export async function obtenerModelosAPI(tipo = null) {
   const query = tipo ? `?tipo=${tipo}` : '';
   return fetchConAuth(`/api/modelos-dispositivo${query}`);
}

/**
 * Obtiene un modelo específico con sus configuraciones
 * @param {string} modeloId - ID del modelo
 * @returns {Promise<{modelo: Object, configuraciones: Array}>}
 */
export async function obtenerModeloAPI(modeloId) {
   return fetchConAuth(`/api/modelos-dispositivo/${modeloId}`);
}

/**
 * Obtiene todas las configuraciones de protección
 * @param {string} modeloId - ID del modelo (opcional)
 * @returns {Promise<{configuraciones: Array}>}
 */
export async function obtenerConfiguracionesProteccionAPI(modeloId = null) {
   const query = modeloId ? `?modelo_id=${modeloId}` : '';
   return fetchConAuth(`/api/configuraciones-proteccion${query}`);
}

/**
 * Obtiene una configuración de protección específica
 * @param {string} configId - ID de la configuración
 * @returns {Promise<{configuracion: Object}>}
 */
export async function obtenerConfiguracionProteccionAPI(configId) {
   return fetchConAuth(`/api/configuraciones-proteccion/${configId}`);
}
