// hooks/puestos/useGestionPuestos.js
// Hook para manejar operaciones CRUD de puestos

import { useState, useCallback } from "react";

/**
 * Hook para gestionar operaciones de puestos (crear, editar, eliminar)
 *
 * @param {Object} params
 * @param {Array} params.puestos - Lista de puestos actuales
 * @param {Function} params.agregarPuesto - Función para agregar puesto
 * @param {Function} params.eliminarPuesto - Función para eliminar puesto
 * @param {Function} params.actualizarPuestos - Función para actualizar puestos
 * @param {Function} params.resetearEscalaTarjeta - Función para resetear escala
 * @param {Function} params.establecerEscalaPuesto - Función para establecer escala de puesto
 * @param {Function} params.abrirModal - Función para abrir modal
 * @param {Function} params.cerrarModal - Función para cerrar modal
 * @returns {Object} Handlers y estado para gestión de puestos
 */
export const useGestionPuestos = ({
   puestos,
   agregarPuesto,
   eliminarPuesto,
   actualizarPuestos,
   resetearEscalaTarjeta,
   establecerEscalaPuesto,
   abrirModal,
   cerrarModal,
}) => {
   const [guardandoPuestos, setGuardandoPuestos] = useState(false);

   // Abrir modales
   const abrirModalNuevoPuesto = useCallback(() => abrirModal("nuevoPuesto"), [abrirModal]);
   const abrirModalEditarPuestos = useCallback(() => abrirModal("editarPuestos"), [abrirModal]);
   const abrirModalConfigPuesto = useCallback(() => abrirModal("configPuesto"), [abrirModal]);

   // Crear puesto
   const handleCrearPuesto = useCallback(
      (nombre, color) => {
         agregarPuesto(nombre, color);
         cerrarModal("nuevoPuesto");
      },
      [agregarPuesto, cerrarModal]
   );

   // Guardar puestos editados
   const handleGuardarPuestos = useCallback(
      async (puestosEditados) => {
         cerrarModal("editarPuestos");
         setGuardandoPuestos(true);

         try {
            // Detectar puestos eliminados
            const idsEditados = new Set(puestosEditados.map((p) => p.id));
            const puestosEliminados = puestos.filter((p) => !idsEditados.has(p.id));

            // Primero eliminar los puestos que fueron removidos
            for (const puesto of puestosEliminados) {
               await eliminarPuesto(puesto.id);
            }

            // Luego actualizar los puestos restantes
            if (puestosEditados.length > 0) {
               await actualizarPuestos(puestosEditados);
            }
         } catch (error) {
            console.error("Error guardando puestos:", error);
         } finally {
            setGuardandoPuestos(false);
         }
      },
      [puestos, eliminarPuesto, actualizarPuestos, cerrarModal]
   );

   // Handler para cambio de escala de puesto
   const handleEscalaPuestoChange = useCallback(
      (puestoId, escala) => {
         const puesto = puestos.find((p) => p.id === puestoId);
         if (puesto && puesto.alimentadores) {
            // Limpiar las escalas individuales de todos los alimentadores del puesto
            puesto.alimentadores.forEach((alim) => {
               resetearEscalaTarjeta(alim.id);
            });
         }
         establecerEscalaPuesto(puestoId, escala);
      },
      [puestos, establecerEscalaPuesto, resetearEscalaTarjeta]
   );

   return {
      guardandoPuestos,
      abrirModalNuevoPuesto,
      abrirModalEditarPuestos,
      abrirModalConfigPuesto,
      handleCrearPuesto,
      handleGuardarPuestos,
      handleEscalaPuestoChange,
   };
};
