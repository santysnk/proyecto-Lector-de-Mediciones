// hooks/useEdicionPermisos.js
// Hook para manejar la edición de permisos de usuario

import { useState, useCallback } from "react";
import {
   cambiarRolUsuarioAdmin,
   actualizarAgentesUsuarioAdmin,
} from "../../../../../../servicios/apiService";

/**
 * Hook para manejar la edición de permisos de un usuario
 * @param {Object} params
 * @param {Object} params.usuarioSeleccionado - Usuario actualmente seleccionado
 * @param {Function} params.cargarDatos - Función para recargar datos
 * @param {Function} params.recargarDetallesUsuario - Función para recargar detalles
 * @returns {Object} Estado y funciones de edición
 */
export const useEdicionPermisos = ({
   usuarioSeleccionado,
   cargarDatos,
   recargarDetallesUsuario,
}) => {
   const [modoEdicion, setModoEdicion] = useState(false);
   const [cambiosPendientes, setCambiosPendientes] = useState({});
   const [guardando, setGuardando] = useState(false);
   const [errorGuardado, setErrorGuardado] = useState(null);

   // Roles disponibles para asignar (no incluye superadmin)
   const rolesDisponibles = [
      { codigo: "admin", nombre: "Administrador" },
      { codigo: "operador", nombre: "Operador" },
      { codigo: "observador", nombre: "Observador" },
   ];

   // Iniciar modo edición
   const iniciarEdicion = useCallback(() => {
      if (!usuarioSeleccionado) return;
      setModoEdicion(true);
      setErrorGuardado(null);
      setCambiosPendientes({
         rolGlobal: usuarioSeleccionado.rolGlobal,
         accesoTotal: usuarioSeleccionado.permisoAgentes?.accesoTotal || false,
         agentesIds: usuarioSeleccionado.permisoAgentes?.agentes?.map((a) => a.id) || [],
      });
   }, [usuarioSeleccionado]);

   // Cambiar rol
   const handleCambioRol = useCallback((nuevoRol) => {
      setCambiosPendientes((prev) => ({ ...prev, rolGlobal: nuevoRol }));
   }, []);

   // Toggle acceso total
   const handleToggleAccesoTotal = useCallback(() => {
      setCambiosPendientes((prev) => ({
         ...prev,
         accesoTotal: !prev.accesoTotal,
         agentesIds: !prev.accesoTotal ? [] : prev.agentesIds,
      }));
   }, []);

   // Toggle agente individual
   const handleToggleAgente = useCallback((agenteId) => {
      setCambiosPendientes((prev) => {
         const yaIncluido = prev.agentesIds.includes(agenteId);
         return {
            ...prev,
            agentesIds: yaIncluido
               ? prev.agentesIds.filter((id) => id !== agenteId)
               : [...prev.agentesIds, agenteId],
         };
      });
   }, []);

   // Verificar si hay modificaciones
   const tieneModificaciones = useCallback(() => {
      if (!usuarioSeleccionado || !cambiosPendientes.rolGlobal) return false;

      const rolCambio = usuarioSeleccionado.rolGlobal !== cambiosPendientes.rolGlobal;
      const accesoTotalCambio =
         (usuarioSeleccionado.permisoAgentes?.accesoTotal || false) !==
         cambiosPendientes.accesoTotal;
      const agentesOriginales =
         usuarioSeleccionado.permisoAgentes?.agentes?.map((a) => a.id).sort() || [];
      const agentesNuevos = [...cambiosPendientes.agentesIds].sort();
      const agentesCambio = JSON.stringify(agentesOriginales) !== JSON.stringify(agentesNuevos);

      return rolCambio || accesoTotalCambio || agentesCambio;
   }, [usuarioSeleccionado, cambiosPendientes]);

   // Guardar cambios
   const handleGuardarUsuario = useCallback(async () => {
      if (!usuarioSeleccionado) return;

      try {
         setGuardando(true);
         setErrorGuardado(null);

         if (usuarioSeleccionado.rolGlobal !== cambiosPendientes.rolGlobal) {
            await cambiarRolUsuarioAdmin(usuarioSeleccionado.id, cambiosPendientes.rolGlobal);
         }

         await actualizarAgentesUsuarioAdmin(
            usuarioSeleccionado.id,
            cambiosPendientes.accesoTotal,
            cambiosPendientes.agentesIds
         );

         await cargarDatos();
         await recargarDetallesUsuario();

         setModoEdicion(false);
         setCambiosPendientes({});
      } catch (err) {
         console.error("Error guardando usuario:", err);
         setErrorGuardado(err.message || err.detalles || "Error al guardar permisos");
      } finally {
         setGuardando(false);
      }
   }, [
      usuarioSeleccionado,
      cambiosPendientes,
      cargarDatos,
      recargarDetallesUsuario,
   ]);

   // Cancelar edición
   const handleCancelarEdicion = useCallback(() => {
      setModoEdicion(false);
      setCambiosPendientes({});
      setErrorGuardado(null);
   }, []);

   // Resetear estado de edición (al cambiar usuario)
   const resetearEdicion = useCallback(() => {
      setModoEdicion(false);
      setCambiosPendientes({});
      setErrorGuardado(null);
   }, []);

   return {
      // Estado
      modoEdicion,
      cambiosPendientes,
      guardando,
      errorGuardado,
      rolesDisponibles,

      // Acciones
      iniciarEdicion,
      handleCambioRol,
      handleToggleAccesoTotal,
      handleToggleAgente,
      tieneModificaciones,
      handleGuardarUsuario,
      handleCancelarEdicion,
      resetearEdicion,
   };
};
