// contexto/contextoAlimentadoresUtils.js
// Funciones puras extraídas de ContextoAlimentadoresSupabase

import {
   obtenerDisenoTarjeta,
   calcularValoresLadoTarjeta,
   tieneConfiguracionValida,
   calcularValoresFuncionalidad,
} from "../utilidades/calculosMediciones";

export function aplicarPreferenciasAPuestos(puestos, preferenciasVisualesHook) {
   return puestos.map((puesto) => {
      const prefsPuesto = preferenciasVisualesHook.obtenerConfigPuesto(puesto.id);
      return {
         ...puesto,
         color: prefsPuesto?.color || puesto.color,
         bgColor: prefsPuesto?.bg_color || puesto.bgColor || puesto.bg_color,
         escala: prefsPuesto?.escala ?? puesto.escala,
         gapsVerticales: {
            ...(puesto.gapsVerticales || { "0": 40 }),
            ...(prefsPuesto?.gapsVerticales || {}),
         },
         alimentadores: (puesto.alimentadores || []).map((alim) => {
            const prefsAlim = preferenciasVisualesHook.obtenerConfigAlimentador(alim.id, puesto.id);
            return {
               ...alim,
               color: prefsAlim?.color || alim.color,
               escala: prefsAlim?.escala ?? alim.escala,
               gapHorizontal: prefsAlim?.gapHorizontal ?? alim.gapHorizontal ?? 10,
            };
         }),
      };
   });
}

export function calcularLecturasTarjetas(puestoSeleccionado, registrosEnVivo, obtenerTransformadorPorId) {
   if (!puestoSeleccionado) return {};
   const nuevo = {};

   puestoSeleccionado.alimentadores.forEach((alim) => {
      const regsDelAlim = registrosEnVivo[alim.id] || null;
      const configTarjeta = alim.config_tarjeta;
      const usarConfigTarjeta = configTarjeta &&
         (tieneConfiguracionValida(configTarjeta.superior) || tieneConfiguracionValida(configTarjeta.inferior));

      if (usarConfigTarjeta) {
         const calcularZona = (configZona) => {
            if (!tieneConfiguracionValida(configZona)) {
               return { titulo: "", boxes: [], oculto: configZona?.oculto || false };
            }
            return calcularValoresFuncionalidad(regsDelAlim, configZona, configZona.funcionalidad_datos, obtenerTransformadorPorId);
         };
         nuevo[alim.id] = {
            parteSuperior: calcularZona(configTarjeta.superior),
            parteInferior: calcularZona(configTarjeta.inferior),
         };
      } else {
         const cardDesignData = alim.card_design || alim.mapeoMediciones || {};
         const diseno = obtenerDisenoTarjeta(cardDesignData);
         nuevo[alim.id] = {
            parteSuperior: calcularValoresLadoTarjeta(regsDelAlim, diseno.superior),
            parteInferior: calcularValoresLadoTarjeta(regsDelAlim, diseno.inferior),
         };
      }
   });

   return nuevo;
}

export function extraerCambiosColorInvitado(puestosEditados, puestosBase, obtenerColorPuesto, obtenerBgColorPuesto) {
   const cambiosPorPuesto = [];
   for (const puesto of puestosEditados) {
      const puestoBase = puestosBase.find((p) => p.id === puesto.id);
      if (!puestoBase) continue;
      const colorActual = obtenerColorPuesto(puesto.id) || puestoBase.color;
      const bgColorActual = obtenerBgColorPuesto(puesto.id) || puestoBase.bgColor || puestoBase.bg_color;
      const cambios = {};
      if (puesto.color !== colorActual) cambios.color = puesto.color;
      if ((puesto.bgColor || puesto.bg_color) !== bgColorActual) cambios.bg_color = puesto.bgColor || puesto.bg_color;
      if (Object.keys(cambios).length > 0) cambiosPorPuesto.push({ id: puesto.id, cambios });
   }
   return cambiosPorPuesto;
}
