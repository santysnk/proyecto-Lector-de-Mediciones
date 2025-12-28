/**
 * Utilidad para exportar informes profesionales en formato PDF
 * Usa pdfmake para generar archivos .pdf con tablas, gráficos e información
 */

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Configurar fuentes de pdfmake
if (pdfFonts.pdfMake) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

// Colores del tema (en formato hex para pdfmake)
const COLORES = {
  primario: "#1E3A5F", // Azul oscuro
  secundario: "#0EA5E9", // Azul claro
  fondo: "#F8FAFC", // Gris muy claro
  texto: "#1E293B", // Gris oscuro
  borde: "#CBD5E1", // Gris medio
  minimo: "#DCFCE7", // Verde claro (para valor mínimo)
  maximo: "#FED7AA", // Naranja claro (para valor máximo)
  blanco: "#FFFFFF",
};

/**
 * Formatea una fecha para mostrar en el informe
 * @param {Date|number|string} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
const formatearFecha = (fecha) => {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return "--";

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Formatea solo la fecha (sin hora)
 * @param {Date|number|string} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
const formatearSoloFecha = (fecha) => {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return "--";

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/**
 * Genera la definición del documento PDF
 * @param {Object} config - Configuración del informe
 * @returns {Object} - Definición del documento para pdfmake
 */
