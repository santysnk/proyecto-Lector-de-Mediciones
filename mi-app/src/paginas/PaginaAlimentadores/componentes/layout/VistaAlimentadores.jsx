// src/paginas/PaginaAlimentadores/componentes/layout/VistaAlimentadores.jsx

import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../contextos/AuthContext";
import "./VistaAlimentadores.css";
import "../navegacion/BotonGuardarCambios.css";

import BarraNavegacion from "../navegacion/BarraNavegacion.jsx";
import MenuLateral from "../navegacion/MenuLateral.jsx";
import GrillaTarjetas from "../tarjetas/GrillaTarjetas.jsx";
import SkeletonCard from "../tarjetas/SkeletonCard.jsx";
import { ContenedorVentanasHistorial } from "../modales/historial";

import { COLORES_SISTEMA } from "../../constantes/colores";
import { usarContextoAlimentadores } from "../../contexto/ContextoAlimentadoresSupabase";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import { useHistorialLocal } from "../../hooks/historial";
import { usePushNotifications } from "../../../../hooks/usePushNotifications";
import { usePollingLecturas, useModalLecturaCompleta, useTransformadores } from "../../hooks/mediciones";
import { ModalLecturaCompleta } from "../modales/lectura-completa";

// Hooks UI
import { useVentanasHistorial, useGestorModales, useModoCompacto } from "../../hooks/ui";
import { useVentanaConfigAgente, useRegistradoresWorkspace } from "../../hooks/agentes";
import {
   useArrastrarSoltar,
   usePreferenciasVisualesPuestos,
   useGestionPuestos,
   useGestionAlimentadores,
   useDragDropAlimentadores,
} from "../../hooks/puestos";

// Componentes extraídos
import EstadoCarga from "./EstadoCarga";
import EstadoVacio from "./EstadoVacio";
import OverlayGuardando from "./OverlayGuardando";
import OverlayConexion from "./OverlayConexion";
import ModalesVista from "./ModalesVista";

