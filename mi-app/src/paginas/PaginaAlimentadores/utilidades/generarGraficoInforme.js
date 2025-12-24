/**
 * Genera un gráfico temporal con ApexCharts y captura su imagen
 * para incluir en informes Excel.
 *
 * Crea un gráfico invisible, lo renderiza con los datos proporcionados,
 * captura la imagen y lo destruye.
 */

import ApexCharts from "apexcharts";

/**
 * Genera una imagen de gráfico a partir de datos de series temporales
 * @param {Array} datos - Array de puntos [{x: timestamp, y: valor}]
 * @param {Object} opciones - Opciones de configuración
 * @param {string} opciones.tipo - Tipo de gráfico (line, area, bar)
 * @param {string} opciones.titulo - Título del gráfico (opcional)
 * @param {number} opciones.width - Ancho en píxeles (default: 1100)
 * @param {number} opciones.height - Alto en píxeles (default: 450)
 * @param {number} opciones.scale - Escala de la imagen (default: 2)
 * @returns {Promise<string|null>} - Data URI de la imagen o null si falla
 */
export const generarImagenGrafico = async (datos, opciones = {}) => {
  if (!datos || datos.length === 0) {
    return null;
  }

  const {
    tipo = "line",
    titulo = "",
    width = 1100,
    height = 450,
    scale = 2,
  } = opciones;

  // Crear contenedor temporal - usar visibility:hidden para que ApexCharts
  // pueda calcular las dimensiones pero no sea visible
  const tempContainer = document.createElement("div");
  tempContainer.style.cssText = `
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: ${width}px;
    height: ${height}px;
    visibility: hidden;
  `;
  document.body.appendChild(tempContainer);

  // Forzar un reflow para asegurar que el contenedor tenga dimensiones
  tempContainer.offsetHeight;

  // Preparar series para ApexCharts
  const seriesData = datos.map((punto) => ({
    x: punto.x instanceof Date ? punto.x.getTime() : new Date(punto.x).getTime(),
    y: punto.y,
  }));

  // Calcular min/max para el eje Y con margen
  const valores = datos.map((d) => d.y).filter((v) => v != null && !isNaN(v));
  const minY = Math.min(...valores);
  const maxY = Math.max(...valores);
  const rangoY = maxY - minY || 1;
  const margen = rangoY * 0.1;

  // Configuración del gráfico simplificada para evitar errores de ApexCharts
  const chartConfig = {
    chart: {
      id: `informe-temp-${Date.now()}`,
      type: tipo,
      width: "100%",
      height: "100%",
      background: "#ffffff",
      foreColor: "#1a1a1a",
      animations: { enabled: false },
      toolbar: { show: false },
      zoom: { enabled: false },
      offsetX: 0,
      offsetY: 0,
      sparkline: { enabled: false },
    },
    series: [
      {
        name: titulo || "Medición",
        data: seriesData,
      },
    ],
    stroke: {
      curve: "smooth",
      width: tipo === "bar" ? 0 : 3,
    },
    colors: ["#0EA5E9"],
    markers: {
      size: datos.length <= 30 ? 4 : 0,
    },
    xaxis: {
      type: "datetime",
      labels: {
        datetimeUTC: false,
        format: "dd/MM HH:mm",
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      min: Math.floor(minY - margen),
      max: Math.ceil(maxY + margen),
      labels: {
        formatter: (val) => val.toFixed(2),
      },
    },
    grid: {
      borderColor: "#e0e0e0",
    },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    legend: { show: false },
  };

  let tempChart = null;

  try {
    // Crear y renderizar gráfico temporal
    tempChart = new ApexCharts(tempContainer, chartConfig);
    await tempChart.render();

    // Esperar a que el gráfico se renderice completamente
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Capturar imagen
    const result = await tempChart.dataURI({ scale });

    // dataURI puede devolver { imgURI } o directamente el string
    const imgURI = result?.imgURI || result;

    if (!imgURI || typeof imgURI !== "string") {
      console.warn("dataURI no devolvió una imagen válida:", result);
      return null;
    }

    return imgURI;
  } catch (err) {
    console.warn("Error generando imagen de gráfico para informe:", err);
    return null;
  } finally {
    // Limpiar: destruir gráfico y remover contenedor
    if (tempChart) {
      try {
        tempChart.destroy();
      } catch {
        // Ignorar errores de destrucción
      }
    }
    if (tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
};
