// hooks/historial/useVentanaHistorialLogica.js
// Hook que encapsula toda la lógica de estado y efectos de la ventana de historial
// REDISEÑADO: Usa config_tarjeta y soporta múltiples funcionalidades

import { useState, useEffect, useMemo, useCallback } from "react";
import { useHistorialLocal } from "./useHistorialLocal";
import { useFuncionalidadesRegistrador } from "../useFuncionalidadesRegistrador";
import { RANGOS_TIEMPO } from "../../constantes/historialConfig";
import { MODOS_HISTORIAL, DEFAULT_CONFIG_HISTORIAL } from "../../constantes/funcionalidadesRele";
import {
   calcularEstadisticasGrafico,
   calcularLimitesEscalaY,
   filtrarDatosPorIntervalo,
   generarTituloPeriodo,
} from "../../utilidades/calculosHistorial";
import { generarColoresBarras } from "../../utilidades/coloresGrafico";
import { generarOpcionesGrafico } from "../../utilidades/configGraficoHistorial";

/**
 * Extrae los registradores únicos de un alimentador desde config_tarjeta
 */
const obtenerRegistradoresUnicos = (alimentador) => {
   const registradores = new Map();
   const configTarjeta = alimentador?.config_tarjeta;

   if (!configTarjeta) {
      // Fallback: intentar con registrador_id del alimentador
      if (alimentador?.registrador_id) {
         registradores.set(alimentador.registrador_id, {
            id: alimentador.registrador_id,
            zona: null,
            funcionalidadMostrada: null,
         });
      }
      return Array.from(registradores.values());
   }

   // Registrador de zona superior
   if (configTarjeta.superior?.registrador_id) {
      registradores.set(configTarjeta.superior.registrador_id, {
         id: configTarjeta.superior.registrador_id,
         zona: "superior",
         funcionalidadMostrada: configTarjeta.superior.funcionalidad_id,
      });
   }

   // Registrador de zona inferior
   if (configTarjeta.inferior?.registrador_id) {
      const regId = configTarjeta.inferior.registrador_id;
      if (registradores.has(regId)) {
         // Mismo registrador en ambas zonas
         const existente = registradores.get(regId);
         existente.zonas = ["superior", "inferior"];
      } else {
         registradores.set(regId, {
            id: regId,
            zona: "inferior",
            funcionalidadMostrada: configTarjeta.inferior.funcionalidad_id,
         });
      }
   }

   // Fallback a registrador_id del alimentador si no hay config
   if (registradores.size === 0 && alimentador?.registrador_id) {
      registradores.set(alimentador.registrador_id, {
         id: alimentador.registrador_id,
         zona: null,
         funcionalidadMostrada: null,
      });
   }

   return Array.from(registradores.values());
};

/**
 * Aplica una fórmula al valor (usada para transformadores TI/TV)
 * @param {string} formula - Fórmula como "x * 200 / 1000"
 * @param {number} valor - Valor crudo
 * @returns {number|null} Valor transformado
 */
