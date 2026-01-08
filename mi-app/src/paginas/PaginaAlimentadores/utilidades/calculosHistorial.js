// utilidades/calculosHistorial.js
// Cálculos específicos para historial de lecturas

import { aplicarFormula } from "./calculosFormulas";
import { TITULOS_MEDICIONES } from "../constantes/titulosMediciones";

/**
 * Obtiene el título de una zona del card design
 * @param {Object} cardDesign - Configuración del diseño de tarjeta
 * @param {'superior'|'inferior'} zona - Zona a obtener
 * @returns {string} Título de la zona
 */
export const obtenerTituloZona = (cardDesign, zona) => {
   const config = cardDesign?.[zona];
   if (!config) return zona === "superior" ? "Superior" : "Inferior";
   if (config.tituloCustom?.trim()) return config.tituloCustom;
   if (config.tituloId && TITULOS_MEDICIONES[config.tituloId]) {
      return TITULOS_MEDICIONES[config.tituloId];
   }
   return zona === "superior" ? "Superior" : "Inferior";
};

/**
 * Calcula el promedio de valores de una zona basado en la lectura y configuración
 * @param {Object} lectura - Lectura con valores y timestamp
 * @param {Object} zonaConfig - Configuración de la zona (boxes habilitados)
 * @returns {number|null} Promedio calculado o null si no hay datos válidos
 */
export const calcularPromedioZona = (lectura, zonaConfig) => {
   if (!lectura?.valores || !Array.isArray(lectura.valores)) return null;
   if (!zonaConfig?.boxes) return null;

   const indiceInicial = lectura.indiceInicial ?? lectura.indice_inicial ?? 0;
   const valoresCalculados = [];

   zonaConfig.boxes.forEach((box) => {
      if (!box.enabled) return;
      const registro = box.registro ?? box.indice;
      if (registro === null || registro === undefined) return;
      const indiceEnArray = registro - indiceInicial;
      if (indiceEnArray < 0 || indiceEnArray >= lectura.valores.length) return;
      const valorCrudo = lectura.valores[indiceEnArray];
      if (valorCrudo === null || valorCrudo === undefined) return;
      const valorCalculado = aplicarFormula(box.formula || "x", valorCrudo);
      if (valorCalculado !== null && !Number.isNaN(valorCalculado) && valorCalculado !== 0) {
         valoresCalculados.push(valorCalculado);
      }
   });

   if (valoresCalculados.length === 0) return null;
   const suma = valoresCalculados.reduce((a, b) => a + b, 0);
   return suma / valoresCalculados.length;
};

/**
 * Calcula estadísticas de un conjunto de datos de gráfico
 * @param {Array<{x: Date, y: number}>} datosGrafico - Datos del gráfico
 * @returns {Object|null} Estadísticas (puntos, min, max, promedio) o null
 */
export const calcularEstadisticasGrafico = (datosGrafico) => {
   if (!datosGrafico || datosGrafico.length === 0) return null;

   const valores = datosGrafico.map((d) => d.y);
   const minVal = Math.min(...valores);
   const maxVal = Math.max(...valores);
   const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;

   const puntoMin = datosGrafico.find((d) => d.y === minVal);
   const puntoMax = datosGrafico.find((d) => d.y === maxVal);

   const formatearFecha = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const dia = d.getDate().toString().padStart(2, "0");
      const mes = (d.getMonth() + 1).toString().padStart(2, "0");
      const anio = d.getFullYear().toString().slice(-2);
      const hora = d.getHours().toString().padStart(2, "0");
      const min = d.getMinutes().toString().padStart(2, "0");
      return `${dia}/${mes}/${anio} - ${hora}:${min} hs.`;
   };

   return {
      puntos: datosGrafico.length,
      min: minVal.toFixed(2),
      minFecha: formatearFecha(puntoMin?.x),
      max: maxVal.toFixed(2),
      maxFecha: formatearFecha(puntoMax?.x),
      promedio: promedio.toFixed(2),
   };
};

/**
 * Calcula los límites para el slider de escala Y
 * @param {Array<{y: number}>} datosFiltrados - Datos filtrados del gráfico
 * @returns {{min: number, max: number, valorMaxDatos: number}} Límites de escala
 */
export const calcularLimitesEscalaY = (datosFiltrados) => {
   if (!datosFiltrados || datosFiltrados.length === 0) {
      return { min: 10, max: 100, valorMaxDatos: 0 };
   }

   const valores = datosFiltrados.map((d) => d.y);
   const valorMaxDatos = Math.max(...valores);
   const minRedondeado = Math.ceil(valorMaxDatos);
   const maxRedondeado = Math.ceil(valorMaxDatos * 2);

   return {
      min: Math.max(minRedondeado, 1),
      max: Math.max(maxRedondeado, minRedondeado + 10),
      valorMaxDatos,
   };
};

/**
 * Filtra datos por intervalo de tiempo
 * @param {Array<{x: Date, y: number}>} datosGrafico - Datos completos
 * @param {number} intervaloMinutos - Intervalo en minutos (0 = todos)
 * @returns {Array} Datos filtrados
 */
export const filtrarDatosPorIntervalo = (datosGrafico, intervaloMinutos) => {
   if (intervaloMinutos === 0 || !datosGrafico || datosGrafico.length === 0) {
      return datosGrafico;
   }

   if (datosGrafico.length === 1) {
      return datosGrafico;
   }

   const intervaloMs = intervaloMinutos * 60 * 1000;
   const resultado = [];
   let ultimoTimestamp = 0;

   for (const punto of datosGrafico) {
      const timestamp = new Date(punto.x).getTime();
      if (ultimoTimestamp === 0 || timestamp - ultimoTimestamp >= intervaloMs) {
         resultado.push(punto);
         ultimoTimestamp = timestamp;
      }
   }

   // Siempre incluir la última lectura
   const ultimaLectura = datosGrafico[datosGrafico.length - 1];
   const ultimaEnResultado = resultado[resultado.length - 1];
   if (ultimaLectura !== ultimaEnResultado) {
      resultado.push(ultimaLectura);
   }

   return resultado;
};

/**
 * Genera título del panel de datos basado en el período de los datos
 * @param {Array<{x: Date}>} datosGrafico - Datos del gráfico
 * @returns {string} Título del período
 */
export const generarTituloPeriodo = (datosGrafico) => {
   if (!datosGrafico || datosGrafico.length === 0) return "Sin datos";

   const primeraFecha = new Date(datosGrafico[0].x);
   const ultimaFecha = new Date(datosGrafico[datosGrafico.length - 1].x);

   const formatoFecha = { day: "2-digit", month: "2-digit", year: "2-digit" };
   const primeraStr = primeraFecha.toLocaleDateString("es-AR", formatoFecha);
   const ultimaStr = ultimaFecha.toLocaleDateString("es-AR", formatoFecha);

   if (primeraStr === ultimaStr) {
      return primeraStr;
   }
   return `${primeraStr} - ${ultimaStr}`;
};
