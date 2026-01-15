/**
 * Panel lateral que muestra la tabla de datos del historial
 * Recibe los datos ya filtrados desde VentanaHistorial
 */

import { useMemo } from "react";
import PropTypes from "prop-types";

/**
 * @param {Object} props
 * @param {boolean} props.abierto - Si el panel está visible
 * @param {string} props.tituloPeriodo - Título mostrando el período de fechas
 * @param {number} props.intervaloFiltro - Intervalo de filtrado actual (0, 15, 30, 60 minutos)
 * @param {Function} props.onIntervaloChange - Callback al cambiar intervalo
 * @param {Array} props.datosFiltrados - Datos ya filtrados [{x, y}]
 * @param {string} props.tipoGrafico - Tipo de gráfico actual (line, area, bar)
 */
const PanelDatosHistorial = ({
  abierto,
  tituloPeriodo,
  intervaloFiltro,
  onIntervaloChange,
  datosFiltrados,
  tipoGrafico,
}) => {
  // El gráfico de barras no soporta "Todos (1/min)" por rendimiento
  const todosDeshabilitado = tipoGrafico === "bar";

  // Formatear datos para la tabla
  const datosTabla = useMemo(() => {
    return datosFiltrados.map((punto) => {
      const fecha = new Date(punto.x);
      return {
        fecha: fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        hora: fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
        medicion: Math.ceil(punto.y * 100) / 100,
      };
    });
  }, [datosFiltrados]);

  if (!abierto) return null;

  return (
    <div className="ventana-panel-datos">
      <div className="ventana-panel-header">
        <span>{tituloPeriodo}</span>
        <select
          className="ventana-panel-intervalo"
          value={intervaloFiltro}
          onChange={(e) => onIntervaloChange(Number(e.target.value))}
        >
          <option value={0} disabled={todosDeshabilitado}>
            {todosDeshabilitado ? "Todos (no disp.)" : "Todos"}
          </option>
          <option value={15}>cada 15m</option>
          <option value={30}>cada 30m</option>
          <option value={60}>cada 60m</option>
        </select>
      </div>
      <div className="ventana-panel-tabla-container">
        <table className="ventana-panel-tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Medicion</th>
            </tr>
          </thead>
          <tbody>
            {datosTabla.map((fila, idx) => (
              <tr key={idx}>
                <td>{fila.fecha}</td>
                <td>{fila.hora}</td>
                <td>{fila.medicion.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

PanelDatosHistorial.propTypes = {
  abierto: PropTypes.bool.isRequired,
  tituloPeriodo: PropTypes.string,
  intervaloFiltro: PropTypes.number,
  onIntervaloChange: PropTypes.func.isRequired,
  datosFiltrados: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
      y: PropTypes.number,
    })
  ),
  tipoGrafico: PropTypes.oneOf(["line", "area", "bar"]),
};

PanelDatosHistorial.defaultProps = {
  tituloPeriodo: "Sin datos",
  intervaloFiltro: 60,
  datosFiltrados: [],
  tipoGrafico: "line",
};

export default PanelDatosHistorial;
