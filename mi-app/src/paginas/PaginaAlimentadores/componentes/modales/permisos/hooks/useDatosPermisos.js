// hooks/useDatosPermisos.js
// Hook para cargar y gestionar datos del panel de permisos

import { useState, useCallback, useMemo, useEffect } from "react";
import {
   listarUsuariosAdmin,
   listarAgentesParaPermisos,
   obtenerDetallesUsuarioAdmin,
} from "../../../../../../servicios/apiService";

/**
 * Hook para manejar datos de usuarios y agentes del panel de permisos
 * @param {boolean} abierto - Si el modal está abierto
 * @returns {Object} Estado y funciones de datos
 */
export const useDatosPermisos = (abierto) => {
   // Estado principal
   const [usuarios, setUsuarios] = useState([]);
   const [agentesDisponibles, setAgentesDisponibles] = useState([]);
   const [cargando, setCargando] = useState(false);
   const [error, setError] = useState(null);

   // Búsqueda y filtrado
   const [busqueda, setBusqueda] = useState("");
   const [filtroRol, setFiltroRol] = useState("todos");

   // Usuario seleccionado
   const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
   const [detallesUsuario, setDetallesUsuario] = useState(null);
   const [cargandoDetalles, setCargandoDetalles] = useState(false);
   const [errorDetalles, setErrorDetalles] = useState(null);

   // Usuarios filtrados
   const usuariosFiltrados = useMemo(() => {
      return usuarios.filter((u) => {
         const coincideBusqueda =
            busqueda === "" ||
            u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            u.email?.toLowerCase().includes(busqueda.toLowerCase());
         const coincideRol = filtroRol === "todos" || u.rolGlobal === filtroRol;
         return coincideBusqueda && coincideRol;
      });
   }, [usuarios, busqueda, filtroRol]);

   // Cargar datos
   const cargarDatos = useCallback(async () => {
      try {
         setCargando(true);
         setError(null);

         const [usuariosData, agentesData] = await Promise.all([
            listarUsuariosAdmin(),
            listarAgentesParaPermisos(),
         ]);

         setUsuarios(usuariosData);
         setAgentesDisponibles(agentesData);
      } catch (err) {
         console.error("Error cargando datos:", err);
         setError(err.message);
      } finally {
         setCargando(false);
      }
   }, []);

   // Seleccionar usuario y cargar detalles
   const seleccionarUsuario = useCallback(
      async (usuario) => {
         if (usuarioSeleccionado?.id === usuario.id) return;

         setUsuarioSeleccionado(usuario);
         setCargandoDetalles(true);
         setErrorDetalles(null);
         setDetallesUsuario(null);

         try {
            const detalles = await obtenerDetallesUsuarioAdmin(usuario.id);
            setDetallesUsuario(detalles);
         } catch (err) {
            console.error("Error cargando detalles:", err);
            setErrorDetalles(err.message || "Error al cargar detalles");
         } finally {
            setCargandoDetalles(false);
         }
      },
      [usuarioSeleccionado?.id]
   );

   // Recargar detalles del usuario actual
   const recargarDetallesUsuario = useCallback(async () => {
      if (!usuarioSeleccionado) return null;

      const detalles = await obtenerDetallesUsuarioAdmin(usuarioSeleccionado.id);
      setDetallesUsuario(detalles);

      const usuarioActualizado = (await listarUsuariosAdmin()).find(
         (u) => u.id === usuarioSeleccionado.id
      );
      if (usuarioActualizado) setUsuarioSeleccionado(usuarioActualizado);

      return usuarioActualizado;
   }, [usuarioSeleccionado]);

   // Limpiar estado
   const limpiarEstado = useCallback(() => {
      setUsuarioSeleccionado(null);
      setDetallesUsuario(null);
      setError(null);
      setBusqueda("");
      setFiltroRol("todos");
      setErrorDetalles(null);
   }, []);

   // Cargar datos al abrir
   useEffect(() => {
      if (abierto) {
         cargarDatos();
      }
   }, [abierto, cargarDatos]);

   return {
      // Estado
      usuarios,
      usuariosFiltrados,
      agentesDisponibles,
      cargando,
      error,
      busqueda,
      filtroRol,
      usuarioSeleccionado,
      detallesUsuario,
      cargandoDetalles,
      errorDetalles,

      // Setters
      setBusqueda,
      setFiltroRol,
      setUsuarioSeleccionado,

      // Acciones
      cargarDatos,
      seleccionarUsuario,
      recargarDetallesUsuario,
      limpiarEstado,
   };
};
