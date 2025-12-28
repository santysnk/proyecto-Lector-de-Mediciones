/**
 * Barra de titulo arrastrable para ventanas flotantes de historial
 * Incluye titulo, botones de minimizar/maximizar/cerrar
 * En móvil solo muestra el botón de cerrar
 */

import { forwardRef } from "react";
import PropTypes from "prop-types";

/**
 * @param {Object} props
 * @param {string} props.nombre - Nombre del alimentador
 * @param {boolean} props.maximizada - Si la ventana esta maximizada
 * @param {Function} props.onMinimizar - Callback para minimizar
 * @param {Function} props.onMaximizar - Callback para maximizar/restaurar
 * @param {Function} props.onCerrar - Callback para cerrar
 * @param {Function} props.onMouseDown - Callback para iniciar arrastre
 * @param {React.Ref} ref - Ref para el header
 */
const BarraTituloVentana = forwardRef(({
  nombre,
  maximizada,
  onMinimizar,
  onMaximizar,
  onCerrar,
  onMouseDown,
}, ref) => {
  return (
    <header
      ref={ref}
      className="ventana-historial-header"
      onMouseDown={onMouseDown}
    >
      <div className="ventana-historial-titulo">
        <span className="ventana-historial-icono">📊</span>
        <span className="ventana-historial-nombre">{nombre}</span>
      </div>
      <div className="ventana-historial-controles">
        {/* Botones minimizar/maximizar ocultos en móvil via CSS */}
        <button
          type="button"
          className="ventana-btn ventana-btn--minimizar ventana-btn--desktop-only"
          onClick={onMinimizar}
          title="Minimizar"
        >
          <span>─</span>
        </button>
        <button
          type="button"
          className="ventana-btn ventana-btn--maximizar ventana-btn--desktop-only"
          onClick={onMaximizar}
          title={maximizada ? "Restaurar" : "Maximizar"}
        >
          <span>{maximizada ? "❐" : "□"}</span>
        </button>
        <button
          type="button"
          className="ventana-btn ventana-btn--cerrar"
          onClick={onCerrar}
          title="Cerrar"
        >
          <span>×</span>
        </button>
      </div>
    </header>
  );
});

BarraTituloVentana.displayName = "BarraTituloVentana";

BarraTituloVentana.propTypes = {
  nombre: PropTypes.string,
  maximizada: PropTypes.bool,
  onMinimizar: PropTypes.func.isRequired,
  onMaximizar: PropTypes.func.isRequired,
  onCerrar: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
};

BarraTituloVentana.defaultProps = {
  nombre: "Ventana",
  maximizada: false,
};

export default BarraTituloVentana;
