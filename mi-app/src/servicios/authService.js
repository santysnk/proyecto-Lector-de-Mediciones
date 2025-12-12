// src/servicios/authService.js
// Servicio de autenticación usando Supabase

import { supabase } from '../lib/supabase';

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
  // 1. Crear usuario en Supabase Auth
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

  // 2. Crear registro en nuestra tabla usuarios
  if (authData.user) {
    const { error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: email,
        nombre: nombre,
        password_hash: '', // Supabase Auth maneja la contraseña
        es_superadmin: false,
        activo: true,
      });

    if (dbError) {
      console.error('Error al crear usuario en DB:', dbError);
      // No retornamos error porque el usuario ya se creó en Auth
    }
  }

  return { user: authData.user, error: null };
}

/**
 * Cerrar sesión
 * @returns {Promise<{error}>}
 */
export async function cerrarSesion() {
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
 * @returns {Promise<{usuario, error}>}
 */
export async function obtenerUsuarioActual() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { usuario: null, error: 'No hay sesión activa' };
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return { usuario: null, error: error.message };
  }

  return { usuario: data, error: null };
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
