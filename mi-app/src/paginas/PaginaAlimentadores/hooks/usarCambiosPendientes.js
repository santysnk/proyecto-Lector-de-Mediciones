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
 * - Escala de puestos
 * - Colores de alimentadores
 * - Gaps horizontales de alimentadores
 * - Escala de alimentadores (individual)
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
    puestos: {},      // { [id]: { color, bgColor, gapsVerticales, cantidadAlimentadores, escala } }
    alimentadores: {}, // { [id]: { color, gapHorizontal, orden, puestoId, escala } }
    alimentadoresIds: new Set(), // Set de IDs de alimentadores en Pbase
  });

  // Estado de sincronización
  const [sincronizando, setSincronizando] = useState(false);
  const [errorSincronizacion, setErrorSincronizacion] = useState(null);

  /**
   * Guarda el snapshot original de los datos cargados de BD (Pbase).
   * Llamar después de cargar datos del backend.
   *
   * IMPORTANTE: Todos los IDs se guardan como strings para evitar
   * problemas de comparación entre tipos (números vs strings).
   */
  const guardarSnapshot = useCallback((puestos) => {
    const snapshot = {
      puestos: {},
      alimentadores: {},
      alimentadoresIds: new Set(), // Set de strings
    };

    puestos.forEach((puesto) => {
      const alimentadoresDelPuesto = puesto.alimentadores || [];
      const puestoIdStr = String(puesto.id);

      snapshot.puestos[puestoIdStr] = {
        color: puesto.color,
        bgColor: puesto.bgColor || puesto.bg_color,
        gapsVerticales: JSON.stringify(puesto.gapsVerticales || { "0": 40 }),
        cantidadAlimentadores: alimentadoresDelPuesto.length,
        escala: puesto.escala, // null si no está definida en BD
      };

      alimentadoresDelPuesto.forEach((alim, index) => {
        const alimIdStr = String(alim.id);
        snapshot.alimentadores[alimIdStr] = {
          color: alim.color,
          gapHorizontal: alim.gapHorizontal ?? 10,
          orden: index,
          puestoId: puestoIdStr, // también string
          escala: alim.escala, // null si no está definida en BD
        };
        snapshot.alimentadoresIds.add(alimIdStr);
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
   * @param {Object} escalasPorPuesto - Escalas por puesto de localStorage { puestoId: escala }
   * @param {Object} escalasPorTarjeta - Escalas por tarjeta de localStorage { alimId: escala }
   * @returns {Object} { hayCambios, cambios, hayNuevosElementos, hayElementosEliminados }
   */
  const detectarCambios = useCallback((puestosActuales, gapsPorTarjeta = {}, gapsPorFilaPorPuesto = {}, escalasPorPuesto = {}, escalasPorTarjeta = {}) => {
    const cambios = {
      puestos: [],      // [{ id, campos: { color?, bgColor?, gapsVerticales?, escala? } }]
      alimentadores: [], // [{ id, campos: { color?, gapHorizontal?, escala? } }]
      ordenPorPuesto: {}, // { puestoId: [alimentadorIds en nuevo orden] }
    };

    const snapshot = snapshotRef.current;

    // Trackear IDs actuales para detectar elementos nuevos/eliminados
    // IMPORTANTE: Usamos Set de strings para comparación consistente
    const alimentadoresActualesIds = new Set();
    let hayNuevosElementos = false;
    let hayElementosEliminados = false;

    // Comparar puestos
    puestosActuales.forEach((puesto) => {
      const puestoIdStr = String(puesto.id);
      const original = snapshot.puestos[puestoIdStr];
      const alimentadoresDelPuesto = puesto.alimentadores || [];

      // Recolectar IDs de alimentadores actuales (como strings)
      alimentadoresDelPuesto.forEach((alim) => {
        const alimIdStr = String(alim.id);
        alimentadoresActualesIds.add(alimIdStr);

        // Detectar alimentadores nuevos (no estaban en Pbase)
        if (!snapshot.alimentadoresIds.has(alimIdStr)) {
          hayNuevosElementos = true;
        }
      });

      // Detectar cambio de orden comparando arrays de IDs (todos como strings)
      const ordenActualIds = alimentadoresDelPuesto.map(a => String(a.id));
      const ordenOriginalIds = Object.entries(snapshot.alimentadores)
        .filter(([_, data]) => data.puestoId === puestoIdStr)
        .sort((a, b) => a[1].orden - b[1].orden)
        .map(([id, _]) => id); // ya es string porque es key de objeto

      // Comparar si el orden cambió (solo si tienen la misma cantidad de elementos)
      if (ordenActualIds.length === ordenOriginalIds.length && ordenActualIds.length > 0) {
        const ordenCambio = ordenActualIds.some((id, idx) => id !== ordenOriginalIds[idx]);
        if (ordenCambio) {
          cambios.ordenPorPuesto[puesto.id] = alimentadoresDelPuesto.map(a => a.id);
        }
      }

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

      // Escala del puesto: preferir localStorage, luego valor del objeto
      // Si hay escala en localStorage, usarla; si no, usar la del puesto
      const puestoIdStrLS = String(puesto.id);
      const escalaLocalPuesto = escalasPorPuesto[puestoIdStrLS] ?? escalasPorPuesto[puesto.id];
      const escalaActualPuesto = escalaLocalPuesto !== undefined ? escalaLocalPuesto : puesto.escala;
      // Comparar con el snapshot (ambos pueden ser null)
      if (escalaActualPuesto !== original.escala) {
        cambiosPuesto.escala = escalaActualPuesto;
      }

      if (Object.keys(cambiosPuesto).length > 0) {
        cambios.puestos.push({ id: puesto.id, campos: cambiosPuesto });
      }

      // Comparar alimentadores del puesto
      alimentadoresDelPuesto.forEach((alim) => {
        const alimIdStr = String(alim.id);
        const originalAlim = snapshot.alimentadores[alimIdStr];

        // Alimentador nuevo: registrar sus gaps si son diferentes al default
        if (!originalAlim) {
          const gapActual = gapsPorTarjeta[alimIdStr] ?? gapsPorTarjeta[alim.id] ?? alim.gapHorizontal ?? 10;
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
        // Buscar tanto por string como por número en gapsPorTarjeta
        const gapActual = gapsPorTarjeta[alimIdStr] ?? gapsPorTarjeta[alim.id] ?? alim.gapHorizontal ?? 10;
        if (gapActual !== originalAlim.gapHorizontal) {
          cambiosAlim.gapHorizontal = gapActual;
        }

        // Escala individual: preferir localStorage, luego valor del objeto
        const escalaLocalAlim = escalasPorTarjeta[alimIdStr] ?? escalasPorTarjeta[alim.id];
        const escalaActualAlim = escalaLocalAlim !== undefined ? escalaLocalAlim : alim.escala;
        // Comparar con el snapshot (ambos pueden ser null)
        if (escalaActualAlim !== originalAlim.escala) {
          cambiosAlim.escala = escalaActualAlim;
        }

        if (Object.keys(cambiosAlim).length > 0) {
          cambios.alimentadores.push({ id: alim.id, campos: cambiosAlim });
        }
      });
    });

    // Detectar alimentadores eliminados (estaban en Pbase pero ya no están en Pnavegador)
    // Ambos Sets ahora contienen strings
    snapshot.alimentadoresIds.forEach((idBase) => {
      if (!alimentadoresActualesIds.has(idBase)) {
        hayElementosEliminados = true;
      }
    });

    // También detectar si hay gaps en localStorage para alimentadores que ya no existen
    // Object.keys devuelve strings, así que la comparación funciona
    Object.keys(gapsPorTarjeta).forEach((alimIdStr) => {
      if (!alimentadoresActualesIds.has(alimIdStr) && snapshot.alimentadoresIds.has(alimIdStr)) {
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
   * @param {Function} onSuccess - Callback al completar exitosamente (puede ser async)
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
        if (campos.escala !== undefined) datosAPI.escala = campos.escala;

        await actualizarPuestoAPI(id, datosAPI);
      }

      // 2. Actualizar alimentadores
      for (const { id, campos } of cambios.alimentadores) {
        const datosAPI = {};
        if (campos.color !== undefined) datosAPI.color = campos.color;
        if (campos.gapHorizontal !== undefined) datosAPI.gap_horizontal = campos.gapHorizontal;
        if (campos.escala !== undefined) datosAPI.escala = campos.escala;

        await actualizarAlimentadorAPI(id, datosAPI);
      }

      // 3. Reordenar alimentadores
      for (const [puestoId, ordenIds] of Object.entries(cambios.ordenPorPuesto)) {
        await reordenarAlimentadoresAPI(puestoId, ordenIds);
      }

      // El callback onSuccess debe recargar los datos de BD,
      // lo cual disparará guardarSnapshot() con los nuevos datos
      // IMPORTANTE: Esperamos al callback para mantener el overlay visible
      if (onSuccess) await onSuccess();
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