const generarDefinicionPDF = (config) => {
  const {
    datos,
    tituloMedicion,
    nombreAlimentador,
    fechaDesde,
    fechaHasta,
    solicitadoPor,
    imagenGrafico,
    intervalo,
  } = config;

  // Calcular estadísticas
  let minimo = 0,
    maximo = 0,
    promedio = 0;
  let fechaMinimo = null,
    fechaMaximo = null;

  if (datos.length > 0) {
    const valores = datos.map((d) => d.y).filter((v) => v != null && !isNaN(v));
    minimo = Math.min(...valores);
    maximo = Math.max(...valores);
    promedio = valores.reduce((a, b) => a + b, 0) / valores.length;

    // Encontrar las fechas de los valores mínimo y máximo
    const puntoMin = datos.find((d) => d.y === minimo);
    const puntoMax = datos.find((d) => d.y === maximo);
    fechaMinimo = puntoMin?.x ? formatearFecha(puntoMin.x) : null;
    fechaMaximo = puntoMax?.x ? formatearFecha(puntoMax.x) : null;
  }

  // Texto del intervalo
  const textoIntervalo = intervalo
    ? intervalo === 0
      ? " (todos)"
      : ` (cada ${intervalo} min)`
    : "";

  // Construir contenido del PDF
  const contenido = [];

  // === TÍTULO PRINCIPAL CON FONDO AZUL (estilo Excel) ===
  contenido.push({
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: "INFORME DE MEDICIONES",
            fontSize: 16,
            bold: true,
            color: COLORES.blanco,
            fillColor: COLORES.primario,
            alignment: "center",
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLORES.borde,
      vLineColor: () => COLORES.borde,
      paddingTop: () => 12,
      paddingBottom: () => 12,
    },
    margin: [0, 0, 0, 0],
  });

  // === INFORMACIÓN Y ESTADÍSTICAS EN COLUMNAS (con borde exterior) ===
  contenido.push({
    table: {
      widths: ["*"],
      body: [
        [
          {
            columns: [
              // Columna izquierda: Información del informe
              {
                width: "55%",
                table: {
                  widths: ["auto", "*"],
                  body: [
                    [
                      { text: "Registros para:", style: "etiqueta" },
                      { text: nombreAlimentador, style: "valor" },
                    ],
                    [
                      { text: "Medición:", style: "etiqueta" },
                      { text: tituloMedicion, style: "valor" },
                    ],
                    [
                      { text: "Fecha de creación:", style: "etiqueta" },
                      { text: formatearFecha(new Date()), style: "valor" },
                    ],
                    [
                      { text: "Solicitado por:", style: "etiqueta" },
                      { text: solicitadoPor || "No especificado", style: "valor" },
                    ],
                    [
                      { text: "Período desde:", style: "etiqueta" },
                      { text: formatearFecha(fechaDesde), style: "valor" },
                    ],
                    [
                      { text: "Período hasta:", style: "etiqueta" },
                      { text: formatearFecha(fechaHasta), style: "valor" },
                    ],
                    [
                      { text: "Total de registros:", style: "etiqueta" },
                      { text: `${datos.length}${textoIntervalo}`, style: "valor" },
                    ],
                  ],
                },
                layout: {
                  hLineWidth: () => 0,
                  vLineWidth: () => 0,
                  paddingTop: () => 3,
                  paddingBottom: () => 3,
                },
              },
              // Columna derecha: Estadísticas
              {
                width: "45%",
                stack: [
                  {
                    text: "ESTADÍSTICAS",
                    style: "subtitulo",
                    alignment: "center",
                    margin: [0, 0, 0, 8],
                  },
                  {
                    table: {
                      widths: ["auto", "*"],
                      body: [
                        [
                          { text: "Valor mínimo:", style: "etiqueta", alignment: "right" },
                          {
                            stack: [
                              { text: minimo.toFixed(2), style: "valorEstadistica", alignment: "center" },
                              fechaMinimo
                                ? { text: fechaMinimo, fontSize: 8, color: COLORES.texto, alignment: "center" }
                                : null,
                            ].filter(Boolean),
                            fillColor: COLORES.minimo,
                          },
                        ],
                        [
                          { text: "Valor máximo:", style: "etiqueta", alignment: "right" },
                          {
                            stack: [
                              { text: maximo.toFixed(2), style: "valorEstadistica", alignment: "center" },
                              fechaMaximo
                                ? { text: fechaMaximo, fontSize: 8, color: COLORES.texto, alignment: "center" }
                                : null,
                            ].filter(Boolean),
                            fillColor: COLORES.maximo,
                          },
                        ],
                        [
                          { text: "Valor promedio:", style: "etiqueta", alignment: "right" },
                          { text: promedio.toFixed(2), style: "valorEstadistica", alignment: "center" },
                        ],
                      ],
                    },
                    layout: {
                      hLineWidth: () => 0.5,
                      vLineWidth: () => 0.5,
                      hLineColor: () => COLORES.borde,
                      vLineColor: () => COLORES.borde,
                      paddingTop: () => 4,
                      paddingBottom: () => 4,
                      paddingLeft: () => 8,
                      paddingRight: () => 8,
                    },
                  },
                ],
              },
            ],
            columnGap: 15,
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLORES.borde,
      vLineColor: () => COLORES.borde,
      paddingTop: () => 10,
      paddingBottom: () => 10,
      paddingLeft: () => 10,
      paddingRight: () => 10,
    },
    margin: [0, 0, 0, 20],
  });

  // === GRÁFICO (en página 2) ===
  if (imagenGrafico) {
    contenido.push({
      text: "GRÁFICO DE MEDICIONES",
      style: "subtitulo",
      alignment: "center",
      margin: [0, 10, 0, 10],
      pageBreak: "before",
    });

    contenido.push({
      image: imagenGrafico,
      width: 500,
      alignment: "center",
      margin: [0, 0, 0, 20],
    });
  }

  // === TABLA DE DATOS (en página 3+) ===
  if (datos.length > 0) {
    contenido.push({
      text: "DATOS DE MEDICIONES",
      style: "subtitulo",
      alignment: "center",
      margin: [0, 10, 0, 10],
      pageBreak: "before",
    });

    // Crear filas de la tabla
    const filasTabla = [
      // Encabezados
      [
        { text: "Fecha/Hora", style: "encabezadoTabla" },
        { text: "Valor de Medición", style: "encabezadoTabla" },
      ],
    ];

    // Datos
    datos.forEach((punto, index) => {
      const fecha = punto.x instanceof Date ? punto.x : new Date(punto.x);

      // Determinar color de fondo (comparar por valor, no por índice)
      let fillColor = index % 2 === 0 ? COLORES.fondo : COLORES.blanco;
      if (punto.y === minimo && minimo !== maximo) {
        fillColor = COLORES.minimo;
      } else if (punto.y === maximo && minimo !== maximo) {
        fillColor = COLORES.maximo;
      }

      filasTabla.push([
        {
          text: formatearFecha(fecha),
          style: "celdaTabla",
          fillColor,
        },
        {
          text: punto.y.toFixed(2),
          style: "celdaTabla",
          alignment: "center",
          fillColor,
        },
      ]);
    });

    contenido.push({
      table: {
        headerRows: 1,
        widths: ["*", "*"],
        body: filasTabla,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => COLORES.borde,
        vLineColor: () => COLORES.borde,
        paddingTop: () => 6,
        paddingBottom: () => 6,
        paddingLeft: () => 8,
        paddingRight: () => 8,
      },
    });
  }

  // Definición completa del documento
  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [40, 60, 40, 60],

    // Encabezado de cada página
    header: {
      columns: [
        {
          text: "RelayWatch - Informe de Mediciones",
          style: "header",
          alignment: "left",
          margin: [40, 20, 0, 0],
        },
        {
          text: formatearSoloFecha(new Date()),
          style: "header",
          alignment: "right",
          margin: [0, 20, 40, 0],
        },
      ],
    },

    // Pie de cada página
    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: `${nombreAlimentador} - ${tituloMedicion}`,
          style: "footer",
          alignment: "left",
          margin: [40, 0, 0, 0],
        },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          style: "footer",
          alignment: "right",
          margin: [0, 0, 40, 0],
        },
      ],
    }),

    content: contenido,

    // Estilos
    styles: {
      header: {
        fontSize: 9,
        color: COLORES.texto,
      },
      footer: {
        fontSize: 9,
        color: COLORES.texto,
      },
      tituloPrincipal: {
        fontSize: 16,
        bold: true,
        color: COLORES.blanco,
        fillColor: COLORES.primario,
      },
      titulo: {
        fontSize: 18,
        bold: true,
        color: COLORES.primario,
      },
      subtitulo: {
        fontSize: 14,
        bold: true,
        color: COLORES.primario,
      },
      etiqueta: {
        fontSize: 10,
        bold: true,
        color: COLORES.texto,
      },
      valor: {
        fontSize: 10,
        color: COLORES.texto,
      },
      valorEstadistica: {
        fontSize: 11,
        color: COLORES.texto,
        alignment: "center",
      },
      encabezadoTabla: {
        fontSize: 10,
        bold: true,
        color: COLORES.blanco,
        fillColor: COLORES.primario,
        alignment: "center",
      },
      celdaTabla: {
        fontSize: 9,
        color: COLORES.texto,
      },
    },

    // Configuración por defecto
    defaultStyle: {
      font: "Roboto",
    },
  };
};

