/**
 * Lógica de intervalos de muestreo para informes
 */

/**
 * Determina qué intervalos están habilitados según la duración del período
 * @param {number} duracionMs - Duración en milisegundos
 * @returns {number[]} - Array de IDs de intervalos habilitados
 */
export const obtenerIntervalosHabilitados = (duracionMs) => {
  const duracionHoras = duracionMs / (1000 * 60 * 60);

  if (duracionHoras <= 1) {
    // Hasta 1 hora: solo 15 min
    return [15];
  } else if (duracionHoras <= 2) {
    // Más de 1h hasta 2h: 15 min o 30 min
    return [15, 30];
  } else if (duracionHoras <= 6) {
    // Más de 2h hasta 6h: 15, 30 min o 1 hora
    return [15, 30, 60];
  } else if (duracionHoras <= 12) {
    // Más de 6h hasta 12h: 30 min o 1 hora
    return [30, 60];
  } else if (duracionHoras <= 24) {
    // Más de 12h hasta 24h: 30 min, 1 hora o 3 horas
    return [30, 60, 180];
  } else if (duracionHoras <= 48) {
    // Más de 24h hasta 48h: 3 horas o 6 horas
    return [180, 360];
  } else {
    // Más de 48h (7 días o más): 3, 6 o 12 horas
    return [180, 360, 720];
  }
};

/**
 * Filtra datos según el intervalo seleccionado
 * Optimizado: usa muestreo por salto de índice para datasets grandes
 * @param {Array} datos - Datos [{x, y}]
 * @param {number} intervaloSeleccionado - Intervalo en minutos
 * @returns {Array} Datos filtrados
 */
export const filtrarDatosPorIntervalo = (datos, intervaloSeleccionado) => {
  if (!datos || datos.length === 0 || !intervaloSeleccionado) return [];

  const intervaloMs = intervaloSeleccionado * 60 * 1000;

  // Para datasets pequeños (< 1000 puntos), usar filtrado tradicional
  if (datos.length < 1000) {
    let ultimoTimestamp = 0;
    return datos.filter((punto) => {
      const timestamp = new Date(punto.x).getTime();
      if (ultimoTimestamp === 0 || timestamp - ultimoTimestamp >= intervaloMs) {
        ultimoTimestamp = timestamp;
        return true;
      }
      return false;
    });
  }

  // Para datasets grandes, calcular paso estimado y usar muestreo por índice
  // Esto reduce de O(n) a O(n/paso) iteraciones
  const primerTs = new Date(datos[0].x).getTime();
  const ultimoTs = new Date(datos[datos.length - 1].x).getTime();
  const duracionTotal = ultimoTs - primerTs;

  if (duracionTotal <= 0) return [datos[0]];

  // Estimar el intervalo promedio entre puntos
  const intervaloPromedio = duracionTotal / (datos.length - 1);
  // Calcular paso aproximado de índices
  const pasoEstimado = Math.max(1, Math.floor(intervaloMs / intervaloPromedio));

  const resultado = [];
  let ultimoTimestamp = 0;

  // Iterar con saltos, pero verificar timestamp real para precisión
  for (let i = 0; i < datos.length; i += pasoEstimado) {
    const punto = datos[i];
    const timestamp = new Date(punto.x).getTime();

    if (ultimoTimestamp === 0 || timestamp - ultimoTimestamp >= intervaloMs * 0.9) {
      resultado.push(punto);
      ultimoTimestamp = timestamp;
    }
  }

  return resultado;
};
