// layout/VistaAlimentadores.jsx

import React from "react";
import "./VistaAlimentadores.css";
import "../navegacion/BotonGuardarCambios.css";

import BarraNavegacion from "../navegacion/BarraNavegacion.jsx";
import MenuLateral from "../navegacion/MenuLateral.jsx";
import GrillaTarjetas from "../tarjetas/GrillaTarjetas.jsx";
import SkeletonCard from "../tarjetas/SkeletonCard.jsx";
import { ContenedorVentanasHistorial } from "../modales/historial";
import { ModalLecturaCompleta } from "../modales/lectura-completa";
import { COLORES_SISTEMA } from "../../constantes/colores";

import EstadoCarga from "./EstadoCarga";
import EstadoVacio from "./EstadoVacio";
import OverlayGuardando from "./OverlayGuardando";
import OverlayConexion from "./OverlayConexion";
import ModalesVista from "./ModalesVista";
import { useVistaAlimentadores } from "./useVistaAlimentadores";

const VistaAlimentadores = () => {
   const v = useVistaAlimentadores();

   if (v.cargando && !v.sincronizando) return <EstadoCarga />;
   if (v.error) return <EstadoCarga error={v.error} />;

   return (
      <div className="alim-page">
         <OverlayGuardando visible={v.guardandoPuestos} />
         <BarraNavegacion
            esCompacto={v.esCompacto} puestos={v.puestos} puestoSeleccionado={v.puestoSeleccionado}
            onSeleccionarPuesto={v.seleccionarPuesto} onAbrirModalNuevoPuesto={v.abrirModalNuevoPuesto}
            onAbrirModalEditarPuestos={v.abrirModalEditarPuestos} onAbrirModalConfigPuesto={v.abrirModalConfigPuesto}
            onAbrirModalConfigurarAgente={v.abrirModalConfigurarAgente} onAbrirModalGestionarAccesos={v.abrirModalGestionarAccesos}
            onAbrirModalPanelPermisos={v.abrirModalPanelPermisos} onSalir={v.handleSalir}
            onAbrirMenu={() => v.setMenuAbierto(true)} coloresSistema={COLORES_SISTEMA}
            estaPolling={v.estaPolling} onPlayStopClick={v.handlePlayStopClick}
         />
         {v.esCompacto && (
            <MenuLateral
               abierto={v.menuAbierto} onCerrar={() => v.setMenuAbierto(false)}
               puestos={v.puestos} puestoSeleccionado={v.puestoSeleccionado}
               onSeleccionarPuesto={v.seleccionarPuesto} onAbrirModalNuevoPuesto={v.abrirModalNuevoPuesto}
               onAbrirModalEditarPuestos={v.abrirModalEditarPuestos} onAbrirModalConfigurarAgente={v.abrirModalConfigurarAgente}
               onAbrirModalGestionarAccesos={v.abrirModalGestionarAccesos} onAbrirModalPanelPermisos={v.abrirModalPanelPermisos}
               onSalir={v.handleSalir} coloresSistema={COLORES_SISTEMA}
            />
         )}
         <main className="alim-main" style={{ backgroundColor: v.puestoSeleccionado ? v.obtenerBgColorPuesto(v.puestoSeleccionado.id) || "#e5e7eb" : "#e5e7eb" }}>
            <OverlayConexion visible={v.hayProblemaConexion} />
            {!v.configuracionSeleccionada ? (
               <EstadoVacio tipo="sinWorkspace" onSalir={v.handleSalir} />
            ) : !v.puestoSeleccionado ? (
               <EstadoVacio tipo="sinPuestos" />
            ) : (
               <GrillaTarjetas
                  alimentadores={v.alimentadoresConPreferencias} lecturas={v.lecturasTarjetas}
                  puestoId={v.puestoSeleccionado.id} workspaceId={v.configuracionSeleccionada?.id}
                  elementoArrastrandoId={v.elementoArrastrandoId}
                  onAbrirConfiguracion={v.abrirModalEditarAlim} onAbrirHistorial={(_, alim) => v.abrirVentana(alim)}
                  onDragStart={v.handleDragStartAlim} onDragOver={v.alPasarPorEncima}
                  onDrop={v.handleDropAlim} onDragEnd={v.handleDragEndAlim}
                  skeletonCard={v.guardandoAlimentador ? <SkeletonCard /> : null}
                  onDropAlFinal={v.handleDropAlimAlFinal} onAgregarNuevo={v.abrirModalNuevoAlim}
                  puedeAgregarNuevo={v.configuracionSeleccionada?.esCreador ? v.rolGlobal === "superadmin" || v.rolGlobal === "admin" : v.configuracionSeleccionada?.rol === "admin"}
                  esObservador={v.rolGlobal === "observador" || v.configuracionSeleccionada?.rol === "observador"}
                  estaMidiendo={v.estaMidiendo} obtenerTimestampInicio={v.obtenerTimestampInicio}
                  obtenerContadorLecturas={v.obtenerContadorLecturas}
                  obtenerGap={v.obtenerGap} onGapChange={v.establecerGap}
                  obtenerRowGap={v.obtenerRowGap} onRowGapChange={v.establecerRowGap}
                  estaPolling={v.estaPolling} onPlayStopClick={v.handlePlayStopClick}
                  obtenerContadorPolling={v.obtenerContadorPolling} obtenerErrorPolling={v.obtenerErrorPolling}
                  obtenerEscalaEfectiva={v.obtenerEscalaEfectivaConModoCompacto}
                  onEscalaChange={v.establecerEscalaTarjeta} ESCALA_MIN={v.ESCALA_MIN} ESCALA_MAX={v.ESCALA_MAX}
                  onExpandirLectura={v.handleExpandirLectura} registrosEnVivo={v.registrosEnVivo}
               />
            )}
         </main>
         <ModalesVista
            modalNuevoPuestoAbierto={v.estadoModalNuevoPuesto.abierto} onCerrarNuevoPuesto={() => v.cerrarModal("nuevoPuesto")}
            onCrearPuesto={v.handleCrearPuesto}
            modalEditarPuestosAbierto={v.estadoModalEditarPuestos.abierto} puestosConPreferencias={v.puestosConPreferencias}
            onCerrarEditarPuestos={() => v.cerrarModal("editarPuestos")} onGuardarPuestos={v.handleGuardarPuestos}
            esCreador={v.configuracionSeleccionada?.esCreador} rolEnWorkspace={v.configuracionSeleccionada?.rol}
            esCompacto={v.esCompacto} obtenerEscalaPuesto={v.obtenerEscalaPuesto}
            onEscalaPuestoChange={v.handleEscalaPuestoChange} ESCALA_MIN={v.ESCALA_MIN} ESCALA_MAX={v.ESCALA_MAX}
            estilosGlobales={v.estilosGlobales} onGuardarEstilos={v.guardarEstilosGlobales}
            modalAlimentadorAbierto={v.estadoModalAlimentador.abierto} puestoNombre={v.puestoSeleccionado?.nombre || ""}
            workspaceId={v.configuracionSeleccionada?.id} modoAlimentador={v.modoAlimentador}
            alimentadorEnEdicion={v.alimentadorEnEdicion} onCancelarAlimentador={() => v.cerrarModal("alimentador")}
            onConfirmarAlimentador={v.handleGuardarAlimentador} onEliminarAlimentador={v.handleEliminarAlimentador}
            modalConfigPuestoAbierto={v.estadoModalConfigPuesto.abierto} puesto={v.puestoSeleccionado}
            onCerrarConfigPuesto={() => v.cerrarModal("configPuesto")} estaPolling={v.estaPolling}
            onPlayStopClick={v.handlePlayStopClick} buscarRegistrador={v.buscarRegistrador}
            ventanaConfigAgente={v.ventanaConfigAgente.ventana} onCerrarConfigAgente={v.ventanaConfigAgente.cerrarVentana}
            onMinimizarConfigAgente={v.ventanaConfigAgente.toggleMinimizar} onMaximizarConfigAgente={v.ventanaConfigAgente.toggleMaximizar}
            onEnfocarConfigAgente={v.ventanaConfigAgente.enfocarVentana} onMoverConfigAgente={v.ventanaConfigAgente.moverVentana}
            modalAccesosAbierto={v.modalAccesosAbierto} onCerrarAccesos={() => v.setModalAccesosAbierto(false)}
            usuarioActualId={v.perfil?.id}
            modalPanelPermisosAbierto={v.modalPanelPermisosAbierto} onCerrarPanelPermisos={() => v.setModalPanelPermisosAbierto(false)}
            coloresSistema={COLORES_SISTEMA}
         />
         <ContenedorVentanasHistorial
            listaVentanas={v.listaVentanas} ventanasMinimizadas={v.ventanasMinimizadas}
            cerrarVentana={v.cerrarVentana} toggleMinimizar={v.toggleMinimizar}
            toggleMaximizar={v.toggleMaximizar} enfocarVentana={v.enfocarVentana} moverVentana={v.moverVentana}
         />
         <ModalLecturaCompleta
            abierto={v.modalLecturaCompleta.modalAbierto} onCerrar={v.modalLecturaCompleta.cerrarModal}
            alimentador={v.modalLecturaCompleta.alimentadorSeleccionado} timestampFormateado={v.modalLecturaCompleta.timestampFormateado}
            funcionalidadesTabActivo={v.modalLecturaCompleta.funcionalidadesTabActivo}
            tabs={v.modalLecturaCompleta.tabs} tabActivo={v.modalLecturaCompleta.tabActivo}
            setTabActivo={v.modalLecturaCompleta.setTabActivo} cargandoFuncionalidades={v.modalLecturaCompleta.cargandoFuncionalidades}
            interpretarEstado={v.modalLecturaCompleta.interpretarEstado} exportarCSV={v.modalLecturaCompleta.exportarCSV}
            obtenerTransformador={v.transformadoresHook.obtenerPorId} etiquetasBits={v.modalLecturaCompleta.etiquetasBitsTabActivo}
         />
      </div>
   );
};

export default VistaAlimentadores;
