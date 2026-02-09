// hooks/historial/logicaVentanaHistorial.js
// Hook que encapsula toda la lógica de estado y efectos de la ventana de historial
// REDISEÑADO: Usa config_tarjeta y soporta múltiples funcionalidades

import { useState, useEffect, useMemo, useCallback } from "react";
import { useHistorialLocal } from "./useHistorialLocal";
import { useFuncionalidadesRegistrador } from "../useFuncionalidadesRegistrador";
import { RANGOS_TIEMPO, DIAS_RETENCION_LECTURAS } from "../../constantes/historialConfig";
import {
   calcularEstadisticasGrafico,
   calcularLimitesEscalaY,
   filtrarDatosPorIntervalo,
   generarTituloPeriodo,
} from "../../utilidades/calculosHistorial";
import { generarColoresBarras } from "../../utilidades/coloresGrafico";
import { generarOpcionesGrafico } from "../../utilidades/configGraficoHistorial";

import { obtenerRegistradoresUnicos } from "./utilidadesRegistradores";
import { obtenerConfigHistorial, determinarModoEfectivo, generarTabsMedicion } from "./configuracionModos";
import { calcularValorSegunModo } from "./calculosValoresHistorial";
import { MODOS_HISTORIAL } from "../../constantes/funcionalidadesRele";

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

   // Determinar si el rango incluye datos de lecturas_historico (resolución 15 min)
   const incluyeHistorico = useMemo(() => {
      const ahora = Date.now();
      const limiteHistorico = ahora - DIAS_RETENCION_LECTURAS * 24 * 60 * 60 * 1000;
      let desde;
      if (fechaRangoDesde) {
         desde = new Date(fechaRangoDesde).getTime();
      } else {
         const rango = RANGOS_TIEMPO.find((r) => r.id === rangoSeleccionado);
         desde = rango?.ms ? ahora - rango.ms : ahora;
      }
      return desde < limiteHistorico;
   }, [fechaRangoDesde, rangoSeleccionado]);

   // Auto-corregir intervalo cuando hay datos históricos y está en "Todos"
   useEffect(() => {
      if (incluyeHistorico && intervaloFiltro === 0) {
         setIntervaloFiltro(15);
      }
   }, [incluyeHistorico, intervaloFiltro]);

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
      incluyeHistorico,

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
