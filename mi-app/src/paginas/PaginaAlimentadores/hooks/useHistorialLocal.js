/**
 * Hook para manejar el historial local de lecturas
 * Usa IndexedDB como caché inteligente que se auto-alimenta:
 * - Guarda lecturas del polling en tiempo real
 * - Cachea datos remotos cuando se consultan por primera vez
 * - Evita duplicados por timestamp
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  abrirDB,
  guardarLectura,
  obtenerLecturasRango,
  limpiarLecturasAntiguas,
  obtenerEstadisticas,
  cachearLecturasRemotas,
  limpiarTodo,
} from "../utilidades/indexedDBHelper";
import { obtenerLecturasHistoricasPorRegistrador } from "@/servicios/apiService";
import {
  HORAS_RETENCION_LOCAL,
  UMBRAL_COBERTURA_CACHE,
  UMBRAL_COBERTURA_REMOTO,
  MARGEN_LIMITE_LOCAL_MS,
} from "../constantes/historialConfig";

export const useHistorialLocal = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [dbLista, setDbLista] = useState(false); // Indica cuando IndexedDB está lista

  // Estado de precarga de 48h
  const [precargaProgreso, setPrecargaProgreso] = useState(0); // 0-100
  const [precargaCompleta, setPrecargaCompleta] = useState(false);
  const [precargando, setPrecargando] = useState(false);
  const precargaAbortRef = useRef(false);

  const dbRef = useRef(null);

  // Inicializar IndexedDB
  useEffect(() => {
    const init = async () => {
      // Si ya tenemos conexión, marcar como lista
      if (dbRef.current) {
        setDbLista(true);
        return;
      }

      try {
        dbRef.current = await abrirDB();

        // Limpiar datos antiguos al iniciar
        const eliminados = await limpiarLecturasAntiguas(
          dbRef.current,
          HORAS_RETENCION_LOCAL
        );
        if (eliminados > 0) {
          console.log(`[Historial] Limpiados ${eliminados} registros antiguos`);
        }

        // Obtener estadísticas
        const stats = await obtenerEstadisticas(dbRef.current);
        setEstadisticas(stats);

        // Marcar como lista
        setDbLista(true);

      } catch (err) {
        console.error("[Historial] Error inicializando IndexedDB:", err);
      }
    };

    init();
  }, []);

  /**
   * Guarda una lectura en IndexedDB (llamado desde el polling)
   */
  const guardarLecturaLocal = useCallback(
    async (alimentadorId, registradorId, zona, lectura) => {
      if (!dbRef.current) return;

      try {
        await guardarLectura(dbRef.current, {
          alimentadorId,
          registradorId,
          zona,
          timestamp: lectura.timestamp || Date.now(),
          valores: lectura.valores,
          indiceInicial: lectura.indice_inicial ?? lectura.indiceInicial ?? 0,
          exito: lectura.exito !== false,
        });
      } catch (err) {
        // No logueamos errores de guardado para no saturar la consola
        // ya que el polling es frecuente
      }
    },
    []
  );

  /**
   * Consulta datos remotos y los cachea en IndexedDB
   * @returns {Array} Datos remotos ya normalizados
   */
  const consultarYCachearRemoto = useCallback(
    async (alimentadorId, registradorId, zona, desde, hasta) => {
      // Consultar al backend
      const datosRemotos = await obtenerLecturasHistoricasPorRegistrador(
        registradorId,
        new Date(desde).toISOString(),
        new Date(hasta).toISOString()
      );

      if (!datosRemotos || datosRemotos.length === 0) {
        return [];
      }

      // Cachear los datos remotos antes de devolverlos
      // Esto asegura que consultas posteriores más cortas encuentren los datos en local
      if (dbRef.current) {
        try {
          const guardadas = await cachearLecturasRemotas(
            dbRef.current,
            alimentadorId,
            registradorId,
            zona,
            datosRemotos
          );
          console.log("[Historial] CACHEO COMPLETADO:", {
            alimentadorId,
            registradorId,
            zona,
            lecturasRecibidas: datosRemotos.length,
            lecturasGuardadas: guardadas,
            rangoGuardado: datosRemotos.length > 0 ? {
              desde: new Date(Math.min(...datosRemotos.map(d =>
                typeof d.timestamp === 'string' ? new Date(d.timestamp).getTime() : d.timestamp
              ))).toISOString(),
              hasta: new Date(Math.max(...datosRemotos.map(d =>
                typeof d.timestamp === 'string' ? new Date(d.timestamp).getTime() : d.timestamp
              ))).toISOString()
            } : null
          });
        } catch (err) {
          console.error("[Historial] Error en cacheo:", err);
        }
      }

      // Normalizar timestamps a milisegundos para consistencia
      return datosRemotos.map((l) => ({
        ...l,
        timestamp:
          typeof l.timestamp === "string"
            ? new Date(l.timestamp).getTime()
            : l.timestamp,
        indiceInicial: l.indice_inicial ?? l.indiceInicial ?? 0,
      }));
    },
    []
  );

  /**
   * Obtiene datos para el gráfico (lógica híbrida con cache inteligente)
   *
   * Estrategia:
   * - Si precargaCompleta = true, SIEMPRE usar solo local (sin verificación de cobertura)
   * - Si no hay precarga completa:
   *   1. Intentar local primero
   *   2. Si local está vacío o incompleto, ir a remoto
   *   3. Cachear datos remotos para futuras consultas
   *
   * @param {boolean} forzarSoloLocal - Si true, fuerza usar solo datos locales sin ir a remoto
   */
  const obtenerDatosGrafico = useCallback(
    async (alimentadorId, registradorId, zona, desde, hasta, forzarSoloLocal = false) => {
      setCargando(true);
      setError(null);

      try {
        const ahora = Date.now();
        // Añadir margen al límite para evitar edge cases
        // cuando el usuario selecciona exactamente 48h
        const limiteLocal = ahora - (HORAS_RETENCION_LOCAL * 60 * 60 * 1000) - MARGEN_LIMITE_LOCAL_MS;

        // Calcular si el rango solicitado está dentro de las 48h de retención local
        const rangoSolicitadoMs = hasta - desde;
        const rangoMaximoLocalMs = HORAS_RETENCION_LOCAL * 60 * 60 * 1000;
        const rangoExcede48h = rangoSolicitadoMs > rangoMaximoLocalMs;

        // MODO PRECARGA COMPLETA: usar SOLO datos locales, pero solo si el rango es ≤ 48h
        // Para rangos > 48h, SIEMPRE ir a remoto
        if (forzarSoloLocal && !rangoExcede48h) {
          let datosLocales = [];
          if (dbRef.current) {
            datosLocales = await obtenerLecturasRango(
              dbRef.current,
              alimentadorId,
              registradorId,
              zona,
              desde,
              hasta
            );
          }

          console.log("[Historial] MODO SOLO LOCAL (precarga completa):", {
            alimentadorId,
            registradorId,
            zona,
            rangoBuscado: {
              desde: new Date(desde).toISOString(),
              hasta: new Date(hasta).toISOString(),
              horasSolicitadas: rangoSolicitadoMs / (1000 * 60 * 60)
            },
            datosEncontrados: datosLocales.length,
          });

          return { datos: datosLocales, fuente: "local" };
        }

        // Para rangos > 48h, ir directo a remoto
        if (rangoExcede48h) {
          console.log("[Historial] Rango excede 48h, consultando remoto:", {
            horasSolicitadas: rangoSolicitadoMs / (1000 * 60 * 60),
          });

          const datosRemotos = await consultarYCachearRemoto(
            alimentadorId,
            registradorId,
            zona,
            desde,
            hasta
          );
          return { datos: datosRemotos, fuente: "remoto" };
        }

        // MODO NORMAL (híbrido): verificar cobertura y complementar con remoto si es necesario

        // Caso 1: Todo el rango está dentro del periodo local (48h + margen)
        if (desde >= limiteLocal) {
          // Intentar obtener de local si está disponible
          let datosLocales = [];
          if (dbRef.current) {
            datosLocales = await obtenerLecturasRango(
              dbRef.current,
              alimentadorId,
              registradorId,
              zona,
              desde,
              hasta
            );
          }

          console.log("[Historial] CONSULTA LOCAL:", {
            alimentadorId,
            registradorId,
            zona,
            rangoBuscado: {
              desde: new Date(desde).toISOString(),
              hasta: new Date(hasta).toISOString(),
              horasSolicitadas: (hasta - desde) / (1000 * 60 * 60)
            },
            datosEncontrados: datosLocales.length,
            rangoEncontrado: datosLocales.length > 0 ? {
              primero: new Date(Math.min(...datosLocales.map(d => d.timestamp))).toISOString(),
              ultimo: new Date(Math.max(...datosLocales.map(d => d.timestamp))).toISOString()
            } : null
          });

          // Verificar si los datos locales cubren el rango solicitado
          if (datosLocales.length > 0) {
            const primerTimestamp = Math.min(...datosLocales.map((d) => d.timestamp));

            // Calcular cuánto tiempo de datos tenemos vs cuánto pedimos
            const rangoSolicitadoMs = hasta - desde;
            const rangoCubiertoMs = hasta - primerTimestamp;
            const porcentajeCubierto = rangoCubiertoMs / rangoSolicitadoMs;

            console.log("[Historial] COBERTURA:", {
              rangoSolicitadoHoras: rangoSolicitadoMs / (1000 * 60 * 60),
              rangoCubiertoHoras: rangoCubiertoMs / (1000 * 60 * 60),
              porcentaje: (porcentajeCubierto * 100).toFixed(1) + "%",
              decision: porcentajeCubierto < UMBRAL_COBERTURA_REMOTO ? "IR A REMOTO" : "USAR LOCAL"
            });

            // Si cubrimos menos del umbral, consultar remoto para completar
            if (porcentajeCubierto < UMBRAL_COBERTURA_REMOTO) {
              const datosRemotos = await consultarYCachearRemoto(
                alimentadorId,
                registradorId,
                zona,
                desde,
                hasta
              );

              // Combinar remotos + locales y deduplicar
              const mapaTimestamps = new Map();
              for (const dato of datosRemotos) {
                mapaTimestamps.set(dato.timestamp, dato);
              }
              for (const dato of datosLocales) {
                mapaTimestamps.set(dato.timestamp, dato);
              }
              const datosCombinados = Array.from(mapaTimestamps.values());
              datosCombinados.sort((a, b) => a.timestamp - b.timestamp);

              return { datos: datosCombinados, fuente: "mixto" };
            }

            return { datos: datosLocales, fuente: "local" };
          }

          // FALLBACK: Si no hay datos locales o IndexedDB no disponible, consultar remoto
          const datosRemotos = await consultarYCachearRemoto(
            alimentadorId,
            registradorId,
            zona,
            desde,
            hasta
          );
          return { datos: datosRemotos, fuente: "remoto" };
        }

        // Caso 2: Todo el rango está fuera del periodo local (>48h atrás)
        if (hasta < limiteLocal) {
          // Primero intentar local (por si ya cacheamos antes)
          let datosLocales = [];
          if (dbRef.current) {
            datosLocales = await obtenerLecturasRango(
              dbRef.current,
              alimentadorId,
              registradorId,
              zona,
              desde,
              hasta
            );
          }

          // Si hay datos locales (cacheados previamente), usarlos
          if (datosLocales.length > 0) {
            return { datos: datosLocales, fuente: "local" };
          }

          // Si no, ir a remoto y cachear
          const datosRemotos = await consultarYCachearRemoto(
            alimentadorId,
            registradorId,
            zona,
            desde,
            hasta
          );
          return { datos: datosRemotos, fuente: "remoto" };
        }

        // Caso 3: Rango mixto (parte antigua, parte reciente)
        // Primero intentar obtener TODO desde local (por si ya cacheamos)
        let datosLocalesCompletos = [];
        if (dbRef.current) {
          datosLocalesCompletos = await obtenerLecturasRango(
            dbRef.current,
            alimentadorId,
            registradorId,
            zona,
            desde,
            hasta
          );
        }

        // Si hay suficientes datos locales, usarlos
        // (Heurística: si hay al menos algunos puntos, probablemente tenemos todo)
        if (datosLocalesCompletos.length > 0) {
          // Verificar si cubrimos el rango consultando el primer timestamp
          const primerTimestamp = Math.min(...datosLocalesCompletos.map((d) => d.timestamp));

          // Si el primer dato está cerca del inicio del rango (dentro de 5 min), asumir completo
          if (primerTimestamp <= desde + 5 * 60 * 1000) {
            return { datos: datosLocalesCompletos, fuente: "local" };
          }
        }

        // Necesitamos combinar: remoto para la parte antigua + local para reciente
        const datosRemotosAntiguos = await consultarYCachearRemoto(
          alimentadorId,
          registradorId,
          zona,
          desde,
          limiteLocal
        );

        // Obtener datos locales frescos (desde el límite hasta ahora)
        let datosLocalesRecientes = [];
        if (dbRef.current) {
          datosLocalesRecientes = await obtenerLecturasRango(
            dbRef.current,
            alimentadorId,
            registradorId,
            zona,
            limiteLocal,
            hasta
          );
        }

        // Si no hay datos locales recientes, intentar remoto también para esa parte
        if (datosLocalesRecientes.length === 0) {
          const datosRemotosRecientes = await consultarYCachearRemoto(
            alimentadorId,
            registradorId,
            zona,
            limiteLocal,
            hasta
          );
          datosLocalesRecientes = datosRemotosRecientes;
        }

        // Combinar y deduplicar por timestamp
        const mapaTimestamps = new Map();

        // Primero agregar remotos antiguos
        for (const dato of datosRemotosAntiguos) {
          mapaTimestamps.set(dato.timestamp, dato);
        }

        // Luego agregar locales recientes (sobrescriben si hay duplicados)
        for (const dato of datosLocalesRecientes) {
          mapaTimestamps.set(dato.timestamp, dato);
        }

        // Convertir a array y ordenar
        const datosCombinados = Array.from(mapaTimestamps.values());
        datosCombinados.sort((a, b) => a.timestamp - b.timestamp);

        return { datos: datosCombinados, fuente: "mixto" };
      } catch (err) {
        console.error("[Historial] Error obteniendo datos:", err);
        setError(err.message);
        return { datos: [], fuente: "error" };
      } finally {
        setCargando(false);
      }
    },
    [consultarYCachearRemoto]
  );

  /**
   * Verifica si ya hay datos suficientes en cache para un registrador/zona
   * @returns {Promise<boolean>} true si el cache ya tiene datos suficientes
   */
  const verificarCacheExistente = useCallback(
    async (alimentadorId, registradorId, zona) => {
      if (!dbRef.current || !registradorId) return false;

      const ahora = Date.now();
      const desde = ahora - HORAS_RETENCION_LOCAL * 60 * 60 * 1000;
      const hasta = ahora;

      try {
        const datosLocales = await obtenerLecturasRango(
          dbRef.current,
          alimentadorId,
          registradorId,
          zona,
          desde,
          hasta
        );

        if (datosLocales.length === 0) return false;

        // Verificar cobertura temporal
        const primerTimestamp = Math.min(...datosLocales.map((d) => d.timestamp));
        const rangoSolicitadoMs = hasta - desde;
        const rangoCubiertoMs = hasta - primerTimestamp;
        const porcentajeCubierto = rangoCubiertoMs / rangoSolicitadoMs;

        // Si cubrimos más del umbral del rango, consideramos que el cache está OK
        const cacheValido = porcentajeCubierto >= UMBRAL_COBERTURA_CACHE;

        console.log(`[Historial] Cache existente para ${zona}:`, {
          registradorId,
          datosEncontrados: datosLocales.length,
          porcentajeCubierto: (porcentajeCubierto * 100).toFixed(1) + "%",
          cacheValido,
        });

        return cacheValido;
      } catch (err) {
        console.error("[Historial] Error verificando cache:", err);
        return false;
      }
    },
    []
  );

  /**
   * Precarga las últimas 48h de datos para ambas zonas
   * Se ejecuta de forma independiente al seleccionar el rango
   * Verifica primero si ya hay datos en cache para evitar recargas innecesarias
   *
   * IMPORTANTE: Cuando ambas zonas usan el mismo registrador pero diferentes
   * índices de registro, igual se debe guardar en cache para AMBAS zonas,
   * porque IndexedDB indexa por [alimentadorId, zona, timestamp]
   *
   * @param {string} alimentadorId - ID del alimentador
   * @param {string} registradorIdSuperior - ID del registrador de zona superior
   * @param {string} registradorIdInferior - ID del registrador de zona inferior
   * @returns {Promise<boolean>} - true si la precarga fue exitosa
   */
  const precargar48h = useCallback(
    async (alimentadorId, registradorIdSuperior, registradorIdInferior) => {
      // Resetear estado
      setPrecargaProgreso(0);
      setPrecargaCompleta(false);
      setPrecargando(true);
      precargaAbortRef.current = false;

      const ahora = Date.now();
      const desde = ahora - HORAS_RETENCION_LOCAL * 60 * 60 * 1000;
      const hasta = ahora;

      // Verificar si ya hay cache válido para las zonas
      const cacheSuperiorOK = await verificarCacheExistente(
        alimentadorId,
        registradorIdSuperior,
        "superior"
      );
      const cacheInferiorOK = await verificarCacheExistente(
        alimentadorId,
        registradorIdInferior,
        "inferior"
      );

      // Si ambas zonas tienen cache válido, no hacer nada
      if (cacheSuperiorOK && cacheInferiorOK) {
        console.log("[Historial] Cache ya válido para ambas zonas, omitiendo precarga");
        setPrecargaProgreso(100);
        setPrecargaCompleta(true);
        setPrecargando(false);
        return true;
      }

      // Determinar qué zonas cargar y de qué registrador
      // IMPORTANTE: Si ambas zonas usan el mismo registrador, solo consultamos
      // una vez pero guardamos para AMBAS zonas
      const mismoRegistrador = registradorIdSuperior === registradorIdInferior;

      // Lista de tareas de consulta a la API (evitar duplicados cuando mismo registrador)
      const tareasConsulta = [];

      if (registradorIdSuperior && !cacheSuperiorOK) {
        tareasConsulta.push({ registradorId: registradorIdSuperior, zonas: ["superior"] });
      }

      if (registradorIdInferior && !cacheInferiorOK) {
        if (mismoRegistrador) {
          // Mismo registrador: agregar zona inferior a la consulta existente o crear nueva
          const consultaExistente = tareasConsulta.find(t => t.registradorId === registradorIdInferior);
          if (consultaExistente) {
            consultaExistente.zonas.push("inferior");
          } else {
            // Superior ya tiene cache, pero inferior no - consultar y guardar solo para inferior
            tareasConsulta.push({ registradorId: registradorIdInferior, zonas: ["inferior"] });
          }
        } else {
          // Diferente registrador: consulta independiente
          tareasConsulta.push({ registradorId: registradorIdInferior, zonas: ["inferior"] });
        }
      }

      if (tareasConsulta.length === 0) {
        console.log("[Historial] No hay registradores configurados para precargar");
        setPrecargando(false);
        setPrecargaCompleta(true);
        setPrecargaProgreso(100);
        return true;
      }

      // Calcular total de operaciones para el progreso
      const totalZonas = tareasConsulta.reduce((sum, t) => sum + t.zonas.length, 0);
      const progresoPorZona = 100 / totalZonas;
      let progresoActual = 0;

      try {
        for (const tarea of tareasConsulta) {
          if (precargaAbortRef.current) {
            console.log("[Historial] Precarga abortada");
            setPrecargando(false);
            return false;
          }

          console.log(`[Historial] Precargando registrador ${tarea.registradorId} para zonas: ${tarea.zonas.join(", ")}...`);

          // Actualizar progreso al iniciar
          setPrecargaProgreso(Math.round(progresoActual + progresoPorZona * 0.1));

          // Consultar datos remotos (una sola vez por registrador)
          const datosRemotos = await obtenerLecturasHistoricasPorRegistrador(
            tarea.registradorId,
            new Date(desde).toISOString(),
            new Date(hasta).toISOString()
          );

          if (precargaAbortRef.current) {
            setPrecargando(false);
            return false;
          }

          // Actualizar progreso al 50%
          setPrecargaProgreso(Math.round(progresoActual + (progresoPorZona * tarea.zonas.length) * 0.5));

          if (datosRemotos && datosRemotos.length > 0 && dbRef.current) {
            // Cachear datos para CADA zona que lo necesita
            for (const zona of tarea.zonas) {
              const guardadas = await cachearLecturasRemotas(
                dbRef.current,
                alimentadorId,
                tarea.registradorId,
                zona,
                datosRemotos
              );

              console.log(`[Historial] Precarga ${zona} completada:`, {
                registradorId: tarea.registradorId,
                lecturasRecibidas: datosRemotos.length,
                lecturasGuardadas: guardadas,
              });

              progresoActual += progresoPorZona;
              setPrecargaProgreso(Math.round(progresoActual));
            }
          } else {
            console.log(`[Historial] No hay datos remotos para registrador ${tarea.registradorId}`);
            progresoActual += progresoPorZona * tarea.zonas.length;
            setPrecargaProgreso(Math.round(progresoActual));
          }
        }

        // Completado
        setPrecargaProgreso(100);
        setPrecargaCompleta(true);
        setPrecargando(false);

        console.log("[Historial] Precarga de 48h completada exitosamente");
        return true;
      } catch (err) {
        console.error("[Historial] Error en precarga:", err);
        setPrecargando(false);
        setPrecargaProgreso(0);
        return false;
      }
    },
    [verificarCacheExistente]
  );

  /**
   * Cancela la precarga en curso
   */
  const cancelarPrecarga = useCallback(() => {
    precargaAbortRef.current = true;
  }, []);

  /**
   * Resetea el estado de precarga (al cerrar modal)
   */
  const resetearPrecarga = useCallback(() => {
    precargaAbortRef.current = true;
    setPrecargaProgreso(0);
    setPrecargaCompleta(false);
    setPrecargando(false);
  }, []);

  /**
   * Limpia lecturas antiguas manualmente
   */
  const limpiarHistorial = useCallback(async () => {
    if (!dbRef.current) return 0;

    try {
      const eliminados = await limpiarLecturasAntiguas(
        dbRef.current,
        HORAS_RETENCION_LOCAL
      );
      const stats = await obtenerEstadisticas(dbRef.current);
      setEstadisticas(stats);
      return eliminados;
    } catch (err) {
      console.error("[Historial] Error limpiando historial:", err);
      return 0;
    }
  }, []);

  /**
   * Limpia TODO el cache local (para testing o reset completo)
   * @returns {Promise<boolean>} true si se limpió correctamente
   */
  const limpiarCacheCompleto = useCallback(async () => {
    if (!dbRef.current) return false;

    try {
      await limpiarTodo(dbRef.current);
      const stats = await obtenerEstadisticas(dbRef.current);
      setEstadisticas(stats);
      // Resetear estado de precarga
      setPrecargaProgreso(0);
      setPrecargaCompleta(false);
      console.log("[Historial] Cache local limpiado completamente");
      return true;
    } catch (err) {
      console.error("[Historial] Error limpiando cache completo:", err);
      return false;
    }
  }, []);

  /**
   * Actualiza estadísticas
   */
  const actualizarEstadisticas = useCallback(async () => {
    if (!dbRef.current) return;

    try {
      const stats = await obtenerEstadisticas(dbRef.current);
      setEstadisticas(stats);
    } catch (err) {
      console.error("[Historial] Error actualizando estadísticas:", err);
    }
  }, []);

  return {
    guardarLecturaLocal,
    obtenerDatosGrafico,
    limpiarHistorial,
    limpiarCacheCompleto,
    actualizarEstadisticas,
    // Precarga 48h
    precargar48h,
    cancelarPrecarga,
    resetearPrecarga,
    precargaProgreso,
    precargaCompleta,
    precargando,
    // Estado general
    dbLista, // Indica cuando IndexedDB está lista para usar
    cargando,
    error,
    estadisticas,
    horasRetencion: HORAS_RETENCION_LOCAL,
  };
};

export default useHistorialLocal;
