import React, { useState, useEffect, useRef } from "react";
import { usePlantillasRele } from "../../hooks/usePlantillasRele";
import { useTransformadores } from "../../hooks/useTransformadores";
import { solicitarTestRegistrador, consultarTestRegistrador } from "../../../../servicios/apiService";
import {
  interpretarRegistro,
  categoriaRequiereInterpretacion,
  obtenerClaseTipo
} from "../../utilidades/interpreteRegistrosREF615";
import ModalPlantillasRele from "./ModalPlantillasRele";
import ModalTransformadores from "./ModalTransformadores";
import "./ConfiguracionRele.css";

// Categorías disponibles para las funcionalidades
const CATEGORIAS = {
  mediciones: { id: "mediciones", nombre: "Mediciones", icono: "📊" },
  estados: { id: "estados", nombre: "Estados y Alarmas", icono: "🚦" },
  sistema: { id: "sistema", nombre: "Sistema", icono: "⚙️" },
};

/**
 * Componente simplificado para configurar un registrador de tipo Relé de Protección.
 * Basado en plantillas personalizadas que el usuario crea y gestiona.
 *
 * @param {Object} configuracionInicial - Configuración inicial del relé (para edición)
 * @param {Function} onChange - Callback al cambiar la configuración
 * @param {string} agenteId - ID del agente (para futura integración de test)
 */
