// contexto/ContextoAlimentadoresSupabase.jsx
// Contexto de alimentadores que usa Supabase para persistencia

import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from "react";

import { usePuestosSupabase, useCambiosPendientes } from "../hooks/puestos";
import { useMediciones, useTransformadores } from "../hooks/mediciones";
import { usePreferenciasUI, usePreferenciasVisuales } from "../hooks/preferencias";
import { useGapsCombinados, useEscalasCombinadas, useSincronizacionCambios, useColoresPuesto } from "../hooks/preferencias";
import { usarContextoConfiguracion } from "./ContextoConfiguracion";
import { aplicarPreferenciasAPuestos, calcularLecturasTarjetas, extraerCambiosColorInvitado } from "./contextoAlimentadoresUtils";

const ContextoAlimentadores = createContext(null);

export const ProveedorAlimentadoresSupabase = ({ children }) => {
   const { configuracionSeleccionada, configuracionSeleccionadaId, cargando: cargandoConfig, rolGlobal } = usarContextoConfiguracion();
   const esCreador = configuracionSeleccionada?.esCreador ?? null;

   const puestosHook = usePuestosSupabase(configuracionSeleccionadaId);
   const medicionesHook = useMediciones();
   const transformadoresHook = useTransformadores(configuracionSeleccionadaId, { global: rolGlobal === 'superadmin' });
   const preferenciasHook = usePreferenciasUI();
   const preferenciasVisualesHook = usePreferenciasVisuales(configuracionSeleccionadaId, esCreador, puestosHook.puestos, puestosHook.cargarPuestos);
   const cambiosPendientesHook = useCambiosPendientes();

   const { registrosEnVivo } = medicionesHook;
   const { puestoSeleccionado, puestos, cargando: cargandoPuestos } = puestosHook;
   const { gapsPorTarjeta, gapsPorFila, escalasPorPuesto, escalasPorTarjeta } = preferenciasHook;

   const [lecturasTarjetas, setLecturasTarjetas] = useState({});

   const cargando = cargandoConfig || cargandoPuestos || (esCreador !== true && preferenciasVisualesHook.cargando);

   const obtenerPuestosConPreferencias = useCallback(() => {
      if (esCreador || !preferenciasVisualesHook.preferenciasUsuario) return puestos;
      return aplicarPreferenciasAPuestos(puestos, preferenciasVisualesHook);
   }, [esCreador, puestos, preferenciasVisualesHook]);

   const { obtenerColorPuesto, obtenerBgColorPuesto } = useColoresPuesto({ esCreador, puestos: puestosHook.puestos, preferenciasVisualesHook });

   const { obtenerGapCombinado, obtenerRowGapCombinado } = useGapsCombinados({
      esCreador, gapsPorTarjeta, gapsPorFila, puestoSeleccionado, puestos, preferenciasVisualesHook,
      GAP_DEFAULT: preferenciasHook.GAP_DEFAULT, ROW_GAP_DEFAULT: preferenciasHook.ROW_GAP_DEFAULT,
   });

   const { obtenerEscalaPuestoCombinada, obtenerEscalaTarjetaCombinada, obtenerEscalaEfectivaCombinada } = useEscalasCombinadas({
      esCreador, escalasPorPuesto, escalasPorTarjeta, puestoSeleccionado, puestos, preferenciasVisualesHook,
      escalaGlobal: preferenciasHook.escalaGlobal, ESCALA_DEFAULT: preferenciasHook.ESCALA_DEFAULT,
   });

   const { hayCambiosPendientes, sincronizando, errorSincronizacion, sincronizarCambios, descartarCambios } = useSincronizacionCambios({
      esCreador, puestos, obtenerPuestosConPreferencias, gapsPorTarjeta, gapsPorFila, escalasPorPuesto, escalasPorTarjeta,
      cambiosPendientesHook, preferenciasHook, preferenciasVisualesHook, puestosHook, cargandoPuestos, configuracionSeleccionadaId,
   });

   const limpiarPreferenciasUI = useCallback(() => {
      preferenciasHook.resetearTodosLosGaps();
      preferenciasHook.resetearTodosLosRowGaps();
   }, [preferenciasHook]);

   const actualizarPuestosInteligente = useCallback(async (puestosEditados) => {
      if (esCreador) {
         await puestosHook.actualizarPuestos(puestosEditados);
      } else {
         const cambios = extraerCambiosColorInvitado(puestosEditados, puestosHook.puestos, obtenerColorPuesto, obtenerBgColorPuesto);
         for (const { id, cambios: c } of cambios) {
            await preferenciasVisualesHook.guardarPreferenciasPuesto(id, c);
         }
      }
   }, [esCreador, puestosHook, preferenciasVisualesHook, obtenerColorPuesto, obtenerBgColorPuesto]);

   useEffect(() => {
      if (!puestoSeleccionado) { setLecturasTarjetas({}); return; }
      setLecturasTarjetas(calcularLecturasTarjetas(puestoSeleccionado, registrosEnVivo, transformadoresHook.obtenerPorId));
   }, [puestoSeleccionado, registrosEnVivo, transformadoresHook.obtenerPorId]);

   const valorContexto = useMemo(() => ({
      cargando, error: puestosHook.error,
      configuracionSeleccionada, configuracionSeleccionadaId,
      puestos: puestosHook.puestos, puestoSeleccionado: puestosHook.puestoSeleccionado, puestoSeleccionadoId: puestosHook.puestoSeleccionadoId,
      agregarPuesto: puestosHook.agregarPuesto, eliminarPuesto: puestosHook.eliminarPuesto,
      seleccionarPuesto: puestosHook.seleccionarPuesto, actualizarPuestos: actualizarPuestosInteligente,
      setPuestos: puestosHook.setPuestos, cargarPuestos: puestosHook.cargarPuestos,
      obtenerColorPuesto, obtenerBgColorPuesto,
      agregarAlimentador: puestosHook.agregarAlimentador, actualizarAlimentador: puestosHook.actualizarAlimentador,
      eliminarAlimentador: puestosHook.eliminarAlimentador, reordenarAlimentadores: puestosHook.reordenarAlimentadores,
      lecturasTarjetas, registrosEnVivo: medicionesHook.registrosEnVivo,
      detenerMedicion: medicionesHook.detenerMedicion, obtenerRegistros: medicionesHook.obtenerRegistros,
      estaMidiendo: medicionesHook.estaMidiendo, obtenerTimestampInicio: medicionesHook.obtenerTimestampInicio,
      obtenerContadorLecturas: medicionesHook.obtenerContadorLecturas, actualizarRegistros: medicionesHook.actualizarRegistros,
      transformadores: transformadoresHook.transformadores, obtenerTransformadorPorId: transformadoresHook.obtenerPorId,
      transformadoresCargando: transformadoresHook.cargando,
      gapsPorTarjeta: preferenciasHook.gapsPorTarjeta, gapsPorFila: preferenciasHook.gapsPorFila,
      obtenerGap: obtenerGapCombinado, establecerGap: preferenciasHook.establecerGap,
      obtenerRowGap: obtenerRowGapCombinado, establecerRowGap: preferenciasHook.establecerRowGap,
      GAP_MIN: preferenciasHook.GAP_MIN, GAP_MAX: preferenciasHook.GAP_MAX, GAP_DEFAULT: preferenciasHook.GAP_DEFAULT,
      ROW_GAP_MIN: preferenciasHook.ROW_GAP_MIN, ROW_GAP_MAX: preferenciasHook.ROW_GAP_MAX, ROW_GAP_DEFAULT: preferenciasHook.ROW_GAP_DEFAULT,
      escalaGlobal: preferenciasHook.escalaGlobal, establecerEscalaGlobal: preferenciasHook.establecerEscalaGlobal,
      resetearEscalaGlobal: preferenciasHook.resetearEscalaGlobal,
      escalasPorPuesto: preferenciasHook.escalasPorPuesto, obtenerEscalaPuesto: obtenerEscalaPuestoCombinada,
      establecerEscalaPuesto: preferenciasHook.establecerEscalaPuesto, resetearEscalaPuesto: preferenciasHook.resetearEscalaPuesto,
      escalasPorTarjeta: preferenciasHook.escalasPorTarjeta, obtenerEscalaTarjeta: obtenerEscalaTarjetaCombinada,
      establecerEscalaTarjeta: preferenciasHook.establecerEscalaTarjeta, resetearEscalaTarjeta: preferenciasHook.resetearEscalaTarjeta,
      obtenerEscalaEfectiva: obtenerEscalaEfectivaCombinada, resetearTodasLasEscalas: preferenciasHook.resetearTodasLasEscalas,
      ESCALA_MIN: preferenciasHook.ESCALA_MIN, ESCALA_MAX: preferenciasHook.ESCALA_MAX, ESCALA_DEFAULT: preferenciasHook.ESCALA_DEFAULT,
      hayCambiosPendientes, sincronizando, errorSincronizacion, sincronizarCambios, descartarCambios,
      limpiarPreferenciasUI, esCreador,
      preferenciasVisuales: {
         cargando: preferenciasVisualesHook.cargando, guardando: preferenciasVisualesHook.guardando,
         tienePreferenciasPersonales: preferenciasVisualesHook.tienePreferenciasPersonales,
         guardarPreferencia: preferenciasVisualesHook.guardarPreferencia,
         guardarPreferenciasPuesto: preferenciasVisualesHook.guardarPreferenciasPuesto,
         guardarPreferenciasAlimentador: preferenciasVisualesHook.guardarPreferenciasAlimentador,
         resetearPreferencias: preferenciasVisualesHook.resetearPreferencias,
         obtenerConfigPuesto: preferenciasVisualesHook.obtenerConfigPuesto,
         obtenerConfigAlimentador: preferenciasVisualesHook.obtenerConfigAlimentador,
      },
   }), [
      puestosHook, medicionesHook, preferenciasHook, preferenciasVisualesHook, transformadoresHook,
      lecturasTarjetas, configuracionSeleccionada, cargando,
      hayCambiosPendientes, sincronizando, errorSincronizacion, sincronizarCambios, descartarCambios,
      obtenerGapCombinado, obtenerRowGapCombinado,
      obtenerEscalaPuestoCombinada, obtenerEscalaTarjetaCombinada, obtenerEscalaEfectivaCombinada,
      limpiarPreferenciasUI, esCreador, actualizarPuestosInteligente, obtenerColorPuesto, obtenerBgColorPuesto,
   ]);

   return <ContextoAlimentadores.Provider value={valorContexto}>{children}</ContextoAlimentadores.Provider>;
};

export const usarContextoAlimentadores = () => {
   const contexto = useContext(ContextoAlimentadores);
   if (!contexto) throw new Error("usarContextoAlimentadores debe usarse dentro de ProveedorAlimentadoresSupabase");
   return contexto;
};
