import { useState, useEffect, useRef } from "react";
import { usePlantillasRele } from "../../hooks/usePlantillasRele";
import ModalPlantillasRele from "./ModalPlantillasRele";
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

  // Ref para evitar bucle infinito en notificación de cambios
  const configAnteriorRef = useRef(null);
  const inicializadoRef = useRef(false);
  const consolaRef = useRef(null);

  // Estado del modal de plantillas
  const [modalPlantillasAbierto, setModalPlantillasAbierto] = useState(false);
  const [plantillaParaEditar, setPlantillaParaEditar] = useState(null);

  // Estado de la consola de test
  const [consolaLogs, setConsolaLogs] = useState([]);
  const [ejecutandoTest, setEjecutandoTest] = useState(false);

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
      // Seleccionar la plantilla recién creada
      handlePlantillaChange({ target: { value: nueva.id } });
    }
    return nueva;
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
  };

  // Ejecutar test Modbus
  const ejecutarTest = async () => {
    if (!config.conexion.ip) {
      agregarLog("Error: Debes ingresar una IP", "error");
      return;
    }

    setEjecutandoTest(true);
    limpiarConsola();
    agregarLog(`Iniciando test de conexión...`, "info");
    agregarLog(`IP: ${config.conexion.ip}:${config.conexion.puerto} (Unit ID: ${config.conexion.unitId})`, "info");
    agregarLog(`Registros: ${config.registroInicial} - ${config.registroInicial + config.cantidadRegistros - 1}`, "info");

    try {
      // TODO: Integrar con backend real cuando esté disponible
      // Por ahora simulamos el test
      await new Promise((resolve) => setTimeout(resolve, 1000));
      agregarLog("Conectando al dispositivo...", "info");

      await new Promise((resolve) => setTimeout(resolve, 1500));
      agregarLog("Conexión establecida", "success");

      await new Promise((resolve) => setTimeout(resolve, 500));
      agregarLog(`Leyendo ${config.cantidadRegistros} registros desde dirección ${config.registroInicial}...`, "info");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simular lectura de algunos registros
      const registrosLeidos = [];
      for (let i = 0; i < Math.min(config.cantidadRegistros, 10); i++) {
        const valor = Math.floor(Math.random() * 1000);
        registrosLeidos.push({ address: config.registroInicial + i, value: valor });
      }

      agregarLog(`Registros leídos correctamente:`, "success");
      registrosLeidos.forEach((reg) => {
        agregarLog(`  [${reg.address}] = ${reg.value}`, "data");
      });

      if (config.cantidadRegistros > 10) {
        agregarLog(`  ... y ${config.cantidadRegistros - 10} registros más`, "data");
      }

      agregarLog("Test completado exitosamente", "success");
    } catch (error) {
      agregarLog(`Error: ${error.message}`, "error");
    } finally {
      setEjecutandoTest(false);
    }
  };

  // Exportar a CSV
  const exportarCSV = () => {
    if (consolaLogs.length === 0) {
      agregarLog("No hay datos para exportar", "error");
      return;
    }

    const lineas = consolaLogs.map((log) => `${log.timestamp},${log.tipo},${log.mensaje}`);
    const contenido = "Timestamp,Tipo,Mensaje\n" + lineas.join("\n");

    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `test-modbus-${config.conexion.ip || "sin-ip"}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    agregarLog("CSV exportado correctamente", "success");
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
      {/* Fila superior: Conexión y Plantilla lado a lado */}
      <div className="config-rele-row-superior">
        {/* Sección: Conexión Modbus TCP - Izquierda */}
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

          <div
            ref={consolaRef}
            className="config-rele-consola"
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
              disabled={consolaLogs.length === 0}
            >
              Exportar CSV
            </button>
            <button
              type="button"
              className="config-rele-btn-limpiar"
              onClick={limpiarConsola}
              disabled={consolaLogs.length === 0}
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Sección: Funcionalidades a Monitorear - Derecha */}
        {plantillaSeleccionada && funcionalidadesPlantilla.length > 0 && (
          <div className="config-rele-seccion config-rele-seccion--funcionalidades">
            <h6>
              🔧 Funcionalidades a Monitorear
              <span className="config-rele-contador">{cantidadActivas} activas</span>
            </h6>

            <div className="config-rele-funcionalidades">
              {Object.values(CATEGORIAS).map((categoria) => {
                const funcsDeCategoria = funcionalidadesPlantilla.filter(
                  ([, func]) => (func.categoria || "mediciones") === categoria.id
                );

                if (funcsDeCategoria.length === 0) return null;

                return (
                  <div key={categoria.id} className="config-rele-categoria">
                    <div className="config-rele-categoria-header">
                      <span>
                        {categoria.icono} {categoria.nombre}
                      </span>
                    </div>

                    <div className="config-rele-func-lista">
                      {funcsDeCategoria.map(([funcId, plantillaFunc]) => {
                        const estadoActivo = config.funcionalidadesActivas[funcId];
                        const estaHabilitado = estadoActivo?.habilitado || false;
                        const registros = estadoActivo?.registros || plantillaFunc.registros || [];

                        return (
                          <div
                            key={funcId}
                            className={`config-rele-func-card ${estaHabilitado ? "activo" : "inactivo"}`}
                          >
                            <div className="config-rele-func-header">
                              <label className="config-rele-func-check">
                                <input
                                  type="checkbox"
                                  checked={estaHabilitado}
                                  onChange={() => handleToggleFuncionalidad(funcId)}
                                />
                                <span className="config-rele-func-nombre">
                                  {plantillaFunc.nombre}
                                </span>
                              </label>
                            </div>

                            {/* Registros individuales */}
                            <div className="config-rele-registros">
                              {registros.map((reg, index) => (
                                <div key={index} className="config-rele-registro-item">
                                  <span className="config-rele-registro-etiqueta">
                                    {reg.etiqueta || `Reg ${index + 1}`}
                                  </span>
                                  <span className="config-rele-registro-separador">→</span>
                                  <input
                                    type="number"
                                    className="config-rele-registro-valor"
                                    value={reg.valor}
                                    onChange={(e) =>
                                      handleCambiarRegistro(funcId, index, e.target.value)
                                    }
                                    disabled={!estaHabilitado}
                                    min={0}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
        onActualizar={actualizarPlantilla}
        onEliminar={eliminarPlantilla}
        plantillaEditando={plantillaParaEditar}
      />
    </div>
  );
};

export default ConfiguracionRele;
