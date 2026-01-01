import { useState, useEffect, useRef } from "react";
import {
  FUNCIONALIDADES_DISPONIBLES,
  getFuncionalidadesPorCategoria,
} from "../../constantes/funcionalidadesRele";
import { usePlantillasRele } from "../../hooks/usePlantillasRele";
import ModalPlantillasRele from "./ModalPlantillasRele";
import "./ConfiguracionRele.css";

/**
 * Componente simplificado para configurar un registrador de tipo Relé de Protección.
 * Basado en plantillas que el usuario crea y gestiona.
 *
 * @param {Object} configuracionInicial - Configuración inicial del relé (para edición)
 * @param {Function} onChange - Callback al cambiar la configuración
 * @param {string} agenteId - ID del agente (para futura integración de test)
 */
const ConfiguracionRele = ({ configuracionInicial, onChange, agenteId: _agenteId }) => {
  // _agenteId reservado para futura integración de test de conexión
  // Hook de plantillas
  const {
    plantillas,
    cargando: cargandoPlantillas,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla,
    obtenerPlantilla,
    generarConfiguracionInicial,
  } = usePlantillasRele();

  // Ref para evitar bucle infinito en notificación de cambios
  const configAnteriorRef = useRef(null);
  const inicializadoRef = useRef(false);

  // Estado del modal de plantillas
  const [modalPlantillasAbierto, setModalPlantillasAbierto] = useState(false);
  const [plantillaParaEditar, setPlantillaParaEditar] = useState(null);

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
    funcionalidadesActivas: {},
  });

  // Funcionalidades agrupadas por categoría
  const funcionalidadesPorCategoria = getFuncionalidadesPorCategoria();

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

    // Generar configuración inicial basada en la plantilla
    const funcionalidadesIniciales = generarConfiguracionInicial(plantillaId);

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

  const handleToggleFuncionalidad = (funcId) => {
    setConfig((prev) => {
      const estadoActual = prev.funcionalidadesActivas[funcId];
      const funcBase = FUNCIONALIDADES_DISPONIBLES[funcId];
      const plantillaFunc = plantillaSeleccionada?.funcionalidades?.[funcId];

      if (estadoActual?.habilitado) {
        // Deshabilitar
        const nuevasFunc = { ...prev.funcionalidadesActivas };
        delete nuevasFunc[funcId];
        return { ...prev, funcionalidadesActivas: nuevasFunc };
      } else {
        // Habilitar con registro de la plantilla o default
        return {
          ...prev,
          funcionalidadesActivas: {
            ...prev.funcionalidadesActivas,
            [funcId]: {
              habilitado: true,
              registro:
                plantillaFunc?.registro || funcBase?.registroDefault || 0,
            },
          },
        };
      }
    });
  };

  const handleCambiarRegistro = (funcId, valor) => {
    setConfig((prev) => ({
      ...prev,
      funcionalidadesActivas: {
        ...prev.funcionalidadesActivas,
        [funcId]: {
          ...prev.funcionalidadesActivas[funcId],
          registro: valor === "" ? "" : parseInt(valor) || 0,
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

  // Verificar si la plantilla seleccionada aún existe
  const plantillaNoEncontrada =
    config.plantillaId && !plantillaSeleccionada;

  return (
    <div className="config-rele">
      {/* Sección: Plantilla */}
      <div className="config-rele-seccion">
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

      {/* Sección: Conexión Modbus TCP - Siempre visible */}
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

        <div className="config-rele-registros-row">
          <div className="config-rele-campo-inline">
            <label>Registro Inicial</label>
            <input
              type="number"
              value={config.registroInicial}
              onChange={(e) => handleRegistroInicialChange(e.target.value)}
              placeholder="120"
              min={0}
            />
          </div>
          <div className="config-rele-campo-inline">
            <label>Cantidad de Registros</label>
            <input
              type="number"
              value={config.cantidadRegistros}
              onChange={(e) => handleCantidadRegistrosChange(e.target.value)}
              placeholder="80"
              min={1}
            />
          </div>
        </div>
      </div>

      {/* Sección: Funcionalidades a Monitorear - Solo si hay plantilla */}
      {plantillaSeleccionada && (
        <div className="config-rele-seccion">
          <h6>
            🔧 Funcionalidades a Monitorear
            <span className="config-rele-contador">
              {Object.keys(config.funcionalidadesActivas).length} activas
            </span>
          </h6>

          <div className="config-rele-funcionalidades">
            {Object.entries(funcionalidadesPorCategoria).map(
              ([catId, categoria]) => {
                // Filtrar solo las funcionalidades que están en la plantilla
                const funcEnPlantilla = categoria.funcionalidades.filter(
                  (f) => plantillaSeleccionada.funcionalidades?.[f.id]?.habilitado
                );

                if (funcEnPlantilla.length === 0) return null;

                return (
                  <div key={catId} className="config-rele-categoria">
                    <div className="config-rele-categoria-header">
                      <span>
                        {categoria.icono} {categoria.nombre}
                      </span>
                    </div>

                    <div className="config-rele-func-lista">
                      {funcEnPlantilla.map((func) => {
                        const estado = config.funcionalidadesActivas[func.id];
                        const plantillaFunc =
                          plantillaSeleccionada.funcionalidades[func.id];

                        return (
                          <div
                            key={func.id}
                            className={`config-rele-func-item ${
                              estado?.habilitado ? "activo" : ""
                            }`}
                          >
                            <label className="config-rele-func-check">
                              <input
                                type="checkbox"
                                checked={estado?.habilitado || false}
                                onChange={() => handleToggleFuncionalidad(func.id)}
                              />
                              <span className="config-rele-func-nombre">
                                {func.nombre}
                              </span>
                            </label>
                            <div className="config-rele-func-registro">
                              <label>Registro:</label>
                              <input
                                type="number"
                                value={
                                  estado?.registro ??
                                  plantillaFunc?.registro ??
                                  func.registroDefault
                                }
                                onChange={(e) =>
                                  handleCambiarRegistro(func.id, e.target.value)
                                }
                                disabled={!estado?.habilitado}
                                min={0}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

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
