/**
 * Ventana flotante para visualizar el historial de lecturas con gráficos
 * Soporta: arrastrar, minimizar, maximizar, múltiples instancias
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Chart from "react-apexcharts";
import { usarHistorialLocal } from "../../hooks/usarHistorialLocal";
import { aplicarFormula } from "../../utilidades/calculosFormulas";
import { exportarCSV } from "../../utilidades/exportarCSV";
import { generarInformeZonaExcel } from "../../utilidades/exportarInformeExcel";
import { TITULOS_MEDICIONES } from "../../constantes/titulosMediciones";
import SelectorFecha from "../../../../componentes/comunes/SelectorFecha";
import ModalConfigInforme from "./ModalConfigInforme";
import "./VentanaHistorial.css";

// Opciones de rango predefinidas
const RANGOS_TIEMPO = [
  { id: "1h", label: "1h", ms: 60 * 60 * 1000 },
  { id: "2h", label: "2h", ms: 2 * 60 * 60 * 1000 },
  { id: "6h", label: "6h", ms: 6 * 60 * 60 * 1000 },
  { id: "12h", label: "12h", ms: 12 * 60 * 60 * 1000 },
  { id: "24h", label: "24h", ms: 24 * 60 * 60 * 1000 },
  { id: "48h", label: "48h", ms: 48 * 60 * 60 * 1000 },
  { id: "7d", label: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "custom", label: "Custom", ms: null },
];

// Tipos de gráfico disponibles
const TIPOS_GRAFICO = [
  { id: "line", label: "Línea", icon: "📈" },
  { id: "area", label: "Área", icon: "📊" },
  { id: "bar", label: "Barras", icon: "📶" },
];

/**
 * Interpola color de verde a rojo basado en porcentaje (0-1)
 * 0 = verde (#22c55e), 1 = rojo (#ef4444)
 */
const interpolarColorVerdeRojo = (porcentaje) => {
  // Clamp entre 0 y 1
  const p = Math.max(0, Math.min(1, porcentaje));

  // Verde: rgb(34, 197, 94) - #22c55e
  // Amarillo: rgb(234, 179, 8) - #eab308 (punto medio)
  // Rojo: rgb(239, 68, 68) - #ef4444

  let r, g, b;

  if (p <= 0.5) {
    // Verde a Amarillo (0 a 0.5)
    const t = p * 2; // normalizar a 0-1
    r = Math.round(34 + (234 - 34) * t);
    g = Math.round(197 + (179 - 197) * t);
    b = Math.round(94 + (8 - 94) * t);
  } else {
    // Amarillo a Rojo (0.5 a 1)
    const t = (p - 0.5) * 2; // normalizar a 0-1
    r = Math.round(234 + (239 - 234) * t);
    g = Math.round(179 + (68 - 179) * t);
    b = Math.round(8 + (68 - 8) * t);
  }

  return `rgb(${r}, ${g}, ${b})`;
};

const obtenerTituloZona = (cardDesign, zona) => {
  const config = cardDesign?.[zona];
  if (!config) return zona === "superior" ? "Superior" : "Inferior";
  if (config.tituloCustom?.trim()) return config.tituloCustom;
  if (config.tituloId && TITULOS_MEDICIONES[config.tituloId]) {
    return TITULOS_MEDICIONES[config.tituloId];
  }
  return zona === "superior" ? "Superior" : "Inferior";
};

