// src/paginas/PaginaAlimentadores/hooks/usarConfiguracion.js
// Hook para manejar configuraciones del usuario en Supabase

import { useState, useEffect, useCallback } from "react";
import {
  obtenerConfiguraciones,
  crearConfiguracion,
  actualizarConfiguracion as actualizarConfiguracionAPI,
  eliminarConfiguracion as eliminarConfiguracionAPI,
} from "../../../servicios/apiService";
import { CLAVES_STORAGE } from "../constantes/clavesAlmacenamiento";

/**
 * Hook para manejar configuraciones del usuario.
 * Las configuraciones son contenedores que agrupan puestos y alimentadores.
 *
 * @returns {Object} Estado y funciones para trabajar con configuraciones.
 */
export const usarConfiguracion = () => {
  // Lista de configuraciones del usuario
  const [configuraciones, setConfiguraciones] = useState([]);

  // ID de la configuración actualmente seleccionada
  const [configuracionSeleccionadaId, setConfiguracionSeleccionadaId] = useState(() => {
    const guardado = localStorage.getItem(CLAVES_STORAGE.CONFIGURACION_SELECCIONADA);
    return guardado ? Number(guardado) : null;
  });

  // Estado de carga
  const [cargando, setCargando] = useState(true);

  // Error si ocurre
  const [error, setError] = useState(null);

  // Configuración seleccionada (derivado)
  const configuracionSeleccionada = configuraciones.find(
    (c) => c.id === configuracionSeleccionadaId
  ) || configuraciones[0] || null;

  /**
   * Carga las configuraciones desde el backend
   */
  const cargarConfiguraciones = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const datos = await obtenerConfiguraciones();
      setConfiguraciones(datos);

      // Si no hay configuración seleccionada o la seleccionada no existe, seleccionar la primera
      if (datos.length > 0) {
        const seleccionValida = datos.some((c) => c.id === configuracionSeleccionadaId);
        if (!seleccionValida) {
          setConfiguracionSeleccionadaId(datos[0].id);
        }
      }
    } catch (err) {
      console.error("Error cargando configuraciones:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [configuracionSeleccionadaId]);

  // Cargar configuraciones al montar
  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  // Guardar selección en localStorage cuando cambie
  useEffect(() => {
    if (configuracionSeleccionadaId != null) {
      localStorage.setItem(
        CLAVES_STORAGE.CONFIGURACION_SELECCIONADA,
        configuracionSeleccionadaId.toString()
      );
    } else {
      localStorage.removeItem(CLAVES_STORAGE.CONFIGURACION_SELECCIONADA);
    }
  }, [configuracionSeleccionadaId]);

  /**
   * Crea una nueva configuración
   * @param {string} nombre - Nombre de la configuración
   * @param {string} descripcion - Descripción opcional
   */
  const agregarConfiguracion = async (nombre, descripcion = "") => {
    try {
      setError(null);
      const nueva = await crearConfiguracion(nombre, descripcion);
      setConfiguraciones((prev) => [...prev, nueva]);
      setConfiguracionSeleccionadaId(nueva.id);
      return nueva;
    } catch (err) {
      console.error("Error creando configuración:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Actualiza una configuración existente
   * @param {number} id - ID de la configuración
   * @param {Object} datos - Datos a actualizar
   */
  const actualizarConfiguracion = async (id, datos) => {
    try {
      setError(null);
      const actualizada = await actualizarConfiguracionAPI(id, datos);
      setConfiguraciones((prev) =>
        prev.map((c) => (c.id === id ? actualizada : c))
      );
      return actualizada;
    } catch (err) {
      console.error("Error actualizando configuración:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Elimina una configuración
   * @param {number} id - ID de la configuración a eliminar
   */
  const eliminarConfiguracion = async (id) => {
    try {
      setError(null);
      await eliminarConfiguracionAPI(id);
      setConfiguraciones((prev) => prev.filter((c) => c.id !== id));

      // Si se eliminó la seleccionada, seleccionar otra
      if (configuracionSeleccionadaId === id) {
        const restantes = configuraciones.filter((c) => c.id !== id);
        setConfiguracionSeleccionadaId(restantes[0]?.id || null);
      }
    } catch (err) {
      console.error("Error eliminando configuración:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Selecciona una configuración como activa
   * @param {number} id - ID de la configuración
   */
  const seleccionarConfiguracion = (id) => {
    setConfiguracionSeleccionadaId(id);
  };

  return {
    // Estados
    configuraciones,
    configuracionSeleccionada,
    configuracionSeleccionadaId,
    cargando,
    error,

    // Funciones
    cargarConfiguraciones,
    agregarConfiguracion,
    actualizarConfiguracion,
    eliminarConfiguracion,
    seleccionarConfiguracion,
  };
};
