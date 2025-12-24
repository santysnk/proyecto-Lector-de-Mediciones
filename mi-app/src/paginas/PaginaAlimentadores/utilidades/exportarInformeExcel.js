/**
 * Utilidad para exportar informes profesionales en formato Excel
 * Usa exceljs para generar archivos .xlsx con múltiples hojas,
 * estilos profesionales y resaltado de valores extremos
 */

import ExcelJS from "exceljs";

// Colores del tema
const COLORES = {
  primario: "1E3A5F", // Azul oscuro
  secundario: "0EA5E9", // Azul claro
  fondo: "F8FAFC", // Gris muy claro
  texto: "1E293B", // Gris oscuro
  borde: "CBD5E1", // Gris medio
  minimo: "DCFCE7", // Verde claro (para valor mínimo)
  maximo: "FED7AA", // Naranja claro (para valor máximo)
  blanco: "FFFFFF",
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
 * Descarga un archivo permitiendo al usuario elegir ubicación (si el navegador lo soporta)
 * @param {Blob} blob - Blob del archivo a descargar
 * @param {string} nombreArchivo - Nombre sugerido para el archivo
 * @returns {Promise<string>} - Nombre del archivo guardado
 */
const descargarArchivo = async (blob, nombreArchivo) => {
  // Intentar usar File System Access API (Chrome/Edge)
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: nombreArchivo,
        types: [
          {
            description: "Archivo Excel",
            accept: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      return handle.name;
    } catch (err) {
      // Si el usuario cancela el diálogo, err.name será "AbortError"
      if (err.name === "AbortError") {
        return null; // Usuario canceló
      }
      // Si hay otro error, usar fallback
      console.warn("showSaveFilePicker falló, usando método alternativo:", err);
    }
  }

  // Fallback: descarga directa a carpeta de descargas
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  return nombreArchivo;
};

/**
 * Aplica estilos de encabezado a una celda
 * @param {ExcelJS.Cell} celda - Celda a estilizar
 */
const estiloEncabezado = (celda) => {
  celda.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORES.primario },
  };
  celda.font = {
    bold: true,
    color: { argb: COLORES.blanco },
    size: 11,
  };
  celda.alignment = { horizontal: "center", vertical: "middle" };
  celda.border = {
    top: { style: "thin", color: { argb: COLORES.borde } },
    bottom: { style: "thin", color: { argb: COLORES.borde } },
    left: { style: "thin", color: { argb: COLORES.borde } },
    right: { style: "thin", color: { argb: COLORES.borde } },
  };
};

/**
 * Aplica estilos de celda de datos
 * @param {ExcelJS.Cell} celda - Celda a estilizar
 * @param {string|null} colorFondo - Color de fondo opcional (para min/max)
 * @param {boolean} esImpar - Si es fila impar (para alternar colores cuando no hay colorFondo)
 */
const estiloCelda = (celda, colorFondo = null, esImpar = false) => {
  if (colorFondo) {
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colorFondo },
    };
  } else if (esImpar) {
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORES.fondo },
    };
  }
  celda.border = {
    top: { style: "thin", color: { argb: COLORES.borde } },
    bottom: { style: "thin", color: { argb: COLORES.borde } },
    left: { style: "thin", color: { argb: COLORES.borde } },
    right: { style: "thin", color: { argb: COLORES.borde } },
  };
  celda.alignment = { horizontal: "center", vertical: "middle" };
};

/**
 * Aplica bordes a un rango de celdas (cuadro)
 * @param {ExcelJS.Worksheet} hoja - Hoja de trabajo
 * @param {number} filaInicio - Fila inicial
 * @param {number} filaFin - Fila final
 * @param {string} colInicio - Columna inicial (letra)
 * @param {string} colFin - Columna final (letra)
 */
const aplicarBordeCuadro = (hoja, filaInicio, filaFin, colInicio, colFin) => {
  const bordeDelgado = { style: "thin", color: { argb: COLORES.borde } };

  for (let fila = filaInicio; fila <= filaFin; fila++) {
    const celdaIzq = hoja.getCell(`${colInicio}${fila}`);
    const celdaDer = hoja.getCell(`${colFin}${fila}`);

    // Borde izquierdo
    celdaIzq.border = {
      ...celdaIzq.border,
      left: bordeDelgado,
    };
    // Borde derecho
    celdaDer.border = {
      ...celdaDer.border,
      right: bordeDelgado,
    };

    // Borde superior (primera fila)
    if (fila === filaInicio) {
      for (let col = colInicio.charCodeAt(0); col <= colFin.charCodeAt(0); col++) {
        const celda = hoja.getCell(`${String.fromCharCode(col)}${fila}`);
        celda.border = {
          ...celda.border,
          top: bordeDelgado,
        };
      }
    }
    // Borde inferior (última fila)
    if (fila === filaFin) {
      for (let col = colInicio.charCodeAt(0); col <= colFin.charCodeAt(0); col++) {
        const celda = hoja.getCell(`${String.fromCharCode(col)}${fila}`);
        celda.border = {
          ...celda.border,
          bottom: bordeDelgado,
        };
      }
    }
  }
};

