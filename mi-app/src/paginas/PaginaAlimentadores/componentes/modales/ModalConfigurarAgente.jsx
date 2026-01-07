// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx
// Ventana flotante para configurar agentes con pestañas dinámicas según rol
// Soporta: arrastrar, minimizar, maximizar, redimensionar, múltiples instancias

import React, { useState, useEffect, useCallback } from "react";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import { useVentanaFlotante } from "../../hooks/useVentanaFlotante";
import { useAgentesConfig } from "../../hooks/useAgentesConfig";
import { useRegistradoresConfig } from "../../hooks/useRegistradoresConfig";
import ConfiguracionRele from "./ConfiguracionRele";
import "./ModalConfigurarAgente.css";

/**
 * Modal para configurar agentes con pestañas según rol del usuario.
 *
 * Pestañas:
 * - "Agentes Vinculados": Todos los roles con acceso al workspace
 * - "Vincular Agente": Solo creador del workspace o superadmin
 * - "Panel SuperAdmin": Solo Superadmin (CRUD de agentes y registradores)
 *
 * NOTA: Un admin invitado puede ver los agentes vinculados pero NO puede
 * vincular ni desvincular agentes. Solo el creador del workspace o superadmin
 * tienen esa capacidad.
 */
const ModalConfigurarAgente = ({
  abierto,
  workspaceId,
  onCerrar,
  // Props para comportamiento de ventana flotante
  minimizada = false,
  maximizada = false,
  posicion = { x: 100, y: 50 },
  zIndex = 1000,
  onMinimizar,
  onMaximizar,
  onEnfocar,
  onMover,
}) => {
  const { rolGlobal, configuracionSeleccionada } = usarContextoConfiguracion();

  // Determinar permisos según rol
  const esSuperadmin = rolGlobal === 'superadmin';
  const rolEnWorkspace = configuracionSeleccionada?.rol;
  const esAdmin = esSuperadmin || rolEnWorkspace === 'admin';
  const esCreadorWorkspace = configuracionSeleccionada?.esCreador === true;
  const puedeVincularDesvincular = esSuperadmin || esCreadorWorkspace;
  const puedeVincular = puedeVincularDesvincular;

  // Pestañas disponibles según rol
  const pestanasDisponibles = [
    { id: 'vinculados', label: 'Agentes Vinculados', visible: true },
    { id: 'vincular', label: 'Vincular Agente', visible: puedeVincular },
    { id: 'admin', label: 'Panel SuperAdmin', visible: esSuperadmin },
  ].filter(p => p.visible);

  // Estado local de UI
  const [pestanaActiva, setPestanaActiva] = useState('vinculados');

  // Hook de ventana flotante (drag/resize)
  const {
    ventanaRef,
    headerRef,
    dimensiones,
    arrastrando,
    redimensionando,
    handleMouseDownDrag,
    handleMouseDownResize,
  } = useVentanaFlotante({
    maximizada,
    onMover,
    onEnfocar,
  });

  // Hook de agentes
  const {
    cargando,
    error,
    agentesVinculados,
    agentesDisponibles,
    todosAgentes,
    mostrarFormCrear,
    nuevoAgente,
    creando,
    claveGenerada,
    agenteExpandido,
    setMostrarFormCrear,
    setNuevoAgente,
    setError,
    cargarDatos,
    vincularAgente,
    desvincularAgente,
    crearNuevoAgente,
    eliminarAgenteById,
    rotarClave,
    toggleExpandirAgente,
    resetearEstado: resetearEstadoAgentes,
    limpiarClaveGenerada,
  } = useAgentesConfig({
    workspaceId,
    puedeVincular,
    esSuperadmin,
  });

  // Hook de registradores
  const {
    registradoresAgente,
    mostrarFormRegistrador,
    registradorEditando,
    nuevoRegistrador,
    guardandoRegistrador,
    registradorProcesando,
    testEnCurso,
    resultadoTest,
    setMostrarFormRegistrador,
    setNuevoRegistrador,
    resetFormRegistrador,
    cargarRegistradores,
    guardarRegistrador,
    editarRegistrador,
    eliminarRegistrador,
    toggleRegistrador,
    toggleTodosRegistradores,
    testRegistrador,
    limpiarResultadoTest,
    resetearEstado: resetearEstadoRegistradores,
  } = useRegistradoresConfig();

  // Cargar datos al abrir
  useEffect(() => {
    if (abierto && workspaceId) {
      cargarDatos();
    }
  }, [abierto, workspaceId, cargarDatos]);

  // Resetear estado al cerrar
  useEffect(() => {
    if (!abierto) {
      setPestanaActiva('vinculados');
      resetearEstadoAgentes();
      resetearEstadoRegistradores();
    }
  }, [abierto, resetearEstadoAgentes, resetearEstadoRegistradores]);

  // Handlers de agentes
  const handleVincular = async (agenteId) => {
    const exito = await vincularAgente(agenteId);
    if (exito) setPestanaActiva('vinculados');
  };

  const handleDesvincular = async (agenteId) => {
    if (!confirm('¿Desvincular este agente del workspace?')) return;
    await desvincularAgente(agenteId);
  };

  const handleCrearAgente = async (e) => {
    e.preventDefault();
    await crearNuevoAgente(nuevoAgente.nombre, nuevoAgente.descripcion);
  };

  const handleEliminarAgente = async (agenteId, nombre) => {
    if (!confirm(`¿Eliminar el agente "${nombre}"? Esta acción no se puede deshacer.`)) return;
    await eliminarAgenteById(agenteId);
  };

  const handleRotarClave = async (agenteId) => {
    if (!confirm('¿Rotar la clave del agente? Deberás actualizar el agente con la nueva clave.')) return;
    await rotarClave(agenteId);
  };

  // Toggle registradores de un agente
  const toggleRegistradores = async (agenteId) => {
    if (agenteExpandido === agenteId) {
      toggleExpandirAgente(null);
      setMostrarFormRegistrador(null);
      return;
    }

    if (!registradoresAgente[agenteId]) {
      await cargarRegistradores(agenteId);
    }
    toggleExpandirAgente(agenteId);
  };

  // Handlers de registradores - wrappers para validación local
  const handleGuardarRegistrador = async (e, agenteId) => {
    e.preventDefault();
    if (!nuevoRegistrador.nombre.trim()) return;

    const esRele = nuevoRegistrador.tipoDispositivo === 'rele';

    if (esRele) {
      const configRele = nuevoRegistrador.configuracionRele;
      if (!configRele || !configRele.plantillaId) {
        setError('Debes seleccionar una plantilla de configuración');
        return;
      }
      if (!configRele.conexion?.ip) {
        setError('Debes configurar la IP del relé');
        return;
      }
    } else {
      if (!nuevoRegistrador.ip.trim() || !nuevoRegistrador.puerto || !nuevoRegistrador.indiceInicial || !nuevoRegistrador.cantidadRegistros) return;
    }

    try {
      await guardarRegistrador(agenteId, nuevoRegistrador, registradorEditando?.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditarRegistrador = (reg) => {
    editarRegistrador(reg);
  };

  const handleEliminarRegistrador = async (agenteId, registradorId, nombre) => {
    if (!confirm(`¿Eliminar el registrador "${nombre}"?`)) return;
    try {
      await eliminarRegistrador(agenteId, registradorId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleRegistrador = async (agenteId, registradorId) => {
    try {
      await toggleRegistrador(agenteId, registradorId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleTodosRegistradores = async (agenteId, iniciar) => {
    try {
      await toggleTodosRegistradores(agenteId, iniciar);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTestRegistrador = async (agenteId) => {
    if (!nuevoRegistrador.ip.trim() || !nuevoRegistrador.puerto || !nuevoRegistrador.indiceInicial || !nuevoRegistrador.cantidadRegistros) {
      setError('Completa IP, Puerto, Índice Inicial y Cantidad de Registros para hacer el test');
      return;
    }

    try {
      await testRegistrador(agenteId, nuevoRegistrador);
    } catch (err) {
      setError(err.message);
    }
  };

  // Copiar al portapapeles
  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto);
  };

  // Handlers de ventana
  const handleMinimizar = useCallback(() => {
    if (onMinimizar) onMinimizar();
  }, [onMinimizar]);

  const handleMaximizar = useCallback(() => {
    if (onMaximizar) onMaximizar();
  }, [onMaximizar]);

  const handleEnfocar = useCallback(() => {
    if (onEnfocar) onEnfocar();
  }, [onEnfocar]);

  if (!abierto) return null;
  if (minimizada) return null;

  // Renderizar indicador de estado de conexión
  const renderEstadoConexion = (agente) => (
    <span className={`config-agente-estado ${agente.conectado ? 'config-agente-estado--conectado' : 'config-agente-estado--desconectado'}`}>
      <span className="config-agente-estado-punto"></span>
      {agente.conectado ? 'Conectado' : 'Desconectado'}
    </span>
  );

  // Renderizar lista de registradores (con acciones opcionales para superadmin)
  const renderRegistradores = (agenteId, conAcciones = false) => {
    const regs = registradoresAgente[agenteId] || [];
    const hayActivos = regs.some(r => r.activo);
    const hayInactivos = regs.some(r => !r.activo);

    return (
      <div className="config-agente-regs-contenedor">
        {/* Botones de acción (solo en panel superadmin) */}
        {conAcciones && (
          <div className="config-agente-regs-toolbar">
            <button
              className="config-agente-btn config-agente-btn--agregar-reg"
              onClick={() => {
                resetFormRegistrador();
                setMostrarFormRegistrador(agenteId);
              }}
            >
              + Agregar Registrador
            </button>
            {regs.length > 0 && (
              <div className="config-agente-regs-toolbar-acciones">
                {hayInactivos && (
                  <button
                    className="config-agente-btn config-agente-btn--iniciar-todos"
                    onClick={() => handleToggleTodosRegistradores(agenteId, true)}
                    disabled={registradorProcesando === 'todos'}
                    title="Iniciar todos los registradores pausados"
                  >
                    {registradorProcesando === 'todos' ? (
                      <span className="config-agente-spinner-mini"></span>
                    ) : '▶'} Iniciar todos
                  </button>
                )}
                {hayActivos && (
                  <button
                    className="config-agente-btn config-agente-btn--parar-todos"
                    onClick={() => handleToggleTodosRegistradores(agenteId, false)}
                    disabled={registradorProcesando === 'todos'}
                    title="Pausar todos los registradores activos"
                  >
                    {registradorProcesando === 'todos' ? (
                      <span className="config-agente-spinner-mini"></span>
                    ) : '⏸'} Pausar todos
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Formulario crear/editar registrador */}
        {conAcciones && mostrarFormRegistrador === agenteId && (
          <form className="config-agente-reg-form" onSubmit={(e) => handleGuardarRegistrador(e, agenteId)}>
            <h5>{registradorEditando ? 'Editar Registrador' : 'Nuevo Registrador'}</h5>

            {/* Selector de tipo de dispositivo */}
            <div className="config-agente-tipo-row">
              <label className="config-agente-tipo-label">Tipo de Dispositivo:</label>
              <select
                value={nuevoRegistrador.tipoDispositivo}
                onChange={e => setNuevoRegistrador(prev => ({
                  ...prev,
                  tipoDispositivo: e.target.value,
                  configuracionRele: e.target.value === 'analizador' ? null : prev.configuracionRele,
                }))}
                disabled={guardandoRegistrador}
                className="config-agente-select-tipo"
              >
                <option value="analizador">📊 Analizador de Redes</option>
                <option value="rele">🛡️ Relé de Protección</option>
              </select>
            </div>

            {/* Formulario para Analizador de Redes */}
            {nuevoRegistrador.tipoDispositivo === 'analizador' && (
              <div className="config-agente-analizador">
                {/* Nombre del registrador */}
                <div className="config-agente-analizador-nombre">
                  <label>Nombre del Registrador</label>
                  <input
                    type="text"
                    value={nuevoRegistrador.nombre}
                    onChange={e => setNuevoRegistrador(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Analizador Trafo 1"
                    disabled={guardandoRegistrador}
                  />
                </div>

                {/* Secciones en dos columnas */}
                <div className="config-agente-analizador-grid">
                  {/* Sección Conexión */}
                  <div className="config-agente-analizador-seccion">
                    <h6>📡 Conexión Modbus TCP</h6>
                    <div className="config-agente-analizador-campos">
                      <div className="config-agente-campo-inline">
                        <label>IP</label>
                        <input
                          type="text"
                          value={nuevoRegistrador.ip}
                          onChange={e => setNuevoRegistrador(prev => ({ ...prev, ip: e.target.value }))}
                          placeholder="192.168.1.100"
                          disabled={guardandoRegistrador}
                        />
                      </div>
                      <div className="config-agente-campo-inline">
                        <label>Puerto</label>
                        <input
                          type="number"
                          value={nuevoRegistrador.puerto}
                          onChange={e => setNuevoRegistrador(prev => ({ ...prev, puerto: e.target.value }))}
                          placeholder="502"
                          disabled={guardandoRegistrador}
                        />
                      </div>
                      <div className="config-agente-campo-inline">
                        <label>Unit ID</label>
                        <input
                          type="number"
                          value={nuevoRegistrador.unitId}
                          onChange={e => setNuevoRegistrador(prev => ({ ...prev, unitId: e.target.value }))}
                          placeholder="1"
                          disabled={guardandoRegistrador}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección Registros */}
                  <div className="config-agente-analizador-seccion">
                    <h6>📋 Registros Modbus</h6>
                    <div className="config-agente-analizador-campos">
                      <div className="config-agente-campo-inline">
                        <label>Índice Inicial</label>
                        <input
                          type="number"
                          value={nuevoRegistrador.indiceInicial}
                          onChange={e => setNuevoRegistrador(prev => ({ ...prev, indiceInicial: e.target.value }))}
                          placeholder="0"
                          disabled={guardandoRegistrador}
                        />
                      </div>
                      <div className="config-agente-campo-inline">
                        <label>Cantidad</label>
                        <input
                          type="number"
                          value={nuevoRegistrador.cantidadRegistros}
                          onChange={e => setNuevoRegistrador(prev => ({ ...prev, cantidadRegistros: e.target.value }))}
                          placeholder="20"
                          disabled={guardandoRegistrador}
                        />
                      </div>
                      <div className="config-agente-campo-inline">
                        <label>Intervalo</label>
                        <div className="config-agente-input-con-sufijo">
                          <input
                            type="number"
                            value={nuevoRegistrador.intervaloSegundos}
                            onChange={e => setNuevoRegistrador(prev => ({ ...prev, intervaloSegundos: e.target.value }))}
                            placeholder="60"
                            disabled={guardandoRegistrador}
                          />
                          <span>seg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="config-agente-form-acciones">
                  <button
                    type="button"
                    className="config-agente-btn config-agente-btn--test"
                    onClick={() => handleTestRegistrador(agenteId)}
                    disabled={guardandoRegistrador || testEnCurso || !nuevoRegistrador.ip.trim() || !nuevoRegistrador.puerto || !nuevoRegistrador.indiceInicial || !nuevoRegistrador.cantidadRegistros}
                    title="Probar conexión antes de guardar"
                  >
                    {testEnCurso ? 'Probando...' : 'Test'}
                  </button>
                  <div className="config-agente-form-acciones-derecha">
                    <button
                      type="button"
                      className="config-agente-btn config-agente-btn--secundario"
                      onClick={() => {
                        setMostrarFormRegistrador(null);
                        resetFormRegistrador();
                      }}
                      disabled={guardandoRegistrador || testEnCurso}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="config-agente-btn config-agente-btn--primario"
                      disabled={guardandoRegistrador || testEnCurso || !nuevoRegistrador.nombre.trim() || !nuevoRegistrador.ip.trim() || !nuevoRegistrador.puerto || !nuevoRegistrador.indiceInicial || !nuevoRegistrador.cantidadRegistros}
                    >
                      {guardandoRegistrador ? 'Guardando...' : (registradorEditando ? 'Guardar' : 'Crear')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Formulario para Relé de Protección */}
            {nuevoRegistrador.tipoDispositivo === 'rele' && (
              <>
                {/* Nombre del registrador (compartido con analizadores) */}
                <div className="config-agente-rele-nombre">
                  <label>Nombre del Registrador</label>
                  <input
                    type="text"
                    value={nuevoRegistrador.nombre}
                    onChange={e => setNuevoRegistrador(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Relé REF615 Bahía 1"
                    disabled={guardandoRegistrador}
                  />
                </div>
                <ConfiguracionRele
                  configuracionInicial={nuevoRegistrador.configuracionRele}
                  onChange={(config) => setNuevoRegistrador(prev => ({
                    ...prev,
                    configuracionRele: config,
                  }))}
                  agenteId={agenteId}
                />
                <div className="config-agente-form-acciones">
                  <div className="config-agente-form-acciones-derecha">
                    <button
                      type="button"
                      className="config-agente-btn config-agente-btn--secundario"
                      onClick={() => {
                        setMostrarFormRegistrador(null);
                        resetFormRegistrador();
                      }}
                      disabled={guardandoRegistrador}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="config-agente-btn config-agente-btn--primario"
                      disabled={guardandoRegistrador || !nuevoRegistrador.nombre.trim() || !nuevoRegistrador.configuracionRele}
                    >
                      {guardandoRegistrador ? 'Guardando...' : (registradorEditando ? 'Guardar' : 'Crear')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>
        )}

        {/* Lista de registradores */}
        {regs.length === 0 ? (
          <div className="config-agente-regs-vacio">Sin registradores configurados</div>
        ) : (
          <div className="config-agente-regs-lista">
            {regs.map(reg => {
              const esRele = reg.tipo_dispositivo === 'rele';
              const configRele = reg.configuracion_rele;

              return (
                <div key={reg.id} className={`config-agente-reg-item ${conAcciones ? 'config-agente-reg-item--admin' : ''} ${esRele ? 'config-agente-reg-item--rele' : ''}`}>
                  <div className="config-agente-reg-info">
                    <span
                      className={`config-agente-reg-estado ${reg.activo ? 'config-agente-reg-estado--activo' : ''}`}
                      title={reg.activo ? 'Activo' : 'Inactivo'}
                    ></span>
                    <span className="config-agente-reg-tipo" title={esRele ? 'Relé de Protección' : 'Analizador de Redes'}>
                      {esRele ? '🛡️' : '📊'}
                    </span>
                    <span className="config-agente-reg-nombre">{reg.nombre}</span>
                    {esRele && configRele ? (
                      <span className="config-agente-reg-detalle">
                        {reg.ip}:{reg.puerto} | {configRele.modeloId} - {configRele.configuracionId} | {reg.intervalo_segundos}s
                      </span>
                    ) : (
                      <span className="config-agente-reg-detalle">
                        {reg.ip}:{reg.puerto} | Reg: {reg.indice_inicial}-{reg.indice_inicial + reg.cantidad_registros - 1} | {reg.intervalo_segundos}s
                      </span>
                    )}
                  </div>
                  {conAcciones && (
                  <div className="config-agente-reg-acciones">
                    <button
                      className={`config-agente-btn-icon ${reg.activo ? 'config-agente-btn-icon--success' : ''}`}
                      onClick={() => handleToggleRegistrador(agenteId, reg.id)}
                      title={reg.activo ? 'Desactivar' : 'Activar'}
                      disabled={registradorProcesando === reg.id}
                    >
                      {registradorProcesando === reg.id ? (
                        <span className="config-agente-spinner-mini"></span>
                      ) : (
                        reg.activo ? '⏸' : '▶'
                      )}
                    </button>
                    <button
                      className="config-agente-btn-icon"
                      onClick={() => handleEditarRegistrador({ ...reg, agente_id: agenteId })}
                      title="Editar"
                      disabled={registradorProcesando === reg.id}
                    >
                      ✏️
                    </button>
                    <button
                      className="config-agente-btn-icon config-agente-btn-icon--danger"
                      onClick={() => handleEliminarRegistrador(agenteId, reg.id, reg.nombre)}
                      title="Eliminar"
                      disabled={registradorProcesando === reg.id}
                    >
                      🗑
                    </button>
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Estilo dinámico de la ventana
  const estiloVentana = maximizada
    ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", zIndex }
    : {
        position: "fixed",
        top: posicion.y,
        left: posicion.x,
        width: dimensiones.width,
        height: dimensiones.height,
        zIndex,
      };

  return (
    <div
      ref={ventanaRef}
      className={`config-agente-ventana ${maximizada ? "config-agente-ventana--maximizada" : ""} ${arrastrando ? "config-agente-ventana--arrastrando" : ""} ${redimensionando ? "config-agente-ventana--redimensionando" : ""}`}
      style={estiloVentana}
      onMouseDown={handleEnfocar}
    >
      {/* Header arrastrable */}
      <header
        ref={headerRef}
        className="config-agente-header"
        onMouseDown={handleMouseDownDrag}
      >
        <div className="config-agente-titulo">
          <span className="config-agente-icono">⚙️</span>
          <h2>Configuración de Agentes</h2>
        </div>
        <div className="config-agente-controles-ventana">
          <button
            type="button"
            className="config-agente-btn-ventana config-agente-btn-ventana--minimizar"
            onClick={handleMinimizar}
            title="Minimizar"
          >
            <span>─</span>
          </button>
          <button
            type="button"
            className="config-agente-btn-ventana config-agente-btn-ventana--maximizar"
            onClick={handleMaximizar}
            title={maximizada ? "Restaurar" : "Maximizar"}
          >
            <span>{maximizada ? "❐" : "□"}</span>
          </button>
          <button
            type="button"
            className="config-agente-btn-ventana config-agente-btn-ventana--cerrar"
            onClick={onCerrar}
            title="Cerrar"
          >
            <span>×</span>
          </button>
        </div>
      </header>

        {/* Pestañas */}
        <div className="config-agente-tabs">
          {pestanasDisponibles.map(p => (
            <button
              key={p.id}
              className={`config-agente-tab ${pestanaActiva === p.id ? 'config-agente-tab--activa' : ''}`}
              onClick={() => setPestanaActiva(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="config-agente-contenido">
          {/* Alerta de clave generada */}
          {claveGenerada && (
            <div className="config-agente-alerta config-agente-alerta--exito">
              <div className="config-agente-alerta-header">
                <strong>Clave del Agente</strong>
                <button onClick={() => limpiarClaveGenerada()}>×</button>
              </div>
              <p>Guarda esta clave, no se mostrará de nuevo:</p>
              <div className="config-agente-clave-box">
                <code>{claveGenerada}</code>
                <button onClick={() => copiarAlPortapapeles(claveGenerada)}>Copiar</button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="config-agente-alerta config-agente-alerta--error">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Cargando */}
          {cargando && (
            <div className="config-agente-cargando">
              <span className="config-agente-spinner"></span>
              Cargando...
            </div>
          )}

          {/* ========== PESTAÑA: AGENTES VINCULADOS ========== */}
          {pestanaActiva === 'vinculados' && !cargando && (
            <div className="config-agente-seccion">
              {agentesVinculados.length === 0 ? (
                <div className="config-agente-vacio">
                  <span className="config-agente-vacio-icono">📡</span>
                  <p>No hay agentes vinculados a este workspace</p>
                  {puedeVincular && (
                    <button
                      className="config-agente-btn config-agente-btn--primario"
                      onClick={() => setPestanaActiva('vincular')}
                    >
                      Vincular un Agente
                    </button>
                  )}
                  {!puedeVincular && (
                    <p className="config-agente-hint">Contacta a un administrador para vincular agentes.</p>
                  )}
                </div>
              ) : (
                <div className="config-agente-lista">
                  {agentesVinculados.map(agente => (
                    <div key={agente.id} className="config-agente-card">
                      <div className="config-agente-card-header">
                        <div className="config-agente-card-info">
                          <h3>{agente.nombre}</h3>
                          {renderEstadoConexion(agente)}
                        </div>
                        <div className="config-agente-card-acciones">
                          <button
                            className="config-agente-btn-icon"
                            onClick={() => toggleRegistradores(agente.id)}
                            title="Ver registradores"
                          >
                            {agenteExpandido === agente.id ? '▲' : '▼'}
                          </button>
                          {/* El botón desvincular es visible para admins, pero solo funciona para creador/superadmin */}
                          {esAdmin && (
                            <button
                              className={`config-agente-btn-icon config-agente-btn-icon--danger ${!puedeVincularDesvincular ? 'config-agente-btn-icon--disabled' : ''}`}
                              onClick={() => {
                                if (puedeVincularDesvincular) {
                                  handleDesvincular(agente.id);
                                } else {
                                  alert('Solo el administrador que creó el workspace puede desvincular agentes.');
                                }
                              }}
                              title={puedeVincularDesvincular ? 'Desvincular' : 'Solo el creador del workspace puede desvincular'}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      {agente.descripcion && (
                        <p className="config-agente-card-desc">{agente.descripcion}</p>
                      )}
                      {agenteExpandido === agente.id && (
                        <div className="config-agente-card-regs">
                          <h4>Registradores</h4>
                          {renderRegistradores(agente.id)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== PESTAÑA: VINCULAR AGENTE ========== */}
          {pestanaActiva === 'vincular' && !cargando && (
            <div className="config-agente-seccion">
              <p className="config-agente-instruccion">
                Selecciona un agente disponible para vincularlo a este workspace.
              </p>
              {agentesDisponibles.length === 0 ? (
                <div className="config-agente-vacio">
                  <span className="config-agente-vacio-icono">🔍</span>
                  <p>No hay agentes disponibles para vincular</p>
                  {esSuperadmin && (
                    <button
                      className="config-agente-btn config-agente-btn--primario"
                      onClick={() => setPestanaActiva('admin')}
                    >
                      Crear nuevo Agente
                    </button>
                  )}
                </div>
              ) : (
                <div className="config-agente-lista">
                  {agentesDisponibles.map(agente => (
                    <div key={agente.id} className="config-agente-card config-agente-card--disponible">
                      <div className="config-agente-card-header">
                        <div className="config-agente-card-info">
                          <h3>{agente.nombre}</h3>
                          {renderEstadoConexion(agente)}
                        </div>
                        <button
                          className="config-agente-btn config-agente-btn--vincular"
                          onClick={() => handleVincular(agente.id)}
                        >
                          Vincular
                        </button>
                      </div>
                      {agente.descripcion && (
                        <p className="config-agente-card-desc">{agente.descripcion}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== PESTAÑA: PANEL ADMIN ========== */}
          {pestanaActiva === 'admin' && !cargando && (
            <div className="config-agente-seccion">
              {/* Formulario crear agente */}
              {!mostrarFormCrear ? (
                <button
                  className="config-agente-btn config-agente-btn--crear"
                  onClick={() => setMostrarFormCrear(true)}
                >
                  + Crear Nuevo Agente
                </button>
              ) : (
                <form className="config-agente-form" onSubmit={handleCrearAgente}>
                  <h4>Nuevo Agente</h4>
                  <div className="config-agente-form-grupo">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={nuevoAgente.nombre}
                      onChange={e => setNuevoAgente(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Agente Subestación Norte"
                      disabled={creando}
                    />
                  </div>
                  <div className="config-agente-form-grupo">
                    <label>Descripción</label>
                    <input
                      type="text"
                      value={nuevoAgente.descripcion}
                      onChange={e => setNuevoAgente(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripción opcional"
                      disabled={creando}
                    />
                  </div>
                  <div className="config-agente-form-acciones">
                    <button
                      type="button"
                      className="config-agente-btn config-agente-btn--secundario"
                      onClick={() => setMostrarFormCrear(false)}
                      disabled={creando}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="config-agente-btn config-agente-btn--primario"
                      disabled={creando || !nuevoAgente.nombre.trim()}
                    >
                      {creando ? 'Creando...' : 'Crear Agente'}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de todos los agentes */}
              <div className="config-agente-admin-lista">
                <h4>Todos los Agentes del Sistema</h4>
                {todosAgentes.length === 0 ? (
                  <div className="config-agente-vacio">
                    <p>No hay agentes en el sistema</p>
                  </div>
                ) : (
                  <div className="config-agente-lista">
                    {todosAgentes.map(agente => (
                      <div key={agente.id} className="config-agente-card config-agente-card--admin">
                        <div className="config-agente-card-header">
                          <div className="config-agente-card-info">
                            <h3>{agente.nombre}</h3>
                            {renderEstadoConexion(agente)}
                            {!agente.activo && (
                              <span className="config-agente-badge config-agente-badge--inactivo">Inactivo</span>
                            )}
                          </div>
                          <div className="config-agente-card-acciones">
                            <button
                              className="config-agente-btn-icon"
                              onClick={() => toggleRegistradores(agente.id)}
                              title="Ver registradores"
                            >
                              {agenteExpandido === agente.id ? '▲' : '▼'}
                            </button>
                            <button
                              className="config-agente-btn-icon"
                              onClick={() => handleRotarClave(agente.id)}
                              title="Rotar clave"
                            >
                              🔑
                            </button>
                            <button
                              className="config-agente-btn-icon config-agente-btn-icon--danger"
                              onClick={() => handleEliminarAgente(agente.id, agente.nombre)}
                              title="Eliminar"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                        {agente.descripcion && (
                          <p className="config-agente-card-desc">{agente.descripcion}</p>
                        )}
                        {agenteExpandido === agente.id && (
                          <div className="config-agente-card-regs">
                            <h4>Registradores</h4>
                            {renderRegistradores(agente.id, true)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal de resultado del test */}
        {resultadoTest && (
          <div className="config-agente-test-overlay" onClick={() => limpiarResultadoTest()}>
            <div className="config-agente-test-modal" onClick={e => e.stopPropagation()}>
              <div className="config-agente-test-header">
                <h3>Resultado del Test</h3>
                <button className="config-agente-cerrar" onClick={() => limpiarResultadoTest()}>×</button>
              </div>
              <div className="config-agente-test-contenido">
                <div className="config-agente-test-info">
                  <strong>{resultadoTest.registrador?.nombre}</strong>
                  <span className="config-agente-test-detalle">
                    {resultadoTest.registrador?.ip}:{resultadoTest.registrador?.puerto}
                  </span>
                </div>

                {resultadoTest.exito ? (
                  <div className="config-agente-test-exito">
                    <div className="config-agente-test-icono">✓</div>
                    <h4>Conexión Exitosa</h4>
                    <p className="config-agente-test-tiempo">
                      Tiempo de respuesta: <strong>{resultadoTest.tiempo_respuesta_ms}ms</strong>
                    </p>
                    {resultadoTest.valores && resultadoTest.valores.length > 0 && (
                      <div className="config-agente-test-valores">
                        <h5>Valores leídos ({resultadoTest.valores.length} registros):</h5>
                        <div className="config-agente-test-valores-grid">
                          {resultadoTest.valores.map((valor, idx) => (
                            <div key={idx} className="config-agente-test-valor">
                              <span className="config-agente-test-valor-idx">
                                [{resultadoTest.registrador?.indice_inicial + idx}]
                              </span>
                              <span className="config-agente-test-valor-num">{valor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="config-agente-test-error">
                    <div className="config-agente-test-icono config-agente-test-icono--error">✗</div>
                    <h4>
                      {resultadoTest.estado === 'timeout' && 'Tiempo Agotado'}
                      {resultadoTest.estado === 'cooldown' && 'Espera Requerida'}
                      {resultadoTest.estado === 'error' && 'Error de Conexión'}
                    </h4>
                    <p className="config-agente-test-mensaje">{resultadoTest.error_mensaje}</p>
                    {resultadoTest.tiempo_respuesta_ms && (
                      <p className="config-agente-test-tiempo">
                        Tiempo transcurrido: {resultadoTest.tiempo_respuesta_ms}ms
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="config-agente-test-acciones">
                <button
                  className="config-agente-btn config-agente-btn--primario"
                  onClick={() => limpiarResultadoTest()}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Indicador de test en progreso */}
      {testEnCurso && (
        <div className="config-agente-test-progreso">
          <div className="config-agente-test-progreso-contenido">
            <span className="config-agente-spinner"></span>
            <span>Esperando respuesta del agente...</span>
            <div className="config-agente-test-progreso-barra">
              <div
                className="config-agente-test-progreso-fill"
                style={{ width: `${testEnCurso.progreso}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Handle de resize en esquina inferior derecha */}
      {!maximizada && (
        <div
          className="config-agente-resize-handle"
          onMouseDown={handleMouseDownResize}
          title="Arrastrar para redimensionar"
        />
      )}
    </div>
  );
};

export default ModalConfigurarAgente;