const aplicarFormula = (formula, valor) => {
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
 * La estructura de funcionalidad viene del backend:
 * {
 *   id: string,
 *   nombre: string,
 *   registros: [{ etiqueta: string, registro: number, transformadorId: string|null }]
 * }
 * @param {Object} lectura - Lectura con valores y índice inicial
 * @param {Object} funcionalidad - Funcionalidad con registros
 * @param {number} indiceMedicion - Índice del registro dentro de la funcionalidad
 * @param {Function} obtenerTransformadorPorId - Función para obtener transformador por ID
 * @returns {number|null} Valor calculado y transformado
 */
const calcularValorMedicion = (lectura, funcionalidad, indiceMedicion, obtenerTransformadorPorId) => {
   if (!lectura?.valores || !funcionalidad) return null;

   // Los registros vienen como array de objetos {etiqueta, registro, transformadorId}
   const registrosArray = funcionalidad.registros || [];
   const registroInfo = registrosArray[indiceMedicion];

   if (!registroInfo) return null;

   // Extraer el número de registro (puede venir como 'registro' o 'valor')
   const registroMedicion = registroInfo.registro ?? registroInfo.valor;

   if (registroMedicion === undefined || registroMedicion === null) return null;

   const indiceInicial = lectura.indiceInicial ?? lectura.indice_inicial ?? 0;

   // Calcular el índice en el array de valores
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
 * Obtiene la configuración de historial de una funcionalidad
 * @param {Object} funcionalidad - Funcionalidad con posible configHistorial
 * @returns {Object} Configuración de historial (con defaults si no existe)
 */
const obtenerConfigHistorial = (funcionalidad) => {
   if (!funcionalidad) return DEFAULT_CONFIG_HISTORIAL;
   return { ...DEFAULT_CONFIG_HISTORIAL, ...funcionalidad.configHistorial };
};

/**
 * Determina el modo efectivo de visualización basado en los flags de configHistorial
 * @param {Object} config - Configuración de historial con flags
 * @returns {string} Modo efectivo (INDIVIDUAL, COMBINAR_32BITS, BITS)
 */
const determinarModoEfectivo = (config) => {
   // Prioridad: timelineBits > combinar32bits > individual
   if (config.timelineBits) return MODOS_HISTORIAL.BITS;
   if (config.combinar32bits) return MODOS_HISTORIAL.COMBINAR_32BITS;
   return MODOS_HISTORIAL.INDIVIDUAL;
};

/**
 * Genera los tabs de medición según la configuración de la funcionalidad
 * @param {Object} funcionalidad - Funcionalidad con registros y configHistorial
 * @returns {Array<{indice: number, etiqueta: string}>} Tabs a mostrar
 */
const generarTabsMedicion = (funcionalidad) => {
   if (!funcionalidad) return [];

   const config = obtenerConfigHistorial(funcionalidad);
   const registros = funcionalidad.registros || [];
   const modoEfectivo = determinarModoEfectivo(config);

   // Timeline de bits: sin tabs (usa visualización especial)
   if (modoEfectivo === MODOS_HISTORIAL.BITS) {
      return [];
   }

   // Combinar 32 bits: un solo tab con el nombre de la funcionalidad
   if (modoEfectivo === MODOS_HISTORIAL.COMBINAR_32BITS) {
      return [{ indice: 0, etiqueta: funcionalidad.nombre }];
   }

   // Modo individual: un tab por cada registro
   const tabs = registros.map((reg, i) => ({
      indice: i,
      etiqueta: reg.etiqueta || `#${i + 1}`,
   }));

   // Si mostrarPromedio está activo, agregar tab de promedio al final
   if (config.mostrarPromedio && registros.length > 1) {
      tabs.push({ indice: registros.length, etiqueta: "Prom" });
   }

   return tabs;
};

/**
 * Calcula el valor según la configuración de la funcionalidad
 * @param {Object} lectura - Lectura con valores
 * @param {Object} funcionalidad - Funcionalidad con registros y configHistorial
 * @param {number} indiceMedicion - Índice del tab seleccionado
 * @param {Function} obtenerTransformadorPorId - Función para obtener transformador
 * @returns {number|null} Valor calculado
 */
const calcularValorSegunModo = (lectura, funcionalidad, indiceMedicion, obtenerTransformadorPorId) => {
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
      // Calcular promedio de todos los registros
      const valores = registros
         .map((_, i) => calcularValorMedicion(lectura, funcionalidad, i, obtenerTransformadorPorId))
         .filter((v) => v !== null && !Number.isNaN(v));
      if (valores.length === 0) return null;
      return valores.reduce((a, b) => a + b, 0) / valores.length;
   }

   // Valor individual normal
   return calcularValorMedicion(lectura, funcionalidad, indiceMedicion, obtenerTransformadorPorId);
};

/**
 * Hook que maneja toda la lógica de la ventana de historial
 * @param {Object} params - Parámetros
 * @param {Object} params.alimentadorInicial - Alimentador inicial
 * @param {boolean} params.minimizada - Si la ventana está minimizada
 * @param {Array} params.alimentadoresPuesto - Lista de alimentadores del puesto
 * @param {Function} params.obtenerTransformadorPorId - Función para obtener transformador por ID
 * @returns {Object} Estado y handlers de la ventana
 */
export const useVentanaHistorialLogica = ({
   alimentadorInicial,
   minimizada,
   alimentadoresPuesto,
   obtenerTransformadorPorId,
}) => {
   // Estado del alimentador actual
   const [alimentadorActual, setAlimentadorActual] = useState(alimentadorInicial);
   const alimentador = alimentadorActual;

   // Obtener registradores únicos del alimentador
   const registradoresUnicos = useMemo(
      () => obtenerRegistradoresUnicos(alimentador),
      [alimentador]
   );

   // Estado para el registrador seleccionado (si hay más de uno)
   const [registradorSeleccionadoId, setRegistradorSeleccionadoId] = useState(
      registradoresUnicos[0]?.id || null
   );

   // Cargar funcionalidades del registrador seleccionado
   const {
      funcionalidades,
      plantilla,
      cargando: cargandoFuncionalidades,
      error: errorFuncionalidades,
   } = useFuncionalidadesRegistrador(registradorSeleccionadoId);

   // Estado de la funcionalidad seleccionada
   const [funcionalidadSeleccionadaId, setFuncionalidadSeleccionadaId] = useState(null);

   // Estado del índice de medición dentro de la funcionalidad (para funcionalidades con cantidad > 1)
   const [indiceMedicionSeleccionado, setIndiceMedicionSeleccionado] = useState(0);

   // Hook de historial (IndexedDB + API)
   const {
      obtenerDatosGrafico,
      cargando: cargandoHistorial,
      error: errorHistorial,
      precargarPuesto,
      resetearPrecarga,
      precargaProgreso,
      precargaCompleta,
      precargando,
      datosDeBD,
      limpiarCacheCompleto,
      dbLista,
   } = useHistorialLocal();

   // Estados de UI
   const [rangoSeleccionado, setRangoSeleccionado] = useState("24h");
   const [fechaRangoDesde, setFechaRangoDesde] = useState(null);
   const [fechaRangoHasta, setFechaRangoHasta] = useState(null);
   const [datosGrafico, setDatosGrafico] = useState([]);
   const [fuenteDatos, setFuenteDatos] = useState(null);
   const [panelDatosAbierto, setPanelDatosAbierto] = useState(true);
   const [intervaloFiltro, setIntervaloFiltro] = useState(60);
   const [tipoGrafico, setTipoGrafico] = useState("line");
   const [modalInformeVisible, setModalInformeVisible] = useState(false);
   const [escalaYMax, setEscalaYMax] = useState(null);
   const [graficoVisible, setGraficoVisible] = useState(true);
   const [editandoEscalaY, setEditandoEscalaY] = useState(false);

   // Funcionalidad seleccionada
   const funcionalidadSeleccionada = useMemo(() => {
      if (!funcionalidadSeleccionadaId || !funcionalidades.length) return null;
      return funcionalidades.find((f) => f.id === funcionalidadSeleccionadaId);
   }, [funcionalidades, funcionalidadSeleccionadaId]);

   // Etiquetas de bits de la funcionalidad seleccionada
   const etiquetasBits = useMemo(() => {
      return funcionalidadSeleccionada?.etiquetasBits || {};
   }, [funcionalidadSeleccionada]);

   // Agrupar funcionalidades por categoría para el selector
   const funcionalidadesPorCategoria = useMemo(() => {
      const grupos = {};
      funcionalidades.forEach((f) => {
         const cat = f.categoria || "otros";
         if (!grupos[cat]) grupos[cat] = [];
         grupos[cat].push(f);
      });
      return grupos;
   }, [funcionalidades]);

   // Cantidad de registros/mediciones de la funcionalidad seleccionada
   const cantidadMediciones = useMemo(() => {
      return funcionalidadSeleccionada?.registros?.length || 1;
   }, [funcionalidadSeleccionada]);

   // Título de la medición seleccionada
   const tituloMedicionActual = useMemo(() => {
      if (!funcionalidadSeleccionada) return "Sin selección";

      const config = obtenerConfigHistorial(funcionalidadSeleccionada);
      const modoEfectivo = determinarModoEfectivo(config);
      const registros = funcionalidadSeleccionada.registros || [];

      // Modo 32 bits: mostrar solo el nombre de la funcionalidad
      if (modoEfectivo === MODOS_HISTORIAL.COMBINAR_32BITS) {
         return funcionalidadSeleccionada.nombre;
      }

      // Modo bits (timeline): mostrar nombre de funcionalidad
      if (modoEfectivo === MODOS_HISTORIAL.BITS) {
         return funcionalidadSeleccionada.nombre;
      }

      // Modo individual: verificar si hay tab de promedio seleccionado
      if (config.mostrarPromedio && indiceMedicionSeleccionado === registros.length) {
         return `${funcionalidadSeleccionada.nombre} - Promedio`;
      }

      // Si solo hay un registro, mostrar nombre de funcionalidad
      if (registros.length <= 1) {
         return funcionalidadSeleccionada.nombre;
      }

      // Múltiples registros: mostrar etiqueta del seleccionado
      const etiqueta =
         registros[indiceMedicionSeleccionado]?.etiqueta ||
         `Medición ${indiceMedicionSeleccionado + 1}`;
      return `${funcionalidadSeleccionada.nombre} - ${etiqueta}`;
   }, [funcionalidadSeleccionada, indiceMedicionSeleccionado]);

   // Auto-seleccionar primera funcionalidad cuando se cargan
   useEffect(() => {
      if (funcionalidades.length > 0 && !funcionalidadSeleccionadaId) {
         // Priorizar funcionalidades de mediciones
         const mediciones = funcionalidades.filter((f) => f.categoria === "mediciones");
         const primera = mediciones[0] || funcionalidades[0];
         setFuncionalidadSeleccionadaId(primera.id);
         // Si mostrarPromedio está activo, seleccionar tab de promedio por defecto
         const config = obtenerConfigHistorial(primera);
         const registros = primera?.registros || [];
         if (config.mostrarPromedio && registros.length > 1) {
            setIndiceMedicionSeleccionado(registros.length);
         } else {
            setIndiceMedicionSeleccionado(0);
         }
      }
   }, [funcionalidades, funcionalidadSeleccionadaId]);

   // Actualizar registrador seleccionado cuando cambia el alimentador
   useEffect(() => {
      if (registradoresUnicos.length > 0) {
         setRegistradorSeleccionadoId(registradoresUnicos[0].id);
         setFuncionalidadSeleccionadaId(null);
         setIndiceMedicionSeleccionado(0);
      }
   }, [registradoresUnicos]);

   // Cargar datos del gráfico
   const cargarDatos = useCallback(async () => {
      if (!alimentador?.id || !registradorSeleccionadoId || !funcionalidadSeleccionada) {
         setDatosGrafico([]);
         setFuenteDatos(null);
         return;
      }

      const ahora = Date.now();
      const rango = RANGOS_TIEMPO.find((r) => r.id === rangoSeleccionado);
      let desde, hasta;

      if (fechaRangoDesde && fechaRangoHasta) {
         const fDesde = new Date(fechaRangoDesde);
         const fHasta = new Date(fechaRangoHasta);
         desde = new Date(fDesde.getFullYear(), fDesde.getMonth(), fDesde.getDate(), 0, 0, 0, 0).getTime();
         hasta = new Date(fHasta.getFullYear(), fHasta.getMonth(), fHasta.getDate(), 23, 59, 59, 999).getTime();
      } else if (rango?.ms) {
         desde = ahora - rango.ms;
         hasta = ahora;
      } else {
         return;
      }

      const usandoRangoPredefinido = !fechaRangoDesde && !fechaRangoHasta;
      const forzarSoloLocal = precargaCompleta && usandoRangoPredefinido;

      // Zona genérica para el cache (ya no importa tanto la zona)
      const zonaCache = "datos";

      const { datos, fuente } = await obtenerDatosGrafico(
         alimentador.id,
         registradorSeleccionadoId,
         zonaCache,
         desde,
         hasta,
         forzarSoloLocal
      );

      // DEBUG: Ver qué datos llegaron
      console.log("[Historial] Datos recibidos:", {
         alimentadorId: alimentador.id,
         registradorId: registradorSeleccionadoId,
         zona: zonaCache,
         cantidad: datos.length,
         fuente,
         primerDato: datos[0],
         funcionalidad: {
            id: funcionalidadSeleccionada?.id,
            nombre: funcionalidadSeleccionada?.nombre,
            registros: funcionalidadSeleccionada?.registros,
         },
         indiceMedicion: indiceMedicionSeleccionado,
      });

      // Transformar datos: extraer el valor según el modo de la funcionalidad
      // y aplicar fórmulas de transformadores (TI/TV)
      const configHist = obtenerConfigHistorial(funcionalidadSeleccionada);
      const datosTransformados = datos
         .map((lectura, idx) => {
            const valor = calcularValorSegunModo(
               lectura,
               funcionalidadSeleccionada,
               indiceMedicionSeleccionado,
               obtenerTransformadorPorId
            );
            // DEBUG: Log de las primeras 3 lecturas
            if (idx < 3) {
               console.log(`[Historial] Lectura ${idx}:`, {
                  timestamp: lectura.timestamp,
                  valoresLength: lectura.valores?.length,
                  modo: configHist.modo,
                  indiceMedicion: indiceMedicionSeleccionado,
                  valorCalculado: valor,
               });
            }
            if (valor === null || Number.isNaN(valor)) return null;
            return { x: new Date(lectura.timestamp), y: valor };
         })
         .filter((d) => d !== null);

      console.log("[Historial] Datos transformados:", datosTransformados.length);

      setDatosGrafico(datosTransformados);
      setFuenteDatos(fuente);
   }, [
      alimentador,
      registradorSeleccionadoId,
      funcionalidadSeleccionada,
      indiceMedicionSeleccionado,
      rangoSeleccionado,
      fechaRangoDesde,
      fechaRangoHasta,
      obtenerDatosGrafico,
      precargaCompleta,
      obtenerTransformadorPorId,
   ]);

   // Iniciar precarga al montar
   useEffect(() => {
      if (!alimentador?.id || !dbLista || alimentadoresPuesto.length === 0) return;
      precargarPuesto(alimentadoresPuesto);
      return () => resetearPrecarga();
   }, [alimentador?.id, dbLista, alimentadoresPuesto, precargarPuesto, resetearPrecarga]);

   // Cargar datos cuando cambia selección
   useEffect(() => {
      if (!minimizada && (precargaCompleta || !precargando)) {
         cargarDatos();
      }
   }, [cargarDatos, minimizada, precargaCompleta, precargando]);

   // Datos filtrados por intervalo
   const datosFiltrados = useMemo(
      () => filtrarDatosPorIntervalo(datosGrafico, intervaloFiltro),
      [datosGrafico, intervaloFiltro]
   );

   // Límites para el slider de escala Y
   const limitesEscalaY = useMemo(
      () => calcularLimitesEscalaY(datosFiltrados),
      [datosFiltrados]
   );

   // Colores para gráfico de barras
   const coloresBarras = useMemo(
      () => generarColoresBarras(datosFiltrados),
      [datosFiltrados]
   );

   // Configuración ApexCharts
   const opcionesGrafico = useMemo(
      () =>
         generarOpcionesGrafico({
            alimentadorId: alimentador?.id,
            tipoGrafico,
            escalaYMax,
            coloresBarras,
         }),
      [alimentador?.id, tipoGrafico, escalaYMax, coloresBarras]
   );

   // Series para el gráfico
   const seriesGrafico = useMemo(
      () => [{ name: tituloMedicionActual, data: datosFiltrados }],
      [datosFiltrados, tituloMedicionActual]
   );

   // Fuente de datos efectiva
   const fuenteDatosEfectiva = useMemo(() => {
      if (fuenteDatos === "local" && datosDeBD) {
         return "remoto";
      }
      return fuenteDatos;
   }, [fuenteDatos, datosDeBD]);

   // Título del panel
   const tituloPanelDatos = useMemo(
      () => generarTituloPeriodo(datosGrafico),
      [datosGrafico]
   );

   // Estadísticas del gráfico
   const estadisticasGrafico = useMemo(
      () => calcularEstadisticasGrafico(datosGrafico),
      [datosGrafico]
   );

   // Handlers
   const handleRangoChange = useCallback((rangoId) => {
      setRangoSeleccionado(rangoId);
      setFechaRangoDesde(null);
      setFechaRangoHasta(null);
   }, []);

   const handleFechaRangoChange = useCallback((desde, hasta) => {
      setFechaRangoDesde(desde);
      setFechaRangoHasta(hasta);
   }, []);

   const handleTipoGraficoChange = useCallback((nuevoTipo) => {
      setTipoGrafico(nuevoTipo);
      setEscalaYMax(null);
   }, []);

   const handleEscalaYManual = useCallback(
      (valorInput) => {
         const valor = parseFloat(valorInput);
         if (isNaN(valor)) {
            setEditandoEscalaY(false);
            return;
         }
         const valorValidado = Math.min(Math.max(valor, limitesEscalaY.min), limitesEscalaY.max);
         setEscalaYMax(valorValidado);
         setEditandoEscalaY(false);
      },
      [limitesEscalaY]
   );

   const handleLimpiarCache = useCallback(async () => {
      if (window.confirm("¿Limpiar cache local?")) {
         await limpiarCacheCompleto();
         precargarPuesto(alimentadoresPuesto);
      }
   }, [limpiarCacheCompleto, precargarPuesto, alimentadoresPuesto]);

   const handleAlimentadorChange = useCallback(
      (nuevoId) => {
         const nuevoAlim = alimentadoresPuesto.find((a) => a.id === nuevoId);
         if (nuevoAlim) {
            setAlimentadorActual(nuevoAlim);
            setFuncionalidadSeleccionadaId(null);
            setIndiceMedicionSeleccionado(0);
         }
      },
      [alimentadoresPuesto]
   );

   const handleRegistradorChange = useCallback((nuevoId) => {
      setRegistradorSeleccionadoId(nuevoId);
      setFuncionalidadSeleccionadaId(null);
      setIndiceMedicionSeleccionado(0);
   }, []);

   const handleFuncionalidadChange = useCallback((funcId) => {
      setFuncionalidadSeleccionadaId(funcId);
      // Encontrar la funcionalidad para determinar el tab por defecto
      const func = funcionalidades.find((f) => f.id === funcId);
      const config = obtenerConfigHistorial(func);
      const registros = func?.registros || [];
      // Si mostrarPromedio está activo, seleccionar el tab de promedio por defecto
      if (config.mostrarPromedio && registros.length > 1) {
         setIndiceMedicionSeleccionado(registros.length); // Último tab es promedio
      } else {
         setIndiceMedicionSeleccionado(0);
      }
   }, [funcionalidades]);

   const handleMedicionChange = useCallback((indice) => {
      setIndiceMedicionSeleccionado(indice);
   }, []);

   return {
      // Alimentador
      alimentador,

      // Registradores (para selector si hay más de uno)
      registradoresUnicos,
      registradorSeleccionadoId,
      setRegistradorSeleccionadoId: handleRegistradorChange,

      // Funcionalidades
      funcionalidades,
      funcionalidadesPorCategoria,
      funcionalidadSeleccionada,
      funcionalidadSeleccionadaId,
      setFuncionalidadSeleccionadaId: handleFuncionalidadChange,
      cargandoFuncionalidades,
      plantilla,
      etiquetasBits,

      // Medición específica (para funcionalidades con registros > 1)
      indiceMedicionSeleccionado,
      setIndiceMedicionSeleccionado: handleMedicionChange,
      tituloMedicionActual,
      cantidadMediciones,

      // Modo de visualización (calculado desde flags de configHistorial)
      modoVisualizacion: determinarModoEfectivo(obtenerConfigHistorial(funcionalidadSeleccionada)),
      configHistorial: obtenerConfigHistorial(funcionalidadSeleccionada),
      tabsMedicion: generarTabsMedicion(funcionalidadSeleccionada),

      // Estados de carga
      cargando: cargandoHistorial || cargandoFuncionalidades,
      error: errorHistorial || errorFuncionalidades,
      precargando,
      precargaProgreso,
      precargaCompleta,

      // Datos del gráfico
      datosGrafico,
      datosFiltrados,
      fuenteDatosEfectiva,

      // UI states
      panelDatosAbierto,
      setPanelDatosAbierto,
      graficoVisible,
      setGraficoVisible,
      modalInformeVisible,
      setModalInformeVisible,
      editandoEscalaY,
      setEditandoEscalaY,

      // Rango de tiempo
      rangoSeleccionado,
      handleRangoChange,
      fechaRangoDesde,
      fechaRangoHasta,
      handleFechaRangoChange,

      // Tipo de gráfico
      tipoGrafico,
      handleTipoGraficoChange,

      // Configuración del gráfico
      opcionesGrafico,
      seriesGrafico,
      escalaYMax,
      setEscalaYMax,
      handleEscalaYManual,
      limitesEscalaY,

      // Filtro de intervalo
      intervaloFiltro,
      setIntervaloFiltro,

      // Panel de datos
      tituloPanelDatos,

      // Estadísticas
      estadisticasGrafico,

      // Acciones
      cargarDatos,
      handleLimpiarCache,
      handleAlimentadorChange,
   };
};

export default useVentanaHistorialLogica;
