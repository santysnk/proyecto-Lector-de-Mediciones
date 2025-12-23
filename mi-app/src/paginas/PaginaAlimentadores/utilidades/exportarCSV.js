/**
 * Utilidad para exportar datos a formato CSV
 */

/**
 * Exporta datos a un archivo CSV descargable
 * @param {Array} datos - Array de objetos con los datos
 * @param {string} nombreArchivo - Nombre del archivo (sin extensión)
 * @param {Object} opciones - Opciones de configuración
 * @param {Array<string>} opciones.columnas - Columnas a incluir (orden)
 * @param {Object} opciones.etiquetas - Mapeo de nombres de columnas a etiquetas
 */
export const exportarCSV = (datos, nombreArchivo, opciones = {}) => {
  if (!datos || datos.length === 0) {
    console.warn("No hay datos para exportar");
    return;
  }

  const {
    columnas = ["timestamp", "valor"],
    etiquetas = {
      timestamp: "Fecha/Hora",
      valor: "Valor",
      valorCrudo: "Valor Crudo",
      variable: "Variable",
    },
  } = opciones;

  // Crear header con etiquetas
  const header = columnas.map((col) => etiquetas[col] || col);

  // Crear filas de datos
  const filas = datos.map((d) => {
    return columnas
      .map((col) => {
        let valor = obtenerValorColumna(d, col);

        // Escapar valores que contienen separadores
        if (typeof valor === "string" && (valor.includes(";") || valor.includes('"'))) {
          valor = `"${valor.replace(/"/g, '""')}"`;
        }

        return valor;
      })
      .join(";");
  });

  // Unir header y filas
  const contenidoCSV = [header.join(";"), ...filas].join("\n");

  // Crear blob con BOM para Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + contenidoCSV], {
    type: "text/csv;charset=utf-8;",
  });

  // Crear y ejecutar descarga
  descargarBlob(blob, `${nombreArchivo}.csv`);
};

/**
 * Obtiene el valor formateado para una columna específica
 * @param {Object} dato - Objeto con los datos
 * @param {string} columna - Nombre de la columna
 * @returns {string} - Valor formateado
 */
const obtenerValorColumna = (dato, columna) => {
  switch (columna) {
    case "timestamp":
      // Formatear timestamp a fecha legible
      const fecha = dato.x instanceof Date ? dato.x : new Date(dato.timestamp || dato.x);
      return formatearFecha(fecha);

    case "valor":
      // Valor calculado con fórmula
      const val = dato.y ?? dato.valor;
      return val != null ? val.toFixed(4).replace(".", ",") : "";

    case "valorCrudo":
      // Valor sin procesar
      const raw = dato.raw ?? dato.valorCrudo;
      return raw != null ? String(raw).replace(".", ",") : "";

    case "variable":
      return dato.variable || dato.etiqueta || "";

    default:
      const v = dato[columna];
      if (v == null) return "";
      if (typeof v === "number") return v.toString().replace(".", ",");
      return String(v);
  }
};

/**
 * Formatea una fecha para el CSV
 * @param {Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada DD/MM/YYYY HH:mm:ss
 */
const formatearFecha = (fecha) => {
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
    return "";
  }

  const pad = (n) => String(n).padStart(2, "0");

  const dia = pad(fecha.getDate());
  const mes = pad(fecha.getMonth() + 1);
  const anio = fecha.getFullYear();
  const hora = pad(fecha.getHours());
  const min = pad(fecha.getMinutes());
  const seg = pad(fecha.getSeconds());

  return `${dia}/${mes}/${anio} ${hora}:${min}:${seg}`;
};

/**
 * Descarga un blob como archivo
 * @param {Blob} blob - Blob a descargar
 * @param {string} nombreArchivo - Nombre del archivo
 */
const descargarBlob = (blob, nombreArchivo) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nombreArchivo;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Liberar memoria
  URL.revokeObjectURL(url);
};

/**
 * Exporta múltiples series de datos a CSV
 * @param {Array} series - Array de series [{nombre, datos}]
 * @param {string} nombreArchivo - Nombre del archivo
 */
export const exportarSeriesCSV = (series, nombreArchivo) => {
  if (!series || series.length === 0) return;

  // Combinar todas las series en un formato tabular
  const datosUnificados = [];

  series.forEach((serie) => {
    serie.datos.forEach((punto) => {
      datosUnificados.push({
        variable: serie.nombre,
        x: punto.x,
        y: punto.y,
        raw: punto.raw,
      });
    });
  });

  // Ordenar por timestamp
  datosUnificados.sort((a, b) => {
    const ta = a.x instanceof Date ? a.x.getTime() : a.x;
    const tb = b.x instanceof Date ? b.x.getTime() : b.x;
    return ta - tb;
  });

  exportarCSV(datosUnificados, nombreArchivo, {
    columnas: ["timestamp", "variable", "valor", "valorCrudo"],
    etiquetas: {
      timestamp: "Fecha/Hora",
      variable: "Variable",
      valor: "Valor Calculado",
      valorCrudo: "Valor Crudo",
    },
  });
};
