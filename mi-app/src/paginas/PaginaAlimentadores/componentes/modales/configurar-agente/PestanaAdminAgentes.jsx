// componentes/modales/configurar-agente/PestanaAdminAgentes.jsx
// Pestaña de administración de agentes (solo superadmin)

import React from "react";
import {
   TarjetaAgente,
   ListaRegistradores,
   ToolbarRegistradores,
   FormularioRegistrador,
} from "./index";
import { EstadoVacio } from "./AlertasAgente";
import { FormularioCrearAgente } from "./PestanasAgente";

const PestanaAdminAgentes = ({
   todosAgentes,
   agenteExpandido,
   registradoresAgente,
   mostrarFormCrear,
   nuevoAgente,
   creando,
   mostrarFormRegistrador,
   nuevoRegistrador,
   registradorEditando,
   guardandoRegistrador,
   testEnCurso,
   registradorProcesando,
   workspaceId,
   setMostrarFormCrear,
   setNuevoAgente,
   setMostrarFormRegistrador,
   resetFormRegistrador,
   onCrearAgente,
   onRotarClave,
   onEliminarAgente,
   onToggleRegistradores,
   onGuardarRegistrador,
   onToggleRegistrador,
   onToggleTodosRegistradores,
   onTestRegistrador,
   onEditarRegistrador,
   onEliminarRegistrador,
   setNuevoRegistrador,
}) => (
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
            onSubmit={onCrearAgente}
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
                     onToggleExpandir={onToggleRegistradores}
                     mostrarAccionesAdmin
                     onRotarClave={onRotarClave}
                     onEliminar={onEliminarAgente}
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
                                 onIniciarTodos={() => onToggleTodosRegistradores(agente.id, true)}
                                 onPausarTodos={() => onToggleTodosRegistradores(agente.id, false)}
                              />

                              {mostrarFormRegistrador === agente.id && (
                                 <FormularioRegistrador
                                    agenteId={agente.id}
                                    workspaceId={workspaceId}
                                    nuevoRegistrador={nuevoRegistrador}
                                    setNuevoRegistrador={setNuevoRegistrador}
                                    registradorEditando={registradorEditando}
                                    guardandoRegistrador={guardandoRegistrador}
                                    testEnCurso={testEnCurso}
                                    onSubmit={(e) => onGuardarRegistrador(e, agente.id)}
                                    onTest={() => onTestRegistrador(agente.id)}
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
                                 onToggle={onToggleRegistrador}
                                 onEditar={(reg) => onEditarRegistrador({ ...reg, agente_id: agente.id })}
                                 onEliminar={onEliminarRegistrador}
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
);

export default PestanaAdminAgentes;
