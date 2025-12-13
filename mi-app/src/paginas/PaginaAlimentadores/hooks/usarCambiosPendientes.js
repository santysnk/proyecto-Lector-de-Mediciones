// src/paginas/PaginaAlimentadores/hooks/usarCambiosPendientes.js
// Hook para manejar cambios pendientes de sincronización con la BD
//
// Conceptos:
// - Pbase: Parámetros guardados en la base de datos (snapshot)
// - Pnavegador: Parámetros actuales en el navegador (estado local + localStorage)
//
// El botón "Guardar" se habilita cuando Pbase !== Pnavegador, incluyendo:
// - Valores diferentes (colores, gaps)
// - Elementos nuevos en Pnavegador que no existen en Pbase (alimentadores agregados)
// - Elementos eliminados de Pnavegador que sí existen en Pbase (alimentadores borrados)
// - Diferente cantidad de filas (afecta gaps verticales)

import { useState, useCallback, useRef } from "react";
import {
  actualizarPuesto as actualizarPuestoAPI,
  actualizarAlimentadorAPI,
  reordenarAlimentadores as reordenarAlimentadoresAPI,
} from "../../../servicios/apiService";

/**
 * Hook para detectar y sincronizar cambios pendientes entre estado local y BD.
 *
 * Trackea:
 * - Colores de puestos (color, bgColor)
 * - Gaps verticales de puestos (por fila)
 * - Colores de alimentadores
 * - Gaps horizontales de alimentadores
 * - Orden de alimentadores
 * - Cantidad de alimentadores (elementos nuevos/eliminados)
 *
 * NO trackea (van directo a BD):
 * - Crear/eliminar puestos
 * - Crear/eliminar alimentadores
 * - Configuración Modbus
 */
