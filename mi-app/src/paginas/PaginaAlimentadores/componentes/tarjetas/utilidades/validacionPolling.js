// utilidades/validacionPolling.js
// Utilidades para validar configuración de polling de alimentadores

/**
 * Verifica si un array de boxes tiene al menos uno habilitado con índice válido
 * @param {Array} boxes - Array de boxes a verificar
 * @returns {boolean}
 */
const tieneBoxHabilitado = (boxes) => {
   return boxes.some((box) => {
      if (!box.enabled) return false;
      const indice = box.indice !== undefined ? box.indice : box.registro;
      if (indice === null || indice === undefined || indice === "") {
         return false;
      }
      const numIndice = Number(indice);
      return Number.isFinite(numIndice) && numIndice >= 0;
   });
};

/**
 * Verifica si una zona de config_tarjeta tiene configuración válida
 * @param {Object} zona - Zona de config_tarjeta
 * @returns {boolean}
 */
const tieneConfigTarjetaValida = (zona) => {
   if (!zona || zona.oculto) return false;
   // Nueva estructura: requiere registrador_id y funcionalidad_id
   return !!(zona.registrador_id && zona.funcionalidad_id);
};

/**
 * Verifica si un alimentador tiene la configuración completa para hacer polling.
 * Soporta dos estructuras:
 * - config_tarjeta (nueva): usa funcionalidad_id
 * - card_design (legacy): usa boxes con índices
 *
 * Requisitos:
 * - Al menos una zona (superior o inferior) con registrador_id definido
 * - intervalo_consulta_ms definido y > 0
 * @param {Object} alim - Alimentador a verificar
 * @returns {boolean}
 */
export const puedeHacerPolling = (alim) => {
   // 1. Verificar intervalo_consulta_ms
   if (!alim.intervalo_consulta_ms || alim.intervalo_consulta_ms <= 0) {
      return false;
   }

   // 2. Verificar config_tarjeta (nueva estructura) primero
   if (alim.config_tarjeta) {
      const configTarjeta = alim.config_tarjeta;
      const superiorValido = tieneConfigTarjetaValida(configTarjeta.superior);
      const inferiorValido = tieneConfigTarjetaValida(configTarjeta.inferior);

      if (superiorValido || inferiorValido) {
         return true;
      }
   }

   // 3. Fallback a card_design (legacy)
   const cardDesign = alim.card_design || {};
   const superior = cardDesign.superior || {};
   const inferior = cardDesign.inferior || {};

   // 4. Verificar que haya al menos una zona con registrador_id
   const tieneRegistradorSuperior = !!superior.registrador_id;
   const tieneRegistradorInferior = !!inferior.registrador_id;
   const tieneRegistradorLegacy = !!alim.registrador_id;

   if (!tieneRegistradorSuperior && !tieneRegistradorInferior && !tieneRegistradorLegacy) {
      return false;
   }

   // 5. Verificar boxes habilitados (solo para legacy)
   const boxesSuperior = superior.boxes || [];
   const boxesInferior = inferior.boxes || [];

   const superiorValido = tieneRegistradorSuperior && tieneBoxHabilitado(boxesSuperior);
   const inferiorValido = tieneRegistradorInferior && tieneBoxHabilitado(boxesInferior);
   const legacyValido =
      tieneRegistradorLegacy &&
      (tieneBoxHabilitado(boxesSuperior) || tieneBoxHabilitado(boxesInferior));

   return superiorValido || inferiorValido || legacyValido;
};
