/**
 * Hook para gestionar múltiples ventanas de historial flotantes
 * Permite abrir, minimizar, maximizar y cerrar ventanas de historial
 * Solo permite una ventana por alimentador
 */

import { useState, useCallback, useRef } from "react";

// Z-index base para ventanas flotantes
const Z_INDEX_BASE = 1000;

export const useVentanasHistorial = () => {
  // Map de ventanas abiertas: { [alimentadorId]: estadoVentana }
  const [ventanas, setVentanas] = useState({});

  // Contador para z-index de ventanas (foco) - useRef para persistir sin re-renders
  const zIndexCounterRef = useRef(Z_INDEX_BASE);

  /**
   * Obtiene el siguiente z-index y lo incrementa
   */
  const getNextZIndex = useCallback(() => {
    zIndexCounterRef.current += 1;
    return zIndexCounterRef.current;
  }, []);

  /**
   * Estado inicial de una ventana
   */
  const crearEstadoVentana = useCallback((alimentador, cardDesign, posicionInicial) => ({
    id: alimentador.id,
    alimentador,
    cardDesign,
    minimizada: false,
    maximizada: false,
    posicion: posicionInicial || { x: 100 + Math.random() * 100, y: 50 + Math.random() * 50 },
    tamaño: { width: 900, height: 600 },
    zIndex: getNextZIndex(),
  }), [getNextZIndex]);

  /**
   * Abre una ventana de historial para un alimentador
   * Si ya existe, la trae al frente y la restaura si estaba minimizada
   */
  const abrirVentana = useCallback((alimentador, cardDesign) => {
    setVentanas((prev) => {
      // Si ya existe la ventana para este alimentador
      if (prev[alimentador.id]) {
        // Traer al frente y restaurar si estaba minimizada
        return {
          ...prev,
          [alimentador.id]: {
            ...prev[alimentador.id],
            minimizada: false,
            zIndex: getNextZIndex(),
          },
        };
      }

      // Calcular posición escalonada basada en número de ventanas
      const numVentanas = Object.keys(prev).length;
      const posicionInicial = {
        x: 50 + (numVentanas % 5) * 30,
        y: 50 + (numVentanas % 5) * 30,
      };

      // Crear nueva ventana
      return {
        ...prev,
        [alimentador.id]: crearEstadoVentana(alimentador, cardDesign, posicionInicial),
      };
    });
  }, [crearEstadoVentana, getNextZIndex]);

  /**
   * Cierra una ventana de historial
   */
  const cerrarVentana = useCallback((alimentadorId) => {
    setVentanas((prev) => {
      const { [alimentadorId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Minimiza/restaura una ventana
   */
  const toggleMinimizar = useCallback((alimentadorId) => {
    setVentanas((prev) => {
      if (!prev[alimentadorId]) return prev;
      return {
        ...prev,
        [alimentadorId]: {
          ...prev[alimentadorId],
          minimizada: !prev[alimentadorId].minimizada,
        },
      };
    });
  }, []);

  /**
   * Maximiza/restaura una ventana
   */
  const toggleMaximizar = useCallback((alimentadorId) => {
    setVentanas((prev) => {
      if (!prev[alimentadorId]) return prev;
      return {
        ...prev,
        [alimentadorId]: {
          ...prev[alimentadorId],
          maximizada: !prev[alimentadorId].maximizada,
          zIndex: getNextZIndex(),
        },
      };
    });
  }, [getNextZIndex]);

  /**
   * Trae una ventana al frente (actualiza z-index)
   */
  const enfocarVentana = useCallback((alimentadorId) => {
    setVentanas((prev) => {
      if (!prev[alimentadorId]) return prev;
      return {
        ...prev,
        [alimentadorId]: {
          ...prev[alimentadorId],
          minimizada: false,
          zIndex: getNextZIndex(),
        },
      };
    });
  }, [getNextZIndex]);

  /**
   * Actualiza la posición de una ventana (al arrastrar)
   */
  const moverVentana = useCallback((alimentadorId, nuevaPosicion) => {
    setVentanas((prev) => {
      if (!prev[alimentadorId]) return prev;
      return {
        ...prev,
        [alimentadorId]: {
          ...prev[alimentadorId],
          posicion: nuevaPosicion,
        },
      };
    });
  }, []);

  /**
   * Actualiza el tamaño de una ventana
   */
  const redimensionarVentana = useCallback((alimentadorId, nuevoTamaño) => {
    setVentanas((prev) => {
      if (!prev[alimentadorId]) return prev;
      return {
        ...prev,
        [alimentadorId]: {
          ...prev[alimentadorId],
          tamaño: nuevoTamaño,
        },
      };
    });
  }, []);

  /**
   * Verifica si hay una ventana abierta para un alimentador
   */
  const tieneVentanaAbierta = useCallback(
    (alimentadorId) => {
      return !!ventanas[alimentadorId];
    },
    [ventanas]
  );

  /**
   * Obtiene la lista de ventanas como array (para renderizar)
   */
  const listaVentanas = Object.values(ventanas);

  /**
   * Obtiene las ventanas minimizadas (para barra de tareas)
   */
  const ventanasMinimizadas = listaVentanas.filter((v) => v.minimizada);

  return {
    ventanas,
    listaVentanas,
    ventanasMinimizadas,
    abrirVentana,
    cerrarVentana,
    toggleMinimizar,
    toggleMaximizar,
    enfocarVentana,
    moverVentana,
    redimensionarVentana,
    tieneVentanaAbierta,
  };
};

export default useVentanasHistorial;
