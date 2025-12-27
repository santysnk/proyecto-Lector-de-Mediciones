// src/paginas/PaginaAlimentadores/componentes/navegacion/SelectorConfiguracion.jsx
// Componente para seleccionar y gestionar workspaces

import React, { useState, useRef, useEffect } from "react";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import ModalConfirmacion from "../modales/ModalConfirmacion";
import "./SelectorConfiguracion.css";

/**
 * Selector dropdown de workspaces.
 * Permite cambiar entre workspaces y crear nuevos.
 */
const SelectorConfiguracion = ({ onAbrirModalEditarPuestos, onAbrirModalNuevoPuesto, onAbrirModalConfigurarAgente, onAbrirModalGestionarAccesos, onAbrirModalPanelPermisos, puestosLength = 0 }) => {
  const {
    configuraciones,
    configuracionSeleccionada,
    cargando,
    error,
    seleccionarConfiguracion,
    agregarConfiguracion,
    eliminarConfiguracion,
    puedeCrearWorkspaces,
    rolGlobal,
    perfil,
    workspaceDefaultId,
    toggleWorkspaceDefault,
  } = usarContextoConfiguracion();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarFormNueva, setMostrarFormNueva] = useState(false);
  const [nombreNueva, setNombreNueva] = useState("");
  const [creando, setCreando] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

  const hoverTimeoutRef = useRef(null);
  const submenuRef = useRef(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Cerrar submenú cuando se cierra el menú principal
  useEffect(() => {
    if (!menuAbierto) {
      setSubmenuAbierto(false);
    }
  }, [menuAbierto]);

  const handleSubmenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setSubmenuAbierto(true);
    }, 300); // 300ms de delay para abrir
  };

  const handleSubmenuMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setSubmenuAbierto(false);
    }, 200); // 200ms de delay para cerrar
  };

  const handleSubmenuClick = () => {
    setSubmenuAbierto(!submenuAbierto);
  };

  const handleSeleccionar = (id) => {
    seleccionarConfiguracion(id);
    setSubmenuAbierto(false);
    setMenuAbierto(false);
  };

  const handleToggleDefault = async (e, id) => {
    e.stopPropagation(); // Evitar que se seleccione el workspace
    try {
      await toggleWorkspaceDefault(id);
    } catch (err) {
      console.error("Error cambiando workspace default:", err);
    }
  };

  const handleCrearNueva = async (e) => {
    e.preventDefault();
    if (!nombreNueva.trim()) return;

    try {
      setCreando(true);
      await agregarConfiguracion(nombreNueva.trim());
      setNombreNueva("");
      setMostrarFormNueva(false);
      setMenuAbierto(false);
    } catch (err) {
      console.error("Error creando workspace:", err);
    } finally {
      setCreando(false);
    }
  };

  const handleEliminarActivo = () => {
    if (!configuracionSeleccionada) return;
    if (configuraciones.length <= 1) {
      alert("No se puede eliminar el único workspace existente.");
      return;
    }
    // Abrir modal de confirmación
    setModalEliminarAbierto(true);
  };

  const confirmarEliminarWorkspace = async () => {
    try {
      // Encontrar el índice del workspace activo
      const indiceActual = configuraciones.findIndex(c => c.id === configuracionSeleccionada.id);

      // Determinar a qué workspace cambiar: anterior si existe, sino siguiente
      let nuevoWorkspace;
      if (indiceActual > 0) {
        nuevoWorkspace = configuraciones[indiceActual - 1];
      } else {
        nuevoWorkspace = configuraciones[indiceActual + 1];
      }

      // Cambiar al nuevo workspace antes de eliminar
      seleccionarConfiguracion(nuevoWorkspace.id);

      // Eliminar el workspace
      await eliminarConfiguracion(configuracionSeleccionada.id);

      setModalEliminarAbierto(false);
      setMenuAbierto(false);
    } catch (err) {
      console.error("Error eliminando workspace:", err);
    }
  };

  if (cargando) {
    return (
      <div className="selector-config selector-config--cargando">
        <span className="selector-config__spinner"></span>
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="selector-config selector-config--error">
        Error: {error}
      </div>
    );
  }

  // Si no hay workspaces, mostrar estado según permisos del rol
  if (configuraciones.length === 0) {
    // Usuarios sin permiso para crear (operador, observador)
    if (!puedeCrearWorkspaces) {
      return (
        <div className="selector-config">
          <button
            type="button"
            className="selector-config__trigger selector-config__trigger--deshabilitado"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-expanded={menuAbierto}
          >
            <span className="selector-config__nombre">Sin workspace</span>
            <span className="selector-config__flecha">{menuAbierto ? "▲" : "▼"}</span>
          </button>

          {menuAbierto && (
            <>
              <div
                className="selector-config__overlay"
                onClick={() => setMenuAbierto(false)}
              />
              <div className="selector-config__menu">
                {/* Header con usuario y rol */}
                {perfil && (
                  <div className="selector-config__usuario-header">
                    <span className="selector-config__usuario-nombre">{perfil.nombre || perfil.email}</span>
                    <span className="selector-config__usuario-rol">{perfil.roles?.nombre || rolGlobal}</span>
                  </div>
                )}
                <div className="selector-config__vacio-mensaje selector-config__vacio-mensaje--info">
                  No tienes workspaces asignados.
                  <br />
                  <small>Contacta a un administrador para ser invitado a un workspace.</small>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    // Usuarios con permiso para crear (superadmin, admin)
    return (
      <div className="selector-config">
        <button
          type="button"
          className="selector-config__trigger selector-config__trigger--crear"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-expanded={menuAbierto}
        >
          <span className="selector-config__nombre">+ Crear Workspace</span>
        </button>

        {menuAbierto && (
          <>
            <div
              className="selector-config__overlay"
              onClick={() => {
                setMenuAbierto(false);
                setMostrarFormNueva(false);
              }}
            />
            <div className="selector-config__menu">
              {/* Header con usuario y rol */}
              {perfil && (
                <div className="selector-config__usuario-header">
                  <span className="selector-config__usuario-nombre">{perfil.nombre || perfil.email}</span>
                  <span className="selector-config__usuario-rol">{perfil.roles?.nombre || rolGlobal}</span>
                </div>
              )}
              <div className="selector-config__vacio-mensaje">
                No tienes workspaces asignados.
                <br />
                Crea uno para empezar.
              </div>
              {mostrarFormNueva ? (
                <form className="selector-config__form" onSubmit={handleCrearNueva}>
                  <input
                    type="text"
                    className="selector-config__input"
                    placeholder="Nombre del workspace"
                    value={nombreNueva}
                    onChange={(e) => setNombreNueva(e.target.value)}
                    autoFocus
                    disabled={creando}
                  />
                  <div className="selector-config__form-btns">
                    <button
                      type="button"
                      className="selector-config__btn-cancelar"
                      onClick={() => {
                        setMostrarFormNueva(false);
                        setNombreNueva("");
                      }}
                      disabled={creando}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="selector-config__btn-crear"
                      disabled={!nombreNueva.trim() || creando}
                    >
                      {creando ? "Creando..." : "Crear"}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="selector-config__nueva selector-config__nueva--destacado"
                  onClick={() => setMostrarFormNueva(true)}
                >
                  + Crear mi primer workspace
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="selector-config">
      <button
        type="button"
        className="selector-config__trigger"
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-expanded={menuAbierto}
        aria-haspopup="listbox"
      >
        <span className="selector-config__nombre">
          {configuracionSeleccionada?.nombre || "Sin workspace"}
        </span>
        <span className="selector-config__flecha">{menuAbierto ? "▲" : "▼"}</span>
      </button>

      {menuAbierto && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div
            className="selector-config__overlay"
            onClick={() => {
              setMenuAbierto(false);
              setMostrarFormNueva(false);
            }}
          />

          <div className="selector-config__menu" role="listbox">
            {/* Header con usuario y roles (global + workspace) */}
            {perfil && (
              <div className="selector-config__usuario-header">
                {/* Nombre + Rol global en la misma línea */}
                <div className="selector-config__usuario-linea">
                  <span className="selector-config__usuario-nombre">{perfil.nombre || perfil.email}</span>
                  <span className="selector-config__rol-global">
                    [ <svg className="selector-config__rol-icono" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    {(() => {
                      const nombresRol = {
                        'superadmin': 'SuperAdmin',
                        'admin': 'Admin',
                        'operador': 'Operador',
                        'observador': 'Observador',
                      };
                      return nombresRol[rolGlobal] || 'Observador';
                    })()} ]
                  </span>
                </div>
                {/* Rol en workspace (solo si es invitado) */}
                {(() => {
                  const rolEnWs = configuracionSeleccionada?.rol;
                  const esCreador = configuracionSeleccionada?.esCreador;

                  if (esCreador === false && rolEnWs) {
                    const nombresRol = {
                      'admin': 'Admin',
                      'operador': 'Operador',
                      'observador': 'Observador',
                    };
                    return (
                      <span className="selector-config__rol-workspace">
                        Rol en Workspace: {nombresRol[rolEnWs] || 'Observador'}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Opción Workspaces con submenú */}
            <div
              className="selector-config__submenu-container"
              ref={submenuRef}
              onMouseEnter={handleSubmenuMouseEnter}
              onMouseLeave={handleSubmenuMouseLeave}
            >
              <button
                type="button"
                className={`selector-config__submenu-trigger ${submenuAbierto ? 'selector-config__submenu-trigger--activo' : ''}`}
                onClick={handleSubmenuClick}
              >
                <span className={`selector-config__submenu-flecha ${submenuAbierto ? 'selector-config__submenu-flecha--abierto' : ''}`}>▼</span>
                <span>Workspace</span>
              </button>

              {/* Submenú de workspaces */}
              {submenuAbierto && (
                <div
                  className="selector-config__submenu"
                  onMouseEnter={handleSubmenuMouseEnter}
                  onMouseLeave={handleSubmenuMouseLeave}
                >
                  {configuraciones.length > 0 ? (
                    <ul className="selector-config__lista">
                      {configuraciones.map((config) => (
                        <li
                          key={config.id}
                          className={`selector-config__item ${
                            config.id === configuracionSeleccionada?.id
                              ? "selector-config__item--activo"
                              : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="selector-config__default-btn"
                            onClick={(e) => handleToggleDefault(e, config.id)}
                            title={config.id === workspaceDefaultId ? "Quitar como default" : "Establecer como default"}
                          >
                            {config.id === workspaceDefaultId ? "★" : "☆"}
                          </button>
                          <button
                            type="button"
                            className="selector-config__item-btn"
                            onClick={() => handleSeleccionar(config.id)}
                            role="option"
                            aria-selected={config.id === configuracionSeleccionada?.id}
                          >
                            <span className="selector-config__item-nombre">
                              {config.nombre}
                              {!config.esCreador && <em className="selector-config__item-invitado">(invitado)</em>}
                            </span>
                            {!config.esCreador && (
                              <span className="selector-config__item-rol">
                                <em>rol: {config.rol || 'observador'}</em>
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="selector-config__vacio">
                      No hay workspaces
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Separador */}
            <div className="selector-config__separador" />

            {/* Botón/Form para crear nuevo */}
            {mostrarFormNueva ? (
              <form className="selector-config__form" onSubmit={handleCrearNueva}>
                <input
                  type="text"
                  className="selector-config__input"
                  placeholder="Nombre del workspace"
                  value={nombreNueva}
                  onChange={(e) => setNombreNueva(e.target.value)}
                  autoFocus
                  disabled={creando}
                />
                <div className="selector-config__form-btns">
                  <button
                    type="button"
                    className="selector-config__btn-cancelar"
                    onClick={() => {
                      setMostrarFormNueva(false);
                      setNombreNueva("");
                    }}
                    disabled={creando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="selector-config__btn-crear"
                    disabled={!nombreNueva.trim() || creando}
                  >
                    {creando ? "Creando..." : "Crear"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/*
                  Permisos en el menú:
                  - rolGlobal: rol global del usuario en el sistema (superadmin, admin, operador, observador)
                  - configuracionSeleccionada?.rol: rol del usuario EN ESTE WORKSPACE específico
                  - esAdminEnWorkspace: true si es superadmin global O tiene rol admin en este workspace
                */}
                {(() => {
                  const rolEnWorkspace = configuracionSeleccionada?.rol;
                  const esAdminEnWorkspace = rolGlobal === 'superadmin' || rolEnWorkspace === 'admin';
                  const esOperadorEnWorkspace = esAdminEnWorkspace || rolEnWorkspace === 'operador';

                  return (
                    <>
                      {/* Opción gestionar accesos (solo admin en workspace o creador) */}
                      {(esAdminEnWorkspace || configuracionSeleccionada?.esCreador) && (
                        <button
                          type="button"
                          className="selector-config__opcion-secundaria"
                          onClick={() => {
                            setMenuAbierto(false);
                            onAbrirModalGestionarAccesos?.();
                          }}
                        >
                          <svg className="selector-config__opcion-icono-svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                          </svg>
                          Gestionar Accesos
                        </button>
                      )}

                      {/* Opción nuevo puesto (solo admin en workspace) */}
                      {esAdminEnWorkspace && (
                        <button
                          type="button"
                          className="selector-config__opcion-secundaria"
                          onClick={() => {
                            setMenuAbierto(false);
                            onAbrirModalNuevoPuesto?.();
                          }}
                        >
                          <span className="selector-config__opcion-icono">+</span>
                          Nuevo puesto
                        </button>
                      )}

                      {/* Opción editar puestos (admin u operador en workspace) */}
                      {esOperadorEnWorkspace && (
                        <button
                          type="button"
                          className="selector-config__opcion-secundaria"
                          onClick={() => {
                            setMenuAbierto(false);
                            onAbrirModalEditarPuestos?.();
                          }}
                          disabled={puestosLength === 0}
                        >
                          <span className="selector-config__opcion-icono">✎</span>
                          Editar puestos
                        </button>
                      )}

                      {/* Opción configurar agente (solo admin en workspace) */}
                      {esAdminEnWorkspace && (
                        <button
                          type="button"
                          className="selector-config__opcion-secundaria"
                          onClick={() => {
                            setMenuAbierto(false);
                            onAbrirModalConfigurarAgente?.();
                          }}
                        >
                          <span className="selector-config__opcion-icono">⚙</span>
                          Configurar Agente
                        </button>
                      )}
                    </>
                  );
                })()}

                {/* Opción panel de permisos (solo superadmin GLOBAL) */}
                {rolGlobal === 'superadmin' && (
                  <button
                    type="button"
                    className="selector-config__opcion-secundaria"
                    onClick={() => {
                      setMenuAbierto(false);
                      onAbrirModalPanelPermisos?.();
                    }}
                  >
                    <span className="selector-config__opcion-icono">🔐</span>
                    Panel de Permisos
                  </button>
                )}

                {/* Opción eliminar workspace activo (solo si hay más de uno y es creador/admin) */}
                {configuraciones.length > 1 && configuracionSeleccionada?.esCreador && (
                  <button
                    type="button"
                    className="selector-config__eliminar-activo"
                    onClick={handleEliminarActivo}
                  >
                    <span className="selector-config__eliminar-icono">🗑</span>
                    Eliminar workspace
                  </button>
                )}

                {/* Solo mostrar botón de crear si tiene permisos */}
                {puedeCrearWorkspaces && (
                  <button
                    type="button"
                    className="selector-config__nueva"
                    onClick={() => setMostrarFormNueva(true)}
                  >
                    + Nuevo workspace
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Modal de confirmación para eliminar workspace */}
      <ModalConfirmacion
        abierto={modalEliminarAbierto}
        titulo="Eliminar workspace"
        mensaje={`¿Estás seguro de que deseas eliminar el workspace "${configuracionSeleccionada?.nombre}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        peligroso={true}
        onConfirmar={confirmarEliminarWorkspace}
        onCancelar={() => setModalEliminarAbierto(false)}
      />
    </div>
  );
};

export default SelectorConfiguracion;
