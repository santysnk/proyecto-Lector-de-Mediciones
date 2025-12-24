/**
 * Wrapper personalizado para ApexCharts que maneja correctamente
 * el ciclo de vida con React 18 StrictMode.
 *
 * Soluciona el problema conocido de react-apexcharts donde el doble montaje
 * de StrictMode causa errores "parentNode is null" y "Element not found".
 *
 * Usa ApexCharts directamente en lugar del wrapper react-apexcharts.
 */

import { useEffect, useRef, useImperativeHandle, forwardRef, memo } from "react";
import ApexCharts from "apexcharts";

const ApexChartWrapper = forwardRef(({ options, series, type, height, width }, ref) => {
  const containerRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Exponer el chart instance y métodos útiles al componente padre via ref
  useImperativeHandle(ref, () => ({
    get chart() {
      return chartInstanceRef.current;
    },
    /**
     * Captura la imagen del gráfico con estilo optimizado para informes
     * (fondo blanco, texto negro, fuentes más grandes)
     * Crea un gráfico temporal oculto para la captura, sin afectar el visible.
     * @param {Object} exportOptions - Opciones adicionales para dataURI
     * @returns {Promise<{imgURI: string}>} - Imagen en formato data URI
     */
    async captureForReport(exportOptions = {}) {
      const chart = chartInstanceRef.current;
      if (!chart) {
        return { imgURI: null };
      }

      // Crear un contenedor temporal oculto para el gráfico de exportación
      const tempContainer = document.createElement("div");
      tempContainer.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:1200px;height:600px;";
      document.body.appendChild(tempContainer);

      // Opciones optimizadas para exportación a informe (fondo blanco, texto negro, fuentes grandes)
      const opcionesExport = {
        ...options,
        chart: {
          ...options.chart,
          id: `export-temp-${Date.now()}`,
          background: "#ffffff",
          foreColor: "#1a1a1a",
          animations: { enabled: false },
          toolbar: { show: false },
          width: 1200,
          height: 600,
        },
        states: {
          hover: { filter: { type: "none" } },
          active: { filter: { type: "none" } },
        },
        markers: {
          ...options.markers,
          hover: { size: 0 },
        },
        tooltip: { enabled: false },
        xaxis: {
          ...options.xaxis,
          crosshairs: { show: false },
          labels: {
            ...options.xaxis?.labels,
            style: {
              ...options.xaxis?.labels?.style,
              colors: "#1a1a1a",
              fontSize: "16px",
              fontWeight: 600,
            },
          },
          axisBorder: { color: "#333333", show: true },
          axisTicks: { color: "#333333", show: true },
        },
        yaxis: {
          ...options.yaxis,
          crosshairs: { show: false },
          labels: {
            ...options.yaxis?.labels,
            style: {
              ...options.yaxis?.labels?.style,
              colors: "#1a1a1a",
              fontSize: "16px",
              fontWeight: 600,
            },
          },
        },
        grid: {
          ...options.grid,
          borderColor: "#bbbbbb",
        },
      };

      let tempChart = null;
      try {
        // Crear gráfico temporal con las opciones de exportación
        tempChart = new ApexCharts(tempContainer, {
          ...opcionesExport,
          series: chart.w.config.series, // Usar las series actuales
        });
        await tempChart.render();

        // Pequeña pausa para asegurar que el gráfico se renderice
        await new Promise(resolve => setTimeout(resolve, 150));

        // Capturar imagen del gráfico temporal
        const result = await tempChart.dataURI({ scale: exportOptions.scale || 2 });

        return result;
      } catch (err) {
        console.warn("Error capturando gráfico para informe:", err);
        return { imgURI: null };
      } finally {
        // Limpiar: destruir gráfico temporal y remover contenedor
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
    }
  }), [options]);

  // Refs para valores iniciales (evita re-crear el chart cuando cambian)
  const initialOptionsRef = useRef(options);
  const initialSeriesRef = useRef(series);
  const initialTypeRef = useRef(type);
  const initialHeightRef = useRef(height);
  const initialWidthRef = useRef(width);

  // Efecto principal: crear/destruir el chart (solo al montar/desmontar)
  useEffect(() => {
    // Si no hay contenedor, salir
    if (!containerRef.current) return;

    // Limpiar cualquier chart anterior que pudiera existir
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.destroy();
      } catch {
        // Ignorar errores de destrucción
      }
      chartInstanceRef.current = null;
    }

    // Usar valores iniciales de los refs
    const opts = initialOptionsRef.current;
    const ser = initialSeriesRef.current;
    const t = initialTypeRef.current;
    const h = initialHeightRef.current;
    const w = initialWidthRef.current;

    // Crear configuración completa del chart
    const chartConfig = {
      ...opts,
      chart: {
        ...opts.chart,
        type: t || opts.chart?.type || "line",
        height: h || opts.chart?.height || "100%",
        width: w || opts.chart?.width || "100%",
      },
      series: ser || [],
    };

    // Crear nueva instancia
    const chart = new ApexCharts(containerRef.current, chartConfig);
    chartInstanceRef.current = chart;

    // Renderizar el chart
    chart.render();

    // Cleanup: destruir chart cuando el componente se desmonte
    return () => {
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.destroy();
        } catch {
          // Ignorar errores durante cleanup
        }
        chartInstanceRef.current = null;
      }
    };
  }, []); // Solo al montar/desmontar - las actualizaciones se hacen en otros effects

  // Efecto para actualizar opciones cuando cambien
  useEffect(() => {
    if (!chartInstanceRef.current) return;

    try {
      chartInstanceRef.current.updateOptions(
        {
          ...options,
          chart: {
            ...options.chart,
            type: type || options.chart?.type || "line",
          },
        },
        false, // No redraw
        true   // Animate
      );
    } catch (e) {
      console.warn("Error actualizando opciones del chart:", e);
    }
  }, [options, type]);

  // Efecto para actualizar series cuando cambien
  useEffect(() => {
    if (!chartInstanceRef.current) return;

    try {
      chartInstanceRef.current.updateSeries(series || [], true);
    } catch (e) {
      console.warn("Error actualizando series del chart:", e);
    }
  }, [series]);

  return (
    <div
      ref={containerRef}
      style={{
        width: width || "100%",
        height: height || "100%",
        minHeight: "200px",
      }}
    />
  );
});

ApexChartWrapper.displayName = "ApexChartWrapper";

export default memo(ApexChartWrapper);
