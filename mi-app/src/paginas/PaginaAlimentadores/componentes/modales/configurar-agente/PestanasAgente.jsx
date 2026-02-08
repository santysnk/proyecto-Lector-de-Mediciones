// componentes/modales/configurar-agente/PestanasAgente.jsx
// Componentes de pestañas: Vinculados, Vincular y formulario crear

import React from "react";
import { TarjetaAgente, ListaRegistradores } from "./index";
import { EstadoVacio } from "./AlertasAgente";

export const PestanaAgentesVinculados = ({
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

export const PestanaVincularAgente = ({ agentesDisponibles, esSuperadmin, onVincular, onIrAAdmin }) => {
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

export const FormularioCrearAgente = ({ nuevoAgente, setNuevoAgente, creando, onSubmit, onCancelar }) => (
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
