/**
 * Generación de la definición del documento PDF para pdfmake
 */

import { COLORES, ESTILOS_PDF, layoutBordes, formatearFecha, formatearSoloFecha } from "./pdfEstilos";

/**
 * Genera la definición del documento PDF
 * @param {Object} config - Configuración del informe
 * @returns {Object} - Definición del documento para pdfmake
 */
export const generarDefinicionPDF = (config) => {
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
  const estadisticas = calcularEstadisticas(datos);
  const textoIntervalo = intervalo
    ? intervalo === 0 ? " (todos)" : ` (cada ${intervalo} min)`
    : "";

  const contenido = [];

  // Título principal
  contenido.push(crearTituloPrincipal());

  // Información y estadísticas en columnas
  contenido.push(crearSeccionInfoEstadisticas({
    nombreAlimentador,
    tituloMedicion,
    solicitadoPor,
    fechaDesde,
    fechaHasta,
    datos,
    textoIntervalo,
    estadisticas,
  }));

  // Gráfico (en página 2)
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

  // Tabla de datos (en página 3+)
  if (datos.length > 0) {
    contenido.push(crearTablaDatos(datos, estadisticas));
  }

  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [40, 60, 40, 60],
    header: {
      columns: [
        { text: "RelayWatch - Informe de Mediciones", style: "header", alignment: "left", margin: [40, 20, 0, 0] },
        { text: formatearSoloFecha(new Date()), style: "header", alignment: "right", margin: [0, 20, 40, 0] },
      ],
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `${nombreAlimentador} - ${tituloMedicion}`, style: "footer", alignment: "left", margin: [40, 0, 0, 0] },
        { text: `Página ${currentPage} de ${pageCount}`, style: "footer", alignment: "right", margin: [0, 0, 40, 0] },
      ],
    }),
    content: contenido,
    styles: ESTILOS_PDF,
    defaultStyle: { font: "Roboto" },
  };
};

/** Calcula estadísticas de los datos */
function calcularEstadisticas(datos) {
  if (datos.length === 0) {
    return { minimo: 0, maximo: 0, promedio: 0, fechaMinimo: null, fechaMaximo: null };
  }

  const valores = datos.map((d) => d.y).filter((v) => v != null && !isNaN(v));
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;

  const puntoMin = datos.find((d) => d.y === minimo);
  const puntoMax = datos.find((d) => d.y === maximo);

  return {
    minimo,
    maximo,
    promedio,
    fechaMinimo: puntoMin?.x ? formatearFecha(puntoMin.x) : null,
    fechaMaximo: puntoMax?.x ? formatearFecha(puntoMax.x) : null,
  };
}

/** Crea el bloque del título principal con fondo azul */
function crearTituloPrincipal() {
  return {
    table: {
      widths: ["*"],
      body: [[{
        text: "INFORME DE MEDICIONES",
        fontSize: 16,
        bold: true,
        color: COLORES.blanco,
        fillColor: COLORES.primario,
        alignment: "center",
      }]],
    },
    layout: { ...layoutBordes(), paddingTop: () => 12, paddingBottom: () => 12 },
    margin: [0, 0, 0, 0],
  };
}

/** Crea la sección de información y estadísticas en columnas */
function crearSeccionInfoEstadisticas(params) {
  const { nombreAlimentador, tituloMedicion, solicitadoPor, fechaDesde, fechaHasta, datos, textoIntervalo, estadisticas } = params;
  const { minimo, maximo, promedio, fechaMinimo, fechaMaximo } = estadisticas;

  return {
    table: {
      widths: ["*"],
      body: [[{
        columns: [
          {
            width: "55%",
            table: {
              widths: ["auto", "*"],
              body: [
                [{ text: "Registros para:", style: "etiqueta" }, { text: nombreAlimentador, style: "valor" }],
                [{ text: "Medición:", style: "etiqueta" }, { text: tituloMedicion, style: "valor" }],
                [{ text: "Fecha de creación:", style: "etiqueta" }, { text: formatearFecha(new Date()), style: "valor" }],
                [{ text: "Solicitado por:", style: "etiqueta" }, { text: solicitadoPor || "No especificado", style: "valor" }],
                [{ text: "Período desde:", style: "etiqueta" }, { text: formatearFecha(fechaDesde), style: "valor" }],
                [{ text: "Período hasta:", style: "etiqueta" }, { text: formatearFecha(fechaHasta), style: "valor" }],
                [{ text: "Total de registros:", style: "etiqueta" }, { text: `${datos.length}${textoIntervalo}`, style: "valor" }],
              ],
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingTop: () => 3, paddingBottom: () => 3 },
          },
          {
            width: "45%",
            stack: [
              { text: "ESTADÍSTICAS", style: "subtitulo", alignment: "center", margin: [0, 0, 0, 8] },
              {
                table: {
                  widths: ["auto", "*"],
                  body: [
                    [
                      { text: "Valor mínimo:", style: "etiqueta", alignment: "right" },
                      {
                        stack: [
                          { text: minimo.toFixed(2), style: "valorEstadistica", alignment: "center" },
                          fechaMinimo ? { text: fechaMinimo, fontSize: 8, color: COLORES.texto, alignment: "center" } : null,
                        ].filter(Boolean),
                        fillColor: COLORES.minimo,
                      },
                    ],
                    [
                      { text: "Valor máximo:", style: "etiqueta", alignment: "right" },
                      {
                        stack: [
                          { text: maximo.toFixed(2), style: "valorEstadistica", alignment: "center" },
                          fechaMaximo ? { text: fechaMaximo, fontSize: 8, color: COLORES.texto, alignment: "center" } : null,
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
                layout: { ...layoutBordes(), paddingTop: () => 4, paddingBottom: () => 4, paddingLeft: () => 8, paddingRight: () => 8 },
              },
            ],
          },
        ],
        columnGap: 15,
      }]],
    },
    layout: { ...layoutBordes(), paddingTop: () => 10, paddingBottom: () => 10, paddingLeft: () => 10, paddingRight: () => 10 },
    margin: [0, 0, 0, 20],
  };
}

/** Crea la tabla de datos de mediciones */
function crearTablaDatos(datos, estadisticas) {
  const { minimo, maximo } = estadisticas;

  const filasTabla = [
    [{ text: "Fecha/Hora", style: "encabezadoTabla" }, { text: "Valor de Medición", style: "encabezadoTabla" }],
  ];

  datos.forEach((punto, index) => {
    const fecha = punto.x instanceof Date ? punto.x : new Date(punto.x);

    let fillColor = index % 2 === 0 ? COLORES.fondo : COLORES.blanco;
    if (punto.y === minimo && minimo !== maximo) {
      fillColor = COLORES.minimo;
    } else if (punto.y === maximo && minimo !== maximo) {
      fillColor = COLORES.maximo;
    }

    filasTabla.push([
      { text: formatearFecha(fecha), style: "celdaTabla", fillColor },
      { text: punto.y.toFixed(2), style: "celdaTabla", alignment: "center", fillColor },
    ]);
  });

  return {
    stack: [
      { text: "DATOS DE MEDICIONES", style: "subtitulo", alignment: "center", margin: [0, 10, 0, 10], pageBreak: "before" },
      {
        table: { headerRows: 1, widths: ["*", "*"], body: filasTabla },
        layout: { ...layoutBordes(), paddingTop: () => 6, paddingBottom: () => 6, paddingLeft: () => 8, paddingRight: () => 8 },
      },
    ],
  };
}
