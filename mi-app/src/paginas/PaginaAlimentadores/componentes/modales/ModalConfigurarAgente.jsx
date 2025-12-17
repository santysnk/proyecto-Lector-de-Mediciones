// src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx
// Modal para configurar agentes con pestañas dinámicas según rol

import React, { useState, useEffect, useCallback } from "react";
import {
  // Nueva arquitectura
  listarAgentesWorkspace,
  listarAgentesDisponibles,
  vincularAgenteWorkspace,
  desvincularAgenteWorkspace,
  listarTodosLosAgentes,
  crearAgente,
  eliminarAgente,
  rotarClaveAgentePorId,
  listarRegistradoresAgente,
} from "../../../../servicios/apiService";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import "./ModalConfigurarAgente.css";

/**
 * Modal para configurar agentes con pestañas según rol del usuario.
 *
 * Pestañas:
 * - "Agentes Vinculados": Todos los roles con acceso al workspace
 * - "Vincular Agente": Admin y Superadmin
 * - "Panel Admin": Solo Superadmin
 */
const ModalConfigurarAgente = ({ abierto, workspaceId, onCerrar }) => {
  const { rolGlobal, perfil } = usarContextoConfiguracion();

  // Determinar permisos según rol
  const esSuperadmin = rolGlobal === 'superadmin';
  const esAdmin = rolGlobal === 'admin' || esSuperadmin;
  const puedeVincular = esAdmin;

  // Pestañas disponibles según rol
  const pestanasDisponibles = [
    { id: 'vinculados', label: 'Agentes Vinculados', visible: true },
    { id: 'vincular', label: 'Vincular Agente', visible: puedeVincular },
    { id: 'admin', label: 'Panel Admin', visible: esSuperadmin },
  ].filter(p => p.visible);

  // Estado
  const [pestanaActiva, setPestanaActiva] = useState('vinculados');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Datos
  const [agentesVinculados, setAgentesVinculados] = useState([]);
  const [agentesDisponibles, setAgentesDisponibles] = useState([]);
  const [todosAgentes, setTodosAgentes] = useState([]);
  const [registradoresAgente, setRegistradoresAgente] = useState({});

  // Estado para crear agente
  const [mostrarFormCrear, setMostrarFormCrear] = useState(false);
  const [nuevoAgente, setNuevoAgente] = useState({ nombre: '', descripcion: '' });
  const [creando, setCreando] = useState(false);
  const [claveGenerada, setClaveGenerada] = useState(null);

  // Estado para expandir registradores
  const [agenteExpandido, setAgenteExpandido] = useState(null);

  // Cargar datos al abrir
  useEffect(() => {
    if (abierto && workspaceId) {
      cargarDatos();
    }
  }, [abierto, workspaceId]);

  // Resetear estado al cerrar
  useEffect(() => {
    if (!abierto) {
      setPestanaActiva('vinculados');
      setError(null);
      setMostrarFormCrear(false);
      setClaveGenerada(null);
      setAgenteExpandido(null);
    }
  }, [abierto]);

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);

    try {
      // Cargar agentes vinculados al workspace
      const vinculados = await listarAgentesWorkspace(workspaceId);
      setAgentesVinculados(vinculados || []);

      // Si puede vincular, cargar disponibles
      if (puedeVincular) {
        const disponibles = await listarAgentesDisponibles();
        // Filtrar los que ya están vinculados
        const idsVinculados = new Set((vinculados || []).map(a => a.id));
        setAgentesDisponibles((disponibles || []).filter(a => !idsVinculados.has(a.id)));
      }

      // Si es superadmin, cargar todos
      if (esSuperadmin) {
        const todos = await listarTodosLosAgentes();
        setTodosAgentes(todos || []);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.message || 'Error cargando datos');
    } finally {
      setCargando(false);
    }
  };

  // Vincular agente al workspace
  const handleVincular = async (agenteId) => {
    try {
      setCargando(true);
      await vincularAgenteWorkspace(workspaceId, agenteId);
      await cargarDatos();
      setPestanaActiva('vinculados');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Desvincular agente del workspace
  const handleDesvincular = async (agenteId) => {
    if (!confirm('¿Desvincular este agente del workspace?')) return;

    try {
      setCargando(true);
      await desvincularAgenteWorkspace(workspaceId, agenteId);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Crear nuevo agente (superadmin)
  const handleCrearAgente = async (e) => {
    e.preventDefault();
    if (!nuevoAgente.nombre.trim()) return;

    try {
      setCreando(true);
      setError(null);
      const resultado = await crearAgente(nuevoAgente.nombre, nuevoAgente.descripcion);
      setClaveGenerada(resultado.claveSecreta);
      setNuevoAgente({ nombre: '', descripcion: '' });
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreando(false);
    }
  };

  // Eliminar agente (superadmin)
  const handleEliminarAgente = async (agenteId, nombre) => {
    if (!confirm(`¿Eliminar el agente "${nombre}"? Esta acción no se puede deshacer.`)) return;

    try {
      setCargando(true);
      await eliminarAgente(agenteId);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Rotar clave de agente (superadmin)
  const handleRotarClave = async (agenteId) => {
    if (!confirm('¿Rotar la clave del agente? Deberás actualizar el agente con la nueva clave.')) return;

    try {
      setCargando(true);
      const resultado = await rotarClaveAgentePorId(agenteId);
      setClaveGenerada(resultado.nuevaClave);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Cargar registradores de un agente
  const toggleRegistradores = async (agenteId) => {
    if (agenteExpandido === agenteId) {
      setAgenteExpandido(null);
      return;
    }

    try {
      if (!registradoresAgente[agenteId]) {
        const regs = await listarRegistradoresAgente(agenteId);
        setRegistradoresAgente(prev => ({ ...prev, [agenteId]: regs }));
      }
      setAgenteExpandido(agenteId);
    } catch (err) {
      console.error('Error cargando registradores:', err);
    }
  };

  // Copiar al portapapeles
  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto);
  };

  if (!abierto) return null;

  // Renderizar indicador de estado de conexión
  const renderEstadoConexion = (agente) => (
    <span className={`config-agente-estado ${agente.conectado ? 'config-agente-estado--conectado' : 'config-agente-estado--desconectado'}`}>
      <span className="config-agente-estado-punto"></span>
      {agente.conectado ? 'Conectado' : 'Desconectado'}
    </span>
  );

  // Renderizar lista de registradores
  const renderRegistradores = (agenteId) => {
    const regs = registradoresAgente[agenteId] || [];
    if (regs.length === 0) {
      return <div className="config-agente-regs-vacio">Sin registradores configurados</div>;
    }
    return (
      <div className="config-agente-regs-lista">
        {regs.map(reg => (
          <div key={reg.id} className="config-agente-reg-item">
            <span className={`config-agente-reg-estado ${reg.activo ? 'config-agente-reg-estado--activo' : ''}`}></span>
            <span className="config-agente-reg-nombre">{reg.nombre}</span>
            <span className="config-agente-reg-detalle">
              {reg.ip}:{reg.puerto} | Reg: {reg.indice_inicial}-{reg.indice_inicial + reg.cantidad_registros - 1}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="config-agente-overlay" onClick={onCerrar}>
      <div className="config-agente-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="config-agente-header">
          <h2>Configuración de Agentes</h2>
          <button className="config-agente-cerrar" onClick={onCerrar}>×</button>
        </div>

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
                <button onClick={() => setClaveGenerada(null)}>×</button>
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
                            {agenteExpandido === agente.id ? '▼' : '▶'}
                          </button>
                          {puedeVincular && (
                            <button
                              className="config-agente-btn-icon config-agente-btn-icon--danger"
                              onClick={() => handleDesvincular(agente.id)}
                              title="Desvincular"
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
                              {agenteExpandido === agente.id ? '▼' : '▶'}
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
                        {agente.version_software && (
                          <p className="config-agente-card-version">v{agente.version_software}</p>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalConfigurarAgente;
