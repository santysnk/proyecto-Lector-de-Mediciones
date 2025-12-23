/**
 * Hook para manejar el historial local de lecturas
 * Usa IndexedDB para almacenar las últimas 48 horas de datos
 * y consulta Supabase para datos más antiguos
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  abrirDB,
  guardarLectura,
  obtenerLecturasRango,
  limpiarLecturasAntiguas,
  obtenerEstadisticas,
} from "../utilidades/indexedDBHelper";
import { obtenerLecturasHistoricas } from "@/servicios/apiService";

const HORAS_RETENCION_LOCAL = 48; // Mantener últimas 48 horas en IndexedDB

export const usarHistorialLocal = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const dbRef = useRef(null);
  const inicializadoRef = useRef(false);

  // Inicializar IndexedDB
  useEffect(() => {
    const init = async () => {
      if (inicializadoRef.current) return;
      inicializadoRef.current = true;

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
   * Obtiene datos para el gráfico (lógica híbrida: local + remoto)
   */
  const obtenerDatosGrafico = useCallback(
    async (alimentadorId, registradorId, zona, desde, hasta) => {
      setCargando(true);
      setError(null);

      try {
        const ahora = Date.now();
        const limiteLocal = ahora - HORAS_RETENCION_LOCAL * 60 * 60 * 1000;

        // Caso 1: Todo el rango está dentro del periodo local (48h)
        if (desde >= limiteLocal) {
          if (!dbRef.current) {
            throw new Error("Base de datos local no disponible");
          }

          const datos = await obtenerLecturasRango(
            dbRef.current,
            alimentadorId,
            registradorId,
            zona,
            desde,
            hasta
          );

          return { datos, fuente: "local" };
        }

        // Caso 2: Todo el rango está fuera del periodo local
        if (hasta < limiteLocal) {
          const datosRemotos = await obtenerLecturasHistoricas(
            alimentadorId,
            new Date(desde).toISOString(),
            new Date(hasta).toISOString(),
            null
          );

          // Filtrar por registrador y zona si es necesario
          const datosFiltrados = filtrarLecturas(
            datosRemotos,
            registradorId,
            zona
          );

          return { datos: datosFiltrados, fuente: "remoto" };
        }

        // Caso 3: Rango mixto (parte remoto, parte local)
        // Obtener datos remotos (desde el inicio hasta el límite local)
        const datosRemotos = await obtenerLecturasHistoricas(
          alimentadorId,
          new Date(desde).toISOString(),
          new Date(limiteLocal).toISOString(),
          null
        );

        // Obtener datos locales (desde el límite local hasta el final)
        let datosLocales = [];
        if (dbRef.current) {
          datosLocales = await obtenerLecturasRango(
            dbRef.current,
            alimentadorId,
            registradorId,
            zona,
            limiteLocal,
            hasta
          );
        }

        // Filtrar remotos y combinar
        const remotosFiltrados = filtrarLecturas(
          datosRemotos,
          registradorId,
          zona
        );
        const datosCombinados = [...remotosFiltrados, ...datosLocales];

        // Ordenar por timestamp
        datosCombinados.sort((a, b) => {
          const ta = a.timestamp || 0;
          const tb = b.timestamp || 0;
          return ta - tb;
        });

        return { datos: datosCombinados, fuente: "mixto" };
      } catch (err) {
        console.error("[Historial] Error obteniendo datos:", err);
        setError(err.message);
        return { datos: [], fuente: "error" };
      } finally {
        setCargando(false);
      }
    },
    []
  );

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
    actualizarEstadisticas,
    cargando,
    error,
    estadisticas,
    horasRetencion: HORAS_RETENCION_LOCAL,
  };
};

/**
 * Filtra lecturas por registrador y zona
 * Los datos remotos vienen en formato diferente al local
 */
const filtrarLecturas = (lecturas, registradorId, zona) => {
  if (!lecturas || !Array.isArray(lecturas)) return [];

  return lecturas.filter((lectura) => {
    // Si tiene registrador_id, filtrar por él
    if (registradorId && lectura.registrador_id) {
      if (lectura.registrador_id !== registradorId) return false;
    }

    // Normalizar estructura para compatibilidad
    // Los datos remotos pueden tener estructura diferente
    return true;
  });
};

export default usarHistorialLocal;
