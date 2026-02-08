// componentes/navegacion/BarraNavegacion.jsx

import React, { useState } from "react";
import "./BarraNavegacion.css";
import { usarContextoAlimentadores } from "../../contexto/ContextoAlimentadoresSupabase";
import { calcularEstadoGlobal } from "./barraNavegacionUtils";
import { BarraCompacta, BarraDesktop, DialogoConfirmacionMediciones } from "./ComponentesBarraNav";

const BarraNavegacion = ({
   esCompacto, puestos, puestoSeleccionado, onSeleccionarPuesto,
   onAbrirModalNuevoPuesto, onAbrirModalEditarPuestos, onAbrirModalConfigPuesto,
   onAbrirModalConfigurarAgente, onAbrirModalGestionarAccesos, onAbrirModalPanelPermisos,
   onSalir, onAbrirMenu, coloresSistema, estaPolling, onPlayStopClick,
}) => {
   const { hayCambiosPendientes, sincronizando, sincronizarCambios, descartarCambios, obtenerColorPuesto } = usarContextoAlimentadores();
   const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

   const { alimentadoresConPolling, hayAlgunaCardDisponible, algunaCardMidiendo } = calcularEstadoGlobal(puestoSeleccionado, estaPolling);

   const handleClickMaestro = () => { if (hayAlgunaCardDisponible) setMostrarConfirmacion(true); };

   const ejecutarMaestroGlobal = () => {
      setMostrarConfirmacion(false);
      alimentadoresConPolling.forEach((alim) => {
         if (algunaCardMidiendo ? estaPolling?.(alim.id) : !estaPolling?.(alim.id)) onPlayStopClick?.(alim.id);
      });
   };

   return (
      <>
         <nav className={"alim-navbar" + (esCompacto ? " alim-navbar-compact" : "")}>
            {esCompacto ? (
               <BarraCompacta
                  puestoSeleccionado={puestoSeleccionado} onAbrirMenu={onAbrirMenu} onAbrirModalConfigPuesto={onAbrirModalConfigPuesto}
                  hayAlgunaCardDisponible={hayAlgunaCardDisponible} algunaCardMidiendo={algunaCardMidiendo} onClickMaestro={handleClickMaestro}
               />
            ) : (
               <BarraDesktop
                  puestoSeleccionado={puestoSeleccionado} puestos={puestos}
                  onSeleccionarPuesto={onSeleccionarPuesto} onAbrirModalConfigPuesto={onAbrirModalConfigPuesto}
                  onAbrirModalNuevoPuesto={onAbrirModalNuevoPuesto} onAbrirModalEditarPuestos={onAbrirModalEditarPuestos}
                  onAbrirModalConfigurarAgente={onAbrirModalConfigurarAgente} onAbrirModalGestionarAccesos={onAbrirModalGestionarAccesos}
                  onAbrirModalPanelPermisos={onAbrirModalPanelPermisos} onSalir={onSalir}
                  obtenerColorPuesto={obtenerColorPuesto} coloresSistema={coloresSistema}
                  hayAlgunaCardDisponible={hayAlgunaCardDisponible} algunaCardMidiendo={algunaCardMidiendo} onClickMaestro={handleClickMaestro}
                  hayCambiosPendientes={hayCambiosPendientes} sincronizando={sincronizando}
                  sincronizarCambios={sincronizarCambios} descartarCambios={descartarCambios}
               />
            )}
         </nav>
         {mostrarConfirmacion && (
            <DialogoConfirmacionMediciones algunaCardMidiendo={algunaCardMidiendo} onCancelar={() => setMostrarConfirmacion(false)} onConfirmar={ejecutarMaestroGlobal} />
         )}
      </>
   );
};

export default BarraNavegacion;
