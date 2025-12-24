/**
 * Hook para cálculos y transformaciones de datos del historial
 * Centraliza la lógica de cálculo de promedios y formateo de datos para gráficos
 */

import { useMemo, useCallback } from "react";
import { aplicarFormula } from "../utilidades/calculosFormulas";
import { TITULOS_MEDICIONES } from "../constantes/titulosMediciones";
import { COLORES_GRADIENTE } from "../constantes/historialConfig";

/**
 * Obtiene el título de una zona desde la configuración del diseño
 * @param {Object} cardDesign - Configuración del diseño de la tarjeta
 * @param {string} zona - "superior" o "inferior"
 * @returns {string} - Título de la zona
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
 * Calcula el promedio de valores para una zona específica
 * Aplica fórmulas configuradas y excluye valores nulos o cero
 * @param {Object} lectura - Datos de la lectura
 * @param {Object} zonaConfig - Configuración de la zona
 * @returns {number|null} - Promedio calculado o null si no hay datos válidos
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
 * Interpola color de verde a rojo basado en porcentaje (0-1)
 * 0 = verde, 0.5 = amarillo, 1 = rojo
 * @param {number} porcentaje - Valor entre 0 y 1
 * @returns {string} - Color en formato rgb()
 */
export const interpolarColorVerdeRojo = (porcentaje) => {
  const p = Math.max(0, Math.min(1, porcentaje));
  const { verde, amarillo, rojo } = COLORES_GRADIENTE;

  let r, g, b;

  if (p <= 0.5) {
    const t = p * 2;
    r = Math.round(verde.r + (amarillo.r - verde.r) * t);
    g = Math.round(verde.g + (amarillo.g - verde.g) * t);
    b = Math.round(verde.b + (amarillo.b - verde.b) * t);
  } else {
    const t = (p - 0.5) * 2;
    r = Math.round(amarillo.r + (rojo.r - amarillo.r) * t);
    g = Math.round(amarillo.g + (rojo.g - amarillo.g) * t);
    b = Math.round(amarillo.b + (rojo.b - amarillo.b) * t);
  }

  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Hook que proporciona funciones de cálculo y datos derivados para el historial
 * @param {Object} params - Parámetros del hook
 * @param {Object} params.cardDesign - Configuración del diseño de la tarjeta
 * @param {string} params.zonaSeleccionada - Zona actualmente seleccionada
 * @param {Array} params.datosGrafico - Datos del gráfico (array de {x, y})
 * @param {number} params.intervaloFiltro - Intervalo de filtrado en minutos (0 = sin filtro)
 * @returns {Object} - Funciones y datos calculados
 */
export const useCalculosHistorial = ({
  cardDesign,
  zonaSeleccionada,
  datosGrafico,
  intervaloFiltro = 0,
}) => {
  // Títulos de zonas
  const tituloSuperior = useMemo(
    () => obtenerTituloZona(cardDesign, "superior"),
    [cardDesign]
  );

  const tituloInferior = useMemo(
    () => obtenerTituloZona(cardDesign, "inferior"),
    [cardDesign]
  );

  const tituloZonaActual = zonaSeleccionada === "superior" ? tituloSuperior : tituloInferior;

  // Verificar si una zona está disponible (tiene boxes habilitados)
  const zonaDisponible = useCallback((zona) => {
    const config = cardDesign?.[zona];
    return config?.boxes?.some((b) => b.enabled);
  }, [cardDesign]);

  // Datos filtrados por intervalo
  const datosFiltrados = useMemo(() => {
    if (intervaloFiltro === 0 || datosGrafico.length === 0) {
      return datosGrafico;
    }

    const intervaloMs = intervaloFiltro * 60 * 1000;
    let ultimoTimestamp = 0;

    return datosGrafico.filter((punto) => {
      const timestamp = new Date(punto.x).getTime();
      if (ultimoTimestamp === 0 || timestamp - ultimoTimestamp >= intervaloMs) {
        ultimoTimestamp = timestamp;
        return true;
      }
      return false;
    });
  }, [datosGrafico, intervaloFiltro]);

  // Colores para gráfico de barras (verde a rojo con normalización min-max)
  const coloresBarras = useMemo(() => {
    if (datosFiltrados.length === 0) return [];
    const valores = datosFiltrados.map((d) => d.y);
    const minVal = Math.min(...valores);
    const maxVal = Math.max(...valores);
    const rango = maxVal - minVal;
    return valores.map((val) => {
      const porcentaje = rango > 0 ? (val - minVal) / rango : 0;
      return interpolarColorVerdeRojo(porcentaje);
    });
  }, [datosFiltrados]);

  // Datos formateados para la tabla del panel lateral
  const datosTabla = useMemo(() => {
    return datosFiltrados.map((punto) => {
      const fecha = new Date(punto.x);
      return {
        fecha: fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        hora: fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        medicion: Math.ceil(punto.y * 100) / 100,
      };
    });
  }, [datosFiltrados]);

  // Título del panel (período de fechas)
  const tituloPanelDatos = useMemo(() => {
    if (datosGrafico.length === 0) return "Sin datos";
    const primeraFecha = new Date(datosGrafico[0].x);
    const ultimaFecha = new Date(datosGrafico[datosGrafico.length - 1].x);

    const formatoFecha = { day: "2-digit", month: "2-digit", year: "2-digit" };
    const primeraStr = primeraFecha.toLocaleDateString("es-AR", formatoFecha);
    const ultimaStr = ultimaFecha.toLocaleDateString("es-AR", formatoFecha);

    if (primeraStr === ultimaStr) {
      return primeraStr;
    }
    return `${primeraStr} - ${ultimaStr}`;
  }, [datosGrafico]);

  // Estadísticas del gráfico
  const estadisticasGrafico = useMemo(() => {
    if (datosGrafico.length === 0) return null;
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
  }, [datosGrafico]);

  // Transformar datos crudos a formato de gráfico
  const transformarDatosParaGrafico = useCallback((datos, zonaConfig) => {
    return datos
      .map((lectura) => {
        const promedio = calcularPromedioZona(lectura, zonaConfig);
        if (promedio === null) return null;
        return { x: new Date(lectura.timestamp), y: promedio };
      })
      .filter((d) => d !== null);
  }, []);

  return {
    // Títulos
    tituloSuperior,
    tituloInferior,
    tituloZonaActual,
    tituloPanelDatos,
    // Funciones
    zonaDisponible,
    transformarDatosParaGrafico,
    // Datos calculados
    datosFiltrados,
    coloresBarras,
    datosTabla,
    estadisticasGrafico,
  };
};

export default useCalculosHistorial;
