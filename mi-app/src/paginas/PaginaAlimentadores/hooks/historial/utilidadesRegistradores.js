/**
 * Utilidades para extracción de registradores únicos de alimentadores
 */

/**
 * Extrae los registradores únicos de un alimentador desde config_tarjeta
 */
export const obtenerRegistradoresUnicos = (alimentador) => {
   const registradores = new Map();
   const configTarjeta = alimentador?.config_tarjeta;

   if (!configTarjeta) {
      // Fallback: intentar con registrador_id del alimentador
      if (alimentador?.registrador_id) {
         registradores.set(alimentador.registrador_id, {
            id: alimentador.registrador_id,
            zona: null,
            funcionalidadMostrada: null,
         });
      }
      return Array.from(registradores.values());
   }

   // Registrador de zona superior
   if (configTarjeta.superior?.registrador_id) {
      registradores.set(configTarjeta.superior.registrador_id, {
         id: configTarjeta.superior.registrador_id,
         zona: "superior",
         funcionalidadMostrada: configTarjeta.superior.funcionalidad_id,
      });
   }

   // Registrador de zona inferior
   if (configTarjeta.inferior?.registrador_id) {
      const regId = configTarjeta.inferior.registrador_id;
      if (registradores.has(regId)) {
         // Mismo registrador en ambas zonas
         const existente = registradores.get(regId);
         existente.zonas = ["superior", "inferior"];
      } else {
         registradores.set(regId, {
            id: regId,
            zona: "inferior",
            funcionalidadMostrada: configTarjeta.inferior.funcionalidad_id,
         });
      }
   }

   // Fallback a registrador_id del alimentador si no hay config
   if (registradores.size === 0 && alimentador?.registrador_id) {
      registradores.set(alimentador.registrador_id, {
         id: alimentador.registrador_id,
         zona: null,
         funcionalidadMostrada: null,
      });
   }

   return Array.from(registradores.values());
};
