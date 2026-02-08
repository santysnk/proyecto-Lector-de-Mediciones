/**
 * Utilidades para procesamiento de registros Modbus (pares High/Low de 32 bits)
 */

/**
 * Combina registros High/Low de 32 bits en un solo valor
 * @param {number} high - Parte alta (bits 16-31)
 * @param {number} low - Parte baja (bits 0-15)
 * @returns {number} Valor combinado de 32 bits
 */
export const combinarRegistros32Bits = (high, low) => {
   const valorHigh = high ?? 0;
   const valorLow = low ?? 0;
   return (valorHigh * 65536) + valorLow;
};

/**
 * Detecta si una etiqueta es parte de un par High/Low
 * @param {string} etiqueta - Etiqueta del registro
 * @returns {Object|null} { base, tipo } o null si no es par
 */
export const detectarParHighLow = (etiqueta) => {
   if (!etiqueta || typeof etiqueta !== "string") return null;

   const matchHigh = etiqueta.match(/^(.+)_High$/i);
   if (matchHigh) {
      return { base: matchHigh[1], tipo: "high" };
   }

   const matchLow = etiqueta.match(/^(.+)_Low$/i);
   if (matchLow) {
      return { base: matchLow[1], tipo: "low" };
   }

   return null;
};

/**
 * Obtiene el nombre completo de una medición según su base
 * @param {string} base - Base de la etiqueta (P, Q, S, FP, etc.)
 * @returns {string} Nombre completo con abreviatura
 */
export const obtenerNombreCompleto = (base) => {
   const nombres = {
      "P": "Potencia Activa (P)",
      "Q": "Potencia Reactiva (Q)",
      "S": "Potencia Aparente (S)",
      "FP": "Factor de Potencia (FP)",
      "PF": "Factor de Potencia (PF)",
      "E": "Energía (E)",
      "EA": "Energía Activa (EA)",
      "ER": "Energía Reactiva (ER)",
   };

   return nombres[base.toUpperCase()] || base;
};

/**
 * Agrupa registros High/Low y devuelve valores combinados
 * @param {Array} registros - Array de { etiqueta, registro, valor, transformadorId }
 * @returns {Array} Array procesado con valores combinados
 */
export const procesarRegistrosConPares = (registros) => {
   if (!Array.isArray(registros) || registros.length === 0) {
      return [];
   }

   const paresEncontrados = {};
   const registrosSinPar = [];

   // Primera pasada: identificar pares High/Low
   registros.forEach((reg) => {
      const par = detectarParHighLow(reg.etiqueta);

      if (par) {
         if (!paresEncontrados[par.base]) {
            paresEncontrados[par.base] = { high: null, low: null, transformadorId: null };
         }
         paresEncontrados[par.base][par.tipo] = reg;
         if (reg.transformadorId) {
            paresEncontrados[par.base].transformadorId = reg.transformadorId;
         }
      } else {
         registrosSinPar.push(reg);
      }
   });

   // Segunda pasada: combinar pares y crear resultado
   const resultado = [];

   // Agregar pares combinados
   Object.entries(paresEncontrados).forEach(([base, par]) => {
      const valorHigh = par.high?.valor ?? 0;
      const valorLow = par.low?.valor ?? 0;
      const valorCombinado = combinarRegistros32Bits(valorHigh, valorLow);

      resultado.push({
         etiqueta: obtenerNombreCompleto(base),
         etiquetaCorta: base,
         valor: valorCombinado,
         esParCombinado: true,
         registroHigh: par.high?.registro,
         registroLow: par.low?.registro,
         valorOriginalHigh: valorHigh,
         valorOriginalLow: valorLow,
         transformadorId: par.transformadorId,
      });
   });

   // Agregar registros sin par
   registrosSinPar.forEach((reg) => {
      resultado.push({
         etiqueta: reg.etiqueta,
         etiquetaCorta: reg.etiqueta,
         valor: reg.valor,
         esParCombinado: false,
         registro: reg.registro,
         transformadorId: reg.transformadorId,
      });
   });

   return resultado;
};

/**
 * Determina la categoría de una funcionalidad basándose en su nombre
 */
export const determinarCategoria = (nombreFunc) => {
   const nombre = (nombreFunc || "").toLowerCase();
   const esEstado = nombre.includes("estado") ||
      nombre.includes("led") ||
      nombre.includes("alarma") ||
      nombre.includes("interruptor") ||
      nombre.includes("ssr") ||
      nombre.includes("trip");

   return esEstado ? "estados" : "mediciones";
};
