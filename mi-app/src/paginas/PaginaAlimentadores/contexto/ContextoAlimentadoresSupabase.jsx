// src/paginas/PaginaAlimentadores/contexto/ContextoAlimentadoresSupabase.jsx
// Contexto de alimentadores que usa Supabase para persistencia

import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from "react";

import { usePuestosSupabase, useCambiosPendientes } from "../hooks/puestos";
import { useMediciones, useTransformadores } from "../hooks/mediciones";
import { usePreferenciasUI, usePreferenciasVisuales } from "../hooks/preferencias";
import {
   useGapsCombinados,
   useEscalasCombinadas,
   useSincronizacionCambios,
   useColoresPuesto,
} from "../hooks/preferencias";
import { usarContextoConfiguracion } from "./ContextoConfiguracion";

import {
   obtenerDisenoTarjeta,
   calcularValoresLadoTarjeta,
   tieneConfiguracionValida,
   calcularValoresFuncionalidad
} from "../utilidades/calculosMediciones";

const ContextoAlimentadores = createContext(null);

/**
 * Provider de alimentadores que usa Supabase.
 * Requiere estar envuelto por ProveedorConfiguracion.
 */
export const ProveedorAlimentadoresSupabase = ({ children }) => {
   // Obtener workspace activo del contexto superior
   const {
      configuracionSeleccionada,
      configuracionSeleccionadaId,
      cargando: cargandoConfig,
   } = usarContextoConfiguracion();

   // Determinar si el usuario es creador del workspace
   const esCreador = configuracionSeleccionada?.esCreador ?? null;

   // Hook de puestos conectado a Supabase
   const puestosHook = usePuestosSupabase(configuracionSeleccionadaId);

   // Hook de mediciones
   const medicionesHook = useMediciones();

   // Hook de transformadores (TI/TV/Relaciones)
   const transformadoresHook = useTransformadores(configuracionSeleccionadaId);

   // Hook de preferencias UI (gaps horizontales y verticales) - localStorage
   const preferenciasHook = usePreferenciasUI();

   // Hook de preferencias visuales persistentes en BD (para invitados)
   const preferenciasVisualesHook = usePreferenciasVisuales(
      configuracionSeleccionadaId,
      esCreador,
      puestosHook.puestos,
      puestosHook.cargarPuestos
   );

   // Hook de cambios pendientes (draft/publish pattern)
   const cambiosPendientesHook = useCambiosPendientes();

   const { registrosEnVivo } = medicionesHook;
   const { puestoSeleccionado, puestos, cargando: cargandoPuestos } = puestosHook;
   const { gapsPorTarjeta, gapsPorFila, escalasPorPuesto, escalasPorTarjeta } = preferenciasHook;

   const [lecturasTarjetas, setLecturasTarjetas] = useState({});

   // Estado de carga combinado
   const cargando =
      cargandoConfig || cargandoPuestos || (esCreador !== true && preferenciasVisualesHook.cargando);

   /**
    * Para invitados: aplica las preferencias personales sobre los puestos base.
    */
   const obtenerPuestosConPreferencias = useCallback(() => {
      if (esCreador || !preferenciasVisualesHook.preferenciasUsuario) {
         return puestos;
      }

      return puestos.map((puesto) => {
         const prefsPuesto = preferenciasVisualesHook.obtenerConfigPuesto(puesto.id);

         return {
            ...puesto,
            color: prefsPuesto?.color || puesto.color,
            bgColor: prefsPuesto?.bg_color || puesto.bgColor || puesto.bg_color,
            escala: prefsPuesto?.escala ?? puesto.escala,
            gapsVerticales: {
               ...(puesto.gapsVerticales || { "0": 40 }),
               ...(prefsPuesto?.gapsVerticales || {}),
            },
            alimentadores: (puesto.alimentadores || []).map((alim) => {
               const prefsAlim = preferenciasVisualesHook.obtenerConfigAlimentador(alim.id, puesto.id);
               return {
                  ...alim,
                  color: prefsAlim?.color || alim.color,
                  escala: prefsAlim?.escala ?? alim.escala,
                  gapHorizontal: prefsAlim?.gapHorizontal ?? alim.gapHorizontal ?? 10,
               };
            }),
         };
      });
   }, [esCreador, puestos, preferenciasVisualesHook]);

   // Hook de colores de puesto
   const { obtenerColorPuesto, obtenerBgColorPuesto } = useColoresPuesto({
      esCreador,
      puestos: puestosHook.puestos,
      preferenciasVisualesHook,
   });

   // Hook de gaps combinados
   const { obtenerGapCombinado, obtenerRowGapCombinado } = useGapsCombinados({
      esCreador,
      gapsPorTarjeta,
      gapsPorFila,
      puestoSeleccionado,
      puestos,
      preferenciasVisualesHook,
      GAP_DEFAULT: preferenciasHook.GAP_DEFAULT,
      ROW_GAP_DEFAULT: preferenciasHook.ROW_GAP_DEFAULT,
   });

   // Hook de escalas combinadas
   const {
      obtenerEscalaPuestoCombinada,
      obtenerEscalaTarjetaCombinada,
      obtenerEscalaEfectivaCombinada,
   } = useEscalasCombinadas({
      esCreador,
      escalasPorPuesto,
      escalasPorTarjeta,
      puestoSeleccionado,
      puestos,
      preferenciasVisualesHook,
      escalaGlobal: preferenciasHook.escalaGlobal,
      ESCALA_DEFAULT: preferenciasHook.ESCALA_DEFAULT,
   });

   // Hook de sincronización de cambios
   const { hayCambiosPendientes, sincronizando, errorSincronizacion, sincronizarCambios, descartarCambios } =
      useSincronizacionCambios({
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
      });

   // Función para limpiar todo el localStorage de preferencias UI (al salir)
   const limpiarPreferenciasUI = useCallback(() => {
      preferenciasHook.resetearTodosLosGaps();
      preferenciasHook.resetearTodosLosRowGaps();
   }, [preferenciasHook]);

   /**
    * Actualiza puestos según el rol del usuario.
    * - Creador: guarda en BASE (tabla puestos)
    * - Invitado: solo guarda colores en preferencias_usuario
    */
   const actualizarPuestosInteligente = useCallback(
      async (puestosEditados) => {
         if (esCreador) {
            await puestosHook.actualizarPuestos(puestosEditados);
         } else {
            // Invitado: solo guardar colores en preferencias_usuario
            for (const puesto of puestosEditados) {
               const puestoBase = puestosHook.puestos.find((p) => p.id === puesto.id);
               if (!puestoBase) continue;

               const colorActual = obtenerColorPuesto(puesto.id) || puestoBase.color;
               const bgColorActual =
                  obtenerBgColorPuesto(puesto.id) || puestoBase.bgColor || puestoBase.bg_color;

               const cambios = {};
               if (puesto.color !== colorActual) {
                  cambios.color = puesto.color;
               }
               if ((puesto.bgColor || puesto.bg_color) !== bgColorActual) {
                  cambios.bg_color = puesto.bgColor || puesto.bg_color;
               }

               if (Object.keys(cambios).length > 0) {
                  await preferenciasVisualesHook.guardarPreferenciasPuesto(puesto.id, cambios);
               }
            }
         }
      },
      [esCreador, puestosHook, preferenciasVisualesHook, obtenerColorPuesto, obtenerBgColorPuesto]
   );

   // Recalcular lecturas de tarjetas cuando cambian los datos
   useEffect(() => {
      if (!puestoSeleccionado) {
         setLecturasTarjetas({});
         return;
      }

      setLecturasTarjetas(() => {
         const nuevo = {};

         puestoSeleccionado.alimentadores.forEach((alim) => {
            const regsDelAlim = registrosEnVivo[alim.id] || null;
            const configTarjeta = alim.config_tarjeta;

            // Verificar si tiene la nueva estructura config_tarjeta
            const usarConfigTarjeta =
               configTarjeta &&
               (tieneConfiguracionValida(configTarjeta.superior) ||
                tieneConfiguracionValida(configTarjeta.inferior));

            if (usarConfigTarjeta) {
               // NUEVA ESTRUCTURA: usar config_tarjeta con funcionalidad_datos
               const calcularZona = (configZona) => {
                  if (!tieneConfiguracionValida(configZona)) {
                     return { titulo: "", boxes: [], oculto: configZona?.oculto || false };
                  }
                  // Usar los datos de funcionalidad guardados en la configuración
                  // Pasar función para obtener transformadores (TI/TV)
                  return calcularValoresFuncionalidad(
                     regsDelAlim,
                     configZona,
                     configZona.funcionalidad_datos,
                     transformadoresHook.obtenerPorId
                  );
               };

               nuevo[alim.id] = {
                  parteSuperior: calcularZona(configTarjeta.superior),
                  parteInferior: calcularZona(configTarjeta.inferior),
               };
            } else {
               // ESTRUCTURA ANTIGUA: usar card_design (fallback)
               const cardDesignData = alim.card_design || alim.mapeoMediciones || {};
               const diseno = obtenerDisenoTarjeta(cardDesignData);

               const parteSuperior = calcularValoresLadoTarjeta(regsDelAlim, diseno.superior);
               const parteInferior = calcularValoresLadoTarjeta(regsDelAlim, diseno.inferior);

               nuevo[alim.id] = { parteSuperior, parteInferior };
            }
         });

         return nuevo;
      });
   }, [puestoSeleccionado, registrosEnVivo, transformadoresHook.obtenerPorId]);

   // Objeto de contexto
   const valorContexto = useMemo(
      () => ({
         // Estados de carga
         cargando,
         error: puestosHook.error,

         // Workspace actual
         configuracionSeleccionada,
         configuracionSeleccionadaId,

         // Datos de puestos
         puestos: puestosHook.puestos,
         puestoSeleccionado: puestosHook.puestoSeleccionado,
         puestoSeleccionadoId: puestosHook.puestoSeleccionadoId,

         agregarPuesto: puestosHook.agregarPuesto,
         eliminarPuesto: puestosHook.eliminarPuesto,
         seleccionarPuesto: puestosHook.seleccionarPuesto,
         actualizarPuestos: actualizarPuestosInteligente,
         setPuestos: puestosHook.setPuestos,
         cargarPuestos: puestosHook.cargarPuestos,

         // Getters de colores
         obtenerColorPuesto,
         obtenerBgColorPuesto,

         // Alimentadores
         agregarAlimentador: puestosHook.agregarAlimentador,
         actualizarAlimentador: puestosHook.actualizarAlimentador,
         eliminarAlimentador: puestosHook.eliminarAlimentador,
         reordenarAlimentadores: puestosHook.reordenarAlimentadores,

         // Mediciones y lecturas
         lecturasTarjetas,
         registrosEnVivo: medicionesHook.registrosEnVivo,

         detenerMedicion: medicionesHook.detenerMedicion,
         obtenerRegistros: medicionesHook.obtenerRegistros,
         estaMidiendo: medicionesHook.estaMidiendo,
         obtenerTimestampInicio: medicionesHook.obtenerTimestampInicio,
         obtenerContadorLecturas: medicionesHook.obtenerContadorLecturas,
         actualizarRegistros: medicionesHook.actualizarRegistros,

         // Preferencias UI (gaps)
         gapsPorTarjeta: preferenciasHook.gapsPorTarjeta,
         gapsPorFila: preferenciasHook.gapsPorFila,
         obtenerGap: obtenerGapCombinado,
         establecerGap: preferenciasHook.establecerGap,
         obtenerRowGap: obtenerRowGapCombinado,
         establecerRowGap: preferenciasHook.establecerRowGap,
         GAP_MIN: preferenciasHook.GAP_MIN,
         GAP_MAX: preferenciasHook.GAP_MAX,
         GAP_DEFAULT: preferenciasHook.GAP_DEFAULT,
         ROW_GAP_MIN: preferenciasHook.ROW_GAP_MIN,
         ROW_GAP_MAX: preferenciasHook.ROW_GAP_MAX,
         ROW_GAP_DEFAULT: preferenciasHook.ROW_GAP_DEFAULT,

         // Escala de tarjetas
         escalaGlobal: preferenciasHook.escalaGlobal,
         establecerEscalaGlobal: preferenciasHook.establecerEscalaGlobal,
         resetearEscalaGlobal: preferenciasHook.resetearEscalaGlobal,
         escalasPorPuesto: preferenciasHook.escalasPorPuesto,
         obtenerEscalaPuesto: obtenerEscalaPuestoCombinada,
         establecerEscalaPuesto: preferenciasHook.establecerEscalaPuesto,
         resetearEscalaPuesto: preferenciasHook.resetearEscalaPuesto,
         escalasPorTarjeta: preferenciasHook.escalasPorTarjeta,
         obtenerEscalaTarjeta: obtenerEscalaTarjetaCombinada,
         establecerEscalaTarjeta: preferenciasHook.establecerEscalaTarjeta,
         resetearEscalaTarjeta: preferenciasHook.resetearEscalaTarjeta,
         obtenerEscalaEfectiva: obtenerEscalaEfectivaCombinada,
         resetearTodasLasEscalas: preferenciasHook.resetearTodasLasEscalas,
         ESCALA_MIN: preferenciasHook.ESCALA_MIN,
         ESCALA_MAX: preferenciasHook.ESCALA_MAX,
         ESCALA_DEFAULT: preferenciasHook.ESCALA_DEFAULT,

         // Cambios pendientes (draft/publish)
         hayCambiosPendientes,
         sincronizando,
         errorSincronizacion,
         sincronizarCambios,
         descartarCambios,

         // Limpieza al salir
         limpiarPreferenciasUI,

         // Info del rol del usuario
         esCreador,

         // Preferencias visuales persistentes
         preferenciasVisuales: {
            cargando: preferenciasVisualesHook.cargando,
            guardando: preferenciasVisualesHook.guardando,
            tienePreferenciasPersonales: preferenciasVisualesHook.tienePreferenciasPersonales,
            guardarPreferencia: preferenciasVisualesHook.guardarPreferencia,
            guardarPreferenciasPuesto: preferenciasVisualesHook.guardarPreferenciasPuesto,
            guardarPreferenciasAlimentador: preferenciasVisualesHook.guardarPreferenciasAlimentador,
            resetearPreferencias: preferenciasVisualesHook.resetearPreferencias,
            obtenerConfigPuesto: preferenciasVisualesHook.obtenerConfigPuesto,
            obtenerConfigAlimentador: preferenciasVisualesHook.obtenerConfigAlimentador,
         },
      }),
      [
         puestosHook,
         medicionesHook,
         preferenciasHook,
         preferenciasVisualesHook,
         lecturasTarjetas,
         configuracionSeleccionada,
         cargando,
         hayCambiosPendientes,
         sincronizando,
         errorSincronizacion,
         sincronizarCambios,
         descartarCambios,
         obtenerGapCombinado,
         obtenerRowGapCombinado,
         obtenerEscalaPuestoCombinada,
         obtenerEscalaTarjetaCombinada,
         obtenerEscalaEfectivaCombinada,
         limpiarPreferenciasUI,
         esCreador,
         actualizarPuestosInteligente,
         obtenerColorPuesto,
         obtenerBgColorPuesto,
      ]
   );

   return (
      <ContextoAlimentadores.Provider value={valorContexto}>{children}</ContextoAlimentadores.Provider>
   );
};

export const usarContextoAlimentadores = () => {
   const contexto = useContext(ContextoAlimentadores);

   if (!contexto) {
      throw new Error("usarContextoAlimentadores debe usarse dentro de ProveedorAlimentadoresSupabase");
   }

   return contexto;
};
