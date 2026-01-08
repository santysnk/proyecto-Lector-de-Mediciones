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
 * Verifica si un alimentador tiene la configuración completa para hacer polling.
 * Requisitos:
 * - Al menos una zona (superior o inferior) con registrador_id definido
 * - intervalo_consulta_ms definido y > 0
 * - Al menos un box habilitado (enabled: true) con un índice válido
 * @param {Object} alim - Alimentador a verificar
 * @returns {boolean}
 */
export const puedeHacerPolling = (alim) => {
   // 1. Verificar intervalo_consulta_ms
   if (!alim.intervalo_consulta_ms || alim.intervalo_consulta_ms <= 0) {
      return false;
   }

   // 2. Verificar card_design y zonas
   const cardDesign = alim.card_design || {};
   const superior = cardDesign.superior || {};
   const inferior = cardDesign.inferior || {};

   // 3. Verificar que haya al menos una zona con registrador_id
   const tieneRegistradorSuperior = !!superior.registrador_id;
   const tieneRegistradorInferior = !!inferior.registrador_id;
   const tieneRegistradorLegacy = !!alim.registrador_id;

   if (!tieneRegistradorSuperior && !tieneRegistradorInferior && !tieneRegistradorLegacy) {
      return false;
   }

   // 4. Verificar boxes habilitados
   const boxesSuperior = superior.boxes || [];
   const boxesInferior = inferior.boxes || [];

   const superiorValido = tieneRegistradorSuperior && tieneBoxHabilitado(boxesSuperior);
   const inferiorValido = tieneRegistradorInferior && tieneBoxHabilitado(boxesInferior);
   const legacyValido =
      tieneRegistradorLegacy &&
      (tieneBoxHabilitado(boxesSuperior) || tieneBoxHabilitado(boxesInferior));

   return superiorValido || inferiorValido || legacyValido;
};
