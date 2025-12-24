/**
 * Modal de configuración para generar informes Excel
 * Permite configurar: solicitante, intervalo de muestreo
 */

import { useState, useMemo } from "react";
import "./ModalConfigInforme.css";

// Opciones de intervalo disponibles (en minutos)
const INTERVALOS_DISPONIBLES = [
  { id: 15, label: "15 min", minutos: 15 },
  { id: 30, label: "30 min", minutos: 30 },
  { id: 60, label: "1 hora", minutos: 60 },
  { id: 180, label: "3 horas", minutos: 180 },
  { id: 360, label: "6 horas", minutos: 360 },
  { id: 720, label: "12 horas", minutos: 720 },
];

/**
 * Determina qué intervalos están habilitados según la duración del período
 * @param {number} duracionMs - Duración en milisegundos
 * @returns {number[]} - Array de IDs de intervalos habilitados
 */
const obtenerIntervalosHabilitados = (duracionMs) => {
  const duracionHoras = duracionMs / (1000 * 60 * 60);

  if (duracionHoras <= 1) {
    // Hasta 1 hora: solo 15 min
    return [15];
  } else if (duracionHoras <= 2) {
    // Más de 1h hasta 2h: 15 min o 30 min
    return [15, 30];
  } else if (duracionHoras <= 6) {
    // Más de 2h hasta 6h: 15, 30 min o 1 hora
    return [15, 30, 60];
  } else if (duracionHoras <= 12) {
    // Más de 6h hasta 12h: 30 min o 1 hora
    return [30, 60];
  } else if (duracionHoras <= 24) {
    // Más de 12h hasta 24h: 30 min, 1 hora o 3 horas
    return [30, 60, 180];
  } else if (duracionHoras <= 48) {
    // Más de 24h hasta 48h: 3 horas o 6 horas
    return [180, 360];
  } else {
    // Más de 48h (7 días o más): 3, 6 o 12 horas
    return [180, 360, 720];
  }
};

const ModalConfigInforme = ({
  visible,
  onCerrar,
  onGenerar,
  datos,
  nombreAlimentador,
  tituloMedicion,
}) => {
  const [solicitadoPor, setSolicitadoPor] = useState("");
  const [intervaloSeleccionado, setIntervaloSeleccionado] = useState(null);

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
  useMemo(() => {
    if (
      intervalosHabilitados.length > 0 &&
      (!intervaloSeleccionado || !intervalosHabilitados.includes(intervaloSeleccionado))
    ) {
      setIntervaloSeleccionado(intervalosHabilitados[0]);
    }
  }, [intervalosHabilitados, intervaloSeleccionado]);

  // Filtrar datos según el intervalo seleccionado
  const datosFiltrados = useMemo(() => {
    if (!datos || datos.length === 0 || !intervaloSeleccionado) return [];

    const intervaloMs = intervaloSeleccionado * 60 * 1000;
    let ultimoTimestamp = 0;

    return datos.filter((punto) => {
      const timestamp = new Date(punto.x).getTime();
      if (ultimoTimestamp === 0 || timestamp - ultimoTimestamp >= intervaloMs) {
        ultimoTimestamp = timestamp;
        return true;
      }
      return false;
    });
  }, [datos, intervaloSeleccionado]);

  const handleGenerar = () => {
    onGenerar({
      solicitadoPor: solicitadoPor.trim() || "No especificado",
      intervalo: intervaloSeleccionado,
      datosFiltrados,
      fechaInicio,
      fechaFin,
    });
    onCerrar();
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
              {INTERVALOS_DISPONIBLES.map((intervalo) => {
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
            disabled={datosFiltrados.length === 0}
          >
            Generar Informe
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ModalConfigInforme;
