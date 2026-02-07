// @ts-check
/**
 * Funciones de interpretación de registros Modbus para relés ABB REF615/RET615
 *
 * MODO DE FUNCIONAMIENTO:
 * 1. Si la plantilla tiene etiquetas personalizadas para el registro, se usan esas
 * 2. Si no, se usan las etiquetas por defecto de definicionesRegistros.js
 */

import { MAPA_REGISTROS, CATEGORIAS_INTERPRETABLES } from "./definicionesRegistros";

/**
 * Interpreta un valor de registro y devuelve los bits activos con su significado
 * @param {number} numeroRegistro - Número del registro Modbus
 * @param {number} valor - Valor leído del registro (0-65535)
 * @param {Object} etiquetasPersonalizadas - Etiquetas de la plantilla (opcional)
 *        Formato: { 0: { texto: "Arranque I>", severidad: "warning" }, ... }
 * @returns {Object} Interpretación del registro
 */
export function interpretarRegistro(numeroRegistro, valor, etiquetasPersonalizadas = null) {
  const definicionBase = MAPA_REGISTROS[numeroRegistro];

  const tieneEtiquetasPersonalizadas = etiquetasPersonalizadas &&
    Object.keys(etiquetasPersonalizadas).length > 0;

  // Si no hay definición base ni etiquetas personalizadas, hacer decodificación genérica
  if (!definicionBase && !tieneEtiquetasPersonalizadas) {
    return interpretarGenerico(numeroRegistro, valor);
  }

  const bitsActivos = [];
  const bitsInactivos = [];

  // Analizar bits 0-15 para registro de 16 bits
  for (let posicion = 0; posicion < 16; posicion++) {
    const estaActivo = ((valor >> posicion) & 1) === 1;

    let etiqueta = null;
    let severidad = "info";
    let descripcion = `Bit ${posicion}`;

    if (tieneEtiquetasPersonalizadas && etiquetasPersonalizadas[posicion]) {
      const etiquetaPersonalizada = etiquetasPersonalizadas[posicion];
      etiqueta = etiquetaPersonalizada.texto || etiquetaPersonalizada;
      severidad = etiquetaPersonalizada.severidad || "info";
      descripcion = etiqueta;
    } else if (definicionBase && definicionBase.bits[posicion]) {
      const bitBase = definicionBase.bits[posicion];
      etiqueta = bitBase.nombre;
      severidad = bitBase.tipo;
      descripcion = bitBase.descripcion;
    }

    // Solo incluir bits que tienen etiqueta definida
    if (etiqueta) {
      const bitData = { posicion, nombre: etiqueta, descripcion, tipo: severidad, activo: estaActivo };

      if (estaActivo) {
        bitsActivos.push(bitData);
      } else {
        bitsInactivos.push(bitData);
      }
    }
  }

  // Interpretación especial si existe en la definición base
  let interpretacionEspecial = null;
  if (definicionBase && definicionBase.interpretacionEspecial) {
    interpretacionEspecial = definicionBase.interpretacionEspecial(valor);
  }

  const nombreRegistro = definicionBase?.nombre || `Registro ${numeroRegistro}`;
  const descripcionRegistro = definicionBase?.descripcion || "Registro con etiquetas personalizadas";

  return {
    tieneInterpretacion: true,
    usaEtiquetasPersonalizadas: tieneEtiquetasPersonalizadas,
    numeroRegistro,
    valor,
    binario: valor.toString(2).padStart(16, "0"),
    hexadecimal: "0x" + valor.toString(16).toUpperCase().padStart(4, "0"),
    nombreRegistro,
    descripcionRegistro,
    bitsActivos,
    bitsInactivos,
    interpretacionEspecial,
    resumen: generarResumen(bitsActivos, interpretacionEspecial)
  };
}

/**
 * Interpretación genérica para registros sin definición
 */
function interpretarGenerico(numeroRegistro, valor) {
  const bitsActivos = [];

  for (let posicion = 0; posicion < 16; posicion++) {
    if (((valor >> posicion) & 1) === 1) {
      bitsActivos.push({
        posicion,
        nombre: `Bit ${posicion}`,
        descripcion: `Bit ${posicion} activo`,
        tipo: "info",
        activo: true
      });
    }
  }

  return {
    tieneInterpretacion: true,
    usaEtiquetasPersonalizadas: false,
    numeroRegistro,
    valor,
    binario: valor.toString(2).padStart(16, "0"),
    hexadecimal: "0x" + valor.toString(16).toUpperCase().padStart(4, "0"),
    nombreRegistro: `Registro ${numeroRegistro}`,
    descripcionRegistro: "Sin definición de etiquetas",
    bitsActivos,
    bitsInactivos: [],
    interpretacionEspecial: null,
    resumen: bitsActivos.length > 0
      ? `${bitsActivos.length} bit(s) activo(s): ${bitsActivos.map(b => b.posicion).join(", ")}`
      : "Sin bits activos"
  };
}

/**
 * Genera un resumen legible de los bits activos
 */
function generarResumen(bitsActivos, interpretacionEspecial) {
  if (interpretacionEspecial) {
    return interpretacionEspecial.descripcion;
  }

  if (bitsActivos.length === 0) {
    return "Sin señales activas";
  }

  const alarmas = bitsActivos.filter(b => b.tipo === "alarma");
  const errores = bitsActivos.filter(b => b.tipo === "error");
  const warnings = bitsActivos.filter(b => b.tipo === "warning");
  const estados = bitsActivos.filter(b => b.tipo === "estado" || b.tipo === "info");

  const partes = [];

  if (errores.length > 0) {
    partes.push(`ERRORES: ${errores.map(e => e.nombre).join(", ")}`);
  }
  if (alarmas.length > 0) {
    partes.push(`ALARMAS: ${alarmas.map(a => a.nombre).join(", ")}`);
  }
  if (warnings.length > 0) {
    partes.push(`Warnings: ${warnings.map(w => w.nombre).join(", ")}`);
  }
  if (estados.length > 0 && partes.length === 0) {
    partes.push(estados.map(e => e.nombre).join(", "));
  }

  return partes.join(" | ");
}

/**
 * Verifica si un registro tiene interpretación disponible
 * @param {number} numeroRegistro - Número del registro
 * @returns {boolean}
 */
export function tieneInterpretacion(numeroRegistro) {
  return Object.prototype.hasOwnProperty.call(MAPA_REGISTROS, numeroRegistro);
}

/**
 * Verifica si una categoría de funcionalidad requiere interpretación
 * @param {string} categoriaId - ID de la categoría
 * @returns {boolean}
 */
export function categoriaRequiereInterpretacion(categoriaId) {
  return CATEGORIAS_INTERPRETABLES.includes(categoriaId);
}

/**
 * Obtiene el tipo CSS para un bit según su tipo
 * @param {string} tipo - Tipo del bit (alarma, error, warning, estado, info)
 * @returns {string} Clase CSS a aplicar
 */
export function obtenerClaseTipo(tipo) {
  const clases = {
    alarma: "interpretacion-alarma",
    error: "interpretacion-error",
    warning: "interpretacion-warning",
    estado: "interpretacion-estado",
    info: "interpretacion-info",
    ok: "interpretacion-ok",
    unknown: "interpretacion-unknown"
  };
  return clases[tipo] || "interpretacion-info";
}
