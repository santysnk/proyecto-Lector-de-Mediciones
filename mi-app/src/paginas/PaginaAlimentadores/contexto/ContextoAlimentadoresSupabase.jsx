// src/paginas/PaginaAlimentadores/contexto/ContextoAlimentadoresSupabase.jsx
// Contexto de alimentadores que usa Supabase para persistencia

import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from "react";

import { usePuestosSupabase } from "../hooks/usePuestosSupabase";
import { useMediciones } from "../hooks/useMediciones";
import { usePreferenciasUI } from "../hooks/usePreferenciasUI";
import { usePreferenciasVisuales } from "../hooks/usePreferenciasVisuales";
import { useCambiosPendientes } from "../hooks/useCambiosPendientes";
import { usarContextoConfiguracion } from "./ContextoConfiguracion";

import { obtenerDisenoTarjeta, calcularValoresLadoTarjeta } from "../utilidades/calculosMediciones";

const ContextoAlimentadores = createContext(null);

/**
 * Provider de alimentadores que usa Supabase.
 * Requiere estar envuelto por ProveedorConfiguracion.
 */
export const ProveedorAlimentadoresSupabase = ({ children }) => {
  // Obtener workspace activo del contexto superior
  const {
    configuracionSeleccionada,
    configuracionSeleccionadaId,
    cargando: cargandoConfig,
  } = usarContextoConfiguracion();

  // Determinar si el usuario es creador del workspace
  const esCreador = configuracionSeleccionada?.esCreador ?? true;

  // Hook de puestos conectado a Supabase
  const puestosHook = usePuestosSupabase(configuracionSeleccionadaId);

  // Hook de mediciones (sin cambios, funciona igual)
  const medicionesHook = useMediciones();

  // Hook de preferencias UI (gaps horizontales y verticales) - localStorage
  const preferenciasHook = usePreferenciasUI();

  // Hook de preferencias visuales persistentes en BD (para invitados)
  const preferenciasVisualesHook = usePreferenciasVisuales(
    configuracionSeleccionadaId,
    esCreador,
    puestosHook.puestos,
    puestosHook.cargarPuestos
  );

  // Hook de cambios pendientes (draft/publish pattern)
  const cambiosPendientesHook = useCambiosPendientes();

  const { registrosEnVivo } = medicionesHook;
  const { puestoSeleccionado, puestos, cargando: cargandoPuestos } = puestosHook;
  const { gapsPorTarjeta, gapsPorFila, escalasPorPuesto, escalasPorTarjeta } = preferenciasHook;
  const { guardarSnapshot, detectarCambios, sincronizarConBD, sincronizando, errorSincronizacion } = cambiosPendientesHook;

  const [lecturasTarjetas, setLecturasTarjetas] = useState({});
  const [hayCambiosPendientes, setHayCambiosPendientes] = useState(false);
  // Flag para saber si ya guardamos el snapshot inicial de BD
  const [snapshotGuardado, setSnapshotGuardado] = useState(false);

  // Estado de carga combinado
  const cargando = cargandoConfig || cargandoPuestos;

  // Guardar snapshot SOLO cuando terminamos de cargar de BD (una sola vez)
  // No cuando puestos cambia localmente (ej: drag & drop)
  useEffect(() => {
    // Solo guardar snapshot cuando:
    // 1. Hay puestos cargados
    // 2. Ya no estamos cargando (terminó la carga de BD)
    // 3. No hemos guardado el snapshot aún para esta sesión de carga
    if (puestos.length > 0 && !cargandoPuestos && !snapshotGuardado) {
      guardarSnapshot(puestos);
      setSnapshotGuardado(true);
    }
  }, [puestos, cargandoPuestos, snapshotGuardado, guardarSnapshot]);

  // Resetear flag cuando cambia el workspace (para recargar snapshot)
  useEffect(() => {
    setSnapshotGuardado(false);
  }, [configuracionSeleccionadaId]);

  // Detectar cambios cada vez que cambian los datos locales
  // NOTA: Para invitados, siempre es false porque sus cambios se guardan automáticamente en preferencias_usuario
  useEffect(() => {
    // Si es invitado, nunca hay cambios pendientes (se guardan automáticamente)
    if (!esCreador) {
      setHayCambiosPendientes(false);
      return;
    }

    if (puestos.length > 0) {
      // Para gaps verticales por puesto, construimos un objeto
      // Extraemos de gapsPorFila solo los gaps de cada puesto (formato clave: "puestoId:rowIndex")
      const gapsPorFilaPorPuesto = {};
      puestos.forEach((p) => {
        const gapsDelPuesto = {};
        // Buscar en gapsPorFila todas las claves que empiezan con este puestoId
        Object.entries(gapsPorFila).forEach(([clave, valor]) => {
          if (clave.startsWith(`${p.id}:`)) {
            // Extraer el rowIndex de la clave "puestoId:rowIndex"
            const rowIndex = clave.split(':')[1];
            gapsDelPuesto[rowIndex] = valor;
          }
        });
        // Combinar: BD primero, luego localStorage (localStorage tiene prioridad)
        gapsPorFilaPorPuesto[p.id] = { ...p.gapsVerticales, ...gapsDelPuesto };
      });

      const { hayCambios } = detectarCambios(puestos, gapsPorTarjeta, gapsPorFilaPorPuesto, escalasPorPuesto, escalasPorTarjeta);
      setHayCambiosPendientes(hayCambios);
    }
  }, [puestos, gapsPorTarjeta, gapsPorFila, escalasPorPuesto, escalasPorTarjeta, detectarCambios, esCreador]);

  // Función para sincronizar cambios con BD
  const sincronizarCambios = useCallback(async () => {
    if (!hayCambiosPendientes) return;

    // Construir gapsPorFilaPorPuesto extrayendo solo los gaps de cada puesto
    const gapsPorFilaPorPuesto = {};
    puestos.forEach((p) => {
      const gapsDelPuesto = {};
      Object.entries(gapsPorFila).forEach(([clave, valor]) => {
        if (clave.startsWith(`${p.id}:`)) {
          const rowIndex = clave.split(':')[1];
          gapsDelPuesto[rowIndex] = valor;
        }
      });
      gapsPorFilaPorPuesto[p.id] = { ...p.gapsVerticales, ...gapsDelPuesto };
    });

    const { cambios } = detectarCambios(puestos, gapsPorTarjeta, gapsPorFilaPorPuesto, escalasPorPuesto, escalasPorTarjeta);

    await sincronizarConBD(
      cambios,
      // onSuccess
      async () => {
        // Limpiar gaps del localStorage ya que ahora están en la BD
        // Esto evita que queden gaps huérfanos de alimentadores eliminados
        preferenciasHook.resetearTodosLosGaps();
        preferenciasHook.resetearTodosLosRowGaps();
        // Limpiar escalas del localStorage (por puesto y por tarjeta)
        // La escala global NO se limpia porque es preferencia del usuario, no se guarda en BD
        preferenciasHook.resetearTodasLasEscalasPuestos();
        preferenciasHook.resetearTodasLasEscalasTarjetas();
        // Resetear flag para que se guarde nuevo snapshot al recargar
        setSnapshotGuardado(false);
        // Recargar datos para actualizar snapshot (Pbase = Pnavegador)
        await puestosHook.cargarPuestos();
      },
      // onError
      (error) => {
        console.error("Error al sincronizar:", error);
      }
    );
  }, [hayCambiosPendientes, puestos, gapsPorTarjeta, gapsPorFila, escalasPorPuesto, escalasPorTarjeta, detectarCambios, sincronizarConBD, puestosHook, preferenciasHook]);

  // Función para descartar cambios
  // Limpia localStorage y recarga datos de BD para restaurar orden original
  const descartarCambios = useCallback(async () => {
    // Limpiar localStorage de gaps
    preferenciasHook.resetearTodosLosGaps();
    preferenciasHook.resetearTodosLosRowGaps();
    // Limpiar localStorage de escalas (por puesto y por tarjeta)
    preferenciasHook.resetearTodasLasEscalasPuestos();
    preferenciasHook.resetearTodasLasEscalasTarjetas();
    // Resetear flag y recargar datos de BD para restaurar orden original
    setSnapshotGuardado(false);
    await puestosHook.cargarPuestos();
  }, [preferenciasHook, puestosHook]);

  // Función para limpiar todo el localStorage de preferencias UI (al salir)
  const limpiarPreferenciasUI = useCallback(() => {
    preferenciasHook.resetearTodosLosGaps();
    preferenciasHook.resetearTodosLosRowGaps();
  }, [preferenciasHook]);

  // ===== WRAPPERS DE GUARDADO SEGÚN ROL =====
  // Para creadores: usa localStorage (y luego sincroniza con BD)
  // Para invitados: guarda directamente en preferencias_usuario

  /**
   * Establece el gap horizontal de un alimentador.
   * - Creador: guarda en localStorage (sync manual con BD)
   * - Invitado: guarda en preferencias_usuario (sync automático)
   */
  const establecerGapInteligente = useCallback((alimId, nuevoGap) => {
    if (esCreador) {
      // Creador: usa localStorage (se sincroniza con "Guardar cambios")
      preferenciasHook.establecerGap(alimId, nuevoGap);
    } else {
      // Invitado: guarda en BD directamente
      preferenciasVisualesHook.guardarPreferenciasAlimentador(alimId, { gapHorizontal: nuevoGap });
    }
  }, [esCreador, preferenciasHook, preferenciasVisualesHook]);

  /**
   * Establece el gap vertical de una fila en un puesto.
   * - Creador: guarda en localStorage
   * - Invitado: guarda en preferencias_usuario
   */
  const establecerRowGapInteligente = useCallback((puestoId, rowIndex, nuevoGap) => {
    if (esCreador) {
      preferenciasHook.establecerRowGap(puestoId, rowIndex, nuevoGap);
    } else {
      // Para invitados, obtener los gaps actuales y agregar/actualizar el nuevo
      const configActual = preferenciasVisualesHook.obtenerConfigPuesto(puestoId);
      const gapsActuales = configActual?.gapsVerticales || {};
      preferenciasVisualesHook.guardarPreferenciasPuesto(puestoId, {
        gapsVerticales: { ...gapsActuales, [rowIndex]: nuevoGap }
      });
    }
  }, [esCreador, preferenciasHook, preferenciasVisualesHook]);

  /**
   * Establece la escala de un puesto.
   * - Creador: guarda en localStorage
   * - Invitado: guarda en preferencias_usuario
   */
  const establecerEscalaPuestoInteligente = useCallback((puestoId, nuevaEscala) => {
    if (esCreador) {
      preferenciasHook.establecerEscalaPuesto(puestoId, nuevaEscala);
    } else {
      preferenciasVisualesHook.guardarPreferenciasPuesto(puestoId, { escala: nuevaEscala });
    }
  }, [esCreador, preferenciasHook, preferenciasVisualesHook]);

  /**
   * Establece la escala de una tarjeta individual.
   * - Creador: guarda en localStorage
   * - Invitado: guarda en preferencias_usuario
   */
  const establecerEscalaTarjetaInteligente = useCallback((alimId, nuevaEscala) => {
    if (esCreador) {
      preferenciasHook.establecerEscalaTarjeta(alimId, nuevaEscala);
    } else {
      preferenciasVisualesHook.guardarPreferenciasAlimentador(alimId, { escala: nuevaEscala });
    }
  }, [esCreador, preferenciasHook, preferenciasVisualesHook]);

  /**
   * Establece la escala global.
   * - Creador: guarda en localStorage
   * - Invitado: guarda en preferencias_usuario
   */
  const establecerEscalaGlobalInteligente = useCallback((nuevaEscala) => {
    if (esCreador) {
      preferenciasHook.establecerEscalaGlobal(nuevaEscala);
    } else {
      preferenciasVisualesHook.guardarPreferencia('global', null, 'escalaGlobal', nuevaEscala);
    }
  }, [esCreador, preferenciasHook, preferenciasVisualesHook]);

  /**
   * Obtiene el color del botón de un puesto.
   * - Creador: devuelve el color de la BD
   * - Invitado: devuelve preferencia personal > BD
   */
  const obtenerColorPuesto = useCallback((puestoId) => {
    const puesto = puestosHook.puestos.find(p => p.id === puestoId);
    if (!puesto) return null;

    // Para invitados, verificar si tienen preferencia personal
    if (!esCreador) {
      const configPuesto = preferenciasVisualesHook.obtenerConfigPuesto(puestoId);
      if (configPuesto?.color) {
        return configPuesto.color;
      }
    }

    return puesto.color;
  }, [esCreador, puestosHook.puestos, preferenciasVisualesHook]);

  /**
   * Obtiene el color de fondo de un puesto.
   * - Creador: devuelve el color de la BD
   * - Invitado: devuelve preferencia personal > BD
   */
  const obtenerBgColorPuesto = useCallback((puestoId) => {
    const puesto = puestosHook.puestos.find(p => p.id === puestoId);
    if (!puesto) return null;

    // Para invitados, verificar si tienen preferencia personal
    if (!esCreador) {
      const configPuesto = preferenciasVisualesHook.obtenerConfigPuesto(puestoId);
      if (configPuesto?.bg_color) {
        return configPuesto.bg_color;
      }
    }

    return puesto.bgColor || puesto.bg_color;
  }, [esCreador, puestosHook.puestos, preferenciasVisualesHook]);

  /**
   * Actualiza puestos según el rol del usuario.
   * - Creador: guarda en BASE (tabla puestos) - puede editar nombres y colores
   * - Invitado: solo guarda colores en preferencias_usuario (no puede editar nombres)
   *
   * @param {Array} puestosEditados - Lista de puestos editados
   */
  const actualizarPuestosInteligente = useCallback(async (puestosEditados) => {
    if (esCreador) {
      // Creador: guardar todo en BASE
      await puestosHook.actualizarPuestos(puestosEditados);
    } else {
      // Invitado: solo guardar colores en preferencias_usuario
      // Los nombres NO se guardan (invitados no pueden cambiar nombres)
      for (const puesto of puestosEditados) {
        const puestoOriginal = puestosHook.puestos.find(p => p.id === puesto.id);
        if (!puestoOriginal) continue;

        // Detectar si cambiaron los colores
        const cambios = {};
        if (puesto.color !== puestoOriginal.color) {
          cambios.color = puesto.color;
        }
        if ((puesto.bgColor || puesto.bg_color) !== (puestoOriginal.bgColor || puestoOriginal.bg_color)) {
          cambios.bg_color = puesto.bgColor || puesto.bg_color;
        }

        // Si hay cambios de color, guardarlos en preferencias
        if (Object.keys(cambios).length > 0) {
          await preferenciasVisualesHook.guardarPreferenciasPuesto(puesto.id, cambios);
        }
      }
    }
  }, [esCreador, puestosHook, preferenciasVisualesHook]);

  // Recalcular lecturas de tarjetas cuando cambian los datos
  useEffect(() => {
    if (!puestoSeleccionado) {
      setLecturasTarjetas({});
      return;
    }

    setLecturasTarjetas(() => {
      const nuevo = {};

      puestoSeleccionado.alimentadores.forEach((alim) => {
        const regsDelAlim = registrosEnVivo[alim.id] || null;
        // Usar card_design (nuevo) o mapeoMediciones (legacy) para compatibilidad
        const cardDesignData = alim.card_design || alim.mapeoMediciones || {};
        const diseno = obtenerDisenoTarjeta(cardDesignData);

        const parteSuperior = calcularValoresLadoTarjeta(regsDelAlim, diseno.superior);
        const parteInferior = calcularValoresLadoTarjeta(regsDelAlim, diseno.inferior);

        nuevo[alim.id] = { parteSuperior, parteInferior };
      });

      return nuevo;
    });
  }, [puestoSeleccionado, registrosEnVivo]);

  // ===== FUNCIONES DE GAP COMBINADAS (localStorage + BD + preferencias usuario) =====
  // Prioridad para CREADOR: localStorage > BD > default
  // Prioridad para INVITADO: preferencias_usuario > BD > default

  /**
   * Obtiene el gap horizontal de un alimentador.
   * - Creador: prioriza localStorage (cambios no guardados) sobre BD
   * - Invitado: usa preferencias persistentes en BD
   */
  const obtenerGapCombinado = useCallback((alimId) => {
    // Para invitados, usar preferencias visuales persistentes
    if (!esCreador) {
      const configAlim = preferenciasVisualesHook.obtenerConfigAlimentador(alimId, puestoSeleccionado?.id);
      if (configAlim?.gapHorizontal !== undefined) {
        return configAlim.gapHorizontal;
      }
    }

    // 1. Primero mirar localStorage (para creadores o si invitado no tiene override)
    const gapLocal = gapsPorTarjeta[alimId];
    if (gapLocal !== undefined) {
      return gapLocal;
    }

    // 2. Buscar en los datos de BD
    if (puestoSeleccionado) {
      const alimentador = puestoSeleccionado.alimentadores.find(a => a.id === alimId);
      if (alimentador && alimentador.gapHorizontal !== undefined) {
        return alimentador.gapHorizontal;
      }
    }

    // 3. Default
    return preferenciasHook.GAP_DEFAULT;
  }, [esCreador, gapsPorTarjeta, puestoSeleccionado, preferenciasHook.GAP_DEFAULT, preferenciasVisualesHook]);

  /**
   * Obtiene el gap vertical de una fila en un puesto específico.
   * - Creador: prioriza localStorage sobre BD
   * - Invitado: usa preferencias persistentes en BD
   * @param {string} puestoId - ID del puesto
   * @param {number} rowIndex - Índice de la fila
   */
  const obtenerRowGapCombinado = useCallback((puestoId, rowIndex) => {
    // Para invitados, usar preferencias visuales persistentes
    if (!esCreador) {
      const configPuesto = preferenciasVisualesHook.obtenerConfigPuesto(puestoId);
      if (configPuesto?.gapsVerticales?.[rowIndex] !== undefined) {
        return configPuesto.gapsVerticales[rowIndex];
      }
    }

    // 1. Primero mirar localStorage (usa clave compuesta puestoId:rowIndex)
    const claveLocal = `${puestoId}:${rowIndex}`;
    const gapLocal = gapsPorFila[claveLocal];
    if (gapLocal !== undefined) {
      return gapLocal;
    }

    // 2. Buscar en los gaps verticales del puesto específico (BD)
    const puesto = puestos.find(p => p.id === puestoId);
    if (puesto && puesto.gapsVerticales) {
      const gapBD = puesto.gapsVerticales[rowIndex];
      if (gapBD !== undefined) {
        return gapBD;
      }
    }

    // 3. Default
    return preferenciasHook.ROW_GAP_DEFAULT;
  }, [esCreador, gapsPorFila, puestos, preferenciasHook.ROW_GAP_DEFAULT, preferenciasVisualesHook]);

  // ===== FUNCIONES DE ESCALA COMBINADAS (localStorage + BD + preferencias usuario) =====
  // Prioridad para CREADOR: localStorage > BD > null
  // Prioridad para INVITADO: preferencias_usuario > BD > null

  /**
   * Obtiene la escala de un puesto.
   * - Creador: prioriza localStorage sobre BD
   * - Invitado: usa preferencias persistentes en BD
   * @param {string} puestoId - ID del puesto
   * @returns {number|null} Escala del puesto o null si no está definida
   */
  const obtenerEscalaPuestoCombinada = useCallback((puestoId) => {
    if (!puestoId) return null;

    // Para invitados, usar preferencias visuales persistentes
    if (!esCreador) {
      const configPuesto = preferenciasVisualesHook.obtenerConfigPuesto(puestoId);
      if (configPuesto?.escala !== undefined && configPuesto?.escala !== null) {
        return configPuesto.escala;
      }
    }

    // 1. Primero mirar localStorage
    const escalaLocal = escalasPorPuesto[puestoId];
    if (escalaLocal !== undefined) {
      return escalaLocal;
    }

    // 2. Buscar en los datos de BD
    const puesto = puestos.find(p => String(p.id) === String(puestoId));
    if (puesto && puesto.escala !== undefined && puesto.escala !== null) {
      return puesto.escala;
    }

    // 3. No hay escala definida (usar jerarquía global)
    return null;
  }, [esCreador, escalasPorPuesto, puestos, preferenciasVisualesHook]);

  /**
   * Obtiene la escala de un alimentador (tarjeta individual).
   * - Creador: prioriza localStorage sobre BD
   * - Invitado: usa preferencias persistentes en BD
   * @param {string} alimId - ID del alimentador
   * @returns {number|null} Escala del alimentador o null si no está definida
   */
  const obtenerEscalaTarjetaCombinada = useCallback((alimId) => {
    if (!alimId) return null;

    // Para invitados, usar preferencias visuales persistentes
    if (!esCreador) {
      const configAlim = preferenciasVisualesHook.obtenerConfigAlimentador(alimId, puestoSeleccionado?.id);
      if (configAlim?.escala !== undefined && configAlim?.escala !== null) {
        return configAlim.escala;
      }
    }

    // 1. Primero mirar localStorage
    const escalaLocal = escalasPorTarjeta[alimId];
    // Si es null explícito, significa "ignorar escala individual" (usar puesto/global)
    if (escalaLocal === null) {
      return null;
    }
    // Si tiene un valor numérico, usarlo
    if (escalaLocal !== undefined) {
      return escalaLocal;
    }

    // 2. Buscar en los datos de BD (en el puesto seleccionado)
    if (puestoSeleccionado) {
      const alimentador = puestoSeleccionado.alimentadores.find(a => String(a.id) === String(alimId));
      if (alimentador && alimentador.escala !== undefined && alimentador.escala !== null) {
        return alimentador.escala;
      }
    }

    // 3. No hay escala definida (usar jerarquía puesto/global)
    return null;
  }, [esCreador, escalasPorTarjeta, puestoSeleccionado, preferenciasVisualesHook]);

  /**
   * Obtiene la escala efectiva de una tarjeta considerando toda la jerarquía:
   * Individual > Por puesto > Global > Default
   * - Creador: usa localStorage + BD
   * - Invitado: usa preferencias persistentes + BD
   * @param {string} alimId - ID del alimentador
   * @param {string} puestoId - ID del puesto
   * @returns {number} Escala efectiva a aplicar
   */
  const obtenerEscalaEfectivaCombinada = useCallback((alimId, puestoId) => {
    // Para invitados, usar la función del hook de preferencias visuales
    if (!esCreador) {
      return preferenciasVisualesHook.obtenerEscalaEfectiva(alimId, puestoId);
    }

    // Para creadores, usar el sistema existente
    // 1. Escala individual (máxima prioridad)
    const escalaIndividual = obtenerEscalaTarjetaCombinada(alimId);
    if (escalaIndividual !== null) return escalaIndividual;

    // 2. Escala por puesto
    const escalaPuesto = obtenerEscalaPuestoCombinada(puestoId);
    if (escalaPuesto !== null) return escalaPuesto;

    // 3. Escala global (solo localStorage, no se guarda en BD)
    if (preferenciasHook.escalaGlobal !== preferenciasHook.ESCALA_DEFAULT) {
      return preferenciasHook.escalaGlobal;
    }

    // 4. Default
    return preferenciasHook.ESCALA_DEFAULT;
  }, [esCreador, obtenerEscalaTarjetaCombinada, obtenerEscalaPuestoCombinada, preferenciasHook.escalaGlobal, preferenciasHook.ESCALA_DEFAULT, preferenciasVisualesHook]);

  // Objeto de contexto
  const valorContexto = useMemo(
    () => ({
      // Estados de carga
      cargando,
      error: puestosHook.error,

      // Workspace actual
      configuracionSeleccionada,
      configuracionSeleccionadaId,

      // Datos de puestos
      puestos: puestosHook.puestos,
      puestoSeleccionado: puestosHook.puestoSeleccionado,
      puestoSeleccionadoId: puestosHook.puestoSeleccionadoId,

      agregarPuesto: puestosHook.agregarPuesto,
      eliminarPuesto: puestosHook.eliminarPuesto,
      seleccionarPuesto: puestosHook.seleccionarPuesto,
      // actualizarPuestos: usa la versión inteligente que considera el rol
      actualizarPuestos: actualizarPuestosInteligente,
      setPuestos: puestosHook.setPuestos,
      cargarPuestos: puestosHook.cargarPuestos,

      // Getters de colores (consideran preferencias de invitados)
      obtenerColorPuesto,
      obtenerBgColorPuesto,

      // Alimentadores
      agregarAlimentador: puestosHook.agregarAlimentador,
      actualizarAlimentador: puestosHook.actualizarAlimentador,
      eliminarAlimentador: puestosHook.eliminarAlimentador,
      reordenarAlimentadores: puestosHook.reordenarAlimentadores,

      // Mediciones y lecturas
      lecturasTarjetas,
      registrosEnVivo: medicionesHook.registrosEnVivo,

      detenerMedicion: medicionesHook.detenerMedicion,
      obtenerRegistros: medicionesHook.obtenerRegistros,
      estaMidiendo: medicionesHook.estaMidiendo,
      obtenerTimestampInicio: medicionesHook.obtenerTimestampInicio,
      obtenerContadorLecturas: medicionesHook.obtenerContadorLecturas,
      actualizarRegistros: medicionesHook.actualizarRegistros,

      // Preferencias UI (gaps)
      // Las funciones obtener* combinan localStorage/preferencias + BD
      // Las funciones establecer* guardan según rol (creador->localStorage, invitado->BD)
      gapsPorTarjeta: preferenciasHook.gapsPorTarjeta,
      gapsPorFila: preferenciasHook.gapsPorFila,
      obtenerGap: obtenerGapCombinado,
      establecerGap: establecerGapInteligente,
      obtenerRowGap: obtenerRowGapCombinado,
      establecerRowGap: establecerRowGapInteligente,
      GAP_MIN: preferenciasHook.GAP_MIN,
      GAP_MAX: preferenciasHook.GAP_MAX,
      GAP_DEFAULT: preferenciasHook.GAP_DEFAULT,
      ROW_GAP_MIN: preferenciasHook.ROW_GAP_MIN,
      ROW_GAP_MAX: preferenciasHook.ROW_GAP_MAX,
      ROW_GAP_DEFAULT: preferenciasHook.ROW_GAP_DEFAULT,

      // Escala de tarjetas
      // Las funciones obtener* combinan preferencias + BD
      // Las funciones establecer* guardan según rol
      escalaGlobal: !esCreador ? preferenciasVisualesHook.escalaGlobal : preferenciasHook.escalaGlobal,
      establecerEscalaGlobal: establecerEscalaGlobalInteligente,
      resetearEscalaGlobal: preferenciasHook.resetearEscalaGlobal,
      escalasPorPuesto: preferenciasHook.escalasPorPuesto,
      obtenerEscalaPuesto: obtenerEscalaPuestoCombinada,
      establecerEscalaPuesto: establecerEscalaPuestoInteligente,
      resetearEscalaPuesto: preferenciasHook.resetearEscalaPuesto,
      escalasPorTarjeta: preferenciasHook.escalasPorTarjeta,
      obtenerEscalaTarjeta: obtenerEscalaTarjetaCombinada,
      establecerEscalaTarjeta: establecerEscalaTarjetaInteligente,
      resetearEscalaTarjeta: preferenciasHook.resetearEscalaTarjeta,
      obtenerEscalaEfectiva: obtenerEscalaEfectivaCombinada,
      resetearTodasLasEscalas: preferenciasHook.resetearTodasLasEscalas,
      ESCALA_MIN: preferenciasHook.ESCALA_MIN,
      ESCALA_MAX: preferenciasHook.ESCALA_MAX,
      ESCALA_DEFAULT: preferenciasHook.ESCALA_DEFAULT,

      // Cambios pendientes (draft/publish)
      hayCambiosPendientes,
      sincronizando,
      errorSincronizacion,
      sincronizarCambios,
      descartarCambios,

      // Limpieza al salir
      limpiarPreferenciasUI,

      // Info del rol del usuario en el workspace
      esCreador,

      // Preferencias visuales persistentes (para invitados)
      // Expone funciones para guardar preferencias personalizadas
      preferenciasVisuales: {
        cargando: preferenciasVisualesHook.cargando,
        guardando: preferenciasVisualesHook.guardando,
        tienePreferenciasPersonales: preferenciasVisualesHook.tienePreferenciasPersonales,
        guardarPreferencia: preferenciasVisualesHook.guardarPreferencia,
        guardarPreferenciasPuesto: preferenciasVisualesHook.guardarPreferenciasPuesto,
        guardarPreferenciasAlimentador: preferenciasVisualesHook.guardarPreferenciasAlimentador,
        resetearPreferencias: preferenciasVisualesHook.resetearPreferencias,
        obtenerConfigPuesto: preferenciasVisualesHook.obtenerConfigPuesto,
        obtenerConfigAlimentador: preferenciasVisualesHook.obtenerConfigAlimentador,
      },
    }),
    [puestosHook, medicionesHook, preferenciasHook, preferenciasVisualesHook, lecturasTarjetas, configuracionSeleccionada, cargando, hayCambiosPendientes, sincronizando, errorSincronizacion, sincronizarCambios, descartarCambios, obtenerGapCombinado, obtenerRowGapCombinado, obtenerEscalaPuestoCombinada, obtenerEscalaTarjetaCombinada, obtenerEscalaEfectivaCombinada, limpiarPreferenciasUI, esCreador, establecerGapInteligente, establecerRowGapInteligente, establecerEscalaPuestoInteligente, establecerEscalaTarjetaInteligente, establecerEscalaGlobalInteligente, actualizarPuestosInteligente, obtenerColorPuesto, obtenerBgColorPuesto]
  );

  return (
    <ContextoAlimentadores.Provider value={valorContexto}>
      {children}
    </ContextoAlimentadores.Provider>
  );
};

export const usarContextoAlimentadores = () => {
  const contexto = useContext(ContextoAlimentadores);

  if (!contexto) {
    throw new Error(
      "usarContextoAlimentadores debe usarse dentro de ProveedorAlimentadoresSupabase"
    );
  }

  return contexto;
};
