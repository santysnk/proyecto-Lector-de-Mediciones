/**
 * Cálculos de valores de medición para historial
 * Incluye aplicación de fórmulas de transformadores (TI/TV)
 */

import { MODOS_HISTORIAL } from "../../constantes/funcionalidadesRele";
import { obtenerConfigHistorial, determinarModoEfectivo } from "./configuracionModos";

/**
 * Aplica una fórmula al valor (usada para transformadores TI/TV)
 * @param {string} formula - Fórmula como "x * 200 / 1000"
 * @param {number} valor - Valor crudo
 * @returns {number|null} Valor transformado
 */
export const aplicarFormula = (formula, valor) => {
   if (!formula || formula === "x") return valor;
   if (valor === null || valor === undefined) return null;
   try {
      const x = Number(valor);
      if (Number.isNaN(x)) return null;
      // eslint-disable-next-line no-new-func
      const resultado = new Function("x", `return ${formula}`)(x);
      return typeof resultado === "number" && !Number.isNaN(resultado) ? resultado : null;
   } catch {
      return valor;
   }
};

/**
 * Calcula el valor de una medición específica de una funcionalidad
 * @param {Object} lectura - Lectura con valores y índice inicial
 * @param {Object} funcionalidad - Funcionalidad con registros
 * @param {number} indiceMedicion - Índice del registro dentro de la funcionalidad
 * @param {Function} obtenerTransformadorPorId - Función para obtener transformador por ID
 * @returns {number|null} Valor calculado y transformado
 */
export const calcularValorMedicion = (lectura, funcionalidad, indiceMedicion, obtenerTransformadorPorId) => {
   if (!lectura?.valores || !funcionalidad) return null;

   const registrosArray = funcionalidad.registros || [];
   const registroInfo = registrosArray[indiceMedicion];

   if (!registroInfo) return null;

   const registroMedicion = registroInfo.registro ?? registroInfo.valor;

   if (registroMedicion === undefined || registroMedicion === null) return null;

   const indiceInicial = lectura.indiceInicial ?? lectura.indice_inicial ?? 0;
   const indiceEnArray = registroMedicion - indiceInicial;

   if (indiceEnArray < 0 || indiceEnArray >= lectura.valores.length) return null;

   let valor = lectura.valores[indiceEnArray];
   if (valor === null || valor === undefined) return null;

   // Aplicar transformador si hay transformadorId configurado
   const transformadorId = registroInfo.transformadorId;
   if (transformadorId && obtenerTransformadorPorId) {
      const transformador = obtenerTransformadorPorId(transformadorId);
      if (transformador?.formula) {
         valor = aplicarFormula(transformador.formula, valor);
      }
   }

   return valor;
};

/**
 * Calcula el valor según la configuración de la funcionalidad
 * @param {Object} lectura - Lectura con valores
 * @param {Object} funcionalidad - Funcionalidad con registros y configHistorial
 * @param {number} indiceMedicion - Índice del tab seleccionado
 * @param {Function} obtenerTransformadorPorId - Función para obtener transformador
 * @returns {number|null} Valor calculado
 */
export const calcularValorSegunModo = (lectura, funcionalidad, indiceMedicion, obtenerTransformadorPorId) => {
   if (!lectura?.valores || !funcionalidad) return null;

   const config = obtenerConfigHistorial(funcionalidad);
   const registros = funcionalidad.registros || [];
   const modoEfectivo = determinarModoEfectivo(config);

   // Modo bits: retornar valor crudo sin transformador (para procesamiento de bits)
   if (modoEfectivo === MODOS_HISTORIAL.BITS) {
      return calcularValorMedicion(lectura, funcionalidad, 0, null);
   }

   // Modo combinar 32 bits: combinar HIGH y LOW
   if (modoEfectivo === MODOS_HISTORIAL.COMBINAR_32BITS) {
      if (registros.length < 2) return null;
      const highVal = calcularValorMedicion(lectura, funcionalidad, 0, null);
      const lowVal = calcularValorMedicion(lectura, funcionalidad, 1, null);
      if (highVal === null || lowVal === null) return null;
      // Fórmula: (HIGH << 16) | LOW
      let valor = ((highVal & 0xFFFF) << 16) | (lowVal & 0xFFFF);
      // Si hay transformador en el primer registro, aplicarlo al resultado combinado
      const transformadorId = registros[0]?.transformadorId;
      if (transformadorId && obtenerTransformadorPorId) {
         const transformador = obtenerTransformadorPorId(transformadorId);
         if (transformador?.formula) {
            valor = aplicarFormula(transformador.formula, valor);
         }
      }
      return valor;
   }

   // Modo individual: verificar si es el tab de promedio
   if (config.mostrarPromedio && indiceMedicion === registros.length) {
      const valores = registros
         .map((_, i) => calcularValorMedicion(lectura, funcionalidad, i, obtenerTransformadorPorId))
         .filter((v) => v !== null && !Number.isNaN(v));
      if (valores.length === 0) return null;
      return valores.reduce((a, b) => a + b, 0) / valores.length;
   }

   // Valor individual normal
   return calcularValorMedicion(lectura, funcionalidad, indiceMedicion, obtenerTransformadorPorId);
};
