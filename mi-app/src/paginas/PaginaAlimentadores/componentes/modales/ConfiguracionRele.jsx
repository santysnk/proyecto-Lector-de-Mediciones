import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useModelosRele } from "../../hooks/useModelosRele";
import {
  SEVERIDADES,
  CONEXION_MODBUS_DEFAULT,
} from "../../constantes/datosBaseReles";
import { solicitarTestRegistrador, consultarTestRegistrador, solicitarTestCoils } from "../../../../servicios/apiService";
import ModalGestionModelosRele from "./ModalGestionModelosRele";
import "./ConfiguracionRele.css";

/**
 * Componente para configurar un registrador de tipo Relé de Protección.
 * Permite seleccionar modelo, configuración, parámetros de conexión,
 * escala CT/VT y protecciones a monitorear.
 *
 * @param {Object} configuracionInicial - Configuración inicial del relé
 * @param {Function} onChange - Callback al cambiar la configuración
 * @param {string} agenteId - ID del agente que ejecutará los tests de conexión (opcional)
 */
const ConfiguracionRele = ({ configuracionInicial, onChange, agenteId }) => {
  const {
    getModelos,
    getConfiguracionesDeModelo,
    getProtecciones,
    getProteccionesAgrupadas,
    tieneCapacidad,
  } = useModelosRele();

  // Estado para modal de gestión de modelos
  const [modalGestionAbierto, setModalGestionAbierto] = useState(false);

  // Estado para test de conexión
  const [testEnProgreso, setTestEnProgreso] = useState(false);
  const [resultadoTest, setResultadoTest] = useState(null);

  // Estado para test de coils (lectura de bits)
  const [testCoilsEnProgreso, setTestCoilsEnProgreso] = useState(false);
  const [resultadoTestCoils, setResultadoTestCoils] = useState(null);
  const [coilsDireccion, setCoilsDireccion] = useState(2880); // PHLPTOC1 START por defecto
  const [coilsCantidad, setCoilsCantidad] = useState(32);

  // Ref para evitar bucle infinito en notificación de cambios
  const configAnteriorRef = useRef(null);
  const inicializadoRef = useRef(false);

  // Estado del formulario
  const [config, setConfig] = useState({
    modeloId: "",
    configuracionId: "",
    conexion: {
      ip: "",
      puerto: "",
      unitId: "",
      timeout: CONEXION_MODBUS_DEFAULT.timeout,
    },
    registros: {
      corrientes: { IL1: "", IL2: "", IL3: "", Io: "" },
      tensiones: { VA: "", VB: "", VC: "", VAB: "", VBC: "", VCA: "" },
      estadoCB: { registro: "", bitCerrado: "", bitAbierto: "", bitError: "" },
    },
    proteccionesMonitoreadas: [],
    intervaloSegundos: "",
    ...configuracionInicial,
  });

  // Cargar configuración inicial si existe (solo una vez al montar)
  useEffect(() => {
    if (configuracionInicial && !inicializadoRef.current) {
      inicializadoRef.current = true;
      setConfig((prev) => ({
        ...prev,
        ...configuracionInicial,
        conexion: {
          ...prev.conexion,
          ...configuracionInicial?.conexion,
        },
        registros: {
          ...prev.registros,
          ...configuracionInicial?.registros,
        },
      }));
      // Guardar referencia inicial para comparación
      configAnteriorRef.current = JSON.stringify(configuracionInicial);
    }
  }, [configuracionInicial]);

  // Notificar cambios al padre - evitando bucle infinito
  useEffect(() => {
    if (!onChange) return;

    const configActualStr = JSON.stringify(config);

    // Solo notificar si hay un cambio real en los valores
    if (configAnteriorRef.current !== configActualStr) {
      configAnteriorRef.current = configActualStr;
      onChange(config);
    }
  }, [config, onChange]);

  // Modelos disponibles
  const modelos = useMemo(() => getModelos(), [getModelos]);

  // Configuraciones disponibles según modelo seleccionado
  const configuracionesDisponibles = useMemo(() => {
    if (!config.modeloId) return [];
    return getConfiguracionesDeModelo(config.modeloId);
  }, [config.modeloId, getConfiguracionesDeModelo]);

  // Protecciones de la configuración seleccionada
  const proteccionesDisponibles = useMemo(() => {
    if (!config.configuracionId) return [];
    return getProtecciones(config.configuracionId);
  }, [config.configuracionId, getProtecciones]);

  // Protecciones agrupadas por categoría
  const proteccionesAgrupadas = useMemo(() => {
    if (!config.configuracionId) return {};
    return getProteccionesAgrupadas(config.configuracionId);
  }, [config.configuracionId, getProteccionesAgrupadas]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleModeloChange = (e) => {
    const modeloId = e.target.value;
    setConfig((prev) => ({
      ...prev,
      modeloId,
      configuracionId: "", // Reset configuración al cambiar modelo
      proteccionesMonitoreadas: [], // Reset protecciones
    }));
  };

  const handleConfiguracionChange = (e) => {
    const configuracionId = e.target.value;

    // Al cambiar configuración, habilitar todas las protecciones por defecto
    const protecciones = getProtecciones(configuracionId);
    const proteccionesHabilitadas = protecciones.map((p) => ({
      codigo: p.codigo,
      habilitado: true,
      notificar: p.severidad === "critica" || p.severidad === "alta",
      etiquetaPersonalizada: null,
    }));

    setConfig((prev) => ({
      ...prev,
      configuracionId,
      proteccionesMonitoreadas: proteccionesHabilitadas,
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

  const handleRegistroChange = (grupo, campo, valor) => {
    setConfig((prev) => ({
      ...prev,
      registros: {
        ...prev.registros,
        [grupo]: {
          ...prev.registros[grupo],
          [campo]: valor === "" ? "" : parseInt(valor),
        },
      },
    }));
  };

  const handleProteccionToggle = (codigoProteccion) => {
    setConfig((prev) => {
      const proteccionesActualizadas = prev.proteccionesMonitoreadas.map((p) =>
        p.codigo === codigoProteccion ? { ...p, habilitado: !p.habilitado } : p
      );
      return { ...prev, proteccionesMonitoreadas: proteccionesActualizadas };
    });
  };

  const handleNotificarToggle = (codigoProteccion) => {
    setConfig((prev) => {
      const proteccionesActualizadas = prev.proteccionesMonitoreadas.map((p) =>
        p.codigo === codigoProteccion ? { ...p, notificar: !p.notificar } : p
      );
      return { ...prev, proteccionesMonitoreadas: proteccionesActualizadas };
    });
  };

  const handleSeleccionarTodas = (categoria, seleccionar) => {
    const proteccionesCategoria = proteccionesAgrupadas[categoria]?.protecciones || [];
    const codigosCategoria = proteccionesCategoria.map((p) => p.codigo);

    setConfig((prev) => {
      const proteccionesActualizadas = prev.proteccionesMonitoreadas.map((p) =>
        codigosCategoria.includes(p.codigo) ? { ...p, habilitado: seleccionar } : p
      );
      return { ...prev, proteccionesMonitoreadas: proteccionesActualizadas };
    });
  };

  // Obtener estado de una protección
  const getEstadoProteccion = (codigoProteccion) => {
    return (
      config.proteccionesMonitoreadas.find((p) => p.codigo === codigoProteccion) || {
        habilitado: false,
        notificar: false,
        etiquetaPersonalizada: null,
      }
    );
  };

  // Cuando se crea un modelo desde el modal
  const handleModeloCreado = (modeloId, configId) => {
    setConfig((prev) => ({
      ...prev,
      modeloId,
      configuracionId: configId,
    }));
  };

  // ============================================================================
  // TEST DE CONEXIÓN
  // ============================================================================

  /**
   * Interpreta un bit específico de un valor de registro
   */
  const leerBit = (valor, bit) => {
    return ((valor >> bit) & 1) === 1;
  };

  /**
   * Analiza los registros obtenidos y genera las líneas de resultado
   */
  const analizarRegistros = useCallback((registros, indiceInicial) => {
    const lineas = [];

    // Función helper para obtener valor de un registro
    const getValor = (registro) => {
      const idx = registro - indiceInicial;
      if (idx >= 0 && idx < registros.length) {
        return registros[idx];
      }
      return null;
    };

    // === 1. LISTA COMPLETA DE REGISTROS ===
    lineas.push({ tipo: "titulo", texto: `📊 Registros ${indiceInicial} - ${indiceInicial + registros.length - 1} (${registros.length})` });

    // Mostrar todos los registros en formato tabla
    for (let i = 0; i < registros.length; i++) {
      const regNum = indiceInicial + i;
      const valor = registros[i];
      const esRelevante = valor !== 0;
      lineas.push({
        tipo: "registro-item",
        registro: regNum,
        valor: valor,
        relevante: esRelevante,
      });
    }

    // === 2. CORRIENTES ===
    if (tieneCapacidad(config.configuracionId, "medicionCorriente")) {
      lineas.push({ tipo: "titulo", texto: "⚡ Corrientes" });
      const regIL1 = config.registros.corrientes.IL1;
      const regIL2 = config.registros.corrientes.IL2;
      const regIL3 = config.registros.corrientes.IL3;
      const regIo = config.registros.corrientes.Io;

      if (regIL1) {
        const val = getValor(parseInt(regIL1));
        lineas.push({ tipo: "dato", label: `IL1 [${regIL1}]`, valor: val !== null ? val : "N/A", unidad: "" });
      }
      if (regIL2) {
        const val = getValor(parseInt(regIL2));
        lineas.push({ tipo: "dato", label: `IL2 [${regIL2}]`, valor: val !== null ? val : "N/A", unidad: "" });
      }
      if (regIL3) {
        const val = getValor(parseInt(regIL3));
        lineas.push({ tipo: "dato", label: `IL3 [${regIL3}]`, valor: val !== null ? val : "N/A", unidad: "" });
      }
      if (regIo) {
        const val = getValor(parseInt(regIo));
        lineas.push({ tipo: "dato", label: `Io [${regIo}]`, valor: val !== null ? val : "N/A", unidad: "" });
      }
    }

    // === 3. TENSIONES ===
    if (tieneCapacidad(config.configuracionId, "medicionTension")) {
      lineas.push({ tipo: "titulo", texto: "🔌 Tensiones" });
      const regVA = config.registros.tensiones.VA;
      const regVB = config.registros.tensiones.VB;
      const regVC = config.registros.tensiones.VC;

      if (regVA) {
        const val = getValor(parseInt(regVA));
        lineas.push({ tipo: "dato", label: `VA [${regVA}]`, valor: val !== null ? val : "N/A", unidad: "" });
      }
      if (regVB) {
        const val = getValor(parseInt(regVB));
        lineas.push({ tipo: "dato", label: `VB [${regVB}]`, valor: val !== null ? val : "N/A", unidad: "" });
      }
      if (regVC) {
        const val = getValor(parseInt(regVC));
        lineas.push({ tipo: "dato", label: `VC [${regVC}]`, valor: val !== null ? val : "N/A", unidad: "" });
      }
    }

    // === 4. ESTADO DEL INTERRUPTOR ===
    lineas.push({ tipo: "titulo", texto: "🔲 Interruptor" });
    const regCB = config.registros.estadoCB.registro;
    if (regCB) {
      const valCB = getValor(parseInt(regCB));
      if (valCB !== null) {
        const bitCerrado = config.registros.estadoCB.bitCerrado;
        const bitAbierto = config.registros.estadoCB.bitAbierto;
        const bitError = config.registros.estadoCB.bitError;

        let estado = "Desconocido";
        if (bitCerrado !== "" && leerBit(valCB, parseInt(bitCerrado))) {
          estado = "🟢 Cerrado";
        } else if (bitAbierto !== "" && leerBit(valCB, parseInt(bitAbierto))) {
          estado = "🔴 Abierto";
        }
        if (bitError !== "" && leerBit(valCB, parseInt(bitError))) {
          estado += " ⚠️ Error";
        }

        lineas.push({ tipo: "dato", label: "Estado", valor: estado, unidad: "" });

        // Mostrar el valor del registro con desglose de bits activos
        const bitsActivos = [];
        for (let b = 0; b < 16; b++) {
          if (leerBit(valCB, b)) bitsActivos.push(b);
        }
        lineas.push({
          tipo: "dato",
          label: `Reg [${regCB}]`,
          valor: `0x${valCB.toString(16).padStart(4, "0")} (${valCB}) - bits: ${bitsActivos.join(",")}`,
          unidad: ""
        });
      } else {
        lineas.push({ tipo: "dato", label: "Estado", valor: "N/A (registro fuera de rango)", unidad: "" });
      }
    }

    // === 5. ALARMAS ACTIVAS (protecciones disparadas) ===
    const protecciones = proteccionesDisponibles;
    const alarmasActivas = [];
    const proteccionesNormales = [];

    if (protecciones.length > 0) {
      for (const prot of protecciones) {
        const regStart = prot.registroStart;
        const bitStart = prot.bitStart;
        const regOperate = prot.registroOperate;
        const bitOperate = prot.bitOperate;

        let estadoProt = [];
        let tieneAlarma = false;

        // Verificar Start
        if (regStart !== undefined && regStart !== "") {
          const valStart = getValor(parseInt(regStart));
          if (valStart !== null && bitStart !== undefined && bitStart !== "") {
            const activo = leerBit(valStart, parseInt(bitStart));
            if (activo) {
              estadoProt.push(`START [${regStart}.${bitStart}]`);
              tieneAlarma = true;
            }
          }
        }

        // Verificar Operate
        if (regOperate !== undefined && regOperate !== "") {
          const valOp = getValor(parseInt(regOperate));
          if (valOp !== null && bitOperate !== undefined && bitOperate !== "") {
            const activo = leerBit(valOp, parseInt(bitOperate));
            if (activo) {
              estadoProt.push(`OPERATE [${regOperate}.${bitOperate}]`);
              tieneAlarma = true;
            }
          }
        }

        if (tieneAlarma) {
          alarmasActivas.push({
            tipo: "alarma-activa",
            label: prot.nombreCorto || prot.codigo,
            valor: `🔴 ${estadoProt.join(" + ")}`,
            severidad: prot.severidad,
          });
        } else {
          proteccionesNormales.push(prot.nombreCorto || prot.codigo);
        }
      }

      // Mostrar alarmas activas primero (resaltadas)
      if (alarmasActivas.length > 0) {
        lineas.push({ tipo: "titulo", texto: "🚨 ALARMAS ACTIVAS" });
        for (const alarma of alarmasActivas) {
          lineas.push(alarma);
        }
      }

      // Mostrar protecciones normales agrupadas
      if (proteccionesNormales.length > 0) {
        lineas.push({ tipo: "titulo", texto: "🛡️ Protecciones" });
        lineas.push({
          tipo: "protecciones-ok",
          texto: `✅ ${proteccionesNormales.length} protecciones OK: ${proteccionesNormales.join(", ")}`
        });
      }
    }

    return lineas;
  }, [config.configuracionId, config.registros, proteccionesDisponibles, tieneCapacidad]);

  /**
   * Ejecuta el test de conexión Modbus y analiza los resultados
   * Usa el sistema de agentes para ejecutar el test real
   */
  const ejecutarTest = async () => {
    // Validar que tengamos los datos necesarios
    if (!config.conexion.ip || !config.conexion.puerto) {
      setResultadoTest({
        error: true,
        mensaje: "Falta configurar IP y Puerto",
        lineas: [],
      });
      return;
    }

    // Validar que tengamos un agenteId para ejecutar el test
    if (!agenteId) {
      setResultadoTest({
        error: true,
        mensaje: "No hay agente configurado para ejecutar el test",
        lineas: [],
      });
      return;
    }

    const indiceInicial = config.conexion.indiceInicial ?? 0;
    const cantidad = config.conexion.cantidad ?? 20;

    setTestEnProgreso(true);
    setResultadoTest(null);

    try {
      // Solicitar el test al agente
      const respuesta = await solicitarTestRegistrador(agenteId, {
        ip: config.conexion.ip,
        puerto: parseInt(config.conexion.puerto),
        unitId: config.conexion.unitId || 1,
        indiceInicial,
        cantidadRegistros: cantidad,
      });

      const testId = respuesta.testId;

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
          // Test exitoso - analizar registros
          const registros = resultado.valores || [];
          const lineas = analizarRegistros(registros, indiceInicial);

          setResultadoTest({
            error: false,
            mensaje: `Conexión exitosa (${resultado.tiempo_respuesta_ms || 0}ms)`,
            lineas,
            tiempoMs: resultado.tiempo_respuesta_ms,
            registrosCrudos: registros,
            indiceInicial,
          });
          return;
        } else if (resultado.estado === "error" || resultado.estado === "timeout") {
          // Test falló
          setResultadoTest({
            error: true,
            mensaje: resultado.error_mensaje || "Error de conexión",
            lineas: [],
          });
          return;
        }
        // Si está pendiente/enviado/ejecutando, seguir esperando
      }

      // Timeout del polling
      setResultadoTest({
        error: true,
        mensaje: "Timeout: El agente no respondió a tiempo",
        lineas: [],
      });
    } catch (error) {
      setResultadoTest({
        error: true,
        mensaje: error.message || "Error al ejecutar test",
        lineas: [],
      });
    } finally {
      setTestEnProgreso(false);
    }
  };

  /**
   * Exporta los registros del último test a un archivo CSV
   */
  const exportarRegistrosCSV = () => {
    if (!resultadoTest || resultadoTest.error || !resultadoTest.registrosCrudos) {
      return;
    }

    const { registrosCrudos, indiceInicial } = resultadoTest;
    const ip = config.conexion.ip || "unknown";
    const puerto = config.conexion.puerto || "502";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    // Crear contenido CSV
    const cabecera = "Registro,Valor";
    const filas = registrosCrudos.map((valor, idx) => {
      const registro = indiceInicial + idx;
      return `${registro},${valor}`;
    });

    const contenidoCSV = [cabecera, ...filas].join("\n");

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
  };

  /**
   * Ejecuta el test de lectura de coils (función Modbus 01)
   * Para leer bits individuales de protecciones
   */
  const ejecutarTestCoils = async () => {
    // Validar que tengamos los datos necesarios
    if (!config.conexion.ip || !config.conexion.puerto) {
      setResultadoTestCoils({
        error: true,
        mensaje: "Falta configurar IP y Puerto",
        coils: [],
      });
      return;
    }

    if (!agenteId) {
      setResultadoTestCoils({
        error: true,
        mensaje: "No hay agente configurado para ejecutar el test",
        coils: [],
      });
      return;
    }

    setTestCoilsEnProgreso(true);
    setResultadoTestCoils(null);

    try {
      // Solicitar el test de coils al agente
      const respuesta = await solicitarTestCoils(agenteId, {
        ip: config.conexion.ip,
        puerto: parseInt(config.conexion.puerto),
        unitId: config.conexion.unitId || 1,
        direccionCoil: coilsDireccion,
        cantidadBits: coilsCantidad,
      });

      const testId = respuesta.testId;

      // Polling para obtener resultado (max 30 segundos)
      const maxIntentos = 15;
      const intervaloMs = 2000;
      let intentos = 0;
      let resultado = null;

      while (intentos < maxIntentos) {
        await new Promise((resolve) => setTimeout(resolve, intervaloMs));
        intentos++;

        // Reutilizamos consultarTestRegistrador ya que usa la misma tabla
        resultado = await consultarTestRegistrador(agenteId, testId);

        if (resultado.estado === "completado") {
          // Test exitoso - mostrar coils
          const coils = resultado.valores || [];
          const bitsActivos = coils
            .map((c, i) => (c === 1 || c === true) ? coilsDireccion + i : null)
            .filter(b => b !== null);

          setResultadoTestCoils({
            error: false,
            mensaje: `Lectura exitosa (${resultado.tiempo_respuesta_ms || 0}ms)`,
            coils: coils.map((v, i) => ({
              direccion: coilsDireccion + i,
              valor: v === 1 || v === true ? 1 : 0,
            })),
            bitsActivos,
            tiempoMs: resultado.tiempo_respuesta_ms,
          });
          return;
        } else if (resultado.estado === "error" || resultado.estado === "timeout") {
          setResultadoTestCoils({
            error: true,
            mensaje: resultado.error_mensaje || "Error de conexión",
            coils: [],
          });
          return;
        }
        // Si está pendiente/enviado/ejecutando, seguir esperando
      }

      // Timeout del polling
      setResultadoTestCoils({
        error: true,
        mensaje: "Timeout: El agente no respondió a tiempo",
        coils: [],
      });
    } catch (error) {
      setResultadoTestCoils({
        error: true,
        mensaje: error.message || "Error al ejecutar test",
        coils: [],
      });
    } finally {
      setTestCoilsEnProgreso(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="config-rele">
      {/* Fila: Modelo y Configuración */}
      <div className="config-rele-modelo-row">
        <div className="config-rele-campo">
          <label>Modelo</label>
          <div className="config-rele-select-con-btn">
            <select
              value={config.modeloId}
              onChange={handleModeloChange}
              className="config-rele-select"
            >
              <option value="">Seleccionar...</option>
              {modelos.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>
                  {modelo.icono} {modelo.fabricante} {modelo.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="config-rele-btn-editar"
              onClick={() => setModalGestionAbierto(true)}
              title="Gestionar modelos"
            >
              ⚙️
            </button>
          </div>
        </div>

        <div className="config-rele-campo">
          <label>Configuración</label>
          <select
            value={config.configuracionId}
            onChange={handleConfiguracionChange}
            className="config-rele-select"
            disabled={!config.modeloId}
          >
            <option value="">Seleccionar...</option>
            {configuracionesDisponibles.map((cfg) => (
              <option key={cfg.id} value={cfg.id}>
                {cfg.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Badges de capacidades */}
      {config.configuracionId && (
        <div className="config-rele-capacidades">
          {tieneCapacidad(config.configuracionId, "medicionCorriente") && (
            <span className="config-rele-badge">⚡ Corriente</span>
          )}
          {tieneCapacidad(config.configuracionId, "medicionTension") && (
            <span className="config-rele-badge">🔌 Tensión</span>
          )}
          {tieneCapacidad(config.configuracionId, "proteccionDireccional") && (
            <span className="config-rele-badge">➡️ Direccional</span>
          )}
          {tieneCapacidad(config.configuracionId, "autorecierre") && (
            <span className="config-rele-badge">🔁 Recierre</span>
          )}
          {tieneCapacidad(config.configuracionId, "proteccionDiferencial") && (
            <span className="config-rele-badge">🔄 Diferencial</span>
          )}
        </div>
      )}

      {/* Grid principal de 4 cuadrantes */}
      <div className="config-rele-grid-principal">
        {/* Columna izquierda */}
        <div className="config-rele-columna-izq">
          {/* Sección Conexión Modbus */}
          <div className="config-rele-seccion">
            <h6>📡 Conexión Modbus TCP</h6>
            <div className="config-rele-conexion-grid">
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
                  onChange={(e) => handleConexionChange("puerto", e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="502"
                />
              </div>
              <div className="config-rele-campo-inline">
                <label>Unit ID</label>
                <input
                  type="number"
                  value={config.conexion.unitId}
                  onChange={(e) => handleConexionChange("unitId", e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Índice, Cantidad e Intervalo - dentro de Conexión Modbus */}
            {config.configuracionId && (
              <div className="config-rele-indice-grid">
                <div className="config-rele-campo-inline">
                  <label>Índice Inicial</label>
                  <input
                    type="number"
                    value={config.conexion.indiceInicial ?? ""}
                    onChange={(e) => handleConexionChange("indiceInicial", e.target.value === "" ? "" : parseInt(e.target.value))}
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div className="config-rele-campo-inline">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    value={config.conexion.cantidad ?? ""}
                    onChange={(e) => handleConexionChange("cantidad", e.target.value === "" ? "" : parseInt(e.target.value))}
                    placeholder="20"
                    min={1}
                  />
                </div>
                <div className="config-rele-campo-inline">
                  <label>Intervalo</label>
                  <div className="config-rele-input-sufijo">
                    <input
                      type="number"
                      value={config.intervaloSegundos}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          intervaloSegundos: e.target.value === "" ? "" : parseInt(e.target.value),
                        }))
                      }
                      placeholder="60"
                      min={1}
                      step={1}
                    />
                    <span>s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sección Test de Conexión */}
          {config.configuracionId && (
            <div className="config-rele-seccion config-rele-seccion-test">
              <div className="config-rele-test-consola">
                {testEnProgreso ? (
                  <div className="test-consola-loading">
                    <span className="test-spinner"></span>
                    <span>Ejecutando test...</span>
                  </div>
                ) : resultadoTest ? (
                  <div className={`test-consola-resultado ${resultadoTest.error ? "error" : "exito"}`}>
                    <div className="test-consola-header">
                      {resultadoTest.error ? "❌" : "✅"} {resultadoTest.mensaje}
                    </div>
                    {resultadoTest.lineas.map((linea, idx) => {
                      if (linea.tipo === "titulo") {
                        return (
                          <div key={idx} className="test-consola-titulo">
                            {linea.texto}
                          </div>
                        );
                      } else if (linea.tipo === "registro-item") {
                        return (
                          <div key={idx} className={`test-consola-registro-item ${linea.relevante ? "relevante" : ""}`}>
                            <span className="registro-num">{linea.registro}</span>
                            <span className="registro-valor">{linea.valor}</span>
                          </div>
                        );
                      } else if (linea.tipo === "alarma-activa") {
                        return (
                          <div key={idx} className="test-consola-linea test-consola-alarma">
                            <span className="test-label">{linea.label}:</span>
                            <span className="test-valor">{linea.valor}</span>
                          </div>
                        );
                      } else if (linea.tipo === "protecciones-ok") {
                        return (
                          <div key={idx} className="test-consola-protecciones-ok">
                            {linea.texto}
                          </div>
                        );
                      } else if (linea.tipo === "proteccion") {
                        return (
                          <div key={idx} className="test-consola-linea test-consola-proteccion">
                            <span className="test-label">{linea.label}:</span>
                            <span className="test-valor">{linea.valor}</span>
                          </div>
                        );
                      } else {
                        return (
                          <div key={idx} className="test-consola-linea">
                            <span className="test-label">{linea.label}:</span>
                            <span className="test-valor">{linea.valor}{linea.unidad}</span>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <div className="test-consola-vacio">
                    {!agenteId ? (
                      <span>Requiere agente conectado para probar</span>
                    ) : (
                      <span>Presiona "Test" para probar la conexión</span>
                    )}
                  </div>
                )}
              </div>
              <div className="config-rele-test-acciones">
                <button
                  type="button"
                  className="config-rele-btn-test"
                  onClick={ejecutarTest}
                  disabled={testEnProgreso || !config.conexion.ip || !config.conexion.puerto || !agenteId}
                  title={!agenteId ? "Requiere agente conectado" : "Probar conexión Modbus"}
                >
                  {testEnProgreso ? "..." : "Test"}
                </button>
                <button
                  type="button"
                  className="config-rele-btn-exportar"
                  onClick={exportarRegistrosCSV}
                  disabled={!resultadoTest || resultadoTest.error || !resultadoTest.registrosCrudos}
                  title="Exportar registros a CSV"
                >
                  CSV
                </button>
              </div>
            </div>
          )}

          {/* Sección Test de Coils (Bits) - Experimental */}
          {config.configuracionId && (
            <div className="config-rele-seccion config-rele-seccion-test-coils">
              <h6>🔘 Test Coils (Bits) - Experimental</h6>
              <div className="config-rele-coils-params">
                <div className="config-rele-campo-inline">
                  <label>Dir. Inicial</label>
                  <input
                    type="number"
                    value={coilsDireccion}
                    onChange={(e) => setCoilsDireccion(parseInt(e.target.value) || 0)}
                    placeholder="2880"
                    min={0}
                  />
                </div>
                <div className="config-rele-campo-inline">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    value={coilsCantidad}
                    onChange={(e) => setCoilsCantidad(parseInt(e.target.value) || 16)}
                    placeholder="32"
                    min={1}
                    max={125}
                  />
                </div>
                <button
                  type="button"
                  className="config-rele-btn-test-coils"
                  onClick={ejecutarTestCoils}
                  disabled={testCoilsEnProgreso || !config.conexion.ip || !config.conexion.puerto || !agenteId}
                  title={!agenteId ? "Requiere agente conectado" : "Leer bits (Modbus FC01)"}
                >
                  {testCoilsEnProgreso ? "Leyendo..." : "Leer Coils"}
                </button>
              </div>

              <div className="config-rele-test-consola config-rele-coils-consola">
                {testCoilsEnProgreso ? (
                  <div className="test-consola-loading">
                    <span className="test-spinner"></span>
                    <span>Leyendo coils...</span>
                  </div>
                ) : resultadoTestCoils ? (
                  <div className={`test-consola-resultado ${resultadoTestCoils.error ? "error" : "exito"}`}>
                    <div className="test-consola-header">
                      {resultadoTestCoils.error ? "❌" : "✅"} {resultadoTestCoils.mensaje}
                    </div>
                    {!resultadoTestCoils.error && resultadoTestCoils.bitsActivos && (
                      <div className="test-coils-activos">
                        <strong>Bits activos ({resultadoTestCoils.bitsActivos.length}):</strong>
                        {resultadoTestCoils.bitsActivos.length > 0 ? (
                          <span className="coils-lista-activos">
                            {resultadoTestCoils.bitsActivos.join(", ")}
                          </span>
                        ) : (
                          <span className="coils-ninguno">Ninguno</span>
                        )}
                      </div>
                    )}
                    {!resultadoTestCoils.error && resultadoTestCoils.coils && (
                      <div className="test-coils-grid">
                        {resultadoTestCoils.coils.map((coil) => (
                          <div
                            key={coil.direccion}
                            className={`test-coil-item ${coil.valor === 1 ? "activo" : "inactivo"}`}
                            title={`Dir: ${coil.direccion}`}
                          >
                            <span className="coil-dir">{coil.direccion}</span>
                            <span className="coil-val">{coil.valor}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="test-consola-vacio">
                    <span>Lee bits con Modbus función 01 (Read Coils)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="config-rele-columna-der">

        {/* Sección Registros Modbus - Solo si hay configuración seleccionada */}
        {config.configuracionId && (
          <div className="config-rele-seccion">
            <h6>📋 Registros Modbus</h6>
            <div className="config-rele-registros">
              <div className="config-rele-registros-wrapper">
              {/* Corrientes - Solo si tiene capacidad */}
              {tieneCapacidad(config.configuracionId, "medicionCorriente") && (
                <div className="config-rele-registro-grupo">
                  <span className="registro-grupo-label">⚡ Corrientes:</span>
                  <div className="config-rele-registro-campos">
                    <div className="config-rele-campo-mini">
                      <label>IL1</label>
                      <input
                        type="number"
                        value={config.registros.corrientes.IL1}
                        onChange={(e) => handleRegistroChange("corrientes", "IL1", e.target.value)}
                        placeholder="138"
                      />
                    </div>
                    <div className="config-rele-campo-mini">
                      <label>IL2</label>
                      <input
                        type="number"
                        value={config.registros.corrientes.IL2}
                        onChange={(e) => handleRegistroChange("corrientes", "IL2", e.target.value)}
                        placeholder="139"
                      />
                    </div>
                    <div className="config-rele-campo-mini">
                      <label>IL3</label>
                      <input
                        type="number"
                        value={config.registros.corrientes.IL3}
                        onChange={(e) => handleRegistroChange("corrientes", "IL3", e.target.value)}
                        placeholder="140"
                      />
                    </div>
                    <div className="config-rele-campo-mini">
                      <label>Io</label>
                      <input
                        type="number"
                        value={config.registros.corrientes.Io}
                        onChange={(e) => handleRegistroChange("corrientes", "Io", e.target.value)}
                        placeholder="141"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tensiones - Solo si tiene capacidad */}
              {tieneCapacidad(config.configuracionId, "medicionTension") && (
                <div className="config-rele-registro-grupo">
                  <span className="registro-grupo-label">🔌 Tensiones:</span>
                  <div className="config-rele-registro-campos config-rele-registro-campos--tres">
                    <div className="config-rele-campo-mini">
                      <label>VA</label>
                      <input
                        type="number"
                        value={config.registros.tensiones.VA}
                        onChange={(e) => handleRegistroChange("tensiones", "VA", e.target.value)}
                        placeholder="152"
                      />
                    </div>
                    <div className="config-rele-campo-mini">
                      <label>VB</label>
                      <input
                        type="number"
                        value={config.registros.tensiones.VB}
                        onChange={(e) => handleRegistroChange("tensiones", "VB", e.target.value)}
                        placeholder="153"
                      />
                    </div>
                    <div className="config-rele-campo-mini">
                      <label>VC</label>
                      <input
                        type="number"
                        value={config.registros.tensiones.VC}
                        onChange={(e) => handleRegistroChange("tensiones", "VC", e.target.value)}
                        placeholder="154"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Estado del Interruptor - Siempre visible */}
              <div className="config-rele-registro-grupo">
                <span className="registro-grupo-label">🔲 Interruptor:</span>
                <div className="config-rele-registro-campos">
                  <div className="config-rele-campo-mini">
                    <label>Reg</label>
                    <input
                      type="number"
                      value={config.registros.estadoCB.registro}
                      onChange={(e) => handleRegistroChange("estadoCB", "registro", e.target.value)}
                      placeholder="175"
                    />
                  </div>
                  <div className="config-rele-campo-mini">
                    <label>Cerrado</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={config.registros.estadoCB.bitCerrado}
                      onChange={(e) => handleRegistroChange("estadoCB", "bitCerrado", e.target.value)}
                      placeholder="4"
                    />
                  </div>
                  <div className="config-rele-campo-mini">
                    <label>Abierto</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={config.registros.estadoCB.bitAbierto}
                      onChange={(e) => handleRegistroChange("estadoCB", "bitAbierto", e.target.value)}
                      placeholder="5"
                    />
                  </div>
                  <div className="config-rele-campo-mini">
                    <label>Error</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={config.registros.estadoCB.bitError}
                      onChange={(e) => handleRegistroChange("estadoCB", "bitError", e.target.value)}
                      placeholder="6"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        )}

          {/* Sección: Protecciones a Monitorear */}
          {config.configuracionId && (
            <div className="config-rele-seccion config-rele-seccion-protecciones">
              <h6>
                🔔 Protecciones a Monitorear
                <span className="config-rele-contador">
                  {config.proteccionesMonitoreadas.filter((p) => p.habilitado).length} / {proteccionesDisponibles.length}
                </span>
              </h6>

              <div className="config-rele-protecciones">
                {Object.entries(proteccionesAgrupadas).map(([categoriaId, categoria]) => (
                  <div key={categoriaId} className="config-rele-categoria">
                    <div className="config-rele-categoria-header">
                      <span className="categoria-icono">{categoria.icono}</span>
                      <span className="categoria-nombre">{categoria.nombre}</span>
                      <div className="categoria-acciones">
                        <button
                          type="button"
                          className="btn-categoria"
                          onClick={() => handleSeleccionarTodas(categoriaId, true)}
                          title="Seleccionar todas"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          className="btn-categoria"
                          onClick={() => handleSeleccionarTodas(categoriaId, false)}
                          title="Deseleccionar todas"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="config-rele-protecciones-grid">
                      {categoria.protecciones.map((proteccion) => {
                        const estado = getEstadoProteccion(proteccion.codigo);
                        const severidad = SEVERIDADES[proteccion.severidad];

                        return (
                          <div
                            key={proteccion.codigo}
                            className={`config-rele-proteccion ${estado.habilitado ? "activa" : "inactiva"}`}
                          >
                            <label className="proteccion-check">
                              <input
                                type="checkbox"
                                checked={estado.habilitado}
                                onChange={() => handleProteccionToggle(proteccion.codigo)}
                              />
                              <span
                                className="proteccion-indicador"
                                style={{ backgroundColor: severidad?.color }}
                              />
                              <span className="proteccion-codigo">{proteccion.nombreCorto}</span>
                            </label>
                            <label className="proteccion-notificar" title="Notificar al activarse">
                              <input
                                type="checkbox"
                                checked={estado.notificar}
                                onChange={() => handleNotificarToggle(proteccion.codigo)}
                                disabled={!estado.habilitado}
                              />
                              <span className="notificar-icono">🔔</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Gestión de Modelos */}
      <ModalGestionModelosRele
        abierto={modalGestionAbierto}
        onCerrar={() => setModalGestionAbierto(false)}
        onModeloCreado={handleModeloCreado}
      />
    </div>
  );
};

export default ConfiguracionRele;
