/**
 * Ventana flotante para visualizar el historial de lecturas con gráficos
 * Soporta: arrastrar, minimizar, maximizar, múltiples instancias
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Chart from "react-apexcharts";
import { usarHistorialLocal } from "../../hooks/usarHistorialLocal";
import { aplicarFormula } from "../../utilidades/calculosFormulas";
import { exportarCSV } from "../../utilidades/exportarCSV";
import { TITULOS_MEDICIONES } from "../../constantes/titulosMediciones";
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
  } = usarHistorialLocal();

  // Estados del selector
  const [rangoSeleccionado, setRangoSeleccionado] = useState("1h");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [zonaSeleccionada, setZonaSeleccionada] = useState("superior");
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [fuenteDatos, setFuenteDatos] = useState(null);

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
    if (rangoSeleccionado === "custom" && fechaDesde && fechaHasta) {
      desde = new Date(fechaDesde).getTime();
      hasta = new Date(fechaHasta).getTime();
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
  }, [alimentador, cardDesign, rangoSeleccionado, fechaDesde, fechaHasta, zonaSeleccionada, obtenerDatosGrafico, obtenerRegistradorZona, precargaCompleta]);

  // Iniciar precarga al montar
  useEffect(() => {
    if (!alimentador?.id) return;
    const registradorSuperior = obtenerRegistradorZona("superior");
    const registradorInferior = obtenerRegistradorZona("inferior");
    precargar48h(alimentador.id, registradorSuperior, registradorInferior);
    return () => resetearPrecarga();
  }, [alimentador?.id, obtenerRegistradorZona, precargar48h, resetearPrecarga]);

  // Cargar datos cuando cambia selección
  useEffect(() => {
    if (!minimizada) {
      cargarDatos();
    }
  }, [cargarDatos, minimizada]);

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

  // Configuración ApexCharts
  const opcionesGrafico = useMemo(() => ({
    chart: {
      id: `historial-${alimentador?.id}`,
      type: "line",
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
    stroke: { curve: "smooth", width: 2 },
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
    markers: { size: 0, hover: { size: 5 } },
    noData: { text: "No hay datos", style: { color: "#94a3b8", fontSize: "14px" } },
  }), [alimentador?.id]);

  const seriesGrafico = useMemo(() => [{ name: `Promedio ${tituloZonaActual}`, data: datosGrafico }], [datosGrafico, tituloZonaActual]);

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
                className={`ventana-rango-btn ${rangoSeleccionado === r.id ? "ventana-rango-btn--activo" : ""}`}
                onClick={() => setRangoSeleccionado(r.id)}
              >
                {r.label}
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
            <Chart options={opcionesGrafico} series={seriesGrafico} type="line" height="100%" />
          )}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default VentanaHistorial;
