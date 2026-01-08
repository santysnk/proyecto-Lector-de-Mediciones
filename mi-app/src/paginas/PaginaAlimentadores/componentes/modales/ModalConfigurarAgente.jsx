// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx
// Ventana flotante para configurar agentes con pestañas dinámicas según rol
// Soporta: arrastrar, minimizar, maximizar, redimensionar, múltiples instancias

import React, { useState, useEffect, useCallback } from "react";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import { useVentanaFlotante } from "../../hooks/ui";
import { useAgentesConfig, useRegistradoresConfig } from "../../hooks/agentes";
import {
   TarjetaAgente,
   ListaRegistradores,
   ToolbarRegistradores,
   FormularioRegistrador,
   ModalResultadoTest,
   IndicadorTestProgreso,
} from "./configurar-agente";
import "./ModalConfigurarAgente.css";

// ============================================================================
// Componentes auxiliares inline
// ============================================================================

/** Alerta de clave generada */
const AlertaClave = ({ clave, onCopiar, onCerrar }) => (
   <div className="config-agente-alerta config-agente-alerta--exito">
      <div className="config-agente-alerta-header">
         <strong>Clave del Agente</strong>
         <button onClick={onCerrar}>×</button>
      </div>
      <p>Guarda esta clave, no se mostrará de nuevo:</p>
      <div className="config-agente-clave-box">
         <code>{clave}</code>
         <button onClick={() => onCopiar(clave)}>Copiar</button>
      </div>
   </div>
);

/** Alerta de error */
const AlertaError = ({ mensaje, onCerrar }) => (
   <div className="config-agente-alerta config-agente-alerta--error">
      {mensaje}
      <button onClick={onCerrar}>×</button>
   </div>
);

/** Indicador de carga */
const IndicadorCargando = () => (
   <div className="config-agente-cargando">
      <span className="config-agente-spinner"></span>
      Cargando...
   </div>
);

/** Estado vacío con CTA */
const EstadoVacio = ({ icono, mensaje, children }) => (
   <div className="config-agente-vacio">
      <span className="config-agente-vacio-icono">{icono}</span>
      <p>{mensaje}</p>
      {children}
   </div>
);

// ============================================================================
// Componentes de pestañas
// ============================================================================

/** Pestaña: Agentes Vinculados */
const PestanaAgentesVinculados = ({
   agentesVinculados,
   agenteExpandido,
   registradoresAgente,
   esAdmin,
   puedeVincularDesvincular,
   puedeVincular,
   onToggleRegistradores,
   onDesvincular,
   onIrAVincular,
}) => {
   if (agentesVinculados.length === 0) {
      return (
         <EstadoVacio icono="📡" mensaje="No hay agentes vinculados a este workspace">
            {puedeVincular && (
               <button
                  className="config-agente-btn config-agente-btn--primario"
                  onClick={onIrAVincular}
               >
                  Vincular un Agente
               </button>
            )}
            {!puedeVincular && (
               <p className="config-agente-hint">Contacta a un administrador para vincular agentes.</p>
            )}
         </EstadoVacio>
      );
   }

   return (
      <div className="config-agente-lista">
         {agentesVinculados.map((agente) => (
            <TarjetaAgente
               key={agente.id}
               agente={agente}
               expandido={agenteExpandido === agente.id}
               onToggleExpandir={onToggleRegistradores}
               onAccionPrincipal={
                  esAdmin
                     ? (id) => {
                          if (puedeVincularDesvincular) {
                             onDesvincular(id);
                          } else {
                             alert("Solo el administrador que creó el workspace puede desvincular agentes.");
                          }
                       }
                     : null
               }
               accionPrincipalTipo={esAdmin ? "desvincular" : null}
               accionPrincipalTitle={
                  puedeVincularDesvincular
                     ? "Desvincular"
                     : "Solo el creador del workspace puede desvincular"
               }
               accionPrincipalDisabled={!puedeVincularDesvincular}
            >
               {agenteExpandido === agente.id && (
                  <div className="config-agente-card-regs">
                     <h4>Registradores</h4>
                     <ListaRegistradores
                        registradores={registradoresAgente[agente.id] || []}
                        conAcciones={false}
                     />
                  </div>
               )}
            </TarjetaAgente>
         ))}
      </div>
   );
};

