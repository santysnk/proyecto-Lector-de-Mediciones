// src/paginas/PaginaAlimentadores/componentes/navegacion/SelectorConfiguracion.jsx
// Componente para seleccionar y gestionar configuraciones

import React, { useState } from "react";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import "./SelectorConfiguracion.css";

/**
 * Selector dropdown de configuraciones.
 * Permite cambiar entre configuraciones y crear nuevas.
 */
const SelectorConfiguracion = () => {
  const {
    configuraciones,
    configuracionSeleccionada,
    cargando,
    error,
    seleccionarConfiguracion,
    agregarConfiguracion,
    eliminarConfiguracion,
  } = usarContextoConfiguracion();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarFormNueva, setMostrarFormNueva] = useState(false);
  const [nombreNueva, setNombreNueva] = useState("");
  const [creando, setCreando] = useState(false);

  const handleSeleccionar = (id) => {
    seleccionarConfiguracion(id);
    setMenuAbierto(false);
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
      console.error("Error creando configuración:", err);
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar la configuración "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await eliminarConfiguracion(id);
    } catch (err) {
      console.error("Error eliminando configuración:", err);
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

  return (
    <div className="selector-config">
      <button
        type="button"
        className="selector-config__trigger"
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-expanded={menuAbierto}
        aria-haspopup="listbox"
      >
        <span className="selector-config__icono">&#9881;</span>
        <span className="selector-config__nombre">
          {configuracionSeleccionada?.nombre || "Sin configuración"}
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
            {/* Lista de configuraciones */}
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
                      className="selector-config__item-btn"
                      onClick={() => handleSeleccionar(config.id)}
                      role="option"
                      aria-selected={config.id === configuracionSeleccionada?.id}
                    >
                      {config.nombre}
                    </button>
                    {configuraciones.length > 1 && (
                      <button
                        type="button"
                        className="selector-config__eliminar"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminar(config.id, config.nombre);
                        }}
                        title="Eliminar configuración"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="selector-config__vacio">
                No hay configuraciones
              </div>
            )}

            {/* Separador */}
            <div className="selector-config__separador" />

            {/* Botón/Form para crear nueva */}
            {mostrarFormNueva ? (
              <form className="selector-config__form" onSubmit={handleCrearNueva}>
                <input
                  type="text"
                  className="selector-config__input"
                  placeholder="Nombre de la configuración"
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
                className="selector-config__nueva"
                onClick={() => setMostrarFormNueva(true)}
              >
                + Nueva configuración
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SelectorConfiguracion;
