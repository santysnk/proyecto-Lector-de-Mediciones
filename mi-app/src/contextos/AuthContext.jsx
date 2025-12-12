// src/contextos/AuthContext.jsx
// Contexto de autenticación para toda la aplicación

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  iniciarSesion,
  cerrarSesion,
  obtenerSesion,
  obtenerUsuarioActual,
  registrarUsuario,
  recuperarContrasena,
  suscribirseACambiosAuth,
} from '../servicios/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar sesión al iniciar
  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const { session } = await obtenerSesion();
        if (session) {
          const { usuario: datosUsuario } = await obtenerUsuarioActual();
          setUsuario(datosUsuario);
        }
      } catch (err) {
        console.error('Error al cargar sesión:', err);
      } finally {
        setCargando(false);
      }
    };

    cargarSesion();

    // Suscribirse a cambios de auth
    const desuscribir = suscribirseACambiosAuth(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { usuario: datosUsuario } = await obtenerUsuarioActual();
        setUsuario(datosUsuario);
      } else if (event === 'SIGNED_OUT') {
        setUsuario(null);
      }
    });

    return () => desuscribir();
  }, []);

  // Función de login
  const login = async (email, password) => {
    setError(null);
    const { user, error: loginError } = await iniciarSesion(email, password);

    if (loginError) {
      setError(loginError);
      return { exito: false, error: loginError };
    }

    if (user) {
      const { usuario: datosUsuario } = await obtenerUsuarioActual();
      setUsuario(datosUsuario);
    }

    return { exito: true, error: null };
  };

  // Función de registro
  const registro = async (email, password, nombre) => {
    setError(null);
    const { user, error: registroError } = await registrarUsuario(email, password, nombre);

    if (registroError) {
      setError(registroError);
      return { exito: false, error: registroError };
    }

    return { exito: true, error: null, requiereConfirmacion: true };
  };

  // Función de logout
  const logout = async () => {
    const { error: logoutError } = await cerrarSesion();
    if (!logoutError) {
      setUsuario(null);
    }
    return { error: logoutError };
  };

  // Función para recuperar contraseña
  const recuperar = async (email) => {
    setError(null);
    const { error: recuperarError } = await recuperarContrasena(email);

    if (recuperarError) {
      setError(recuperarError);
      return { exito: false, error: recuperarError };
    }

    return { exito: true, error: null };
  };

  const valor = {
    usuario,
    cargando,
    error,
    estaAutenticado: !!usuario,
    login,
    logout,
    registro,
    recuperar,
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
