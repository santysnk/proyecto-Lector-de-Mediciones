/**
 * Barra de controles para la ventana de historial
 * Incluye: toggle panel, tabs de zona, selector de rango, tipo de grafico, selector alimentador, cache
 */

import PropTypes from "prop-types";
import { RANGOS_TIEMPO, TIPOS_GRAFICO } from "../../constantes/historialConfig";
import SelectorFecha from "../../../../componentes/comunes/SelectorFecha";

/**
 * @param {Object} props
 * @param {boolean} props.panelDatosAbierto - Si el panel de datos está visible
 * @param {Function} props.onTogglePanel - Callback para toggle del panel
 * @param {string} props.zonaSeleccionada - "superior" o "inferior"
 * @param {Function} props.onZonaChange - Callback al cambiar zona
 * @param {Function} props.zonaDisponible - Función que verifica si una zona está disponible
 * @param {string} props.tituloSuperior - Título de la zona superior
 * @param {string} props.tituloInferior - Título de la zona inferior
 * @param {string} props.rangoSeleccionado - ID del rango seleccionado
 * @param {Function} props.onRangoChange - Callback al cambiar rango
 * @param {Date|null} props.fechaRangoDesde - Fecha desde (rango personalizado)
 * @param {Date|null} props.fechaRangoHasta - Fecha hasta (rango personalizado)
 * @param {Function} props.onFechaRangoChange - Callback al cambiar fechas
 * @param {string} props.tipoGrafico - Tipo de gráfico seleccionado
 * @param {Function} props.onTipoGraficoChange - Callback al cambiar tipo
 * @param {string} props.alimentadorId - ID del alimentador actual
 * @param {Array} props.alimentadores - Lista de alimentadores disponibles
 * @param {Function} props.onAlimentadorChange - Callback al cambiar alimentador
 * @param {number} props.precargaProgreso - Progreso de precarga (0-100)
 * @param {boolean} props.precargaCompleta - Si la precarga terminó
 * @param {boolean} props.precargando - Si está precargando
 * @param {string|null} props.fuenteDatos - Fuente de datos actual
 * @param {Function} props.onLimpiarCache - Callback para limpiar cache
 */
