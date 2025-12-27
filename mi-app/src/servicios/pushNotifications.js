// src/servicios/pushNotifications.js
// Servicio para gestionar Push Notifications con Capacitor + Firebase

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Verifica si estamos en plataforma nativa (Android/iOS)
 */
export const esPlataformaNativa = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Registra el dispositivo para recibir push notifications
 * @param {Function} onTokenRecibido - Callback cuando se obtiene el token FCM
 * @param {Function} onNotificacionRecibida - Callback cuando llega una notificación (app en primer plano)
 * @param {Function} onNotificacionTocada - Callback cuando el usuario toca la notificación
 * @returns {Promise<boolean>} true si se registró correctamente
 */
export const registrarPushNotifications = async (
  onTokenRecibido,
  onNotificacionRecibida = null,
  onNotificacionTocada = null
) => {
  if (!esPlataformaNativa()) {
    console.log('[Push] Solo disponible en app nativa, ignorando en web');
    return null;
  }

  try {
    // Verificar/solicitar permisos
    let permStatus = await PushNotifications.checkPermissions();
    console.log('[Push] Estado de permisos:', permStatus.receive);

    if (permStatus.receive === 'prompt') {
      console.log('[Push] Solicitando permisos...');
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('[Push] Permisos denegados por el usuario');
      return null;
    }

    // Registrar en FCM
    await PushNotifications.register();
    console.log('[Push] Registro en FCM iniciado');

    // Listener: Token recibido
    PushNotifications.addListener('registration', (token) => {
      console.log('[Push] Token FCM recibido:', token.value);
      if (onTokenRecibido) {
        onTokenRecibido(token.value);
      }
    });

    // Listener: Error de registro
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Error en registro:', error);
    });

    // Listener: Notificación recibida (app en primer plano)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Notificación recibida:', notification);
      if (onNotificacionRecibida) {
        onNotificacionRecibida({
          titulo: notification.title,
          cuerpo: notification.body,
          datos: notification.data,
        });
      }
    });

    // Listener: Usuario tocó la notificación
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Notificación tocada:', action);
      if (onNotificacionTocada) {
        onNotificacionTocada({
          actionId: action.actionId,
          datos: action.notification.data,
        });
      }
    });

    return true;
  } catch (error) {
    console.error('[Push] Error configurando push notifications:', error);
    return null;
  }
};

/**
 * Desregistra todos los listeners de push notifications
 * Llamar al desmontar el componente principal
 */
export const desregistrarPushNotifications = async () => {
  if (!esPlataformaNativa()) return;

  try {
    await PushNotifications.removeAllListeners();
    console.log('[Push] Listeners removidos');
  } catch (error) {
    console.error('[Push] Error removiendo listeners:', error);
  }
};

/**
 * Obtiene la lista de notificaciones entregadas (en el centro de notificaciones)
 */
export const obtenerNotificacionesPendientes = async () => {
  if (!esPlataformaNativa()) return [];

  try {
    const { notifications } = await PushNotifications.getDeliveredNotifications();
    return notifications;
  } catch (error) {
    console.error('[Push] Error obteniendo notificaciones:', error);
    return [];
  }
};

/**
 * Limpia todas las notificaciones del centro de notificaciones
 */
export const limpiarNotificaciones = async () => {
  if (!esPlataformaNativa()) return;

  try {
    await PushNotifications.removeAllDeliveredNotifications();
    console.log('[Push] Notificaciones limpiadas');
  } catch (error) {
    console.error('[Push] Error limpiando notificaciones:', error);
  }
};
