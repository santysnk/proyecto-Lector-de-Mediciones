// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfirmacion.jsx
// Modal de confirmación reutilizable con estilo oscuro

import React from "react";
import "./ModalConfirmacion.css";

/**
 * Modal de confirmación genérico.
 * Muestra un mensaje y dos botones: Cancelar y Confirmar.
 */
const ModalConfirmacion = ({
  abierto,
  titulo = "Confirmar acción",
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
  peligroso = false, // Si es true, el botón de confirmar será rojo
}) => {
  if (!abierto) return null;

  return (
    <div className="confirmacion-fondo-oscuro">
      <div className="confirmacion-contenedor">
        <h2>{titulo}</h2>
        <p className="confirmacion-mensaje">{mensaje}</p>

        <div className="confirmacion-acciones">
          <button
            type="button"
            className="confirmacion-boton confirmacion-cancelar"
            onClick={onCancelar}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`confirmacion-boton ${peligroso ? "confirmacion-peligro" : "confirmacion-confirmar"}`}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
