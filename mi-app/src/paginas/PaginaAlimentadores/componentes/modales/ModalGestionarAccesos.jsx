// src/paginas/PaginaAlimentadores/componentes/modales/ModalGestionarAccesos.jsx
// Modal para gestionar usuarios con acceso a un workspace

import React, { useState, useEffect } from "react";
import "./ModalConfiguracionAlimentador.css"; // estilos base del modal
import "./ModalGestionarAccesos.css";         // estilos específicos
import {
  obtenerPermisosWorkspace,
  agregarPermisoWorkspace,
  actualizarPermisoWorkspace,
  eliminarPermisoWorkspace,
} from "../../../../servicios/apiService";

/**
 * Modal para gestionar los accesos (permisos) de usuarios a un workspace.
 * Permite ver usuarios con acceso, invitar nuevos y cambiar/revocar roles.
 */
const ModalGestionarAccesos = ({
  abierto,
  onCerrar,
  workspaceId,
  workspaceNombre,
  usuarioActualId,
}) => {
  // Estado
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Form de invitación
  const [emailInvitar, setEmailInvitar] = useState("");
  const [rolInvitar, setRolInvitar] = useState("observador");
  const [invitando, setInvitando] = useState(false);
  const [errorInvitar, setErrorInvitar] = useState(null);
  const [exitoInvitar, setExitoInvitar] = useState(null);

  // Roles disponibles para asignar (no incluye superadmin)
  const rolesDisponibles = [
    { codigo: "observador", nombre: "Observador", descripcion: "Solo puede ver datos" },
    { codigo: "operador", nombre: "Operador", descripcion: "Puede operar mediciones" },
    { codigo: "admin", nombre: "Administrador", descripcion: "Puede gestionar el workspace" },
  ];

  // Cargar permisos al abrir
  useEffect(() => {
    if (abierto && workspaceId) {
      cargarPermisos();
    }
  }, [abierto, workspaceId]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!abierto) {
      setEmailInvitar("");
      setRolInvitar("observador");
      setErrorInvitar(null);
      setExitoInvitar(null);
    }
  }, [abierto]);

  const cargarPermisos = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerPermisosWorkspace(workspaceId);
      setPermisos(data);
    } catch (err) {
      console.error("Error cargando permisos:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleInvitar = async (e) => {
    e.preventDefault();
    const email = emailInvitar.trim().toLowerCase();

    if (!email) {
      setErrorInvitar("Ingresa un email");
      return;
    }

    try {
      setInvitando(true);
      setErrorInvitar(null);
      setExitoInvitar(null);

      const nuevoPermiso = await agregarPermisoWorkspace(workspaceId, email, rolInvitar);

      // Agregar a la lista o actualizar si ya existía
      setPermisos(prev => {
        const existe = prev.find(p => p.usuario_id === nuevoPermiso.usuario_id);
        if (existe) {
          return prev.map(p => p.usuario_id === nuevoPermiso.usuario_id ? nuevoPermiso : p);
        }
        return [...prev, nuevoPermiso];
      });

      setEmailInvitar("");
      setExitoInvitar(`Usuario ${email} agregado correctamente`);

      // Limpiar mensaje de éxito después de 3s
      setTimeout(() => setExitoInvitar(null), 3000);
    } catch (err) {
      console.error("Error invitando usuario:", err);
      setErrorInvitar(err.message);
    } finally {
      setInvitando(false);
    }
  };

  const handleCambiarRol = async (permisoId, nuevoRol) => {
    try {
      const actualizado = await actualizarPermisoWorkspace(permisoId, nuevoRol);
      setPermisos(prev => prev.map(p => p.id === permisoId ? actualizado : p));
    } catch (err) {
      console.error("Error actualizando rol:", err);
      setError(err.message);
    }
  };

  const handleEliminarAcceso = async (permisoId, nombreUsuario) => {
    if (!confirm(`¿Eliminar el acceso de ${nombreUsuario} a este workspace?`)) {
      return;
    }

    try {
      await eliminarPermisoWorkspace(permisoId);
      setPermisos(prev => prev.filter(p => p.id !== permisoId));
    } catch (err) {
      console.error("Error eliminando acceso:", err);
      setError(err.message);
    }
  };

  if (!abierto) return null;

  return (
    <div className="alim-modal-overlay">
      <div className="alim-modal modal-accesos">
        {/* Header */}
        <div className="modal-accesos__header">
          <h2>Permisos para Workspace: {workspaceNombre}</h2>
        </div>

        {/* Contenido */}
        <div className="modal-accesos__contenido">
          {/* Sección: Invitar usuario */}
          <div className="modal-accesos__seccion">
            <h3>Invitar Usuario</h3>
            <form className="modal-accesos__form-invitar" onSubmit={handleInvitar}>
              <input
                type="email"
                className="alim-modal-input"
                placeholder="Email del usuario"
                value={emailInvitar}
                onChange={(e) => setEmailInvitar(e.target.value)}
                disabled={invitando}
              />
              <select
                className="alim-modal-select"
                value={rolInvitar}
                onChange={(e) => setRolInvitar(e.target.value)}
                disabled={invitando}
              >
                {rolesDisponibles.map(r => (
                  <option key={r.codigo} value={r.codigo}>
                    {r.nombre}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="modal-accesos__btn-invitar"
                disabled={invitando || !emailInvitar.trim()}
              >
                {invitando ? "Invitando..." : "Invitar"}
              </button>
            </form>

            {errorInvitar && (
              <div className="modal-accesos__mensaje modal-accesos__mensaje--error">
                {errorInvitar}
              </div>
            )}
            {exitoInvitar && (
              <div className="modal-accesos__mensaje modal-accesos__mensaje--exito">
                {exitoInvitar}
              </div>
            )}
          </div>

          {/* Sección: Lista de usuarios */}
          <div className="modal-accesos__seccion">
            <h3>Usuarios con acceso</h3>

            {cargando ? (
              <div className="modal-accesos__cargando">Cargando...</div>
            ) : error ? (
              <div className="modal-accesos__error">
                Error: {error}
                <button onClick={cargarPermisos}>Reintentar</button>
              </div>
            ) : permisos.filter(p => p.usuario_id !== usuarioActualId).length === 0 ? (
              <div className="modal-accesos__vacio">
                No hay otros usuarios con acceso a este workspace.
              </div>
            ) : (
              <ul className="modal-accesos__lista">
                {permisos.filter(p => p.usuario_id !== usuarioActualId).map(permiso => (
                  <li key={permiso.id} className="modal-accesos__usuario">
                    <div className="modal-accesos__usuario-info">
                      <span className="modal-accesos__usuario-icono">👤</span>
                      <div className="modal-accesos__usuario-datos">
                        <span className="modal-accesos__usuario-nombre">
                          {permiso.usuarios?.nombre || "Sin nombre"}
                        </span>
                        <span className="modal-accesos__usuario-email">
                          {permiso.usuarios?.email}
                        </span>
                      </div>
                    </div>

                    <div className="modal-accesos__usuario-acciones">
                      <select
                        className="modal-accesos__select-rol"
                        value={permiso.rol}
                        onChange={(e) => handleCambiarRol(permiso.id, e.target.value)}
                      >
                        {rolesDisponibles.map(r => (
                          <option key={r.codigo} value={r.codigo}>
                            {r.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="modal-accesos__btn-eliminar"
                        onClick={() => handleEliminarAcceso(
                          permiso.id,
                          permiso.usuarios?.nombre || permiso.usuarios?.email
                        )}
                        title="Eliminar acceso"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-accesos__footer">
          <button
            type="button"
            className="alim-modal-btn alim-modal-btn-secondary"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalGestionarAccesos;
