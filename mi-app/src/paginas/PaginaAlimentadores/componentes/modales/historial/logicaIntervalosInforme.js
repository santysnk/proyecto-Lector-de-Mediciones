/**
 * Lógica de intervalos de muestreo para informes
 */

/**
 * Determina el intervalo de muestreo por defecto según la duración del período
 * @param {number} duracionMs - Duración en milisegundos
 * @returns {number} - ID del intervalo recomendado (el más corto adecuado)
 */
export const obtenerIntervaloPorDefecto = (duracionMs) => {
  const duracionHoras = duracionMs / (1000 * 60 * 60);

  if (duracionHoras <= 1) return 15;
  if (duracionHoras <= 6) return 15;
  if (duracionHoras <= 12) return 30;
  if (duracionHoras <= 24) return 30;
  if (duracionHoras <= 48) return 180;
  return 180; // Más de 48h
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
