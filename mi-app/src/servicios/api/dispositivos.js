// servicios/api/dispositivos.js
// API de dispositivos (Push Notifications)

import { fetchConAuth } from './base';

/**
 * Registra el token FCM del dispositivo para recibir push notifications
 * @param {string} fcmToken - Token FCM del dispositivo
 * @param {string} plataforma - Plataforma del dispositivo ('android' o 'ios')
 * @returns {Promise<Object>} Dispositivo registrado
 */
export async function registrarTokenDispositivo(fcmToken, plataforma = 'android') {
   return fetchConAuth('/api/dispositivos/registrar', {
      method: 'POST',
      body: JSON.stringify({ fcmToken, plataforma }),
   });
}

