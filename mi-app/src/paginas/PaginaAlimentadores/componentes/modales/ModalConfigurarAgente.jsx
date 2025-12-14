// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx
// Modal para configurar y vincular el agente al workspace

import React, { useState, useEffect, useCallback } from "react";
import {
  obtenerEstadoAgente,
  solicitarVinculacionAgente,
  desvincularAgente,
  rotarClaveAgente,
} from "../../../../servicios/apiService";
import "./ModalConfigurarAgente.css";

/**
 * Modal para configurar el agente.
 * Muestra estado de vinculación y permite generar código de vinculación.
 */
const ModalConfigurarAgente = ({
  abierto,
  workspaceId,
  onCerrar,
}) => {
  // Estado
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estado, setEstado] = useState(null);
  const [codigoGenerado, setCodigoGenerado] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);
  const [rotandoClave, setRotandoClave] = useState(false);
  const [nuevaClave, setNuevaClave] = useState(null);

  // Cargar estado al abrir
  const cargarEstado = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setCargando(true);
      setError(null);
      const data = await obtenerEstadoAgente(workspaceId);
      setEstado(data);

      // Si hay código pendiente, mostrar
      if (data.codigoPendiente) {
        setCodigoGenerado(data.codigoPendiente.codigo);
        const expiraEn = new Date(data.codigoPendiente.expiraAt).getTime();
        const ahora = Date.now();
        const segundosRestantes = Math.max(0, Math.floor((expiraEn - ahora) / 1000));
        setTiempoRestante(segundosRestantes);
      }
    } catch (err) {
      console.error("Error cargando estado agente:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (abierto) {
      cargarEstado();
      setNuevaClave(null);
    }
  }, [abierto, cargarEstado]);

  // Timer para el código
  useEffect(() => {
    if (tiempoRestante <= 0) return;

    const timer = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          setCodigoGenerado(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tiempoRestante]);

  // Generar código de vinculación
  const handleGenerarCodigo = async () => {
    try {
      setGenerandoCodigo(true);
      setError(null);
      const data = await solicitarVinculacionAgente(workspaceId);
      setCodigoGenerado(data.codigo);

      const expiraEn = new Date(data.expiraAt).getTime();
      const ahora = Date.now();
      setTiempoRestante(Math.floor((expiraEn - ahora) / 1000));
    } catch (err) {
      console.error("Error generando código:", err);
      setError(err.message);
    } finally {
      setGenerandoCodigo(false);
    }
  };

  // Desvincular agente
  const handleDesvincular = async () => {
    if (!confirm("¿Estás seguro de desvincular el agente? El workspace dejará de recibir datos.")) {
      return;
    }

    try {
      setDesvinculando(true);
      setError(null);
      await desvincularAgente(workspaceId);
      await cargarEstado();
    } catch (err) {
      console.error("Error desvinculando:", err);
      setError(err.message);
    } finally {
      setDesvinculando(false);
    }
  };

  // Rotar clave
  const handleRotarClave = async () => {
    if (!confirm("¿Estás seguro de rotar la clave? El agente deberá actualizarse con la nueva clave.")) {
      return;
    }

    try {
      setRotandoClave(true);
      setError(null);
      const data = await rotarClaveAgente(workspaceId);
      setNuevaClave(data.nuevaClave);
    } catch (err) {
      console.error("Error rotando clave:", err);
      setError(err.message);
    } finally {
      setRotandoClave(false);
    }
  };

  // Copiar al portapapeles
  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto);
  };

  if (!abierto) return null;

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="config-agente-fondo-oscuro" onClick={onCerrar}>
      <div className="config-agente-contenedor" onClick={(e) => e.stopPropagation()}>
        <h2>Configurar Agente</h2>

        <div className="config-agente-contenido">
          {cargando ? (
            <div className="config-agente-cargando">
              <span className="config-agente-spinner"></span>
              Cargando estado...
            </div>
          ) : error ? (
            <div className="config-agente-error">
              {error}
              <button onClick={cargarEstado} className="config-agente-reintentar">
                Reintentar
              </button>
            </div>
          ) : estado?.vinculado ? (
            // Estado: VINCULADO
            <div className="config-agente-vinculado">
              <div className="config-agente-estado">
                <span className="config-agente-indicador config-agente-indicador--activo"></span>
                Agente vinculado
              </div>

              <div className="config-agente-info">
                <div className="config-agente-campo">
                  <span className="config-agente-label">Nombre:</span>
                  <span className="config-agente-valor">{estado.agente?.nombre}</span>
                </div>
                <div className="config-agente-campo">
                  <span className="config-agente-label">Estado:</span>
                  <span className={`config-agente-valor ${estado.agente?.activo ? "config-agente-activo" : "config-agente-inactivo"}`}>
                    {estado.agente?.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              {/* Nueva clave generada */}
              {nuevaClave && (
                <div className="config-agente-nueva-clave">
                  <p>Nueva clave generada (guardar ahora, solo se muestra una vez):</p>
                  <div className="config-agente-codigo-box">
                    <code>{nuevaClave}</code>
                    <button
                      onClick={() => copiarAlPortapapeles(nuevaClave)}
                      className="config-agente-copiar"
                      title="Copiar"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="config-agente-nota">La clave anterior seguirá funcionando por 24 horas.</p>
                </div>
              )}

              <div className="config-agente-acciones-vinculado">
                <button
                  onClick={handleRotarClave}
                  disabled={rotandoClave}
                  className="config-agente-boton config-agente-rotar"
                >
                  {rotandoClave ? "Rotando..." : "Rotar clave"}
                </button>
                <button
                  onClick={handleDesvincular}
                  disabled={desvinculando}
                  className="config-agente-boton config-agente-desvincular"
                >
                  {desvinculando ? "Desvinculando..." : "Desvincular"}
                </button>
              </div>
            </div>
          ) : (
            // Estado: NO VINCULADO
            <div className="config-agente-no-vinculado">
              <div className="config-agente-estado">
                <span className="config-agente-indicador"></span>
                Sin agente vinculado
              </div>

              <p className="config-agente-instrucciones">
                Para vincular este workspace con un agente, genera un código y
                ingrésalo en la consola del agente.
              </p>

              {codigoGenerado ? (
                <div className="config-agente-codigo-container">
                  <div className="config-agente-codigo-box config-agente-codigo-grande">
                    <code>{codigoGenerado}</code>
                    <button
                      onClick={() => copiarAlPortapapeles(codigoGenerado)}
                      className="config-agente-copiar"
                      title="Copiar"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="config-agente-expira">
                    Expira en {formatearTiempo(tiempoRestante)}
                  </div>
                  <button
                    onClick={handleGenerarCodigo}
                    disabled={generandoCodigo}
                    className="config-agente-boton config-agente-regenerar"
                  >
                    {generandoCodigo ? "Generando..." : "Generar nuevo código"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerarCodigo}
                  disabled={generandoCodigo}
                  className="config-agente-boton config-agente-generar"
                >
                  {generandoCodigo ? "Generando..." : "Generar código de vinculación"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="config-agente-acciones">
          <button
            type="button"
            className="config-agente-boton config-agente-cerrar"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfigurarAgente;
