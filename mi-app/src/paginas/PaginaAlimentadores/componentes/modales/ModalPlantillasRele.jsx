import { useState, useEffect } from "react";
import {
  FUNCIONALIDADES_DISPONIBLES,
  getFuncionalidadesPorCategoria,
} from "../../constantes/funcionalidadesRele";
import "./ModalPlantillasRele.css";

/**
 * Modal para gestionar plantillas de relés de protección.
 * Permite crear, editar, ver y eliminar plantillas.
 */
const ModalPlantillasRele = ({
  abierto,
  onCerrar,
  plantillas,
  onCrear,
  onActualizar,
  onEliminar,
  plantillaEditando = null,
}) => {
  // Estado del formulario
  const [modo, setModo] = useState("lista"); // "lista" | "crear" | "editar"
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [funcionalidades, setFuncionalidades] = useState({});
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [error, setError] = useState("");

  // Funcionalidades agrupadas por categoría
  const funcionalidadesPorCategoria = getFuncionalidadesPorCategoria();

  // Si se pasa una plantilla para editar, entrar en modo edición
  useEffect(() => {
    if (plantillaEditando && abierto) {
      setModo("editar");
      setPlantillaSeleccionada(plantillaEditando);
      setNombre(plantillaEditando.nombre);
      setDescripcion(plantillaEditando.descripcion || "");
      setFuncionalidades(plantillaEditando.funcionalidades || {});
    }
  }, [plantillaEditando, abierto]);

  // Reset al cerrar
  useEffect(() => {
    if (!abierto) {
      resetFormulario();
    }
  }, [abierto]);

  const resetFormulario = () => {
    setModo("lista");
    setNombre("");
    setDescripcion("");
    setFuncionalidades({});
    setPlantillaSeleccionada(null);
    setError("");
  };

  const iniciarCreacion = () => {
    resetFormulario();
    // Inicializar con todas las funcionalidades con sus valores por defecto
    const funcInicial = {};
    Object.values(FUNCIONALIDADES_DISPONIBLES).forEach((func) => {
      funcInicial[func.id] = {
        habilitado: false,
        registro: func.registroDefault,
      };
    });
    setFuncionalidades(funcInicial);
    setModo("crear");
  };

  const iniciarEdicion = (plantilla) => {
    setPlantillaSeleccionada(plantilla);
    setNombre(plantilla.nombre);
    setDescripcion(plantilla.descripcion || "");

    // Cargar funcionalidades existentes, completando con defaults para las que no existan
    const funcCargadas = {};
    Object.values(FUNCIONALIDADES_DISPONIBLES).forEach((func) => {
      const existente = plantilla.funcionalidades?.[func.id];
      funcCargadas[func.id] = {
        habilitado: existente?.habilitado || false,
        registro: existente?.registro || func.registroDefault,
      };
    });
    setFuncionalidades(funcCargadas);
    setModo("editar");
  };

  const handleToggleFuncionalidad = (funcId) => {
    setFuncionalidades((prev) => ({
      ...prev,
      [funcId]: {
        ...prev[funcId],
        habilitado: !prev[funcId]?.habilitado,
      },
    }));
  };

  const handleCambiarRegistro = (funcId, valor) => {
    setFuncionalidades((prev) => ({
      ...prev,
      [funcId]: {
        ...prev[funcId],
        registro: valor === "" ? "" : parseInt(valor) || 0,
      },
    }));
  };

  const validarFormulario = () => {
    if (!nombre.trim()) {
      setError("El nombre de la plantilla es requerido");
      return false;
    }

    const hayFuncionalidadActiva = Object.values(funcionalidades).some(
      (f) => f.habilitado
    );
    if (!hayFuncionalidadActiva) {
      setError("Debe habilitar al menos una funcionalidad");
      return false;
    }

    setError("");
    return true;
  };

  const handleGuardar = () => {
    if (!validarFormulario()) return;

    // Filtrar solo funcionalidades habilitadas para guardar
    const funcParaGuardar = {};
    Object.entries(funcionalidades).forEach(([id, data]) => {
      if (data.habilitado) {
        funcParaGuardar[id] = {
          habilitado: true,
          registro: data.registro,
        };
      }
    });

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      funcionalidades: funcParaGuardar,
    };

    if (modo === "crear") {
      const nueva = onCrear(datos);
      if (nueva) {
        resetFormulario();
      }
    } else if (modo === "editar" && plantillaSeleccionada) {
      const exito = onActualizar(plantillaSeleccionada.id, datos);
      if (exito) {
        resetFormulario();
      }
    }
  };

  const handleEliminar = (plantilla) => {
    if (
      window.confirm(
        `¿Eliminar la plantilla "${plantilla.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      onEliminar(plantilla.id);
    }
  };

  if (!abierto) return null;

  return (
    <div className="modal-plantillas-overlay" onClick={onCerrar}>
      <div
        className="modal-plantillas-contenido"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-plantillas-header">
          <h3>
            {modo === "lista" && "Gestionar Plantillas"}
            {modo === "crear" && "Nueva Plantilla"}
            {modo === "editar" && "Editar Plantilla"}
          </h3>
          <button className="modal-plantillas-cerrar" onClick={onCerrar}>
            ×
          </button>
        </div>

        {/* Contenido */}
        <div className="modal-plantillas-body">
          {/* MODO LISTA */}
          {modo === "lista" && (
            <>
              <button
                className="modal-plantillas-btn-crear"
                onClick={iniciarCreacion}
              >
                + Nueva Plantilla
              </button>

              {plantillas.length === 0 ? (
                <div className="modal-plantillas-vacio">
                  <span className="modal-plantillas-vacio-icono">📋</span>
                  <p>No hay plantillas creadas</p>
                  <p className="modal-plantillas-hint">
                    Crea una plantilla para empezar a configurar relés
                  </p>
                </div>
              ) : (
                <div className="modal-plantillas-lista">
                  {plantillas.map((plantilla) => (
                    <div key={plantilla.id} className="modal-plantillas-item">
                      <div className="modal-plantillas-item-info">
                        <span className="modal-plantillas-item-nombre">
                          📋 {plantilla.nombre}
                        </span>
                        {plantilla.descripcion && (
                          <span className="modal-plantillas-item-desc">
                            {plantilla.descripcion}
                          </span>
                        )}
                        <span className="modal-plantillas-item-func">
                          {
                            Object.values(plantilla.funcionalidades || {}).filter(
                              (f) => f.habilitado
                            ).length
                          }{" "}
                          funcionalidades
                        </span>
                      </div>
                      <div className="modal-plantillas-item-acciones">
                        <button
                          className="modal-plantillas-btn-editar"
                          onClick={() => iniciarEdicion(plantilla)}
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          className="modal-plantillas-btn-eliminar"
                          onClick={() => handleEliminar(plantilla)}
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* MODO CREAR/EDITAR */}
          {(modo === "crear" || modo === "editar") && (
            <div className="modal-plantillas-formulario">
              {error && (
                <div className="modal-plantillas-error">{error}</div>
              )}

              <div className="modal-plantillas-campo">
                <label>Nombre de la plantilla *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: FE03 - Feeder con Autorecierre"
                />
              </div>

              <div className="modal-plantillas-campo">
                <label>Descripción (opcional)</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Alimentadores sin medición de tensión"
                />
              </div>

              <div className="modal-plantillas-seccion">
                <h4>Funcionalidades disponibles</h4>
                <p className="modal-plantillas-hint">
                  Selecciona qué funcionalidades incluirá esta plantilla
                </p>

                {Object.entries(funcionalidadesPorCategoria).map(
                  ([catId, categoria]) => (
                    <div key={catId} className="modal-plantillas-categoria">
                      <h5>
                        {categoria.icono} {categoria.nombre}
                      </h5>
                      <div className="modal-plantillas-func-lista">
                        {categoria.funcionalidades.map((func) => {
                          const estado = funcionalidades[func.id] || {
                            habilitado: false,
                            registro: func.registroDefault,
                          };
                          return (
                            <div
                              key={func.id}
                              className={`modal-plantillas-func-item ${
                                estado.habilitado ? "activo" : ""
                              }`}
                            >
                              <label className="modal-plantillas-func-check">
                                <input
                                  type="checkbox"
                                  checked={estado.habilitado}
                                  onChange={() =>
                                    handleToggleFuncionalidad(func.id)
                                  }
                                />
                                <span className="modal-plantillas-func-nombre">
                                  {func.nombre}
                                </span>
                              </label>
                              <div className="modal-plantillas-func-registro">
                                <label>Registro:</label>
                                <input
                                  type="number"
                                  value={estado.registro}
                                  onChange={(e) =>
                                    handleCambiarRegistro(func.id, e.target.value)
                                  }
                                  disabled={!estado.habilitado}
                                  min={0}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-plantillas-footer">
          {modo === "lista" ? (
            <button className="modal-plantillas-btn-cerrar" onClick={onCerrar}>
              Cerrar
            </button>
          ) : (
            <>
              <button
                className="modal-plantillas-btn-cancelar"
                onClick={resetFormulario}
              >
                Cancelar
              </button>
              <button
                className="modal-plantillas-btn-guardar"
                onClick={handleGuardar}
              >
                {modo === "crear" ? "Crear Plantilla" : "Guardar Cambios"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalPlantillasRele;
