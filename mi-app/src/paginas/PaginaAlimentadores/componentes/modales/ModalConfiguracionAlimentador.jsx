// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfiguracionAlimentador.jsx
// Modal unificado para configurar alimentador: nombre, color, registrador y diseño de card

import "./ModalConfiguracionAlimentador.css";
import "./comunes/ColorPickerSimple.css";
import {
   SeccionCardDesign,
   SelectorColor,
   useConfigAlimentador,
   useDeteccionDuplicados,
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
      agentesVinculados,
      cargandoAgentes,
      todosRegistradores,
      buscarRegistrador,
      obtenerIndicesZona,
      actualizarSide,
      actualizarBox,
   } = useConfigAlimentador({ abierto, workspaceId, initialData });

   // Hook de detección de duplicados
   const { estaIndiceDuplicado, obtenerMensajeDuplicado } = useDeteccionDuplicados(cardDesign);

   // Handlers de drag & drop
   const handleDragStart = (e, indice) => {
      e.dataTransfer.setData("text/plain", String(indice));
      e.dataTransfer.effectAllowed = "copy";
   };

   const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
   };

   const handleDrop = (e, zona, boxIndex) => {
      e.preventDefault();
      const indice = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (!isNaN(indice)) {
         actualizarBox(zona, boxIndex, "indice", indice);
      }
   };

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
                                 Seleccioná un registrador para cada zona y arrastrá los índices a los campos.
                              </p>

                              {/* Parte Superior */}
                              <SeccionCardDesign
                                 titulo="Parte superior"
                                 zona="superior"
                                 design={cardDesign.superior}
                                 registradores={todosRegistradores}
                                 registradorActual={buscarRegistrador(cardDesign.superior?.registrador_id)}
                                 indicesDisponibles={obtenerIndicesZona("superior")}
                                 onChangeRegistrador={(regId) => actualizarSide("superior", "registrador_id", regId || null)}
                                 onChangeTitulo={(val) => actualizarSide("superior", "tituloId", val)}
                                 onChangeTituloCustom={(val) => actualizarSide("superior", "tituloCustom", val)}
                                 onChangeCantidad={(val) => actualizarSide("superior", "cantidad", val)}
                                 onChangeBox={(idx, campo, val) => actualizarBox("superior", idx, campo, val)}
                                 onDragOver={handleDragOver}
                                 onDrop={(e, idx) => handleDrop(e, "superior", idx)}
                                 onDragStart={handleDragStart}
                                 estaIndiceDuplicado={estaIndiceDuplicado}
                                 obtenerMensajeDuplicado={obtenerMensajeDuplicado}
                              />

                              {/* Parte Inferior */}
                              <SeccionCardDesign
                                 titulo="Parte inferior"
                                 zona="inferior"
                                 design={cardDesign.inferior}
                                 registradores={todosRegistradores}
                                 registradorActual={buscarRegistrador(cardDesign.inferior?.registrador_id)}
                                 indicesDisponibles={obtenerIndicesZona("inferior")}
                                 onChangeRegistrador={(regId) => actualizarSide("inferior", "registrador_id", regId || null)}
                                 onChangeTitulo={(val) => actualizarSide("inferior", "tituloId", val)}
                                 onChangeTituloCustom={(val) => actualizarSide("inferior", "tituloCustom", val)}
                                 onChangeCantidad={(val) => actualizarSide("inferior", "cantidad", val)}
                                 onChangeBox={(idx, campo, val) => actualizarBox("inferior", idx, campo, val)}
                                 onDragOver={handleDragOver}
                                 onDrop={(e, idx) => handleDrop(e, "inferior", idx)}
                                 onDragStart={handleDragStart}
                                 estaIndiceDuplicado={estaIndiceDuplicado}
                                 obtenerMensajeDuplicado={obtenerMensajeDuplicado}
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
                                    checked={cardDesign.superior?.oculto || false}
                                    onChange={(e) => actualizarSide("superior", "oculto", e.target.checked)}
                                    disabled={!puedeOcultarZonas}
                                 />
                                 <span>Parte superior</span>
                              </label>
                              <label
                                 className={`alim-modal-ocultar-zona-item ${!puedeOcultarZonas ? "alim-modal-ocultar-zona-item--disabled" : ""}`}
                              >
                                 <input
                                    type="checkbox"
                                    checked={cardDesign.inferior?.oculto || false}
                                    onChange={(e) => actualizarSide("inferior", "oculto", e.target.checked)}
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
