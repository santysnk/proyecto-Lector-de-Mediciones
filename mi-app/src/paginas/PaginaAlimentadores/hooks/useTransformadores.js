import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "transformadores_ti_tv";

// Transformadores por defecto
const TRANSFORMADORES_DEFAULT = [
  { id: "ti-1", tipo: "TI", nombre: "TI 200/1", formula: "x * 200 / 1000" },
  { id: "ti-2", tipo: "TI", nombre: "TI 400/1", formula: "x * 400 / 1000" },
  { id: "ti-3", tipo: "TI", nombre: "TI 600/1", formula: "x * 600 / 1000" },
  { id: "tv-1", tipo: "TV", nombre: "TV 33kV", formula: "x * 33000 / 10000" },
  { id: "tv-2", tipo: "TV", nombre: "TV 13.2kV", formula: "x * 13200 / 10000" },
];

/**
 * Hook para gestionar transformadores de intensidad (TI) y voltaje (TV)
 * Persiste en localStorage
 */
export const useTransformadores = () => {
  const [transformadores, setTransformadores] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Cargar transformadores del localStorage
  const cargarTransformadores = useCallback(() => {
    try {
      const guardados = localStorage.getItem(STORAGE_KEY);
      if (guardados) {
        setTransformadores(JSON.parse(guardados));
      } else {
        // Primera vez: usar los por defecto
        setTransformadores(TRANSFORMADORES_DEFAULT);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(TRANSFORMADORES_DEFAULT));
      }
    } catch (error) {
      console.error("Error cargando transformadores:", error);
      setTransformadores(TRANSFORMADORES_DEFAULT);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarTransformadores();
  }, [cargarTransformadores]);

  // Guardar en localStorage
  const guardarEnStorage = useCallback((datos) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
      setTransformadores(datos);
      return true;
    } catch (error) {
      console.error("Error guardando transformadores:", error);
      return false;
    }
  }, []);

  // Generar ID único
  const generarId = () => {
    return "tr-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Obtener transformadores por tipo
  const obtenerPorTipo = useCallback(
    (tipo) => {
      return transformadores.filter((t) => t.tipo === tipo);
    },
    [transformadores]
  );

  // Obtener TIs
  const obtenerTIs = useCallback(() => obtenerPorTipo("TI"), [obtenerPorTipo]);

  // Obtener TVs
  const obtenerTVs = useCallback(() => obtenerPorTipo("TV"), [obtenerPorTipo]);

  // Obtener transformador por ID
  const obtenerPorId = useCallback(
    (id) => {
      return transformadores.find((t) => t.id === id) || null;
    },
    [transformadores]
  );

  // Crear transformador
  const crearTransformador = useCallback(
    (datos) => {
      const nuevo = {
        id: generarId(),
        tipo: datos.tipo,
        nombre: datos.nombre.trim(),
        formula: datos.formula.trim(),
      };

      const nuevos = [...transformadores, nuevo];
      const exito = guardarEnStorage(nuevos);
      return exito ? nuevo : null;
    },
    [transformadores, guardarEnStorage]
  );

  // Actualizar transformador
  const actualizarTransformador = useCallback(
    (id, datos) => {
      const indice = transformadores.findIndex((t) => t.id === id);
      if (indice === -1) return false;

      const actualizado = {
        ...transformadores[indice],
        nombre: datos.nombre?.trim() || transformadores[indice].nombre,
        formula: datos.formula?.trim() || transformadores[indice].formula,
      };

      const nuevos = [...transformadores];
      nuevos[indice] = actualizado;
      return guardarEnStorage(nuevos);
    },
    [transformadores, guardarEnStorage]
  );

  // Eliminar transformador
  const eliminarTransformador = useCallback(
    (id) => {
      const nuevos = transformadores.filter((t) => t.id !== id);
      return guardarEnStorage(nuevos);
    },
    [transformadores, guardarEnStorage]
  );

  return {
    transformadores,
    cargando,
    obtenerTIs,
    obtenerTVs,
    obtenerPorId,
    crearTransformador,
    actualizarTransformador,
    eliminarTransformador,
    recargar: cargarTransformadores,
  };
};

export default useTransformadores;
