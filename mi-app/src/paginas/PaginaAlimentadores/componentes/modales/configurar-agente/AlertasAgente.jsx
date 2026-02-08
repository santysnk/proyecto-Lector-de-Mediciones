// componentes/modales/configurar-agente/AlertasAgente.jsx
// Componentes de alertas y estados para ModalConfigurarAgente

import React from "react";

export const AlertaClave = ({ clave, onCopiar, onCerrar }) => (
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

export const AlertaError = ({ mensaje, onCerrar }) => (
   <div className="config-agente-alerta config-agente-alerta--error">
      {mensaje}
      <button onClick={onCerrar}>×</button>
   </div>
);

export const IndicadorCargando = () => (
   <div className="config-agente-cargando">
      <span className="config-agente-spinner"></span>
      Cargando...
   </div>
);

export const EstadoVacio = ({ icono, mensaje, children }) => (
   <div className="config-agente-vacio">
      <span className="config-agente-vacio-icono">{icono}</span>
      <p>{mensaje}</p>
      {children}
   </div>
);
