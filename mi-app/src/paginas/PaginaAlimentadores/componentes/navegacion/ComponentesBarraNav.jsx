// componentes/navegacion/ComponentesBarraNav.jsx
// Sub-componentes extraídos de BarraNavegacion

import React from "react";
import BotonGuardarCambios from "./BotonGuardarCambios.jsx";
import SelectorConfiguracion from "./SelectorConfiguracion.jsx";

export const BarraCompacta = ({ puestoSeleccionado, onAbrirMenu, onAbrirModalConfigPuesto, hayAlgunaCardDisponible, algunaCardMidiendo, onClickMaestro }) => (
   <>
      <button type="button" className="alim-navbar-menu-btn" onClick={onAbrirMenu} aria-label="Abrir menú">☰</button>
      {puestoSeleccionado ? (
         <button type="button" className="alim-current-puesto-btn" onClick={onAbrirModalConfigPuesto} title="Configurar puesto">
            {puestoSeleccionado.nombre}
         </button>
      ) : (
         <div className="alim-navbar-compact-title">Panel de Alimentadores</div>
      )}
      {puestoSeleccionado && (
         <button
            type="button"
            className={`alim-maestro-btn ${algunaCardMidiendo ? "alim-maestro-btn--stop" : ""} ${!hayAlgunaCardDisponible ? "alim-maestro-btn--disabled" : ""}`}
            onClick={onClickMaestro} disabled={!hayAlgunaCardDisponible}
            title={!hayAlgunaCardDisponible ? "Sin registradores con configuración válida" : algunaCardMidiendo ? "Detener todas las mediciones" : "Iniciar todas las mediciones"}
         >
            {!hayAlgunaCardDisponible ? "⊘" : algunaCardMidiendo ? "⏹" : "▶"}
         </button>
      )}
   </>
);

export const BarraDesktop = ({
   puestoSeleccionado, puestos, onSeleccionarPuesto, onAbrirModalConfigPuesto,
   onAbrirModalNuevoPuesto, onAbrirModalEditarPuestos, onAbrirModalConfigurarAgente,
   onAbrirModalGestionarAccesos, onAbrirModalPanelPermisos, onSalir,
   obtenerColorPuesto, coloresSistema, hayAlgunaCardDisponible, algunaCardMidiendo, onClickMaestro,
   hayCambiosPendientes, sincronizando, sincronizarCambios, descartarCambios,
}) => {
   return (
      <>
         <div className="alim-navbar-left">
            <h1 className="alim-title">Panel de Alimentadores</h1>
            {puestoSeleccionado && (
               <div className="alim-puesto-row">
                  <button type="button" className="alim-puesto-nombre-btn" onClick={onAbrirModalConfigPuesto} title="Configurar puesto">
                     {puestoSeleccionado.nombre}
                  </button>
                  <button
                     type="button"
                     className={`alim-maestro-btn-texto ${algunaCardMidiendo ? "alim-maestro-btn-texto--stop" : ""} ${!hayAlgunaCardDisponible ? "alim-maestro-btn-texto--disabled" : ""}`}
                     onClick={onClickMaestro} disabled={!hayAlgunaCardDisponible}
                     title={!hayAlgunaCardDisponible ? "Sin registradores con configuración válida" : algunaCardMidiendo ? "Detener todas las mediciones" : "Iniciar todas las mediciones"}
                  >
                     {!hayAlgunaCardDisponible ? "⊘" : algunaCardMidiendo ? "PARAR MEDICIONES" : "INICIAR MEDICIONES"}
                  </button>
               </div>
            )}
         </div>
         <div className="alim-nav-buttons">
            <div className="alim-nav-bloque-puestos">
               {puestos.map((p) => {
                  const esActivo = puestoSeleccionado && puestoSeleccionado.id === p.id;
                  const color = obtenerColorPuesto(p.id) || coloresSistema[0];
                  return (
                     <button
                        key={p.id}
                        className={"alim-btn" + (esActivo ? " alim-btn-active" : "")}
                        onClick={() => onSeleccionarPuesto(p.id)}
                        style={{ "--puesto-color": color }}
                     >
                        {p.nombre}
                     </button>
                  );
               })}
            </div>
            <div className="alim-nav-bloque-controles">
               <BotonGuardarCambios hayCambios={hayCambiosPendientes} sincronizando={sincronizando} onGuardar={sincronizarCambios} onDescartar={descartarCambios} />
               <SelectorConfiguracion
                  onAbrirModalNuevoPuesto={onAbrirModalNuevoPuesto} onAbrirModalEditarPuestos={onAbrirModalEditarPuestos}
                  onAbrirModalConfigurarAgente={onAbrirModalConfigurarAgente} onAbrirModalGestionarAccesos={onAbrirModalGestionarAccesos}
                  onAbrirModalPanelPermisos={onAbrirModalPanelPermisos} puestosLength={puestos.length}
               />
               <button type="button" className="alim-btn-exit" onClick={onSalir}>Salir</button>
            </div>
         </div>
      </>
   );
};

export const DialogoConfirmacionMediciones = ({ algunaCardMidiendo, onCancelar, onConfirmar }) => (
   <div className="alim-confirmacion-overlay">
      <div className="alim-confirmacion">
         <div className="alim-confirmacion__icono">{algunaCardMidiendo ? "⏹️" : "▶️"}</div>
         <h3 className="alim-confirmacion__titulo">{algunaCardMidiendo ? "¿Detener todas las mediciones?" : "¿Iniciar todas las mediciones?"}</h3>
         <p className="alim-confirmacion__mensaje">
            {algunaCardMidiendo
               ? "Se detendrán las mediciones de todos los registradores activos en este puesto."
               : "Se iniciarán las mediciones de todos los registradores con configuración válida en este puesto."}
         </p>
         <div className="alim-confirmacion__botones">
            <button type="button" className="alim-confirmacion__btn alim-confirmacion__btn--cancelar" onClick={onCancelar}>Cancelar</button>
            <button type="button" className={`alim-confirmacion__btn ${algunaCardMidiendo ? "alim-confirmacion__btn--detener" : "alim-confirmacion__btn--iniciar"}`} onClick={onConfirmar}>
               {algunaCardMidiendo ? "Detener" : "Iniciar"}
            </button>
         </div>
      </div>
   </div>
);
