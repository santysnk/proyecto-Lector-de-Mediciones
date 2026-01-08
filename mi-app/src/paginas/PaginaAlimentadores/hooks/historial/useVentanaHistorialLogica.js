// hooks/historial/useVentanaHistorialLogica.js
// Hook que encapsula toda la lógica de estado y efectos de la ventana de historial

import { useState, useEffect, useMemo, useCallback } from "react";
import { useHistorialLocal } from "./useHistorialLocal";
import { RANGOS_TIEMPO } from "../../constantes/historialConfig";
import {
   obtenerTituloZona,
   calcularPromedioZona,
   calcularEstadisticasGrafico,
   calcularLimitesEscalaY,
   filtrarDatosPorIntervalo,
   generarTituloPeriodo,
} from "../../utilidades/calculosHistorial";
import { generarColoresBarras } from "../../utilidades/coloresGrafico";
import { generarOpcionesGrafico } from "../../utilidades/configGraficoHistorial";

/**
 * Hook que maneja toda la lógica de la ventana de historial
 * @param {Object} params - Parámetros
 * @param {Object} params.alimentadorInicial - Alimentador inicial
 * @param {Object} params.cardDesignInicial - Card design inicial
 * @param {boolean} params.minimizada - Si la ventana está minimizada
 * @param {Array} params.alimentadoresPuesto - Lista de alimentadores del puesto
 * @returns {Object} Estado y handlers de la ventana
 */
