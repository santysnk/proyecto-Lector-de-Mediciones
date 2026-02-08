// componentes/navegacion/barraNavegacionUtils.js
// Funciones puras extraídas de BarraNavegacion

export function puedeHacerPolling(alim) {
   if (!alim.intervalo_consulta_ms || alim.intervalo_consulta_ms <= 0) return false;

   // config_tarjeta (nueva estructura)
   if (alim.config_tarjeta) {
      const superiorConfig = alim.config_tarjeta.superior || {};
      const inferiorConfig = alim.config_tarjeta.inferior || {};
      const tieneRegistrador = !!superiorConfig.registrador_id || !!inferiorConfig.registrador_id;
      if (!tieneRegistrador) return false;
      const tieneFuncSuperior = superiorConfig.registrador_id && superiorConfig.funcionalidad_id;
      const tieneFuncInferior = inferiorConfig.registrador_id && inferiorConfig.funcionalidad_id;
      return tieneFuncSuperior || tieneFuncInferior;
   }

   // Fallback: card_design (estructura antigua)
   const cardDesign = alim.card_design || {};
   const superior = cardDesign.superior || {};
   const inferior = cardDesign.inferior || {};
   const tieneRegistrador = !!superior.registrador_id || !!inferior.registrador_id || !!alim.registrador_id;
   if (!tieneRegistrador) return false;
   const todosLosBoxes = [...(superior.boxes || []), ...(inferior.boxes || [])];
   return todosLosBoxes.some((box) => box.enabled && box.indice !== null && box.indice !== undefined && box.indice !== "");
}

export function calcularEstadoGlobal(puestoSeleccionado, estaPolling) {
   if (!puestoSeleccionado) return { alimentadoresConPolling: [], hayAlgunaCardDisponible: false, algunaCardMidiendo: false };
   const alimentadoresConPolling = (puestoSeleccionado.alimentadores || []).filter(puedeHacerPolling);
   const hayAlgunaCardDisponible = alimentadoresConPolling.length > 0;
   const algunaCardMidiendo = alimentadoresConPolling.some((alim) => estaPolling?.(alim.id));
   return { alimentadoresConPolling, hayAlgunaCardDisponible, algunaCardMidiendo };
}