/** Pestaña: Vincular Agente */
const PestanaVincularAgente = ({ agentesDisponibles, esSuperadmin, onVincular, onIrAAdmin }) => {
   if (agentesDisponibles.length === 0) {
      return (
         <EstadoVacio icono="🔍" mensaje="No hay agentes disponibles para vincular">
            {esSuperadmin && (
               <button className="config-agente-btn config-agente-btn--primario" onClick={onIrAAdmin}>
                  Crear nuevo Agente
               </button>
            )}
         </EstadoVacio>
      );
   }

   return (
      <>
         <p className="config-agente-instruccion">
            Selecciona un agente disponible para vincularlo a este workspace.
         </p>
         <div className="config-agente-lista">
            {agentesDisponibles.map((agente) => (
               <TarjetaAgente
                  key={agente.id}
                  agente={agente}
                  onAccionPrincipal={onVincular}
                  accionPrincipalLabel="Vincular"
                  accionPrincipalTipo="vincular"
                  variante="disponible"
               />
            ))}
         </div>
      </>
   );
};

/** Formulario para crear nuevo agente */
const FormularioCrearAgente = ({ nuevoAgente, setNuevoAgente, creando, onSubmit, onCancelar }) => (
   <form className="config-agente-form" onSubmit={onSubmit}>
      <h4>Nuevo Agente</h4>
      <div className="config-agente-form-grupo">
         <label>Nombre *</label>
         <input
            type="text"
            value={nuevoAgente.nombre}
            onChange={(e) => setNuevoAgente((prev) => ({ ...prev, nombre: e.target.value }))}
            placeholder="Ej: Agente Subestación Norte"
            disabled={creando}
         />
      </div>
      <div className="config-agente-form-grupo">
         <label>Descripción</label>
         <input
            type="text"
            value={nuevoAgente.descripcion}
            onChange={(e) => setNuevoAgente((prev) => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Descripción opcional"
            disabled={creando}
         />
      </div>
      <div className="config-agente-form-acciones">
         <button
            type="button"
            className="config-agente-btn config-agente-btn--secundario"
            onClick={onCancelar}
            disabled={creando}
         >
            Cancelar
         </button>
         <button
            type="submit"
            className="config-agente-btn config-agente-btn--primario"
            disabled={creando || !nuevoAgente.nombre.trim()}
         >
            {creando ? "Creando..." : "Crear Agente"}
         </button>
      </div>
   </form>
);

// ============================================================================
// Componente principal
// ============================================================================

/**
 * Modal para configurar agentes con pestañas según rol del usuario.
 *
 * Pestañas:
 * - "Agentes Vinculados": Todos los roles con acceso al workspace
 * - "Vincular Agente": Solo creador del workspace o superadmin
 * - "Panel SuperAdmin": Solo Superadmin (CRUD de agentes y registradores)
 */
const ModalConfigurarAgente = ({
   abierto,
   workspaceId,
   onCerrar,
   minimizada = false,
   maximizada = false,
   posicion = { x: 100, y: 50 },
   zIndex = 1000,
   onMinimizar,
   onMaximizar,
   onEnfocar,
   onMover,
}) => {
   const { rolGlobal, configuracionSeleccionada } = usarContextoConfiguracion();

   // Determinar permisos según rol
   const esSuperadmin = rolGlobal === "superadmin";
   const rolEnWorkspace = configuracionSeleccionada?.rol;
   const esAdmin = esSuperadmin || rolEnWorkspace === "admin";
   const esCreadorWorkspace = configuracionSeleccionada?.esCreador === true;
   const puedeVincularDesvincular = esSuperadmin || esCreadorWorkspace;
   const puedeVincular = puedeVincularDesvincular;

   // Pestañas disponibles según rol
   const pestanasDisponibles = [
      { id: "vinculados", label: "Agentes Vinculados", visible: true },
      { id: "vincular", label: "Vincular Agente", visible: puedeVincular },
      { id: "admin", label: "Panel SuperAdmin", visible: esSuperadmin },
   ].filter((p) => p.visible);

   // Estado local de UI
   const [pestanaActiva, setPestanaActiva] = useState("vinculados");

   // Hook de ventana flotante (drag/resize)
   const {
      ventanaRef,
      headerRef,
      dimensiones,
      arrastrando,
      redimensionando,
      handleMouseDownDrag,
      handleMouseDownResize,
   } = useVentanaFlotante({ maximizada, onMover, onEnfocar });

   // Hook de agentes
   const {
      cargando,
      error,
      agentesVinculados,
      agentesDisponibles,
      todosAgentes,
      mostrarFormCrear,
      nuevoAgente,
      creando,
      claveGenerada,
      agenteExpandido,
      setMostrarFormCrear,
      setNuevoAgente,
      setError,
      cargarDatos,
      vincularAgente,
      desvincularAgente,
      crearNuevoAgente,
      eliminarAgenteById,
      rotarClave,
      toggleExpandirAgente,
      resetearEstado: resetearEstadoAgentes,
      limpiarClaveGenerada,
   } = useAgentesConfig({ workspaceId, puedeVincular, esSuperadmin });

   // Hook de registradores
   const {
      registradoresAgente,
      mostrarFormRegistrador,
      registradorEditando,
      nuevoRegistrador,
      guardandoRegistrador,
      registradorProcesando,
      testEnCurso,
      resultadoTest,
      setMostrarFormRegistrador,
      setNuevoRegistrador,
      resetFormRegistrador,
      cargarRegistradores,
      guardarRegistrador,
      editarRegistrador,
      eliminarRegistrador,
      toggleRegistrador,
      toggleTodosRegistradores,
      testRegistrador,
      limpiarResultadoTest,
      resetearEstado: resetearEstadoRegistradores,
   } = useRegistradoresConfig();

   // Cargar datos al abrir
   useEffect(() => {
      if (abierto && workspaceId) {
         cargarDatos();
      }
   }, [abierto, workspaceId, cargarDatos]);

   // Resetear estado al cerrar
   useEffect(() => {
      if (!abierto) {
         setPestanaActiva("vinculados");
         resetearEstadoAgentes();
         resetearEstadoRegistradores();
      }
   }, [abierto, resetearEstadoAgentes, resetearEstadoRegistradores]);

   // ==========================================================================
   // Handlers de agentes
   // ==========================================================================

   const handleVincular = async (agenteId) => {
      const exito = await vincularAgente(agenteId);
      if (exito) setPestanaActiva("vinculados");
   };

   const handleDesvincular = async (agenteId) => {
      if (!confirm("¿Desvincular este agente del workspace?")) return;
      await desvincularAgente(agenteId);
   };

   const handleCrearAgente = async (e) => {
      e.preventDefault();
      await crearNuevoAgente(nuevoAgente.nombre, nuevoAgente.descripcion);
   };

   const handleEliminarAgente = async (agenteId, nombre) => {
      if (!confirm(`¿Eliminar el agente "${nombre}"? Esta acción no se puede deshacer.`)) return;
      await eliminarAgenteById(agenteId);
   };

   const handleRotarClave = async (agenteId) => {
      if (!confirm("¿Rotar la clave del agente? Deberás actualizar el agente con la nueva clave."))
         return;
      await rotarClave(agenteId);
   };

   // Toggle registradores de un agente
   const toggleRegistradores = async (agenteId) => {
      if (agenteExpandido === agenteId) {
         toggleExpandirAgente(null);
         setMostrarFormRegistrador(null);
         return;
      }
      if (!registradoresAgente[agenteId]) {
         await cargarRegistradores(agenteId);
      }
      toggleExpandirAgente(agenteId);
   };

   // ==========================================================================
   // Handlers de registradores
   // ==========================================================================

   const handleGuardarRegistrador = async (e, agenteId) => {
      e.preventDefault();
      if (!nuevoRegistrador.nombre.trim()) return;

      const esRele = nuevoRegistrador.tipoDispositivo === "rele";

      if (esRele) {
         const configRele = nuevoRegistrador.configuracionRele;
         if (!configRele || !configRele.plantillaId) {
            setError("Debes seleccionar una plantilla de configuración");
            return;
         }
         if (!configRele.conexion?.ip) {
            setError("Debes configurar la IP del relé");
            return;
         }
      } else {
         if (
            !nuevoRegistrador.ip.trim() ||
            !nuevoRegistrador.puerto ||
            !nuevoRegistrador.indiceInicial ||
            !nuevoRegistrador.cantidadRegistros
         )
            return;
      }

      try {
         await guardarRegistrador(agenteId, nuevoRegistrador, registradorEditando?.id);
      } catch (err) {
         setError(err.message);
      }
   };

   const handleEliminarRegistrador = async (registradorId, nombre) => {
      if (!confirm(`¿Eliminar el registrador "${nombre}"?`)) return;
      try {
         await eliminarRegistrador(agenteExpandido, registradorId);
      } catch (err) {
         setError(err.message);
      }
   };

   const handleToggleRegistrador = async (registradorId) => {
      try {
         await toggleRegistrador(agenteExpandido, registradorId);
      } catch (err) {
         setError(err.message);
      }
   };

   const handleToggleTodosRegistradores = async (agenteId, iniciar) => {
      try {
         await toggleTodosRegistradores(agenteId, iniciar);
      } catch (err) {
         setError(err.message);
      }
   };

   const handleTestRegistrador = async (agenteId) => {
      if (
         !nuevoRegistrador.ip.trim() ||
         !nuevoRegistrador.puerto ||
         !nuevoRegistrador.indiceInicial ||
         !nuevoRegistrador.cantidadRegistros
      ) {
         setError("Completa IP, Puerto, Índice Inicial y Cantidad de Registros para hacer el test");
         return;
      }
      try {
         await testRegistrador(agenteId, nuevoRegistrador);
      } catch (err) {
         setError(err.message);
      }
   };

   // Copiar al portapapeles
   const copiarAlPortapapeles = (texto) => {
      navigator.clipboard.writeText(texto);
   };

   // Handlers de ventana
   const handleMinimizar = useCallback(() => {
      if (onMinimizar) onMinimizar();
   }, [onMinimizar]);

   const handleMaximizar = useCallback(() => {
      if (onMaximizar) onMaximizar();
   }, [onMaximizar]);

   const handleEnfocar = useCallback(() => {
      if (onEnfocar) onEnfocar();
   }, [onEnfocar]);

   // ==========================================================================
   // Render
   // ==========================================================================

   if (!abierto || minimizada) return null;

   const estiloVentana = maximizada
      ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", zIndex }
      : {
           position: "fixed",
           top: posicion.y,
           left: posicion.x,
           width: dimensiones.width,
           height: dimensiones.height,
           zIndex,
        };

   return (
      <div
         ref={ventanaRef}
         className={`config-agente-ventana ${maximizada ? "config-agente-ventana--maximizada" : ""} ${arrastrando ? "config-agente-ventana--arrastrando" : ""} ${redimensionando ? "config-agente-ventana--redimensionando" : ""}`}
         style={estiloVentana}
         onMouseDown={handleEnfocar}
      >
         {/* Header arrastrable */}
         <header ref={headerRef} className="config-agente-header" onMouseDown={handleMouseDownDrag}>
            <div className="config-agente-titulo">
               <span className="config-agente-icono">⚙️</span>
               <h2>Configuración de Agentes</h2>
            </div>
            <div className="config-agente-controles-ventana">
               <button
                  type="button"
                  className="config-agente-btn-ventana config-agente-btn-ventana--minimizar"
                  onClick={handleMinimizar}
                  title="Minimizar"
               >
                  <span>─</span>
               </button>
               <button
                  type="button"
                  className="config-agente-btn-ventana config-agente-btn-ventana--maximizar"
                  onClick={handleMaximizar}
                  title={maximizada ? "Restaurar" : "Maximizar"}
               >
                  <span>{maximizada ? "❐" : "□"}</span>
               </button>
               <button
                  type="button"
                  className="config-agente-btn-ventana config-agente-btn-ventana--cerrar"
                  onClick={onCerrar}
                  title="Cerrar"
               >
                  <span>×</span>
               </button>
            </div>
         </header>

         {/* Pestañas */}
         <div className="config-agente-tabs">
            {pestanasDisponibles.map((p) => (
               <button
                  key={p.id}
                  className={`config-agente-tab ${pestanaActiva === p.id ? "config-agente-tab--activa" : ""}`}
                  onClick={() => setPestanaActiva(p.id)}
               >
                  {p.label}
               </button>
            ))}
         </div>

         {/* Contenido */}
         <div className="config-agente-contenido">
            {/* Alertas */}
            {claveGenerada && (
               <AlertaClave
                  clave={claveGenerada}
                  onCopiar={copiarAlPortapapeles}
                  onCerrar={limpiarClaveGenerada}
               />
            )}
            {error && <AlertaError mensaje={error} onCerrar={() => setError(null)} />}
            {cargando && <IndicadorCargando />}

            {/* PESTAÑA: AGENTES VINCULADOS */}
            {pestanaActiva === "vinculados" && !cargando && (
               <div className="config-agente-seccion">
                  <PestanaAgentesVinculados
                     agentesVinculados={agentesVinculados}
                     agenteExpandido={agenteExpandido}
                     registradoresAgente={registradoresAgente}
                     esAdmin={esAdmin}
                     puedeVincularDesvincular={puedeVincularDesvincular}
                     puedeVincular={puedeVincular}
                     onToggleRegistradores={toggleRegistradores}
                     onDesvincular={handleDesvincular}
                     onIrAVincular={() => setPestanaActiva("vincular")}
                  />
               </div>
            )}

            {/* PESTAÑA: VINCULAR AGENTE */}
            {pestanaActiva === "vincular" && !cargando && (
               <div className="config-agente-seccion">
                  <PestanaVincularAgente
                     agentesDisponibles={agentesDisponibles}
                     esSuperadmin={esSuperadmin}
                     onVincular={handleVincular}
                     onIrAAdmin={() => setPestanaActiva("admin")}
                  />
               </div>
            )}

            {/* PESTAÑA: PANEL ADMIN */}
            {pestanaActiva === "admin" && !cargando && (
               <div className="config-agente-seccion">
                  {/* Formulario crear agente */}
                  {!mostrarFormCrear ? (
                     <button
                        className="config-agente-btn config-agente-btn--crear"
                        onClick={() => setMostrarFormCrear(true)}
                     >
                        + Crear Nuevo Agente
                     </button>
                  ) : (
                     <FormularioCrearAgente
                        nuevoAgente={nuevoAgente}
                        setNuevoAgente={setNuevoAgente}
                        creando={creando}
                        onSubmit={handleCrearAgente}
                        onCancelar={() => setMostrarFormCrear(false)}
                     />
                  )}

                  {/* Lista de todos los agentes */}
                  <div className="config-agente-admin-lista">
                     <h4>Todos los Agentes del Sistema</h4>
                     {todosAgentes.length === 0 ? (
                        <EstadoVacio mensaje="No hay agentes en el sistema" />
                     ) : (
                        <div className="config-agente-lista">
                           {todosAgentes.map((agente) => (
                              <TarjetaAgente
                                 key={agente.id}
                                 agente={agente}
                                 expandido={agenteExpandido === agente.id}
                                 onToggleExpandir={toggleRegistradores}
                                 mostrarAccionesAdmin
                                 onRotarClave={handleRotarClave}
                                 onEliminar={handleEliminarAgente}
                                 variante="admin"
                              >
                                 {agenteExpandido === agente.id && (
                                    <div className="config-agente-card-regs">
                                       <h4>Registradores</h4>
                                       <div className="config-agente-regs-contenedor">
                                          <ToolbarRegistradores
                                             registradores={registradoresAgente[agente.id] || []}
                                             registradorProcesando={registradorProcesando}
                                             onAgregar={() => {
                                                resetFormRegistrador();
                                                setMostrarFormRegistrador(agente.id);
                                             }}
                                             onIniciarTodos={() =>
                                                handleToggleTodosRegistradores(agente.id, true)
                                             }
                                             onPausarTodos={() =>
                                                handleToggleTodosRegistradores(agente.id, false)
                                             }
                                          />

                                          {mostrarFormRegistrador === agente.id && (
                                             <FormularioRegistrador
                                                agenteId={agente.id}
                                                nuevoRegistrador={nuevoRegistrador}
                                                setNuevoRegistrador={setNuevoRegistrador}
                                                registradorEditando={registradorEditando}
                                                guardandoRegistrador={guardandoRegistrador}
                                                testEnCurso={testEnCurso}
                                                onSubmit={(e) => handleGuardarRegistrador(e, agente.id)}
                                                onTest={() => handleTestRegistrador(agente.id)}
                                                onCancelar={() => {
                                                   setMostrarFormRegistrador(null);
                                                   resetFormRegistrador();
                                                }}
                                             />
                                          )}

                                          <ListaRegistradores
                                             registradores={registradoresAgente[agente.id] || []}
                                             conAcciones
                                             registradorProcesando={registradorProcesando}
                                             onToggle={handleToggleRegistrador}
                                             onEditar={(reg) =>
                                                editarRegistrador({ ...reg, agente_id: agente.id })
                                             }
                                             onEliminar={handleEliminarRegistrador}
                                          />
                                       </div>
                                    </div>
                                 )}
                              </TarjetaAgente>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>

         {/* Modal de resultado del test */}
         <ModalResultadoTest resultadoTest={resultadoTest} onCerrar={limpiarResultadoTest} />

         {/* Indicador de test en progreso */}
         <IndicadorTestProgreso testEnCurso={testEnCurso} />

         {/* Handle de resize */}
         {!maximizada && (
            <div
               className="config-agente-resize-handle"
               onMouseDown={handleMouseDownResize}
               title="Arrastrar para redimensionar"
            />
         )}
      </div>
   );
};

export default ModalConfigurarAgente;
