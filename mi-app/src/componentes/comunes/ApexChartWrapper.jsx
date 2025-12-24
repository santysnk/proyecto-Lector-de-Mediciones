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
     * @param {Object} exportOptions - Opciones adicionales para dataURI
     * @returns {Promise<{imgURI: string}>} - Imagen en formato data URI
     */
    async captureForReport(exportOptions = {}) {
      const chart = chartInstanceRef.current;
      if (!chart || typeof chart.dataURI !== "function") {
        return { imgURI: null };
      }

      // Guardar opciones actuales para restaurar después
      const opcionesOriginales = { ...options };

      // Opciones optimizadas para exportación a informe (fondo blanco, texto negro, fuentes grandes)
      // Deshabilitamos tooltip y estados de hover para evitar que aparezcan puntos/markers
      const opcionesExport = {
        chart: {
          ...options.chart,
          background: "#ffffff",
          foreColor: "#1a1a1a",
        },
        states: {
          hover: {
            filter: {
              type: "none", // Sin efecto de hover
            },
          },
          active: {
            filter: {
              type: "none", // Sin efecto de click
            },
          },
        },
        markers: {
          ...options.markers,
          hover: {
            size: 0, // Sin markers de hover
          },
        },
        tooltip: {
          enabled: false, // Deshabilitar tooltip completamente para la captura
        },
        xaxis: {
          ...options.xaxis,
          crosshairs: {
            show: false, // Sin línea vertical de crosshair
          },
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
          title: {
            ...options.xaxis?.title,
            style: {
              color: "#1a1a1a",
              fontSize: "17px",
              fontWeight: 700,
            },
          },
        },
        yaxis: {
          ...options.yaxis,
          crosshairs: {
            show: false, // Sin línea horizontal de crosshair
          },
          labels: {
            ...options.yaxis?.labels,
            style: {
              ...options.yaxis?.labels?.style,
              colors: "#1a1a1a",
              fontSize: "16px",
              fontWeight: 600,
            },
          },
          title: {
            ...options.yaxis?.title,
            style: {
              color: "#1a1a1a",
              fontSize: "17px",
              fontWeight: 700,
            },
          },
        },
        grid: {
          ...options.grid,
          borderColor: "#bbbbbb",
        },
      };

      try {
        // Aplicar opciones de exportación temporalmente
        await chart.updateOptions(opcionesExport, false, false);

        // Pequeña pausa para que el chart se actualice
        await new Promise(resolve => setTimeout(resolve, 100));

        // Capturar imagen
        const result = await chart.dataURI({ scale: exportOptions.scale || 2 });

        // Restaurar opciones originales
        await chart.updateOptions(opcionesOriginales, false, false);

        return result;
      } catch (err) {
        // Intentar restaurar opciones originales en caso de error
        try {
          await chart.updateOptions(opcionesOriginales, false, false);
        } catch (e) {
          // Ignorar
        }
        throw err;
      }
    }
  }), [options]);

  // Efecto principal: crear/destruir el chart
  useEffect(() => {
    // Si no hay contenedor, salir
    if (!containerRef.current) return;

    // Limpiar cualquier chart anterior que pudiera existir
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.destroy();
      } catch (e) {
        // Ignorar errores de destrucción
      }
      chartInstanceRef.current = null;
    }

    // Crear configuración completa del chart
    const chartConfig = {
      ...options,
      chart: {
        ...options.chart,
        type: type || options.chart?.type || "line",
        height: height || options.chart?.height || "100%",
        width: width || options.chart?.width || "100%",
      },
      series: series || [],
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
        } catch (e) {
          // Ignorar errores durante cleanup
        }
        chartInstanceRef.current = null;
      }
    };
  }, []); // Solo al montar/desmontar

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
