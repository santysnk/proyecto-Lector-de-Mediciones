// utilidades/configGraficoHistorial.js
// Configuración de opciones ApexCharts para historial

/**
 * Genera las opciones base para el gráfico de historial
 * @param {Object} params - Parámetros de configuración
 * @param {string} params.alimentadorId - ID del alimentador
 * @param {string} params.tipoGrafico - Tipo de gráfico (line, area, bar)
 * @param {number|null} params.escalaYMax - Escala Y máxima (null = auto)
 * @returns {Object} Opciones base de ApexCharts
 */
const generarOpcionesBase = ({ alimentadorId, tipoGrafico, escalaYMax }) => ({
   chart: {
      id: `historial-${alimentadorId}-${tipoGrafico}`,
      type: tipoGrafico,
      height: "100%",
      zoom: { enabled: true, type: "x", autoScaleYaxis: true },
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
      animations: { enabled: true, speed: 500 },
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
      min: 0,
      max: escalaYMax || undefined,
      labels: {
         style: { colors: "#94a3b8" },
         formatter: (val) => (val != null ? val.toFixed(2) : "--"),
      },
   },
   grid: { borderColor: "#334155", strokeDashArray: 3 },
   tooltip: {
      theme: "dark",
      x: { format: "dd/MM/yyyy HH:mm:ss" },
      y: { formatter: (val) => (val != null ? val.toFixed(4) : "--") },
   },
   dataLabels: { enabled: false },
   noData: {
      text: "No hay datos",
      style: { color: "#94a3b8", fontSize: "14px" },
   },
});

/**
 * Opciones específicas para gráfico de línea
 */
const opcionesLinea = {
   stroke: {
      curve: "smooth",
      width: 2,
      lineCap: "round",
   },
   fill: {
      type: "gradient",
      gradient: {
         type: "vertical",
         colorStops: [
            { offset: 0, color: "#ef4444", opacity: 1 },
            { offset: 50, color: "#eab308", opacity: 1 },
            { offset: 100, color: "#22c55e", opacity: 1 },
         ],
      },
   },
   markers: { size: 0, hover: { size: 5 } },
};

/**
 * Opciones específicas para gráfico de área
 */
const opcionesArea = {
   stroke: { curve: "smooth", width: 2, colors: ["#ef4444"] },
   fill: {
      type: "gradient",
      gradient: {
         shade: "light",
         type: "vertical",
         shadeIntensity: 0.1,
         opacityFrom: 0.9,
         opacityTo: 0.9,
         colorStops: [
            { offset: 0, color: "#ef4444", opacity: 0.9 },
            { offset: 50, color: "#eab308", opacity: 0.9 },
            { offset: 100, color: "#22c55e", opacity: 0.9 },
         ],
      },
   },
   markers: { size: 0, hover: { size: 5 } },
};

/**
 * Genera opciones específicas para gráfico de barras
 * @param {string[]} coloresBarras - Colores individuales por barra
 * @returns {Object} Opciones para barras
 */
const generarOpcionesBarras = (coloresBarras) => ({
   plotOptions: {
      bar: {
         columnWidth: "95%",
         borderRadius: 0,
         distributed: true,
      },
   },
   legend: { show: false },
   fill: { type: "solid" },
   stroke: { show: false },
   ...(coloresBarras.length > 0 && { colors: coloresBarras }),
});

/**
 * Genera la configuración completa de opciones para ApexCharts
 * @param {Object} params - Parámetros de configuración
 * @param {string} params.alimentadorId - ID del alimentador
 * @param {string} params.tipoGrafico - Tipo de gráfico (line, area, bar)
 * @param {number|null} params.escalaYMax - Escala Y máxima (null = auto)
 * @param {string[]} params.coloresBarras - Colores para barras (solo si tipoGrafico='bar')
 * @returns {Object} Configuración completa de ApexCharts
 */
export const generarOpcionesGrafico = ({
   alimentadorId,
   tipoGrafico,
   escalaYMax,
   coloresBarras = [],
}) => {
   const opcionesBase = generarOpcionesBase({ alimentadorId, tipoGrafico, escalaYMax });

   switch (tipoGrafico) {
      case "line":
         return { ...opcionesBase, ...opcionesLinea };
      case "area":
         return { ...opcionesBase, ...opcionesArea };
      case "bar":
         return { ...opcionesBase, ...generarOpcionesBarras(coloresBarras) };
      default:
         return opcionesBase;
   }
};
