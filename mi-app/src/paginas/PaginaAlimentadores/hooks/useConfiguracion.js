// src/paginas/PaginaAlimentadores/hooks/usarConfiguracion.js
// Hook para manejar workspaces del usuario en Supabase

import { useState, useEffect, useCallback } from "react";
import {
  obtenerWorkspaces,
  crearWorkspace,
  actualizarWorkspace as actualizarWorkspaceAPI,
  eliminarWorkspace as eliminarWorkspaceAPI,
  obtenerPerfil,
} from "../../../servicios/apiService";
import { CLAVES_STORAGE } from "../constantes/clavesAlmacenamiento";

/**
 * Hook para manejar workspaces del usuario.
 * Los workspaces son contenedores que agrupan puestos y alimentadores.
 *
 * @returns {Object} Estado y funciones para trabajar con workspaces.
 */
export const useConfiguracion = () => {
  // Lista de workspaces del usuario
  const [configuraciones, setConfiguraciones] = useState([]);

  // ID del workspace actualmente seleccionado (UUID string)
  const [configuracionSeleccionadaId, setConfiguracionSeleccionadaId] = useState(() => {
    const guardado = localStorage.getItem(CLAVES_STORAGE.CONFIGURACION_SELECCIONADA);
    return guardado || null;
  });

  // Estado de carga
  const [cargando, setCargando] = useState(true);

  // Error si ocurre
  const [error, setError] = useState(null);

  // Perfil del usuario (incluye rol global)
  const [perfil, setPerfil] = useState(null);

  // Workspace seleccionado (derivado)
  const configuracionSeleccionada = configuraciones.find(
    (c) => c.id === configuracionSeleccionadaId
  ) || configuraciones[0] || null;

  // Permisos derivados del perfil
  const puedeCrearWorkspaces = perfil?.puedeCrearWorkspaces ?? false;
  const rolGlobal = perfil?.rolGlobal ?? 'observador';

  /**
   * Carga el perfil del usuario y los workspaces desde el backend
   */
  const cargarConfiguraciones = useCallback(async () => {
    console.log("[DEBUG-CONFIG] cargarConfiguraciones llamado");
    try {
      setCargando(true);
      setError(null);

      // Cargar perfil y workspaces en paralelo
      const [perfilData, workspacesData] = await Promise.all([
        obtenerPerfil(),
        obtenerWorkspaces(),
      ]);

      console.log("[DEBUG-CONFIG] Workspaces cargados:", workspacesData.map(w => ({
        id: w.id,
        nombre: w.nombre,
        esCreador: w.esCreador
      })));

      setPerfil(perfilData);
      setConfiguraciones(workspacesData);

      // Validar la selección guardada contra los workspaces del usuario
      if (workspacesData.length > 0) {
        // Si hay workspaces pero el seleccionado no está en la lista, seleccionar el primero
        const seleccionValida = workspacesData.some((c) => c.id === configuracionSeleccionadaId);
        console.log("[DEBUG-CONFIG] Validación de selección:", {
          configuracionSeleccionadaId,
          seleccionValida,
          workspaceSeleccionado: workspacesData.find(w => w.id === configuracionSeleccionadaId)
        });
        if (!seleccionValida) {
          console.log("[DEBUG-CONFIG] Selección inválida, seleccionando primer workspace:", workspacesData[0].id);
          setConfiguracionSeleccionadaId(workspacesData[0].id);
        }
      } else {
        // Si el usuario no tiene workspaces, limpiar cualquier selección guardada
        // Esto evita que se intente cargar datos de un workspace al que ya no tiene acceso
        console.log("[DEBUG-CONFIG] No hay workspaces, limpiando selección");
        setConfiguracionSeleccionadaId(null);
      }
    } catch (err) {
      console.error("[DEBUG-CONFIG] Error cargando datos:", err);
      setError(err.message);
    } finally {
      setCargando(false);
      console.log("[DEBUG-CONFIG] Carga finalizada");
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
   * Crea un nuevo workspace
   * @param {string} nombre - Nombre del workspace
   * @param {string} descripcion - Descripción opcional
   */
  const agregarConfiguracion = async (nombre, descripcion = "") => {
    try {
      setError(null);
      const nueva = await crearWorkspace(nombre, descripcion);
      setConfiguraciones((prev) => [...prev, nueva]);
      setConfiguracionSeleccionadaId(nueva.id);
      return nueva;
    } catch (err) {
      console.error("Error creando workspace:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Actualiza un workspace existente
   * @param {number} id - ID del workspace
   * @param {Object} datos - Datos a actualizar
   */
  const actualizarConfiguracion = async (id, datos) => {
    try {
      setError(null);
      const actualizada = await actualizarWorkspaceAPI(id, datos);
      setConfiguraciones((prev) =>
        prev.map((c) => (c.id === id ? actualizada : c))
      );
      return actualizada;
    } catch (err) {
      console.error("Error actualizando workspace:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Elimina un workspace
   * @param {number} id - ID del workspace a eliminar
   */
  const eliminarConfiguracion = async (id) => {
    try {
      setError(null);
      await eliminarWorkspaceAPI(id);
      setConfiguraciones((prev) => prev.filter((c) => c.id !== id));

      // Si se eliminó el seleccionado, seleccionar otro
      if (configuracionSeleccionadaId === id) {
        const restantes = configuraciones.filter((c) => c.id !== id);
        setConfiguracionSeleccionadaId(restantes[0]?.id || null);
      }
    } catch (err) {
      console.error("Error eliminando workspace:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Selecciona un workspace como activo
   * @param {number} id - ID del workspace
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

    // Perfil y permisos
    perfil,
    rolGlobal,
    puedeCrearWorkspaces,

    // Funciones
    cargarConfiguraciones,
    agregarConfiguracion,
    actualizarConfiguracion,
    eliminarConfiguracion,
    seleccionarConfiguracion,
  };
};
