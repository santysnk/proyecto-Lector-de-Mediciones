// src/servicios/apiService.js
// Servicio para comunicación con el backend API

import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Obtiene el token de autenticación actual
 */
async function obtenerToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Realiza una petición al backend con autenticación
 */
async function fetchConAuth(endpoint, opciones = {}) {
  const token = await obtenerToken();

  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const respuesta = await fetch(`${API_URL}${endpoint}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...opciones.headers,
    },
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error en la petición');
  }

  return datos;
}

// ============================================
// CONFIGURACIONES
// ============================================

/**
 * Obtiene todas las configuraciones del usuario
 */
export async function obtenerConfiguraciones() {
  return fetchConAuth('/api/configuraciones');
}

/**
 * Crea una nueva configuración
 */
export async function crearConfiguracion(nombre, descripcion = '') {
  return fetchConAuth('/api/configuraciones', {
    method: 'POST',
    body: JSON.stringify({ nombre, descripcion }),
  });
}

/**
 * Actualiza una configuración
 */
export async function actualizarConfiguracion(id, datos) {
  return fetchConAuth(`/api/configuraciones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

/**
 * Elimina una configuración
 */
export async function eliminarConfiguracion(id) {
  return fetchConAuth(`/api/configuraciones/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// PUESTOS
// ============================================

/**
 * Obtiene los puestos de una configuración
 */
export async function obtenerPuestos(configuracionId) {
  return fetchConAuth(`/api/configuraciones/${configuracionId}/puestos`);
}

/**
 * Crea un nuevo puesto
 */
export async function crearPuesto(configuracionId, datos) {
  return fetchConAuth(`/api/configuraciones/${configuracionId}/puestos`, {
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

/**
 * Reordena los puestos
 */
export async function reordenarPuestos(configuracionId, ordenIds) {
  return fetchConAuth(`/api/configuraciones/${configuracionId}/puestos/reordenar`, {
    method: 'PUT',
    body: JSON.stringify({ orden: ordenIds }),
  });
}

// ============================================
// ALIMENTADORES
// ============================================

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
 */
export async function reordenarAlimentadores(puestoId, ordenIds) {
  return fetchConAuth(`/api/puestos/${puestoId}/alimentadores/reordenar`, {
    method: 'PUT',
    body: JSON.stringify({ orden: ordenIds }),
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

// ============================================
// LECTURAS
// ============================================

/**
 * Obtiene las últimas lecturas de un alimentador
 */
export async function obtenerUltimasLecturas(alimentadorId, tipo = null, limite = 1) {
  let url = `/api/alimentadores/${alimentadorId}/lecturas?limite=${limite}`;
  if (tipo) {
    url += `&tipo=${tipo}`;
  }
  return fetchConAuth(url);
}

/**
 * Obtiene lecturas históricas de un alimentador
 */
export async function obtenerLecturasHistoricas(alimentadorId, desde, hasta, tipo = null) {
  let url = `/api/alimentadores/${alimentadorId}/lecturas/historico?desde=${desde}&hasta=${hasta}`;
  if (tipo) {
    url += `&tipo=${tipo}`;
  }
  return fetchConAuth(url);
}

// ============================================
// PREFERENCIAS
// ============================================

/**
 * Obtiene las preferencias del usuario para una configuración
 */
export async function obtenerPreferencias(configuracionId) {
  return fetchConAuth(`/api/configuraciones/${configuracionId}/preferencias`);
}

/**
 * Guarda las preferencias del usuario
 */
export async function guardarPreferencias(configuracionId, preferencias) {
  return fetchConAuth(`/api/configuraciones/${configuracionId}/preferencias`, {
    method: 'POST',
    body: JSON.stringify(preferencias),
  });
}

// ============================================
// TEST DE CONEXIÓN MODBUS
// ============================================

/**
 * Prueba la conexión a un dispositivo Modbus y lee registros
 * @param {string} ip - Dirección IP del dispositivo
 * @param {number} puerto - Puerto Modbus (usualmente 502)
 * @param {number} unitId - ID de unidad Modbus (por defecto 1)
 * @param {number} indiceInicial - Primer registro a leer (por defecto 0)
 * @param {number} cantRegistros - Cantidad de registros a leer (por defecto 10)
 * @returns {Promise<{exito: boolean, mensaje?: string, error?: string, registros?: Array, tiempoMs?: number}>}
 */
export async function testConexionModbus(ip, puerto, unitId = 1, indiceInicial = 0, cantRegistros = 10) {
  return fetchConAuth('/api/test-conexion', {
    method: 'POST',
    body: JSON.stringify({ ip, puerto, unitId, indiceInicial, cantRegistros }),
  });
}

export default {
  // Configuraciones
  obtenerConfiguraciones,
  crearConfiguracion,
  actualizarConfiguracion,
  eliminarConfiguracion,
  // Puestos
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto,
  reordenarPuestos,
  // Alimentadores
  obtenerAlimentadores,
  crearAlimentador,
  actualizarAlimentadorAPI,
  eliminarAlimentadorAPI,
  reordenarAlimentadores,
  moverAlimentador,
  // Lecturas
  obtenerUltimasLecturas,
  obtenerLecturasHistoricas,
  // Preferencias
  obtenerPreferencias,
  guardarPreferencias,
  // Test conexión Modbus
  testConexionModbus,
};
