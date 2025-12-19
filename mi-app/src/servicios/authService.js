// src/servicios/authService.js
// Servicio de autenticación usando Supabase
// NOTA: Las operaciones de supabase.auth.* van directas a Supabase (correcto)
//       Los datos de usuario van por el backend (crearPerfilUsuario, obtenerPerfil)

import { supabase } from '../lib/supabase';
import { crearPerfilUsuario, obtenerPerfil } from './apiService';

/**
 * Iniciar sesión con email y contraseña
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, error}>}
 */
export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: traducirError(error.message) };
  }

  return { user: data.user, error: null };
}

/**
 * Registrar nuevo usuario
 * @param {string} email
 * @param {string} password
 * @param {string} nombre
 * @returns {Promise<{user, error}>}
 */
export async function registrarUsuario(email, password, nombre) {
  // 1. Crear usuario en Supabase Auth (directo - esto es correcto)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre: nombre,
      },
    },
  });

  if (authError) {
    return { user: null, error: traducirError(authError.message) };
  }

  // 2. Crear perfil en tabla usuarios VIA BACKEND
  // El backend usa SERVICE_ROLE y valida la creación
  if (authData.user && authData.session) {
    try {
      await crearPerfilUsuario(nombre);
    } catch (dbError) {
      console.error('Error al crear perfil en DB:', dbError);
      // No retornamos error porque el usuario ya se creó en Auth
      // El backend puede crear el perfil después en obtenerPerfil
    }
  }

  return { user: authData.user, error: null };
}

/**
 * Cerrar sesión
 * Limpia también los datos de localStorage para evitar que persistan entre usuarios
 * @returns {Promise<{error}>}
 */
export async function cerrarSesion() {
  // Limpiar datos de sesión del localStorage
  // Esto evita que al loguearse otro usuario se intente acceder a workspaces del anterior
  localStorage.removeItem('rw-configuracion-seleccionada');
  localStorage.removeItem('rw-puesto-seleccionado');
  localStorage.removeItem('rw-gap-tarjetas');
  localStorage.removeItem('rw-gap-filas');

  const { error } = await supabase.auth.signOut();
  return { error: error ? traducirError(error.message) : null };
}

/**
 * Obtener sesión actual
 * @returns {Promise<{session, user}>}
 */
export async function obtenerSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    session,
    user: session?.user || null,
  };
}

/**
 * Obtener datos del usuario actual desde nuestra tabla
 * Usa el backend para obtener el perfil (incluye rol global y permisos)
 * @returns {Promise<{usuario, error}>}
 */
export async function obtenerUsuarioActual() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { usuario: null, error: 'No hay sesión activa' };
  }

  try {
    // Obtener perfil VIA BACKEND
    // El backend crea el usuario si no existe (auto-provisioning)
    const perfil = await obtenerPerfil();
    return { usuario: perfil, error: null };
  } catch (error) {
    return { usuario: null, error: error.message };
  }
}

/**
 * Enviar email para recuperar contraseña
 * @param {string} email
 * @returns {Promise<{error}>}
 */
export async function recuperarContrasena(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/cambiar-contrasena`,
  });

  return { error: error ? traducirError(error.message) : null };
}

/**
 * Suscribirse a cambios de autenticación
 * @param {Function} callback
 * @returns {Function} función para desuscribirse
 */
export function suscribirseACambiosAuth(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );

  return () => subscription.unsubscribe();
}

/**
 * Traducir mensajes de error de Supabase al español
 * @param {string} mensaje
 * @returns {string}
 */
function traducirError(mensaje) {
  const traducciones = {
    'Invalid login credentials': 'Usuario o contraseña incorrectos',
    'Email not confirmed': 'Debes confirmar tu email antes de iniciar sesión',
    'User already registered': 'Este email ya está registrado',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Unable to validate email address: invalid format': 'El formato del email no es válido',
    'Email rate limit exceeded': 'Demasiados intentos. Intenta más tarde',
  };

  return traducciones[mensaje] || mensaje;
}