export const usarCambiosPendientes = () => {
  // Snapshot original de los datos cargados de BD (Pbase)
  const snapshotRef = useRef({
    puestos: {},      // { [id]: { color, bgColor, gapsVerticales, cantidadAlimentadores } }
    alimentadores: {}, // { [id]: { color, gapHorizontal, orden, puestoId } }
    alimentadoresIds: new Set(), // Set de IDs de alimentadores en Pbase
  });

  // Estado de sincronización
  const [sincronizando, setSincronizando] = useState(false);
  const [errorSincronizacion, setErrorSincronizacion] = useState(null);

  /**
   * Guarda el snapshot original de los datos cargados de BD (Pbase).
   * Llamar después de cargar datos del backend.
   */
  const guardarSnapshot = useCallback((puestos) => {
    const snapshot = {
      puestos: {},
      alimentadores: {},
      alimentadoresIds: new Set(),
    };

    puestos.forEach((puesto) => {
      const alimentadoresDelPuesto = puesto.alimentadores || [];

      snapshot.puestos[puesto.id] = {
        color: puesto.color,
        bgColor: puesto.bgColor || puesto.bg_color,
        gapsVerticales: JSON.stringify(puesto.gapsVerticales || { "0": 40 }),
        cantidadAlimentadores: alimentadoresDelPuesto.length,
      };

      alimentadoresDelPuesto.forEach((alim, index) => {
        snapshot.alimentadores[alim.id] = {
          color: alim.color,
          gapHorizontal: alim.gapHorizontal ?? 10,
          orden: index,
          puestoId: puesto.id,
        };
        snapshot.alimentadoresIds.add(alim.id);
      });
    });

    snapshotRef.current = snapshot;
  }, []);

  /**
   * Detecta si hay cambios entre el estado actual (Pnavegador) y el snapshot (Pbase).
   *
   * Detecta:
   * 1. Cambios en valores existentes (colores, gaps)
   * 2. Alimentadores nuevos (en Pnavegador pero no en Pbase)
   * 3. Alimentadores eliminados (en Pbase pero no en Pnavegador)
   * 4. Cambios en cantidad de filas (afecta gaps verticales)
   *
   * @param {Array} puestosActuales - Lista actual de puestos con alimentadores
   * @param {Object} gapsPorTarjeta - Gaps horizontales de localStorage { alimId: gap }
   * @param {Object} gapsPorFilaPorPuesto - Gaps verticales de localStorage por puesto { puestoId: { "0": gap, ... } }
   * @returns {Object} { hayCambios, cambios, hayNuevosElementos, hayElementosEliminados }
   */
  const detectarCambios = useCallback((puestosActuales, gapsPorTarjeta = {}, gapsPorFilaPorPuesto = {}) => {
    const cambios = {
      puestos: [],      // [{ id, campos: { color?, bgColor?, gapsVerticales? } }]
      alimentadores: [], // [{ id, campos: { color?, gapHorizontal? } }]
      ordenPorPuesto: {}, // { puestoId: [alimentadorIds en nuevo orden] }
    };

    const snapshot = snapshotRef.current;

    // Trackear IDs actuales para detectar elementos nuevos/eliminados
    const alimentadoresActualesIds = new Set();
    let hayNuevosElementos = false;
    let hayElementosEliminados = false;

    // Comparar puestos
    puestosActuales.forEach((puesto) => {
      const original = snapshot.puestos[puesto.id];
      const alimentadoresDelPuesto = puesto.alimentadores || [];

      // Recolectar IDs de alimentadores actuales
      alimentadoresDelPuesto.forEach((alim) => {
        alimentadoresActualesIds.add(alim.id);

        // Detectar alimentadores nuevos (no estaban en Pbase)
        if (!snapshot.alimentadoresIds.has(alim.id)) {
          hayNuevosElementos = true;
        }
      });

      // Si es un puesto nuevo, no comparar valores pero sí registrar sus gaps
      if (!original) {
        // Puesto nuevo: considerar como cambio si tiene gaps personalizados
        const gapsFilaActuales = gapsPorFilaPorPuesto[puesto.id] || puesto.gapsVerticales || { "0": 40 };
        const gapsDefault = JSON.stringify({ "0": 40 });
        if (JSON.stringify(gapsFilaActuales) !== gapsDefault) {
          cambios.puestos.push({ id: puesto.id, campos: { gapsVerticales: gapsFilaActuales } });
        }
        return;
      }

      const cambiosPuesto = {};
      const bgColorActual = puesto.bgColor || puesto.bg_color;

      // Comparar colores
      if (puesto.color !== original.color) {
        cambiosPuesto.color = puesto.color;
      }
      if (bgColorActual !== original.bgColor) {
        cambiosPuesto.bgColor = bgColorActual;
      }

      // Gaps verticales: combinar los de la BD con los de localStorage para este puesto
      const gapsFilaActuales = gapsPorFilaPorPuesto[puesto.id] || puesto.gapsVerticales || { "0": 40 };
      const gapsFilaActualesStr = JSON.stringify(gapsFilaActuales);
      if (gapsFilaActualesStr !== original.gapsVerticales) {
        cambiosPuesto.gapsVerticales = gapsFilaActuales;
      }

      // Detectar cambio en cantidad de alimentadores
      if (alimentadoresDelPuesto.length !== original.cantidadAlimentadores) {
        // La cantidad cambió, esto puede afectar los gaps verticales
        // Asegurarse de incluir los gaps actualizados
        if (!cambiosPuesto.gapsVerticales) {
          cambiosPuesto.gapsVerticales = gapsFilaActuales;
        }
      }

      if (Object.keys(cambiosPuesto).length > 0) {
        cambios.puestos.push({ id: puesto.id, campos: cambiosPuesto });
      }

      // Comparar alimentadores del puesto
      alimentadoresDelPuesto.forEach((alim, indexActual) => {
        const originalAlim = snapshot.alimentadores[alim.id];

        // Alimentador nuevo: registrar sus gaps si son diferentes al default
        if (!originalAlim) {
          const gapActual = gapsPorTarjeta[alim.id] ?? alim.gapHorizontal ?? 10;
          if (gapActual !== 10) { // Solo si es diferente al default
            cambios.alimentadores.push({ id: alim.id, campos: { gapHorizontal: gapActual } });
          }
          return;
        }

        const cambiosAlim = {};

        // Comparar color
        if (alim.color !== originalAlim.color) {
          cambiosAlim.color = alim.color;
        }

        // Gap horizontal: preferir localStorage, luego el del objeto
        const gapActual = gapsPorTarjeta[alim.id] ?? alim.gapHorizontal ?? 10;
        if (gapActual !== originalAlim.gapHorizontal) {
          cambiosAlim.gapHorizontal = gapActual;
        }

        if (Object.keys(cambiosAlim).length > 0) {
          cambios.alimentadores.push({ id: alim.id, campos: cambiosAlim });
        }

        // Detectar cambio de orden
        if (indexActual !== originalAlim.orden) {
          if (!cambios.ordenPorPuesto[puesto.id]) {
            cambios.ordenPorPuesto[puesto.id] = alimentadoresDelPuesto.map((a) => a.id);
          }
        }
      });
    });

    // Detectar alimentadores eliminados (estaban en Pbase pero ya no están en Pnavegador)
    snapshot.alimentadoresIds.forEach((idBase) => {
      if (!alimentadoresActualesIds.has(idBase)) {
        hayElementosEliminados = true;
      }
    });

    // También detectar si hay gaps en localStorage para alimentadores que ya no existen
    // Esto ayuda a limpiar gaps huérfanos
    Object.keys(gapsPorTarjeta).forEach((alimId) => {
      if (!alimentadoresActualesIds.has(alimId) && snapshot.alimentadoresIds.has(alimId)) {
        // Hay un gap guardado para un alimentador que fue eliminado
        hayElementosEliminados = true;
      }
    });

    const hayCambios =
      cambios.puestos.length > 0 ||
      cambios.alimentadores.length > 0 ||
      Object.keys(cambios.ordenPorPuesto).length > 0 ||
      hayNuevosElementos ||
      hayElementosEliminados;

    return {
      hayCambios,
      cambios,
      hayNuevosElementos,
      hayElementosEliminados,
    };
  }, []);

  /**
   * Sincroniza todos los cambios pendientes con la BD.
   * Después de sincronizar exitosamente, el snapshot se actualiza
   * al recargar datos en el callback onSuccess.
   *
   * @param {Object} cambios - Cambios detectados por detectarCambios()
   * @param {Function} onSuccess - Callback al completar exitosamente
   * @param {Function} onError - Callback en caso de error
   */
  const sincronizarConBD = useCallback(async (cambios, onSuccess, onError) => {
    setSincronizando(true);
    setErrorSincronizacion(null);

    try {
      // 1. Actualizar puestos
      for (const { id, campos } of cambios.puestos) {
        const datosAPI = {};
        if (campos.color !== undefined) datosAPI.color = campos.color;
        if (campos.bgColor !== undefined) datosAPI.bg_color = campos.bgColor;
        if (campos.gapsVerticales !== undefined) datosAPI.gaps_verticales = campos.gapsVerticales;

        await actualizarPuestoAPI(id, datosAPI);
      }

      // 2. Actualizar alimentadores
      for (const { id, campos } of cambios.alimentadores) {
        const datosAPI = {};
        if (campos.color !== undefined) datosAPI.color = campos.color;
        if (campos.gapHorizontal !== undefined) datosAPI.gap_horizontal = campos.gapHorizontal;

        await actualizarAlimentadorAPI(id, datosAPI);
      }

      // 3. Reordenar alimentadores
      for (const [puestoId, ordenIds] of Object.entries(cambios.ordenPorPuesto)) {
        await reordenarAlimentadoresAPI(puestoId, ordenIds);
      }

      // El callback onSuccess debe recargar los datos de BD,
      // lo cual disparará guardarSnapshot() con los nuevos datos
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error sincronizando cambios:", error);
      setErrorSincronizacion(error.message);
      if (onError) onError(error);
    } finally {
      setSincronizando(false);
    }
  }, []);

  /**
   * Descarta los cambios locales y recarga desde BD.
   * @param {Function} recargarDatos - Función para recargar datos desde BD
   */
  const descartarCambios = useCallback(async (recargarDatos) => {
    if (recargarDatos) {
      await recargarDatos();
    }
  }, []);

  /**
   * Obtiene el snapshot actual (Pbase) para debugging o comparación.
   */
  const obtenerSnapshot = useCallback(() => {
    return snapshotRef.current;
  }, []);

  return {
    // Funciones principales
    guardarSnapshot,
    detectarCambios,
    sincronizarConBD,
    descartarCambios,
    obtenerSnapshot,
    // Estado
    sincronizando,
    errorSincronizacion,
  };
};
