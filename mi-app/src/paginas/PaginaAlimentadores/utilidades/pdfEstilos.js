/**
 * Estilos, colores y helpers de formato para generación de informes PDF
 */

/** Colores del tema (en formato hex para pdfmake) */
export const COLORES = {
  primario: "#1E3A5F",
  secundario: "#0EA5E9",
  fondo: "#F8FAFC",
  texto: "#1E293B",
  borde: "#CBD5E1",
  minimo: "#DCFCE7",
  maximo: "#FED7AA",
  blanco: "#FFFFFF",
};

/**
 * Formatea una fecha para mostrar en el informe
 * @param {Date|number|string} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatearFecha = (fecha) => {
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
export const formatearSoloFecha = (fecha) => {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return "--";

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/** Estilos del documento PDF */
export const ESTILOS_PDF = {
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
};

/** Layout de bordes estándar para tablas */
export const layoutBordes = () => ({
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => COLORES.borde,
  vLineColor: () => COLORES.borde,
});