/**
 * Crea una hoja con los datos de una zona
 * Layout: Info a la izquierda (B:C), Estadísticas a la derecha (E:F)
 * Tabla de datos en dos columnas si excede 39 filas
 * @param {ExcelJS.Workbook} workbook - Libro de Excel
 * @param {string} nombreHoja - Nombre de la hoja
 * @param {Object} config - Configuración
 * @param {Array} config.datos - Datos a exportar [{x: timestamp, y: valor}]
 * @param {string} config.tituloMedicion - Título de la medición
 * @param {string} config.nombreAlimentador - Nombre del alimentador
 * @param {Date} config.fechaDesde - Fecha inicio del rango (del primer dato)
 * @param {Date} config.fechaHasta - Fecha fin del rango (del último dato)
 * @param {string} config.solicitadoPor - Nombre del solicitante
 * @param {string|null} config.imagenGrafico - Data URI de la imagen del gráfico (base64)
 */
const crearHojaZona = (workbook, nombreHoja, config) => {
  const { datos, tituloMedicion, nombreAlimentador, fechaDesde, fechaHasta, solicitadoPor, imagenGrafico } = config;

  const hoja = workbook.addWorksheet(nombreHoja, {
    properties: { tabColor: { argb: COLORES.secundario } },
    pageSetup: { orientation: "landscape" }, // Orientación horizontal
  });

  // Configurar anchos de columna fijos
  hoja.columns = [
    { width: 1.5 },  // A
    { width: 7 },    // B
    { width: 25 },   // C
    { width: 25 },   // D
    { width: 2.3 },  // E - separador
    { width: 25 },   // F
    { width: 25 },   // G
    { width: 5 },    // H
    { width: 2.3 },  // I - separador
    { width: 25 },   // J
    { width: 25 },   // K
    { width: 2.3 },  // L - separador
    { width: 25 },   // M
    { width: 25 },   // N
  ];

  // Calcular estadísticas
  let minimo = 0, maximo = 0, promedio = 0;
  let indiceMin = 0, indiceMax = 0;

  if (datos.length > 0) {
    const valores = datos.map((d) => d.y).filter((v) => v != null && !isNaN(v));
    minimo = Math.min(...valores);
    maximo = Math.max(...valores);
    promedio = valores.reduce((a, b) => a + b, 0) / valores.length;

    datos.forEach((punto, index) => {
      if (punto.y === minimo) indiceMin = index;
      if (punto.y === maximo) indiceMax = index;
    });
  }

  // === FILA 2: TÍTULO PRINCIPAL (desde C2) ===
  hoja.mergeCells("C2:G2");
  const celdaTitulo = hoja.getCell("C2");
  celdaTitulo.value = "INFORME DE MEDICIONES";
  estiloEncabezado(celdaTitulo);
  celdaTitulo.font = { bold: true, size: 14, color: { argb: COLORES.blanco } };
  hoja.getRow(2).height = 30;

  // === APLICAR FONDO BLANCO Y BORDE EXTERNO AL ÁREA C2:G12 ===
  const bordeDelgado = { style: "thin", color: { argb: COLORES.borde } };

  // Fondo blanco para C3:G12
  for (let fila = 3; fila <= 12; fila++) {
    for (let col = "C".charCodeAt(0); col <= "G".charCodeAt(0); col++) {
      const celda = hoja.getCell(`${String.fromCharCode(col)}${fila}`);
      celda.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLORES.blanco },
      };
    }
  }

  // Borde externo del cuadro C2:G12
  // Borde izquierdo (columna C)
  for (let fila = 2; fila <= 12; fila++) {
    const celda = hoja.getCell(`C${fila}`);
    celda.border = { ...celda.border, left: bordeDelgado };
  }
  // Borde derecho (columna G)
  for (let fila = 2; fila <= 12; fila++) {
    const celda = hoja.getCell(`G${fila}`);
    celda.border = { ...celda.border, right: bordeDelgado };
  }
  // Borde superior (fila 2)
  for (let col = "C".charCodeAt(0); col <= "G".charCodeAt(0); col++) {
    const celda = hoja.getCell(`${String.fromCharCode(col)}2`);
    celda.border = { ...celda.border, top: bordeDelgado };
  }
  // Borde inferior (fila 12)
  for (let col = "C".charCodeAt(0); col <= "G".charCodeAt(0); col++) {
    const celda = hoja.getCell(`${String.fromCharCode(col)}12`);
    celda.border = { ...celda.border, bottom: bordeDelgado };
  }

  // === FILA 4: Registros para ===
  hoja.getCell("C4").value = "Registros para:";
  hoja.getCell("C4").font = { bold: true, color: { argb: COLORES.texto } };
  hoja.getCell("C4").alignment = { horizontal: "right", vertical: "middle" };
  hoja.getCell("D4").value = nombreAlimentador;
  hoja.getCell("D4").font = { color: { argb: COLORES.texto } };
  hoja.getCell("D4").alignment = { horizontal: "left", vertical: "middle" };

  // === FILA 5-6: Medición (ocupa 2 filas, con ajuste de texto) ===
  hoja.mergeCells("C5:C6");
  hoja.mergeCells("D5:D6");
  const celdaMedicionLabel = hoja.getCell("C5");
  const celdaMedicionValor = hoja.getCell("D5");

  celdaMedicionLabel.value = "Medición:";
  celdaMedicionLabel.font = { bold: true, color: { argb: COLORES.texto } };
  celdaMedicionLabel.alignment = { horizontal: "right", vertical: "middle", wrapText: true };

  celdaMedicionValor.value = tituloMedicion;
  celdaMedicionValor.font = { color: { argb: COLORES.texto } };
  celdaMedicionValor.alignment = { horizontal: "left", vertical: "middle", wrapText: true };

  // === FILA 7-11: Resto de info (desplazada una fila por Medición) ===
  const infoItemsRestantes = [
    ["Solicitado por:", solicitadoPor || "No especificado"],
    ["Fecha de creación:", formatearFecha(new Date())],
    ["Período desde:", formatearFecha(fechaDesde)],
    ["Período hasta:", formatearFecha(fechaHasta)],
    ["Total de registros:", datos.length.toString()],
  ];

  infoItemsRestantes.forEach(([etiqueta, valor], index) => {
    const fila = 7 + index; // Empieza en fila 7
    const celdaEtiqueta = hoja.getCell(`C${fila}`);
    const celdaValor = hoja.getCell(`D${fila}`);

    celdaEtiqueta.value = etiqueta;
    celdaEtiqueta.font = { bold: true, color: { argb: COLORES.texto } };
    celdaEtiqueta.alignment = { horizontal: "right", vertical: "middle" };

    celdaValor.value = valor;
    celdaValor.font = { color: { argb: COLORES.texto } };
    celdaValor.alignment = { horizontal: "left", vertical: "middle" };
  });

  // === ESTADÍSTICAS A LA DERECHA (F:G) ===
  if (datos.length > 0) {
    // Título ESTADÍSTICAS (fila 5)
    hoja.mergeCells("F5:G5");
    const celdaEstTitulo = hoja.getCell("F5");
    celdaEstTitulo.value = "ESTADÍSTICAS";
    celdaEstTitulo.font = { bold: true, size: 12, color: { argb: COLORES.primario } };
    celdaEstTitulo.alignment = { horizontal: "center", vertical: "middle" };
    // Re-aplicar borde derecho a la celda combinada (se pierde al hacer merge)
    celdaEstTitulo.border = { ...celdaEstTitulo.border, right: bordeDelgado };

    // Datos de estadísticas (filas 6-8)
    const estadisticas = [
      ["Valor mínimo:", minimo.toFixed(2)],
      ["Valor máximo:", maximo.toFixed(2)],
      ["Valor promedio:", promedio.toFixed(2)],
    ];

    estadisticas.forEach(([etiqueta, valor], index) => {
      const fila = 6 + index; // Empieza en fila 6
      const celdaEtiqueta = hoja.getCell(`F${fila}`);
      const celdaValor = hoja.getCell(`G${fila}`);

      celdaEtiqueta.value = etiqueta;
      celdaEtiqueta.font = { bold: true, color: { argb: COLORES.texto } };
      celdaEtiqueta.alignment = { horizontal: "right", vertical: "middle" };

      celdaValor.value = parseFloat(valor);
      celdaValor.numFmt = "0.00";
      celdaValor.font = { color: { argb: COLORES.texto } };
      celdaValor.alignment = { horizontal: "left", vertical: "middle" };
    });

    // Aplicar color verde al valor mínimo (G6) y naranja al máximo (G7)
    hoja.getCell("G6").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORES.minimo },
    };
    hoja.getCell("G7").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORES.maximo },
    };
  }

  // === IMAGEN DEL GRÁFICO (si está disponible) ===
  if (imagenGrafico) {
    try {
      // Extraer base64 del data URI
      const base64Data = imagenGrafico.split(",")[1];

      // Agregar imagen al workbook
      const imageId = workbook.addImage({
        base64: base64Data,
        extension: "png",
      });

      // Insertar imagen en celda B35 (col 1 en 0-indexed, row 34 en 0-indexed)
      // Tamaño: 850x475 píxeles
      hoja.addImage(imageId, {
        tl: { col: 1, row: 34 }, // B35 (0-indexed)
        ext: { width: 850, height: 475 },
      });
    } catch (err) {
      console.warn("Error al insertar imagen en Excel:", err);
    }
  }

  // === TABLA DE DATOS (desde J2) ===
  if (datos.length > 0) {
    const FILA_INICIO_DATOS = 2; // Siempre empieza en fila 2
    const MAX_FILAS_COLUMNA = 39;
    const usarDosColumnas = datos.length > MAX_FILAS_COLUMNA;

    // Título de la tabla
    if (usarDosColumnas) {
      hoja.mergeCells(`J${FILA_INICIO_DATOS}:N${FILA_INICIO_DATOS}`);
    } else {
      hoja.mergeCells(`J${FILA_INICIO_DATOS}:K${FILA_INICIO_DATOS}`);
    }
    const celdaDatosTitulo = hoja.getCell(`J${FILA_INICIO_DATOS}`);
    celdaDatosTitulo.value = "DATOS DE MEDICIONES";
    celdaDatosTitulo.font = { bold: true, size: 12, color: { argb: COLORES.primario } };
    celdaDatosTitulo.alignment = { horizontal: "center", vertical: "middle" };
    hoja.getRow(FILA_INICIO_DATOS).height = 25;

    const filaEncabezados = FILA_INICIO_DATOS + 1;

    // Encabezados columna 1 (J:K)
    const encFecha1 = hoja.getCell(`J${filaEncabezados}`);
    const encValor1 = hoja.getCell(`K${filaEncabezados}`);
    encFecha1.value = "Fecha/Hora";
    encValor1.value = "Valor de Medicion";
    estiloEncabezado(encFecha1);
    estiloEncabezado(encValor1);

    // Encabezados columna 2 (M:N) si es necesario
    if (usarDosColumnas) {
      const encFecha2 = hoja.getCell(`M${filaEncabezados}`);
      const encValor2 = hoja.getCell(`N${filaEncabezados}`);
      encFecha2.value = "Fecha/Hora";
      encValor2.value = "Valor de Medicion";
      estiloEncabezado(encFecha2);
      estiloEncabezado(encValor2);
    }

    hoja.getRow(filaEncabezados).height = 22;

    const filaPrimerDato = filaEncabezados + 1;

    // Escribir datos
    datos.forEach((punto, index) => {
      const fecha = punto.x instanceof Date ? punto.x : new Date(punto.x);

      // Determinar color de fondo según si es min, max o normal
      let colorFondo = null;
      if (index === indiceMin && minimo !== maximo) {
        colorFondo = COLORES.minimo; // Verde para mínimo
      } else if (index === indiceMax && minimo !== maximo) {
        colorFondo = COLORES.maximo; // Naranja para máximo
      }

      let colFecha, colValor, filaDestino;

      if (usarDosColumnas) {
        // Distribuir en dos columnas
        const mitad = Math.ceil(datos.length / 2);
        if (index < mitad) {
          // Primera columna (J:K)
          colFecha = "J";
          colValor = "K";
          filaDestino = filaPrimerDato + index;
        } else {
          // Segunda columna (M:N)
          colFecha = "M";
          colValor = "N";
          filaDestino = filaPrimerDato + (index - mitad);
        }
      } else {
        // Una sola columna (J:K)
        colFecha = "J";
        colValor = "K";
        filaDestino = filaPrimerDato + index;
      }

      const celdaFecha = hoja.getCell(`${colFecha}${filaDestino}`);
      const celdaValor = hoja.getCell(`${colValor}${filaDestino}`);

      celdaFecha.value = fecha;
      celdaFecha.numFmt = "DD/MM/YYYY HH:mm";

      celdaValor.value = punto.y;
      celdaValor.numFmt = "0.00";

      estiloCelda(celdaFecha, colorFondo, index % 2 === 0);
      estiloCelda(celdaValor, colorFondo, index % 2 === 0);
    });
  }

  return hoja;
};

