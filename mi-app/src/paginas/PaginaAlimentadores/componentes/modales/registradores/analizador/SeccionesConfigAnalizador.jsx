// componentes/modales/registradores/analizador/SeccionesConfigAnalizador.jsx
// Secciones de conexión y plantilla para ConfiguracionAnalizador

import React from "react";

export const SeccionConexion = ({
   config,
   onConexionChange,
   onRegistroInicialChange,
   onCantidadRegistrosChange,
   onIntervaloChange,
}) => (
   <div className="config-rele-seccion config-rele-seccion--conexion">
      <h6>📡 Conexión Modbus TCP</h6>
      <div className="config-rele-conexion-fila">
         <div className="config-rele-conexion-grupo">
            <div className="config-rele-campo-inline">
               <label>IP</label>
               <input
                  type="text"
                  value={config.conexion.ip}
                  onChange={(e) => onConexionChange("ip", e.target.value)}
                  placeholder="Ej: 192.168.1.100"
               />
            </div>
            <div className="config-rele-campo-inline">
               <label>Puerto</label>
               <input
                  type="number"
                  value={config.conexion.puerto}
                  onChange={(e) => onConexionChange("puerto", e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="Ej: 502"
               />
            </div>
            <div className="config-rele-campo-inline">
               <label>Unit ID</label>
               <input
                  type="number"
                  value={config.conexion.unitId}
                  onChange={(e) => onConexionChange("unitId", e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="Ej: 1"
               />
            </div>
         </div>
         <div className="config-rele-conexion-grupo">
            <div className="config-rele-campo-inline">
               <label>Inicio</label>
               <input
                  type="number"
                  value={config.registroInicial}
                  onChange={(e) => onRegistroInicialChange(e.target.value)}
                  placeholder="Ej: 0"
                  min={0}
               />
            </div>
            <div className="config-rele-campo-inline">
               <label>Cant.</label>
               <input
                  type="number"
                  value={config.cantidadRegistros}
                  onChange={(e) => onCantidadRegistrosChange(e.target.value)}
                  placeholder="Ej: 50"
                  min={1}
               />
            </div>
         </div>
         <div className="config-rele-conexion-grupo">
            <div className="config-rele-campo-inline config-rele-campo-inline--con-sufijo">
               <label>Intervalo</label>
               <div className="config-rele-input-con-sufijo">
                  <input
                     type="number"
                     value={config.intervalo}
                     onChange={(e) => onIntervaloChange(e.target.value)}
                     min={1}
                  />
                  <span className="config-rele-input-sufijo">s</span>
               </div>
            </div>
         </div>
      </div>
   </div>
);

export const SeccionPlantilla = ({
   plantillas,
   config,
   cargandoPlantillas,
   plantillaSeleccionada,
   plantillaNoEncontrada,
   onPlantillaChange,
   onAbrirModalCrear,
   onAbrirModalGestionar,
}) => (
   <div className="config-rele-seccion config-rele-seccion--plantilla">
      <h6>📋 Plantilla de Configuración</h6>

      <div className="config-rele-plantilla-row">
         <select
            value={config.plantillaId}
            onChange={onPlantillaChange}
            className={`config-rele-select ${plantillaNoEncontrada ? "config-rele-select--error" : ""}`}
         >
            <option value="">Seleccionar plantilla...</option>
            {plantillas.map((p) => (
               <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
         </select>

         <button type="button" className="config-rele-btn-plantilla" onClick={onAbrirModalCrear} title="Nueva plantilla">
            + Nueva
         </button>

         <button type="button" className="config-rele-btn-plantilla config-rele-btn-plantilla--secundario" onClick={onAbrirModalGestionar} title="Gestionar plantillas">
            Gestionar
         </button>
      </div>

      {plantillaNoEncontrada && (
         <div className="config-rele-alerta">La plantilla seleccionada ya no existe. Selecciona otra.</div>
      )}

      {plantillas.length === 0 && !cargandoPlantillas && (
         <div className="config-rele-mensaje">No hay plantillas. Crea una para continuar.</div>
      )}

      {plantillaSeleccionada?.descripcion && (
         <div className="config-rele-plantilla-desc">{plantillaSeleccionada.descripcion}</div>
      )}
   </div>
);
