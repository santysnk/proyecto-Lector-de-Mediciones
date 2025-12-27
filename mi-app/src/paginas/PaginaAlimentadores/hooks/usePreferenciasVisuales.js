// src/paginas/PaginaAlimentadores/hooks/usePreferenciasVisuales.js
// Hook para manejar preferencias visuales personalizadas por usuario
// Implementa el patrón "User Preferences Override":
// - Creador: guarda en BASE (tablas puestos/alimentadores)
// - Invitado: guarda en preferencias_usuario (solo él lo ve)

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  obtenerPreferencias,
  guardarPreferencias,
  actualizarPuesto,
  actualizarAlimentadorAPI,
} from "../../../servicios/apiService";

// Valores por defecto
const DEFAULTS = {
  escalaGlobal: 1.0,
  GAP_DEFAULT: 10,
  ROW_GAP_DEFAULT: 40,
};

/**
 * Hook para manejar preferencias visuales con patrón de override.
 *
 * Flujo de lectura:
 * 1. Carga config BASE de puestos/alimentadores
 * 2. Carga preferencias personales del usuario
 * 3. Hace merge (preferencia personal > base)
 * 4. Limpia preferencias huérfanas
 *
 * Flujo de escritura:
 * - esCreador=true: guarda en BASE (todos ven el cambio)
 * - esCreador=false: guarda en preferencias_usuario (solo él lo ve)
 *
 * @param {string} workspaceId - ID del workspace activo
 * @param {boolean} esCreador - Si el usuario es creador del workspace
 * @param {Array} puestos - Lista de puestos con alimentadores (config BASE)
 * @param {Function} recargarPuestos - Función para recargar puestos después de guardar en BASE
 */
