// hooks/rele/configReleUtils.js
// Constantes y funciones puras para useConfigRele

export const CONFIG_INICIAL = {
   plantillaId: "",
   conexion: { ip: "", puerto: "", unitId: "" },
   registroInicial: "",
   cantidadRegistros: "",
   intervalo: 60,
   transformadorTIId: "",
   transformadorTVId: "",
   funcionalidadesActivas: {},
};

export function generarConfigDesdePlantilla(plantilla) {
   if (!plantilla) return {};
   const funcActivas = {};
   Object.entries(plantilla.funcionalidades || {}).forEach(([funcId, func], index) => {
      if (func.habilitado !== false) {
         funcActivas[funcId] = {
            nombre: func.nombre,
            habilitado: true,
            registros: func.registros || [{ etiqueta: "", valor: func.registro || 0 }],
            orden: func.orden ?? index,
         };
      }
   });
   return funcActivas;
}

export function migrarFuncionalidadesConOrden(funcActivas, plantilla) {
   if (!funcActivas || Object.keys(funcActivas).length === 0) return funcActivas;
   if (!plantilla?.funcionalidades) return funcActivas;

   const funcMigradas = {};
   Object.entries(funcActivas).forEach(([funcId, func]) => {
      const ordenPlantilla = plantilla.funcionalidades[funcId]?.orden;
      funcMigradas[funcId] = {
         ...func,
         orden: func.orden ?? ordenPlantilla ?? Infinity,
      };
   });
   return funcMigradas;
}
