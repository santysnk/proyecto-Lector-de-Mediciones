// hooks/preferencias/usePreferenciasVisuales.js
// Hook para preferencias visuales con patrón creador/invitado override

import { useState, useEffect, useCallback, useMemo } from "react";
import { obtenerPreferencias, guardarPreferencias, actualizarPuesto, actualizarAlimentadorAPI } from "../../../../servicios/apiService";
import {
  DEFAULTS, detectarHuerfanos, mergeConfigPuesto, mergeConfigAlimentador,
  construirPrefsActualizadas, mapearCamposPuesto, mapearCamposAlimentador,
} from "./preferenciasVisualesUtils";

export const usePreferenciasVisuales = (workspaceId, esCreador, puestos, recargarPuestos) => {
  const [preferenciasUsuario, setPreferenciasUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [saltarLimpiezaHuerfanos, setSaltarLimpiezaHuerfanos] = useState(false);

  const cargarPreferencias = useCallback(async () => {
    if (!workspaceId) { setPreferenciasUsuario(null); setCargando(false); return; }
    try {
      setCargando(true);
      setError(null);
      const response = await obtenerPreferencias(workspaceId);
      setPreferenciasUsuario(response?.preferencias || {});
    } catch (err) {
      console.error("Error cargando preferencias:", err);
      setError(err.message);
      setPreferenciasUsuario({});
    } finally {
      setCargando(false);
    }
  }, [workspaceId, esCreador]);

  useEffect(() => { cargarPreferencias(); }, [cargarPreferencias]);

  const limpiarHuerfanos = useCallback(async () => {
    const resultado = detectarHuerfanos(preferenciasUsuario, puestos, workspaceId);
    if (!resultado) return;
    try {
      await guardarPreferencias(workspaceId, { preferencias: resultado.nuevasPrefs });
      setPreferenciasUsuario(resultado.nuevasPrefs);
    } catch (err) {
      console.error("Error limpiando preferencias huérfanas:", err);
    }
  }, [preferenciasUsuario, puestos, workspaceId]);

  useEffect(() => {
    if (!saltarLimpiezaHuerfanos && !cargando && preferenciasUsuario && puestos?.length > 0) limpiarHuerfanos();
  }, [puestos, cargando, limpiarHuerfanos, saltarLimpiezaHuerfanos]);

  const obtenerConfigPuesto = useCallback((puestoId) => {
    const puesto = puestos.find(p => p.id === puestoId);
    return mergeConfigPuesto(puesto, preferenciasUsuario);
  }, [puestos, preferenciasUsuario, esCreador]);

  const obtenerConfigAlimentador = useCallback((alimentadorId, puestoId) => {
    const puesto = puestos.find(p => p.id === puestoId);
    const alimentador = puesto?.alimentadores?.find(a => a.id === alimentadorId);
    return mergeConfigAlimentador(alimentador, preferenciasUsuario);
  }, [puestos, preferenciasUsuario]);

  const escalaGlobal = useMemo(() => preferenciasUsuario?.escalaGlobal ?? DEFAULTS.escalaGlobal, [preferenciasUsuario]);

  // Helper para guardar preferencias de invitado con optimistic update
  const guardarComoInvitado = useCallback(async (nuevasPrefs) => {
    setSaltarLimpiezaHuerfanos(true);
    setPreferenciasUsuario(nuevasPrefs);
    try {
      await guardarPreferencias(workspaceId, { preferencias: nuevasPrefs });
    } catch (err) {
      console.error("Error guardando preferencia:", err);
      setError(err.message);
    } finally {
      setTimeout(() => setSaltarLimpiezaHuerfanos(false), 500);
    }
  }, [workspaceId]);

  const guardarPreferencia = useCallback(async (tipo, id, campo, valor) => {
    if (!workspaceId) return;
    try {
      setGuardando(true);
      setError(null);
      if (esCreador) {
        if (tipo === 'puesto') { await actualizarPuesto(id, { [campo === 'gapHorizontal' ? 'gap_horizontal' : campo]: valor }); if (recargarPuestos) await recargarPuestos(); }
        else if (tipo === 'alimentador') { await actualizarAlimentadorAPI(id, { [campo === 'gapHorizontal' ? 'gap_horizontal' : campo]: valor }); if (recargarPuestos) await recargarPuestos(); }
        else if (tipo === 'global') { const nuevas = { ...preferenciasUsuario, escalaGlobal: valor }; await guardarPreferencias(workspaceId, { preferencias: nuevas }); setPreferenciasUsuario(nuevas); }
      } else {
        await guardarComoInvitado(construirPrefsActualizadas(preferenciasUsuario, tipo, id, tipo === 'global' ? { escalaGlobal: valor } : { [campo]: valor }));
      }
    } catch (err) {
      console.error("Error guardando preferencia:", err);
      setError(err.message);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, [workspaceId, esCreador, preferenciasUsuario, recargarPuestos, guardarComoInvitado]);

  const guardarPreferenciasPuesto = useCallback(async (puestoId, cambios) => {
    if (!workspaceId) return;
    try {
      setGuardando(true);
      setError(null);
      if (esCreador) { await actualizarPuesto(puestoId, mapearCamposPuesto(cambios)); if (recargarPuestos) await recargarPuestos(); }
      else await guardarComoInvitado(construirPrefsActualizadas(preferenciasUsuario, 'puesto', puestoId, cambios));
    } catch (err) {
      console.error("Error guardando preferencias puesto:", err);
      setError(err.message);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, [workspaceId, esCreador, preferenciasUsuario, recargarPuestos, guardarComoInvitado]);

  const guardarPreferenciasAlimentador = useCallback(async (alimentadorId, cambios) => {
    if (!workspaceId) return;
    try {
      setGuardando(true);
      setError(null);
      if (esCreador) { await actualizarAlimentadorAPI(alimentadorId, mapearCamposAlimentador(cambios)); if (recargarPuestos) await recargarPuestos(); }
      else await guardarComoInvitado(construirPrefsActualizadas(preferenciasUsuario, 'alimentador', alimentadorId, cambios));
    } catch (err) {
      console.error("Error guardando preferencias alimentador:", err);
      setError(err.message);
      throw err;
    } finally {
      setGuardando(false);
    }
  }, [workspaceId, esCreador, preferenciasUsuario, recargarPuestos, guardarComoInvitado]);

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

  const obtenerEscalaEfectiva = useCallback((alimentadorId, puestoId) => {
    const configAlim = obtenerConfigAlimentador(alimentadorId, puestoId);
    if (configAlim?.escala != null) return configAlim.escala;
    const configPuesto = obtenerConfigPuesto(puestoId);
    if (configPuesto?.escala != null) return configPuesto.escala;
    if (escalaGlobal !== DEFAULTS.escalaGlobal) return escalaGlobal;
    return DEFAULTS.escalaGlobal;
  }, [obtenerConfigAlimentador, obtenerConfigPuesto, escalaGlobal]);

  const tienePreferenciasPersonales = useMemo(() => {
    if (!preferenciasUsuario) return false;
    return preferenciasUsuario.escalaGlobal != null || Object.keys(preferenciasUsuario.puestos || {}).length > 0 || Object.keys(preferenciasUsuario.alimentadores || {}).length > 0;
  }, [preferenciasUsuario]);

  return {
    preferenciasUsuario, cargando, error, guardando, esCreador, tienePreferenciasPersonales,
    obtenerConfigPuesto, obtenerConfigAlimentador, obtenerEscalaEfectiva, escalaGlobal,
    guardarPreferencia, guardarPreferenciasPuesto, guardarPreferenciasAlimentador, resetearPreferencias,
    cargarPreferencias, limpiarHuerfanos, DEFAULTS,
  };
};
