/**
 * Modal de configuración para generar informes Excel
 * Permite configurar: solicitante, intervalo de muestreo
 */

import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { INTERVALOS_INFORME } from "../../../constantes/historialConfig";
import { generarImagenGrafico } from "../../../utilidades/generarGraficoInforme";
import { obtenerIntervalosHabilitados, filtrarDatosPorIntervalo } from "./logicaIntervalosInforme";
import "./ModalConfigInforme.css";

const ModalConfigInforme = ({
  visible,
  onCerrar,
  onGenerar,
  datos,
  nombreAlimentador,
  tituloMedicion,
  tipoGrafico = "line",
}) => {
  const [solicitadoPor, setSolicitadoPor] = useState("");
  const [intervaloSeleccionado, setIntervaloSeleccionado] = useState(null);
  const [generando, setGenerando] = useState(false);

  // Calcular duración del período de datos
  const { duracionMs, fechaInicio, fechaFin } = useMemo(() => {
    if (!datos || datos.length === 0) {
      return { duracionMs: 0, fechaInicio: null, fechaFin: null };
    }

    const timestamps = datos.map((d) => new Date(d.x).getTime());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);

    return {
      duracionMs: max - min,
      fechaInicio: new Date(min),
      fechaFin: new Date(max),
    };
  }, [datos]);

  // Intervalos habilitados según la duración
  const intervalosHabilitados = useMemo(() => {
    return obtenerIntervalosHabilitados(duracionMs);
  }, [duracionMs]);

  // Seleccionar automáticamente el primer intervalo habilitado si no hay selección válida
  useEffect(() => {
    if (
      intervalosHabilitados.length > 0 &&
      (!intervaloSeleccionado || !intervalosHabilitados.includes(intervaloSeleccionado))
    ) {
      setIntervaloSeleccionado(intervalosHabilitados[0]);
    }
  }, [intervalosHabilitados, intervaloSeleccionado]);

  // Filtrar datos según el intervalo seleccionado
  const datosFiltrados = useMemo(() => {
    return filtrarDatosPorIntervalo(datos, intervaloSeleccionado);
  }, [datos, intervaloSeleccionado]);

  const handleGenerar = async () => {
    setGenerando(true);

    try {
      // Generar imagen del gráfico con los datos filtrados del modal
      const imagenGrafico = await generarImagenGrafico(datosFiltrados, {
        tipo: tipoGrafico,
        titulo: "", // Sin título en el gráfico, ya está en el Excel
      });

      onGenerar({
        solicitadoPor: solicitadoPor.trim() || "No especificado",
        intervalo: intervaloSeleccionado,
        datosFiltrados,
        fechaInicio,
        fechaFin,
        imagenGrafico,
      });
      onCerrar();
    } catch (err) {
      console.error("Error generando informe:", err);
    } finally {
      setGenerando(false);
    }
  };

  if (!visible) return null;

  const formatearFecha = (fecha) => {
    if (!fecha) return "--";
    return fecha.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const duracionTexto = () => {
    const horas = Math.floor(duracionMs / (1000 * 60 * 60));
    const minutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));

    if (horas >= 24) {
      const dias = Math.floor(horas / 24);
      const horasRestantes = horas % 24;
      return `${dias} día${dias > 1 ? "s" : ""} ${horasRestantes}h`;
    }
    return `${horas}h ${minutos}min`;
  };

  return (
    <div className="modal-config-informe-overlay" onClick={onCerrar}>
      <div className="modal-config-informe" onClick={(e) => e.stopPropagation()}>
        <header className="modal-config-header">
          <h3>Configurar Informe</h3>
          <button type="button" className="modal-config-cerrar" onClick={onCerrar}>
            ×
          </button>
        </header>

        <div className="modal-config-contenido">
          {/* Info del informe */}
          <div className="modal-config-info">
            <p>
              <strong>Registros para:</strong> {nombreAlimentador}
            </p>
            <p>
              <strong>Medición:</strong> {tituloMedicion}
            </p>
            <p>
              <strong>Período:</strong> {formatearFecha(fechaInicio)} - {formatearFecha(fechaFin)}
            </p>
            <p>
              <strong>Duración:</strong> {duracionTexto()}
            </p>
          </div>

          {/* Solicitado por */}
          <div className="modal-config-campo">
            <label htmlFor="solicitadoPor">Solicitado por:</label>
            <input
              type="text"
              id="solicitadoPor"
              value={solicitadoPor}
              onChange={(e) => setSolicitadoPor(e.target.value)}
              placeholder="Nombre del solicitante"
              autoFocus
            />
          </div>

          {/* Intervalo de muestreo */}
          <div className="modal-config-campo">
            <label>Intervalo de muestreo:</label>
            <div className="modal-config-intervalos">
              {INTERVALOS_INFORME.map((intervalo) => {
                const habilitado = intervalosHabilitados.includes(intervalo.id);
                const seleccionado = intervaloSeleccionado === intervalo.id;

                return (
                  <button
                    key={intervalo.id}
                    type="button"
                    className={`modal-config-intervalo ${seleccionado ? "seleccionado" : ""}`}
                    disabled={!habilitado}
                    onClick={() => setIntervaloSeleccionado(intervalo.id)}
                  >
                    {intervalo.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview de registros */}
          <div className="modal-config-preview">
            <span>
              Registros en el informe: <strong>{datosFiltrados.length}</strong>
            </span>
          </div>
        </div>

        <footer className="modal-config-footer">
          <button type="button" className="modal-config-btn cancelar" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="modal-config-btn generar"
            onClick={handleGenerar}
            disabled={datosFiltrados.length === 0 || generando}
          >
            {generando ? "Generando..." : "Generar Informe"}
          </button>
        </footer>
      </div>
    </div>
  );
};

ModalConfigInforme.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  onGenerar: PropTypes.func.isRequired,
  datos: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
      y: PropTypes.number,
    })
  ),
  nombreAlimentador: PropTypes.string,
  tituloMedicion: PropTypes.string,
  tipoGrafico: PropTypes.oneOf(["line", "area", "bar"]),
};

ModalConfigInforme.defaultProps = {
  datos: [],
  nombreAlimentador: "Alimentador",
  tituloMedicion: "Medición",
  tipoGrafico: "line",
};

export default ModalConfigInforme;