const ConfiguracionRele = ({ configuracionInicial, onChange, agenteId }) => {
  // Hook de plantillas
  const {
    plantillas,
    cargando: cargandoPlantillas,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla,
    obtenerPlantilla,
  } = usePlantillasRele();

  // Hook de transformadores
  const {
    transformadores,
    obtenerTIs,
    obtenerTVs,
    obtenerRelaciones,
    obtenerPorId: obtenerTransformadorPorId,
    crearTransformador,
    actualizarTransformador,
    eliminarTransformador,
  } = useTransformadores();

  // Ref para evitar bucle infinito en notificación de cambios
  const configAnteriorRef = useRef(null);
  const inicializadoRef = useRef(false);
  const consolaRef = useRef(null);

  // Estado del modal de plantillas
  const [modalPlantillasAbierto, setModalPlantillasAbierto] = useState(false);
  const [plantillaParaEditar, setPlantillaParaEditar] = useState(null);

  // Estado del modal de transformadores
  const [modalTransformadoresAbierto, setModalTransformadoresAbierto] = useState(false);
  const [tipoTransformadorModal, setTipoTransformadorModal] = useState("TI");

  // Estado del dropdown de transformadores
  const [dropdownTransformadoresAbierto, setDropdownTransformadoresAbierto] = useState(false);
  const dropdownTransformadoresRef = useRef(null);

  // Estado para filas expandidas en la tabla de funcionalidades
  const [filasExpandidas, setFilasExpandidas] = useState(new Set());

  // Estado para el tab activo en funcionalidades
  const [tabFuncionalidadesActivo, setTabFuncionalidadesActivo] = useState("mediciones");

  // Estado de la consola de test
  const [consolaLogs, setConsolaLogs] = useState([]);
  const [ejecutandoTest, setEjecutandoTest] = useState(false);
  const [registrosCrudos, setRegistrosCrudos] = useState(null); // Datos del último test exitoso
  const [consolaWidth, setConsolaWidth] = useState(60); // Porcentaje del ancho de la consola
  const resizerRef = useRef(null);
  const containerRef = useRef(null);

  // Estado del formulario
  const [config, setConfig] = useState({
    plantillaId: "",
    conexion: {
      ip: "",
      puerto: 502,
      unitId: 1,
    },
    registroInicial: 120,
    cantidadRegistros: 80,
    intervalo: 60,
    transformadorTIId: "",
    transformadorTVId: "",
    funcionalidadesActivas: {},
  });

  // Cargar configuración inicial si existe (solo una vez al montar)
  useEffect(() => {
    if (configuracionInicial && !inicializadoRef.current) {
      inicializadoRef.current = true;
      setConfig((prev) => ({
        ...prev,
        plantillaId: configuracionInicial.plantillaId || "",
        conexion: {
          ip: configuracionInicial.conexion?.ip || "",
          puerto: configuracionInicial.conexion?.puerto || 502,
          unitId: configuracionInicial.conexion?.unitId || 1,
        },
        registroInicial: configuracionInicial.registroInicial || 120,
        cantidadRegistros: configuracionInicial.cantidadRegistros || 80,
        intervalo: configuracionInicial.intervalo || 60,
        transformadorTIId: configuracionInicial.transformadorTIId || "",
        transformadorTVId: configuracionInicial.transformadorTVId || "",
        funcionalidadesActivas:
          configuracionInicial.funcionalidadesActivas || {},
      }));
      configAnteriorRef.current = JSON.stringify(configuracionInicial);
    }
  }, [configuracionInicial]);

  // Notificar cambios al padre
  useEffect(() => {
    if (!onChange) return;

    const configActualStr = JSON.stringify(config);

    if (configAnteriorRef.current !== configActualStr) {
      configAnteriorRef.current = configActualStr;
      onChange(config);
    }
  }, [config, onChange]);

  // Obtener la plantilla seleccionada
  const plantillaSeleccionada = config.plantillaId
    ? obtenerPlantilla(config.plantillaId)
    : null;

  // Generar configuración inicial basada en una plantilla
  const generarConfigDesdeePlantilla = (plantilla) => {
    if (!plantilla) return {};

    const funcActivas = {};
    Object.entries(plantilla.funcionalidades || {}).forEach(([funcId, func]) => {
      if (func.habilitado !== false) {
        funcActivas[funcId] = {
          nombre: func.nombre,
          habilitado: true,
          registros: func.registros || [{ etiqueta: "", valor: func.registro || 0 }],
        };
      }
    });

    return funcActivas;
  };

  // Handlers
  const handlePlantillaChange = (e) => {
    const plantillaId = e.target.value;

    if (!plantillaId) {
      setConfig((prev) => ({
        ...prev,
        plantillaId: "",
        funcionalidadesActivas: {},
      }));
      return;
    }

    const plantilla = obtenerPlantilla(plantillaId);
    const funcionalidadesIniciales = generarConfigDesdeePlantilla(plantilla);

    setConfig((prev) => ({
      ...prev,
      plantillaId,
      funcionalidadesActivas: funcionalidadesIniciales,
    }));
  };

  const handleConexionChange = (campo, valor) => {
    setConfig((prev) => ({
      ...prev,
      conexion: {
        ...prev.conexion,
        [campo]: valor,
      },
    }));
  };

  const handleRegistroInicialChange = (valor) => {
    setConfig((prev) => ({
      ...prev,
      registroInicial: valor === "" ? "" : parseInt(valor) || 0,
    }));
  };

  const handleCantidadRegistrosChange = (valor) => {
    setConfig((prev) => ({
      ...prev,
      cantidadRegistros: valor === "" ? "" : parseInt(valor) || 0,
    }));
  };

  const handleIntervaloChange = (valor) => {
    setConfig((prev) => ({
      ...prev,
      intervalo: valor === "" ? "" : parseInt(valor) || 0,
    }));
  };

  const handleTransformadorTIChange = (id) => {
    setConfig((prev) => ({
      ...prev,
      transformadorTIId: id,
    }));
  };

  const handleTransformadorTVChange = (id) => {
    setConfig((prev) => ({
      ...prev,
      transformadorTVId: id,
    }));
  };

  // Abrir modal de transformadores
  const abrirModalTransformadores = (tipo) => {
    setTipoTransformadorModal(tipo);
    setModalTransformadoresAbierto(true);
    setDropdownTransformadoresAbierto(false);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownTransformadoresRef.current && !dropdownTransformadoresRef.current.contains(event.target)) {
        setDropdownTransformadoresAbierto(false);
      }
    };

    if (dropdownTransformadoresAbierto) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownTransformadoresAbierto]);

  // Toggle habilitar/deshabilitar una funcionalidad
  const handleToggleFuncionalidad = (funcId) => {
    setConfig((prev) => {
      const estadoActual = prev.funcionalidadesActivas[funcId];
      const plantillaFunc = plantillaSeleccionada?.funcionalidades?.[funcId];

      if (estadoActual?.habilitado) {
        // Deshabilitar
        const nuevasFunc = { ...prev.funcionalidadesActivas };
        nuevasFunc[funcId] = { ...nuevasFunc[funcId], habilitado: false };
        return { ...prev, funcionalidadesActivas: nuevasFunc };
      } else {
        // Habilitar con registros de la plantilla
        return {
          ...prev,
          funcionalidadesActivas: {
            ...prev.funcionalidadesActivas,
            [funcId]: {
              nombre: plantillaFunc?.nombre || funcId,
              habilitado: true,
              registros: plantillaFunc?.registros || [{ etiqueta: "", valor: 0 }],
            },
          },
        };
      }
    });
  };

  // Cambiar valor de un registro específico
  const handleCambiarRegistro = (funcId, regIndex, valor) => {
    setConfig((prev) => ({
      ...prev,
      funcionalidadesActivas: {
        ...prev.funcionalidadesActivas,
        [funcId]: {
          ...prev.funcionalidadesActivas[funcId],
          registros: prev.funcionalidadesActivas[funcId].registros.map((reg, idx) =>
            idx === regIndex
              ? { ...reg, valor: valor === "" ? "" : parseInt(valor) || 0 }
              : reg
          ),
        },
      },
    }));
  };

  // Toggle expandir/colapsar fila en la tabla de funcionalidades
  const toggleFilaExpandida = (funcId) => {
    setFilasExpandidas((prev) => {
      const nuevas = new Set(prev);
      if (nuevas.has(funcId)) {
        nuevas.delete(funcId);
      } else {
        nuevas.add(funcId);
      }
      return nuevas;
    });
  };

  // Handlers para el modal de plantillas
  const abrirModalCrear = () => {
    setPlantillaParaEditar(null);
    setModalPlantillasAbierto(true);
  };

  const abrirModalGestionar = () => {
    setPlantillaParaEditar(null);
    setModalPlantillasAbierto(true);
  };

  const handleCrearPlantilla = (datos) => {
    const nueva = crearPlantilla(datos);
    if (nueva) {
      // Seleccionar la plantilla recién creada usando directamente los datos
      // (no podemos usar handlePlantillaChange porque el estado aún no se actualizó)
      const funcionalidadesIniciales = generarConfigDesdeePlantilla(nueva);
      setConfig((prev) => ({
        ...prev,
        plantillaId: nueva.id,
        funcionalidadesActivas: funcionalidadesIniciales,
      }));
    }
    return nueva;
  };

  const handleActualizarPlantilla = (id, datos) => {
    const exito = actualizarPlantilla(id, datos);
    if (exito && config.plantillaId === id) {
      // Si es la plantilla actualmente seleccionada, actualizar las funcionalidades
      // Construir la plantilla actualizada con los nuevos datos
      const plantillaActualizada = {
        id,
        ...datos,
        funcionalidades: datos.funcionalidades || {},
      };
      const funcionalidadesActualizadas = generarConfigDesdeePlantilla(plantillaActualizada);
      setConfig((prev) => ({
        ...prev,
        funcionalidadesActivas: funcionalidadesActualizadas,
      }));
    }
    return exito;
  };

  // Funciones de la consola
  const agregarLog = (mensaje, tipo = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setConsolaLogs((prev) => [...prev, { timestamp, mensaje, tipo }]);
    // Auto-scroll al final
    setTimeout(() => {
      if (consolaRef.current) {
        consolaRef.current.scrollTop = consolaRef.current.scrollHeight;
      }
    }, 50);
  };

  const limpiarConsola = () => {
    setConsolaLogs([]);
    setRegistrosCrudos(null);
  };

  // Manejadores del resizer
  const handleMouseDown = (e) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    // Limitar entre 30% y 80%
    const clampedWidth = Math.min(80, Math.max(30, newWidth));
    setConsolaWidth(clampedWidth);
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  // Ejecutar test Modbus real usando el agente
  const ejecutarTest = async () => {
    // Validaciones
    if (!config.conexion.ip) {
      agregarLog("Error: Debes ingresar una IP", "error");
      return;
    }

    if (!agenteId) {
      agregarLog("Error: No hay agente configurado para ejecutar el test", "error");
      agregarLog("El test requiere un agente conectado para comunicarse con el relé", "info");
      return;
    }

    setEjecutandoTest(true);
    setRegistrosCrudos(null);
    limpiarConsola();

    const indiceInicial = config.registroInicial || 0;
    const cantidad = config.cantidadRegistros || 20;

    agregarLog(`Iniciando test de conexión...`, "info");
    agregarLog(`IP: ${config.conexion.ip}:${config.conexion.puerto} (Unit ID: ${config.conexion.unitId})`, "info");
    agregarLog(`Registros: ${indiceInicial} - ${indiceInicial + cantidad - 1} (${cantidad} registros)`, "info");
    agregarLog(`Agente: ${agenteId}`, "info");

    try {
      // Solicitar el test al agente
      agregarLog("Enviando solicitud al agente...", "info");

      const respuesta = await solicitarTestRegistrador(agenteId, {
        ip: config.conexion.ip,
        puerto: parseInt(config.conexion.puerto) || 502,
        unitId: parseInt(config.conexion.unitId) || 1,
        indiceInicial,
        cantidadRegistros: cantidad,
      });

      const testId = respuesta.testId;
      agregarLog(`Solicitud enviada (ID: ${testId})`, "success");
      agregarLog("Esperando respuesta del agente...", "info");

      // Polling para obtener resultado (max 30 segundos)
      const maxIntentos = 15;
      const intervaloMs = 2000;
      let intentos = 0;
      let resultado = null;

      while (intentos < maxIntentos) {
        await new Promise((resolve) => setTimeout(resolve, intervaloMs));
        intentos++;

        resultado = await consultarTestRegistrador(agenteId, testId);

        if (resultado.estado === "completado") {
          // Test exitoso
          const registros = resultado.valores || [];
          const tiempoMs = resultado.tiempo_respuesta_ms || 0;

          agregarLog(`Conexión exitosa (${tiempoMs}ms)`, "success");
          agregarLog(`Registros leídos: ${registros.length}`, "success");

          // Mostrar TODOS los registros en la consola
          for (let i = 0; i < registros.length; i++) {
            const regNum = indiceInicial + i;
            const valor = registros[i];
            agregarLog(`  [${regNum}] = ${valor}`, "data");
          }

          // Guardar registros crudos para exportación CSV
          setRegistrosCrudos({
            valores: registros,
            indiceInicial,
            ip: config.conexion.ip,
            puerto: config.conexion.puerto,
            tiempoMs,
          });

          agregarLog("Test completado exitosamente", "success");
          return;

        } else if (resultado.estado === "error" || resultado.estado === "timeout") {
          // Test falló
          agregarLog(`Error: ${resultado.error_mensaje || "Error de conexión"}`, "error");
          if (resultado.tiempo_respuesta_ms) {
            agregarLog(`Tiempo transcurrido: ${resultado.tiempo_respuesta_ms}ms`, "info");
          }
          return;
        }

        // Si está pendiente/enviado/ejecutando, seguir esperando
        agregarLog(`Esperando... (${intentos}/${maxIntentos})`, "info");
      }

      // Timeout del polling
      agregarLog("Timeout: El agente no respondió a tiempo", "error");
      agregarLog("Verifica que el agente esté conectado y el dispositivo sea accesible", "info");

    } catch (error) {
      agregarLog(`Error: ${error.message}`, "error");

      // Mensajes de ayuda según el tipo de error
      if (error.message?.includes("esperar")) {
        agregarLog("Debes esperar antes de ejecutar otro test", "info");
      } else if (error.message?.includes("agente")) {
        agregarLog("Verifica que el agente esté conectado", "info");
      }
    } finally {
      setEjecutandoTest(false);
    }
  };

  // Aplicar fórmula de transformador a un valor
  const aplicarFormulaTransformador = (valor, transformadorId) => {
    if (valor === null || valor === undefined || !transformadorId) {
      return null;
    }

    const transformador = obtenerTransformadorPorId(transformadorId);
    if (!transformador || !transformador.formula) {
      return null;
    }

    try {
      // La fórmula usa 'x' como variable para el valor
      // Ejemplo: "x * 200 / 1000"
      const x = valor;
      // eslint-disable-next-line no-new-func
      const resultado = new Function("x", `return ${transformador.formula}`)(x);
      return typeof resultado === "number" && !isNaN(resultado) ? resultado : null;
    } catch (error) {
      console.error("Error al aplicar fórmula del transformador:", error);
      return null;
    }
  };

  // Exportar registros a CSV
  const exportarCSV = () => {
    if (!registrosCrudos || !registrosCrudos.valores || registrosCrudos.valores.length === 0) {
      agregarLog("No hay registros para exportar. Ejecuta un test primero.", "error");
      return;
    }

    const { valores, indiceInicial, ip, puerto, tiempoMs } = registrosCrudos;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    // Crear contenido CSV con información detallada
    const cabecera = "Registro,Valor";
    const filas = valores.map((valor, idx) => {
      const registro = indiceInicial + idx;
      return `${registro},${valor}`;
    });

    // Agregar metadatos como comentarios al inicio
    const metadatos = [
      `# Test Modbus - RelayWatch`,
      `# Fecha: ${new Date().toLocaleString()}`,
      `# Dispositivo: ${ip}:${puerto}`,
      `# Registros: ${indiceInicial} - ${indiceInicial + valores.length - 1}`,
      `# Tiempo de respuesta: ${tiempoMs}ms`,
      `# Total registros: ${valores.length}`,
      "",
    ];

    const contenidoCSV = [...metadatos, cabecera, ...filas].join("\n");

    // Crear y descargar archivo
    const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registros_${ip}_${puerto}_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    agregarLog(`CSV exportado: registros_${ip}_${puerto}_${timestamp}.csv`, "success");
  };

  // Verificar si la plantilla seleccionada aún existe
  const plantillaNoEncontrada = config.plantillaId && !plantillaSeleccionada;

  // Obtener lista de funcionalidades de la plantilla
  const funcionalidadesPlantilla = plantillaSeleccionada
    ? Object.entries(plantillaSeleccionada.funcionalidades || {})
    : [];

  // Contar funcionalidades activas
  const cantidadActivas = Object.values(config.funcionalidadesActivas).filter(
    (f) => f.habilitado
  ).length;

  return (
    <div className="config-rele">
      {/* Fila superior: Conexión/Transformadores y Plantilla lado a lado */}
      <div className="config-rele-row-superior">
        {/* Columna izquierda: Conexión + Transformadores */}
        <div className="config-rele-col-izquierda">
          {/* Sección: Conexión Modbus TCP */}
          <div className="config-rele-seccion config-rele-seccion--conexion">
          <h6>📡 Conexión Modbus TCP</h6>
          <div className="config-rele-conexion-fila">
            {/* Grupo 1: Conexión */}
            <div className="config-rele-conexion-grupo">
              <div className="config-rele-campo-inline">
                <label>IP</label>
                <input
                  type="text"
                  value={config.conexion.ip}
                  onChange={(e) => handleConexionChange("ip", e.target.value)}
                  placeholder="172.16.0.1"
                />
              </div>
              <div className="config-rele-campo-inline">
                <label>Puerto</label>
                <input
                  type="number"
                  value={config.conexion.puerto}
                  onChange={(e) =>
                    handleConexionChange(
                      "puerto",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  placeholder="502"
                />
              </div>
              <div className="config-rele-campo-inline">
                <label>Unit ID</label>
                <input
                  type="number"
                  value={config.conexion.unitId}
                  onChange={(e) =>
                    handleConexionChange(
                      "unitId",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  placeholder="1"
                />
              </div>
            </div>
            {/* Grupo 2: Registros */}
            <div className="config-rele-conexion-grupo">
              <div className="config-rele-campo-inline">
                <label>Inicio</label>
                <input
                  type="number"
                  value={config.registroInicial}
                  onChange={(e) => handleRegistroInicialChange(e.target.value)}
                  placeholder="120"
                  min={0}
                />
              </div>
              <div className="config-rele-campo-inline">
                <label>Cant.</label>
                <input
                  type="number"
                  value={config.cantidadRegistros}
                  onChange={(e) => handleCantidadRegistrosChange(e.target.value)}
                  placeholder="80"
                  min={1}
                />
              </div>
            </div>
            {/* Grupo 3: Intervalo */}
            <div className="config-rele-conexion-grupo">
              <div className="config-rele-campo-inline">
                <label>Intervalo</label>
                <input
                  type="number"
                  value={config.intervalo}
                  onChange={(e) => handleIntervaloChange(e.target.value)}
                  placeholder="60"
                  min={1}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Transformadores - Compacto */}
        <div className="config-rele-seccion config-rele-seccion--transformadores">
          <h6>⚡ Relaciones de transformación</h6>
          <div className="config-rele-transformadores-compacto" ref={dropdownTransformadoresRef}>
            <div className="config-rele-campo-inline">
              <label>TI / TV / Relación [ x : y ]</label>
              <button
                type="button"
                className="config-rele-btn-ver-transformadores"
                onClick={() => setDropdownTransformadoresAbierto(!dropdownTransformadoresAbierto)}
              >
                <span>Ver disponibles ({obtenerTIs().length + obtenerTVs().length + obtenerRelaciones().length})</span>
                <span className={`config-rele-dropdown-arrow ${dropdownTransformadoresAbierto ? "abierto" : ""}`}>▼</span>
              </button>
            </div>
            <button
              type="button"
              className="config-rele-btn-editar-transformador"
              onClick={() => abrirModalTransformadores("TI")}
              title="Gestionar transformadores"
            >
              ⚙️
            </button>

            {/* Dropdown con lista de transformadores */}
            {dropdownTransformadoresAbierto && (
              <div className="config-rele-transformadores-dropdown">
                {obtenerTIs().length > 0 && (
                  <div className="config-rele-dropdown-grupo">
                    <div className="config-rele-dropdown-titulo">T.I. (Intensidad)</div>
                    {obtenerTIs().map((t) => (
                      <div key={t.id} className="config-rele-dropdown-item">
                        <span className="config-rele-dropdown-nombre">{t.nombre}</span>
                        <span className="config-rele-dropdown-formula">{t.formula}</span>
                      </div>
                    ))}
                  </div>
                )}
                {obtenerTVs().length > 0 && (
                  <div className="config-rele-dropdown-grupo">
                    <div className="config-rele-dropdown-titulo">T.V. (Voltaje)</div>
                    {obtenerTVs().map((t) => (
                      <div key={t.id} className="config-rele-dropdown-item">
                        <span className="config-rele-dropdown-nombre">{t.nombre}</span>
                        <span className="config-rele-dropdown-formula">{t.formula}</span>
                      </div>
                    ))}
                  </div>
                )}
                {obtenerRelaciones().length > 0 && (
                  <div className="config-rele-dropdown-grupo">
                    <div className="config-rele-dropdown-titulo">Relación [ x : y ]</div>
                    {obtenerRelaciones().map((t) => (
                      <div key={t.id} className="config-rele-dropdown-item">
                        <span className="config-rele-dropdown-nombre">{t.nombre}</span>
                        <span className="config-rele-dropdown-formula">{t.formula}</span>
                      </div>
                    ))}
                  </div>
                )}
                {obtenerTIs().length === 0 && obtenerTVs().length === 0 && obtenerRelaciones().length === 0 && (
                  <div className="config-rele-dropdown-vacio">
                    No hay transformadores configurados
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Sección: Plantilla - Derecha */}
        <div className="config-rele-seccion config-rele-seccion--plantilla">
          <h6>📋 Plantilla de Configuración</h6>

          <div className="config-rele-plantilla-row">
            <select
              value={config.plantillaId}
              onChange={handlePlantillaChange}
              className={`config-rele-select ${
                plantillaNoEncontrada ? "config-rele-select--error" : ""
              }`}
            >
              <option value="">Seleccionar plantilla...</option>
              {plantillas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="config-rele-btn-plantilla"
              onClick={abrirModalCrear}
              title="Nueva plantilla"
            >
              + Nueva
            </button>

            <button
              type="button"
              className="config-rele-btn-plantilla config-rele-btn-plantilla--secundario"
              onClick={abrirModalGestionar}
              title="Gestionar plantillas"
            >
              Gestionar
            </button>
          </div>

          {plantillaNoEncontrada && (
            <div className="config-rele-alerta">
              La plantilla seleccionada ya no existe. Selecciona otra.
            </div>
          )}

          {plantillas.length === 0 && !cargandoPlantillas && (
            <div className="config-rele-mensaje">
              No hay plantillas. Crea una para continuar.
            </div>
          )}

          {plantillaSeleccionada?.descripcion && (
            <div className="config-rele-plantilla-desc">
              {plantillaSeleccionada.descripcion}
            </div>
          )}
        </div>
      </div>

      {/* Fila inferior: Consola (izq) + Funcionalidades (der) lado a lado */}
      <div className="config-rele-row-inferior">
        {/* Sección: Consola de Test - Izquierda */}
        <div className="config-rele-seccion config-rele-seccion--consola">
          <h6>🖥️ Consola de Test</h6>

          <div className="config-rele-consola-container" ref={containerRef}>
            {/* Panel izquierdo: Logs */}
            <div
              ref={consolaRef}
              className="config-rele-consola"
              style={{ width: `${consolaWidth}%` }}
            >
              {consolaLogs.length === 0 ? (
                <div className="config-rele-consola-vacio">
                  Presiona "Ejecutar Test" para probar la conexión Modbus
                </div>
              ) : (
                consolaLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`config-rele-consola-linea config-rele-consola-linea--${log.tipo}`}
                  >
                    <span className="config-rele-consola-timestamp">[{log.timestamp}]</span>
                    <span className="config-rele-consola-mensaje">{log.mensaje}</span>
                  </div>
                ))
              )}
            </div>

            {/* Resizer */}
            <div
              ref={resizerRef}
              className="config-rele-resizer"
              onMouseDown={handleMouseDown}
            />

            {/* Panel derecho: Funcionalidades con valores */}
            <div
              className="config-rele-registros-panel"
              style={{ width: `${100 - consolaWidth}%` }}
            >
              {!registrosCrudos ? (
                <div className="config-rele-registros-vacio">
                  Los valores aparecerán aquí después del test
                </div>
              ) : !plantillaSeleccionada ? (
                <div className="config-rele-registros-vacio">
                  Selecciona una plantilla para ver las funcionalidades
                </div>
              ) : (
                <div className="config-rele-funcionalidades-valores">
                  {Object.values(CATEGORIAS).map((categoria) => {
                    // Filtrar funcionalidades activas de esta categoría
                    const funcsActivas = funcionalidadesPlantilla.filter(
                      ([funcId, func]) => {
                        const estadoActivo = config.funcionalidadesActivas[funcId];
                        return (
                          estadoActivo?.habilitado &&
                          (func.categoria || "mediciones") === categoria.id
                        );
                      }
                    );

                    if (funcsActivas.length === 0) return null;

                    // Verificar si esta categoría requiere interpretación binaria
                    const requiereInterpretacion = categoriaRequiereInterpretacion(categoria.id);

                    return (
                      <div key={categoria.id} className="config-rele-valores-categoria">
                        <div className="config-rele-valores-categoria-titulo">
                          {categoria.nombre}
                        </div>
                        {funcsActivas.map(([funcId, plantillaFunc]) => {
                          const estadoActivo = config.funcionalidadesActivas[funcId];
                          const registros = estadoActivo?.registros || plantillaFunc.registros || [];

                          return (
                            <div key={funcId} className="config-rele-valores-func">
                              <div className="config-rele-valores-func-nombre">
                                * {plantillaFunc.nombre}
                              </div>
                              <div className="config-rele-valores-registros">
                                {registros.map((reg, index) => {
                                  // Obtener el valor del registro desde registrosCrudos
                                  const regNum = reg.valor;
                                  const indiceEnArray = regNum - registrosCrudos.indiceInicial;
                                  const valorLeido =
                                    indiceEnArray >= 0 && indiceEnArray < registrosCrudos.valores.length
                                      ? registrosCrudos.valores[indiceEnArray]
                                      : null;

                                  // Aplicar transformador si la funcionalidad tiene uno asociado (solo para mediciones)
                                  const transformadorId = plantillaFunc.transformadorId;
                                  const valorTransformado = transformadorId && valorLeido !== null
                                    ? aplicarFormulaTransformador(valorLeido, transformadorId)
                                    : null;
                                  const transformador = transformadorId ? obtenerTransformadorPorId(transformadorId) : null;

                                  // Interpretar el registro si corresponde
                                  // Para el registro 172 (LEDs), usar etiquetas personalizadas de la plantilla si existen
                                  const etiquetasPersonalizadas = regNum === 172 && plantillaSeleccionada?.etiquetasBits
                                    ? plantillaSeleccionada.etiquetasBits
                                    : null;

                                  const interpretacion = requiereInterpretacion && valorLeido !== null
                                    ? interpretarRegistro(regNum, valorLeido, etiquetasPersonalizadas)
                                    : null;

                                  return (
                                    <div key={index} className="config-rele-valores-registro-container">
                                      <div className="config-rele-valores-registro">
                                        {reg.etiqueta || `Reg ${index + 1}`} [{regNum}] = {valorLeido !== null ? valorLeido : "—"}
                                        {/* Mostrar valor transformado si aplica */}
                                        {valorTransformado !== null && (
                                          <span className="config-rele-valor-transformado" title={`Transformado con ${transformador?.nombre}: ${transformador?.formula}`}>
                                            {" → "}{valorTransformado.toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                      {/* Mostrar interpretación si existe */}
                                      {interpretacion && interpretacion.tieneInterpretacion && (
                                        <div className="config-rele-interpretacion">
                                          {/* Interpretación especial (como estado de interruptor) */}
                                          {interpretacion.interpretacionEspecial && (
                                            <div className={`config-rele-interpretacion-especial ${obtenerClaseTipo(interpretacion.interpretacionEspecial.clase)}`}>
                                              <span className="interpretacion-estado">{interpretacion.interpretacionEspecial.estado}</span>
                                            </div>
                                          )}
                                          {/* Bits activos */}
                                          {interpretacion.bitsActivos.length > 0 && (
                                            <div className="config-rele-interpretacion-bits">
                                              {interpretacion.bitsActivos.map((bit, bitIdx) => (
                                                <span
                                                  key={bitIdx}
                                                  className={`config-rele-bit ${obtenerClaseTipo(bit.tipo)}`}
                                                  title={bit.descripcion}
                                                >
                                                  {bit.nombre}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                          {/* Sin señales activas */}
                                          {interpretacion.bitsActivos.length === 0 && !interpretacion.interpretacionEspecial && (
                                            <div className="config-rele-interpretacion-vacio">
                                              Sin señales activas
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="config-rele-consola-acciones">
            <button
              type="button"
              className="config-rele-btn-test"
              onClick={ejecutarTest}
              disabled={ejecutandoTest}
            >
              {ejecutandoTest ? "Ejecutando..." : "Ejecutar Test"}
            </button>
            <button
              type="button"
              className="config-rele-btn-csv"
              onClick={exportarCSV}
              disabled={!registrosCrudos}
              title={registrosCrudos ? `Exportar ${registrosCrudos.valores?.length || 0} registros` : "Ejecuta un test primero"}
            >
              Exportar CSV
            </button>
            <button
              type="button"
              className="config-rele-btn-limpiar"
              onClick={limpiarConsola}
              disabled={consolaLogs.length === 0 && !registrosCrudos}
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Sección: Funcionalidades a Monitorear - Tabs */}
        {plantillaSeleccionada && funcionalidadesPlantilla.length > 0 && (
          <div className="config-rele-seccion config-rele-seccion--funcionalidades">
            <h6>
              🔧 Funcionalidades a Monitorear
              <span className="config-rele-contador">{cantidadActivas} activas</span>
            </h6>

            {/* Tabs de categorías */}
            <div className="config-rele-tabs">
              {Object.values(CATEGORIAS).map((categoria) => {
                const funcsDeCategoria = funcionalidadesPlantilla.filter(
                  ([, func]) => (func.categoria || "mediciones") === categoria.id
                );
                const cantidadEnCategoria = funcsDeCategoria.length;

                if (cantidadEnCategoria === 0) return null;

                return (
                  <button
                    key={categoria.id}
                    type="button"
                    className={`config-rele-tab ${tabFuncionalidadesActivo === categoria.id ? "activo" : ""}`}
                    onClick={() => setTabFuncionalidadesActivo(categoria.id)}
                  >
                    <span className="config-rele-tab-icono">{categoria.icono}</span>
                    <span className="config-rele-tab-nombre">{categoria.nombre}</span>
                    <span className="config-rele-tab-contador">{cantidadEnCategoria}</span>
                  </button>
                );
              })}
            </div>

            {/* Contenido del tab activo */}
            <div className="config-rele-tab-contenido">
              {(() => {
                const categoriaActiva = CATEGORIAS[tabFuncionalidadesActivo];
                const funcsDeCategoria = funcionalidadesPlantilla.filter(
                  ([, func]) => (func.categoria || "mediciones") === tabFuncionalidadesActivo
                );

                if (funcsDeCategoria.length === 0) {
                  return (
                    <div className="config-rele-tab-vacio">
                      No hay funcionalidades en esta categoría
                    </div>
                  );
                }

                return (
                  <table className="config-rele-tabla">
                    <thead>
                      <tr>
                        <th className="config-rele-tabla-th-check"></th>
                        <th className="config-rele-tabla-th-nombre">Funcionalidad</th>
                        <th className="config-rele-tabla-th-registros">Registros</th>
                        <th className="config-rele-tabla-th-ti-tv">TI / TV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funcsDeCategoria.map(([funcId, plantillaFunc]) => {
                        const estadoActivo = config.funcionalidadesActivas[funcId];
                        const estaHabilitado = estadoActivo?.habilitado || false;
                        const registros = estadoActivo?.registros || plantillaFunc.registros || [];
                        const estaExpandida = filasExpandidas.has(funcId);

                        // Obtener el transformador asociado a esta funcionalidad
                        const transformadorFunc = plantillaFunc.transformadorId
                          ? obtenerTransformadorPorId(plantillaFunc.transformadorId)
                          : null;

                        // Resumen de registros para mostrar en la fila colapsada
                        const resumenRegistros = registros
                          .map((r) => `${r.etiqueta || "Reg"}: ${r.valor}`)
                          .join(" | ");

                        return (
                          <React.Fragment key={funcId}>
                            <tr
                              className={`config-rele-tabla-fila ${estaHabilitado ? "activo" : "inactivo"} ${estaExpandida ? "expandida" : ""}`}
                            >
                              <td className="config-rele-tabla-td-check">
                                <input
                                  type="checkbox"
                                  checked={estaHabilitado}
                                  onChange={() => handleToggleFuncionalidad(funcId)}
                                />
                              </td>
                              <td className="config-rele-tabla-td-nombre">
                                <button
                                  type="button"
                                  className="config-rele-tabla-btn-expandir"
                                  onClick={() => toggleFilaExpandida(funcId)}
                                >
                                  <span className={`config-rele-tabla-chevron ${estaExpandida ? "expandido" : ""}`}>
                                    ▶
                                  </span>
                                  <span className="config-rele-tabla-nombre-texto">
                                    {plantillaFunc.nombre}
                                  </span>
                                </button>
                              </td>
                              <td className="config-rele-tabla-td-registros">
                                {!estaExpandida && (
                                  <span className="config-rele-tabla-resumen">
                                    {resumenRegistros}
                                  </span>
                                )}
                              </td>
                              <td className="config-rele-tabla-td-ti-tv">
                                {transformadorFunc ? (
                                  <div className="config-rele-tabla-transformador">
                                    <span className="config-rele-tabla-ti-tv-nombre">
                                      {transformadorFunc.nombre}
                                    </span>
                                    <span className="config-rele-tabla-ti-tv-formula">
                                      {transformadorFunc.formula}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="config-rele-tabla-sin-ti-tv">—</span>
                                )}
                              </td>
                            </tr>
                            {/* Fila expandida con subtabla - ocupa todo el ancho */}
                            {estaExpandida && (
                              <tr className="config-rele-tabla-fila-expandida">
                                <td colSpan={4}>
                                  <div className="config-rele-tabla-expandido">
                                    <table className="config-rele-subtabla">
                                      <thead>
                                        <tr>
                                          <th>Etiqueta</th>
                                          <th>Registro</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {registros.map((reg, index) => (
                                          <tr key={index}>
                                            <td>{reg.etiqueta || `Reg ${index + 1}`}</td>
                                            <td>{reg.valor}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Gestión de Plantillas */}
      <ModalPlantillasRele
        abierto={modalPlantillasAbierto}
        onCerrar={() => {
          setModalPlantillasAbierto(false);
          setPlantillaParaEditar(null);
        }}
        plantillas={plantillas}
        onCrear={handleCrearPlantilla}
        onActualizar={handleActualizarPlantilla}
        onEliminar={eliminarPlantilla}
        plantillaEditando={plantillaParaEditar}
      />

      {/* Modal de Gestión de Transformadores */}
      <ModalTransformadores
        abierto={modalTransformadoresAbierto}
        onCerrar={() => setModalTransformadoresAbierto(false)}
        transformadores={transformadores}
        onCrear={crearTransformador}
        onActualizar={actualizarTransformador}
        onEliminar={eliminarTransformador}
        tipoInicial={tipoTransformadorModal}
      />
    </div>
  );
};

export default ConfiguracionRele;
