import { useState, useEffect } from "react";
import "./ModalPlantillasRele.css";

// Categorías disponibles para las funcionalidades
const CATEGORIAS = {
  mediciones: { id: "mediciones", nombre: "Mediciones", icono: "📊" },
  estados: { id: "estados", nombre: "Estados y Alarmas", icono: "🚦" },
  sistema: { id: "sistema", nombre: "Sistema", icono: "⚙️" },
};

/**
 * Modal para gestionar plantillas de relés de protección.
 * Permite crear funcionalidades personalizadas con registros individuales.
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
  const [funcionalidades, setFuncionalidades] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [error, setError] = useState("");

  // Estado para agregar nueva funcionalidad
  const [nuevaFunc, setNuevaFunc] = useState({
    nombre: "",
    cantidad: 1,
    categoria: "mediciones",
  });

  // Si se pasa una plantilla para editar, entrar en modo edición
  useEffect(() => {
    if (plantillaEditando && abierto) {
      setModo("editar");
      setPlantillaSeleccionada(plantillaEditando);
      setNombre(plantillaEditando.nombre);
      setDescripcion(plantillaEditando.descripcion || "");
      // Convertir funcionalidades del formato objeto al formato array
      const funcsArray = Object.entries(plantillaEditando.funcionalidades || {}).map(
        ([id, data]) => ({
          id,
          nombre: data.nombre || id,
          habilitado: data.habilitado !== false,
          registros: data.registros || [{ etiqueta: "", valor: data.registro || 0 }],
        })
      );
      setFuncionalidades(funcsArray);
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
    setFuncionalidades([]);
    setPlantillaSeleccionada(null);
    setError("");
    setNuevaFunc({ nombre: "", cantidad: 1, categoria: "mediciones" });
  };

  const iniciarCreacion = () => {
    resetFormulario();
    setModo("crear");
  };

  const iniciarEdicion = (plantilla) => {
    setPlantillaSeleccionada(plantilla);
    setNombre(plantilla.nombre);
    setDescripcion(plantilla.descripcion || "");

    // Convertir funcionalidades del formato objeto al formato array
    const funcsArray = Object.entries(plantilla.funcionalidades || {}).map(
      ([id, data]) => ({
        id,
        nombre: data.nombre || id,
        habilitado: data.habilitado !== false,
        registros: data.registros || [{ etiqueta: "", valor: data.registro || 0 }],
      })
    );
    setFuncionalidades(funcsArray);
    setModo("editar");
  };

  // Generar ID único para funcionalidad
  const generarIdFunc = () => {
    return "func-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Agregar nueva funcionalidad
  const handleAgregarFuncionalidad = () => {
    if (!nuevaFunc.nombre.trim()) {
      setError("Ingresa un nombre para la funcionalidad");
      return;
    }

    const cantidad = parseInt(nuevaFunc.cantidad) || 1;

    // Crear array de registros vacíos según la cantidad
    const registros = Array.from({ length: cantidad }, () => ({
      etiqueta: "",
      valor: 0,
    }));

    const nuevaFuncionalidad = {
      id: generarIdFunc(),
      nombre: nuevaFunc.nombre.trim(),
      categoria: nuevaFunc.categoria,
      habilitado: true,
      registros,
    };

    setFuncionalidades((prev) => [...prev, nuevaFuncionalidad]);
    setNuevaFunc({ nombre: "", cantidad: 1, categoria: nuevaFunc.categoria });
    setError("");
  };

  // Eliminar funcionalidad
  const handleEliminarFuncionalidad = (funcId) => {
    setFuncionalidades((prev) => prev.filter((f) => f.id !== funcId));
  };

  // Toggle habilitar/deshabilitar funcionalidad
  const handleToggleFuncionalidad = (funcId) => {
    setFuncionalidades((prev) =>
      prev.map((f) =>
        f.id === funcId ? { ...f, habilitado: !f.habilitado } : f
      )
    );
  };

  // Cambiar etiqueta de un registro
  const handleCambiarEtiqueta = (funcId, regIndex, valor) => {
    setFuncionalidades((prev) =>
      prev.map((f) => {
        if (f.id !== funcId) return f;
        const nuevosRegistros = [...f.registros];
        nuevosRegistros[regIndex] = { ...nuevosRegistros[regIndex], etiqueta: valor };
        return { ...f, registros: nuevosRegistros };
      })
    );
  };

  // Cambiar valor de un registro
  const handleCambiarValorRegistro = (funcId, regIndex, valor) => {
    setFuncionalidades((prev) =>
      prev.map((f) => {
        if (f.id !== funcId) return f;
        const nuevosRegistros = [...f.registros];
        nuevosRegistros[regIndex] = {
          ...nuevosRegistros[regIndex],
          valor: valor === "" ? "" : parseInt(valor) || 0,
        };
        return { ...f, registros: nuevosRegistros };
      })
    );
  };

  const validarFormulario = () => {
    if (!nombre.trim()) {
      setError("El nombre de la plantilla es requerido");
      return false;
    }

    if (funcionalidades.length === 0) {
      setError("Debes agregar al menos una funcionalidad");
      return false;
    }

    const hayFuncionalidadActiva = funcionalidades.some((f) => f.habilitado);
    if (!hayFuncionalidadActiva) {
      setError("Debe habilitar al menos una funcionalidad");
      return false;
    }

    setError("");
    return true;
  };

  const handleGuardar = () => {
    if (!validarFormulario()) return;

    // Convertir array de funcionalidades a objeto para guardar
    const funcParaGuardar = {};
    funcionalidades.forEach((func) => {
      if (func.habilitado) {
        funcParaGuardar[func.id] = {
          nombre: func.nombre,
          categoria: func.categoria || "mediciones",
          habilitado: true,
          registros: func.registros,
          // Mantener compatibilidad: primer registro como "registro" principal
          registro: func.registros[0]?.valor || 0,
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

  // Contar funcionalidades en una plantilla
  const contarFuncionalidades = (plantilla) => {
    return Object.values(plantilla.funcionalidades || {}).filter(
      (f) => f.habilitado !== false
    ).length;
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
                          {contarFuncionalidades(plantilla)} funcionalidades
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

              {/* Sección para agregar funcionalidad */}
              <div className="modal-plantillas-seccion">
                <h4>Agregar Funcionalidad</h4>
                <div className="modal-plantillas-agregar-func">
                  <div className="modal-plantillas-agregar-row">
                    <div className="modal-plantillas-agregar-campo">
                      <label>Nombre</label>
                      <input
                        type="text"
                        value={nuevaFunc.nombre}
                        onChange={(e) =>
                          setNuevaFunc((prev) => ({ ...prev, nombre: e.target.value }))
                        }
                        placeholder="Ej: Corrientes de Fase"
                      />
                    </div>
                    <div className="modal-plantillas-agregar-campo modal-plantillas-agregar-campo--pequeño">
                      <label>Cant. Reg.</label>
                      <input
                        type="number"
                        value={nuevaFunc.cantidad}
                        onChange={(e) =>
                          setNuevaFunc((prev) => ({
                            ...prev,
                            cantidad: e.target.value,
                          }))
                        }
                        min={1}
                        max={20}
                      />
                    </div>
                    <div className="modal-plantillas-agregar-campo modal-plantillas-agregar-campo--categoria">
                      <label>Categoría</label>
                      <select
                        value={nuevaFunc.categoria}
                        onChange={(e) =>
                          setNuevaFunc((prev) => ({
                            ...prev,
                            categoria: e.target.value,
                          }))
                        }
                      >
                        {Object.values(CATEGORIAS).map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icono} {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="modal-plantillas-btn-agregar"
                      onClick={handleAgregarFuncionalidad}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de funcionalidades agregadas - Agrupadas por categoría */}
              {funcionalidades.length > 0 && (
                <div className="modal-plantillas-seccion">
                  <h4>Funcionalidades ({funcionalidades.length})</h4>

                  {Object.values(CATEGORIAS).map((categoria) => {
                    const funcsDeCategoria = funcionalidades.filter(
                      (f) => (f.categoria || "mediciones") === categoria.id
                    );

                    if (funcsDeCategoria.length === 0) return null;

                    return (
                      <div key={categoria.id} className="modal-plantillas-categoria">
                        <h5>
                          {categoria.icono} {categoria.nombre}
                        </h5>
                        <div className="modal-plantillas-func-lista">
                          {funcsDeCategoria.map((func) => (
                            <div
                              key={func.id}
                              className={`modal-plantillas-func-card ${
                                func.habilitado ? "activo" : "inactivo"
                              }`}
                            >
                              <div className="modal-plantillas-func-header">
                                <label className="modal-plantillas-func-check">
                                  <input
                                    type="checkbox"
                                    checked={func.habilitado}
                                    onChange={() => handleToggleFuncionalidad(func.id)}
                                  />
                                  <span className="modal-plantillas-func-nombre">
                                    {func.nombre}
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  className="modal-plantillas-func-eliminar"
                                  onClick={() => handleEliminarFuncionalidad(func.id)}
                                  title="Eliminar funcionalidad"
                                >
                                  ×
                                </button>
                              </div>

                              {/* Registros individuales */}
                              <div className="modal-plantillas-registros">
                                {func.registros.map((reg, index) => (
                                  <div
                                    key={index}
                                    className="modal-plantillas-registro-item"
                                  >
                                    <input
                                      type="text"
                                      className="modal-plantillas-registro-etiqueta"
                                      value={reg.etiqueta}
                                      onChange={(e) =>
                                        handleCambiarEtiqueta(func.id, index, e.target.value)
                                      }
                                      placeholder={`Etiqueta ${index + 1}`}
                                      disabled={!func.habilitado}
                                    />
                                    <span className="modal-plantillas-registro-separador">→</span>
                                    <input
                                      type="number"
                                      className="modal-plantillas-registro-valor"
                                      value={reg.valor}
                                      onChange={(e) =>
                                        handleCambiarValorRegistro(func.id, index, e.target.value)
                                      }
                                      placeholder={`${137 + index}`}
                                      disabled={!func.habilitado}
                                      min={0}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {funcionalidades.length === 0 && (
                <div className="modal-plantillas-vacio-func">
                  <p>No hay funcionalidades agregadas</p>
                  <p className="modal-plantillas-hint">
                    Usa el formulario de arriba para agregar funcionalidades
                  </p>
                </div>
              )}
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
