// hooks/preferencias/preferenciasUIUtils.js
// Helpers para usePreferenciasUI

export function leerMapaDeLocalStorage(clave) {
   const guardado = localStorage.getItem(clave);
   if (guardado) { try { return JSON.parse(guardado); } catch { /* ignore */ } }
   return {};
}

export function leerNumeroDeLocalStorage(clave, defecto) {
   const guardado = localStorage.getItem(clave);
   if (guardado) {
      const valor = parseFloat(guardado);
      if (!isNaN(valor)) return valor;
   }
   return defecto;
}

export function calcularEscalaEfectiva(alimId, puestoId, escalasPorTarjeta, escalasPorPuesto, escalaGlobal, escalaDefault) {
   const escalaIndividual = escalasPorTarjeta[alimId];
   if (escalaIndividual !== undefined) return escalaIndividual;
   if (puestoId) {
      const escalaPuesto = escalasPorPuesto[puestoId];
      if (escalaPuesto !== undefined) return escalaPuesto;
   }
   if (escalaGlobal !== escalaDefault) return escalaGlobal;
   return escalaDefault;
}
