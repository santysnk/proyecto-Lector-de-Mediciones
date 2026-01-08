// hooks/agentes/useRegistradoresWorkspace.js
// Hook para cargar registradores de un workspace a través de sus agentes

import { useState, useEffect, useCallback } from "react";
import { listarAgentesWorkspace, listarRegistradoresAgente } from "../../../../servicios/apiService";

/**
 * Hook para cargar todos los registradores de un workspace
 *
 * @param {string|null} workspaceId - ID del workspace
 * @returns {Object} Lista de registradores y función helper
 */
export const useRegistradoresWorkspace = (workspaceId) => {
   const [registradores, setRegistradores] = useState([]);
   const [cargando, setCargando] = useState(false);
   const [error, setError] = useState(null);

   useEffect(() => {
      if (!workspaceId) return;

      const cargarRegistradores = async () => {
         setCargando(true);
         setError(null);

         try {
            // Primero obtener los agentes vinculados al workspace
            const agentes = await listarAgentesWorkspace(workspaceId);

            // Luego cargar los registradores de cada agente
            const todosRegistradores = [];
            for (const agente of agentes || []) {
               try {
                  const regs = await listarRegistradoresAgente(agente.id);
                  if (regs && regs.length > 0) {
                     todosRegistradores.push(...regs);
                  }
               } catch (err) {
                  console.error(`Error cargando registradores del agente ${agente.id}:`, err);
               }
            }
            setRegistradores(todosRegistradores);
         } catch (err) {
            console.error("Error cargando registradores:", err);
            setError(err.message);
         } finally {
            setCargando(false);
         }
      };

      cargarRegistradores();
   }, [workspaceId]);

   // Helper para buscar un registrador por ID
   const buscarRegistrador = useCallback(
      (regId) => registradores.find((r) => r.id === regId) || null,
      [registradores]
   );

   return {
      registradores,
      cargando,
      error,
      buscarRegistrador,
   };
};
