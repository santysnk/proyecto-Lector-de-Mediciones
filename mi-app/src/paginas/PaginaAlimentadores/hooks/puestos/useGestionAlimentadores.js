// hooks/puestos/useGestionAlimentadores.js
// Hook para manejar operaciones CRUD de alimentadores

import { useState, useCallback } from "react";

/**
 * Hook para gestionar operaciones de alimentadores (crear, editar, eliminar)
 *
 * @param {Object} params
 * @param {Object} params.puestoSeleccionado - Puesto actualmente seleccionado
 * @param {Object|null} params.alimentadorEnEdicion - Alimentador siendo editado
 * @param {string} params.modoAlimentador - Modo actual ("crear" o "editar")
 * @param {boolean} params.esCreador - Si el usuario es creador del workspace
 * @param {Object} params.preferenciasVisuales - Preferencias visuales del usuario
 * @param {Function} params.agregarAlimentador - Función para agregar alimentador
 * @param {Function} params.actualizarAlimentador - Función para actualizar alimentador
 * @param {Function} params.eliminarAlimentador - Función para eliminar alimentador
 * @param {Function} params.detenerMedicion - Función para detener medición
 * @param {Function} params.obtenerGap - Función para obtener gap
 * @param {Function} params.establecerGap - Función para establecer gap
 * @param {Function} params.abrirModal - Función para abrir modal
 * @param {Function} params.cerrarModal - Función para cerrar modal
 * @returns {Object} Handlers y estado para gestión de alimentadores
 */
export const useGestionAlimentadores = ({
   puestoSeleccionado,
   alimentadorEnEdicion,
   modoAlimentador,
   esCreador,
   preferenciasVisuales,
   agregarAlimentador,
   actualizarAlimentador,
   eliminarAlimentador,
   detenerMedicion,
   obtenerGap,
   establecerGap,
   abrirModal,
   cerrarModal,
}) => {
   const [guardandoAlimentador, setGuardandoAlimentador] = useState(false);

   // Abrir modal para crear nuevo alimentador
   const abrirModalNuevoAlim = useCallback(
      () => abrirModal("alimentador", { modo: "crear" }),
      [abrirModal]
   );

   // Abrir modal para editar alimentador existente
   const abrirModalEditarAlim = useCallback(
      (_puestoId, alimentador) =>
         abrirModal("alimentador", { modo: "editar", alimentadorId: alimentador.id }),
      [abrirModal]
   );

   // Guardar alimentador (crear o editar)
   const handleGuardarAlimentador = useCallback(
      async (datos) => {
         if (!datos || !datos.nombre || !puestoSeleccionado) return;

         // Solo mostrar skeleton si estamos creando
         if (modoAlimentador === "crear") {
            setGuardandoAlimentador(true);
            cerrarModal("alimentador");
         }

         try {
            if (modoAlimentador === "crear") {
               const nuevoAlimentador = await agregarAlimentador(datos);
               // Establecer gap horizontal inicial
               if (nuevoAlimentador?.id) {
                  establecerGap(nuevoAlimentador.id, 10);
               }
            } else if (alimentadorEnEdicion) {
               if (esCreador) {
                  // CREADOR: Guardar todo en BD
                  const gapActual = obtenerGap(alimentadorEnEdicion.id);
                  await actualizarAlimentador(puestoSeleccionado.id, alimentadorEnEdicion.id, {
                     ...datos,
                     gapHorizontal: gapActual,
                  });
               } else {
                  // INVITADO: Solo guardar el color en preferencias personales
                  if (datos.color && preferenciasVisuales?.guardarPreferenciasAlimentador) {
                     await preferenciasVisuales.guardarPreferenciasAlimentador(
                        alimentadorEnEdicion.id,
                        { color: datos.color }
                     );
                  }
               }
               cerrarModal("alimentador");
            }
         } catch (error) {
            console.error("Error guardando alimentador:", error);
            setGuardandoAlimentador(false);
         } finally {
            if (modoAlimentador === "crear") {
               setTimeout(() => {
                  setGuardandoAlimentador(false);
               }, 300);
            }
         }
      },
      [
         puestoSeleccionado,
         modoAlimentador,
         alimentadorEnEdicion,
         esCreador,
         preferenciasVisuales,
         agregarAlimentador,
         actualizarAlimentador,
         obtenerGap,
         establecerGap,
         cerrarModal,
      ]
   );

   // Eliminar alimentador
   const handleEliminarAlimentador = useCallback(() => {
      if (!puestoSeleccionado || !alimentadorEnEdicion) return;

      // Detener mediciones antes de eliminar
      detenerMedicion(alimentadorEnEdicion.id, "rele");
      detenerMedicion(alimentadorEnEdicion.id, "analizador");

      eliminarAlimentador(puestoSeleccionado.id, alimentadorEnEdicion.id);
      cerrarModal("alimentador");
   }, [puestoSeleccionado, alimentadorEnEdicion, detenerMedicion, eliminarAlimentador, cerrarModal]);

   return {
      guardandoAlimentador,
      abrirModalNuevoAlim,
      abrirModalEditarAlim,
      handleGuardarAlimentador,
      handleEliminarAlimentador,
   };
};
