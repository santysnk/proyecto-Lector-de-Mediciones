import { useState, useEffect, useCallback } from "react";
import { CATEGORIAS_PROTECCION } from "../constantes/datosBaseReles";

const STORAGE_KEY_MODELOS = "relaywatch_modelos_rele";
const STORAGE_KEY_CONFIGURACIONES = "relaywatch_configuraciones_rele";

/**
 * Hook para gestionar modelos de relé y sus configuraciones.
 * Solo usa datos personalizados del usuario guardados en localStorage.
 * No incluye modelos base precargados.
 */
export const useModelosRele = () => {
  // Estado para modelos del usuario
  const [modelosPersonalizados, setModelosPersonalizados] = useState({});

  // Estado para configuraciones del usuario
  const [configuracionesPersonalizadas, setConfiguracionesPersonalizadas] = useState({});

  // Cargar datos personalizados de localStorage al iniciar
  useEffect(() => {
    try {
      const modelosGuardados = localStorage.getItem(STORAGE_KEY_MODELOS);
      if (modelosGuardados) {
        setModelosPersonalizados(JSON.parse(modelosGuardados));
      }

      const configsGuardadas = localStorage.getItem(STORAGE_KEY_CONFIGURACIONES);
      if (configsGuardadas) {
        setConfiguracionesPersonalizadas(JSON.parse(configsGuardadas));
      }
    } catch (error) {
      console.error("Error al cargar modelos/configuraciones de localStorage:", error);
    }
  }, []);

  // Guardar modelos personalizados en localStorage
  useEffect(() => {
    if (Object.keys(modelosPersonalizados).length > 0) {
      localStorage.setItem(STORAGE_KEY_MODELOS, JSON.stringify(modelosPersonalizados));
    }
  }, [modelosPersonalizados]);

  // Guardar configuraciones personalizadas en localStorage
  useEffect(() => {
    if (Object.keys(configuracionesPersonalizadas).length > 0) {
      localStorage.setItem(STORAGE_KEY_CONFIGURACIONES, JSON.stringify(configuracionesPersonalizadas));
    }
  }, [configuracionesPersonalizadas]);

  // ============================================================================
  // MODELOS (Solo los del usuario)
  // ============================================================================

  const todosLosModelos = modelosPersonalizados;
  const todasLasConfiguraciones = configuracionesPersonalizadas;

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Obtiene todos los modelos como array
   */
  const getModelos = useCallback(() => {
    return Object.values(todosLosModelos);
  }, [todosLosModelos]);

  /**
   * Obtiene un modelo por ID
   */
  const getModelo = useCallback(
    (modeloId) => {
      return todosLosModelos[modeloId] || null;
    },
    [todosLosModelos]
  );

  /**
   * Obtiene todas las configuraciones como array
   */
  const getConfiguraciones = useCallback(() => {
    return Object.values(todasLasConfiguraciones);
  }, [todasLasConfiguraciones]);

  /**
   * Obtiene una configuración por ID
   */
  const getConfiguracion = useCallback(
    (configId) => {
      return todasLasConfiguraciones[configId] || null;
    },
    [todasLasConfiguraciones]
  );

  /**
   * Obtiene configuraciones disponibles para un modelo
   */
  const getConfiguracionesDeModelo = useCallback(
    (modeloId) => {
      const modelo = todosLosModelos[modeloId];
      if (!modelo) return [];

      return modelo.configuraciones
        .map((configId) => todasLasConfiguraciones[configId])
        .filter(Boolean);
    },
    [todosLosModelos, todasLasConfiguraciones]
  );

  /**
   * Obtiene protecciones de una configuración
   */
  const getProtecciones = useCallback(
    (configId) => {
      const config = todasLasConfiguraciones[configId];
      if (!config) return [];
      return config.protecciones || [];
    },
    [todasLasConfiguraciones]
  );

  /**
   * Obtiene protecciones agrupadas por categoría
   */
  const getProteccionesAgrupadas = useCallback(
    (configId) => {
      const config = todasLasConfiguraciones[configId];
      if (!config) return {};

      const protecciones = config.protecciones || [];

      return protecciones.reduce((acc, prot) => {
        const categoria = prot.categoria || "otros";
        if (!acc[categoria]) {
          acc[categoria] = {
            ...(CATEGORIAS_PROTECCION[categoria] || { id: categoria, nombre: categoria, icono: "⚙️", color: "#64748b" }),
            protecciones: []
          };
        }
        acc[categoria].protecciones.push(prot);
        return acc;
      }, {});
    },
    [todasLasConfiguraciones]
  );

  /**
   * Verifica si una configuración tiene una capacidad específica
   */
  const tieneCapacidad = useCallback(
    (configId, capacidad) => {
      const config = todasLasConfiguraciones[configId];
      if (!config) return false;
      return config.capacidades?.[capacidad] === true;
    },
    [todasLasConfiguraciones]
  );

  // ============================================================================
  // CRUD MODELOS
  // ============================================================================

  /**
   * Agrega un nuevo modelo
   */
  const agregarModelo = useCallback((modelo) => {
    if (!modelo.id || !modelo.nombre) {
      throw new Error("El modelo debe tener id y nombre");
    }

    setModelosPersonalizados((prev) => ({
      ...prev,
      [modelo.id]: {
        ...modelo,
        configuraciones: modelo.configuraciones || [],
      },
    }));

    return modelo;
  }, []);

  /**
   * Actualiza un modelo
   */
  const actualizarModelo = useCallback((modeloId, datosActualizados) => {
    setModelosPersonalizados((prev) => {
      if (!prev[modeloId]) {
        throw new Error("Modelo no encontrado");
      }

      return {
        ...prev,
        [modeloId]: {
          ...prev[modeloId],
          ...datosActualizados,
        },
      };
    });
  }, []);

  /**
   * Elimina un modelo
   */
  const eliminarModelo = useCallback((modeloId) => {
    setModelosPersonalizados((prev) => {
      const { [modeloId]: _eliminado, ...resto } = prev;
      return resto;
    });

    // También eliminar configuraciones asociadas
    setConfiguracionesPersonalizadas((prev) => {
      const nuevasConfigs = {};
      for (const [configId, config] of Object.entries(prev)) {
        if (config.modeloId !== modeloId) {
          nuevasConfigs[configId] = config;
        }
      }
      return nuevasConfigs;
    });
  }, []);

  // ============================================================================
  // CRUD CONFIGURACIONES
  // ============================================================================

  /**
   * Agrega una nueva configuración
   */
  const agregarConfiguracion = useCallback((configuracion) => {
    if (!configuracion.id || !configuracion.nombre || !configuracion.modeloId) {
      throw new Error("La configuración debe tener id, nombre y modeloId");
    }

    setConfiguracionesPersonalizadas((prev) => ({
      ...prev,
      [configuracion.id]: {
        ...configuracion,
        protecciones: configuracion.protecciones || [],
        capacidades: configuracion.capacidades || {},
        registros: configuracion.registros || {},
      },
    }));

    // Agregar la configuración al modelo correspondiente
    // Usamos el setter funcional para asegurar que tenemos el estado más reciente
    setModelosPersonalizados((prev) => {
      // Si el modelo existe y la configuración no está ya en la lista
      if (prev[configuracion.modeloId]) {
        const configuracionesActuales = prev[configuracion.modeloId].configuraciones || [];
        if (!configuracionesActuales.includes(configuracion.id)) {
          return {
            ...prev,
            [configuracion.modeloId]: {
              ...prev[configuracion.modeloId],
              configuraciones: [...configuracionesActuales, configuracion.id],
            },
          };
        }
      }
      return prev;
    });

    return configuracion;
  }, []);

  /**
   * Actualiza una configuración
   */
  const actualizarConfiguracion = useCallback((configId, datosActualizados) => {
    setConfiguracionesPersonalizadas((prev) => {
      if (!prev[configId]) {
        throw new Error("Configuración no encontrada");
      }

      return {
        ...prev,
        [configId]: {
          ...prev[configId],
          ...datosActualizados,
        },
      };
    });
  }, []);

  /**
   * Elimina una configuración
   */
  const eliminarConfiguracion = useCallback((configId) => {
    setConfiguracionesPersonalizadas((prev) => {
      const { [configId]: _eliminada, ...resto } = prev;
      return resto;
    });

    // Remover de la lista de configuraciones del modelo
    setModelosPersonalizados((prev) => {
      const nuevosModelos = {};
      for (const [modeloId, modelo] of Object.entries(prev)) {
        nuevosModelos[modeloId] = {
          ...modelo,
          configuraciones: (modelo.configuraciones || []).filter((id) => id !== configId),
        };
      }
      return nuevosModelos;
    });
  }, []);

  // ============================================================================
  // CRUD PROTECCIONES (dentro de una configuración)
  // ============================================================================

  /**
   * Agrega una protección a una configuración
   */
  const agregarProteccion = useCallback((configId, proteccion) => {
    if (!proteccion.codigo || !proteccion.nombre) {
      throw new Error("La protección debe tener código y nombre");
    }

    setConfiguracionesPersonalizadas((prev) => {
      if (!prev[configId]) {
        throw new Error("Configuración no encontrada");
      }

      const proteccionesActuales = prev[configId].protecciones || [];

      // Verificar que no exista ya
      if (proteccionesActuales.some((p) => p.codigo === proteccion.codigo)) {
        throw new Error("Ya existe una protección con ese código");
      }

      return {
        ...prev,
        [configId]: {
          ...prev[configId],
          protecciones: [...proteccionesActuales, proteccion],
        },
      };
    });
  }, []);

  /**
   * Actualiza una protección en una configuración
   */
  const actualizarProteccion = useCallback((configId, codigoProteccion, datosActualizados) => {
    setConfiguracionesPersonalizadas((prev) => {
      if (!prev[configId]) {
        throw new Error("Configuración no encontrada");
      }

      const proteccionesActualizadas = (prev[configId].protecciones || []).map((p) =>
        p.codigo === codigoProteccion ? { ...p, ...datosActualizados } : p
      );

      return {
        ...prev,
        [configId]: {
          ...prev[configId],
          protecciones: proteccionesActualizadas,
        },
      };
    });
  }, []);

  /**
   * Elimina una protección de una configuración
   */
  const eliminarProteccion = useCallback((configId, codigoProteccion) => {
    setConfiguracionesPersonalizadas((prev) => {
      if (!prev[configId]) {
        throw new Error("Configuración no encontrada");
      }

      return {
        ...prev,
        [configId]: {
          ...prev[configId],
          protecciones: (prev[configId].protecciones || []).filter(
            (p) => p.codigo !== codigoProteccion
          ),
        },
      };
    });
  }, []);

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Resetea todos los datos (elimina todos los modelos y configuraciones)
   */
  const resetearDatos = useCallback(() => {
    setModelosPersonalizados({});
    setConfiguracionesPersonalizadas({});
    localStorage.removeItem(STORAGE_KEY_MODELOS);
    localStorage.removeItem(STORAGE_KEY_CONFIGURACIONES);
  }, []);

  /**
   * Exporta todos los datos como JSON
   */
  const exportarDatos = useCallback(() => {
    return {
      modelos: modelosPersonalizados,
      configuraciones: configuracionesPersonalizadas,
      exportadoEn: new Date().toISOString(),
    };
  }, [modelosPersonalizados, configuracionesPersonalizadas]);

  /**
   * Importa datos desde JSON
   */
  const importarDatos = useCallback((datos) => {
    if (datos.modelos) {
      setModelosPersonalizados(datos.modelos);
    }
    if (datos.configuraciones) {
      setConfiguracionesPersonalizadas(datos.configuraciones);
    }
  }, []);

  return {
    // Datos
    modelos: todosLosModelos,
    configuraciones: todasLasConfiguraciones,

    // Getters
    getModelos,
    getModelo,
    getConfiguraciones,
    getConfiguracion,
    getConfiguracionesDeModelo,
    getProtecciones,
    getProteccionesAgrupadas,
    tieneCapacidad,

    // CRUD Modelos
    agregarModelo,
    actualizarModelo,
    eliminarModelo,

    // CRUD Configuraciones
    agregarConfiguracion,
    actualizarConfiguracion,
    eliminarConfiguracion,

    // CRUD Protecciones
    agregarProteccion,
    actualizarProteccion,
    eliminarProteccion,

    // Utilidades
    resetearDatos,
    exportarDatos,
    importarDatos,
  };
};

export default useModelosRele;
