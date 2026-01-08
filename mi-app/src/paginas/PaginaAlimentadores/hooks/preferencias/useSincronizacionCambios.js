// hooks/preferencias/useSincronizacionCambios.js
// Hook para manejar la sincronización de cambios pendientes

import { useState, useCallback, useEffect } from "react";

/**
 * Construye los gaps por fila por puesto desde el formato localStorage
 * @param {Array} puestos - Lista de puestos
 * @param {Object} gapsPorFila - Gaps del localStorage (formato "puestoId:rowIndex")
 * @returns {Object} Gaps organizados por puesto
 */
const construirGapsPorFilaPorPuesto = (puestos, gapsPorFila) => {
   const resultado = {};
   puestos.forEach((p) => {
      const gapsDelPuesto = {};
      Object.entries(gapsPorFila).forEach(([clave, valor]) => {
         if (clave.startsWith(`${p.id}:`)) {
            const rowIndex = clave.split(":")[1];
            gapsDelPuesto[rowIndex] = valor;
         }
      });
      resultado[p.id] = { ...p.gapsVerticales, ...gapsDelPuesto };
   });
   return resultado;
};

/**
 * Hook para manejar la sincronización de cambios entre cliente y servidor
 *
 * @param {Object} params
 * @param {boolean} params.esCreador - Si el usuario es creador
 * @param {Array} params.puestos - Lista de puestos
 * @param {Function} params.obtenerPuestosConPreferencias - Función para obtener puestos con preferencias
 * @param {Object} params.gapsPorTarjeta - Gaps horizontales por tarjeta
 * @param {Object} params.gapsPorFila - Gaps verticales por fila
 * @param {Object} params.escalasPorPuesto - Escalas por puesto
 * @param {Object} params.escalasPorTarjeta - Escalas por tarjeta
 * @param {Object} params.cambiosPendientesHook - Hook de cambios pendientes
 * @param {Object} params.preferenciasHook - Hook de preferencias UI
 * @param {Object} params.preferenciasVisualesHook - Hook de preferencias visuales
 * @param {Object} params.puestosHook - Hook de puestos
 * @returns {Object} Estado y funciones de sincronización
 */
