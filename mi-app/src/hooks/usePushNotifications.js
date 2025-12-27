// src/hooks/usePushNotifications.js
// Hook para gestionar push notifications en la app

import { useEffect, useRef, useCallback } from 'react';
import {
  esPlataformaNativa,
  registrarPushNotifications,
  desregistrarPushNotifications,
} from '../servicios/pushNotifications';
import { registrarTokenDispositivo } from '../servicios/apiService';

/**
 * Hook para inicializar y gestionar push notifications.
 * Solo funciona en plataformas nativas (Android/iOS).
 *
 * @param {Object} opciones - Opciones del hook
 * @param {boolean} opciones.habilitado - Si las notificaciones están habilitadas (default: true)
 * @param {Function} opciones.onNotificacion - Callback cuando llega una notificación en primer plano
 * @param {Function} opciones.onNotificacionTocada - Callback cuando el usuario toca la notificación
 * @returns {Object} { esNativo, tokenRegistrado }
 */
export function usePushNotifications({
  habilitado = true,
  onNotificacion = null,
  onNotificacionTocada = null,
} = {}) {
  const tokenRegistradoRef = useRef(false);
  const esNativo = esPlataformaNativa();

  // Callback para cuando se recibe el token FCM
  const handleTokenRecibido = useCallback(async (token) => {
    if (tokenRegistradoRef.current) {
      console.log('[Push Hook] Token ya registrado, ignorando');
      return;
    }

    try {
      console.log('[Push Hook] Registrando token en backend...');
      await registrarTokenDispositivo(token, 'android');
      tokenRegistradoRef.current = true;
      console.log('[Push Hook] Token registrado exitosamente');
    } catch (error) {
      console.error('[Push Hook] Error registrando token:', error);
    }
  }, []);

  // Callback para notificaciones en primer plano
  const handleNotificacion = useCallback((notificacion) => {
    console.log('[Push Hook] Notificación recibida:', notificacion);
    if (onNotificacion) {
      onNotificacion(notificacion);
    }
  }, [onNotificacion]);

  // Callback para cuando el usuario toca la notificación
  const handleNotificacionTocada = useCallback((datos) => {
    console.log('[Push Hook] Notificación tocada:', datos);
    if (onNotificacionTocada) {
      onNotificacionTocada(datos);
    }
  }, [onNotificacionTocada]);

  useEffect(() => {
    if (!esNativo || !habilitado) {
      console.log('[Push Hook] Saltando inicialización (nativo:', esNativo, ', habilitado:', habilitado, ')');
      return;
    }

    console.log('[Push Hook] Inicializando push notifications...');

    // Inicializar push notifications
    registrarPushNotifications(
      handleTokenRecibido,
      handleNotificacion,
      handleNotificacionTocada
    );

    // Cleanup al desmontar
    return () => {
      console.log('[Push Hook] Limpiando listeners...');
      desregistrarPushNotifications();
    };
  }, [esNativo, habilitado, handleTokenRecibido, handleNotificacion, handleNotificacionTocada]);

  return {
    esNativo,
    tokenRegistrado: tokenRegistradoRef.current,
  };
}

export default usePushNotifications;
