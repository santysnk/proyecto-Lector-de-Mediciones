// src/paginas/PaginaAlimentadores/componentes/navegacion/BotonGuardarCambios.jsx

import React from "react";
import ReactDOM from "react-dom";
import "./BotonGuardarCambios.css";

/**
 * Overlay de guardado que se muestra sobre toda la pantalla
 */
const OverlayGuardando = () => {
  return ReactDOM.createPortal(
    <div className="guardar-overlay">
      <div className="guardar-overlay__contenido">
        <div className="guardar-overlay__spinner" />
        <span className="guardar-overlay__texto">Guardando cambios...</span>
      </div>
    </div>,
    document.body
  );
};

/**
 * Botón para guardar cambios pendientes en la base de datos.
 * Se activa solo cuando hay diferencias entre el estado local y la BD.
 *
 * @param {boolean} hayCambios - Si hay cambios pendientes por sincronizar
 * @param {boolean} sincronizando - Si está en proceso de sincronización
 * @param {Function} onGuardar - Callback para iniciar la sincronización
 * @param {Function} onDescartar - Callback para descartar cambios (opcional)
 */
const BotonGuardarCambios = ({
  hayCambios,
  sincronizando,
  onGuardar,
  onDescartar,
}) => {
  return (
    <>
      {/* Overlay de guardado */}
      {sincronizando && <OverlayGuardando />}

      <div className="guardar-cambios-container">
        <button
          type="button"
          className={`guardar-cambios-btn ${hayCambios ? "guardar-cambios-btn--activo" : ""} ${sincronizando ? "guardar-cambios-btn--sincronizando" : ""}`}
          onClick={onGuardar}
          disabled={!hayCambios || sincronizando}
          title={
            sincronizando
              ? "Guardando..."
              : hayCambios
                ? "Guardar cambios en la base de datos"
                : "No hay cambios pendientes"
          }
        >
          {sincronizando ? (
            <>
              <span className="guardar-cambios-spinner" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <span className="guardar-cambios-icono">💾</span>
              <span>Guardar</span>
            </>
          )}
        </button>

        {hayCambios && onDescartar && !sincronizando && (
          <button
            type="button"
            className="guardar-cambios-btn-descartar"
            onClick={onDescartar}
            title="Descartar cambios y recargar desde la base de datos"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
};

export default BotonGuardarCambios;
