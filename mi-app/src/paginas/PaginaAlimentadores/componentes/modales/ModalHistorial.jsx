/**
 * Modal para visualizar el historial de lecturas con gráficos
 * Muestra el PROMEDIO de los valores de cada zona (superior/inferior)
 * aplicando las fórmulas configuradas en cada box
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Chart from "react-apexcharts";
import { useHistorialLocal } from "../../hooks/useHistorialLocal";
import { aplicarFormula } from "../../utilidades/calculosFormulas";
import { exportarCSV } from "../../utilidades/exportarCSV";
import { TITULOS_MEDICIONES } from "../../constantes/titulosMediciones";
import "./ModalHistorial.css";

// Opciones de rango predefinidas
const RANGOS_TIEMPO = [
  { id: "1h", label: "Última hora", ms: 60 * 60 * 1000 },
  { id: "2h", label: "Últimas 2 horas", ms: 2 * 60 * 60 * 1000 },
  { id: "6h", label: "Últimas 6 horas", ms: 6 * 60 * 60 * 1000 },
  { id: "12h", label: "Últimas 12 horas", ms: 12 * 60 * 60 * 1000 },
  { id: "24h", label: "Últimas 24 horas", ms: 24 * 60 * 60 * 1000 },
  { id: "48h", label: "Últimas 48 horas", ms: 48 * 60 * 60 * 1000 },
  { id: "7d", label: "Últimos 7 días", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "custom", label: "Personalizado", ms: null },
];

/**
 * Obtiene el título de una zona del cardDesign
 */
const obtenerTituloZona = (cardDesign, zona) => {
  const config = cardDesign?.[zona];
  if (!config) return zona === "superior" ? "Parte Superior" : "Parte Inferior";

  // Si tiene título custom
  if (config.tituloCustom && config.tituloCustom.trim()) {
    return config.tituloCustom;
  }

  // Si tiene tituloId, buscar en las constantes
  if (config.tituloId && TITULOS_MEDICIONES[config.tituloId]) {
    return TITULOS_MEDICIONES[config.tituloId];
  }

  return zona === "superior" ? "Parte Superior" : "Parte Inferior";
};

/**
 * Calcula el promedio de los valores de una zona, aplicando fórmulas
 * Descarta valores que resulten en 0 después de aplicar la fórmula
 */
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

    // Aplicar fórmula
    const valorCalculado = aplicarFormula(box.formula || "x", valorCrudo);

    // Descartar valores nulos, NaN o 0
    if (valorCalculado !== null && !Number.isNaN(valorCalculado) && valorCalculado !== 0) {
      valoresCalculados.push(valorCalculado);
    }
  });

  if (valoresCalculados.length === 0) return null;

  // Calcular promedio
  const suma = valoresCalculados.reduce((a, b) => a + b, 0);
  return suma / valoresCalculados.length;
};

