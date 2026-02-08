// hooks/mediciones/pollingLecturasUtils.js
// Funciones puras para usePollingLecturas

export function obtenerRegistradoresDeAlim(alim) {
   const registradores = [];
   const config = alim.config_tarjeta || alim.card_design;

   const regSuperior = config?.superior?.registrador_id;
   const regInferior = config?.inferior?.registrador_id;

   if (regSuperior && regInferior) {
      if (regSuperior === regInferior) {
         registradores.push({ zona: "superior", zonas: ["superior", "inferior"], id: regSuperior });
      } else {
         registradores.push({ zona: "superior", id: regSuperior });
         registradores.push({ zona: "inferior", id: regInferior });
      }
   } else if (regSuperior) {
      registradores.push({ zona: "superior", zonas: ["superior", "inferior"], id: regSuperior });
   } else if (regInferior) {
      registradores.push({ zona: "inferior", zonas: ["superior", "inferior"], id: regInferior });
   }

   if (registradores.length === 0 && alim.registrador_id) {
      registradores.push({ zona: "legacy", zonas: ["superior", "inferior"], id: alim.registrador_id });
   }

   return registradores;
}

export function transformarLecturaARegistros(lectura, registradorId) {
   if (!lectura.valores || !Array.isArray(lectura.valores)) return null;
   const indiceInicial = lectura.indice_inicial ?? 0;
   return lectura.valores.map((valor, idx) => ({
      index: idx,
      address: indiceInicial + idx,
      value: valor,
      registradorId,
   }));
}