export const useSincronizacionCambios = ({
   esCreador,
   puestos,
   obtenerPuestosConPreferencias,
   gapsPorTarjeta,
   gapsPorFila,
   escalasPorPuesto,
   escalasPorTarjeta,
   cambiosPendientesHook,
   preferenciasHook,
   preferenciasVisualesHook,
   puestosHook,
   cargandoPuestos,
   configuracionSeleccionadaId,
}) => {
   const [hayCambiosPendientes, setHayCambiosPendientes] = useState(false);
   const [snapshotGuardado, setSnapshotGuardado] = useState(false);

   const { guardarSnapshot, detectarCambios, sincronizarConBD, sincronizando, errorSincronizacion } =
      cambiosPendientesHook;

   // Guardar snapshot cuando termina la carga de BD
   useEffect(() => {
      if (esCreador === null) return;
      const prefsListas = esCreador || !preferenciasVisualesHook.cargando;

      if (puestos.length > 0 && !cargandoPuestos && prefsListas && !snapshotGuardado) {
         const puestosParaSnapshot = esCreador ? puestos : obtenerPuestosConPreferencias();
         guardarSnapshot(puestosParaSnapshot);
         setSnapshotGuardado(true);
      }
   }, [
      puestos,
      cargandoPuestos,
      snapshotGuardado,
      guardarSnapshot,
      esCreador,
      preferenciasVisualesHook.cargando,
      obtenerPuestosConPreferencias,
   ]);

   // Resetear flag cuando cambia el workspace
   useEffect(() => {
      setSnapshotGuardado(false);
   }, [configuracionSeleccionadaId]);

   // Detectar cambios cada vez que cambian los datos locales
   useEffect(() => {
      if (esCreador === null) return;

      if (puestos.length > 0) {
         const puestosParaDeteccion = esCreador ? puestos : obtenerPuestosConPreferencias();
         const gapsPorFilaPorPuesto = construirGapsPorFilaPorPuesto(puestosParaDeteccion, gapsPorFila);
         const { hayCambios } = detectarCambios(
            puestosParaDeteccion,
            gapsPorTarjeta,
            gapsPorFilaPorPuesto,
            escalasPorPuesto,
            escalasPorTarjeta
         );
         setHayCambiosPendientes(hayCambios);
      }
   }, [
      puestos,
      gapsPorTarjeta,
      gapsPorFila,
      escalasPorPuesto,
      escalasPorTarjeta,
      detectarCambios,
      esCreador,
      obtenerPuestosConPreferencias,
   ]);

   /**
    * Sincroniza cambios visuales de un invitado a preferencias_usuario
    */
   const sincronizarCambiosInvitado = useCallback(
      async (cambios) => {
         try {
            // Guardar cambios de puestos en preferencias
            for (const { id, campos } of cambios.puestos) {
               const prefsToSave = {};
               if (campos.color !== undefined) prefsToSave.color = campos.color;
               if (campos.bgColor !== undefined) prefsToSave.bg_color = campos.bgColor;
               if (campos.gapsVerticales !== undefined) prefsToSave.gapsVerticales = campos.gapsVerticales;
               if (campos.escala !== undefined) prefsToSave.escala = campos.escala;

               if (Object.keys(prefsToSave).length > 0) {
                  await preferenciasVisualesHook.guardarPreferenciasPuesto(id, prefsToSave);
               }
            }

            // Guardar cambios de alimentadores en preferencias
            for (const { id, campos } of cambios.alimentadores) {
               const prefsToSave = {};
               if (campos.color !== undefined) prefsToSave.color = campos.color;
               if (campos.gapHorizontal !== undefined) prefsToSave.gapHorizontal = campos.gapHorizontal;
               if (campos.escala !== undefined) prefsToSave.escala = campos.escala;

               if (Object.keys(prefsToSave).length > 0) {
                  await preferenciasVisualesHook.guardarPreferenciasAlimentador(id, prefsToSave);
               }
            }

            return true;
         } catch (error) {
            console.error("Error sincronizando preferencias de invitado:", error);
            throw error;
         }
      },
      [preferenciasVisualesHook]
   );

   /**
    * Sincroniza cambios con BD
    * Creadores: guarda en BASE
    * Invitados: guarda cambios visuales en preferencias_usuario
    */
   const sincronizarCambios = useCallback(async () => {
      if (!hayCambiosPendientes) return;

      const puestosParaSync = esCreador ? puestos : obtenerPuestosConPreferencias();
      const gapsPorFilaPorPuesto = construirGapsPorFilaPorPuesto(puestosParaSync, gapsPorFila);
      const { cambios } = detectarCambios(
         puestosParaSync,
         gapsPorTarjeta,
         gapsPorFilaPorPuesto,
         escalasPorPuesto,
         escalasPorTarjeta
      );

      const limpiarLocalStorage = () => {
         preferenciasHook.resetearTodosLosGaps();
         preferenciasHook.resetearTodosLosRowGaps();
         preferenciasHook.resetearTodasLasEscalasPuestos();
         preferenciasHook.resetearTodasLasEscalasTarjetas();
      };

      if (esCreador) {
         await sincronizarConBD(
            cambios,
            async () => {
               limpiarLocalStorage();
               setSnapshotGuardado(false);
               await puestosHook.cargarPuestos();
            },
            (error) => {
               console.error("Error al sincronizar:", error);
            }
         );
      } else {
         try {
            await sincronizarCambiosInvitado(cambios);
            limpiarLocalStorage();
            await preferenciasVisualesHook.cargarPreferencias();
            setSnapshotGuardado(false);
            await puestosHook.cargarPuestos();
         } catch (error) {
            console.error("Error al sincronizar preferencias:", error);
         }
      }
   }, [
      hayCambiosPendientes,
      puestos,
      gapsPorTarjeta,
      gapsPorFila,
      escalasPorPuesto,
      escalasPorTarjeta,
      detectarCambios,
      sincronizarConBD,
      puestosHook,
      preferenciasHook,
      esCreador,
      sincronizarCambiosInvitado,
      preferenciasVisualesHook,
      obtenerPuestosConPreferencias,
   ]);

   /**
    * Descarta cambios y restaura datos originales
    */
   const descartarCambios = useCallback(async () => {
      preferenciasHook.resetearTodosLosGaps();
      preferenciasHook.resetearTodosLosRowGaps();
      preferenciasHook.resetearTodasLasEscalasPuestos();
      preferenciasHook.resetearTodasLasEscalasTarjetas();
      setSnapshotGuardado(false);

      if (!esCreador) {
         await preferenciasVisualesHook.cargarPreferencias();
      }

      await puestosHook.cargarPuestos();
   }, [preferenciasHook, puestosHook, esCreador, preferenciasVisualesHook]);

   return {
      hayCambiosPendientes,
      sincronizando,
      errorSincronizacion,
      sincronizarCambios,
      descartarCambios,
   };
};