export const useVentanaHistorialLogica = ({
   alimentadorInicial,
   cardDesignInicial,
   minimizada,
   alimentadoresPuesto,
}) => {
   // Estado local para permitir cambiar de alimentador sin cerrar el modal
   const [alimentadorActual, setAlimentadorActual] = useState(alimentadorInicial);
   const [cardDesignActual, setCardDesignActual] = useState(cardDesignInicial);

   // Alias para compatibilidad
   const alimentador = alimentadorActual;
   const cardDesign = cardDesignActual;

   // Hook de historial
   const {
      obtenerDatosGrafico,
      cargando,
      error,
      precargarPuesto,
      resetearPrecarga,
      precargaProgreso,
      precargaCompleta,
      precargando,
      datosDeBD,
      limpiarCacheCompleto,
      dbLista,
   } = useHistorialLocal();

   // Estados del selector
   const [rangoSeleccionado, setRangoSeleccionado] = useState("24h");
   const [fechaRangoDesde, setFechaRangoDesde] = useState(null);
   const [fechaRangoHasta, setFechaRangoHasta] = useState(null);
   const [zonaSeleccionada, setZonaSeleccionada] = useState("superior");
   const [datosGrafico, setDatosGrafico] = useState([]);
   const [fuenteDatos, setFuenteDatos] = useState(null);
   const [panelDatosAbierto, setPanelDatosAbierto] = useState(true);
   const [intervaloFiltro, setIntervaloFiltro] = useState(60);
   const [tipoGrafico, setTipoGrafico] = useState("line");
   const [modalInformeVisible, setModalInformeVisible] = useState(false);
   const [escalaYMax, setEscalaYMax] = useState(null);
   const [graficoVisible, setGraficoVisible] = useState(true);
   const [editandoEscalaY, setEditandoEscalaY] = useState(false);

   // Títulos de zonas
   const tituloSuperior = useMemo(() => obtenerTituloZona(cardDesign, "superior"), [cardDesign]);
   const tituloInferior = useMemo(() => obtenerTituloZona(cardDesign, "inferior"), [cardDesign]);
   const tituloZonaActual = zonaSeleccionada === "superior" ? tituloSuperior : tituloInferior;

   const zonaDisponible = useCallback(
      (zona) => {
         const config = cardDesign?.[zona];
         return config?.boxes?.some((b) => b.enabled);
      },
      [cardDesign]
   );

   const obtenerRegistradorZona = useCallback(
      (zona) => {
         const regIdZona = cardDesign?.[zona]?.registrador_id;
         if (regIdZona) return regIdZona;
         return alimentador?.registrador_id || null;
      },
      [cardDesign, alimentador]
   );

   // Cargar datos
   const cargarDatos = useCallback(async () => {
      if (!alimentador?.id) return;
      const registradorId = obtenerRegistradorZona(zonaSeleccionada);
      if (!registradorId) {
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
      const { datos, fuente } = await obtenerDatosGrafico(
         alimentador.id,
         registradorId,
         zonaSeleccionada,
         desde,
         hasta,
         forzarSoloLocal
      );

      const zonaConfig = cardDesign?.[zonaSeleccionada];
      const datosTransformados = datos
         .map((lectura) => {
            const promedio = calcularPromedioZona(lectura, zonaConfig);
            if (promedio === null) return null;
            return { x: new Date(lectura.timestamp), y: promedio };
         })
         .filter((d) => d !== null);

      setDatosGrafico(datosTransformados);
      setFuenteDatos(fuente);
   }, [
      alimentador,
      cardDesign,
      rangoSeleccionado,
      fechaRangoDesde,
      fechaRangoHasta,
      zonaSeleccionada,
      obtenerDatosGrafico,
      obtenerRegistradorZona,
      precargaCompleta,
   ]);

   // Iniciar precarga al montar
   useEffect(() => {
      if (!alimentador?.id || !dbLista || alimentadoresPuesto.length === 0) return;
      precargarPuesto(alimentadoresPuesto);
      return () => resetearPrecarga();
   }, [alimentador?.id, dbLista, alimentadoresPuesto, precargarPuesto, resetearPrecarga]);

   // Cargar datos cuando cambia selección
   useEffect(() => {
      if (!minimizada && precargaCompleta) {
         cargarDatos();
      }
   }, [cargarDatos, minimizada, precargaCompleta]);

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
      () => [{ name: `Promedio ${tituloZonaActual}`, data: datosFiltrados }],
      [datosFiltrados, tituloZonaActual]
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

   // Manejador para edición manual de escala Y
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

   // Handler para cambio de rango predefinido
   const handleRangoChange = useCallback((rangoId) => {
      setRangoSeleccionado(rangoId);
      setFechaRangoDesde(null);
      setFechaRangoHasta(null);
   }, []);

   // Handler para cambio de rango de fechas personalizado
   const handleFechaRangoChange = useCallback((desde, hasta) => {
      setFechaRangoDesde(desde);
      setFechaRangoHasta(hasta);
   }, []);

   // Handler para limpiar cache
   const handleLimpiarCache = useCallback(async () => {
      if (window.confirm("¿Limpiar cache local?")) {
         await limpiarCacheCompleto();
         precargarPuesto(alimentadoresPuesto);
      }
   }, [limpiarCacheCompleto, precargarPuesto, alimentadoresPuesto]);

   // Handler para cambio de tipo de gráfico
   const handleTipoGraficoChange = useCallback(
      (nuevoTipo) => {
         if (nuevoTipo === "bar" && intervaloFiltro === 0) {
            setIntervaloFiltro(15);
         }
         setTipoGrafico(nuevoTipo);
      },
      [intervaloFiltro]
   );

   // Handler para cambio de alimentador
   const handleAlimentadorChange = useCallback(
      (nuevoAlimentadorId) => {
         const nuevoAlimentador = alimentadoresPuesto.find((a) => a.id === nuevoAlimentadorId);
         if (nuevoAlimentador) {
            setAlimentadorActual(nuevoAlimentador);
            setCardDesignActual(nuevoAlimentador.card_design || {});
            setZonaSeleccionada("superior");
            setDatosGrafico([]);
         }
      },
      [alimentadoresPuesto]
   );

   return {
      // Estado
      alimentador,
      cardDesign,
      cargando,
      error,
      datosGrafico,
      datosFiltrados,
      precargando,
      precargaProgreso,
      precargaCompleta,

      // UI
      panelDatosAbierto,
      setPanelDatosAbierto,
      graficoVisible,
      setGraficoVisible,
      modalInformeVisible,
      setModalInformeVisible,
      editandoEscalaY,
      setEditandoEscalaY,

      // Zona
      zonaSeleccionada,
      setZonaSeleccionada,
      zonaDisponible,
      tituloSuperior,
      tituloInferior,
      tituloZonaActual,

      // Rango
      rangoSeleccionado,
      fechaRangoDesde,
      fechaRangoHasta,
      handleRangoChange,
      handleFechaRangoChange,

      // Gráfico
      tipoGrafico,
      handleTipoGraficoChange,
      opcionesGrafico,
      seriesGrafico,
      escalaYMax,
      setEscalaYMax,
      handleEscalaYManual,
      limitesEscalaY,

      // Intervalo
      intervaloFiltro,
      setIntervaloFiltro,

      // Datos
      fuenteDatosEfectiva,
      tituloPanelDatos,
      estadisticasGrafico,
      cargarDatos,
      handleLimpiarCache,

      // Alimentador
      handleAlimentadorChange,
   };
};
