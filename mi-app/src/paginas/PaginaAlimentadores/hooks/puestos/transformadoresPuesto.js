// hooks/puestos/transformadoresPuesto.js
// Funciones de transformación DB ↔ Frontend para puestos y alimentadores

import { COLORES_SISTEMA } from "../../constantes/colores";

/**
 * Transforma un puesto de la DB al formato del frontend (snake_case → camelCase)
 */
export function transformarPuestoDeDB(puesto) {
   let gapsVerticales = { "0": 40 };
   if (puesto.gaps_verticales) {
      if (typeof puesto.gaps_verticales === "string") {
         try {
            gapsVerticales = JSON.parse(puesto.gaps_verticales);
         } catch {
            gapsVerticales = { "0": 40 };
         }
      } else {
         gapsVerticales = puesto.gaps_verticales;
      }
   }

   return {
      ...puesto,
      bgColor: puesto.bg_color || "#e5e7eb",
      bg_color: puesto.bg_color || "#e5e7eb",
      gapsVerticales,
      escala: puesto.escala != null ? puesto.escala : null,
   };
}

/**
 * Transforma un alimentador de la DB al formato del frontend.
 * Genera objetos rele/analizador + campos legacy para compatibilidad.
 */
export function transformarAlimentadorDeDB(alim) {
   const releConfig = alim.config_rele || {};
   const analizadorConfig = alim.config_analizador || {};

   return {
      id: alim.id,
      nombre: alim.nombre,
      color: alim.color || COLORES_SISTEMA[0],
      tipoDispositivo: alim.tipo || "rele",
      gapHorizontal: alim.gap_horizontal != null ? alim.gap_horizontal : 0,
      escala: alim.escala != null ? alim.escala : null,
      registrador_id: alim.registrador_id || null,
      intervalo_consulta_ms: alim.intervalo_consulta_ms || 60000,
      card_design: alim.card_design || {},
      rele: {
         ip: releConfig.ip || "",
         puerto: releConfig.puerto != null ? releConfig.puerto : null,
         unitId: releConfig.unitId || 1,
         indiceInicial: releConfig.indiceInicial != null ? releConfig.indiceInicial : null,
         cantRegistros: releConfig.cantRegistros != null ? releConfig.cantRegistros : null,
      },
      periodoSegundos: releConfig.periodoLectura != null ? releConfig.periodoLectura : 60,
      analizador: {
         ip: analizadorConfig.ip || "",
         puerto: analizadorConfig.puerto != null ? analizadorConfig.puerto : null,
         unitId: analizadorConfig.unitId || 2,
         indiceInicial: analizadorConfig.indiceInicial != null ? analizadorConfig.indiceInicial : null,
         cantRegistros: analizadorConfig.cantRegistros != null ? analizadorConfig.cantRegistros : null,
         periodoSegundos: analizadorConfig.periodoLectura != null ? analizadorConfig.periodoLectura : 60,
      },
      // Campos legacy
      ip: releConfig.ip || "",
      puerto: releConfig.puerto != null ? releConfig.puerto : null,
      unitId: releConfig.unitId || 1,
      periodoLectura: releConfig.periodoLectura != null ? releConfig.periodoLectura : 60,
      indiceInicio: releConfig.indiceInicial != null ? releConfig.indiceInicial : null,
      indiceFin: releConfig.indiceInicial != null && releConfig.cantRegistros != null
         ? releConfig.indiceInicial + releConfig.cantRegistros : null,
      ipAnalizador: analizadorConfig.ip || "",
      puertoAnalizador: analizadorConfig.puerto != null ? analizadorConfig.puerto : null,
      unitIdAnalizador: analizadorConfig.unitId || 2,
      periodoLecturaAnalizador: analizadorConfig.periodoLectura != null ? analizadorConfig.periodoLectura : 60,
      indiceInicioAnalizador: analizadorConfig.indiceInicial != null ? analizadorConfig.indiceInicial : null,
      indiceFinAnalizador: analizadorConfig.indiceInicial != null && analizadorConfig.cantRegistros != null
         ? analizadorConfig.indiceInicial + analizadorConfig.cantRegistros : null,
      mapeoMediciones: alim.mapeo_mediciones || {},
      config_tarjeta: alim.config_tarjeta || null,
   };
}

