// src/paginas/PaginaAlimentadores/componentes/modales/ModalPanelPermisos.jsx
// Modal para gestionar permisos de usuarios y acceso a agentes (solo superadmin)
// Diseño tipo dashboard con tabla + panel lateral de edición

import React, { useState, useEffect, useMemo } from "react";
import "./ModalPanelPermisos.css";
import {
  listarUsuariosAdmin,
  cambiarRolUsuarioAdmin,
  actualizarAgentesUsuarioAdmin,
  listarAgentesParaPermisos,
  obtenerDetallesUsuarioAdmin,
} from "../../../../servicios/apiService";

/**
 * Modal para gestionar los permisos de usuarios y su acceso a agentes.
 * Solo visible para superadmins.
 * Diseño: Tabla de usuarios + Panel lateral de edición
 */
const ModalPanelPermisos = ({ abierto, onCerrar }) => {
  // Estado principal
  const [usuarios, setUsuarios] = useState([]);
  const [agentesDisponibles, setAgentesDisponibles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Estado de ventana (minimizado/maximizado)
  const [estadoVentana, setEstadoVentana] = useState("normal"); // "normal" | "minimizado" | "maximizado"

  // Búsqueda y filtrado
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  // Estado de edición (panel lateral)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Estado de filas expandidas (detalles del usuario)
  const [usuarioExpandido, setUsuarioExpandido] = useState(null);
  const [detallesUsuario, setDetallesUsuario] = useState(null);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [errorDetalles, setErrorDetalles] = useState(null);

  // Roles disponibles para asignar (no incluye superadmin)
  const rolesDisponibles = [
    { codigo: "admin", nombre: "Administrador" },
    { codigo: "operador", nombre: "Operador" },
    { codigo: "observador", nombre: "Observador" },
  ];

  // Usuarios filtrados
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideBusqueda =
        busqueda === "" ||
        u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideRol = filtroRol === "todos" || u.rolGlobal === filtroRol;
      return coincideBusqueda && coincideRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  // Cargar datos al abrir
  useEffect(() => {
    if (abierto) {
      cargarDatos();
    }
  }, [abierto]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!abierto) {
      setUsuarioSeleccionado(null);
      setCambiosPendientes({});
      setError(null);
      setBusqueda("");
      setFiltroRol("todos");
      setEstadoVentana("normal");
      setUsuarioExpandido(null);
      setDetallesUsuario(null);
      setErrorDetalles(null);
    }
  }, [abierto]);

  // Handlers de controles de ventana
  const handleMinimizar = () => {
    setEstadoVentana(estadoVentana === "minimizado" ? "normal" : "minimizado");
  };

  const handleMaximizar = () => {
    setEstadoVentana(estadoVentana === "maximizado" ? "normal" : "maximizado");
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      const [usuariosData, agentesData] = await Promise.all([
        listarUsuariosAdmin(),
        listarAgentesParaPermisos(),
      ]);

      setUsuarios(usuariosData);
      setAgentesDisponibles(agentesData);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarUsuario = (usuario) => {
    if (usuarioSeleccionado?.id === usuario.id) {
      // Deseleccionar si ya está seleccionado
      setUsuarioSeleccionado(null);
      setCambiosPendientes({});
    } else {
      setUsuarioSeleccionado(usuario);
      setCambiosPendientes({
        rolGlobal: usuario.rolGlobal,
        accesoTotal: usuario.permisoAgentes?.accesoTotal || false,
        agentesIds: usuario.permisoAgentes?.agentes?.map((a) => a.id) || [],
      });
    }
  };

  const handleCambioRol = (nuevoRol) => {
    setCambiosPendientes((prev) => ({
      ...prev,
      rolGlobal: nuevoRol,
    }));
  };

  const handleToggleAccesoTotal = () => {
    setCambiosPendientes((prev) => ({
      ...prev,
      accesoTotal: !prev.accesoTotal,
      agentesIds: !prev.accesoTotal ? [] : prev.agentesIds,
    }));
  };

  const handleToggleAgente = (agenteId) => {
    setCambiosPendientes((prev) => {
      const yaIncluido = prev.agentesIds.includes(agenteId);
      return {
        ...prev,
        agentesIds: yaIncluido
          ? prev.agentesIds.filter((id) => id !== agenteId)
          : [...prev.agentesIds, agenteId],
      };
    });
  };

  const tieneModificaciones = () => {
    if (!usuarioSeleccionado || !cambiosPendientes.rolGlobal) return false;

    const rolCambio = usuarioSeleccionado.rolGlobal !== cambiosPendientes.rolGlobal;
    const accesoTotalCambio =
      (usuarioSeleccionado.permisoAgentes?.accesoTotal || false) !==
      cambiosPendientes.accesoTotal;

    const agentesOriginales =
      usuarioSeleccionado.permisoAgentes?.agentes?.map((a) => a.id).sort() || [];
    const agentesNuevos = [...cambiosPendientes.agentesIds].sort();
    const agentesCambio =
      JSON.stringify(agentesOriginales) !== JSON.stringify(agentesNuevos);

    return rolCambio || accesoTotalCambio || agentesCambio;
  };

  const handleGuardarUsuario = async () => {
    if (!usuarioSeleccionado) return;

    try {
      setGuardando(true);
      setError(null);

      const rolCambio = usuarioSeleccionado.rolGlobal !== cambiosPendientes.rolGlobal;
      if (rolCambio) {
        await cambiarRolUsuarioAdmin(usuarioSeleccionado.id, cambiosPendientes.rolGlobal);
      }

      const resultado = await actualizarAgentesUsuarioAdmin(
        usuarioSeleccionado.id,
        cambiosPendientes.accesoTotal,
        cambiosPendientes.agentesIds
      );
      console.log("Resultado guardar permisos:", resultado);

      await cargarDatos();
      setUsuarioSeleccionado(null);
      setCambiosPendientes({});
    } catch (err) {
      console.error("Error guardando usuario:", err);
      setError(err.message || err.detalles || "Error al guardar permisos");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    setUsuarioSeleccionado(null);
    setCambiosPendientes({});
  };

  const getAccesoTexto = (usuario) => {
    if (usuario.permisoAgentes?.accesoTotal) return "Todos";
    const count = usuario.permisoAgentes?.agentes?.length || 0;
    if (count === 0) return "Sin acceso";
    return `${count} agente${count > 1 ? "s" : ""}`;
  };

  const getAccesoClase = (usuario) => {
    if (usuario.permisoAgentes?.accesoTotal) return "permisos-acceso--todos";
    const count = usuario.permisoAgentes?.agentes?.length || 0;
    if (count === 0) return "permisos-acceso--ninguno";
    return "permisos-acceso--parcial";
  };

  // Handler para expandir/colapsar detalles del usuario
  const handleToggleExpand = async (e, usuarioId) => {
    e.stopPropagation(); // Evitar que se seleccione el usuario para edición

    if (usuarioExpandido === usuarioId) {
      // Colapsar
      setUsuarioExpandido(null);
      setDetallesUsuario(null);
      setErrorDetalles(null);
    } else {
      // Expandir y cargar detalles
      setUsuarioExpandido(usuarioId);
      setCargandoDetalles(true);
      setErrorDetalles(null);
      setDetallesUsuario(null);
      try {
        const detalles = await obtenerDetallesUsuarioAdmin(usuarioId);
        console.log("Detalles recibidos:", detalles);
        setDetallesUsuario(detalles);
      } catch (err) {
        console.error("Error cargando detalles:", err);
        setErrorDetalles(err.message || "Error al cargar detalles");
        setDetallesUsuario(null);
      } finally {
        setCargandoDetalles(false);
      }
    }
  };

  // Renderizar detalles expandidos del usuario
  const renderDetallesUsuario = () => {
    if (!detallesUsuario) {
      return (
        <div className="permisos-detalles-vacio-total">
          No se pudieron cargar los detalles del usuario.
        </div>
      );
    }

    const { workspacesPropios = [], workspacesComoInvitado = [], resumen = {} } = detallesUsuario;

    const totalPropios = resumen.totalWorkspacesPropios ?? workspacesPropios.length;
    const totalPuestos = resumen.totalPuestos ?? 0;
    const totalInvitado = resumen.totalWorkspacesInvitado ?? workspacesComoInvitado.length;

    return (
      <div className="permisos-detalles">
        {/* Resumen */}
        <div className="permisos-detalles-resumen">
          <span className="permisos-detalles-stat">
            <strong>{totalPropios}</strong> workspace{totalPropios !== 1 ? "s" : ""} propio{totalPropios !== 1 ? "s" : ""}
          </span>
          <span className="permisos-detalles-stat">
            <strong>{totalPuestos}</strong> puesto{totalPuestos !== 1 ? "s" : ""} total{totalPuestos !== 1 ? "es" : ""}
          </span>
          <span className="permisos-detalles-stat">
            <strong>{totalInvitado}</strong> workspace{totalInvitado !== 1 ? "s" : ""} como invitado
          </span>
        </div>

        {/* Workspaces propios */}
        {workspacesPropios.length > 0 && (
          <div className="permisos-detalles-seccion">
            <h4 className="permisos-detalles-titulo">Workspaces Propios</h4>
            <div className="permisos-detalles-lista">
              {workspacesPropios.map((ws) => (
                <div key={ws.id} className="permisos-detalles-workspace">
                  <div className="permisos-detalles-ws-header">
                    <span className="permisos-detalles-ws-nombre">{ws.nombre}</span>
                    <span className="permisos-detalles-ws-badge">{ws.cantidadPuestos} puesto{ws.cantidadPuestos !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Agentes del workspace */}
                  <div className="permisos-detalles-ws-info">
                    <span className="permisos-detalles-label">Agentes:</span>
                    {ws.agentes.length === 0 ? (
                      <span className="permisos-detalles-vacio">Sin agente vinculado</span>
                    ) : (
                      <span className="permisos-detalles-items">
                        {ws.agentes.map((a) => (
                          <span key={a.id} className={`permisos-detalles-item ${!a.activo ? "permisos-detalles-item--inactivo" : ""}`}>
                            {a.nombre}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>

                  {/* Invitados del workspace */}
                  <div className="permisos-detalles-ws-info">
                    <span className="permisos-detalles-label">Invitados:</span>
                    {ws.invitados.length === 0 ? (
                      <span className="permisos-detalles-vacio">Sin invitados</span>
                    ) : (
                      <span className="permisos-detalles-items permisos-detalles-items--vertical">
                        {ws.invitados.map((inv) => (
                          <span key={inv.id} className="permisos-detalles-invitado">
                            <span className="permisos-detalles-invitado-nombre">{inv.nombre || inv.email}</span>
                            <span className={`permisos-detalles-rol permisos-detalles-rol--${inv.rol}`}>{inv.rol}</span>
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workspaces como invitado */}
        {workspacesComoInvitado.length > 0 && (
          <div className="permisos-detalles-seccion">
            <h4 className="permisos-detalles-titulo">Acceso como Invitado</h4>
            <div className="permisos-detalles-lista">
              {workspacesComoInvitado.map((ws) => (
                <div key={ws.id} className="permisos-detalles-workspace permisos-detalles-workspace--invitado">
                  <div className="permisos-detalles-ws-header">
                    <span className="permisos-detalles-ws-nombre">{ws.nombre}</span>
                    <span className={`permisos-detalles-rol permisos-detalles-rol--${ws.rol}`}>{ws.rol}</span>
                  </div>
                  <div className="permisos-detalles-ws-info">
                    <span className="permisos-detalles-label">Propietario:</span>
                    <span className="permisos-detalles-propietario">
                      {ws.propietario?.nombre || ws.propietario?.email || "Desconocido"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje si no hay datos */}
        {workspacesPropios.length === 0 && workspacesComoInvitado.length === 0 && (
          <div className="permisos-detalles-vacio-total">
            Este usuario no tiene workspaces propios ni acceso como invitado.
          </div>
        )}
      </div>
    );
  };

  if (!abierto) return null;

  // Clase dinámica para el modal según estado
  const getModalClase = () => {
    let clase = "permisos-modal";
    if (estadoVentana === "minimizado") clase += " permisos-modal--minimizado";
    if (estadoVentana === "maximizado") clase += " permisos-modal--maximizado";
    return clase;
  };

  return (
    <div className={`permisos-overlay ${estadoVentana === "minimizado" ? "permisos-overlay--minimizado" : ""}`} onClick={estadoVentana === "minimizado" ? undefined : onCerrar}>
      <div className={getModalClase()} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="permisos-header" onDoubleClick={handleMaximizar}>
          <div className="permisos-titulo">
            <span className="permisos-icono">🔐</span>
            <span className="permisos-nombre">Panel de Permisos</span>
          </div>
          <div className="permisos-controles">
            <button
              type="button"
              className="permisos-btn-control"
              onClick={handleMinimizar}
              title={estadoVentana === "minimizado" ? "Restaurar" : "Minimizar"}
            >
              {estadoVentana === "minimizado" ? "🗗" : "—"}
            </button>
            <button
              type="button"
              className="permisos-btn-control"
              onClick={handleMaximizar}
              title={estadoVentana === "maximizado" ? "Restaurar" : "Maximizar"}
            >
              {estadoVentana === "maximizado" ? "🗗" : "☐"}
            </button>
            <button
              type="button"
              className="permisos-btn-cerrar"
              onClick={onCerrar}
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="permisos-content">
          {/* Barra de controles */}
          <div className="permisos-toolbar">
            <div className="permisos-busqueda">
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="permisos-input-busqueda"
              />
            </div>
            <div className="permisos-filtros">
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="permisos-select-filtro"
              >
                <option value="todos">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="operador">Operadores</option>
                <option value="observador">Observadores</option>
              </select>
            </div>
            <div className="permisos-stats">
              <span className="permisos-contador">
                {usuariosFiltrados.length} de {usuarios.length} usuarios
              </span>
            </div>
          </div>

          {/* Área principal: Tabla + Panel */}
          <div className="permisos-main">
            {/* Tabla de usuarios */}
            <div className="permisos-tabla-container">
              {cargando ? (
                <div className="permisos-estado">
                  <div className="permisos-spinner"></div>
                  <span>Cargando usuarios...</span>
                </div>
              ) : error ? (
                <div className="permisos-estado permisos-estado--error">
                  <span>Error: {error}</span>
                  <button onClick={cargarDatos}>Reintentar</button>
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="permisos-estado">
                  <span>No se encontraron usuarios</span>
                </div>
              ) : (
                <table className="permisos-tabla">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Acceso</th>
                      <th className="permisos-th-expand"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((usuario) => (
                      <React.Fragment key={usuario.id}>
                        <tr
                          className={`permisos-fila ${
                            usuarioSeleccionado?.id === usuario.id
                              ? "permisos-fila--seleccionada"
                              : ""
                          } ${
                            usuarioExpandido === usuario.id
                              ? "permisos-fila--expandida"
                              : ""
                          }`}
                          onClick={() => seleccionarUsuario(usuario)}
                        >
                          <td className="permisos-celda-usuario">
                            <div className="permisos-usuario-info">
                              <span className="permisos-usuario-nombre">
                                {usuario.nombre || "Sin nombre"}
                              </span>
                              <span className="permisos-usuario-email">
                                {usuario.email}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`permisos-badge permisos-badge--${usuario.rolGlobal}`}
                            >
                              {usuario.rolNombre}
                            </span>
                          </td>
                          <td>
                            <span className={`permisos-acceso ${getAccesoClase(usuario)}`}>
                              {getAccesoTexto(usuario)}
                            </span>
                          </td>
                          <td className="permisos-celda-expand">
                            <button
                              type="button"
                              className={`permisos-btn-expand ${
                                usuarioExpandido === usuario.id ? "permisos-btn-expand--activo" : ""
                              }`}
                              onClick={(e) => handleToggleExpand(e, usuario.id)}
                              title={usuarioExpandido === usuario.id ? "Colapsar detalles" : "Ver detalles"}
                            >
                              ▶
                            </button>
                          </td>
                        </tr>
                        {/* Fila expandible con detalles */}
                        {usuarioExpandido === usuario.id && (
                          <tr className="permisos-fila-detalles">
                            <td colSpan="4">
                              {cargandoDetalles ? (
                                <div className="permisos-detalles-cargando">
                                  <div className="permisos-spinner-small"></div>
                                  <span>Cargando detalles...</span>
                                </div>
                              ) : errorDetalles ? (
                                <div className="permisos-detalles-error">
                                  <span>Error: {errorDetalles}</span>
                                </div>
                              ) : (
                                renderDetallesUsuario()
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Panel lateral de edición */}
            {usuarioSeleccionado && (
              <div className="permisos-panel">
                <div className="permisos-panel-header">
                  <h3>Editar Usuario</h3>
                  <button
                    type="button"
                    className="permisos-panel-cerrar"
                    onClick={handleCancelar}
                  >
                    ✕
                  </button>
                </div>

                <div className="permisos-panel-usuario">
                  <span className="permisos-panel-nombre">
                    {usuarioSeleccionado.nombre || "Sin nombre"}
                  </span>
                  <span className="permisos-panel-email">
                    {usuarioSeleccionado.email}
                  </span>
                </div>

                <div className="permisos-panel-contenido">
                  {/* Selector de rol */}
                  <div className="permisos-campo">
                    <label className="permisos-label">Rol Global</label>
                    <select
                      className="permisos-select"
                      value={cambiosPendientes.rolGlobal || ""}
                      onChange={(e) => handleCambioRol(e.target.value)}
                      disabled={guardando}
                    >
                      {rolesDisponibles.map((rol) => (
                        <option key={rol.codigo} value={rol.codigo}>
                          {rol.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Acceso a agentes */}
                  <div className="permisos-campo">
                    <label className="permisos-label">Acceso a Agentes</label>

                    <label className="permisos-checkbox permisos-checkbox--destacado">
                      <input
                        type="checkbox"
                        checked={cambiosPendientes.accesoTotal}
                        onChange={handleToggleAccesoTotal}
                        disabled={guardando}
                      />
                      <span>Acceso a todos los agentes</span>
                    </label>

                    {!cambiosPendientes.accesoTotal && (
                      <div className="permisos-agentes-lista">
                        {agentesDisponibles.length === 0 ? (
                          <span className="permisos-agentes-vacio">
                            No hay agentes disponibles
                          </span>
                        ) : (
                          agentesDisponibles.map((agente) => (
                            <label
                              key={agente.id}
                              className="permisos-checkbox"
                            >
                              <input
                                type="checkbox"
                                checked={cambiosPendientes.agentesIds.includes(
                                  agente.id
                                )}
                                onChange={() => handleToggleAgente(agente.id)}
                                disabled={guardando}
                              />
                              <span>{agente.nombre}</span>
                              {!agente.activo && (
                                <span className="permisos-agente-inactivo">
                                  (inactivo)
                                </span>
                              )}
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="permisos-panel-acciones">
                  <button
                    type="button"
                    className="permisos-btn permisos-btn--cancelar"
                    onClick={handleCancelar}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="permisos-btn permisos-btn--guardar"
                    onClick={handleGuardarUsuario}
                    disabled={guardando || !tieneModificaciones()}
                  >
                    {guardando ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPanelPermisos;
