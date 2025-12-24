/**
 * Barra de titulo arrastrable para ventanas flotantes de historial
 * Incluye titulo, botones de minimizar/maximizar/cerrar
 */

import { forwardRef } from "react";

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
        <button
          type="button"
          className="ventana-btn ventana-btn--minimizar"
          onClick={onMinimizar}
          title="Minimizar"
        >
          <span>─</span>
        </button>
        <button
          type="button"
          className="ventana-btn ventana-btn--maximizar"
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

export default BarraTituloVentana;
