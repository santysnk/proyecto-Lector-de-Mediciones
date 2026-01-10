// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfiguracionAlimentador.jsx
// Modal unificado para configurar alimentador: nombre, color, registrador y diseño de card

import "./ModalConfiguracionAlimentador.css";
import "./comunes/ColorPickerSimple.css";
import {
   SeccionCardDesignV2,
   SelectorColor,
   useConfigAlimentador,
   INTERVALO_CONSULTA_MIN,
} from "./configuracion-alimentador";

const ModalConfiguracionAlimentador = ({
   abierto,
   puestoNombre,
   workspaceId,
   modo = "crear",
   initialData,
   onCancelar,
   onConfirmar,
   onEliminar,
   esCreador = false,
   rolEnWorkspace = null,
}) => {
   // Determinar permisos según rol
   const esAdmin = esCreador || rolEnWorkspace === "admin";
   const puedeEditarNombre = esAdmin;
   const puedeEditarDiseno = esAdmin;
   const puedeEliminar = esAdmin;
   const puedeEditarIntervalo = esAdmin;
   const puedeOcultarZonas = esAdmin;

   // Hook de configuración
   const {
      nombre,
      setNombre,
      color,
      setColor,
      intervaloConsultaSeg,
      setIntervaloConsultaSeg,
      cardDesign,
      configTarjeta,
      actualizarConfigTarjetaZona,
      agentesVinculados,
      cargandoAgentes,
      todosRegistradores,
      actualizarSide,
   } = useConfigAlimentador({ abierto, workspaceId, initialData });

   // Submit
   const handleSubmit = (e) => {
      e.preventDefault();
      const limpioNombre = nombre.trim();
      if (!limpioNombre) return;

      onConfirmar({
         nombre: limpioNombre,
         color,
         intervalo_consulta_ms: intervaloConsultaSeg * 1000,
         card_design: cardDesign,
         config_tarjeta: configTarjeta,
      });
   };

   const handleEliminarClick = () => {
      if (!onEliminar) return;
      const seguro = window.confirm("¿Seguro que querés eliminar este alimentador?");
      if (seguro) {
         onEliminar();
      }
   };

   if (!abierto) return null;

   return (
      <div className="alim-modal-overlay">
         <div className="alim-modal alim-modal--grande">
            <h2>
               {modo === "editar" ? "Editar alimentador" : "Nuevo alimentador"}
               {puestoNombre && `: ${puestoNombre}`}
            </h2>

            <form onSubmit={handleSubmit}>
               <div className="alim-modal-content">
                  {/* === SECCIÓN: Nombre y Color === */}
                  <div className="alim-modal-seccion">
                     <div className="alim-modal-campo">
                        <label>Nombre del Alimentador</label>
                        <input
                           id="nombre-alimentador"
                           type="text"
                           className="alim-modal-input"
                           value={nombre}
                           onChange={(e) => setNombre(e.target.value)}
                           placeholder="Ej: ALIMENTADOR 1"
                           required
                           autoComplete="off"
                           autoCorrect="off"
                           spellCheck={false}
                           autoFocus={puedeEditarNombre}
                           disabled={!puedeEditarNombre}
                        />
                     </div>

                     <SelectorColor color={color} onChange={setColor} />
                  </div>

                  {/* === SECCIÓN: Diseño de Card === */}
                  {puedeEditarDiseno && (
                     <div className="alim-modal-seccion">
                        <h3 className="alim-modal-seccion-titulo">Diseño de la tarjeta</h3>

                        {cargandoAgentes ? (
                           <p className="alim-modal-cargando">Cargando registradores...</p>
                        ) : agentesVinculados.length === 0 ? (
                           <p className="alim-modal-aviso">
                              No hay agentes vinculados a este workspace. Vinculá un agente desde el panel de
                              configuración para poder asignar registradores.
                           </p>
                        ) : (
                           <>
                              <p className="alim-modal-seccion-ayuda">
                                 Seleccioná un registrador y una funcionalidad para cada zona de la tarjeta.
                              </p>

                              {/* Parte Superior */}
                              <SeccionCardDesignV2
                                 titulo="Parte superior"
                                 zona="superior"
                                 config={configTarjeta.superior}
                                 registradores={todosRegistradores}
                                 onChangeConfig={(nuevaConfig) => actualizarConfigTarjetaZona("superior", nuevaConfig)}
                              />

                              {/* Parte Inferior */}
                              <SeccionCardDesignV2
                                 titulo="Parte inferior"
                                 zona="inferior"
                                 config={configTarjeta.inferior}
                                 registradores={todosRegistradores}
                                 onChangeConfig={(nuevaConfig) => actualizarConfigTarjetaZona("inferior", nuevaConfig)}
                              />
                           </>
                        )}
                     </div>
                  )}

                  {/* === SECCIÓN: Intervalo de consulta + Ocultar zonas === */}
                  {(puedeEditarIntervalo || puedeOcultarZonas) && (
                     <div className="alim-modal-seccion">
                        <h3 className="alim-modal-seccion-titulo">Intervalo de consulta</h3>
                        <div className="alim-modal-intervalo-wrapper">
                           <div className="alim-modal-campo">
                              <label>Segundos entre consultas a la Base de Datos</label>
                              <input
                                 type="number"
                                 className="alim-modal-input-numero"
                                 value={intervaloConsultaSeg}
                                 onChange={(e) => {
                                    const valor = Number(e.target.value);
                                    setIntervaloConsultaSeg(Math.max(INTERVALO_CONSULTA_MIN, valor));
                                 }}
                                 min={INTERVALO_CONSULTA_MIN}
                                 step={1}
                                 disabled={!puedeEditarIntervalo}
                              />
                              <span className="alim-modal-campo-ayuda">
                                 Cada cuánto el frontend consulta la última lectura (mín. {INTERVALO_CONSULTA_MIN}s)
                              </span>
                           </div>

                           {/* Checkboxes para ocultar zonas */}
                           <div className="alim-modal-ocultar-zonas">
                              <span className="alim-modal-ocultar-zonas-titulo">Ocultar en tarjeta</span>
                              <label
                                 className={`alim-modal-ocultar-zona-item ${!puedeOcultarZonas ? "alim-modal-ocultar-zona-item--disabled" : ""}`}
                              >
                                 <input
                                    type="checkbox"
                                    checked={configTarjeta.superior?.oculto || false}
                                    onChange={(e) => actualizarConfigTarjetaZona("superior", { oculto: e.target.checked })}
                                    disabled={!puedeOcultarZonas}
                                 />
                                 <span>Parte superior</span>
                              </label>
                              <label
                                 className={`alim-modal-ocultar-zona-item ${!puedeOcultarZonas ? "alim-modal-ocultar-zona-item--disabled" : ""}`}
                              >
                                 <input
                                    type="checkbox"
                                    checked={configTarjeta.inferior?.oculto || false}
                                    onChange={(e) => actualizarConfigTarjetaZona("inferior", { oculto: e.target.checked })}
                                    disabled={!puedeOcultarZonas}
                                 />
                                 <span>Parte inferior</span>
                              </label>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Botones inferiores */}
               <div className="alim-modal-actions">
                  {modo === "editar" && puedeEliminar && (
                     <button type="button" className="alim-modal-btn-eliminar" onClick={handleEliminarClick}>
                        Eliminar
                     </button>
                  )}

                  <div className="alim-modal-actions-right">
                     <button type="button" className="alim-modal-btn alim-modal-btn-cancelar" onClick={onCancelar}>
                        Cancelar
                     </button>

                     <button type="submit" className="alim-modal-btn alim-modal-btn-guardar">
                        Guardar
                     </button>
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
};

export default ModalConfiguracionAlimentador;
