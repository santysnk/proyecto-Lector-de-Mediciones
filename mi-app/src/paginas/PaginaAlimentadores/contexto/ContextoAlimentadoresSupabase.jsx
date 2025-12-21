// src/paginas/PaginaAlimentadores/contexto/ContextoAlimentadoresSupabase.jsx
// Contexto de alimentadores que usa Supabase para persistencia

import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from "react";

import { usarPuestosSupabase } from "../hooks/usarPuestosSupabase";
import { usarMediciones } from "../hooks/usarMediciones";
import { usarPreferenciasUI } from "../hooks/usarPreferenciasUI";
import { usarCambiosPendientes } from "../hooks/usarCambiosPendientes";
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

  // Hook de puestos conectado a Supabase
  const puestosHook = usarPuestosSupabase(configuracionSeleccionadaId);

  // Hook de mediciones (sin cambios, funciona igual)
  const medicionesHook = usarMediciones();

  // Hook de preferencias UI (gaps horizontales y verticales)
  const preferenciasHook = usarPreferenciasUI();

  // Hook de cambios pendientes (draft/publish pattern)
  const cambiosPendientesHook = usarCambiosPendientes();

  const { registrosEnVivo } = medicionesHook;
  const { puestoSeleccionado, puestos, cargando: cargandoPuestos } = puestosHook;
  const { gapsPorTarjeta, gapsPorFila } = preferenciasHook;
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
  useEffect(() => {
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

      const { hayCambios } = detectarCambios(puestos, gapsPorTarjeta, gapsPorFilaPorPuesto);
      setHayCambiosPendientes(hayCambios);
    }
  }, [puestos, gapsPorTarjeta, gapsPorFila, detectarCambios]);

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

    const { cambios } = detectarCambios(puestos, gapsPorTarjeta, gapsPorFilaPorPuesto);

    await sincronizarConBD(
      cambios,
      // onSuccess
      async () => {
        // Limpiar gaps del localStorage ya que ahora están en la BD
        // Esto evita que queden gaps huérfanos de alimentadores eliminados
        preferenciasHook.resetearTodosLosGaps();
        preferenciasHook.resetearTodosLosRowGaps();
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
  }, [hayCambiosPendientes, puestos, gapsPorTarjeta, gapsPorFila, detectarCambios, sincronizarConBD, puestosHook, preferenciasHook]);

  // Función para descartar cambios
  // Limpia localStorage y recarga datos de BD para restaurar orden original
  const descartarCambios = useCallback(async () => {
    // Limpiar localStorage de gaps
    preferenciasHook.resetearTodosLosGaps();
    preferenciasHook.resetearTodosLosRowGaps();
    // Resetear flag y recargar datos de BD para restaurar orden original
    setSnapshotGuardado(false);
    await puestosHook.cargarPuestos();
  }, [preferenciasHook, puestosHook]);

  // Función para limpiar todo el localStorage de preferencias UI (al salir)
  const limpiarPreferenciasUI = useCallback(() => {
    preferenciasHook.resetearTodosLosGaps();
    preferenciasHook.resetearTodosLosRowGaps();
  }, [preferenciasHook]);

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

  // ===== FUNCIONES DE GAP COMBINADAS (localStorage + BD) =====
  // Prioridad: localStorage > BD > default

  /**
   * Obtiene el gap horizontal de un alimentador.
   * Prioriza localStorage (cambios no guardados) sobre BD.
   */
  const obtenerGapCombinado = useCallback((alimId) => {
    // 1. Primero mirar localStorage
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
  }, [gapsPorTarjeta, puestoSeleccionado, preferenciasHook.GAP_DEFAULT]);

  /**
   * Obtiene el gap vertical de una fila en un puesto específico.
   * Prioriza localStorage (cambios no guardados) sobre BD.
   * @param {string} puestoId - ID del puesto
   * @param {number} rowIndex - Índice de la fila
   */
  const obtenerRowGapCombinado = useCallback((puestoId, rowIndex) => {
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
  }, [gapsPorFila, puestos, preferenciasHook.ROW_GAP_DEFAULT]);

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
      actualizarPuestos: puestosHook.actualizarPuestos,
      setPuestos: puestosHook.setPuestos,
      cargarPuestos: puestosHook.cargarPuestos,

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
      // Las funciones obtenerGap y obtenerRowGap combinan localStorage + BD
      gapsPorTarjeta: preferenciasHook.gapsPorTarjeta,
      gapsPorFila: preferenciasHook.gapsPorFila,
      obtenerGap: obtenerGapCombinado,
      establecerGap: preferenciasHook.establecerGap,
      obtenerRowGap: obtenerRowGapCombinado,
      establecerRowGap: preferenciasHook.establecerRowGap,
      GAP_MIN: preferenciasHook.GAP_MIN,
      GAP_MAX: preferenciasHook.GAP_MAX,
      GAP_DEFAULT: preferenciasHook.GAP_DEFAULT,
      ROW_GAP_MIN: preferenciasHook.ROW_GAP_MIN,
      ROW_GAP_MAX: preferenciasHook.ROW_GAP_MAX,
      ROW_GAP_DEFAULT: preferenciasHook.ROW_GAP_DEFAULT,

      // Cambios pendientes (draft/publish)
      hayCambiosPendientes,
      sincronizando,
      errorSincronizacion,
      sincronizarCambios,
      descartarCambios,

      // Limpieza al salir
      limpiarPreferenciasUI,
    }),
    [puestosHook, medicionesHook, preferenciasHook, lecturasTarjetas, configuracionSeleccionada, cargando, hayCambiosPendientes, sincronizando, errorSincronizacion, sincronizarCambios, descartarCambios, obtenerGapCombinado, obtenerRowGapCombinado, limpiarPreferenciasUI]
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