const calcularPromedioZona = (lectura, zonaConfig) => {
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

const VentanaHistorial = ({
  ventana,
  onCerrar,
  onMinimizar,
  onMaximizar,
  onEnfocar,
  onMover,
}) => {
  const { alimentador, cardDesign, minimizada, maximizada, posicion, zIndex } = ventana;

  const ventanaRef = useRef(null);
  const headerRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [offsetArrastre, setOffsetArrastre] = useState({ x: 0, y: 0 });

  // Hook de historial
  const {
    obtenerDatosGrafico,
    cargando,
    error,
    precargar48h,
    resetearPrecarga,
    precargaProgreso,
    precargaCompleta,
    precargando,
    limpiarCacheCompleto,
    estadisticas,
    dbLista,
  } = usarHistorialLocal();

  // Estados del selector
  const [rangoSeleccionado, setRangoSeleccionado] = useState("24h");
  const [fechaRangoDesde, setFechaRangoDesde] = useState(null);
  const [fechaRangoHasta, setFechaRangoHasta] = useState(null);
  const [zonaSeleccionada, setZonaSeleccionada] = useState("superior");
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [fuenteDatos, setFuenteDatos] = useState(null);
  const [panelDatosAbierto, setPanelDatosAbierto] = useState(true);
  const [intervaloFiltro, setIntervaloFiltro] = useState(60); // 0 = todos, 15, 30, 60 minutos
  const [tipoGrafico, setTipoGrafico] = useState("line"); // line, area, bar
  const [modalInformeVisible, setModalInformeVisible] = useState(false);

  // Títulos de zonas
  const tituloSuperior = useMemo(() => obtenerTituloZona(cardDesign, "superior"), [cardDesign]);
  const tituloInferior = useMemo(() => obtenerTituloZona(cardDesign, "inferior"), [cardDesign]);
  const tituloZonaActual = zonaSeleccionada === "superior" ? tituloSuperior : tituloInferior;

  const zonaDisponible = useCallback((zona) => {
    const config = cardDesign?.[zona];
    return config?.boxes?.some((b) => b.enabled);
  }, [cardDesign]);

  const obtenerRegistradorZona = useCallback((zona) => {
    const regIdZona = cardDesign?.[zona]?.registrador_id;
    if (regIdZona) return regIdZona;
    return alimentador?.registrador_id || null;
  }, [cardDesign, alimentador]);

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

    // Si hay un rango de fechas seleccionado desde el calendario
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

    const forzarSoloLocal = precargaCompleta;
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
  }, [alimentador, cardDesign, rangoSeleccionado, fechaRangoDesde, fechaRangoHasta, zonaSeleccionada, obtenerDatosGrafico, obtenerRegistradorZona, precargaCompleta]);

  // Iniciar precarga al montar (esperar a que IndexedDB esté lista)
  useEffect(() => {
    if (!alimentador?.id || !dbLista) return;
    const registradorSuperior = obtenerRegistradorZona("superior");
    const registradorInferior = obtenerRegistradorZona("inferior");
    precargar48h(alimentador.id, registradorSuperior, registradorInferior);
    return () => resetearPrecarga();
  }, [alimentador?.id, dbLista, obtenerRegistradorZona, precargar48h, resetearPrecarga]);

  // Cargar datos cuando cambia selección
  // IMPORTANTE: Esperar a que la precarga termine (precargaCompleta=true) antes de cargar
  // para evitar consultas innecesarias a la BD cuando ya hay datos en cache
  useEffect(() => {
    // Solo cargar cuando:
    // 1. No está minimizada
    // 2. La precarga terminó (precargaCompleta es true, lo que significa que verificó cache o cargó datos)
    if (!minimizada && precargaCompleta) {
      cargarDatos();
    }
  }, [cargarDatos, minimizada, precargaCompleta]);

  // --- Drag & Drop ---
  const handleMouseDown = (e) => {
    if (maximizada) return;
    if (e.target.closest("button")) return;
    onEnfocar();
    setArrastrando(true);
    const rect = ventanaRef.current.getBoundingClientRect();
    setOffsetArrastre({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    if (!arrastrando) return;

    const handleMouseMove = (e) => {
      const newX = Math.max(0, e.clientX - offsetArrastre.x);
      const newY = Math.max(0, e.clientY - offsetArrastre.y);
      onMover({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setArrastrando(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [arrastrando, offsetArrastre, onMover]);

  // Datos filtrados por intervalo (se usa tanto para el gráfico como para la tabla)
  // Esto evita renderizar miles de puntos y mejora el rendimiento
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
  // Usa el rango completo de colores: el valor mínimo es verde, el máximo es rojo
  const coloresBarras = useMemo(() => {
    if (datosFiltrados.length === 0) return [];
    const valores = datosFiltrados.map((d) => d.y);
    const minVal = Math.min(...valores);
    const maxVal = Math.max(...valores);
    const rango = maxVal - minVal;
    // Normalización min-max para maximizar el contraste visual
    return valores.map((val) => {
      const porcentaje = rango > 0 ? (val - minVal) / rango : 0;
      return interpolarColorVerdeRojo(porcentaje);
    });
  }, [datosFiltrados]);

  // Configuración ApexCharts (dinámica según tipo de gráfico y colores)
  const opcionesGrafico = useMemo(() => {
    const opcionesBase = {
      chart: {
        id: `historial-${alimentador?.id}-${tipoGrafico}`,
        type: tipoGrafico,
        height: "100%",
        zoom: { enabled: true, type: "x", autoScaleYaxis: true },
        toolbar: {
          show: true,
          tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
          autoSelected: "zoom",
        },
        background: "#0f172a",
        foreColor: "#e2e8f0",
        animations: { enabled: true, speed: 500 },
      },
      colors: ["#0ea5e9"],
      xaxis: {
        type: "datetime",
        labels: {
          style: { colors: "#94a3b8" },
          datetimeUTC: false,
          datetimeFormatter: { year: "yyyy", month: "MMM 'yy", day: "dd MMM", hour: "HH:mm" },
        },
        axisBorder: { color: "#334155" },
        axisTicks: { color: "#334155" },
      },
      yaxis: {
        labels: {
          style: { colors: "#94a3b8" },
          formatter: (val) => (val != null ? val.toFixed(2) : "--"),
        },
      },
      grid: { borderColor: "#334155", strokeDashArray: 3 },
      tooltip: { theme: "dark", x: { format: "dd/MM/yyyy HH:mm:ss" }, y: { formatter: (val) => (val != null ? val.toFixed(4) : "--") } },
      dataLabels: { enabled: false },
      noData: { text: "No hay datos", style: { color: "#94a3b8", fontSize: "14px" } },
    };

    // Opciones específicas por tipo de gráfico
    if (tipoGrafico === "line") {
      opcionesBase.stroke = {
        curve: "smooth",
        width: 2,
        lineCap: "round",
      };
      // Gradiente en la línea (verde abajo, rojo arriba)
      opcionesBase.fill = {
        type: "gradient",
        gradient: {
          type: "vertical",
          colorStops: [
            { offset: 0, color: "#ef4444", opacity: 1 },   // Rojo arriba
            { offset: 50, color: "#eab308", opacity: 1 },  // Amarillo medio
            { offset: 100, color: "#22c55e", opacity: 1 }, // Verde abajo
          ],
        },
      };
      opcionesBase.markers = { size: 0, hover: { size: 5 } };
    } else if (tipoGrafico === "area") {
      opcionesBase.stroke = { curve: "smooth", width: 2, colors: ["#ef4444"] };
      opcionesBase.fill = {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.1,
          opacityFrom: 0.9,
          opacityTo: 0.9,
          colorStops: [
            { offset: 0, color: "#ef4444", opacity: 0.9 },   // Rojo arriba
            { offset: 50, color: "#eab308", opacity: 0.9 },  // Amarillo medio
            { offset: 100, color: "#22c55e", opacity: 0.9 }, // Verde abajo
          ],
        },
      };
      opcionesBase.markers = { size: 0, hover: { size: 5 } };
    } else if (tipoGrafico === "bar") {
      opcionesBase.plotOptions = {
        bar: {
          columnWidth: "95%",
          borderRadius: 0,
          distributed: true, // Permite colores individuales por barra
        },
      };
      opcionesBase.legend = { show: false }; // Ocultar leyenda cuando distributed
      opcionesBase.fill = { type: "solid" }; // Color sólido por barra
      opcionesBase.stroke = { width: 1, colors: ["#334155"] }; // Borde gris oscuro de 1px
      // Asignar colores según valor relativo al máximo
      if (coloresBarras.length > 0) {
        opcionesBase.colors = coloresBarras;
      }
    }

    return opcionesBase;
  }, [alimentador?.id, tipoGrafico, coloresBarras]);

  // Series para el gráfico (usa datos filtrados)
  const seriesGrafico = useMemo(() => [{ name: `Promedio ${tituloZonaActual}`, data: datosFiltrados }], [datosFiltrados, tituloZonaActual]);

  // Datos para la tabla del panel lateral (formateados para mostrar)
  const datosTabla = useMemo(() => {
    return datosFiltrados.map((punto) => {
      const fecha = new Date(punto.x);
      return {
        fecha: fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        hora: fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        medicion: Math.ceil(punto.y * 100) / 100, // Redondear hacia arriba a 2 decimales
      };
    });
  }, [datosFiltrados]);

  // Título del panel: período de fechas o fecha única si es el mismo día
  const tituloPanelDatos = useMemo(() => {
    if (datosGrafico.length === 0) return "Sin datos";
    const primeraFecha = new Date(datosGrafico[0].x);
    const ultimaFecha = new Date(datosGrafico[datosGrafico.length - 1].x);

    const formatoFecha = { day: "2-digit", month: "2-digit", year: "2-digit" };
    const primeraStr = primeraFecha.toLocaleDateString("es-AR", formatoFecha);
    const ultimaStr = ultimaFecha.toLocaleDateString("es-AR", formatoFecha);

    // Si es el mismo día, mostrar solo una fecha
    if (primeraStr === ultimaStr) {
      return primeraStr;
    }
    // Si son días diferentes, mostrar rango
    return `${primeraStr} - ${ultimaStr}`;
  }, [datosGrafico]);

  const estadisticasGrafico = useMemo(() => {
    if (datosGrafico.length === 0) return null;
    const valores = datosGrafico.map((d) => d.y);
    const minVal = Math.min(...valores);
    const maxVal = Math.max(...valores);
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;

    // Encontrar los puntos con min y max para obtener sus timestamps
    const puntoMin = datosGrafico.find((d) => d.y === minVal);
    const puntoMax = datosGrafico.find((d) => d.y === maxVal);

    // Formatear fecha/hora compacta con año
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
      promedio: promedio.toFixed(2)
    };
  }, [datosGrafico]);

  const handleExportarCSV = () => {
    if (datosGrafico.length === 0) return;
    exportarCSV(datosGrafico, `historial_${alimentador?.nombre}_${zonaSeleccionada}_${Date.now()}`, {
      columnas: ["timestamp", "valor"],
      etiquetas: { timestamp: "Fecha/Hora", valor: `Promedio ${tituloZonaActual}` },
    });
  };

  const handleAbrirModalInforme = () => {
    if (datosGrafico.length === 0) return;
    setModalInformeVisible(true);
  };

  const handleGenerarInforme = async (configInforme) => {
    const { solicitadoPor, datosFiltrados, fechaInicio, fechaFin } = configInforme;

    await generarInformeZonaExcel({
      nombreAlimentador: alimentador?.nombre || "Alimentador",
      tituloMedicion: tituloZonaActual,
      datos: datosFiltrados,
      fechaInicio,
      fechaFin,
      solicitadoPor,
    });
  };

  // No renderizar si está minimizada
  if (minimizada) return null;

  const estiloVentana = maximizada
    ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", zIndex }
    : { position: "fixed", top: posicion.y, left: posicion.x, zIndex };

  return (
    <div
      ref={ventanaRef}
      className={`ventana-historial ${maximizada ? "ventana-historial--maximizada" : ""} ${arrastrando ? "ventana-historial--arrastrando" : ""}`}
      style={estiloVentana}
      onMouseDown={() => onEnfocar()}
    >
      {/* Header arrastrable */}
      <header
        ref={headerRef}
        className="ventana-historial-header"
        onMouseDown={handleMouseDown}
      >
        <div className="ventana-historial-titulo">
          <span className="ventana-historial-icono">📊</span>
          <span className="ventana-historial-nombre">{alimentador?.nombre}</span>
        </div>
        <div className="ventana-historial-controles">
          <button type="button" className="ventana-btn ventana-btn--minimizar" onClick={onMinimizar} title="Minimizar">
            <span>─</span>
          </button>
          <button type="button" className="ventana-btn ventana-btn--maximizar" onClick={onMaximizar} title={maximizada ? "Restaurar" : "Maximizar"}>
            <span>{maximizada ? "❐" : "□"}</span>
          </button>
          <button type="button" className="ventana-btn ventana-btn--cerrar" onClick={onCerrar} title="Cerrar">
            <span>×</span>
          </button>
        </div>
      </header>

      {/* Contenido */}
      <div className="ventana-historial-content">
        {/* Barra de controles compacta */}
        <div className="ventana-controles">
          {/* Botón toggle para panel de datos */}
          <button
            type="button"
            className={`ventana-toggle-datos ${panelDatosAbierto ? "ventana-toggle-datos--activo" : ""}`}
            onClick={() => setPanelDatosAbierto(!panelDatosAbierto)}
            title={panelDatosAbierto ? "Ocultar datos" : "Ver datos"}
          >
            <span className="ventana-toggle-icono">▲</span>
          </button>

          {/* Tabs de zona */}
          <div className="ventana-tabs">
            <button
              type="button"
              className={`ventana-tab ${zonaSeleccionada === "superior" ? "ventana-tab--activo" : ""}`}
              onClick={() => setZonaSeleccionada("superior")}
              disabled={!zonaDisponible("superior")}
            >
              {tituloSuperior}
            </button>
            <button
              type="button"
              className={`ventana-tab ${zonaSeleccionada === "inferior" ? "ventana-tab--activo" : ""}`}
              onClick={() => setZonaSeleccionada("inferior")}
              disabled={!zonaDisponible("inferior")}
            >
              {tituloInferior}
            </button>
          </div>

          {/* Selector de rango */}
          <div className="ventana-rango">
            {RANGOS_TIEMPO.filter(r => r.id !== "custom").map((r) => (
              <button
                key={r.id}
                type="button"
                className={`ventana-rango-btn ${rangoSeleccionado === r.id && !fechaRangoDesde ? "ventana-rango-btn--activo" : ""}`}
                onClick={() => {
                  setRangoSeleccionado(r.id);
                  setFechaRangoDesde(null);
                  setFechaRangoHasta(null);
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Selector de rango de fechas */}
          <div className="ventana-selector-dia">
            <SelectorFecha
              value={fechaRangoDesde}
              valueHasta={fechaRangoHasta}
              modoRango={true}
              onChangeRango={(desde, hasta) => {
                setFechaRangoDesde(desde);
                setFechaRangoHasta(hasta);
              }}
              maxDate={new Date()}
              placeholder="Seleccionar fechas"
            />
            {fechaRangoDesde && fechaRangoHasta && (
              <span className="ventana-dia-seleccionado">
                {new Date(fechaRangoDesde).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                {fechaRangoDesde.getTime() !== fechaRangoHasta.getTime() && (
                  <> - {new Date(fechaRangoHasta).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}</>
                )}
              </span>
            )}
          </div>

          {/* Selector de tipo de gráfico */}
          <div className="ventana-tipo-grafico">
            {TIPOS_GRAFICO.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                className={`ventana-tipo-btn ${tipoGrafico === tipo.id ? "ventana-tipo-btn--activo" : ""}`}
                onClick={() => setTipoGrafico(tipo.id)}
                title={tipo.label}
              >
                {tipo.icon}
              </button>
            ))}
          </div>

          {/* Cache + Fuente */}
          <div className="ventana-cache">
            <div className="ventana-cache-barra">
              <div
                className={`ventana-cache-progreso ${precargaCompleta ? "ventana-cache-progreso--completo" : ""}`}
                style={{ width: `${precargaProgreso}%` }}
              />
            </div>
            <span className="ventana-cache-texto">
              {precargaCompleta ? "✓" : `${precargaProgreso}%`}
            </span>
            {fuenteDatos && (
              <span className={`ventana-fuente ventana-fuente--${fuenteDatos}`}>
                {fuenteDatos === "local" ? "Local" : fuenteDatos === "remoto" ? "BD" : "Mixto"}
              </span>
            )}
            <button
              type="button"
              className="ventana-btn-limpiar"
              onClick={async () => {
                if (window.confirm("¿Limpiar cache local?")) {
                  await limpiarCacheCompleto();
                  const regSup = obtenerRegistradorZona("superior");
                  const regInf = obtenerRegistradorZona("inferior");
                  precargar48h(alimentador.id, regSup, regInf);
                }
              }}
              disabled={precargando}
              title="Limpiar cache"
            >
              🗑
            </button>
          </div>
        </div>

        {/* Contenedor del gráfico y panel de datos */}
        <div className="ventana-grafico-container">
          {/* Panel lateral de datos */}
          {panelDatosAbierto && (
            <div className="ventana-panel-datos">
              <div className="ventana-panel-header">
                <span>{tituloPanelDatos}</span>
                <select
                  className="ventana-panel-intervalo"
                  value={intervaloFiltro}
                  onChange={(e) => setIntervaloFiltro(Number(e.target.value))}
                >
                  <option value={0}>Todos</option>
                  <option value={15}>cada 15m</option>
                  <option value={30}>cada 30m</option>
                  <option value={60}>cada 60m</option>
                </select>
              </div>
              <div className="ventana-panel-tabla-container">
                <table className="ventana-panel-tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Medición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosTabla.map((fila, idx) => (
                      <tr key={idx}>
                        <td>{fila.fecha}</td>
                        <td>{fila.hora}</td>
                        <td>{fila.medicion.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Gráfico */}
          <div className="ventana-grafico">
            {cargando ? (
              <div className="ventana-estado">
                <div className="ventana-spinner" />
                <span>Cargando...</span>
              </div>
            ) : error ? (
              <div className="ventana-estado ventana-estado--error">
                <span>Error: {error}</span>
                <button onClick={cargarDatos}>Reintentar</button>
              </div>
            ) : datosGrafico.length === 0 ? (
              <div className="ventana-estado">
                <span>No hay datos</span>
              </div>
            ) : (
              <Chart options={opcionesGrafico} series={seriesGrafico} type={tipoGrafico} height="100%" />
            )}
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticasGrafico && (
          <div className="ventana-stats">
            <span className="ventana-stat">
              <b>Puntos:</b>
              <input type="text" className="ventana-stat-input" value={estadisticasGrafico.puntos} size={String(estadisticasGrafico.puntos).length || 1} readOnly />
            </span>
            <span className="ventana-stat">
              <b>Mín:</b>
              <input type="text" className="ventana-stat-input" value={estadisticasGrafico.min} size={estadisticasGrafico.min.length || 1} readOnly />
              {estadisticasGrafico.minFecha && (
                <span className="ventana-stat-fecha">({estadisticasGrafico.minFecha})</span>
              )}
            </span>
            <span className="ventana-stat">
              <b>Máx:</b>
              <input type="text" className="ventana-stat-input" value={estadisticasGrafico.max} size={estadisticasGrafico.max.length || 1} readOnly />
              {estadisticasGrafico.maxFecha && (
                <span className="ventana-stat-fecha">({estadisticasGrafico.maxFecha})</span>
              )}
            </span>
            <span className="ventana-stat">
              <b>Prom:</b>
              <input type="text" className="ventana-stat-input" value={estadisticasGrafico.promedio} size={estadisticasGrafico.promedio.length || 1} readOnly />
            </span>
            <button type="button" className="ventana-btn-exportar" onClick={handleExportarCSV} disabled={datosGrafico.length === 0}>
              CSV
            </button>
            <button type="button" className="ventana-btn-exportar ventana-btn-informe" onClick={handleAbrirModalInforme} disabled={datosGrafico.length === 0}>
              Informe
            </button>
          </div>
        )}
      </div>

      {/* Modal de configuración de informe */}
      <ModalConfigInforme
        visible={modalInformeVisible}
        onCerrar={() => setModalInformeVisible(false)}
        onGenerar={handleGenerarInforme}
        datos={datosGrafico}
        nombreAlimentador={alimentador?.nombre || "Alimentador"}
        tituloMedicion={tituloZonaActual}
      />
    </div>
  );
};

export default VentanaHistorial;
