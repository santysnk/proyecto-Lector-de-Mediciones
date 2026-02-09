/**
 * Función principal para exportar informes PDF
 * Orquesta la carga lazy de pdfmake y la generación del documento
 */

import { formatearSoloFecha } from "./pdfEstilos";
import { generarDefinicionPDF } from "./pdfDefinicion";

/** Carga pdfmake bajo demanda (el bundler cachea automáticamente el chunk) */
const cargarPdfMake = async () => {
  const [{ default: pdfMake }, pdfFonts] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  if (pdfFonts.pdfMake?.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
  } else {
    // pdfmake >= 0.2.x exporta fuentes directamente como propiedades del módulo
    pdfMake.vfs = pdfFonts;
  }
  return pdfMake;
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

  if (!datos || datos.length === 0) {
    console.warn("No hay datos para generar el informe PDF");
    return null;
  }

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

  const fechaArchivo = formatearSoloFecha(new Date()).replace(/\//g, "-");
  const nombreArchivo = `Informe_${nombreAlimentador}_${tituloMedicion}_${fechaArchivo}.pdf`;

  const pdfMake = await cargarPdfMake();

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
            resolve(null);
          } else {
            pdfDoc.download(nombreArchivo);
            resolve(nombreArchivo);
          }
        }
      });
    } else {
      pdfDoc.download(nombreArchivo);
      resolve(nombreArchivo);
    }
  });
};