/**
 * Transforma un alimentador del frontend al formato de la DB.
 * Soporta formato nuevo (registrador_id), formato con objetos rele/analizador, y formato plano legacy.
 */
export function transformarAlimentadorADB(alim) {
   const base = { nombre: alim.nombre, color: alim.color };

   // Formato nuevo: con registrador_id y card_design
   if (alim.registrador_id !== undefined || alim.card_design !== undefined || alim.intervalo_consulta_ms !== undefined || alim.config_tarjeta !== undefined) {
      return {
         ...base,
         registrador_id: alim.registrador_id || null,
         intervalo_consulta_ms: alim.intervalo_consulta_ms || 60000,
         card_design: alim.card_design || {},
         config_tarjeta: alim.config_tarjeta || null,
         gap_horizontal: alim.gapHorizontal != null ? alim.gapHorizontal : 0,
         mapeo_mediciones: alim.mapeoMediciones || {},
      };
   }

   // Formato con objetos rele/analizador anidados
   if (alim.rele || alim.analizador) {
      return {
         ...base,
         tipo: alim.tipoDispositivo || "rele",
         gap_horizontal: alim.gapHorizontal != null ? alim.gapHorizontal : 10,
         config_rele: alim.rele ? {
            ip: alim.rele.ip || "",
            puerto: alim.rele.puerto != null ? alim.rele.puerto : null,
            unitId: alim.rele.unitId || 1,
            periodoLectura: alim.periodoSegundos || 60,
            indiceInicial: alim.rele.indiceInicial != null ? alim.rele.indiceInicial : null,
            cantRegistros: alim.rele.cantRegistros != null ? alim.rele.cantRegistros : null,
         } : null,
         config_analizador: alim.analizador ? {
            ip: alim.analizador.ip || "",
            puerto: alim.analizador.puerto != null ? alim.analizador.puerto : null,
            unitId: alim.analizador.unitId || 2,
            periodoLectura: alim.analizador.periodoSegundos || 60,
            indiceInicial: alim.analizador.indiceInicial != null ? alim.analizador.indiceInicial : null,
            cantRegistros: alim.analizador.cantRegistros != null ? alim.analizador.cantRegistros : null,
         } : null,
         mapeo_mediciones: alim.mapeoMediciones || {},
      };
   }

   // Formato plano legacy
   return {
      ...base,
      tipo: alim.tipoDispositivo || "rele",
      gap_horizontal: alim.gapHorizontal != null ? alim.gapHorizontal : 10,
      config_rele: {
         ip: alim.ip || "",
         puerto: alim.puerto != null ? alim.puerto : null,
         unitId: alim.unitId || 1,
         periodoLectura: alim.periodoLectura || 60,
         indiceInicial: alim.indiceInicio != null ? alim.indiceInicio : null,
         cantRegistros: alim.indiceFin != null && alim.indiceInicio != null
            ? (alim.indiceFin - alim.indiceInicio) : null,
      },
      config_analizador: {
         ip: alim.ipAnalizador || "",
         puerto: alim.puertoAnalizador != null ? alim.puertoAnalizador : null,
         unitId: alim.unitIdAnalizador || 2,
         periodoLectura: alim.periodoLecturaAnalizador || 60,
         indiceInicial: alim.indiceInicioAnalizador != null ? alim.indiceInicioAnalizador : null,
         cantRegistros: alim.indiceFinAnalizador != null && alim.indiceInicioAnalizador != null
            ? (alim.indiceFinAnalizador - alim.indiceInicioAnalizador) : null,
      },
      mapeo_mediciones: alim.mapeoMediciones || {},
   };
}
