// hooks/rele/funcionalidadesPlantillaUtils.js
// Funciones puras extraídas de useFuncionalidadesPlantilla

import { DEFAULT_CONFIG_HISTORIAL } from "../../constantes/funcionalidadesRele";

export function convertirDesdeObjeto(funcionalidadesObj) {
   const funcsArray = Object.entries(funcionalidadesObj || {}).map(([id, data]) => {
      const transformadorIdGrupo = data.transformadorId || null;
      const registrosBase = data.registros || [{ etiqueta: "", valor: data.registro || 0 }];
      const registrosMigrados = registrosBase.map((reg) => ({
         ...reg,
         transformadorId: reg.transformadorId !== undefined ? reg.transformadorId : transformadorIdGrupo,
      }));
      return {
         id,
         nombre: data.nombre || id,
         habilitado: data.habilitado !== false,
         categoria: data.categoria || "mediciones",
         registros: registrosMigrados,
         orden: data.orden ?? Infinity,
         configHistorial: data.configHistorial || { ...DEFAULT_CONFIG_HISTORIAL },
         etiquetasBits: data.etiquetasBits || null,
      };
   });
   funcsArray.sort((a, b) => a.orden - b.orden);
   return funcsArray;
}

export function convertirParaGuardar(funcionalidades) {
   const funcParaGuardar = {};
   funcionalidades.forEach((func, index) => {
      if (func.habilitado) {
         const funcData = {
            nombre: func.nombre,
            categoria: func.categoria || "mediciones",
            habilitado: true,
            registros: func.registros,
            registro: func.registros[0]?.valor || 0,
            orden: index,
            configHistorial: func.configHistorial || DEFAULT_CONFIG_HISTORIAL,
         };
         if (func.etiquetasBits && Object.keys(func.etiquetasBits).length > 0) {
            funcData.etiquetasBits = func.etiquetasBits;
         }
         funcParaGuardar[func.id] = funcData;
      }
   });
   return funcParaGuardar;
}

export function contarFuncionalidadesHabilitadas(plantilla) {
   return Object.values(plantilla?.funcionalidades || {}).filter(
      (f) => f.habilitado !== false
   ).length;
}
