// hooks/puestos/useDragDropAlimentadores.js
// Hook para manejar drag & drop de alimentadores en la grilla

import { useCallback } from "react";

/**
 * Hook para gestionar drag & drop de tarjetas de alimentadores
 *
 * @param {Object} params
 * @param {Object} params.puestoSeleccionado - Puesto actualmente seleccionado
 * @param {string|null} params.elementoArrastrandoId - ID del elemento siendo arrastrado
 * @param {Function} params.alIniciarArrastre - Handler para iniciar arrastre
 * @param {Function} params.alTerminarArrastre - Handler para terminar arrastre
 * @param {Function} params.reordenarLista - Función para calcular nuevo orden
 * @param {Function} params.moverAlFinal - Función para mover al final
 * @param {Function} params.reordenarAlimentadores - Función para guardar nuevo orden
 * @param {Function} params.establecerGap - Función para establecer gap
 * @param {number} params.GAP_DEFAULT - Valor por defecto del gap
 * @returns {Object} Handlers para drag & drop
 */
export const useDragDropAlimentadores = ({
   puestoSeleccionado,
   elementoArrastrandoId,
   alIniciarArrastre,
   alTerminarArrastre,
   reordenarLista,
   moverAlFinal,
   reordenarAlimentadores,
   establecerGap,
   GAP_DEFAULT,
}) => {
   const handleDragStartAlim = useCallback(
      (alimId) => {
         alIniciarArrastre(alimId);
      },
      [alIniciarArrastre]
   );

   const handleDragEndAlim = useCallback(() => {
      alTerminarArrastre();
   }, [alTerminarArrastre]);

   const handleDropAlim = useCallback(
      (targetAlimId) => {
         if (!puestoSeleccionado || !elementoArrastrandoId) return;

         const nuevaLista = reordenarLista(
            puestoSeleccionado.alimentadores,
            elementoArrastrandoId,
            targetAlimId
         );

         // Resetear el gap de la tarjeta movida
         establecerGap(elementoArrastrandoId, GAP_DEFAULT);

         reordenarAlimentadores(puestoSeleccionado.id, nuevaLista);
         alTerminarArrastre();
      },
      [
         puestoSeleccionado,
         elementoArrastrandoId,
         reordenarLista,
         establecerGap,
         GAP_DEFAULT,
         reordenarAlimentadores,
         alTerminarArrastre,
      ]
   );

   const handleDropAlimAlFinal = useCallback(() => {
      if (!puestoSeleccionado || !elementoArrastrandoId) return;

      const nuevaLista = moverAlFinal(puestoSeleccionado.alimentadores, elementoArrastrandoId);

      // Resetear el gap de la tarjeta movida
      establecerGap(elementoArrastrandoId, GAP_DEFAULT);

      reordenarAlimentadores(puestoSeleccionado.id, nuevaLista);
      alTerminarArrastre();
   }, [
      puestoSeleccionado,
      elementoArrastrandoId,
      moverAlFinal,
      establecerGap,
      GAP_DEFAULT,
      reordenarAlimentadores,
      alTerminarArrastre,
   ]);

   return {
      handleDragStartAlim,
      handleDragEndAlim,
      handleDropAlim,
      handleDropAlimAlFinal,
   };
};
