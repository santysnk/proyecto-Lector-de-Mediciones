// layout/useVistaAlimentadores.js
// Hook que orquesta todos los sub-hooks de VistaAlimentadores

import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../contextos/AuthContext";

import { usarContextoAlimentadores } from "../../contexto/ContextoAlimentadoresSupabase";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import { useHistorialLocal } from "../../hooks/historial";
import { usePushNotifications } from "../../../../hooks/usePushNotifications";
import { usePollingLecturas, useModalLecturaCompleta, useTransformadores } from "../../hooks/mediciones";
import { useVentanasHistorial, useGestorModales, useModoCompacto } from "../../hooks/ui";
import { useVentanaConfigAgente, useRegistradoresWorkspace } from "../../hooks/agentes";
import {
   useArrastrarSoltar, usePreferenciasVisualesPuestos, useGestionPuestos,
   useGestionAlimentadores, useDragDropAlimentadores,
} from "../../hooks/puestos";

export function useVistaAlimentadores() {
   const navigate = useNavigate();
   const { logout } = useAuth();
   const { configuracionSeleccionada, perfil, rolGlobal, estilosGlobales, guardarEstilosGlobales } = usarContextoConfiguracion();

   const ctx = usarContextoAlimentadores();
   const {
      puestos, puestoSeleccionado, agregarPuesto, eliminarPuesto, seleccionarPuesto, actualizarPuestos,
      agregarAlimentador, actualizarAlimentador, eliminarAlimentador, reordenarAlimentadores,
      lecturasTarjetas, estaMidiendo, obtenerTimestampInicio, obtenerContadorLecturas,
      detenerMedicion, actualizarRegistros, cargando, error,
      obtenerGap, establecerGap, obtenerRowGap, establecerRowGap, GAP_DEFAULT,
      escalaGlobal, obtenerEscalaEfectiva, establecerEscalaTarjeta, resetearEscalaTarjeta,
      obtenerEscalaPuesto, establecerEscalaPuesto, ESCALA_MIN, ESCALA_MAX,
      limpiarPreferenciasUI, sincronizando, obtenerBgColorPuesto, esCreador, preferenciasVisuales, registrosEnVivo,
   } = ctx;

   const transformadoresHook = useTransformadores(configuracionSeleccionada?.id);
   const modalLecturaCompleta = useModalLecturaCompleta();
   const { elementoArrastrandoId, alIniciarArrastre, alTerminarArrastre, alPasarPorEncima, reordenarLista, moverAlFinal } = useArrastrarSoltar();
   const { abrirModal, cerrarModal, obtenerEstado } = useGestorModales();
   const { guardarLecturaLocal } = useHistorialLocal();

   usePushNotifications({
      habilitado: true,
      onNotificacion: (notif) => console.log('[VistaAlimentadores] Notificación en primer plano:', notif),
      onNotificacionTocada: (datos) => console.log('[VistaAlimentadores] Usuario tocó notificación:', datos),
   });

   const { listaVentanas, ventanasMinimizadas, abrirVentana, cerrarVentana, toggleMinimizar, toggleMaximizar, enfocarVentana, moverVentana } = useVentanasHistorial();
   const { esCompacto, obtenerEscalaEfectivaConModoCompacto } = useModoCompacto({ escalaGlobal, obtenerEscalaEfectiva });

   const [menuAbierto, setMenuAbierto] = React.useState(false);
   const [modalAccesosAbierto, setModalAccesosAbierto] = React.useState(false);
   const [modalPanelPermisosAbierto, setModalPanelPermisosAbierto] = React.useState(false);

   const ventanaConfigAgente = useVentanaConfigAgente();
   const { buscarRegistrador } = useRegistradoresWorkspace(configuracionSeleccionada?.id);
   const { puestosConPreferencias, alimentadoresConPreferencias } = usePreferenciasVisualesPuestos({ esCreador, puestos, puestoSeleccionado, preferenciasVisuales });

   const estadoModalNuevoPuesto = obtenerEstado("nuevoPuesto");
   const estadoModalEditarPuestos = obtenerEstado("editarPuestos");
   const estadoModalAlimentador = obtenerEstado("alimentador");
   const estadoModalConfigPuesto = obtenerEstado("configPuesto");

   const buscarAlimentador = useCallback((alimId) => alimentadoresConPreferencias.find((a) => a.id === alimId) || null, [alimentadoresConPreferencias]);
   const alimentadorEnEdicion = estadoModalAlimentador.datos?.alimentadorId ? buscarAlimentador(estadoModalAlimentador.datos.alimentadorId) : null;
   const modoAlimentador = estadoModalAlimentador.datos?.modo || "crear";

   const { estaPolling, obtenerContadorPolling, obtenerErrorPolling, handlePlayStopClick, limpiarTodosIntervalos, hayProblemaConexion } =
      usePollingLecturas({ actualizarRegistros, guardarLecturaLocal, buscarAlimentador });

   const { guardandoPuestos, abrirModalNuevoPuesto, abrirModalEditarPuestos, abrirModalConfigPuesto, handleCrearPuesto, handleGuardarPuestos, handleEscalaPuestoChange } =
      useGestionPuestos({ puestos, agregarPuesto, eliminarPuesto, actualizarPuestos, resetearEscalaTarjeta, establecerEscalaPuesto, abrirModal, cerrarModal });

   const { guardandoAlimentador, abrirModalNuevoAlim, abrirModalEditarAlim, handleGuardarAlimentador, handleEliminarAlimentador } =
      useGestionAlimentadores({
         puestoSeleccionado, alimentadorEnEdicion, modoAlimentador, esCreador, preferenciasVisuales,
         agregarAlimentador, actualizarAlimentador, eliminarAlimentador, detenerMedicion, obtenerGap, establecerGap, abrirModal, cerrarModal,
      });

   const { handleDragStartAlim, handleDragEndAlim, handleDropAlim, handleDropAlimAlFinal } =
      useDragDropAlimentadores({
         puestoSeleccionado, elementoArrastrandoId, alIniciarArrastre, alTerminarArrastre,
         reordenarLista, moverAlFinal, reordenarAlimentadores, establecerGap, GAP_DEFAULT,
      });

   const handleSalir = async () => { limpiarPreferenciasUI(); await logout(); navigate("/"); };
   const abrirModalConfigurarAgente = () => ventanaConfigAgente.abrirVentana(configuracionSeleccionada?.id);
   const abrirModalGestionarAccesos = () => setModalAccesosAbierto(true);
   const abrirModalPanelPermisos = () => setModalPanelPermisosAbierto(true);

   const handleExpandirLectura = useCallback((alimentador) => {
      const registrosAlim = registrosEnVivo[alimentador.id] || null;
      modalLecturaCompleta.abrirModal(alimentador, registrosAlim, registrosAlim?.timestamp || null);
   }, [registrosEnVivo, modalLecturaCompleta]);

   useEffect(() => { return () => limpiarTodosIntervalos(); }, [limpiarTodosIntervalos]);

   return {
      // Config
      configuracionSeleccionada, perfil, rolGlobal, estilosGlobales, guardarEstilosGlobales,
      // Estado general
      cargando, error, sincronizando, esCompacto, hayProblemaConexion,
      // Puestos
      puestos, puestoSeleccionado, seleccionarPuesto, puestosConPreferencias, alimentadoresConPreferencias,
      obtenerBgColorPuesto, esCreador,
      // Lecturas
      lecturasTarjetas, estaMidiendo, obtenerTimestampInicio, obtenerContadorLecturas, registrosEnVivo,
      estaPolling, obtenerContadorPolling, obtenerErrorPolling, handlePlayStopClick,
      // Gaps y escalas
      obtenerGap, establecerGap, obtenerRowGap, establecerRowGap,
      obtenerEscalaEfectivaConModoCompacto, establecerEscalaTarjeta, obtenerEscalaPuesto,
      ESCALA_MIN, ESCALA_MAX,
      // Drag & drop
      elementoArrastrandoId, alPasarPorEncima,
      handleDragStartAlim, handleDragEndAlim, handleDropAlim, handleDropAlimAlFinal,
      // Modales
      estadoModalNuevoPuesto, estadoModalEditarPuestos, estadoModalAlimentador, estadoModalConfigPuesto,
      cerrarModal, guardandoPuestos, guardandoAlimentador,
      abrirModalNuevoPuesto, abrirModalEditarPuestos, abrirModalConfigPuesto,
      abrirModalNuevoAlim, abrirModalEditarAlim, abrirModalConfigurarAgente, abrirModalGestionarAccesos, abrirModalPanelPermisos,
      handleCrearPuesto, handleGuardarPuestos, handleEscalaPuestoChange,
      handleGuardarAlimentador, handleEliminarAlimentador,
      alimentadorEnEdicion, modoAlimentador,
      // Menú y modales especiales
      menuAbierto, setMenuAbierto, modalAccesosAbierto, setModalAccesosAbierto,
      modalPanelPermisosAbierto, setModalPanelPermisosAbierto,
      // Agente
      ventanaConfigAgente, buscarRegistrador,
      // Historial
      listaVentanas, ventanasMinimizadas, abrirVentana, cerrarVentana, toggleMinimizar, toggleMaximizar, enfocarVentana, moverVentana,
      // Lectura completa
      modalLecturaCompleta, transformadoresHook, handleExpandirLectura,
      // Navegación
      handleSalir,
   };
}