export const usePreferenciasVisuales = (workspaceId, esCreador, puestos, recargarPuestos) => {
  // Preferencias personales del usuario (override)
  const [preferenciasUsuario, setPreferenciasUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  // Flag para evitar que limpiarHuerfanos se ejecute durante/después de un guardado
  const [saltarLimpiezaHuerfanos, setSaltarLimpiezaHuerfanos] = useState(false);

  // Estructura de preferenciasUsuario:
  // {
  //   escalaGlobal: 1.0,
  //   puestos: {
  //     "uuid-puesto": { color, bg_color, escala, gapsVerticales }
  //   },
  //   alimentadores: {
  //     "uuid-alim": { color, escala, gapHorizontal }
  //   }
  // }

  /**
   * Carga las preferencias del usuario desde la BD
   */
  const cargarPreferencias = useCallback(async () => {
    if (!workspaceId) {
      setPreferenciasUsuario(null);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const response = await obtenerPreferencias(workspaceId);
      const prefs = response?.preferencias || {};
      setPreferenciasUsuario(prefs);
    } catch (err) {
      console.error("Error cargando preferencias:", err);
      setError(err.message);
      setPreferenciasUsuario({});
    } finally {
      setCargando(false);
    }
  }, [workspaceId, esCreador]);

  // Cargar preferencias cuando cambie el workspace
  // Nota: cargarPreferencias depende de workspaceId, así que se recrea cuando cambia
  useEffect(() => {
    cargarPreferencias();
  }, [cargarPreferencias]);

  /**
   * Limpia preferencias huérfanas (referencias a puestos/alimentadores que ya no existen)
   * IMPORTANTE: Solo ejecutar cuando puestos ya está cargado para evitar borrar todo
   * IMPORTANTE: Solo ejecutar si los puestos pertenecen al workspace actual
   */
  const limpiarHuerfanos = useCallback(async () => {
    // Verificar que hay datos para comparar
    if (!preferenciasUsuario || !puestos || puestos.length === 0) {
      return;
    }

    // Verificar que hay preferencias que limpiar
    const prefsPuestos = preferenciasUsuario.puestos || {};
    const prefsAlimentadores = preferenciasUsuario.alimentadores || {};
    if (Object.keys(prefsPuestos).length === 0 && Object.keys(prefsAlimentadores).length === 0) {
      return;
    }

    // CRÍTICO: Verificar que los puestos pertenecen al workspace actual
    // Si los puestos tienen un workspace_id diferente, NO ejecutar la limpieza
    // porque significaría que estamos comparando preferencias de un workspace
    // con puestos de otro workspace (durante el cambio de workspace)
    const primerPuesto = puestos[0];
    if (primerPuesto && primerPuesto.workspace_id && primerPuesto.workspace_id !== workspaceId) {
      return;
    }

    // Verificar que al menos uno de los puestos con preferencias existe en la lista actual
    // Si NINGUNO existe, probablemente los puestos son de otro workspace (cambio en progreso)
    const idsPuestos = new Set(puestos.map(p => p.id));
    const prefsPuestosIds = Object.keys(prefsPuestos);
    const algunoPuestoExiste = prefsPuestosIds.some(id => idsPuestos.has(id));

    // Si hay preferencias de puestos pero NINGUNO está en la lista actual,
    // es probable que estemos en medio de un cambio de workspace
    if (prefsPuestosIds.length > 0 && !algunoPuestoExiste) {
      return;
    }

    const idsAlimentadores = new Set(
      puestos.flatMap(p => (p.alimentadores || []).map(a => a.id))
    );

    let hayHuerfanos = false;
    const nuevasPrefs = { ...preferenciasUsuario };

    // Limpiar puestos huérfanos
    if (nuevasPrefs.puestos) {
      const puestosLimpios = {};
      for (const [id, prefs] of Object.entries(nuevasPrefs.puestos)) {
        if (idsPuestos.has(id)) {
          puestosLimpios[id] = prefs;
        } else {
          hayHuerfanos = true;
        }
      }
      nuevasPrefs.puestos = puestosLimpios;
    }

    // Limpiar alimentadores huérfanos
    if (nuevasPrefs.alimentadores) {
      const alimentadoresLimpios = {};
      for (const [id, prefs] of Object.entries(nuevasPrefs.alimentadores)) {
        if (idsAlimentadores.has(id)) {
          alimentadoresLimpios[id] = prefs;
        } else {
          hayHuerfanos = true;
        }
      }
      nuevasPrefs.alimentadores = alimentadoresLimpios;
    }

    // Si hubo limpieza, guardar en BD
    if (hayHuerfanos) {
      try {
        await guardarPreferencias(workspaceId, { preferencias: nuevasPrefs });
        setPreferenciasUsuario(nuevasPrefs);
      } catch (err) {
        console.error("Error limpiando preferencias huérfanas:", err);
      }
    }
  }, [preferenciasUsuario, puestos, workspaceId]);

  // Ejecutar limpieza de huérfanos cuando cambian los puestos
  // IMPORTANTE: Solo ejecutar si puestos tiene elementos para evitar borrar preferencias válidas
  // IMPORTANTE: Saltar si estamos en medio de un guardado para evitar race conditions
  useEffect(() => {
    if (saltarLimpiezaHuerfanos) {
      return;
    }
    if (!cargando && preferenciasUsuario && puestos && puestos.length > 0) {
      limpiarHuerfanos();
    }
  }, [puestos, cargando, limpiarHuerfanos, saltarLimpiezaHuerfanos]);

  /**
   * Obtiene la configuración visual de un puesto (merge base + override)
   */
  const obtenerConfigPuesto = useCallback((puestoId) => {
    const puesto = puestos.find(p => p.id === puestoId);
    if (!puesto) return null;

    // Config base del puesto
    const base = {
      color: puesto.color,
      bg_color: puesto.bg_color || puesto.bgColor,
      escala: puesto.escala,
      gapsVerticales: puesto.gapsVerticales || { "0": DEFAULTS.ROW_GAP_DEFAULT },
    };

    // Override del usuario (si no es creador)
    const override = preferenciasUsuario?.puestos?.[puestoId] || {};

    // Merge: override tiene prioridad
    return {
      ...base,
      ...override,
      // Para gapsVerticales, hacer merge a nivel de keys
      gapsVerticales: {
        ...base.gapsVerticales,
        ...(override.gapsVerticales || {}),
      },
    };
  }, [puestos, preferenciasUsuario, esCreador]);

  /**
   * Obtiene la configuración visual de un alimentador (merge base + override)
   */
  const obtenerConfigAlimentador = useCallback((alimentadorId, puestoId) => {
    const puesto = puestos.find(p => p.id === puestoId);
    const alimentador = puesto?.alimentadores?.find(a => a.id === alimentadorId);
    if (!alimentador) return null;

    // Config base del alimentador
    const base = {
      color: alimentador.color,
      escala: alimentador.escala,
      gapHorizontal: alimentador.gapHorizontal ?? DEFAULTS.GAP_DEFAULT,
    };

    // Override del usuario
    const override = preferenciasUsuario?.alimentadores?.[alimentadorId] || {};

    return { ...base, ...override };
  }, [puestos, preferenciasUsuario]);

  /**
   * Obtiene la escala global (override > default)
   */
  const escalaGlobal = useMemo(() => {
    return preferenciasUsuario?.escalaGlobal ?? DEFAULTS.escalaGlobal;
  }, [preferenciasUsuario]);

  /**
   * Guarda una preferencia visual.
   * - Si esCreador: guarda en BASE (tabla puestos/alimentadores)
   * - Si es invitado: guarda en preferencias_usuario
   *
   * @param {string} tipo - 'puesto' | 'alimentador' | 'global'
   * @param {string} id - ID del elemento (null para global)
   * @param {string} campo - Nombre del campo (color, escala, etc.)
   * @param {any} valor - Nuevo valor
   * @param {string} puestoId - ID del puesto (solo para alimentadores)
   */
  const guardarPreferencia = useCallback(async (tipo, id, campo, valor, puestoId = null) => {
    if (!workspaceId) return;

    try {
      setGuardando(true);
      setError(null);

      if (esCreador) {
        // === CREADOR: Guardar en BASE ===
        if (tipo === 'puesto') {
          await actualizarPuesto(id, { [campo]: valor });
          // Recargar para reflejar cambios
          if (recargarPuestos) await recargarPuestos();
        } else if (tipo === 'alimentador') {
          // Mapear campos frontend a backend
          const campoBackend = campo === 'gapHorizontal' ? 'gap_horizontal' : campo;
          await actualizarAlimentadorAPI(id, { [campoBackend]: valor });
          if (recargarPuestos) await recargarPuestos();
        } else if (tipo === 'global') {
          // La escala global no tiene tabla base, se guarda en preferencias
          const nuevasPrefs = {
            ...preferenciasUsuario,
            escalaGlobal: valor,
          };
          await guardarPreferencias(workspaceId, { preferencias: nuevasPrefs });
          setPreferenciasUsuario(nuevasPrefs);
        }
      } else {
        // === INVITADO: Guardar en preferencias_usuario ===
        // Activar flag para evitar que limpiarHuerfanos se ejecute durante el guardado
        setSaltarLimpiezaHuerfanos(true);

        // Optimistic update: actualizar estado local primero para evitar lag
        const nuevasPrefs = { ...preferenciasUsuario };

        if (tipo === 'puesto') {
          nuevasPrefs.puestos = nuevasPrefs.puestos || {};
          nuevasPrefs.puestos[id] = nuevasPrefs.puestos[id] || {};
          nuevasPrefs.puestos[id][campo] = valor;
        } else if (tipo === 'alimentador') {
          nuevasPrefs.alimentadores = nuevasPrefs.alimentadores || {};
          nuevasPrefs.alimentadores[id] = nuevasPrefs.alimentadores[id] || {};
          nuevasPrefs.alimentadores[id][campo] = valor;
        } else if (tipo === 'global') {
          nuevasPrefs.escalaGlobal = valor;
        }

        setPreferenciasUsuario(nuevasPrefs);
        // Luego guardar en BD (con await para asegurar que se complete)
        try {
          await guardarPreferencias(workspaceId, { preferencias: nuevasPrefs });
        } catch (err) {
          console.error("Error guardando preferencia:", err);
          setError(err.message);
        } finally {
          setTimeout(() => {
            setSaltarLimpiezaHuerfanos(false);
          }, 500);
        }
      }
    } catch (err) {
      console.error("Error guardando preferencia:", err);
      setError(err.message);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, [workspaceId, esCreador, preferenciasUsuario, recargarPuestos]);

  /**
   * Guarda múltiples preferencias de un puesto de una vez
   */
  const guardarPreferenciasPuesto = useCallback(async (puestoId, cambios) => {
    if (!workspaceId) return;

    try {
      setGuardando(true);
      setError(null);

      if (esCreador) {
        // Mapear campos frontend a backend
        const cambiosBackend = {};
        for (const [campo, valor] of Object.entries(cambios)) {
          if (campo === 'bgColor') {
            cambiosBackend.bg_color = valor;
          } else if (campo === 'gapsVerticales') {
            cambiosBackend.gaps_verticales = valor;
          } else {
            cambiosBackend[campo] = valor;
          }
        }
        await actualizarPuesto(puestoId, cambiosBackend);
        if (recargarPuestos) await recargarPuestos();
      } else {
        // Activar flag para evitar que limpiarHuerfanos se ejecute durante el guardado
        setSaltarLimpiezaHuerfanos(true);

        // Optimistic update: actualizar estado local primero para evitar lag
        const nuevasPrefs = { ...preferenciasUsuario };
        nuevasPrefs.puestos = nuevasPrefs.puestos || {};
        nuevasPrefs.puestos[puestoId] = {
          ...(nuevasPrefs.puestos[puestoId] || {}),
          ...cambios,
        };
        setPreferenciasUsuario(nuevasPrefs);
        // Luego guardar en BD (con await para asegurar que se complete antes de permitir limpiezaHuerfanos)
        try {
          await guardarPreferencias(workspaceId, { preferencias: nuevasPrefs });
        } catch (err) {
          console.error("Error guardando preferencias puesto:", err);
          setError(err.message);
        } finally {
          // Reactivar limpiezaHuerfanos después de un delay para evitar race condition
          setTimeout(() => {
            setSaltarLimpiezaHuerfanos(false);
          }, 500);
        }
      }
    } catch (err) {
      console.error("Error guardando preferencias puesto:", err);
      setError(err.message);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, [workspaceId, esCreador, preferenciasUsuario, recargarPuestos]);

  /**
   * Guarda múltiples preferencias de un alimentador de una vez
   */
  const guardarPreferenciasAlimentador = useCallback(async (alimentadorId, cambios) => {
    if (!workspaceId) return;

    try {
      setGuardando(true);
      setError(null);

      if (esCreador) {
        // Mapear campos frontend a backend
        const cambiosBackend = {};
        for (const [campo, valor] of Object.entries(cambios)) {
          if (campo === 'gapHorizontal') {
            cambiosBackend.gap_horizontal = valor;
          } else {
            cambiosBackend[campo] = valor;
          }
        }
        await actualizarAlimentadorAPI(alimentadorId, cambiosBackend);
        if (recargarPuestos) await recargarPuestos();
      } else {
        // Activar flag para evitar que limpiarHuerfanos se ejecute durante el guardado
        setSaltarLimpiezaHuerfanos(true);

        // Optimistic update: actualizar estado local primero para evitar lag
        const nuevasPrefs = { ...preferenciasUsuario };
        nuevasPrefs.alimentadores = nuevasPrefs.alimentadores || {};
        nuevasPrefs.alimentadores[alimentadorId] = {
          ...(nuevasPrefs.alimentadores[alimentadorId] || {}),
          ...cambios,
        };
        setPreferenciasUsuario(nuevasPrefs);
        // Luego guardar en BD (con await para asegurar que se complete)
        try {
          await guardarPreferencias(workspaceId, { preferencias: nuevasPrefs });
        } catch (err) {
          console.error("Error guardando preferencias alimentador:", err);
          setError(err.message);
        } finally {
          setTimeout(() => {
            setSaltarLimpiezaHuerfanos(false);
          }, 500);
        }
      }
    } catch (err) {
      console.error("Error guardando preferencias alimentador:", err);
      setError(err.message);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, [workspaceId, esCreador, preferenciasUsuario, recargarPuestos]);

  /**
   * Resetea las preferencias personales (vuelve a usar la config base)
   */
  const resetearPreferencias = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setGuardando(true);
      await guardarPreferencias(workspaceId, { preferencias: {} });
      setPreferenciasUsuario({});
    } catch (err) {
      console.error("Error reseteando preferencias:", err);
      setError(err.message);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, [workspaceId]);

  /**
   * Obtiene la escala efectiva de un alimentador considerando la jerarquía:
   * Individual > Por puesto > Global > Default
   */
  const obtenerEscalaEfectiva = useCallback((alimentadorId, puestoId) => {
    // 1. Escala individual del alimentador
    const configAlim = obtenerConfigAlimentador(alimentadorId, puestoId);
    if (configAlim?.escala != null) return configAlim.escala;

    // 2. Escala del puesto
    const configPuesto = obtenerConfigPuesto(puestoId);
    if (configPuesto?.escala != null) return configPuesto.escala;

    // 3. Escala global
    if (escalaGlobal !== DEFAULTS.escalaGlobal) return escalaGlobal;

    // 4. Default
    return DEFAULTS.escalaGlobal;
  }, [obtenerConfigAlimentador, obtenerConfigPuesto, escalaGlobal]);

  /**
   * Verifica si el usuario tiene preferencias personales para este workspace
   */
  const tienePreferenciasPersonales = useMemo(() => {
    if (!preferenciasUsuario) return false;
    return (
      preferenciasUsuario.escalaGlobal != null ||
      Object.keys(preferenciasUsuario.puestos || {}).length > 0 ||
      Object.keys(preferenciasUsuario.alimentadores || {}).length > 0
    );
  }, [preferenciasUsuario]);

  return {
    // Estado
    preferenciasUsuario,
    cargando,
    error,
    guardando,
    esCreador,
    tienePreferenciasPersonales,

    // Getters (con merge base+override)
    obtenerConfigPuesto,
    obtenerConfigAlimentador,
    obtenerEscalaEfectiva,
    escalaGlobal,

    // Setters (guardan en base o preferencias según rol)
    guardarPreferencia,
    guardarPreferenciasPuesto,
    guardarPreferenciasAlimentador,
    resetearPreferencias,

    // Utilidades
    cargarPreferencias,
    limpiarHuerfanos,

    // Constantes
    DEFAULTS,
  };
};
