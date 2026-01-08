// src/paginas/PaginaAlimentadores/componentes/modales/permisos/ModalPanelPermisos.jsx
// Modal para gestionar permisos de usuarios y acceso a agentes (solo superadmin)

import React, { useRef, useEffect } from "react";
import "./ModalPanelPermisos.css";

import { useEstadoVentana, useArrastrarModal, useDatosPermisos, useEdicionPermisos } from "./hooks";
import { ListaUsuarios, PanelDetalles } from "./componentes";

/**
 * Modal para gestionar los permisos de usuarios y su acceso a agentes.
 * Solo visible para superadmins.
 * Diseño: Master-detail (lista usuarios izquierda + detalles derecha)
 */
const ModalPanelPermisos = ({ abierto, onCerrar }) => {
   const modalRef = useRef(null);

   // Hook de estado de ventana
   const {
      estadoVentana,
      posicion,
      setPosicion,
      handleMinimizar,
      handleMaximizar,
      resetearEstado,
      getModalClase,
      getModalEstilo,
      getOverlayClase,
   } = useEstadoVentana();

   // Hook de arrastre
   const { arrastrando, handleMouseDownDrag } = useArrastrarModal({
      estadoVentana,
      posicion,
      setPosicion,
      modalRef,
   });

   // Hook de datos
   const {
      usuarios,
      usuariosFiltrados,
      agentesDisponibles,
      cargando,
      error,
      busqueda,
      filtroRol,
      usuarioSeleccionado,
      detallesUsuario,
      cargandoDetalles,
      errorDetalles,
      setBusqueda,
      setFiltroRol,
      cargarDatos,
      seleccionarUsuario,
      recargarDetallesUsuario,
      limpiarEstado,
   } = useDatosPermisos(abierto);

   // Hook de edición
   const edicionHook = useEdicionPermisos({
      usuarioSeleccionado,
      cargarDatos,
      recargarDetallesUsuario,
   });

   // Limpiar estado al cerrar
   useEffect(() => {
      if (!abierto) {
         limpiarEstado();
         edicionHook.resetearEdicion();
         resetearEstado();
      }
   }, [abierto, limpiarEstado, edicionHook.resetearEdicion, resetearEstado]);

   // Resetear edición al cambiar de usuario
   const handleSeleccionarUsuario = (usuario) => {
      edicionHook.resetearEdicion();
      seleccionarUsuario(usuario);
   };

   if (!abierto) return null;

   // Props para el formulario de edición
   const edicionProps = {
      cambiosPendientes: edicionHook.cambiosPendientes,
      rolesDisponibles: edicionHook.rolesDisponibles,
      agentesDisponibles,
      guardando: edicionHook.guardando,
      tieneModificaciones: edicionHook.tieneModificaciones(),
      onCambioRol: edicionHook.handleCambioRol,
      onToggleAccesoTotal: edicionHook.handleToggleAccesoTotal,
      onToggleAgente: edicionHook.handleToggleAgente,
      onGuardar: edicionHook.handleGuardarUsuario,
      onCancelar: edicionHook.handleCancelarEdicion,
      iniciarEdicion: edicionHook.iniciarEdicion,
   };

   return (
      <div className={getOverlayClase("permisos-overlay")}>
         <div
            ref={modalRef}
            className={getModalClase("permisos-modal", arrastrando)}
            style={getModalEstilo()}
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div
               className="permisos-header"
               onMouseDown={handleMouseDownDrag}
               onDoubleClick={handleMaximizar}
               style={{ cursor: estadoVentana === "maximizado" ? "default" : "move" }}
            >
               <div className="permisos-titulo">
                  <span className="permisos-icono">🔐</span>
                  <span className="permisos-nombre">Panel de Permisos</span>
               </div>
               <div className="permisos-controles">
                  <button
                     type="button"
                     className="permisos-btn-control"
                     onClick={handleMinimizar}
                     title={estadoVentana === "minimizado" ? "Restaurar" : "Minimizar"}
                  >
                     {estadoVentana === "minimizado" ? "🗗" : "—"}
                  </button>
                  <button
                     type="button"
                     className="permisos-btn-control"
                     onClick={handleMaximizar}
                     title={estadoVentana === "maximizado" ? "Restaurar" : "Maximizar"}
                  >
                     {estadoVentana === "maximizado" ? "🗗" : "☐"}
                  </button>
                  <button
                     type="button"
                     className="permisos-btn-cerrar"
                     onClick={onCerrar}
                     title="Cerrar"
                  >
                     ✕
                  </button>
               </div>
            </div>

            {/* Contenido principal - Master Detail */}
            <div className="permisos-content">
               {/* Panel izquierdo - Lista de usuarios */}
               <ListaUsuarios
                  usuarios={usuarios}
                  usuariosFiltrados={usuariosFiltrados}
                  cargando={cargando}
                  error={error}
                  busqueda={busqueda}
                  filtroRol={filtroRol}
                  usuarioSeleccionado={usuarioSeleccionado}
                  onBusquedaChange={setBusqueda}
                  onFiltroRolChange={setFiltroRol}
                  onSeleccionarUsuario={handleSeleccionarUsuario}
                  onRecargar={cargarDatos}
               />

               {/* Panel derecho - Detalles */}
               <div className="permisos-detail">
                  <PanelDetalles
                     usuarioSeleccionado={usuarioSeleccionado}
                     cargandoDetalles={cargandoDetalles}
                     errorDetalles={errorDetalles}
                     detallesUsuario={detallesUsuario}
                     modoEdicion={edicionHook.modoEdicion}
                     edicionProps={edicionProps}
                  />
               </div>
            </div>
         </div>
      </div>
   );
};

export default ModalPanelPermisos;
