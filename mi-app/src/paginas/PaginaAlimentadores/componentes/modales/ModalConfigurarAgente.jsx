// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx
// Modal para configurar el agente y gestionar registradores

import React, { useState, useEffect, useCallback } from "react";
import {
  obtenerEstadoAgente,
  solicitarVinculacionAgente,
  desvincularAgente,
  rotarClaveAgente,
  obtenerRegistradores,
  crearRegistrador,
  actualizarRegistrador,
  eliminarRegistrador,
  toggleActivoRegistrador,
  testConexionRegistrador,
} from "../../../../servicios/apiService";
import "./ModalConfigurarAgente.css";

/**
 * Modal para configurar el agente y gestionar registradores.
 */
const ModalConfigurarAgente = ({
  abierto,
  workspaceId,
  onCerrar,
}) => {
  // Estado del agente
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [estado, setEstado] = useState(null);
  const [codigoGenerado, setCodigoGenerado] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);
  const [rotandoClave, setRotandoClave] = useState(false);
  const [nuevaClave, setNuevaClave] = useState(null);
  const [mostrarOpcionesAgente, setMostrarOpcionesAgente] = useState(false);

  // Estado de registradores
  const [registradores, setRegistradores] = useState([]);
  const [cargandoRegistradores, setCargandoRegistradores] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [registradorEditando, setRegistradorEditando] = useState(null);

  // Estado del formulario
  const [formulario, setFormulario] = useState({
    nombre: "",
    ubicacion: "",
    tipo: "",
    ip: "",
    puerto: "",
    indiceInicial: "",
    cantidadRegistros: "",
    intervaloSegundos: "60",
  });
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);

  // Estado de test de conexión
  const [testeando, setTesteando] = useState(false);
  const [resultadoTest, setResultadoTest] = useState(null);

  // Modal de éxito al crear registrador
  const [modalExito, setModalExito] = useState(null);

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

  // Cargar registradores
  const cargarRegistradores = useCallback(async () => {
    if (!workspaceId || !estado?.vinculado) return;

    try {
      setCargandoRegistradores(true);
      const data = await obtenerRegistradores(workspaceId);
      setRegistradores(data.registradores || []);
    } catch (err) {
      console.error("Error cargando registradores:", err);
    } finally {
      setCargandoRegistradores(false);
    }
  }, [workspaceId, estado?.vinculado]);

  useEffect(() => {
    if (abierto) {
      cargarEstado();
      setNuevaClave(null);
      setMostrarOpcionesAgente(false);
      setMostrarFormulario(false);
      setRegistradorEditando(null);
      setResultadoTest(null);
    }
  }, [abierto, cargarEstado]);

  useEffect(() => {
    if (estado?.vinculado) {
      cargarRegistradores();
    }
  }, [estado?.vinculado, cargarRegistradores]);

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
      setMostrarOpcionesAgente(false);
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

  // Abrir formulario para agregar
  const handleAgregarRegistrador = () => {
    setRegistradorEditando(null);
    setFormulario({
      nombre: "",
      ubicacion: "",
      tipo: "",
      ip: "",
      puerto: "",
      indiceInicial: "",
      cantidadRegistros: "",
      intervaloSegundos: "60",
    });
    setResultadoTest(null);
    setErrorFormulario(null);
    setMostrarFormulario(true);
  };

  // Abrir formulario para editar
  const handleEditarRegistrador = (reg) => {
    setRegistradorEditando(reg);
    setFormulario({
      nombre: reg.nombre || "",
      ubicacion: reg.ubicacion || "",
      tipo: reg.tipo || "",
      ip: reg.ip || "",
      puerto: String(reg.puerto || 502),
      indiceInicial: String(reg.indice_inicial || ""),
      cantidadRegistros: String(reg.cantidad_registros || ""),
      intervaloSegundos: String(reg.intervalo_segundos || 60),
    });
    setResultadoTest(null);
    setErrorFormulario(null);
    setMostrarFormulario(true);
  };

  // Cerrar formulario
  const handleCerrarFormulario = () => {
    setMostrarFormulario(false);
    setRegistradorEditando(null);
    setResultadoTest(null);
    setErrorFormulario(null);
  };

  // Cambio en formulario
  const handleCambioFormulario = (campo, valor) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
    setErrorFormulario(null);
  };

  // Test de conexión
  const handleTestConexion = async () => {
    const { ip, puerto, indiceInicial, cantidadRegistros } = formulario;

    if (!ip || !puerto || !indiceInicial || !cantidadRegistros) {
      setErrorFormulario("Completa IP, puerto, índice y cantidad de registros para probar");
      return;
    }

    try {
      setTesteando(true);
      setResultadoTest(null);
      setErrorFormulario(null);

      const resultado = await testConexionRegistrador(
        ip,
        parseInt(puerto),
        parseInt(indiceInicial),
        parseInt(cantidadRegistros)
      );

      setResultadoTest(resultado);
    } catch (err) {
      setResultadoTest({ exito: false, mensaje: err.message });
    } finally {
      setTesteando(false);
    }
  };

  // Guardar registrador
  const handleGuardarRegistrador = async () => {
    const { nombre, ip, puerto, indiceInicial, cantidadRegistros, intervaloSegundos, ubicacion, tipo } = formulario;

    if (!nombre || !ip || !puerto || !indiceInicial || !cantidadRegistros) {
      setErrorFormulario("Nombre, IP, puerto, índice inicial y cantidad de registros son obligatorios");
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario(null);

      if (registradorEditando) {
        // Actualizar
        await actualizarRegistrador(registradorEditando.id, {
          workspaceId,
          nombre,
          tipo,
          ubicacion,
          ip,
          puerto: parseInt(puerto),
          intervaloSegundos: parseInt(intervaloSegundos),
        });
      } else {
        // Crear
        const resultado = await crearRegistrador({
          workspaceId,
          nombre,
          tipo,
          ubicacion,
          ip,
          puerto: parseInt(puerto),
          indiceInicial: parseInt(indiceInicial),
          cantidadRegistros: parseInt(cantidadRegistros),
          intervaloSegundos: parseInt(intervaloSegundos),
        });

        // Mostrar modal de éxito
        if (resultado.tablaCreada) {
          setModalExito({
            titulo: "Registrador creado",
            tabla: resultado.tablaCreada,
            columnas: resultado.columnas,
          });
        }
      }

      await cargarRegistradores();
      handleCerrarFormulario();
    } catch (err) {
      console.error("Error guardando registrador:", err);
      setErrorFormulario(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar registrador
  const handleEliminarRegistrador = async (reg) => {
    if (!confirm(`¿Eliminar el registrador "${reg.nombre}"? También se eliminará su tabla de lecturas.`)) {
      return;
    }

    try {
      await eliminarRegistrador(reg.id, workspaceId);
      await cargarRegistradores();
    } catch (err) {
      console.error("Error eliminando registrador:", err);
      alert(err.message);
    }
  };

  // Toggle activo
  const handleToggleActivo = async (reg) => {
    try {
      await toggleActivoRegistrador(reg.id, workspaceId, !reg.activo);
      await cargarRegistradores();
    } catch (err) {
      console.error("Error cambiando estado:", err);
      alert(err.message);
    }
  };

  if (!abierto) return null;

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Cerrar modal de éxito
  const handleCerrarModalExito = () => {
    setModalExito(null);
  };

  return (
    <div className="config-agente-fondo-oscuro">
      {/* Modal de éxito al crear registrador */}
      {modalExito && (
        <div className="config-agente-modal-exito-overlay">
          <div className="config-agente-modal-exito">
            <div className="config-agente-modal-exito-icono">✓</div>
            <h3>{modalExito.titulo}</h3>
            <div className="config-agente-modal-exito-info">
              <p><strong>Tabla de lecturas:</strong></p>
              <code>{modalExito.tabla}</code>
              <p><strong>Columnas (índices):</strong></p>
              <div className="config-agente-modal-exito-columnas">
                {modalExito.columnas.join(", ")}
              </div>
            </div>
            <button
              className="config-agente-modal-exito-btn"
              onClick={handleCerrarModalExito}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      <div className="config-agente-contenedor">
        {/* Header con título y botón cerrar */}
        <div className="config-agente-header">
          <h2>{mostrarFormulario ? (registradorEditando ? "Editar Registrador" : "Nuevo Registrador") : "Configurar Agente"}</h2>
          <button className="config-agente-cerrar-x" onClick={mostrarFormulario ? handleCerrarFormulario : onCerrar} title="Cerrar">
            ×
          </button>
        </div>

        {cargando ? (
          <div className="config-agente-cargando">
            <span className="config-agente-spinner"></span>
            Cargando...
          </div>
        ) : error ? (
          <div className="config-agente-error">
            {error}
            <button onClick={cargarEstado} className="config-agente-reintentar">
              Reintentar
            </button>
          </div>
        ) : mostrarFormulario ? (
          /* ========== FORMULARIO DE REGISTRADOR ========== */
          <div className="config-agente-formulario">
            <div className="config-agente-form-grid">
              <div className="config-agente-form-grupo">
                <label>Nombre del registrador *</label>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => handleCambioFormulario("nombre", e.target.value)}
                  placeholder="Ej: TERNA 1"
                  disabled={guardando}
                />
              </div>

              <div className="config-agente-form-grupo">
                <label>Ubicación</label>
                <input
                  type="text"
                  value={formulario.ubicacion}
                  onChange={(e) => handleCambioFormulario("ubicacion", e.target.value)}
                  placeholder="Ej: Panel Terna 1 - Puesto"
                  disabled={guardando}
                />
              </div>

              <div className="config-agente-form-grupo">
                <label>Tipo</label>
                <input
                  type="text"
                  value={formulario.tipo}
                  onChange={(e) => handleCambioFormulario("tipo", e.target.value)}
                  placeholder="Ej: Relé - Analizador"
                  disabled={guardando}
                />
              </div>

              <div className="config-agente-form-grupo">
                <label>IP *</label>
                <input
                  type="text"
                  value={formulario.ip}
                  onChange={(e) => handleCambioFormulario("ip", e.target.value)}
                  placeholder="Ej: 192.168.0.1"
                  disabled={guardando}
                />
              </div>

              <div className="config-agente-form-grupo config-agente-form-grupo--corto">
                <label>Puerto *</label>
                <input
                  type="number"
                  value={formulario.puerto}
                  onChange={(e) => handleCambioFormulario("puerto", e.target.value)}
                  placeholder="Ej: 502"
                  disabled={guardando}
                />
              </div>

              <div className="config-agente-form-grupo config-agente-form-grupo--corto">
                <label>Índice de Registro *</label>
                <input
                  type="number"
                  value={formulario.indiceInicial}
                  onChange={(e) => handleCambioFormulario("indiceInicial", e.target.value)}
                  placeholder="Ej: 137"
                  disabled={guardando || registradorEditando}
                />
              </div>

              <div className="config-agente-form-grupo config-agente-form-grupo--corto">
                <label>Cant. de Registros *</label>
                <input
                  type="number"
                  value={formulario.cantidadRegistros}
                  onChange={(e) => handleCambioFormulario("cantidadRegistros", e.target.value)}
                  placeholder="Ej: 10"
                  disabled={guardando || registradorEditando}
                />
              </div>

              <div className="config-agente-form-grupo config-agente-form-grupo--corto">
                <label>Intervalo (seg)</label>
                <input
                  type="number"
                  value={formulario.intervaloSegundos}
                  onChange={(e) => handleCambioFormulario("intervaloSegundos", e.target.value)}
                  placeholder="60"
                  disabled={guardando}
                />
              </div>
            </div>

            {registradorEditando && (
              <p className="config-agente-form-nota">
                * El índice inicial y cantidad de registros no se pueden modificar ya que están vinculados a la tabla de lecturas.
              </p>
            )}

            {errorFormulario && (
              <div className="config-agente-form-error">{errorFormulario}</div>
            )}

            {/* Botones de acción */}
            <div className="config-agente-form-acciones">
              <button
                className="config-agente-btn config-agente-btn--secundario"
                onClick={handleTestConexion}
                disabled={testeando || guardando}
              >
                {testeando ? "Probando..." : "Test Conexión"}
              </button>

              <button
                className="config-agente-btn config-agente-btn--primario"
                onClick={handleGuardarRegistrador}
                disabled={guardando || testeando}
              >
                {guardando ? "Guardando..." : (registradorEditando ? "Guardar Cambios" : "Crear Registrador")}
              </button>
            </div>

            {/* Resultado del test */}
            {resultadoTest && (
              <div className={`config-agente-test-resultado ${resultadoTest.exito ? "config-agente-test-resultado--exito" : "config-agente-test-resultado--error"}`}>
                <div className="config-agente-test-header">
                  <span className={`config-agente-test-icono ${resultadoTest.exito ? "config-agente-test-icono--exito" : "config-agente-test-icono--error"}`}>
                    {resultadoTest.exito ? "✓" : "✗"}
                  </span>
                  <span>{resultadoTest.mensaje}</span>
                </div>

                {resultadoTest.exito && resultadoTest.registros && resultadoTest.registros.length > 0 && (
                  <div className="config-agente-test-tabla-container">
                    <table className="config-agente-test-tabla">
                      <thead>
                        <tr>
                          <th>Índice</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadoTest.registros.map((reg) => (
                          <tr key={reg.indice}>
                            <td>{reg.indice}</td>
                            <td>{reg.valor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ========== VISTA PRINCIPAL ========== */
          <>
            {/* Barra de estado del agente - dos líneas */}
            <div className={`config-agente-barra ${estado?.conectado ? 'config-agente-barra--conectado' : estado?.vinculado ? 'config-agente-barra--desconectado' : 'config-agente-barra--sin-vincular'}`}>
              <div className="config-agente-barra-info">
                {/* Línea 1: Agente Vinculado */}
                <div className="config-agente-barra-linea">
                  <span className="config-agente-barra-label">Agente Vinculado:</span>
                  {estado?.vinculado ? (
                    <span className="config-agente-barra-valor">
                      {estado.agente?.nombre} <span className="config-agente-icono-vinculado">🔗</span>
                    </span>
                  ) : (
                    <span className="config-agente-barra-valor config-agente-barra-valor--ninguno">
                      Ninguno <span className="config-agente-icono-desvinculado">⛓️‍💥</span>
                    </span>
                  )}
                </div>

                {/* Línea 2: Estado del Agente */}
                <div className="config-agente-barra-linea">
                  <span className="config-agente-barra-label">Estado del Agente:</span>
                  {estado?.vinculado ? (
                    <span className={`config-agente-barra-valor ${estado?.conectado ? 'config-agente-barra-valor--conectado' : 'config-agente-barra-valor--desconectado'}`}>
                      {estado?.conectado ? 'Conectado' : 'Desconectado'}
                      <span className={`config-agente-indicador-estado ${estado?.conectado ? 'config-agente-indicador-estado--conectado' : 'config-agente-indicador-estado--desconectado'}`}>●</span>
                    </span>
                  ) : (
                    <span className="config-agente-barra-valor config-agente-barra-valor--ninguno">--</span>
                  )}
                </div>
              </div>

              {estado?.vinculado ? (
                <button
                  className="config-agente-barra-boton"
                  onClick={() => setMostrarOpcionesAgente(!mostrarOpcionesAgente)}
                >
                  {mostrarOpcionesAgente ? 'Ocultar' : 'Opciones'}
                </button>
              ) : (
                <button
                  className="config-agente-barra-boton config-agente-barra-boton--vincular"
                  onClick={handleGenerarCodigo}
                  disabled={generandoCodigo}
                >
                  {generandoCodigo ? 'Generando...' : 'Vincular'}
                </button>
              )}
            </div>

            {/* Panel de opciones del agente (expandible) */}
            {estado?.vinculado && mostrarOpcionesAgente && (
              <div className="config-agente-opciones">
                {nuevaClave && (
                  <div className="config-agente-nueva-clave">
                    <p>Nueva clave generada (guardar ahora):</p>
                    <div className="config-agente-codigo-box">
                      <code>{nuevaClave}</code>
                      <button
                        onClick={() => copiarAlPortapapeles(nuevaClave)}
                        className="config-agente-copiar"
                      >
                        Copiar
                      </button>
                    </div>
                    <p className="config-agente-nota">La clave anterior funciona 24h más.</p>
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
            )}

            {/* Panel de vinculación (cuando no hay agente) */}
            {!estado?.vinculado && codigoGenerado && (
              <div className="config-agente-vinculacion-panel">
                <p className="config-agente-instrucciones">
                  Ingresa este código en la consola del agente:
                </p>
                <div className="config-agente-codigo-container">
                  <div className="config-agente-codigo-box config-agente-codigo-grande">
                    <code>{codigoGenerado}</code>
                    <button
                      onClick={() => copiarAlPortapapeles(codigoGenerado)}
                      className="config-agente-copiar"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="config-agente-expira">
                    Expira en {formatearTiempo(tiempoRestante)}
                  </div>
                </div>
              </div>
            )}

            {/* Sección principal: Registradores */}
            <div className="config-agente-seccion">
              <div className="config-agente-seccion-header">
                <h3>Registradores</h3>
                <button
                  className="config-agente-agregar-btn"
                  onClick={handleAgregarRegistrador}
                  disabled={!estado?.vinculado}
                  title={!estado?.vinculado ? "Vincula un agente primero" : "Agregar registrador"}
                >
                  + Agregar
                </button>
              </div>

              <div className="config-agente-registradores-lista">
                {!estado?.vinculado ? (
                  <div className="config-agente-registradores-vacio">
                    <span className="config-agente-registradores-icono">📡</span>
                    <p>Vincula un agente para gestionar registradores</p>
                  </div>
                ) : cargandoRegistradores ? (
                  <div className="config-agente-registradores-vacio">
                    <span className="config-agente-spinner"></span>
                    <p>Cargando registradores...</p>
                  </div>
                ) : registradores.length === 0 ? (
                  <div className="config-agente-registradores-vacio">
                    <span className="config-agente-registradores-icono">📡</span>
                    <p>No hay registradores configurados</p>
                    <span className="config-agente-registradores-hint">
                      Los registradores son dispositivos Modbus que leen datos de los alimentadores
                    </span>
                  </div>
                ) : (
                  <div className="config-agente-registradores-items">
                    {registradores.map((reg) => (
                      <div key={reg.id} className="config-agente-registrador-item">
                        <div className="config-agente-registrador-info">
                          <div className="config-agente-registrador-nombre">
                            <span className={`config-agente-registrador-estado ${reg.activo ? 'config-agente-registrador-estado--activo' : ''}`}></span>
                            <strong>{reg.nombre}</strong>
                            {reg.tipo && <span className="config-agente-registrador-tipo">{reg.tipo}</span>}
                          </div>
                          <div className="config-agente-registrador-detalle">
                            {reg.ip}:{reg.puerto} | Reg: {reg.indice_inicial}-{reg.indice_inicial + reg.cantidad_registros - 1} | {reg.intervalo_segundos}s
                          </div>
                          {reg.ubicacion && (
                            <div className="config-agente-registrador-ubicacion">{reg.ubicacion}</div>
                          )}
                        </div>
                        <div className="config-agente-registrador-acciones">
                          <button
                            className={`config-agente-registrador-btn ${reg.activo ? 'config-agente-registrador-btn--detener' : 'config-agente-registrador-btn--iniciar'}`}
                            onClick={() => handleToggleActivo(reg)}
                            title={reg.activo ? "Detener medición" : "Iniciar medición"}
                          >
                            {reg.activo ? "⏹" : "▶"}
                          </button>
                          <button
                            className="config-agente-registrador-btn config-agente-registrador-btn--editar"
                            onClick={() => handleEditarRegistrador(reg)}
                            title="Editar"
                          >
                            ✎
                          </button>
                          <button
                            className="config-agente-registrador-btn config-agente-registrador-btn--eliminar"
                            onClick={() => handleEliminarRegistrador(reg)}
                            title="Eliminar"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalConfigurarAgente;
