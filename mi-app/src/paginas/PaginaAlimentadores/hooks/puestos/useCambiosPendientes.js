// hooks/puestos/useCambiosPendientes.js
// Hook para detectar y sincronizar cambios pendientes entre estado local y BD

import { useState, useCallback, useRef } from "react";
import { actualizarPuesto as actualizarPuestoAPI, actualizarAlimentadorAPI, reordenarAlimentadores as reordenarAlimentadoresAPI } from "../../../../servicios/apiService";
import { detectarCambiosEntre } from "./detectarCambiosPendientes";

export const useCambiosPendientes = () => {
  const snapshotRef = useRef({ puestos: {}, alimentadores: {}, alimentadoresIds: new Set() });
  const [sincronizando, setSincronizando] = useState(false);
  const [errorSincronizacion, setErrorSincronizacion] = useState(null);

  const guardarSnapshot = useCallback((puestos) => {
    const snapshot = { puestos: {}, alimentadores: {}, alimentadoresIds: new Set() };
    puestos.forEach((puesto) => {
      const alimentadoresDelPuesto = puesto.alimentadores || [];
      const puestoIdStr = String(puesto.id);
      snapshot.puestos[puestoIdStr] = {
        color: puesto.color,
        bgColor: puesto.bgColor || puesto.bg_color,
        gapsVerticales: JSON.stringify(puesto.gapsVerticales || { "0": 40 }),
        cantidadAlimentadores: alimentadoresDelPuesto.length,
        escala: puesto.escala,
      };
      alimentadoresDelPuesto.forEach((alim, index) => {
        const alimIdStr = String(alim.id);
        snapshot.alimentadores[alimIdStr] = {
          color: alim.color, gapHorizontal: alim.gapHorizontal ?? 10,
          orden: index, puestoId: puestoIdStr, escala: alim.escala,
        };
        snapshot.alimentadoresIds.add(alimIdStr);
      });
    });
    snapshotRef.current = snapshot;
  }, []);

  const detectarCambios = useCallback((puestosActuales, gapsPorTarjeta = {}, gapsPorFilaPorPuesto = {}, escalasPorPuesto = {}, escalasPorTarjeta = {}) => {
    return detectarCambiosEntre(puestosActuales, snapshotRef.current, gapsPorTarjeta, gapsPorFilaPorPuesto, escalasPorPuesto, escalasPorTarjeta);
  }, []);

  const sincronizarConBD = useCallback(async (cambios, onSuccess, onError) => {
    setSincronizando(true);
    setErrorSincronizacion(null);
    try {
      for (const { id, campos } of cambios.puestos) {
        const datosAPI = {};
        if (campos.color !== undefined) datosAPI.color = campos.color;
        if (campos.bgColor !== undefined) datosAPI.bg_color = campos.bgColor;
        if (campos.gapsVerticales !== undefined) datosAPI.gaps_verticales = campos.gapsVerticales;
        if (campos.escala !== undefined) datosAPI.escala = campos.escala;
        await actualizarPuestoAPI(id, datosAPI);
      }
      for (const { id, campos } of cambios.alimentadores) {
        const datosAPI = {};
        if (campos.color !== undefined) datosAPI.color = campos.color;
        if (campos.gapHorizontal !== undefined) datosAPI.gap_horizontal = campos.gapHorizontal;
        if (campos.escala !== undefined) datosAPI.escala = campos.escala;
        await actualizarAlimentadorAPI(id, datosAPI);
      }
      for (const [puestoId, ordenIds] of Object.entries(cambios.ordenPorPuesto)) {
        await reordenarAlimentadoresAPI(puestoId, ordenIds);
      }
      if (onSuccess) await onSuccess();
    } catch (error) {
      console.error("Error sincronizando cambios:", error);
      setErrorSincronizacion(error.message);
      if (onError) onError(error);
    } finally {
      setSincronizando(false);
    }
  }, []);

  const descartarCambios = useCallback(async (recargarDatos) => {
    if (recargarDatos) await recargarDatos();
  }, []);

  const obtenerSnapshot = useCallback(() => snapshotRef.current, []);

  return {
    guardarSnapshot, detectarCambios, sincronizarConBD, descartarCambios, obtenerSnapshot,
    sincronizando, errorSincronizacion,
  };
};