const ModalHistorial = ({ abierto, onCerrar, alimentador, cardDesign }) => {
  // Hook DEBE estar antes de cualquier return condicional (React Rules of Hooks)
  const {
    obtenerDatosGrafico,
    cargando,
    error,
    // Precarga 48h
    precargar48h,
    resetearPrecarga,
    precargaProgreso,
    precargaCompleta,
    precargando,
    // Limpiar cache
    limpiarCacheCompleto,
    estadisticas,
  } = useHistorialLocal();

  // Estado del selector
  const [rangoSeleccionado, setRangoSeleccionado] = useState("1h");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [zonaSeleccionada, setZonaSeleccionada] = useState("superior");

  // Datos del gráfico
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [fuenteDatos, setFuenteDatos] = useState(null);

  // Obtener títulos de las zonas
  const tituloSuperior = useMemo(
    () => obtenerTituloZona(cardDesign, "superior"),
    [cardDesign]
  );
  const tituloInferior = useMemo(
    () => obtenerTituloZona(cardDesign, "inferior"),
    [cardDesign]
  );

  // Título de la zona seleccionada (para el gráfico)
  const tituloZonaActual = zonaSeleccionada === "superior" ? tituloSuperior : tituloInferior;

  // Verificar si hay zona configurada
  const zonaDisponible = useCallback((zona) => {
    const config = cardDesign?.[zona];
    return config?.boxes?.some((b) => b.enabled);
  }, [cardDesign]);

  // Obtener registrador_id de la zona (con fallback al registrador del alimentador)
  const obtenerRegistradorZona = useCallback((zona) => {
    // Primero buscar en la zona específica del cardDesign
    const regIdZona = cardDesign?.[zona]?.registrador_id;
    if (regIdZona) return regIdZona;

    // Fallback: usar registrador_id del alimentador (formato legacy o único registrador)
    return alimentador?.registrador_id || null;
  }, [cardDesign, alimentador]);

  // Cargar datos cuando cambia la selección
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

    // Si la precarga de 48h está completa, forzar solo datos locales
    const forzarSoloLocal = precargaCompleta;

    const { datos, fuente } = await obtenerDatosGrafico(
      alimentador.id,
      registradorId,
      zonaSeleccionada,
      desde,
      hasta,
      forzarSoloLocal
    );

    // Transformar datos calculando el promedio de la zona
    const zonaConfig = cardDesign?.[zonaSeleccionada];

    const datosTransformados = datos
      .map((lectura) => {
        const promedio = calcularPromedioZona(lectura, zonaConfig);

        if (promedio === null) return null;

        return {
          x: new Date(lectura.timestamp),
          y: promedio,
        };
      })
      .filter((d) => d !== null);

    setDatosGrafico(datosTransformados);
    setFuenteDatos(fuente);
  }, [
    alimentador,
    cardDesign,
    rangoSeleccionado,
    fechaDesde,
    fechaHasta,
    zonaSeleccionada,
    obtenerDatosGrafico,
    obtenerRegistradorZona,
    precargaCompleta,
  ]);

  // Resetear a 1h y resetear precarga cuando se abre/cierra el modal
  useEffect(() => {
    if (abierto) {
      setRangoSeleccionado("1h");
    } else {
      // Al cerrar, resetear estado de precarga
      resetearPrecarga();
    }
  }, [abierto, resetearPrecarga]);

  // Iniciar precarga de 48h automáticamente al abrir el modal
  useEffect(() => {
    if (!abierto || !alimentador?.id) return;

    // Obtener registradores de ambas zonas
    const registradorSuperior = obtenerRegistradorZona("superior");
    const registradorInferior = obtenerRegistradorZona("inferior");

    // Iniciar precarga
    precargar48h(alimentador.id, registradorSuperior, registradorInferior);
  }, [abierto, alimentador?.id, obtenerRegistradorZona, precargar48h]);

  // Cargar datos al abrir o cambiar selección
  useEffect(() => {
    if (abierto) {
      cargarDatos();
    }
  }, [abierto, cargarDatos]);

  // Configuración de ApexCharts
  const opcionesGrafico = useMemo(
    () => ({
      chart: {
        id: "historial-lecturas",
        type: "line",
        height: 350,
        zoom: {
          enabled: true,
          type: "x",
          autoScaleYaxis: true,
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
          autoSelected: "zoom",
        },
        background: "#0f172a",
        foreColor: "#e2e8f0",
        animations: {
          enabled: true,
          speed: 500,
        },
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      colors: ["#0ea5e9"],
      xaxis: {
        type: "datetime",
        labels: {
          style: { colors: "#94a3b8" },
          datetimeUTC: false,
          datetimeFormatter: {
            year: "yyyy",
            month: "MMM 'yy",
            day: "dd MMM",
            hour: "HH:mm",
          },
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
      grid: {
        borderColor: "#334155",
        strokeDashArray: 3,
      },
      tooltip: {
        theme: "dark",
        x: { format: "dd/MM/yyyy HH:mm:ss" },
        y: {
          formatter: (val) => (val != null ? val.toFixed(4) : "--"),
        },
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: 0,
        hover: { size: 5 },
      },
      noData: {
        text: "No hay datos disponibles",
        style: {
          color: "#94a3b8",
          fontSize: "14px",
        },
      },
    }),
    []
  );

  const seriesGrafico = useMemo(
    () => [
      {
        name: `Promedio ${tituloZonaActual}`,
        data: datosGrafico,
      },
    ],
    [datosGrafico, tituloZonaActual]
  );

  // Calcular estadísticas del gráfico
  const estadisticasGrafico = useMemo(() => {
    if (datosGrafico.length === 0) return null;

    const valores = datosGrafico.map((d) => d.y);
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const suma = valores.reduce((a, b) => a + b, 0);
    const promedio = suma / valores.length;

    return {
      puntos: datosGrafico.length,
      min: min.toFixed(2),
      max: max.toFixed(2),
      promedio: promedio.toFixed(2),
    };
  }, [datosGrafico]);

  // Handler exportar CSV
  const handleExportarCSV = () => {
    if (datosGrafico.length === 0) return;

    const nombreArchivo = `historial_${alimentador?.nombre || "alimentador"}_${
      zonaSeleccionada
    }_${Date.now()}`;

    exportarCSV(datosGrafico, nombreArchivo, {
      columnas: ["timestamp", "valor"],
      etiquetas: {
        timestamp: "Fecha/Hora",
        valor: `Promedio ${tituloZonaActual}`,
      },
    });
  };

  // Early return DESPUÉS de todos los hooks (React Rules of Hooks)
  if (!abierto) return null;

  return (
    <div className="historial-modal-overlay">
      <div className="historial-modal">
        <header className="historial-modal-header">
          <div className="historial-modal-titulo">
            <h2>Historial de Lecturas</h2>
            <span className="historial-modal-subtitulo">
              {alimentador?.nombre}
            </span>
          </div>
          <button
            type="button"
            className="historial-modal-cerrar"
            onClick={onCerrar}
          >
            &times;
          </button>
        </header>

        <div className="historial-modal-content">
          {/* Selectores */}
          <div className="historial-selectores">
            {/* Selector de zona con títulos */}
            <div className="historial-selector-grupo historial-selector-zona">
              <label>Medición</label>
              <div className="historial-tabs">
                <button
                  type="button"
                  className={`historial-tab ${
                    zonaSeleccionada === "superior" ? "historial-tab--activo" : ""
                  }`}
                  onClick={() => setZonaSeleccionada("superior")}
                  disabled={!zonaDisponible("superior")}
                  title={tituloSuperior}
                >
                  {tituloSuperior}
                </button>
                <button
                  type="button"
                  className={`historial-tab ${
                    zonaSeleccionada === "inferior" ? "historial-tab--activo" : ""
                  }`}
                  onClick={() => setZonaSeleccionada("inferior")}
                  disabled={!zonaDisponible("inferior")}
                  title={tituloInferior}
                >
                  {tituloInferior}
                </button>
              </div>
            </div>

            {/* Selector de rango de tiempo */}
            <div className="historial-selector-grupo">
              <label>Rango de tiempo</label>
              <select
                className="historial-select"
                value={rangoSeleccionado}
                onChange={(e) => setRangoSeleccionado(e.target.value)}
              >
                {RANGOS_TIEMPO.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fechas personalizadas */}
            {rangoSeleccionado === "custom" && (
              <div className="historial-fechas-custom">
                <div className="historial-selector-grupo">
                  <label>Desde</label>
                  <input
                    type="datetime-local"
                    className="historial-input"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>
                <div className="historial-selector-grupo">
                  <label>Hasta</label>
                  <input
                    type="datetime-local"
                    className="historial-input"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="historial-btn-buscar"
                  onClick={cargarDatos}
                  disabled={!fechaDesde || !fechaHasta}
                >
                  Buscar
                </button>
              </div>
            )}

            {/* Barra de progreso de precarga de 48h */}
            <div className="historial-precarga">
              <div className="historial-precarga-header">
                <span className="historial-precarga-label">
                  Cache local (48h){estadisticas?.totalLecturas ? ` - ${estadisticas.totalLecturas} registros` : ""}:
                </span>
                <div className="historial-precarga-acciones">
                  {precargaCompleta ? (
                    <span className="historial-precarga-ok">
                      <svg
                        className="historial-precarga-check"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Completo
                    </span>
                  ) : precargando ? (
                    <span className="historial-precarga-porcentaje">
                      {precargaProgreso}%
                    </span>
                  ) : (
                    <span className="historial-precarga-pendiente">Pendiente</span>
                  )}
                  <button
                    type="button"
                    className="historial-btn-limpiar"
                    onClick={async () => {
                      if (window.confirm("¿Limpiar todo el cache local? Se volverán a descargar los datos.")) {
                        await limpiarCacheCompleto();
                        // Reiniciar precarga
                        const registradorSuperior = obtenerRegistradorZona("superior");
                        const registradorInferior = obtenerRegistradorZona("inferior");
                        precargar48h(alimentador.id, registradorSuperior, registradorInferior);
                      }
                    }}
                    disabled={precargando}
                    title="Limpiar cache local"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
              <div className="historial-precarga-barra">
                <div
                  className={`historial-precarga-progreso ${
                    precargaCompleta ? "historial-precarga-progreso--completo" : ""
                  }`}
                  style={{ width: `${precargaProgreso}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Indicador de fuente de datos */}
          {fuenteDatos && (
            <div className={`historial-fuente historial-fuente--${fuenteDatos}`}>
              {fuenteDatos === "local" && precargaCompleta && "Datos de cache local (precarga completa)"}
              {fuenteDatos === "local" && !precargaCompleta && "Datos de cache local (tiempo real)"}
              {fuenteDatos === "remoto" && "Datos de base de datos"}
              {fuenteDatos === "mixto" && "Datos combinados (local + BD)"}
              {fuenteDatos === "error" && "Error cargando datos"}
            </div>
          )}

          {/* Gráfico */}
          <div className="historial-grafico-container">
            {cargando ? (
              <div className="historial-estado">
                <div className="historial-spinner"></div>
                <span>Cargando datos...</span>
              </div>
            ) : error ? (
              <div className="historial-estado historial-estado--error">
                <span>Error: {error}</span>
                <button onClick={cargarDatos}>Reintentar</button>
              </div>
            ) : datosGrafico.length === 0 ? (
              <div className="historial-estado">
                <span>No hay datos para el rango seleccionado</span>
              </div>
            ) : (
              <Chart
                options={opcionesGrafico}
                series={seriesGrafico}
                type="line"
                height={350}
              />
            )}
          </div>

          {/* Estadísticas */}
          {estadisticasGrafico && (
            <div className="historial-stats">
              <div className="historial-stat">
                <span className="historial-stat-label">Puntos</span>
                <span className="historial-stat-valor">{estadisticasGrafico.puntos}</span>
              </div>
              <div className="historial-stat">
                <span className="historial-stat-label">Mín</span>
                <span className="historial-stat-valor">{estadisticasGrafico.min}</span>
              </div>
              <div className="historial-stat">
                <span className="historial-stat-label">Máx</span>
                <span className="historial-stat-valor">{estadisticasGrafico.max}</span>
              </div>
              <div className="historial-stat">
                <span className="historial-stat-label">Promedio</span>
                <span className="historial-stat-valor">{estadisticasGrafico.promedio}</span>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="historial-modal-acciones">
          <button
            type="button"
            className="historial-btn historial-btn--secundario"
            onClick={cargarDatos}
            disabled={cargando}
          >
            Actualizar
          </button>
          <button
            type="button"
            className="historial-btn historial-btn--secundario"
            onClick={onCerrar}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="historial-btn historial-btn--primario"
            onClick={handleExportarCSV}
            disabled={datosGrafico.length === 0}
          >
            Exportar CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalHistorial;
