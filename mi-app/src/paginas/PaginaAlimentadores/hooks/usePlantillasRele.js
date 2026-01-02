import { useState, useEffect, useCallback } from "react";
import {
  FUNCIONALIDADES_DISPONIBLES,
  STORAGE_KEY_PLANTILLAS,
} from "../constantes/funcionalidadesRele";

/**
 * Hook para gestionar plantillas de relés de protección.
 * Maneja CRUD de plantillas en localStorage.
 */
export const usePlantillasRele = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Cargar plantillas al montar
  useEffect(() => {
    cargarPlantillas();
  }, []);

  /**
   * Carga las plantillas desde localStorage
   */
  const cargarPlantillas = useCallback(() => {
    setCargando(true);
    try {
      const datos = localStorage.getItem(STORAGE_KEY_PLANTILLAS);
      const plantillasGuardadas = datos ? JSON.parse(datos) : [];
      setPlantillas(plantillasGuardadas);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      setPlantillas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  /**
   * Guarda las plantillas en localStorage
   */
  const guardarEnStorage = useCallback((nuevasPlantillas) => {
    try {
      localStorage.setItem(
        STORAGE_KEY_PLANTILLAS,
        JSON.stringify(nuevasPlantillas)
      );
      setPlantillas(nuevasPlantillas);
      return true;
    } catch (error) {
      console.error("Error al guardar plantillas:", error);
      return false;
    }
  }, []);

  /**
   * Genera un UUID simple
   */
  const generarId = () => {
    return "plt-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  };

  /**
   * Crea una nueva plantilla
   * @param {Object} datos - { nombre, descripcion, funcionalidades, etiquetasBits, plantillaEtiquetasId }
   * funcionalidades es un objeto con { [idFuncionalidad]: { habilitado, registro } }
   * etiquetasBits es un objeto con { [bit]: { texto, severidad } }
   * plantillaEtiquetasId es el ID de la plantilla de etiquetas seleccionada (para restaurar al editar)
   */
  const crearPlantilla = useCallback(
    (datos) => {
      const nuevaPlantilla = {
        id: generarId(),
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion?.trim() || "",
        fechaCreacion: new Date().toISOString(),
        funcionalidades: datos.funcionalidades || {},
        etiquetasBits: datos.etiquetasBits || {},
        plantillaEtiquetasId: datos.plantillaEtiquetasId || null,
      };

      const nuevasPlantillas = [...plantillas, nuevaPlantilla];
      const exito = guardarEnStorage(nuevasPlantillas);

      return exito ? nuevaPlantilla : null;
    },
    [plantillas, guardarEnStorage]
  );

  /**
   * Actualiza una plantilla existente
   * @param {string} id - ID de la plantilla
   * @param {Object} datos - Datos a actualizar
   */
  const actualizarPlantilla = useCallback(
    (id, datos) => {
      const indice = plantillas.findIndex((p) => p.id === id);
      if (indice === -1) return false;

      const plantillaActualizada = {
        ...plantillas[indice],
        nombre: datos.nombre?.trim() || plantillas[indice].nombre,
        descripcion: datos.descripcion?.trim() ?? plantillas[indice].descripcion,
        funcionalidades: datos.funcionalidades || plantillas[indice].funcionalidades,
        etiquetasBits: datos.etiquetasBits ?? plantillas[indice].etiquetasBits ?? {},
        plantillaEtiquetasId: datos.plantillaEtiquetasId !== undefined
          ? datos.plantillaEtiquetasId
          : plantillas[indice].plantillaEtiquetasId ?? null,
        fechaModificacion: new Date().toISOString(),
      };

      const nuevasPlantillas = [...plantillas];
      nuevasPlantillas[indice] = plantillaActualizada;

      return guardarEnStorage(nuevasPlantillas);
    },
    [plantillas, guardarEnStorage]
  );

  /**
   * Elimina una plantilla
   * @param {string} id - ID de la plantilla a eliminar
   */
  const eliminarPlantilla = useCallback(
    (id) => {
      const nuevasPlantillas = plantillas.filter((p) => p.id !== id);
      return guardarEnStorage(nuevasPlantillas);
    },
    [plantillas, guardarEnStorage]
  );

  /**
   * Obtiene una plantilla por ID
   * @param {string} id - ID de la plantilla
   */
  const obtenerPlantilla = useCallback(
    (id) => {
      return plantillas.find((p) => p.id === id) || null;
    },
    [plantillas]
  );

  /**
   * Obtiene las funcionalidades de una plantilla con sus valores por defecto
   * @param {string} plantillaId - ID de la plantilla
   * @returns {Object} - { [idFunc]: { habilitado, registro } }
   */
  const obtenerFuncionalidadesPlantilla = useCallback(
    (plantillaId) => {
      const plantilla = obtenerPlantilla(plantillaId);
      if (!plantilla) return {};

      // Construir objeto con todas las funcionalidades de la plantilla
      const funcionalidades = {};
      Object.keys(plantilla.funcionalidades).forEach((funcId) => {
        const funcPlantilla = plantilla.funcionalidades[funcId];
        const funcBase = FUNCIONALIDADES_DISPONIBLES[funcId];

        if (funcBase && funcPlantilla.habilitado) {
          funcionalidades[funcId] = {
            habilitado: true,
            registro: funcPlantilla.registro || funcBase.registroDefault,
            cantidad: funcBase.cantidad,
            nombre: funcBase.nombre,
          };
        }
      });

      return funcionalidades;
    },
    [obtenerPlantilla]
  );

  /**
   * Genera la configuración de funcionalidades activas por defecto basada en una plantilla
   * @param {string} plantillaId - ID de la plantilla
   * @returns {Object} - Configuración inicial para funcionalidadesActivas
   */
  const generarConfiguracionInicial = useCallback(
    (plantillaId) => {
      const plantilla = obtenerPlantilla(plantillaId);
      if (!plantilla) return {};

      const config = {};
      Object.keys(plantilla.funcionalidades).forEach((funcId) => {
        const funcPlantilla = plantilla.funcionalidades[funcId];
        const funcBase = FUNCIONALIDADES_DISPONIBLES[funcId];

        if (funcBase && funcPlantilla.habilitado) {
          config[funcId] = {
            habilitado: true,
            registro: funcPlantilla.registro || funcBase.registroDefault,
          };
        }
      });

      return config;
    },
    [obtenerPlantilla]
  );

  return {
    plantillas,
    cargando,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla,
    obtenerPlantilla,
    obtenerFuncionalidadesPlantilla,
    generarConfiguracionInicial,
    recargar: cargarPlantillas,
  };
};

export default usePlantillasRele;
