// hooks/useAgentesConfig.js
// Hook para manejar CRUD de agentes

import { useState, useCallback } from "react";
import {
   listarAgentesWorkspace,
   listarAgentesDisponibles,
   vincularAgenteWorkspace,
   desvincularAgenteWorkspace,
   listarTodosLosAgentes,
   crearAgente,
   eliminarAgente,
   rotarClaveAgentePorId,
} from "../../../servicios/apiService";

/**
 * Hook para manejar CRUD de agentes
 * @param {Object} params - Parámetros del hook
 * @param {string} params.workspaceId - ID del workspace actual
 * @param {boolean} params.puedeVincular - Si el usuario puede vincular agentes
 * @param {boolean} params.esSuperadmin - Si el usuario es superadmin
 * @returns {Object} Estado y funciones de agentes
 */
export function useAgentesConfig({ workspaceId, puedeVincular, esSuperadmin }) {
   const [cargando, setCargando] = useState(false);
   const [error, setError] = useState(null);

   // Listas de agentes
   const [agentesVinculados, setAgentesVinculados] = useState([]);
   const [agentesDisponibles, setAgentesDisponibles] = useState([]);
   const [todosAgentes, setTodosAgentes] = useState([]);

   // Estado para crear agente
   const [mostrarFormCrear, setMostrarFormCrear] = useState(false);
   const [nuevoAgente, setNuevoAgente] = useState({ nombre: '', descripcion: '' });
   const [creando, setCreando] = useState(false);
   const [claveGenerada, setClaveGenerada] = useState(null);

   // Estado para expandir registradores
   const [agenteExpandido, setAgenteExpandido] = useState(null);

   /**
    * Cargar todos los datos de agentes
    */
   const cargarDatos = useCallback(async () => {
      if (!workspaceId) return;

      setCargando(true);
      setError(null);

      try {
         // Cargar agentes vinculados al workspace
         const vinculados = await listarAgentesWorkspace(workspaceId);
         setAgentesVinculados(vinculados || []);

         // Si puede vincular, cargar disponibles
         if (puedeVincular) {
            const disponibles = await listarAgentesDisponibles();
            const idsVinculados = new Set((vinculados || []).map(a => a.id));
            setAgentesDisponibles((disponibles || []).filter(a => !idsVinculados.has(a.id)));
         }

         // Si es superadmin, cargar todos
         if (esSuperadmin) {
            const todos = await listarTodosLosAgentes();
            setTodosAgentes(todos || []);
         }
      } catch (err) {
         console.error('Error cargando datos:', err);
         setError(err.message || 'Error cargando datos');
      } finally {
         setCargando(false);
      }
   }, [workspaceId, puedeVincular, esSuperadmin]);

   /**
    * Vincular agente al workspace
    */
   const vincularAgente = useCallback(async (agenteId) => {
      setCargando(true);
      try {
         await vincularAgenteWorkspace(workspaceId, agenteId);
         await cargarDatos();
         return true;
      } catch (err) {
         setError(err.message);
         return false;
      } finally {
         setCargando(false);
      }
   }, [workspaceId, cargarDatos]);

   /**
    * Desvincular agente del workspace
    */
   const desvincularAgente = useCallback(async (agenteId) => {
      setCargando(true);
      try {
         await desvincularAgenteWorkspace(workspaceId, agenteId);
         await cargarDatos();
         return true;
      } catch (err) {
         setError(err.message);
         return false;
      } finally {
         setCargando(false);
      }
   }, [workspaceId, cargarDatos]);

   /**
    * Crear nuevo agente (superadmin)
    */
   const crearNuevoAgente = useCallback(async (nombre, descripcion) => {
      if (!nombre.trim()) return null;

      setCreando(true);
      setError(null);
      try {
         const resultado = await crearAgente(nombre, descripcion);
         setClaveGenerada(resultado.claveSecreta);
         setNuevoAgente({ nombre: '', descripcion: '' });
         await cargarDatos();
         return resultado;
      } catch (err) {
         setError(err.message);
         return null;
      } finally {
         setCreando(false);
      }
   }, [cargarDatos]);

   /**
    * Eliminar agente (superadmin)
    */
   const eliminarAgenteById = useCallback(async (agenteId) => {
      setCargando(true);
      try {
         await eliminarAgente(agenteId);
         await cargarDatos();
         return true;
      } catch (err) {
         setError(err.message);
         return false;
      } finally {
         setCargando(false);
      }
   }, [cargarDatos]);

   /**
    * Rotar clave de agente (superadmin)
    */
   const rotarClave = useCallback(async (agenteId) => {
      setCargando(true);
      try {
         const resultado = await rotarClaveAgentePorId(agenteId);
         setClaveGenerada(resultado.nuevaClave);
         return resultado.nuevaClave;
      } catch (err) {
         setError(err.message);
         return null;
      } finally {
         setCargando(false);
      }
   }, []);

   /**
    * Toggle expandir agente (para ver registradores)
    */
   const toggleExpandirAgente = useCallback((agenteId) => {
      setAgenteExpandido(prev => prev === agenteId ? null : agenteId);
   }, []);

   /**
    * Resetear estado al cerrar
    */
   const resetearEstado = useCallback(() => {
      setError(null);
      setMostrarFormCrear(false);
      setClaveGenerada(null);
      setAgenteExpandido(null);
      setNuevoAgente({ nombre: '', descripcion: '' });
   }, []);

   /**
    * Limpiar error
    */
   const limpiarError = useCallback(() => {
      setError(null);
   }, []);

   /**
    * Limpiar clave generada
    */
   const limpiarClaveGenerada = useCallback(() => {
      setClaveGenerada(null);
   }, []);

   return {
      // Estado
      cargando,
      error,
      agentesVinculados,
      agentesDisponibles,
      todosAgentes,
      mostrarFormCrear,
      nuevoAgente,
      creando,
      claveGenerada,
      agenteExpandido,

      // Setters
      setMostrarFormCrear,
      setNuevoAgente,
      setError,

      // Funciones
      cargarDatos,
      vincularAgente,
      desvincularAgente,
      crearNuevoAgente,
      eliminarAgenteById,
      rotarClave,
      toggleExpandirAgente,
      resetearEstado,
      limpiarError,
      limpiarClaveGenerada,
   };
}
