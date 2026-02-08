// componentes/navegacion/SelectorConfiguracion.jsx
// Selector dropdown de workspaces

import React, { useState, useRef, useEffect } from "react";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import { ModalConfirmacion } from "../modales/comunes";
import { HeaderUsuario, HeaderUsuarioSimple, SubmenuWorkspaces, FormNuevoWorkspace, OpcionesMenu } from "./ComponentesSelectorConfig";
import "./SelectorConfiguracion.css";

const SelectorConfiguracion = ({ onAbrirModalEditarPuestos, onAbrirModalNuevoPuesto, onAbrirModalConfigurarAgente, onAbrirModalGestionarAccesos, onAbrirModalPanelPermisos, puestosLength = 0 }) => {
   const {
      configuraciones, configuracionSeleccionada, cargando, error,
      seleccionarConfiguracion, agregarConfiguracion, eliminarConfiguracion,
      puedeCrearWorkspaces, rolGlobal, perfil, workspaceDefaultId, toggleWorkspaceDefault,
   } = usarContextoConfiguracion();

   const [menuAbierto, setMenuAbierto] = useState(false);
   const [mostrarFormNueva, setMostrarFormNueva] = useState(false);
   const [nombreNueva, setNombreNueva] = useState("");
   const [creando, setCreando] = useState(false);
   const [submenuAbierto, setSubmenuAbierto] = useState(false);
   const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

   const hoverTimeoutRef = useRef(null);
   const submenuRef = useRef(null);

   useEffect(() => { return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }; }, []);
   useEffect(() => { if (!menuAbierto) setSubmenuAbierto(false); }, [menuAbierto]);

   const handleSubmenuMouseEnter = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => setSubmenuAbierto(true), 300);
   };
   const handleSubmenuMouseLeave = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => setSubmenuAbierto(false), 200);
   };

   const handleSeleccionar = (id) => { seleccionarConfiguracion(id); setSubmenuAbierto(false); setMenuAbierto(false); };
   const handleToggleDefault = async (e, id) => { e.stopPropagation(); try { await toggleWorkspaceDefault(id); } catch (err) { console.error("Error cambiando workspace default:", err); } };

   const handleCrearNueva = async (e) => {
      e.preventDefault();
      if (!nombreNueva.trim()) return;
      try { setCreando(true); await agregarConfiguracion(nombreNueva.trim()); setNombreNueva(""); setMostrarFormNueva(false); setMenuAbierto(false); }
      catch (err) { console.error("Error creando workspace:", err); }
      finally { setCreando(false); }
   };

   const handleEliminarActivo = () => {
      if (!configuracionSeleccionada) return;
      if (configuraciones.length <= 1) { alert("No se puede eliminar el único workspace existente."); return; }
      setModalEliminarAbierto(true);
   };

   const confirmarEliminarWorkspace = async () => {
      try {
         const indiceActual = configuraciones.findIndex((c) => c.id === configuracionSeleccionada.id);
         const nuevoWorkspace = indiceActual > 0 ? configuraciones[indiceActual - 1] : configuraciones[indiceActual + 1];
         seleccionarConfiguracion(nuevoWorkspace.id);
         await eliminarConfiguracion(configuracionSeleccionada.id);
         setModalEliminarAbierto(false);
         setMenuAbierto(false);
      } catch (err) { console.error("Error eliminando workspace:", err); }
   };

   const cerrarMenu = () => setMenuAbierto(false);
   const cancelarForm = () => { setMostrarFormNueva(false); setNombreNueva(""); };

   if (cargando) return <div className="selector-config selector-config--cargando"><span className="selector-config__spinner"></span>Cargando...</div>;
   if (error) return <div className="selector-config selector-config--error">Error: {error}</div>;

   // Sin workspaces
   if (configuraciones.length === 0) {
      return (
         <div className="selector-config">
            <button type="button" className={`selector-config__trigger ${puedeCrearWorkspaces ? "selector-config__trigger--crear" : "selector-config__trigger--deshabilitado"}`} onClick={() => setMenuAbierto(!menuAbierto)} aria-expanded={menuAbierto}>
               <span className="selector-config__nombre">{puedeCrearWorkspaces ? "+ Crear Workspace" : "Sin workspace"}</span>
               {!puedeCrearWorkspaces && <span className="selector-config__flecha">{menuAbierto ? "▲" : "▼"}</span>}
            </button>
            {menuAbierto && (
               <>
                  <div className="selector-config__overlay" onClick={() => { cerrarMenu(); cancelarForm(); }} />
                  <div className="selector-config__menu">
                     <HeaderUsuarioSimple perfil={perfil} rolGlobal={rolGlobal} />
                     {puedeCrearWorkspaces ? (
                        <>
                           <div className="selector-config__vacio-mensaje">No tienes workspaces asignados.<br />Crea uno para empezar.</div>
                           {mostrarFormNueva ? (
                              <FormNuevoWorkspace nombreNueva={nombreNueva} setNombreNueva={setNombreNueva} creando={creando} onSubmit={handleCrearNueva} onCancelar={cancelarForm} />
                           ) : (
                              <button type="button" className="selector-config__nueva selector-config__nueva--destacado" onClick={() => setMostrarFormNueva(true)}>+ Crear mi primer workspace</button>
                           )}
                        </>
                     ) : (
                        <div className="selector-config__vacio-mensaje selector-config__vacio-mensaje--info">No tienes workspaces asignados.<br /><small>Contacta a un administrador para ser invitado a un workspace.</small></div>
                     )}
                  </div>
               </>
            )}
         </div>
      );
   }

   // Con workspaces
   return (
      <div className="selector-config">
         <button type="button" className="selector-config__trigger" onClick={() => setMenuAbierto(!menuAbierto)} aria-expanded={menuAbierto} aria-haspopup="listbox">
            <span className="selector-config__nombre">{configuracionSeleccionada?.nombre || "Sin workspace"}</span>
            <span className="selector-config__flecha">{menuAbierto ? "▲" : "▼"}</span>
         </button>
         {menuAbierto && (
            <>
               <div className="selector-config__overlay" onClick={() => { cerrarMenu(); cancelarForm(); }} />
               <div className="selector-config__menu" role="listbox">
                  <HeaderUsuario perfil={perfil} rolGlobal={rolGlobal} configuracionSeleccionada={configuracionSeleccionada} />
                  <SubmenuWorkspaces
                     submenuRef={submenuRef} submenuAbierto={submenuAbierto}
                     onMouseEnter={handleSubmenuMouseEnter} onMouseLeave={handleSubmenuMouseLeave}
                     onClick={() => setSubmenuAbierto(!submenuAbierto)}
                     configuraciones={configuraciones} configuracionSeleccionada={configuracionSeleccionada}
                     workspaceDefaultId={workspaceDefaultId} onSeleccionar={handleSeleccionar} onToggleDefault={handleToggleDefault}
                  />
                  <div className="selector-config__separador" />
                  {mostrarFormNueva ? (
                     <FormNuevoWorkspace nombreNueva={nombreNueva} setNombreNueva={setNombreNueva} creando={creando} onSubmit={handleCrearNueva} onCancelar={cancelarForm} />
                  ) : (
                     <OpcionesMenu
                        configuracionSeleccionada={configuracionSeleccionada} configuraciones={configuraciones}
                        rolGlobal={rolGlobal} puedeCrearWorkspaces={puedeCrearWorkspaces} puestosLength={puestosLength}
                        onCerrarMenu={cerrarMenu} onAbrirModalGestionarAccesos={onAbrirModalGestionarAccesos}
                        onAbrirModalNuevoPuesto={onAbrirModalNuevoPuesto} onAbrirModalEditarPuestos={onAbrirModalEditarPuestos}
                        onAbrirModalConfigurarAgente={onAbrirModalConfigurarAgente} onAbrirModalPanelPermisos={onAbrirModalPanelPermisos}
                        onEliminarActivo={handleEliminarActivo} onMostrarForm={() => setMostrarFormNueva(true)}
                     />
                  )}
               </div>
            </>
         )}
         <ModalConfirmacion
            abierto={modalEliminarAbierto} titulo="Eliminar workspace"
            mensaje={`¿Estás seguro de que deseas eliminar el workspace "${configuracionSeleccionada?.nombre}"? Esta acción no se puede deshacer.`}
            textoConfirmar="Eliminar" textoCancelar="Cancelar" peligroso={true}
            onConfirmar={confirmarEliminarWorkspace} onCancelar={() => setModalEliminarAbierto(false)}
         />
      </div>
   );
};

export default SelectorConfiguracion;
