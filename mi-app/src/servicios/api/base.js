// servicios/api/base.js
// Funciones base para comunicación con el backend

import { supabase } from '../../lib/supabase';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Obtiene el token de autenticación actual
 */
export async function obtenerToken() {
   const { data: { session } } = await supabase.auth.getSession();
   return session?.access_token || null;
}

/**
 * Realiza una petición al backend con autenticación
 */
export async function fetchConAuth(endpoint, opciones = {}) {
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
