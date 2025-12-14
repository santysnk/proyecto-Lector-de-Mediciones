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
// WORKSPACES
// ============================================

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

// ============================================
// PUESTOS
// ============================================

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

/**
 * Reordena los puestos
 */
export async function reordenarPuestos(workspaceId, ordenIds) {
  return fetchConAuth(`/api/workspaces/${workspaceId}/puestos/reordenar`, {
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
 * @param {number} puestoId - ID del puesto
 * @param {number[]} ordenIds - Array de IDs de alimentadores en el nuevo orden
 */
export async function reordenarAlimentadores(puestoId, ordenIds) {
  // El backend espera { ordenes: [{ id, orden }, ...] }
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

// ============================================
// AGENTES
// ============================================

/**
 * Obtiene el estado de vinculación del workspace con un agente
 */
export async function obtenerEstadoAgente(workspaceId) {
  return fetchConAuth(`/api/agentes/estado?workspaceId=${workspaceId}`);
}

/**
 * Solicita un código de vinculación para conectar el workspace con un agente
 */
export async function solicitarVinculacionAgente(workspaceId) {
  return fetchConAuth('/api/agentes/solicitar-vinculacion', {
    method: 'POST',
    body: JSON.stringify({ workspaceId }),
  });
}

/**
 * Desvincula el agente del workspace
 */
export async function desvincularAgente(workspaceId) {
  return fetchConAuth('/api/agentes/desvincular', {
    method: 'POST',
    body: JSON.stringify({ workspaceId }),
  });
}

/**
 * Rota la clave del agente (genera nueva, mantiene anterior por 24h)
 */
export async function rotarClaveAgente(workspaceId) {
  return fetchConAuth('/api/agentes/rotar-clave', {
    method: 'POST',
    body: JSON.stringify({ workspaceId }),
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

// ============================================
// REGISTRADORES
// ============================================

/**
 * Obtiene los registradores del workspace
 */
export async function obtenerRegistradores(workspaceId) {
  return fetchConAuth(`/api/registradores?workspaceId=${workspaceId}`);
}

/**
 * Crea un nuevo registrador
 */
export async function crearRegistrador(datos) {
  return fetchConAuth('/api/registradores', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * Actualiza un registrador
 */
export async function actualizarRegistrador(registradorId, datos) {
  return fetchConAuth(`/api/registradores/${registradorId}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

/**
 * Elimina un registrador
 */
export async function eliminarRegistrador(registradorId, workspaceId) {
  return fetchConAuth(`/api/registradores/${registradorId}?workspaceId=${workspaceId}`, {
    method: 'DELETE',
  });
}

/**
 * Activa o desactiva la medición de un registrador
 */
export async function toggleActivoRegistrador(registradorId, workspaceId, activo) {
  return fetchConAuth(`/api/registradores/${registradorId}/toggle-activo`, {
    method: 'POST',
    body: JSON.stringify({ workspaceId, activo }),
  });
}

/**
 * Prueba la conexión Modbus de un registrador
 */
export async function testConexionRegistrador(ip, puerto, indiceInicial, cantidadRegistros, unitId = 1) {
  return fetchConAuth('/api/registradores/test-conexion', {
    method: 'POST',
    body: JSON.stringify({ ip, puerto, indiceInicial, cantidadRegistros, unitId }),
  });
}

export default {
  // Workspaces
  obtenerWorkspaces,
  crearWorkspace,
  actualizarWorkspace,
  eliminarWorkspace,
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
  // Agentes
  obtenerEstadoAgente,
  solicitarVinculacionAgente,
  desvincularAgente,
  rotarClaveAgente,
  // Test conexión Modbus
  testConexionModbus,
  // Registradores
  obtenerRegistradores,
  crearRegistrador,
  actualizarRegistrador,
  eliminarRegistrador,
  toggleActivoRegistrador,
  testConexionRegistrador,
};
