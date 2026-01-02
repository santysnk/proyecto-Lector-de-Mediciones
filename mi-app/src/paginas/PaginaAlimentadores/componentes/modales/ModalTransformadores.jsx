import { useState, useEffect } from "react";
import "./ModalTransformadores.css";

/**
 * Modal para gestionar transformadores de intensidad (TI) y voltaje (TV)
 */
// Configuración de los tipos de transformadores
const TIPOS_CONFIG = {
  TI: {
    nombre: "T.I. (Intensidad)",
    nombreCorto: "T.I.",
    placeholder: "TI 200/1",
    ayudaFormula: "x * 200 / 1000",
    descripcionVacio: "intensidad",
  },
  TV: {
    nombre: "T.V. (Voltaje)",
    nombreCorto: "T.V.",
    placeholder: "TV 33kV",
    ayudaFormula: "x * 33000 / 10000",
    descripcionVacio: "voltaje",
  },
  REL: {
    nombre: "Relación [ x : y ]",
    nombreCorto: "Relación",
    placeholder: "Rel 1:100",
    ayudaFormula: "x * 100",
    descripcionVacio: "relación",
  },
};

const ModalTransformadores = ({
  abierto,
  onCerrar,
  transformadores,
  onCrear,
  onActualizar,
  onEliminar,
  tipoInicial = "TI", // "TI", "TV" o "REL"
}) => {
  const [tipoActivo, setTipoActivo] = useState(tipoInicial);
  const [modoEdicion, setModoEdicion] = useState(null); // null | "crear" | id del transformador
  const [formData, setFormData] = useState({ nombre: "", formula: "" });
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);

  // Actualizar tipo activo cuando cambia tipoInicial
  useEffect(() => {
    if (abierto) {
      setTipoActivo(tipoInicial);
    }
  }, [abierto, tipoInicial]);

  // Resetear estado al cerrar
  useEffect(() => {
    if (!abierto) {
      setModoEdicion(null);
      setFormData({ nombre: "", formula: "" });
      setConfirmandoEliminar(null);
    }
  }, [abierto]);

  if (!abierto) return null;

  const transformadoresFiltrados = transformadores.filter(
    (t) => t.tipo === tipoActivo
  );

  const handleNuevo = () => {
    setModoEdicion("crear");
    setFormData({ nombre: "", formula: "" });
  };

  const handleEditar = (transformador) => {
    setModoEdicion(transformador.id);
    setFormData({
      nombre: transformador.nombre,
      formula: transformador.formula,
    });
  };

  const handleCancelar = () => {
    setModoEdicion(null);
    setFormData({ nombre: "", formula: "" });
  };

  const handleGuardar = () => {
    if (!formData.nombre.trim() || !formData.formula.trim()) return;

    if (modoEdicion === "crear") {
      onCrear({
        tipo: tipoActivo,
        nombre: formData.nombre,
        formula: formData.formula,
      });
    } else {
      onActualizar(modoEdicion, {
        nombre: formData.nombre,
        formula: formData.formula,
      });
    }

    setModoEdicion(null);
    setFormData({ nombre: "", formula: "" });
  };

  const handleEliminar = (id) => {
    if (confirmandoEliminar === id) {
      onEliminar(id);
      setConfirmandoEliminar(null);
    } else {
      setConfirmandoEliminar(id);
    }
  };

  return (
    <div className="modal-transformadores-overlay" onClick={onCerrar}>
      <div
        className="modal-transformadores"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-transformadores-header">
          <h3>Transformadores de Medida</h3>
          <button className="modal-transformadores-cerrar" onClick={onCerrar}>
            ×
          </button>
        </div>

        {/* Tabs TI / TV / REL */}
        <div className="modal-transformadores-tabs">
          {Object.entries(TIPOS_CONFIG).map(([tipo, config]) => (
            <button
              key={tipo}
              className={`modal-transformadores-tab ${tipoActivo === tipo ? "activo" : ""}`}
              onClick={() => setTipoActivo(tipo)}
            >
              {config.nombre}
            </button>
          ))}
        </div>

        <div className="modal-transformadores-contenido">
          {/* Lista de transformadores */}
          <div className="modal-transformadores-lista">
            {transformadoresFiltrados.length === 0 ? (
              <div className="modal-transformadores-vacio">
                No hay transformadores de {TIPOS_CONFIG[tipoActivo].descripcionVacio} configurados
              </div>
            ) : (
              transformadoresFiltrados.map((t) => (
                <div
                  key={t.id}
                  className={`modal-transformadores-item ${modoEdicion === t.id ? "editando" : ""}`}
                >
                  {modoEdicion === t.id ? (
                    // Modo edición inline
                    <div className="modal-transformadores-form-inline">
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        placeholder="Nombre"
                        className="modal-transformadores-input"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={formData.formula}
                        onChange={(e) =>
                          setFormData({ ...formData, formula: e.target.value })
                        }
                        placeholder="Fórmula (ej: x * 200 / 1000)"
                        className="modal-transformadores-input modal-transformadores-input-formula"
                      />
                      <div className="modal-transformadores-item-acciones">
                        <button
                          className="modal-transformadores-btn-guardar"
                          onClick={handleGuardar}
                          disabled={!formData.nombre.trim() || !formData.formula.trim()}
                        >
                          Guardar
                        </button>
                        <button
                          className="modal-transformadores-btn-cancelar"
                          onClick={handleCancelar}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo visualización
                    <>
                      <div className="modal-transformadores-item-info">
                        <span className="modal-transformadores-item-nombre">
                          {t.nombre}
                        </span>
                        <span className="modal-transformadores-item-formula">
                          {t.formula}
                        </span>
                      </div>
                      <div className="modal-transformadores-item-acciones">
                        <button
                          className="modal-transformadores-btn-editar"
                          onClick={() => handleEditar(t)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className={`modal-transformadores-btn-eliminar ${confirmandoEliminar === t.id ? "confirmar" : ""}`}
                          onClick={() => handleEliminar(t.id)}
                          title={confirmandoEliminar === t.id ? "Confirmar eliminación" : "Eliminar"}
                        >
                          {confirmandoEliminar === t.id ? "¿Seguro?" : "🗑️"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}

            {/* Formulario para nuevo transformador */}
            {modoEdicion === "crear" && (
              <div className="modal-transformadores-item editando">
                <div className="modal-transformadores-form-inline">
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    placeholder={`Nombre (ej: ${TIPOS_CONFIG[tipoActivo].placeholder})`}
                    className="modal-transformadores-input"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={formData.formula}
                    onChange={(e) =>
                      setFormData({ ...formData, formula: e.target.value })
                    }
                    placeholder="Fórmula (ej: x * 200 / 1000)"
                    className="modal-transformadores-input modal-transformadores-input-formula"
                  />
                  <div className="modal-transformadores-item-acciones">
                    <button
                      className="modal-transformadores-btn-guardar"
                      onClick={handleGuardar}
                      disabled={!formData.nombre.trim() || !formData.formula.trim()}
                    >
                      Crear
                    </button>
                    <button
                      className="modal-transformadores-btn-cancelar"
                      onClick={handleCancelar}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón agregar */}
          {modoEdicion === null && (
            <button
              className="modal-transformadores-btn-nuevo"
              onClick={handleNuevo}
            >
              + Nuevo {TIPOS_CONFIG[tipoActivo].nombreCorto}
            </button>
          )}

          {/* Ayuda */}
          <div className="modal-transformadores-ayuda">
            <strong>Fórmula:</strong> Use <code>x</code> para representar el valor leído del registro.
            <br />
            Ejemplo: <code>{TIPOS_CONFIG[tipoActivo].ayudaFormula}</code> multiplica el valor por {tipoActivo === "REL" ? "100" : "200"} {tipoActivo !== "REL" && "y divide entre 1000"}.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTransformadores;
