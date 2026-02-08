// hooks/puestos/usePuestosSupabase.js
// Hook para manejar puestos y alimentadores usando Supabase

import { useState, useEffect, useCallback } from "react";
import {
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto as eliminarPuestoAPI,
  obtenerAlimentadores,
  crearAlimentador,
  actualizarAlimentadorAPI,
  eliminarAlimentadorAPI,
} from "../../../../servicios/apiService";
import { CLAVES_STORAGE } from "../../constantes/clavesAlmacenamiento";
import { COLORES_SISTEMA } from "../../constantes/colores";
import {
  transformarPuestoDeDB,
  transformarAlimentadorDeDB,
  transformarAlimentadorADB,
} from "./transformadoresPuesto";

export const usePuestosSupabase = (workspaceId) => {
  const COLOR_FONDO_POR_DEFECTO = "#e5e7eb";
  const [puestos, setPuestos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const [puestoSeleccionadoId, setPuestoSeleccionadoId] = useState(() => {
    const idGuardado = localStorage.getItem(CLAVES_STORAGE.PUESTO_SELECCIONADO);
    return idGuardado ? Number(idGuardado) : null;
  });

  const puestoSeleccionado =
    puestos.find((p) => p.id === puestoSeleccionadoId) || puestos[0] || null;

  const cargarPuestos = useCallback(async () => {
    if (!workspaceId) { setPuestos([]); return; }
    try {
      setCargando(true);
      setError(null);
      const puestosData = await obtenerPuestos(workspaceId);
      const puestosConAlimentadores = await Promise.all(
        puestosData.map(async (puesto) => {
          try {
            const alimentadores = await obtenerAlimentadores(puesto.id);
            return { ...transformarPuestoDeDB(puesto), alimentadores: alimentadores.map(transformarAlimentadorDeDB) };
          } catch (err) {
            console.error(`Error cargando alimentadores del puesto ${puesto.id}:`, err);
            return { ...transformarPuestoDeDB(puesto), alimentadores: [] };
          }
        })
      );
      setPuestos(puestosConAlimentadores);
      if (puestosConAlimentadores.length > 0) {
        const seleccionValida = puestosConAlimentadores.some((p) => p.id === puestoSeleccionadoId);
        if (!seleccionValida) setPuestoSeleccionadoId(puestosConAlimentadores[0].id);
      }
    } catch (err) {
      console.error("Error cargando puestos:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [workspaceId, puestoSeleccionadoId]);

  useEffect(() => { cargarPuestos(); }, [workspaceId]);

  useEffect(() => {
    if (puestoSeleccionadoId != null) {
      localStorage.setItem(CLAVES_STORAGE.PUESTO_SELECCIONADO, puestoSeleccionadoId.toString());
    } else {
      localStorage.removeItem(CLAVES_STORAGE.PUESTO_SELECCIONADO);
    }
  }, [puestoSeleccionadoId]);

  const agregarPuesto = async (nombrePuesto, colorPuesto) => {
    if (!workspaceId) return;
    try {
      setError(null);
      const nuevoPuesto = await crearPuesto(workspaceId, {
        nombre: nombrePuesto.trim(),
        color: colorPuesto || COLORES_SISTEMA[0],
        bg_color: COLOR_FONDO_POR_DEFECTO,
      });
      const puestoTransformado = { ...transformarPuestoDeDB(nuevoPuesto), alimentadores: [] };
      setPuestos((prev) => [...prev, puestoTransformado]);
      setPuestoSeleccionadoId(puestoTransformado.id);
      return puestoTransformado;
    } catch (err) {
      console.error("Error creando puesto:", err);
      setError(err.message);
      throw err;
    }
  };

  const actualizarPuestos = async (nuevaListaPuestos) => {
    const sinVacios = nuevaListaPuestos.filter((p) => p.nombre.trim() !== "");
    try {
      setError(null);
      for (const puesto of sinVacios) {
        await actualizarPuesto(puesto.id, { nombre: puesto.nombre, color: puesto.color, bg_color: puesto.bgColor || puesto.bg_color });
      }
      setPuestos(sinVacios);
      const seleccionExiste = sinVacios.some((p) => p.id === puestoSeleccionadoId);
      if (!seleccionExiste) setPuestoSeleccionadoId(sinVacios[0]?.id || null);
    } catch (err) {
      console.error("Error actualizando puestos:", err);
      setError(err.message);
      throw err;
    }
  };

  const eliminarPuesto = async (idPuesto) => {
    try {
      setError(null);
      await eliminarPuestoAPI(idPuesto);
      setPuestos((prev) => prev.filter((p) => p.id !== idPuesto));
      if (puestoSeleccionadoId === idPuesto) {
        const restantes = puestos.filter((p) => p.id !== idPuesto);
        setPuestoSeleccionadoId(restantes[0]?.id || null);
      }
    } catch (err) {
      console.error("Error eliminando puesto:", err);
      setError(err.message);
      throw err;
    }
  };

  const seleccionarPuesto = (idPuesto) => setPuestoSeleccionadoId(idPuesto);

  const agregarAlimentador = async (datosAlimentador) => {
    if (!puestoSeleccionado) return;
    try {
      setError(null);
      const datosDB = transformarAlimentadorADB(datosAlimentador);
      const nuevoAlimentador = await crearAlimentador(puestoSeleccionado.id, datosDB);
      const alimentadorFrontend = transformarAlimentadorDeDB(nuevoAlimentador);
      setPuestos((prev) =>
        prev.map((p) => p.id === puestoSeleccionado.id ? { ...p, alimentadores: [...p.alimentadores, alimentadorFrontend] } : p)
      );
      return alimentadorFrontend;
    } catch (err) {
      console.error("Error creando alimentador:", err);
      // No setear error de página — el llamador maneja el error con alert
      throw err;
    }
  };

  const actualizarAlimentador = async (idPuesto, idAlimentador, nuevosDatos) => {
    try {
      const datosDB = transformarAlimentadorADB(nuevosDatos);
      const actualizado = await actualizarAlimentadorAPI(idAlimentador, datosDB);
      const alimentadorFrontend = transformarAlimentadorDeDB(actualizado);
      setPuestos((prev) =>
        prev.map((p) => p.id === idPuesto
          ? { ...p, alimentadores: p.alimentadores.map((a) => a.id === idAlimentador ? alimentadorFrontend : a) }
          : p
        )
      );
      return alimentadorFrontend;
    } catch (err) {
      console.error("Error actualizando alimentador:", err);
      // No setear error de página — el llamador maneja el error en el modal
      throw err;
    }
  };

  const eliminarAlimentador = async (idPuesto, idAlimentador) => {
    try {
      setError(null);
      await eliminarAlimentadorAPI(idAlimentador);
      setPuestos((prev) =>
        prev.map((p) => p.id === idPuesto ? { ...p, alimentadores: p.alimentadores.filter((a) => a.id !== idAlimentador) } : p)
      );
    } catch (err) {
      console.error("Error eliminando alimentador:", err);
      setError(err.message);
      throw err;
    }
  };

  const reordenarAlimentadores = (idPuesto, nuevoOrdenAlimentadores) => {
    setPuestos((prev) =>
      prev.map((p) => p.id === idPuesto ? { ...p, alimentadores: nuevoOrdenAlimentadores } : p)
    );
  };

  return {
    puestos, puestoSeleccionado, puestoSeleccionadoId, cargando, error,
    cargarPuestos, agregarPuesto, eliminarPuesto, seleccionarPuesto, actualizarPuestos, setPuestos,
    agregarAlimentador, actualizarAlimentador, eliminarAlimentador, reordenarAlimentadores,
  };
};