/**
 * Genera y descarga un informe PDF con los datos de mediciones
 * @param {Object} config - Configuración del informe
 * @param {string} config.nombreAlimentador - Nombre del alimentador
 * @param {string} config.tituloMedicion - Título de la medición
 * @param {Array} config.datos - Datos de la zona actual [{x, y}]
 * @param {Date} config.fechaInicio - Fecha del primer registro
 * @param {Date} config.fechaFin - Fecha del último registro
 * @param {string} config.solicitadoPor - Nombre del solicitante
 * @param {string|null} config.imagenGrafico - Data URI de la imagen del gráfico
 * @param {number} config.intervalo - Intervalo de filtrado (0, 15, 30, 60 minutos)
 * @returns {Promise<string|null>} - Nombre del archivo o null si se canceló
 */
export const generarInformePDF = async (config) => {
  const {
    nombreAlimentador,
    tituloMedicion,
    datos,
    fechaInicio,
    fechaFin,
    solicitadoPor,
    imagenGrafico,
    intervalo,
  } = config;

  // Si no hay datos, no generar
  if (!datos || datos.length === 0) {
    console.warn("No hay datos para generar el informe PDF");
    return null;
  }

  // Generar definición del documento
  const docDefinition = generarDefinicionPDF({
    datos,
    tituloMedicion: tituloMedicion || "Mediciones",
    nombreAlimentador,
    fechaDesde: fechaInicio,
    fechaHasta: fechaFin,
    solicitadoPor,
    imagenGrafico,
    intervalo,
  });

  // Generar nombre de archivo
  const fechaArchivo = formatearSoloFecha(new Date()).replace(/\//g, "-");
  const nombreArchivo = `Informe_${nombreAlimentador}_${tituloMedicion}_${fechaArchivo}.pdf`;

  // Crear PDF y descargar
  return new Promise((resolve) => {
    const pdfDoc = pdfMake.createPdf(docDefinition);

    // Intentar usar File System Access API (Chrome/Edge) para elegir ubicación
    if ("showSaveFilePicker" in window) {
      pdfDoc.getBlob(async (blob) => {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: nombreArchivo,
            types: [
              {
                description: "Archivo PDF",
                accept: { "application/pdf": [".pdf"] },
              },
            ],
          });

          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();

          resolve(handle.name);
        } catch (err) {
          if (err.name === "AbortError") {
            resolve(null); // Usuario canceló
          } else {
            // Fallback a descarga directa
            pdfDoc.download(nombreArchivo);
            resolve(nombreArchivo);
          }
        }
      });
    } else {
      // Fallback: descarga directa
      pdfDoc.download(nombreArchivo);
      resolve(nombreArchivo);
    }
  });
};