const BarraControlesHistorial = ({
  panelDatosAbierto,
  onTogglePanel,
  zonaSeleccionada,
  onZonaChange,
  zonaDisponible,
  tituloSuperior,
  tituloInferior,
  rangoSeleccionado,
  onRangoChange,
  fechaRangoDesde,
  fechaRangoHasta,
  onFechaRangoChange,
  tipoGrafico,
  onTipoGraficoChange,
  alimentadorId,
  alimentadores,
  onAlimentadorChange,
  precargaProgreso,
  precargaCompleta,
  precargando,
  fuenteDatos,
  onLimpiarCache,
  graficoVisible,
  onToggleGrafico,
}) => {
  return (
    <div className="ventana-controles">
      {/* Boton toggle para panel de datos */}
      <button
        type="button"
        className={`ventana-toggle-datos ${panelDatosAbierto ? "ventana-toggle-datos--activo" : ""}`}
        onClick={onTogglePanel}
        title={panelDatosAbierto ? "Ocultar datos" : "Ver datos"}
      >
        <span className="ventana-toggle-icono">▲</span>
      </button>

      {/* Tabs de zona */}
      <div className="ventana-tabs">
        <button
          type="button"
          className={`ventana-tab ${zonaSeleccionada === "superior" ? "ventana-tab--activo" : ""}`}
          onClick={() => onZonaChange("superior")}
          disabled={!zonaDisponible("superior")}
        >
          {tituloSuperior}
        </button>
        <button
          type="button"
          className={`ventana-tab ${zonaSeleccionada === "inferior" ? "ventana-tab--activo" : ""}`}
          onClick={() => onZonaChange("inferior")}
          disabled={!zonaDisponible("inferior")}
        >
          {tituloInferior}
        </button>
      </div>

      {/* Selector de rango */}
      <div className="ventana-rango">
        {RANGOS_TIEMPO.filter((r) => r.id !== "custom").map((r) => (
          <button
            key={r.id}
            type="button"
            className={`ventana-rango-btn ${rangoSeleccionado === r.id && !fechaRangoDesde ? "ventana-rango-btn--activo" : ""}`}
            onClick={() => onRangoChange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Grupo: Selector de fechas + Tipo de gráfico */}
      <div className="ventana-grupo-graficos">
        {/* Selector de rango de fechas */}
        <div className="ventana-selector-dia">
          <SelectorFecha
            value={fechaRangoDesde}
            valueHasta={fechaRangoHasta}
            modoRango={true}
            onChangeRango={onFechaRangoChange}
            maxDate={new Date()}
            placeholder="Seleccionar fechas"
          />
          {fechaRangoDesde && fechaRangoHasta && (
            <span className="ventana-dia-seleccionado">
              {new Date(fechaRangoDesde).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })}
              {fechaRangoDesde.getTime() !== fechaRangoHasta.getTime() && (
                <>
                  {" "}
                  -{" "}
                  {new Date(fechaRangoHasta).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </>
              )}
            </span>
          )}
        </div>

        {/* Selector de tipo de grafico */}
        <div className="ventana-tipo-grafico">
          {TIPOS_GRAFICO.map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              className={`ventana-tipo-btn ${tipoGrafico === tipo.id ? "ventana-tipo-btn--activo" : ""}`}
              onClick={() => onTipoGraficoChange(tipo.id)}
              title={tipo.label}
            >
              {tipo.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de alimentador */}
      {alimentadores && alimentadores.length > 1 && (
        <div className="ventana-selector-alimentador-container">
          <select
            className="ventana-selector-alimentador"
            value={alimentadorId}
            onChange={(e) => onAlimentadorChange(e.target.value)}
            title="Cambiar alimentador"
          >
            {alimentadores.map((alim) => (
              <option key={alim.id} value={alim.id}>
                {alim.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Cache + Fuente */}
      <div className="ventana-cache">
        {/* Botón toggle gráfico - solo visible en móvil portrait */}
        <button
          type="button"
          className={`ventana-toggle-grafico ${graficoVisible ? "" : "ventana-toggle-grafico--cerrado"}`}
          onClick={onToggleGrafico}
          title={graficoVisible ? "Ocultar gráfico" : "Mostrar gráfico"}
        >
          <span className="ventana-toggle-grafico-icono">▼</span>
        </button>
        <div className="ventana-cache-barra">
          <div
            className={`ventana-cache-progreso ${precargaCompleta ? "ventana-cache-progreso--completo" : ""}`}
            style={{ width: `${precargaProgreso}%` }}
          />
        </div>
        <span className="ventana-cache-texto">
          {precargaCompleta ? "✓" : `${precargaProgreso}%`}
        </span>
        {fuenteDatos && (
          <span className={`ventana-fuente ventana-fuente--${fuenteDatos}`}>
            {fuenteDatos === "local" ? "Local" : fuenteDatos === "remoto" ? "BD" : "Mixto"}
          </span>
        )}
        <button
          type="button"
          className="ventana-btn-limpiar"
          onClick={onLimpiarCache}
          disabled={precargando}
          title="Limpiar cache"
        >
          🗑
        </button>
      </div>
    </div>
  );
};

BarraControlesHistorial.propTypes = {
  panelDatosAbierto: PropTypes.bool.isRequired,
  onTogglePanel: PropTypes.func.isRequired,
  zonaSeleccionada: PropTypes.oneOf(["superior", "inferior"]).isRequired,
  onZonaChange: PropTypes.func.isRequired,
  zonaDisponible: PropTypes.func.isRequired,
  tituloSuperior: PropTypes.string,
  tituloInferior: PropTypes.string,
  rangoSeleccionado: PropTypes.string.isRequired,
  onRangoChange: PropTypes.func.isRequired,
  fechaRangoDesde: PropTypes.instanceOf(Date),
  fechaRangoHasta: PropTypes.instanceOf(Date),
  onFechaRangoChange: PropTypes.func.isRequired,
  tipoGrafico: PropTypes.oneOf(["line", "area", "bar"]).isRequired,
  onTipoGraficoChange: PropTypes.func.isRequired,
  alimentadorId: PropTypes.string,
  alimentadores: PropTypes.array,
  onAlimentadorChange: PropTypes.func,
  precargaProgreso: PropTypes.number,
  precargaCompleta: PropTypes.bool,
  precargando: PropTypes.bool,
  fuenteDatos: PropTypes.oneOf(["local", "remoto", "mixto", null]),
  onLimpiarCache: PropTypes.func.isRequired,
  graficoVisible: PropTypes.bool,
  onToggleGrafico: PropTypes.func,
};

BarraControlesHistorial.defaultProps = {
  tituloSuperior: "Superior",
  tituloInferior: "Inferior",
  fechaRangoDesde: null,
  fechaRangoHasta: null,
  alimentadorId: "",
  alimentadores: [],
  onAlimentadorChange: () => {},
  precargaProgreso: 0,
  precargaCompleta: false,
  precargando: false,
  fuenteDatos: null,
  graficoVisible: true,
  onToggleGrafico: () => {},
};

export default BarraControlesHistorial;
