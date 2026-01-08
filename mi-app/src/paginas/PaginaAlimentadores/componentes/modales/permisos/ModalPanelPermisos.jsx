// src/paginas/PaginaAlimentadores/componentes/modales/ModalPanelPermisos.jsx
// Modal para gestionar permisos de usuarios y acceso a agentes (solo superadmin)
// Diseño master-detail: Lista de usuarios + Panel de detalles

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import "./ModalPanelPermisos.css";
import {
  listarUsuariosAdmin,
  cambiarRolUsuarioAdmin,
  actualizarAgentesUsuarioAdmin,
  listarAgentesParaPermisos,
  obtenerDetallesUsuarioAdmin,
} from "../../../../../servicios/apiService";

/**
 * Modal para gestionar los permisos de usuarios y su acceso a agentes.
 * Solo visible para superadmins.
 * Diseño: Master-detail (lista usuarios izquierda + detalles derecha)
 * Características: Arrastrable, redimensionable, no se cierra al hacer clic fuera
 */
const ModalPanelPermisos = ({ abierto, onCerrar }) => {
  // Estado principal
  const [usuarios, setUsuarios] = useState([]);
  const [agentesDisponibles, setAgentesDisponibles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Estado de ventana (minimizado/maximizado)
  const [estadoVentana, setEstadoVentana] = useState("normal");

  // Estado para arrastrar
  const [posicion, setPosicion] = useState({ x: null, y: null });
  const [arrastrando, setArrastrando] = useState(false);
  const modalRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Búsqueda y filtrado
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  // Usuario seleccionado para ver detalles
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [detallesUsuario, setDetallesUsuario] = useState(null);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [errorDetalles, setErrorDetalles] = useState(null);

  // Estado de edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  const [guardando, setGuardando] = useState(false);

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
      setDetallesUsuario(null);
      setCambiosPendientes({});
      setModoEdicion(false);
      setError(null);
      setBusqueda("");
      setFiltroRol("todos");
      setEstadoVentana("normal");
      setErrorDetalles(null);
      setPosicion({ x: null, y: null });
    }
  }, [abierto]);

  // ============================================
  // LÓGICA DE ARRASTRAR (DRAG)
  // ============================================
  const handleMouseDownDrag = useCallback((e) => {
    if (e.button !== 0 || estadoVentana === "maximizado") return;
    if (e.target.closest('.permisos-controles')) return;

    const modal = modalRef.current;
    if (!modal) return;

    const rect = modal.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (posicion.x === null) {
      setPosicion({ x: rect.left, y: rect.top });
    }

    setArrastrando(true);
    e.preventDefault();
  }, [estadoVentana, posicion.x]);

  const handleMouseMoveDrag = useCallback((e) => {
    if (!arrastrando) return;

    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

    const modal = modalRef.current;
    if (modal) {
      const maxX = window.innerWidth - modal.offsetWidth;
      const maxY = window.innerHeight - modal.offsetHeight;
      setPosicion({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  }, [arrastrando]);

  const handleMouseUpDrag = useCallback(() => {
    setArrastrando(false);
  }, []);

  useEffect(() => {
    if (arrastrando) {
      window.addEventListener('mousemove', handleMouseMoveDrag);
      window.addEventListener('mouseup', handleMouseUpDrag);
      return () => {
        window.removeEventListener('mousemove', handleMouseMoveDrag);
        window.removeEventListener('mouseup', handleMouseUpDrag);
      };
    }
  }, [arrastrando, handleMouseMoveDrag, handleMouseUpDrag]);

  const handleMinimizar = () => {
    setEstadoVentana(estadoVentana === "minimizado" ? "normal" : "minimizado");
  };

  const handleMaximizar = () => {
    if (estadoVentana === "maximizado") {
      setEstadoVentana("normal");
    } else {
      setEstadoVentana("maximizado");
      setPosicion({ x: null, y: null });
    }
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

  // Seleccionar usuario y cargar sus detalles
  const seleccionarUsuario = async (usuario) => {
    if (usuarioSeleccionado?.id === usuario.id) return;

    setUsuarioSeleccionado(usuario);
    setModoEdicion(false);
    setCambiosPendientes({});
    setCargandoDetalles(true);
    setErrorDetalles(null);
    setDetallesUsuario(null);

    try {
      const detalles = await obtenerDetallesUsuarioAdmin(usuario.id);
      setDetallesUsuario(detalles);
    } catch (err) {
      console.error("Error cargando detalles:", err);
      setErrorDetalles(err.message || "Error al cargar detalles");
    } finally {
      setCargandoDetalles(false);
    }
  };

  // Iniciar modo edición
  const iniciarEdicion = () => {
    if (!usuarioSeleccionado) return;
    setModoEdicion(true);
    setCambiosPendientes({
      rolGlobal: usuarioSeleccionado.rolGlobal,
      accesoTotal: usuarioSeleccionado.permisoAgentes?.accesoTotal || false,
      agentesIds: usuarioSeleccionado.permisoAgentes?.agentes?.map((a) => a.id) || [],
    });
  };

  const handleCambioRol = (nuevoRol) => {
    setCambiosPendientes((prev) => ({ ...prev, rolGlobal: nuevoRol }));
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
      (usuarioSeleccionado.permisoAgentes?.accesoTotal || false) !== cambiosPendientes.accesoTotal;
    const agentesOriginales =
      usuarioSeleccionado.permisoAgentes?.agentes?.map((a) => a.id).sort() || [];
    const agentesNuevos = [...cambiosPendientes.agentesIds].sort();
    const agentesCambio = JSON.stringify(agentesOriginales) !== JSON.stringify(agentesNuevos);

    return rolCambio || accesoTotalCambio || agentesCambio;
  };

  const handleGuardarUsuario = async () => {
    if (!usuarioSeleccionado) return;

    try {
      setGuardando(true);
      setError(null);

      if (usuarioSeleccionado.rolGlobal !== cambiosPendientes.rolGlobal) {
        await cambiarRolUsuarioAdmin(usuarioSeleccionado.id, cambiosPendientes.rolGlobal);
      }

      await actualizarAgentesUsuarioAdmin(
        usuarioSeleccionado.id,
        cambiosPendientes.accesoTotal,
        cambiosPendientes.agentesIds
      );

      await cargarDatos();
      // Recargar detalles del usuario
      const detalles = await obtenerDetallesUsuarioAdmin(usuarioSeleccionado.id);
      setDetallesUsuario(detalles);
      // Actualizar usuario seleccionado con nuevos datos
      const usuarioActualizado = (await listarUsuariosAdmin()).find(u => u.id === usuarioSeleccionado.id);
      if (usuarioActualizado) setUsuarioSeleccionado(usuarioActualizado);

      setModoEdicion(false);
      setCambiosPendientes({});
    } catch (err) {
      console.error("Error guardando usuario:", err);
      setError(err.message || err.detalles || "Error al guardar permisos");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelarEdicion = () => {
    setModoEdicion(false);
    setCambiosPendientes({});
  };

  const getAccesoTexto = (usuario) => {
    if (usuario.permisoAgentes?.accesoTotal) return "Todos";
    const count = usuario.permisoAgentes?.agentes?.length || 0;
    if (count === 0) return "Sin acceso a agentes";
    return `${count} agente${count > 1 ? "s" : ""}`;
  };

  // Agrupar invitados por rol
  const agruparInvitadosPorRol = (invitados) => {
    const grupos = {};
    invitados.forEach((inv) => {
      const rol = inv.rol || "observador";
      if (!grupos[rol]) grupos[rol] = [];
      grupos[rol].push(inv);
    });
    return grupos;
  };

  // Renderizar panel de detalles
  const renderPanelDetalles = () => {
    if (!usuarioSeleccionado) {
      return (
        <div className="permisos-detalle-vacio">
          <span className="permisos-detalle-vacio-icono">👤</span>
          <span>Selecciona un usuario para ver sus detalles</span>
        </div>
      );
    }

    if (cargandoDetalles) {
      return (
        <div className="permisos-detalle-cargando">
          <div className="permisos-spinner"></div>
          <span>Cargando detalles...</span>
        </div>
      );
    }

    if (errorDetalles) {
      return (
        <div className="permisos-detalle-error">
          <span>Error: {errorDetalles}</span>
        </div>
      );
    }

    const { workspacesPropios = [], workspacesComoInvitado = [], resumen = {} } = detallesUsuario || {};

    return (
      <div className="permisos-detalle">
        {/* Header del usuario */}
        <div className="permisos-detalle-header">
          <div className="permisos-detalle-usuario">
            <span className="permisos-detalle-nombre">
              {usuarioSeleccionado.nombre || "Sin nombre"}
            </span>
            <span className="permisos-detalle-email">{usuarioSeleccionado.email}</span>
          </div>
          <div className="permisos-detalle-badges">
            <span className={`permisos-badge permisos-badge--${usuarioSeleccionado.rolGlobal}`}>
              {usuarioSeleccionado.rolNombre}
            </span>
            <span className="permisos-detalle-acceso">
              {getAccesoTexto(usuarioSeleccionado)}
            </span>
          </div>
          {!modoEdicion && (
            <button
              type="button"
              className="permisos-btn-editar"
              onClick={iniciarEdicion}
            >
              Editar permisos
            </button>
          )}
        </div>

        {/* Modo edición */}
        {modoEdicion && (
          <div className="permisos-detalle-edicion">
            <h4>Editar Permisos</h4>

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
                    <span className="permisos-agentes-vacio">No hay agentes disponibles</span>
                  ) : (
                    agentesDisponibles.map((agente) => (
                      <label key={agente.id} className="permisos-checkbox">
                        <input
                          type="checkbox"
                          checked={cambiosPendientes.agentesIds.includes(agente.id)}
                          onChange={() => handleToggleAgente(agente.id)}
                          disabled={guardando}
                        />
                        <span>{agente.nombre}</span>
                        {!agente.activo && <span className="permisos-agente-inactivo">(inactivo)</span>}
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="permisos-edicion-acciones">
              <button
                type="button"
                className="permisos-btn permisos-btn--cancelar"
                onClick={handleCancelarEdicion}
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

        {/* Resumen de estadísticas */}
        {!modoEdicion && detallesUsuario && (
          <>
            <div className="permisos-detalle-stats">
              <div className="permisos-stat-item">
                <span className="permisos-stat-numero">{resumen.totalWorkspacesPropios ?? workspacesPropios.length}</span>
                <span className="permisos-stat-label">Workspaces propios</span>
              </div>
              <div className="permisos-stat-item">
                <span className="permisos-stat-numero">{resumen.totalPuestos ?? 0}</span>
                <span className="permisos-stat-label">Puestos totales</span>
              </div>
              <div className="permisos-stat-item">
                <span className="permisos-stat-numero">{resumen.totalWorkspacesInvitado ?? workspacesComoInvitado.length}</span>
                <span className="permisos-stat-label">Como invitado</span>
              </div>
            </div>

            {/* Contenido de workspaces */}
            <div className="permisos-detalle-contenido">
              {/* Workspaces propios */}
              {workspacesPropios.length > 0 && (
                <div className="permisos-seccion">
                  <h4 className="permisos-seccion-titulo">Workspaces Propios</h4>
                  <div className="permisos-workspaces-grid">
                    {workspacesPropios.map((ws) => {
                      const invitadosAgrupados = agruparInvitadosPorRol(ws.invitados || []);
                      return (
                        <div key={ws.id} className="permisos-workspace-card">
                          <div className="permisos-workspace-header">
                            <span className="permisos-workspace-nombre">{ws.nombre}</span>
                            <span className="permisos-workspace-puestos">
                              {ws.cantidadPuestos} puesto{ws.cantidadPuestos !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Agentes */}
                          <div className="permisos-workspace-row">
                            <span className="permisos-workspace-label">Agentes:</span>
                            {ws.agentes.length === 0 ? (
                              <span className="permisos-workspace-vacio">Sin agente</span>
                            ) : (
                              <div className="permisos-workspace-chips">
                                {ws.agentes.map((a) => (
                                  <span
                                    key={a.id}
                                    className={`permisos-chip ${!a.activo ? "permisos-chip--inactivo" : ""}`}
                                  >
                                    {a.nombre}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Invitados agrupados por rol */}
                          <div className="permisos-workspace-row">
                            <span className="permisos-workspace-label">Invitados:</span>
                            {ws.invitados.length === 0 ? (
                              <span className="permisos-workspace-vacio">Sin invitados</span>
                            ) : (
                              <div className="permisos-invitados-grupos">
                                {Object.entries(invitadosAgrupados).map(([rol, invs]) => (
                                  <div key={rol} className="permisos-invitados-grupo">
                                    <span className={`permisos-rol-badge permisos-rol-badge--${rol}`}>
                                      {rol.toUpperCase()} ({invs.length})
                                    </span>
                                    <span className="permisos-invitados-nombres">
                                      {invs.map((inv) => inv.nombre || inv.email).join(", ")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Workspaces como invitado */}
              {workspacesComoInvitado.length > 0 && (
                <div className="permisos-seccion">
                  <h4 className="permisos-seccion-titulo">Acceso como Invitado</h4>
                  <div className="permisos-workspaces-grid">
                    {workspacesComoInvitado.map((ws) => (
                      <div key={ws.id} className="permisos-workspace-card permisos-workspace-card--invitado">
                        <div className="permisos-workspace-header">
                          <span className="permisos-workspace-nombre">{ws.nombre}</span>
                          <span className={`permisos-rol-badge permisos-rol-badge--${ws.rol}`}>
                            {ws.rol?.toUpperCase()}
                          </span>
                        </div>
                        <div className="permisos-workspace-row">
                          <span className="permisos-workspace-label">Propietario:</span>
                          <span className="permisos-workspace-propietario">
                            {ws.propietario?.nombre || ws.propietario?.email || "Desconocido"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sin datos */}
              {workspacesPropios.length === 0 && workspacesComoInvitado.length === 0 && (
                <div className="permisos-detalle-sin-datos">
                  Este usuario no tiene workspaces propios ni acceso como invitado.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  if (!abierto) return null;

  const getModalClase = () => {
    let clase = "permisos-modal";
    if (estadoVentana === "minimizado") clase += " permisos-modal--minimizado";
    if (estadoVentana === "maximizado") clase += " permisos-modal--maximizado";
    if (arrastrando) clase += " permisos-modal--arrastrando";
    return clase;
  };

  const getModalEstilo = () => {
    if (estadoVentana === "maximizado") {
      return { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" };
    }
    if (estadoVentana === "minimizado") {
      return { position: "fixed", bottom: "1rem", left: "1rem" };
    }
    if (posicion.x !== null && posicion.y !== null) {
      return { position: "fixed", top: posicion.y, left: posicion.x };
    }
    return {};
  };

  const getOverlayClase = () => {
    let clase = "permisos-overlay";
    if (estadoVentana === "minimizado") clase += " permisos-overlay--minimizado";
    if (estadoVentana === "maximizado") clase += " permisos-overlay--maximizado";
    return clase;
  };

  return (
    <div className={getOverlayClase()}>
      <div
        ref={modalRef}
        className={getModalClase()}
        style={getModalEstilo()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="permisos-header"
          onMouseDown={handleMouseDownDrag}
          onDoubleClick={handleMaximizar}
          style={{ cursor: estadoVentana === "maximizado" ? "default" : "move" }}
        >
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

        {/* Contenido principal - Master Detail */}
        <div className="permisos-content">
          {/* Panel izquierdo - Lista de usuarios */}
          <div className="permisos-master">
            {/* Búsqueda y filtros */}
            <div className="permisos-master-toolbar">
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="permisos-input-busqueda"
              />
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="permisos-select-filtro"
              >
                <option value="todos">Todos</option>
                <option value="admin">Admin</option>
                <option value="operador">Operador</option>
                <option value="observador">Observador</option>
              </select>
            </div>

            {/* Lista de usuarios */}
            <div className="permisos-usuarios-lista">
              {cargando ? (
                <div className="permisos-estado">
                  <div className="permisos-spinner"></div>
                  <span>Cargando...</span>
                </div>
              ) : error ? (
                <div className="permisos-estado permisos-estado--error">
                  <span>{error}</span>
                  <button onClick={cargarDatos}>Reintentar</button>
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="permisos-estado">
                  <span>No hay usuarios</span>
                </div>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <div
                    key={usuario.id}
                    className={`permisos-usuario-item ${
                      usuarioSeleccionado?.id === usuario.id ? "permisos-usuario-item--activo" : ""
                    }`}
                    onClick={() => seleccionarUsuario(usuario)}
                  >
                    <div className="permisos-usuario-info">
                      <span className="permisos-usuario-nombre">
                        {usuario.nombre || "Sin nombre"}
                      </span>
                      <span className="permisos-usuario-email">{usuario.email}</span>
                    </div>
                    <span className={`permisos-badge-small permisos-badge-small--${usuario.rolGlobal}`}>
                      {usuario.rolGlobal?.substring(0, 3).toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Contador */}
            <div className="permisos-master-footer">
              {usuariosFiltrados.length} de {usuarios.length} usuarios
            </div>
          </div>

          {/* Panel derecho - Detalles */}
          <div className="permisos-detail">
            {renderPanelDetalles()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPanelPermisos;
