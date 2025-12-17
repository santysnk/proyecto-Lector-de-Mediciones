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
  crearRegistradorAgente,
  actualizarRegistradorAgente,
  eliminarRegistradorAgente,
  toggleRegistradorAgente,
  solicitarTestRegistrador,
  consultarTestRegistrador,
} from "../../../../servicios/apiService";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import "./ModalConfigurarAgente.css";

/**
 * Modal para configurar agentes con pestañas según rol del usuario.
 *
 * Pestañas:
 * - "Agentes Vinculados": Todos los roles con acceso al workspace
 * - "Vincular Agente": Admin y Superadmin
 * - "Panel SuperAdmin": Solo Superadmin (CRUD de agentes y registradores)
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
    { id: 'admin', label: 'Panel SuperAdmin', visible: esSuperadmin },
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

  // Estado para CRUD de registradores
  const [mostrarFormRegistrador, setMostrarFormRegistrador] = useState(null); // null | agenteId
  const [registradorEditando, setRegistradorEditando] = useState(null);
  const [nuevoRegistrador, setNuevoRegistrador] = useState({
    nombre: '',
    tipo: 'modbus',
    ip: '',
    puerto: '',
    unitId: '',
    indiceInicial: '',
    cantidadRegistros: '',
    intervaloSegundos: '',
  });
  const [guardandoRegistrador, setGuardandoRegistrador] = useState(false);
  const [registradorProcesando, setRegistradorProcesando] = useState(null); // ID del registrador que está procesando

  // Estado para test de registrador
  const [testEnCurso, setTestEnCurso] = useState(null); // { agenteId, registradorId, testId, estado, progreso }
  const [resultadoTest, setResultadoTest] = useState(null); // Resultado del test para mostrar en modal

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
      setMostrarFormRegistrador(null);
      setRegistradorEditando(null);
      resetFormRegistrador();
      setTestEnCurso(null);
      setResultadoTest(null);
    }
  }, [abierto]);

  // Reset form de registrador
  const resetFormRegistrador = () => {
    setNuevoRegistrador({
      nombre: '',
      tipo: 'modbus',
      ip: '',
      puerto: '',
      unitId: '',
      indiceInicial: '',
      cantidadRegistros: '',
      intervaloSegundos: '',
    });
    setRegistradorEditando(null);
  };

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
      setMostrarFormRegistrador(null);
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

  // Recargar registradores de un agente
  const recargarRegistradores = async (agenteId) => {
    try {
      const regs = await listarRegistradoresAgente(agenteId);
      setRegistradoresAgente(prev => ({ ...prev, [agenteId]: regs }));
    } catch (err) {
      console.error('Error recargando registradores:', err);
    }
  };

  // Crear o editar registrador
  const handleGuardarRegistrador = async (e, agenteId) => {
    e.preventDefault();
    if (!nuevoRegistrador.nombre.trim() || !nuevoRegistrador.ip.trim() || !nuevoRegistrador.puerto || !nuevoRegistrador.indiceInicial || !nuevoRegistrador.cantidadRegistros) return;

    try {
      setGuardandoRegistrador(true);
      setError(null);

      // Preparar datos con valores por defecto para campos opcionales
      const datos = {
        ...nuevoRegistrador,
        unitId: nuevoRegistrador.unitId || '1',
        intervaloSegundos: nuevoRegistrador.intervaloSegundos || '60',
      };

      if (registradorEditando) {
        // Editar
        await actualizarRegistradorAgente(agenteId, registradorEditando.id, datos);
      } else {
        // Crear
        await crearRegistradorAgente(agenteId, datos);
      }

      await recargarRegistradores(agenteId);
      setMostrarFormRegistrador(null);
      resetFormRegistrador();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoRegistrador(false);
    }
  };

  // Editar registrador
  const handleEditarRegistrador = (reg) => {
    setRegistradorEditando(reg);
    setNuevoRegistrador({
      nombre: reg.nombre || '',
      tipo: reg.tipo || 'modbus',
      ip: reg.ip || '',
      puerto: String(reg.puerto || '502'),
      unitId: String(reg.unit_id || '1'),
      indiceInicial: String(reg.indice_inicial || '0'),
      cantidadRegistros: String(reg.cantidad_registros || '10'),
      intervaloSegundos: String(reg.intervalo_segundos || '60'),
    });
    setMostrarFormRegistrador(reg.agente_id);
  };

  // Eliminar registrador
  const handleEliminarRegistrador = async (agenteId, registradorId, nombre) => {
    if (!confirm(`¿Eliminar el registrador "${nombre}"?`)) return;

    try {
      setCargando(true);
      await eliminarRegistradorAgente(agenteId, registradorId);
      await recargarRegistradores(agenteId);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Toggle activo registrador
  const handleToggleRegistrador = async (agenteId, registradorId) => {
    try {
      setRegistradorProcesando(registradorId);
      await toggleRegistradorAgente(agenteId, registradorId);
      await recargarRegistradores(agenteId);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistradorProcesando(null);
    }
  };

  // Iniciar o parar todos los registradores de un agente
  const handleToggleTodosRegistradores = async (agenteId, iniciar) => {
    const regs = registradoresAgente[agenteId] || [];
    const registrosAToggle = regs.filter(r => iniciar ? !r.activo : r.activo);

    if (registrosAToggle.length === 0) return;

    try {
      setRegistradorProcesando('todos');
      // Toggle cada registrador que necesite cambiar
      for (const reg of registrosAToggle) {
        await toggleRegistradorAgente(agenteId, reg.id);
      }
      await recargarRegistradores(agenteId);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistradorProcesando(null);
    }
  };

  // Test de conexión de registrador (usa datos del formulario)
  const handleTestRegistrador = async (agenteId) => {
    // Verificar si ya hay un test en curso
    if (testEnCurso) {
      return;
    }

    // Validar que los campos requeridos estén completos
    if (!nuevoRegistrador.ip.trim() || !nuevoRegistrador.puerto || !nuevoRegistrador.indiceInicial || !nuevoRegistrador.cantidadRegistros) {
      setError('Completa IP, Puerto, Índice Inicial y Cantidad de Registros para hacer el test');
      return;
    }

// Crear objeto con datos del formulario (fuera del try para usar en catch)
    const datosTest = {
      nombre: nuevoRegistrador.nombre || 'Test',
      ip: nuevoRegistrador.ip,
      puerto: parseInt(nuevoRegistrador.puerto),
      unit_id: parseInt(nuevoRegistrador.unitId) || 1,
      indice_inicial: parseInt(nuevoRegistrador.indiceInicial),
      cantidad_registros: parseInt(nuevoRegistrador.cantidadRegistros),
    };

    try {
      setTestEnCurso({
        agenteId,
        registradorId: 'form',
        testId: null,
        estado: 'solicitando',
        progreso: 0,
      });
      setResultadoTest(null);
      setError(null);

      // Solicitar el test
      const respuesta = await solicitarTestRegistrador(agenteId, {
        ip: datosTest.ip,
        puerto: datosTest.puerto,
        unitId: datosTest.unit_id,
        indiceInicial: datosTest.indice_inicial,
        cantidadRegistros: datosTest.cantidad_registros,
      });

      const { testId, timeoutSegundos } = respuesta;

      setTestEnCurso(prev => ({
        ...prev,
        testId,
        estado: 'esperando',
        progreso: 0,
      }));

      // Polling del resultado
      const tiempoInicio = Date.now();
      const tiempoMaximo = (timeoutSegundos || 30) * 1000;
      const intervalo = 1000; // Consultar cada segundo

      const poll = async () => {
        const tiempoTranscurrido = Date.now() - tiempoInicio;

        if (tiempoTranscurrido > tiempoMaximo) {
          setTestEnCurso(null);
          setResultadoTest({
            exito: false,
            estado: 'timeout',
            error_mensaje: 'El agente no respondió a tiempo',
            registrador: datosTest,
          });
          return;
        }

        try {
          const resultado = await consultarTestRegistrador(agenteId, testId);

          // Actualizar progreso
          const progreso = Math.min((tiempoTranscurrido / tiempoMaximo) * 100, 95);
          setTestEnCurso(prev => prev ? { ...prev, progreso } : null);

          if (resultado.estado === 'completado' || resultado.estado === 'error' || resultado.estado === 'timeout') {
            // Primero llevar la barra a 100%
            setTestEnCurso(prev => prev ? { ...prev, progreso: 100 } : null);

            // Esperar un momento para que se vea la barra llena antes de mostrar el resultado
            setTimeout(() => {
              setTestEnCurso(null);
              setResultadoTest({
                ...resultado,
                exito: resultado.estado === 'completado',
                registrador: datosTest,
              });
            }, 400);
          } else {
            // Seguir esperando
            setTimeout(poll, intervalo);
          }
        } catch (err) {
          setTestEnCurso(null);
          setResultadoTest({
            exito: false,
            estado: 'error',
            error_mensaje: err.message,
            registrador: datosTest,
          });
        }
      };

      // Iniciar polling
      setTimeout(poll, intervalo);

    } catch (err) {
      setTestEnCurso(null);

      // Manejar error de cooldown
      if (err.message?.includes('esperar')) {
        setResultadoTest({
          exito: false,
          estado: 'cooldown',
          error_mensaje: err.message,
          registrador: datosTest,
        });
      } else {
        setError(err.message);
      }
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
            <div className="config-agente-reg-form-grid">
              <div className="config-agente-form-grupo">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={nuevoRegistrador.nombre}
                  onChange={e => setNuevoRegistrador(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Relé Alimentador 1"
                  disabled={guardandoRegistrador}
                />
              </div>
              <div className="config-agente-form-grupo">
                <label>IP *</label>
                <input
                  type="text"
                  value={nuevoRegistrador.ip}
                  onChange={e => setNuevoRegistrador(prev => ({ ...prev, ip: e.target.value }))}
                  placeholder="192.168.1.100"
                  disabled={guardandoRegistrador}
                />
              </div>
              <div className="config-agente-form-grupo">
                <label>Puerto *</label>
                <input
                  type="number"
                  value={nuevoRegistrador.puerto}
                  onChange={e => setNuevoRegistrador(prev => ({ ...prev, puerto: e.target.value }))}
                  placeholder="Ej: 502"
                  disabled={guardandoRegistrador}
                />
              </div>
              <div className="config-agente-form-grupo">
                <label title="Slave ID del dispositivo Modbus (usualmente 1)">Unit ID</label>
                <input
                  type="number"
                  value={nuevoRegistrador.unitId}
                  onChange={e => setNuevoRegistrador(prev => ({ ...prev, unitId: e.target.value }))}
                  placeholder="Ej: 1"
                  title="Identificador del esclavo Modbus en la red"
                  disabled={guardandoRegistrador}
                />
              </div>
              <div className="config-agente-form-grupo">
                <label>Índice Inicial *</label>
                <input
                  type="number"
                  value={nuevoRegistrador.indiceInicial}
                  onChange={e => setNuevoRegistrador(prev => ({ ...prev, indiceInicial: e.target.value }))}
                  placeholder="Ej: 137"
                  disabled={guardandoRegistrador}
                />
              </div>
              <div className="config-agente-form-grupo">
                <label>Cantidad Registros *</label>
                <input
                  type="number"
                  value={nuevoRegistrador.cantidadRegistros}
                  onChange={e => setNuevoRegistrador(prev => ({ ...prev, cantidadRegistros: e.target.value }))}
                  placeholder="Ej: 20"
                  disabled={guardandoRegistrador}
                />
              </div>
              <div className="config-agente-form-grupo">
                <label>Intervalo (seg)</label>
                <input
                  type="number"
                  value={nuevoRegistrador.intervaloSegundos}
                  onChange={e => setNuevoRegistrador(prev => ({ ...prev, intervaloSegundos: e.target.value }))}
                  placeholder="Ej: 60"
                  disabled={guardandoRegistrador}
                />
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
          </form>
        )}

        {/* Lista de registradores */}
        {regs.length === 0 ? (
          <div className="config-agente-regs-vacio">Sin registradores configurados</div>
        ) : (
          <div className="config-agente-regs-lista">
            {regs.map(reg => (
              <div key={reg.id} className={`config-agente-reg-item ${conAcciones ? 'config-agente-reg-item--admin' : ''}`}>
                <div className="config-agente-reg-info">
                  <span
                    className={`config-agente-reg-estado ${reg.activo ? 'config-agente-reg-estado--activo' : ''}`}
                    title={reg.activo ? 'Activo' : 'Inactivo'}
                  ></span>
                  <span className="config-agente-reg-nombre">{reg.nombre}</span>
                  <span className="config-agente-reg-detalle">
                    {reg.ip}:{reg.puerto} | Reg: {reg.indice_inicial}-{reg.indice_inicial + reg.cantidad_registros - 1} | {reg.intervalo_segundos}s
                  </span>
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
            ))}
          </div>
        )}
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
                            {agenteExpandido === agente.id ? '▲' : '▼'}
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
          <div className="config-agente-test-overlay" onClick={() => setResultadoTest(null)}>
            <div className="config-agente-test-modal" onClick={e => e.stopPropagation()}>
              <div className="config-agente-test-header">
                <h3>Resultado del Test</h3>
                <button className="config-agente-cerrar" onClick={() => setResultadoTest(null)}>×</button>
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
                  onClick={() => setResultadoTest(null)}
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
      </div>
    </div>
  );
};

export default ModalConfigurarAgente;
