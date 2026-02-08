// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx
// Ventana flotante para configurar agentes con pestañas dinámicas según rol

import React, { useState, useEffect, useCallback } from "react";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import { useVentanaFlotante } from "../../hooks/ui";
import { useAgentesConfig, useRegistradoresConfig } from "../../hooks/agentes";
import { ModalResultadoTest, IndicadorTestProgreso } from "./configurar-agente";
import { AlertaClave, AlertaError, IndicadorCargando } from "./configurar-agente/AlertasAgente";
import { PestanaAgentesVinculados, PestanaVincularAgente } from "./configurar-agente/PestanasAgente";
import PestanaAdminAgentes from "./configurar-agente/PestanaAdminAgentes";
import "./ModalConfigurarAgente.css";

const ModalConfigurarAgente = ({
   abierto, workspaceId, onCerrar,
   minimizada = false, maximizada = false,
   posicion = { x: 100, y: 50 }, zIndex = 1000,
   onMinimizar, onMaximizar, onEnfocar, onMover,
}) => {
   const { rolGlobal, configuracionSeleccionada } = usarContextoConfiguracion();

   const esSuperadmin = rolGlobal === "superadmin";
   const rolEnWorkspace = configuracionSeleccionada?.rol;
   const esAdmin = esSuperadmin || rolEnWorkspace === "admin";
   const esCreadorWorkspace = configuracionSeleccionada?.esCreador === true;
   const puedeVincularDesvincular = esSuperadmin || esCreadorWorkspace;
   const puedeVincular = puedeVincularDesvincular;

   const pestanasDisponibles = [
      { id: "vinculados", label: "Agentes Vinculados", visible: true },
      { id: "vincular", label: "Vincular Agente", visible: puedeVincular },
      { id: "admin", label: "Panel SuperAdmin", visible: esSuperadmin },
   ].filter((p) => p.visible);

   const [pestanaActiva, setPestanaActiva] = useState("vinculados");

   const { ventanaRef, headerRef, dimensiones, arrastrando, redimensionando, handleMouseDownDrag, handleMouseDownResize } = useVentanaFlotante({ maximizada, onMover, onEnfocar });

   const {
      cargando, error, agentesVinculados, agentesDisponibles, todosAgentes,
      mostrarFormCrear, nuevoAgente, creando, claveGenerada, agenteExpandido,
      setMostrarFormCrear, setNuevoAgente, setError, cargarDatos,
      vincularAgente, desvincularAgente, crearNuevoAgente, eliminarAgenteById,
      rotarClave, toggleExpandirAgente,
      resetearEstado: resetearEstadoAgentes, limpiarClaveGenerada,
   } = useAgentesConfig({ workspaceId, puedeVincular, esSuperadmin });

   const {
      registradoresAgente, mostrarFormRegistrador, registradorEditando,
      nuevoRegistrador, guardandoRegistrador, registradorProcesando, testEnCurso, resultadoTest,
      setMostrarFormRegistrador, setNuevoRegistrador, resetFormRegistrador,
      cargarRegistradores, guardarRegistrador, editarRegistrador, eliminarRegistrador,
      toggleRegistrador, toggleTodosRegistradores, testRegistrador, limpiarResultadoTest,
      resetearEstado: resetearEstadoRegistradores,
   } = useRegistradoresConfig();

   useEffect(() => { if (abierto && workspaceId) cargarDatos(); }, [abierto, workspaceId, cargarDatos]);
   useEffect(() => { if (!abierto) { setPestanaActiva("vinculados"); resetearEstadoAgentes(); resetearEstadoRegistradores(); } }, [abierto, resetearEstadoAgentes, resetearEstadoRegistradores]);

   const handleVincular = async (agenteId) => { const exito = await vincularAgente(agenteId); if (exito) setPestanaActiva("vinculados"); };
   const handleDesvincular = async (agenteId) => { if (!confirm("¿Desvincular este agente del workspace?")) return; await desvincularAgente(agenteId); };
   const handleCrearAgente = async (e) => { e.preventDefault(); await crearNuevoAgente(nuevoAgente.nombre, nuevoAgente.descripcion); };
   const handleEliminarAgente = async (agenteId, nombre) => { if (!confirm(`¿Eliminar el agente "${nombre}"? Esta acción no se puede deshacer.`)) return; await eliminarAgenteById(agenteId); };
   const handleRotarClave = async (agenteId) => { if (!confirm("¿Rotar la clave del agente? Deberás actualizar el agente con la nueva clave.")) return; await rotarClave(agenteId); };

   const toggleRegistradores = async (agenteId) => {
      if (agenteExpandido === agenteId) { toggleExpandirAgente(null); setMostrarFormRegistrador(null); return; }
      if (!registradoresAgente[agenteId]) await cargarRegistradores(agenteId);
      toggleExpandirAgente(agenteId);
   };

   const handleGuardarRegistrador = async (e, agenteId) => {
      e.preventDefault();
      if (!nuevoRegistrador.nombre.trim()) return;
      const esRele = nuevoRegistrador.tipoDispositivo === "rele";
      if (esRele) {
         const configRele = nuevoRegistrador.configuracionRele;
         if (!configRele || !configRele.plantillaId) { setError("Debes seleccionar una plantilla de configuración"); return; }
         if (!configRele.conexion?.ip) { setError("Debes configurar la IP del relé"); return; }
      } else {
         if (!nuevoRegistrador.ip.trim() || !nuevoRegistrador.puerto || !nuevoRegistrador.indiceInicial || !nuevoRegistrador.cantidadRegistros) return;
      }
      try { await guardarRegistrador(agenteId, nuevoRegistrador, registradorEditando?.id); } catch (err) { setError(err.message); }
   };

   const handleEliminarRegistrador = async (registradorId, nombre) => {
      if (!confirm(`¿Eliminar el registrador "${nombre}"?`)) return;
      try { await eliminarRegistrador(agenteExpandido, registradorId); } catch (err) { setError(err.message); }
   };

   const handleToggleRegistrador = async (registradorId) => { try { await toggleRegistrador(agenteExpandido, registradorId); } catch (err) { setError(err.message); } };
   const handleToggleTodosRegistradores = async (agenteId, iniciar) => { try { await toggleTodosRegistradores(agenteId, iniciar); } catch (err) { setError(err.message); } };

   const handleTestRegistrador = async (agenteId) => {
      if (!nuevoRegistrador.ip.trim() || !nuevoRegistrador.puerto || !nuevoRegistrador.indiceInicial || !nuevoRegistrador.cantidadRegistros) {
         setError("Completa IP, Puerto, Índice Inicial y Cantidad de Registros para hacer el test"); return;
      }
      try { await testRegistrador(agenteId, nuevoRegistrador); } catch (err) { setError(err.message); }
   };

   const copiarAlPortapapeles = (texto) => { navigator.clipboard.writeText(texto); };
   const handleMinimizar = useCallback(() => { if (onMinimizar) onMinimizar(); }, [onMinimizar]);
   const handleMaximizar = useCallback(() => { if (onMaximizar) onMaximizar(); }, [onMaximizar]);
   const handleEnfocar = useCallback(() => { if (onEnfocar) onEnfocar(); }, [onEnfocar]);

   if (!abierto || minimizada) return null;

   const estiloVentana = maximizada
      ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", zIndex }
      : { position: "fixed", top: posicion.y, left: posicion.x, width: dimensiones.width, height: dimensiones.height, zIndex };

   return (
      <div
         ref={ventanaRef}
         className={`config-agente-ventana ${maximizada ? "config-agente-ventana--maximizada" : ""} ${arrastrando ? "config-agente-ventana--arrastrando" : ""} ${redimensionando ? "config-agente-ventana--redimensionando" : ""}`}
         style={estiloVentana}
         onMouseDown={handleEnfocar}
      >
         <header ref={headerRef} className="config-agente-header" onMouseDown={handleMouseDownDrag}>
            <div className="config-agente-titulo">
               <span className="config-agente-icono">⚙️</span>
               <h2>Configuración de Agentes</h2>
            </div>
            <div className="config-agente-controles-ventana">
               <button type="button" className="config-agente-btn-ventana config-agente-btn-ventana--minimizar" onClick={handleMinimizar} title="Minimizar"><span>─</span></button>
               <button type="button" className="config-agente-btn-ventana config-agente-btn-ventana--maximizar" onClick={handleMaximizar} title={maximizada ? "Restaurar" : "Maximizar"}><span>{maximizada ? "❐" : "□"}</span></button>
               <button type="button" className="config-agente-btn-ventana config-agente-btn-ventana--cerrar" onClick={onCerrar} title="Cerrar"><span>×</span></button>
            </div>
         </header>

         <div className="config-agente-tabs">
            {pestanasDisponibles.map((p) => (
               <button key={p.id} className={`config-agente-tab ${pestanaActiva === p.id ? "config-agente-tab--activa" : ""}`} onClick={() => setPestanaActiva(p.id)}>{p.label}</button>
            ))}
         </div>

         <div className="config-agente-contenido">
            {claveGenerada && <AlertaClave clave={claveGenerada} onCopiar={copiarAlPortapapeles} onCerrar={limpiarClaveGenerada} />}
            {error && <AlertaError mensaje={error} onCerrar={() => setError(null)} />}
            {cargando && <IndicadorCargando />}

            {pestanaActiva === "vinculados" && !cargando && (
               <div className="config-agente-seccion">
                  <PestanaAgentesVinculados agentesVinculados={agentesVinculados} agenteExpandido={agenteExpandido} registradoresAgente={registradoresAgente} esAdmin={esAdmin} puedeVincularDesvincular={puedeVincularDesvincular} puedeVincular={puedeVincular} onToggleRegistradores={toggleRegistradores} onDesvincular={handleDesvincular} onIrAVincular={() => setPestanaActiva("vincular")} />
               </div>
            )}

            {pestanaActiva === "vincular" && !cargando && (
               <div className="config-agente-seccion">
                  <PestanaVincularAgente agentesDisponibles={agentesDisponibles} esSuperadmin={esSuperadmin} onVincular={handleVincular} onIrAAdmin={() => setPestanaActiva("admin")} />
               </div>
            )}

            {pestanaActiva === "admin" && !cargando && (
               <PestanaAdminAgentes
                  todosAgentes={todosAgentes} agenteExpandido={agenteExpandido} registradoresAgente={registradoresAgente}
                  mostrarFormCrear={mostrarFormCrear} nuevoAgente={nuevoAgente} creando={creando}
                  mostrarFormRegistrador={mostrarFormRegistrador} nuevoRegistrador={nuevoRegistrador}
                  registradorEditando={registradorEditando} guardandoRegistrador={guardandoRegistrador}
                  testEnCurso={testEnCurso} registradorProcesando={registradorProcesando} workspaceId={workspaceId}
                  setMostrarFormCrear={setMostrarFormCrear} setNuevoAgente={setNuevoAgente}
                  setMostrarFormRegistrador={setMostrarFormRegistrador} resetFormRegistrador={resetFormRegistrador}
                  setNuevoRegistrador={setNuevoRegistrador}
                  onCrearAgente={handleCrearAgente} onRotarClave={handleRotarClave} onEliminarAgente={handleEliminarAgente}
                  onToggleRegistradores={toggleRegistradores} onGuardarRegistrador={handleGuardarRegistrador}
                  onToggleRegistrador={handleToggleRegistrador} onToggleTodosRegistradores={handleToggleTodosRegistradores}
                  onTestRegistrador={handleTestRegistrador} onEditarRegistrador={editarRegistrador}
                  onEliminarRegistrador={handleEliminarRegistrador}
               />
            )}
         </div>

         <ModalResultadoTest resultadoTest={resultadoTest} onCerrar={limpiarResultadoTest} />
         <IndicadorTestProgreso testEnCurso={testEnCurso} />

         {!maximizada && (
            <div className="config-agente-resize-handle" onMouseDown={handleMouseDownResize} title="Arrastrar para redimensionar" />
         )}
      </div>
   );
};

export default ModalConfigurarAgente;
