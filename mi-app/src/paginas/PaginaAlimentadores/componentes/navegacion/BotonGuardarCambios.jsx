// src/paginas/PaginaAlimentadores/componentes/navegacion/BotonGuardarCambios.jsx

import React from "react";
import "./BotonGuardarCambios.css";

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
          ✕
        </button>
      )}
    </div>
  );
};

export default BotonGuardarCambios;