const VistaAlimentadores = () => {
   const navigate = useNavigate();
   const { logout } = useAuth();
   const {
      configuracionSeleccionada,
      perfil,
      rolGlobal,
      estilosGlobales,
      guardarEstilosGlobales,
   } = usarContextoConfiguracion();

   const {
      puestos,
      puestoSeleccionado,
      agregarPuesto,
      eliminarPuesto,
      seleccionarPuesto,
      actualizarPuestos,
      agregarAlimentador,
      actualizarAlimentador,
      eliminarAlimentador,
      reordenarAlimentadores,
      lecturasTarjetas,
      estaMidiendo,
      obtenerTimestampInicio,
      obtenerContadorLecturas,
      detenerMedicion,
      actualizarRegistros,
      cargando,
      error,
      obtenerGap,
      establecerGap,
      obtenerRowGap,
      establecerRowGap,
      GAP_DEFAULT,
      escalaGlobal,
      obtenerEscalaEfectiva,
      establecerEscalaTarjeta,
      resetearEscalaTarjeta,
      obtenerEscalaPuesto,
      establecerEscalaPuesto,
      ESCALA_MIN,
      ESCALA_MAX,
      limpiarPreferenciasUI,
      sincronizando,
      obtenerBgColorPuesto,
      esCreador,
      preferenciasVisuales,
      registrosEnVivo,
   } = usarContextoAlimentadores();

   // Hook de transformadores para el modal de lectura completa
   const transformadoresHook = useTransformadores(configuracionSeleccionada?.id);

   // Hook del modal de lectura completa
   const modalLecturaCompleta = useModalLecturaCompleta();

   // Hook de arrastre base
   const {
      elementoArrastrandoId,
      alIniciarArrastre,
      alTerminarArrastre,
      alPasarPorEncima,
      reordenarLista,
      moverAlFinal,
   } = useArrastrarSoltar();

   // Gestor de modales
   const { abrirModal, cerrarModal, obtenerEstado } = useGestorModales();
   const { guardarLecturaLocal } = useHistorialLocal();

   // Push notifications
   usePushNotifications({
      habilitado: true,
      onNotificacion: (notif) => {
         console.log('[VistaAlimentadores] Notificación en primer plano:', notif);
      },
      onNotificacionTocada: (datos) => {
         console.log('[VistaAlimentadores] Usuario tocó notificación:', datos);
      },
   });

   // Sistema de ventanas flotantes de historial
   const {
      listaVentanas,
      ventanasMinimizadas,
      abrirVentana,
      cerrarVentana,
      toggleMinimizar,
      toggleMaximizar,
      enfocarVentana,
      moverVentana,
   } = useVentanasHistorial();

   // Modo compacto (responsive)
   const { esCompacto, obtenerEscalaEfectivaConModoCompacto } = useModoCompacto({
      escalaGlobal,
      obtenerEscalaEfectiva,
   });

   // Estados locales simples
   const [menuAbierto, setMenuAbierto] = React.useState(false);
   const [modalAccesosAbierto, setModalAccesosAbierto] = React.useState(false);
   const [modalPanelPermisosAbierto, setModalPanelPermisosAbierto] = React.useState(false);

   // Ventana de configuración de agente
   const {
      ventana: ventanaConfigAgente,
      abrirVentana: abrirVentanaConfigAgente,
      cerrarVentana: cerrarVentanaConfigAgente,
      toggleMinimizar: toggleMinimizarConfigAgente,
      toggleMaximizar: toggleMaximizarConfigAgente,
      enfocarVentana: enfocarVentanaConfigAgente,
      moverVentana: moverVentanaConfigAgente,
   } = useVentanaConfigAgente();

   // Registradores del workspace
   const { buscarRegistrador } = useRegistradoresWorkspace(configuracionSeleccionada?.id);

   // Preferencias visuales aplicadas
   const { puestosConPreferencias, alimentadoresConPreferencias } = usePreferenciasVisualesPuestos({
      esCreador,
      puestos,
      puestoSeleccionado,
      preferenciasVisuales,
   });

   // Estados de modales
   const estadoModalNuevoPuesto = obtenerEstado("nuevoPuesto");
   const estadoModalEditarPuestos = obtenerEstado("editarPuestos");
   const estadoModalAlimentador = obtenerEstado("alimentador");
   const estadoModalConfigPuesto = obtenerEstado("configPuesto");

   const buscarAlimentador = useCallback(
      (alimId) => alimentadoresConPreferencias.find((a) => a.id === alimId) || null,
      [alimentadoresConPreferencias]
   );

   const alimentadorEnEdicion = estadoModalAlimentador.datos?.alimentadorId
      ? buscarAlimentador(estadoModalAlimentador.datos.alimentadorId)
      : null;
   const modoAlimentador = estadoModalAlimentador.datos?.modo || "crear";

   // Hook de polling de lecturas
   const {
      estaPolling,
      obtenerContadorPolling,
      obtenerErrorPolling,
      handlePlayStopClick,
      limpiarTodosIntervalos,
      hayProblemaConexion,
   } = usePollingLecturas({
      actualizarRegistros,
      guardarLecturaLocal,
      buscarAlimentador,
   });

   // Gestión de puestos
   const {
      guardandoPuestos,
      abrirModalNuevoPuesto,
      abrirModalEditarPuestos,
      abrirModalConfigPuesto,
      handleCrearPuesto,
      handleGuardarPuestos,
      handleEscalaPuestoChange,
   } = useGestionPuestos({
      puestos,
      agregarPuesto,
      eliminarPuesto,
      actualizarPuestos,
      resetearEscalaTarjeta,
      establecerEscalaPuesto,
      abrirModal,
      cerrarModal,
   });

   // Gestión de alimentadores
   const {
      guardandoAlimentador,
      abrirModalNuevoAlim,
      abrirModalEditarAlim,
      handleGuardarAlimentador,
      handleEliminarAlimentador,
   } = useGestionAlimentadores({
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
   });

   // Drag & drop de alimentadores
   const { handleDragStartAlim, handleDragEndAlim, handleDropAlim, handleDropAlimAlFinal } =
      useDragDropAlimentadores({
         puestoSeleccionado,
         elementoArrastrandoId,
         alIniciarArrastre,
         alTerminarArrastre,
         reordenarLista,
         moverAlFinal,
         reordenarAlimentadores,
         establecerGap,
         GAP_DEFAULT,
      });

   // Navegación
   const handleSalir = async () => {
      limpiarPreferenciasUI();
      await logout();
      navigate("/");
   };

   // Handlers de modales especiales
   const abrirModalConfigurarAgente = () => abrirVentanaConfigAgente(configuracionSeleccionada?.id);
   const abrirModalGestionarAccesos = () => setModalAccesosAbierto(true);
   const abrirModalPanelPermisos = () => setModalPanelPermisosAbierto(true);

   // Handler para expandir lectura completa
   const handleExpandirLectura = useCallback((alimentador) => {
      const registrosAlim = registrosEnVivo[alimentador.id] || null;
      // Obtener timestamp de la última lectura si existe
      const timestamp = registrosAlim?.timestamp || Date.now();
      modalLecturaCompleta.abrirModal(alimentador, registrosAlim, timestamp);
   }, [registrosEnVivo, modalLecturaCompleta]);

   // Limpiar intervalos de polling al desmontar
   useEffect(() => {
      return () => limpiarTodosIntervalos();
   }, [limpiarTodosIntervalos]);

   // Estado de carga
   if (cargando && !sincronizando) {
      return <EstadoCarga />;
   }

   // Estado de error
   if (error) {
      return <EstadoCarga error={error} />;
   }

   return (
      <div className="alim-page">
         {/* Overlay de guardando puestos */}
         <OverlayGuardando visible={guardandoPuestos} />

         {/* ===== NAV SUPERIOR ===== */}
         <BarraNavegacion
            esCompacto={esCompacto}
            puestos={puestos}
            puestoSeleccionado={puestoSeleccionado}
            onSeleccionarPuesto={seleccionarPuesto}
            onAbrirModalNuevoPuesto={abrirModalNuevoPuesto}
            onAbrirModalEditarPuestos={abrirModalEditarPuestos}
            onAbrirModalConfigPuesto={abrirModalConfigPuesto}
            onAbrirModalConfigurarAgente={abrirModalConfigurarAgente}
            onAbrirModalGestionarAccesos={abrirModalGestionarAccesos}
            onAbrirModalPanelPermisos={abrirModalPanelPermisos}
            onSalir={handleSalir}
            onAbrirMenu={() => setMenuAbierto(true)}
            coloresSistema={COLORES_SISTEMA}
            estaPolling={estaPolling}
            onPlayStopClick={handlePlayStopClick}
         />

         {/* ===== MENU LATERAL (modo compacto) ===== */}
         {esCompacto && (
            <MenuLateral
               abierto={menuAbierto}
               onCerrar={() => setMenuAbierto(false)}
               puestos={puestos}
               puestoSeleccionado={puestoSeleccionado}
               onSeleccionarPuesto={seleccionarPuesto}
               onAbrirModalNuevoPuesto={abrirModalNuevoPuesto}
               onAbrirModalEditarPuestos={abrirModalEditarPuestos}
               onAbrirModalConfigurarAgente={abrirModalConfigurarAgente}
               onAbrirModalGestionarAccesos={abrirModalGestionarAccesos}
               onAbrirModalPanelPermisos={abrirModalPanelPermisos}
               onSalir={handleSalir}
               coloresSistema={COLORES_SISTEMA}
            />
         )}

         {/* ===== MAIN ===== */}
         <main
            className="alim-main"
            style={{
               backgroundColor: puestoSeleccionado
                  ? obtenerBgColorPuesto(puestoSeleccionado.id) || "#e5e7eb"
                  : "#e5e7eb",
            }}
         >
            {/* Overlay de problema de conexión */}
            <OverlayConexion visible={hayProblemaConexion} />

            {/* Contenido principal */}
            {!configuracionSeleccionada ? (
               <EstadoVacio tipo="sinWorkspace" onSalir={handleSalir} />
            ) : !puestoSeleccionado ? (
               <EstadoVacio tipo="sinPuestos" />
            ) : (
               <GrillaTarjetas
                  alimentadores={alimentadoresConPreferencias}
                  lecturas={lecturasTarjetas}
                  puestoId={puestoSeleccionado.id}
                  workspaceId={configuracionSeleccionada?.id}
                  elementoArrastrandoId={elementoArrastrandoId}
                  onAbrirConfiguracion={abrirModalEditarAlim}
                  onAbrirHistorial={(puestoId, alim) => abrirVentana(alim)}
                  onDragStart={handleDragStartAlim}
                  onDragOver={alPasarPorEncima}
                  onDrop={handleDropAlim}
                  onDragEnd={handleDragEndAlim}
                  skeletonCard={guardandoAlimentador ? <SkeletonCard /> : null}
                  onDropAlFinal={handleDropAlimAlFinal}
                  onAgregarNuevo={abrirModalNuevoAlim}
                  puedeAgregarNuevo={
                     configuracionSeleccionada?.esCreador
                        ? rolGlobal === "superadmin" || rolGlobal === "admin"
                        : configuracionSeleccionada?.rol === "admin"
                  }
                  esObservador={rolGlobal === "observador" || configuracionSeleccionada?.rol === "observador"}
                  estaMidiendo={estaMidiendo}
                  obtenerTimestampInicio={obtenerTimestampInicio}
                  obtenerContadorLecturas={obtenerContadorLecturas}
                  obtenerGap={obtenerGap}
                  onGapChange={establecerGap}
                  obtenerRowGap={obtenerRowGap}
                  onRowGapChange={establecerRowGap}
                  estaPolling={estaPolling}
                  onPlayStopClick={handlePlayStopClick}
                  obtenerContadorPolling={obtenerContadorPolling}
                  obtenerErrorPolling={obtenerErrorPolling}
                  obtenerEscalaEfectiva={obtenerEscalaEfectivaConModoCompacto}
                  onEscalaChange={establecerEscalaTarjeta}
                  ESCALA_MIN={ESCALA_MIN}
                  ESCALA_MAX={ESCALA_MAX}
                  onExpandirLectura={handleExpandirLectura}
                  registrosEnVivo={registrosEnVivo}
               />
            )}
         </main>

         {/* ===== MODALES ===== */}
         <ModalesVista
            // Modal Nuevo Puesto
            modalNuevoPuestoAbierto={estadoModalNuevoPuesto.abierto}
            onCerrarNuevoPuesto={() => cerrarModal("nuevoPuesto")}
            onCrearPuesto={handleCrearPuesto}
            // Modal Editar Puestos
            modalEditarPuestosAbierto={estadoModalEditarPuestos.abierto}
            puestosConPreferencias={puestosConPreferencias}
            onCerrarEditarPuestos={() => cerrarModal("editarPuestos")}
            onGuardarPuestos={handleGuardarPuestos}
            esCreador={configuracionSeleccionada?.esCreador}
            rolEnWorkspace={configuracionSeleccionada?.rol}
            esCompacto={esCompacto}
            obtenerEscalaPuesto={obtenerEscalaPuesto}
            onEscalaPuestoChange={handleEscalaPuestoChange}
            ESCALA_MIN={ESCALA_MIN}
            ESCALA_MAX={ESCALA_MAX}
            estilosGlobales={estilosGlobales}
            onGuardarEstilos={guardarEstilosGlobales}
            // Modal Alimentador
            modalAlimentadorAbierto={estadoModalAlimentador.abierto}
            puestoNombre={puestoSeleccionado?.nombre || ""}
            workspaceId={configuracionSeleccionada?.id}
            modoAlimentador={modoAlimentador}
            alimentadorEnEdicion={alimentadorEnEdicion}
            onCancelarAlimentador={() => cerrarModal("alimentador")}
            onConfirmarAlimentador={handleGuardarAlimentador}
            onEliminarAlimentador={handleEliminarAlimentador}
            // Modal Config Puesto
            modalConfigPuestoAbierto={estadoModalConfigPuesto.abierto}
            puesto={puestoSeleccionado}
            onCerrarConfigPuesto={() => cerrarModal("configPuesto")}
            estaPolling={estaPolling}
            onPlayStopClick={handlePlayStopClick}
            buscarRegistrador={buscarRegistrador}
            // Modal Agente
            ventanaConfigAgente={ventanaConfigAgente}
            onCerrarConfigAgente={cerrarVentanaConfigAgente}
            onMinimizarConfigAgente={toggleMinimizarConfigAgente}
            onMaximizarConfigAgente={toggleMaximizarConfigAgente}
            onEnfocarConfigAgente={enfocarVentanaConfigAgente}
            onMoverConfigAgente={moverVentanaConfigAgente}
            // Modal Accesos
            modalAccesosAbierto={modalAccesosAbierto}
            onCerrarAccesos={() => setModalAccesosAbierto(false)}
            usuarioActualId={perfil?.id}
            // Modal Panel Permisos
            modalPanelPermisosAbierto={modalPanelPermisosAbierto}
            onCerrarPanelPermisos={() => setModalPanelPermisosAbierto(false)}
            // Colores
            coloresSistema={COLORES_SISTEMA}
         />

         {/* Sistema de ventanas flotantes de historial */}
         <ContenedorVentanasHistorial
            listaVentanas={listaVentanas}
            ventanasMinimizadas={ventanasMinimizadas}
            cerrarVentana={cerrarVentana}
            toggleMinimizar={toggleMinimizar}
            toggleMaximizar={toggleMaximizar}
            enfocarVentana={enfocarVentana}
            moverVentana={moverVentana}
         />

         {/* Modal de lectura completa */}
         <ModalLecturaCompleta
            abierto={modalLecturaCompleta.modalAbierto}
            onCerrar={modalLecturaCompleta.cerrarModal}
            alimentador={modalLecturaCompleta.alimentadorSeleccionado}
            timestampFormateado={modalLecturaCompleta.timestampFormateado}
            funcionalidadesTabActivo={modalLecturaCompleta.funcionalidadesTabActivo}
            tabs={modalLecturaCompleta.tabs}
            tabActivo={modalLecturaCompleta.tabActivo}
            setTabActivo={modalLecturaCompleta.setTabActivo}
            cargandoFuncionalidades={modalLecturaCompleta.cargandoFuncionalidades}
            interpretarEstado={modalLecturaCompleta.interpretarEstado}
            exportarCSV={modalLecturaCompleta.exportarCSV}
            obtenerTransformador={transformadoresHook.obtenerPorId}
            etiquetasBits={modalLecturaCompleta.etiquetasBitsTabActivo}
         />
      </div>
   );
};

export default VistaAlimentadores;