/**
 * Genera y descarga un informe Excel con los datos de mediciones
 * @param {Object} config - Configuración del informe
 * @param {string} config.nombreAlimentador - Nombre del alimentador
 * @param {Array} config.datosZonaSuperior - Datos de zona superior [{x, y}]
 * @param {Array} config.datosZonaInferior - Datos de zona inferior [{x, y}]
 * @param {string} config.tituloZonaSuperior - Título de zona superior
 * @param {string} config.tituloZonaInferior - Título de zona inferior
 * @param {Date} config.fechaDesde - Fecha inicio
 * @param {Date} config.fechaHasta - Fecha fin
 * @param {string} config.solicitadoPor - Nombre del solicitante
 */
export const generarInformeExcel = async (config) => {
  const {
    nombreAlimentador,
    datosZonaSuperior,
    datosZonaInferior,
    tituloZonaSuperior,
    tituloZonaInferior,
    fechaDesde,
    fechaHasta,
    solicitadoPor,
  } = config;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RelayWatch";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Crear hoja para zona superior si hay datos
  if (datosZonaSuperior && datosZonaSuperior.length > 0) {
    crearHojaZona(workbook, tituloZonaSuperior || "Superior", {
      datos: datosZonaSuperior,
      tituloMedicion: tituloZonaSuperior || "Superior",
      nombreAlimentador,
      fechaDesde,
      fechaHasta,
      solicitadoPor,
    });
  }

  // Crear hoja para zona inferior si hay datos
  if (datosZonaInferior && datosZonaInferior.length > 0) {
    crearHojaZona(workbook, tituloZonaInferior || "Inferior", {
      datos: datosZonaInferior,
      tituloMedicion: tituloZonaInferior || "Inferior",
      nombreAlimentador,
      fechaDesde,
      fechaHasta,
      solicitadoPor,
    });
  }

  // Si no hay datos en ninguna zona, crear una hoja vacía
  if (
    (!datosZonaSuperior || datosZonaSuperior.length === 0) &&
    (!datosZonaInferior || datosZonaInferior.length === 0)
  ) {
    const hoja = workbook.addWorksheet("Sin datos");
    hoja.getCell("B2").value = "No hay datos para exportar";
  }

  // Generar nombre de archivo
  const fechaArchivo = formatearSoloFecha(new Date()).replace(/\//g, "-");
  const nombreArchivo = `Informe_${nombreAlimentador}_${fechaArchivo}.xlsx`;

  // Generar buffer y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return await descargarArchivo(blob, nombreArchivo);
};

/**
 * Genera un informe Excel solo con la zona actual visible
 * @param {Object} config - Configuración
 * @param {string} config.nombreAlimentador - Nombre del alimentador
 * @param {string} config.tituloMedicion - Título de la medición
 * @param {Array} config.datos - Datos de la zona actual
 * @param {Date} config.fechaInicio - Fecha del primer registro
 * @param {Date} config.fechaFin - Fecha del último registro
 * @param {string} config.solicitadoPor - Nombre del solicitante
 * @param {string|null} config.imagenGrafico - Data URI de la imagen del gráfico
 */
export const generarInformeZonaExcel = async (config) => {
  const { nombreAlimentador, tituloMedicion, datos, fechaInicio, fechaFin, solicitadoPor, imagenGrafico } = config;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RelayWatch";
  workbook.created = new Date();
  workbook.modified = new Date();

  if (datos && datos.length > 0) {
    crearHojaZona(workbook, tituloMedicion || "Mediciones", {
      datos,
      tituloMedicion: tituloMedicion || "Mediciones",
      nombreAlimentador,
      fechaDesde: fechaInicio,
      fechaHasta: fechaFin,
      solicitadoPor,
      imagenGrafico,
    });
  } else {
    const hoja = workbook.addWorksheet("Sin datos");
    hoja.getCell("B2").value = "No hay datos para exportar";
  }

  const fechaArchivo = formatearSoloFecha(new Date()).replace(/\//g, "-");
  const nombreArchivo = `Informe_${nombreAlimentador}_${tituloMedicion}_${fechaArchivo}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return await descargarArchivo(blob, nombreArchivo);
};
