// hooks/preferencias/preferenciasVisualesUtils.js
// Funciones puras para usePreferenciasVisuales

export const DEFAULTS = {
  escalaGlobal: 1.0,
  GAP_DEFAULT: 10,
  ROW_GAP_DEFAULT: 40,
};

/**
 * Detecta y limpia preferencias huérfanas (puestos/alimentadores que ya no existen).
 * Retorna null si no hay nada que limpiar, o { hayHuerfanos, nuevasPrefs } si hay cambios.
 */
export function detectarHuerfanos(preferenciasUsuario, puestos, workspaceId) {
  if (!preferenciasUsuario || !puestos || puestos.length === 0) return null;

  const prefsPuestos = preferenciasUsuario.puestos || {};
  const prefsAlimentadores = preferenciasUsuario.alimentadores || {};
  if (Object.keys(prefsPuestos).length === 0 && Object.keys(prefsAlimentadores).length === 0) return null;

  // Verificar que los puestos pertenecen al workspace actual
  const primerPuesto = puestos[0];
  if (primerPuesto?.workspace_id && primerPuesto.workspace_id !== workspaceId) return null;

  // Verificar que al menos uno de los puestos con preferencias existe
  const idsPuestos = new Set(puestos.map(p => p.id));
  const prefsPuestosIds = Object.keys(prefsPuestos);
  if (prefsPuestosIds.length > 0 && !prefsPuestosIds.some(id => idsPuestos.has(id))) return null;

  const idsAlimentadores = new Set(puestos.flatMap(p => (p.alimentadores || []).map(a => a.id)));

  let hayHuerfanos = false;
  const nuevasPrefs = { ...preferenciasUsuario };

  if (nuevasPrefs.puestos) {
    const puestosLimpios = {};
    for (const [id, prefs] of Object.entries(nuevasPrefs.puestos)) {
      if (idsPuestos.has(id)) puestosLimpios[id] = prefs;
      else hayHuerfanos = true;
    }
    nuevasPrefs.puestos = puestosLimpios;
  }

  if (nuevasPrefs.alimentadores) {
    const alimentadoresLimpios = {};
    for (const [id, prefs] of Object.entries(nuevasPrefs.alimentadores)) {
      if (idsAlimentadores.has(id)) alimentadoresLimpios[id] = prefs;
      else hayHuerfanos = true;
    }
    nuevasPrefs.alimentadores = alimentadoresLimpios;
  }

  return hayHuerfanos ? { hayHuerfanos, nuevasPrefs } : null;
}

/**
 * Merge config base de puesto + override de preferencias de usuario.
 */
export function mergeConfigPuesto(puesto, preferenciasUsuario) {
  if (!puesto) return null;
  const base = {
    color: puesto.color,
    bg_color: puesto.bg_color || puesto.bgColor,
    escala: puesto.escala,
    gapsVerticales: puesto.gapsVerticales || { "0": DEFAULTS.ROW_GAP_DEFAULT },
  };
  const override = preferenciasUsuario?.puestos?.[puesto.id] || {};
  return { ...base, ...override, gapsVerticales: { ...base.gapsVerticales, ...(override.gapsVerticales || {}) } };
}

/**
 * Merge config base de alimentador + override de preferencias de usuario.
 */
export function mergeConfigAlimentador(alimentador, preferenciasUsuario) {
  if (!alimentador) return null;
  const base = {
    color: alimentador.color,
    escala: alimentador.escala,
    gapHorizontal: alimentador.gapHorizontal ?? DEFAULTS.GAP_DEFAULT,
  };
  const override = preferenciasUsuario?.alimentadores?.[alimentador.id] || {};
  return { ...base, ...override };
}

/**
 * Construye nuevas preferencias con un cambio aplicado (para invitados).
 */
export function construirPrefsActualizadas(preferenciasUsuario, tipo, id, cambios) {
  const nuevasPrefs = { ...preferenciasUsuario };
  if (tipo === 'puesto') {
    nuevasPrefs.puestos = nuevasPrefs.puestos || {};
    nuevasPrefs.puestos[id] = { ...(nuevasPrefs.puestos[id] || {}), ...cambios };
  } else if (tipo === 'alimentador') {
    nuevasPrefs.alimentadores = nuevasPrefs.alimentadores || {};
    nuevasPrefs.alimentadores[id] = { ...(nuevasPrefs.alimentadores[id] || {}), ...cambios };
  } else if (tipo === 'global') {
    nuevasPrefs.escalaGlobal = cambios.escalaGlobal;
  }
  return nuevasPrefs;
}

/**
 * Mapea campos frontend → backend para puestos.
 */
export function mapearCamposPuesto(cambios) {
  const resultado = {};
  for (const [campo, valor] of Object.entries(cambios)) {
    if (campo === 'bgColor') resultado.bg_color = valor;
    else if (campo === 'gapsVerticales') resultado.gaps_verticales = valor;
    else resultado[campo] = valor;
  }
  return resultado;
}

/**
 * Mapea campos frontend → backend para alimentadores.
 */
export function mapearCamposAlimentador(cambios) {
  const resultado = {};
  for (const [campo, valor] of Object.entries(cambios)) {
    if (campo === 'gapHorizontal') resultado.gap_horizontal = valor;
    else resultado[campo] = valor;
  }
  return resultado;
}
