import { useState, useEffect, useRef } from "react";
import {
  SEVERIDADES_DISPONIBLES,
  PLANTILLAS_ETIQUETAS_LEDS
} from "../../utilidades/interpreteRegistrosREF615";
import { useTransformadores } from "../../hooks/useTransformadores";
import "./ModalPlantillasRele.css";

/**
 * Dropdown personalizado para seleccionar TI/TV/Relación
 * Con líneas divisorias degradadas y fórmula en input readonly
 * Usa posición fixed para evitar ser cortado por el modal
 */
const DropdownTransformador = ({
  value,
  onChange,
  disabled,
  tis,
  tvs,
  relaciones = []
}) => {
  const [abierto, setAbierto] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Calcular posición del menú cuando se abre
  useEffect(() => {
    if (abierto && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = 500; // altura máxima aproximada
      const viewportHeight = window.innerHeight;

      // Posición a la derecha del trigger
      let left = rect.right + 8;

      // Centrar verticalmente respecto al trigger
      let top = rect.top + (rect.height / 2) - (menuHeight / 2);

      // Ajustar si se sale por arriba
      if (top < 10) top = 10;

      // Ajustar si se sale por abajo
      if (top + menuHeight > viewportHeight - 10) {
        top = viewportHeight - menuHeight - 10;
      }

      // Si no cabe a la derecha, ponerlo a la izquierda
      if (left + 300 > window.innerWidth) {
        left = rect.left - 308;
      }

      setMenuPos({ top, left });
    }
  }, [abierto]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setAbierto(false);
      }
    };
    if (abierto) {
      document.addEventListener("mousedown", handleClickFuera);
    }
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [abierto]);

  // Encontrar el transformador seleccionado
  const transformadorSeleccionado = value
    ? [...tis, ...tvs, ...relaciones].find(t => t.id === value)
    : null;

  const handleSeleccionar = (id) => {
    onChange(id);
    setAbierto(false);
  };

  return (
    <div
      className={`dropdown-transformador ${disabled ? "disabled" : ""}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className="dropdown-transformador-trigger"
        onClick={() => !disabled && setAbierto(!abierto)}
        disabled={disabled}
        ref={triggerRef}
      >
        {transformadorSeleccionado ? (
          <>
            <span className="dropdown-transformador-nombre">{transformadorSeleccionado.nombre}</span>
            <input
              type="text"
              className="dropdown-transformador-formula"
              value={transformadorSeleccionado.formula}
              readOnly
              tabIndex={-1}
            />
          </>
        ) : (
          <span className="dropdown-transformador-texto">Sin TI / TV</span>
        )}
        <span className="dropdown-transformador-chevron">{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <div
          className="dropdown-transformador-menu dropdown-transformador-menu--fixed"
          style={{ top: menuPos.top, left: menuPos.left }}
          ref={menuRef}
        >
          {/* Opción: Sin TI/TV */}
          <div
            className={`dropdown-transformador-opcion ${!value ? "seleccionado" : ""}`}
            onClick={() => handleSeleccionar("")}
          >
            <span className="dropdown-transformador-nombre">Sin TI / TV</span>
          </div>

          {/* Línea divisoria después de Sin TI/TV si hay TIs */}
          {tis.length > 0 && <div className="dropdown-transformador-divider" />}

          {/* TIs */}
          {tis.map((t) => (
            <div
              key={t.id}
              className={`dropdown-transformador-opcion ${value === t.id ? "seleccionado" : ""}`}
              onClick={() => handleSeleccionar(t.id)}
            >
              <span className="dropdown-transformador-nombre">{t.nombre}</span>
              <input
                type="text"
                className="dropdown-transformador-formula"
                value={t.formula}
                readOnly
                tabIndex={-1}
              />
            </div>
          ))}

          {/* Línea divisoria entre TIs y TVs */}
          {tis.length > 0 && tvs.length > 0 && <div className="dropdown-transformador-divider" />}

          {/* TVs */}
          {tvs.map((t) => (
            <div
              key={t.id}
              className={`dropdown-transformador-opcion ${value === t.id ? "seleccionado" : ""}`}
              onClick={() => handleSeleccionar(t.id)}
            >
              <span className="dropdown-transformador-nombre">{t.nombre}</span>
              <input
                type="text"
                className="dropdown-transformador-formula"
                value={t.formula}
                readOnly
                tabIndex={-1}
              />
            </div>
          ))}

          {/* Línea divisoria entre TVs y Relaciones */}
          {(tis.length > 0 || tvs.length > 0) && relaciones.length > 0 && <div className="dropdown-transformador-divider" />}

          {/* Relaciones */}
          {relaciones.map((t) => (
            <div
              key={t.id}
              className={`dropdown-transformador-opcion ${value === t.id ? "seleccionado" : ""}`}
              onClick={() => handleSeleccionar(t.id)}
            >
              <span className="dropdown-transformador-nombre">{t.nombre}</span>
              <input
                type="text"
                className="dropdown-transformador-formula"
                value={t.formula}
                readOnly
                tabIndex={-1}
              />
            </div>
          ))}

          {/* Mensaje si no hay transformadores */}
          {tis.length === 0 && tvs.length === 0 && relaciones.length === 0 && (
            <div className="dropdown-transformador-vacio">
              No hay TI/TV/Relaciones configurados
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Categorías disponibles para las funcionalidades
const CATEGORIAS = {
  mediciones: { id: "mediciones", nombre: "Mediciones", icono: "📊" },
  estados: { id: "estados", nombre: "Estados y Alarmas", icono: "🚦" },
  sistema: { id: "sistema", nombre: "Sistema", icono: "⚙️" },
};

// Clave para guardar plantillas de etiquetas personalizadas en localStorage
const STORAGE_KEY_PLANTILLAS_ETIQUETAS = "plantillasEtiquetasLeds";

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
  // Hook de transformadores
  const { obtenerTIs, obtenerTVs, obtenerRelaciones, recargar: recargarTransformadores } = useTransformadores();

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

  // Estado para etiquetas de bits (LEDs del panel frontal)
  // Formato: { [bit]: { texto: "Arranque I>", severidad: "warning" } }
  const [etiquetasBits, setEtiquetasBits] = useState({});
  const [seccionEtiquetasAbierta, setSeccionEtiquetasAbierta] = useState(false);

  // Estado para modo de creación de plantilla de etiquetas personalizada
  const [modoNuevaPlantillaEtiquetas, setModoNuevaPlantillaEtiquetas] = useState(false);
  const [nombreNuevaPlantillaEtiquetas, setNombreNuevaPlantillaEtiquetas] = useState("");
  const [cantidadBits, setCantidadBits] = useState(1); // Cantidad de filas de bits
  const [plantillasEtiquetasPersonalizadas, setPlantillasEtiquetasPersonalizadas] = useState({});
  // Estado para rastrear la plantilla de etiquetas seleccionada en el combobox
  const [plantillaEtiquetasSeleccionada, setPlantillaEtiquetasSeleccionada] = useState("");

  // Cargar plantillas de etiquetas personalizadas desde localStorage al montar
  useEffect(() => {
    try {
      const guardadas = localStorage.getItem(STORAGE_KEY_PLANTILLAS_ETIQUETAS);
      if (guardadas) {
        setPlantillasEtiquetasPersonalizadas(JSON.parse(guardadas));
      }
    } catch (error) {
      console.error("Error al cargar plantillas de etiquetas:", error);
    }
  }, []);

  // Recargar transformadores cuando el modal se abre
  useEffect(() => {
    if (abierto) {
      recargarTransformadores();
    }
  }, [abierto, recargarTransformadores]);

  // Si se pasa una plantilla para editar, entrar en modo edición
  useEffect(() => {
    if (plantillaEditando && abierto) {
      setModo("editar");
      setPlantillaSeleccionada(plantillaEditando);
      setNombre(plantillaEditando.nombre);
      setDescripcion(plantillaEditando.descripcion || "");
      // Convertir funcionalidades del formato objeto al formato array
      const funcsArray = Object.entries(plantillaEditando.funcionalidades || {}).map(
        ([id, data]) => {
          // Migración: si hay transformadorId a nivel de funcionalidad, aplicarlo a cada registro
          const transformadorIdGrupo = data.transformadorId || null;
          const registrosBase = data.registros || [{ etiqueta: "", valor: data.registro || 0 }];
          const registrosMigrados = registrosBase.map((reg) => ({
            ...reg,
            // Usar transformadorId del registro si existe, sino usar el del grupo (migración)
            transformadorId: reg.transformadorId !== undefined ? reg.transformadorId : transformadorIdGrupo,
          }));
          return {
            id,
            nombre: data.nombre || id,
            habilitado: data.habilitado !== false,
            categoria: data.categoria || "mediciones",
            registros: registrosMigrados,
          };
        }
      );
      setFuncionalidades(funcsArray);
      // Cargar etiquetas de bits si existen
      setEtiquetasBits(plantillaEditando.etiquetasBits || {});
      // Restaurar la plantilla de etiquetas seleccionada
      setPlantillaEtiquetasSeleccionada(plantillaEditando.plantillaEtiquetasId || "");
      // Actualizar cantidad de bits basado en las etiquetas guardadas
      const etiquetasGuardadas = plantillaEditando.etiquetasBits || {};
      if (Object.keys(etiquetasGuardadas).length > 0) {
        const maxBit = Math.max(...Object.keys(etiquetasGuardadas).map(Number));
        setCantidadBits(maxBit + 1);
      }
      // Abrir sección si hay etiquetas configuradas
      if (plantillaEditando.etiquetasBits && Object.keys(plantillaEditando.etiquetasBits).length > 0) {
        setSeccionEtiquetasAbierta(true);
      }
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
    setEtiquetasBits({});
    setSeccionEtiquetasAbierta(false);
    // Reset de creación de plantilla de etiquetas
    setModoNuevaPlantillaEtiquetas(false);
    setNombreNuevaPlantillaEtiquetas("");
    setCantidadBits(1);
    setPlantillaEtiquetasSeleccionada("");
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
      ([id, data]) => {
        // Migración: si hay transformadorId a nivel de funcionalidad, aplicarlo a cada registro
        const transformadorIdGrupo = data.transformadorId || null;
        const registrosBase = data.registros || [{ etiqueta: "", valor: data.registro || 0 }];
        const registrosMigrados = registrosBase.map((reg) => ({
          ...reg,
          // Usar transformadorId del registro si existe, sino usar el del grupo (migración)
          transformadorId: reg.transformadorId !== undefined ? reg.transformadorId : transformadorIdGrupo,
        }));
        return {
          id,
          nombre: data.nombre || id,
          habilitado: data.habilitado !== false,
          categoria: data.categoria || "mediciones",
          registros: registrosMigrados,
        };
      }
    );
    setFuncionalidades(funcsArray);
    // Cargar etiquetas de bits
    setEtiquetasBits(plantilla.etiquetasBits || {});
    // Restaurar la plantilla de etiquetas seleccionada
    setPlantillaEtiquetasSeleccionada(plantilla.plantillaEtiquetasId || "");
    // Actualizar cantidad de bits basado en las etiquetas guardadas
    const etiquetasGuardadas = plantilla.etiquetasBits || {};
    if (Object.keys(etiquetasGuardadas).length > 0) {
      const maxBit = Math.max(...Object.keys(etiquetasGuardadas).map(Number));
      setCantidadBits(maxBit + 1);
    }
    if (plantilla.etiquetasBits && Object.keys(plantilla.etiquetasBits).length > 0) {
      setSeccionEtiquetasAbierta(true);
    }
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

  // Cambiar transformador asociado a una funcionalidad
  // Cambiar transformador de un registro específico
  const handleCambiarTransformadorRegistro = (funcId, registroIndex, transformadorId) => {
    setFuncionalidades((prev) =>
      prev.map((f) => {
        if (f.id !== funcId) return f;
        const nuevosRegistros = f.registros.map((reg, idx) =>
          idx === registroIndex
            ? { ...reg, transformadorId: transformadorId || null }
            : reg
        );
        return { ...f, registros: nuevosRegistros };
      })
    );
  };

  // Aplicar un transformador a todos los registros de una funcionalidad
  const handleAplicarTransformadorATodos = (funcId, transformadorId) => {
    setFuncionalidades((prev) =>
      prev.map((f) => {
        if (f.id !== funcId) return f;
        const nuevosRegistros = f.registros.map((reg) => ({
          ...reg,
          transformadorId: transformadorId || null,
        }));
        return { ...f, registros: nuevosRegistros };
      })
    );
  };

  // Mover funcionalidad hacia arriba
  const handleMoverFuncionalidadArriba = (funcId) => {
    setFuncionalidades((prev) => {
      const index = prev.findIndex((f) => f.id === funcId);
      if (index <= 0) return prev;
      const newArr = [...prev];
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      return newArr;
    });
  };

  // Mover funcionalidad hacia abajo
  const handleMoverFuncionalidadAbajo = (funcId) => {
    setFuncionalidades((prev) => {
      const index = prev.findIndex((f) => f.id === funcId);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newArr = [...prev];
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      return newArr;
    });
  };

  // ============================================
  // FUNCIONES PARA ETIQUETAS DE BITS
  // ============================================

  // Cambiar texto de una etiqueta de bit
  const handleCambiarEtiquetaBit = (bit, texto) => {
    setEtiquetasBits((prev) => ({
      ...prev,
      [bit]: {
        ...prev[bit],
        texto: texto,
        severidad: prev[bit]?.severidad || "info"
      }
    }));
  };

  // Cambiar severidad de una etiqueta de bit
  const handleCambiarSeveridadBit = (bit, severidad) => {
    setEtiquetasBits((prev) => ({
      ...prev,
      [bit]: {
        ...prev[bit],
        texto: prev[bit]?.texto || "",
        severidad: severidad
      }
    }));
  };

  // Aplicar una plantilla predefinida de etiquetas (incluye personalizadas)
  const handleAplicarPlantillaEtiquetas = (tipoPlantilla) => {
    // Primero buscar en plantillas predefinidas
    if (PLANTILLAS_ETIQUETAS_LEDS[tipoPlantilla]) {
      setEtiquetasBits(PLANTILLAS_ETIQUETAS_LEDS[tipoPlantilla].etiquetas);
      setCantidadBits(Object.keys(PLANTILLAS_ETIQUETAS_LEDS[tipoPlantilla].etiquetas).length);
      setModoNuevaPlantillaEtiquetas(false);
      setPlantillaEtiquetasSeleccionada(tipoPlantilla);
      return;
    }
    // Luego buscar en plantillas personalizadas
    if (plantillasEtiquetasPersonalizadas[tipoPlantilla]) {
      setEtiquetasBits(plantillasEtiquetasPersonalizadas[tipoPlantilla].etiquetas);
      setCantidadBits(Object.keys(plantillasEtiquetasPersonalizadas[tipoPlantilla].etiquetas).length);
      setModoNuevaPlantillaEtiquetas(false);
      setPlantillaEtiquetasSeleccionada(tipoPlantilla);
    }
  };

  // Iniciar modo de creación de nueva plantilla de etiquetas
  const handleNuevaPlantillaEtiquetas = () => {
    setModoNuevaPlantillaEtiquetas(true);
    setNombreNuevaPlantillaEtiquetas("");
    setCantidadBits(1);
    setEtiquetasBits({ 0: { texto: "", severidad: "info" } });
  };

  // Cancelar creación de nueva plantilla de etiquetas
  const handleCancelarNuevaPlantillaEtiquetas = () => {
    setModoNuevaPlantillaEtiquetas(false);
    setNombreNuevaPlantillaEtiquetas("");
    setCantidadBits(1);
    setEtiquetasBits({});
  };

  // Agregar una fila de bit
  const handleAgregarFilaBit = () => {
    const nuevoBit = cantidadBits;
    setCantidadBits(nuevoBit + 1);
    setEtiquetasBits((prev) => ({
      ...prev,
      [nuevoBit]: { texto: "", severidad: "info" }
    }));
  };

  // Quitar la última fila de bit
  const handleQuitarFilaBit = () => {
    if (cantidadBits <= 1) return;
    const bitAQuitar = cantidadBits - 1;
    setCantidadBits(bitAQuitar);
    setEtiquetasBits((prev) => {
      const nuevas = { ...prev };
      delete nuevas[bitAQuitar];
      return nuevas;
    });
  };

  // Guardar plantilla de etiquetas personalizada
  const handleGuardarPlantillaEtiquetas = () => {
    if (!nombreNuevaPlantillaEtiquetas.trim()) {
      setError("Ingresa un nombre para la plantilla de etiquetas");
      return;
    }

    // Limpiar etiquetas vacías
    const etiquetasLimpias = {};
    Object.entries(etiquetasBits).forEach(([bit, etiqueta]) => {
      if (etiqueta.texto && etiqueta.texto.trim() !== "") {
        etiquetasLimpias[bit] = {
          texto: etiqueta.texto.trim(),
          severidad: etiqueta.severidad || "info"
        };
      }
    });

    // Generar ID único
    const id = "custom-" + Date.now().toString(36);

    const nuevaPlantilla = {
      nombre: nombreNuevaPlantillaEtiquetas.trim(),
      etiquetas: etiquetasLimpias
    };

    const nuevasPlantillas = {
      ...plantillasEtiquetasPersonalizadas,
      [id]: nuevaPlantilla
    };

    // Guardar en localStorage
    try {
      localStorage.setItem(STORAGE_KEY_PLANTILLAS_ETIQUETAS, JSON.stringify(nuevasPlantillas));
      setPlantillasEtiquetasPersonalizadas(nuevasPlantillas);
      setModoNuevaPlantillaEtiquetas(false);
      setNombreNuevaPlantillaEtiquetas("");
      setError("");
    } catch (error) {
      console.error("Error al guardar plantilla de etiquetas:", error);
      setError("Error al guardar la plantilla");
    }
  };

  // Eliminar plantilla de etiquetas personalizada
  const handleEliminarPlantillaEtiquetas = (id) => {
    const nuevasPlantillas = { ...plantillasEtiquetasPersonalizadas };
    delete nuevasPlantillas[id];

    try {
      localStorage.setItem(STORAGE_KEY_PLANTILLAS_ETIQUETAS, JSON.stringify(nuevasPlantillas));
      setPlantillasEtiquetasPersonalizadas(nuevasPlantillas);
    } catch (error) {
      console.error("Error al eliminar plantilla de etiquetas:", error);
    }
  };

  // Limpiar todas las etiquetas
  const handleLimpiarEtiquetas = () => {
    setEtiquetasBits({});
    setModoNuevaPlantillaEtiquetas(false);
    setCantidadBits(1);
    setPlantillaEtiquetasSeleccionada("");
  };

  // Contar etiquetas configuradas
  const contarEtiquetasConfiguradas = () => {
    return Object.values(etiquetasBits).filter(e => e.texto && e.texto.trim() !== "").length;
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
        // Los registros ya incluyen transformadorId por registro
        funcParaGuardar[func.id] = {
          nombre: func.nombre,
          categoria: func.categoria || "mediciones",
          habilitado: true,
          registros: func.registros, // Cada registro tiene su propio transformadorId
          // Mantener compatibilidad: primer registro como "registro" principal
          registro: func.registros[0]?.valor || 0,
        };
      }
    });

    // Limpiar etiquetas vacías antes de guardar
    const etiquetasLimpias = {};
    Object.entries(etiquetasBits).forEach(([bit, etiqueta]) => {
      if (etiqueta.texto && etiqueta.texto.trim() !== "") {
        etiquetasLimpias[bit] = {
          texto: etiqueta.texto.trim(),
          severidad: etiqueta.severidad || "info"
        };
      }
    });

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      funcionalidades: funcParaGuardar,
      etiquetasBits: etiquetasLimpias,
      plantillaEtiquetasId: plantillaEtiquetasSeleccionada || null,
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

  // Obtener nombre de la plantilla de etiquetas de LEDs
  const obtenerNombrePlantillaEtiquetas = (plantilla) => {
    const idPlantillaEtiquetas = plantilla.plantillaEtiquetasId;
    if (!idPlantillaEtiquetas) return null;

    // Buscar en plantillas predefinidas
    if (PLANTILLAS_ETIQUETAS_LEDS[idPlantillaEtiquetas]) {
      return PLANTILLAS_ETIQUETAS_LEDS[idPlantillaEtiquetas].nombre;
    }

    // Buscar en plantillas personalizadas
    if (plantillasEtiquetasPersonalizadas[idPlantillaEtiquetas]) {
      return plantillasEtiquetasPersonalizadas[idPlantillaEtiquetas].nombre;
    }

    return null;
  };

  if (!abierto) return null;

  return (
    <div className="modal-plantillas-overlay">
      <div className="modal-plantillas-contenido">
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
                          {obtenerNombrePlantillaEtiquetas(plantilla) && (
                            <> · Panel: {obtenerNombrePlantillaEtiquetas(plantilla)}</>
                          )}
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
                                <div className="modal-plantillas-func-acciones">
                                  <button
                                    type="button"
                                    className="modal-plantillas-func-mover"
                                    onClick={() => handleMoverFuncionalidadArriba(func.id)}
                                    title="Mover arriba"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    className="modal-plantillas-func-mover"
                                    onClick={() => handleMoverFuncionalidadAbajo(func.id)}
                                    title="Mover abajo"
                                  >
                                    ▼
                                  </button>
                                  <button
                                    type="button"
                                    className="modal-plantillas-func-eliminar"
                                    onClick={() => handleEliminarFuncionalidad(func.id)}
                                    title="Eliminar funcionalidad"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>

                              {/* Registros individuales con selector de TI/TV por registro */}
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
                                    {/* Selector de TI/TV/Relación por registro - solo para mediciones */}
                                    {categoria.id === "mediciones" && (
                                      <DropdownTransformador
                                        value={reg.transformadorId || ""}
                                        onChange={(id) => handleCambiarTransformadorRegistro(func.id, index, id)}
                                        disabled={!func.habilitado}
                                        tis={obtenerTIs()}
                                        tvs={obtenerTVs()}
                                        relaciones={obtenerRelaciones()}
                                      />
                                    )}
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

              {/* Sección de Etiquetas de Bits (LEDs) */}
              <div className="modal-plantillas-seccion modal-plantillas-seccion-etiquetas">
                <div
                  className="modal-plantillas-seccion-header-colapsable"
                  onClick={() => setSeccionEtiquetasAbierta(!seccionEtiquetasAbierta)}
                >
                  <h4>
                    <span className={`modal-plantillas-chevron ${seccionEtiquetasAbierta ? "abierto" : ""}`}>
                      ▶
                    </span>
                    Etiquetas de LEDs (Registro 172)
                    {contarEtiquetasConfiguradas() > 0 && (
                      <span className="modal-plantillas-badge">
                        {contarEtiquetasConfiguradas()}
                      </span>
                    )}
                  </h4>
                  <span className="modal-plantillas-hint-inline">
                    Define qué significa cada LED del panel frontal
                  </span>
                </div>

                {seccionEtiquetasAbierta && (
                  <div className="modal-plantillas-etiquetas-contenido">
                    {/* Selector de plantilla predefinida o crear nueva */}
                    <div className="modal-plantillas-etiquetas-acciones">
                      <label>Plantilla:</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value === "__nueva__") {
                            handleNuevaPlantillaEtiquetas();
                          } else if (e.target.value) {
                            handleAplicarPlantillaEtiquetas(e.target.value);
                          } else {
                            // Si selecciona "Seleccionar...", limpiar la selección
                            setPlantillaEtiquetasSeleccionada("");
                          }
                        }}
                        value={modoNuevaPlantillaEtiquetas ? "__nueva__" : plantillaEtiquetasSeleccionada}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="__nueva__">+ Nueva plantilla...</option>
                        {/* Plantillas predefinidas */}
                        <optgroup label="Predefinidas">
                          {Object.entries(PLANTILLAS_ETIQUETAS_LEDS).map(([key, plantilla]) => (
                            <option key={key} value={key}>
                              {plantilla.nombre}
                            </option>
                          ))}
                        </optgroup>
                        {/* Plantillas personalizadas */}
                        {Object.keys(plantillasEtiquetasPersonalizadas).length > 0 && (
                          <optgroup label="Mis plantillas">
                            {Object.entries(plantillasEtiquetasPersonalizadas).map(([key, plantilla]) => (
                              <option key={key} value={key}>
                                {plantilla.nombre}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      {contarEtiquetasConfiguradas() > 0 && !modoNuevaPlantillaEtiquetas && (
                        <button
                          type="button"
                          className="modal-plantillas-btn-limpiar"
                          onClick={handleLimpiarEtiquetas}
                        >
                          Limpiar
                        </button>
                      )}
                    </div>

                    {/* Formulario para crear nueva plantilla de etiquetas */}
                    {modoNuevaPlantillaEtiquetas && (
                      <div className="modal-plantillas-nueva-plantilla-etiquetas">
                        <div className="modal-plantillas-nueva-plantilla-header">
                          <input
                            type="text"
                            className="modal-plantillas-nueva-plantilla-nombre"
                            value={nombreNuevaPlantillaEtiquetas}
                            onChange={(e) => setNombreNuevaPlantillaEtiquetas(e.target.value)}
                            placeholder="Nombre de la plantilla..."
                          />
                          <div className="modal-plantillas-nueva-plantilla-botones">
                            <button
                              type="button"
                              className="modal-plantillas-btn-guardar-etiquetas"
                              onClick={handleGuardarPlantillaEtiquetas}
                              title="Guardar plantilla"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              className="modal-plantillas-btn-cancelar-etiquetas"
                              onClick={handleCancelarNuevaPlantillaEtiquetas}
                              title="Cancelar"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lista de bits configurables */}
                    <div className="modal-plantillas-bits-lista">
                      {Array.from({ length: cantidadBits }, (_, bit) => (
                        <div key={bit} className="modal-plantillas-bit-item">
                          <span className="modal-plantillas-bit-numero">Bit {bit}:</span>
                          <input
                            type="text"
                            className="modal-plantillas-bit-etiqueta"
                            value={etiquetasBits[bit]?.texto || ""}
                            onChange={(e) => handleCambiarEtiquetaBit(bit, e.target.value)}
                            placeholder={`LED ${bit + 1} (sin etiqueta)`}
                          />
                          <select
                            className={`modal-plantillas-bit-severidad severidad-${etiquetasBits[bit]?.severidad || "info"}`}
                            value={etiquetasBits[bit]?.severidad || "info"}
                            onChange={(e) => handleCambiarSeveridadBit(bit, e.target.value)}
                          >
                            {SEVERIDADES_DISPONIBLES.map((sev) => (
                              <option key={sev.id} value={sev.id}>
                                {sev.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Botones para agregar/quitar filas (solo en modo nueva plantilla o si hay etiquetas) */}
                    {(modoNuevaPlantillaEtiquetas || contarEtiquetasConfiguradas() > 0) && (
                      <div className="modal-plantillas-bits-acciones">
                        <button
                          type="button"
                          className="modal-plantillas-btn-agregar-bit"
                          onClick={handleAgregarFilaBit}
                          title="Agregar fila"
                        >
                          + Agregar bit
                        </button>
                        {cantidadBits > 1 && (
                          <button
                            type="button"
                            className="modal-plantillas-btn-quitar-bit"
                            onClick={handleQuitarFilaBit}
                            title="Quitar última fila"
                          >
                            − Quitar bit
                          </button>
                        )}
                      </div>
                    )}

                    {/* Lista de plantillas personalizadas guardadas para eliminar */}
                    {Object.keys(plantillasEtiquetasPersonalizadas).length > 0 && !modoNuevaPlantillaEtiquetas && (
                      <div className="modal-plantillas-etiquetas-guardadas">
                        <span className="modal-plantillas-etiquetas-guardadas-label">
                          Mis plantillas guardadas:
                        </span>
                        <div className="modal-plantillas-etiquetas-guardadas-lista">
                          {Object.entries(plantillasEtiquetasPersonalizadas).map(([key, plantilla]) => (
                            <div key={key} className="modal-plantillas-etiqueta-guardada">
                              <span>{plantilla.nombre}</span>
                              <button
                                type="button"
                                className="modal-plantillas-btn-eliminar-etiqueta"
                                onClick={() => handleEliminarPlantillaEtiquetas(key)}
                                title="Eliminar plantilla"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
