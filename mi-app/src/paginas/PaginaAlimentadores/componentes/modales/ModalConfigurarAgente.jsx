// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx
// Modal para configurar el agente

import React from "react";
import "./ModalConfigurarAgente.css";

/**
 * Modal para configurar el agente.
 * Por ahora solo muestra título y botones Guardar/Cancelar.
 */
const ModalConfigurarAgente = ({
  abierto,
  onGuardar,
  onCancelar,
}) => {
  if (!abierto) return null;

  const handleGuardar = () => {
    onGuardar?.();
  };

  return (
    <div className="config-agente-fondo-oscuro">
      <div className="config-agente-contenedor">
        <h2>Configurar Agente</h2>

        {/* Contenido futuro del modal */}
        <div className="config-agente-contenido">
          {/* Aquí irán los campos de configuración */}
        </div>

        <div className="config-agente-acciones">
          <button
            type="button"
            className="config-agente-boton config-agente-cancelar"
            onClick={onCancelar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="config-agente-boton config-agente-guardar"
            onClick={handleGuardar}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfigurarAgente;
