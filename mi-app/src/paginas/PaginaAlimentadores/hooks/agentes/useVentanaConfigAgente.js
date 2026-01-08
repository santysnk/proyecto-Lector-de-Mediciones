/**
 * Hook para gestionar el estado de la ventana flotante de configuración de agentes
 * Gestiona: abrir, cerrar, minimizar, maximizar, mover, redimensionar
 */

import { useState, useCallback, useRef } from "react";

// Z-index base para la ventana de config agente
const Z_INDEX_BASE = 1100;

export const useVentanaConfigAgente = () => {
  // Estado de la ventana
  const [ventana, setVentana] = useState({
    abierta: false,
    minimizada: false,
    maximizada: false,
    posicion: { x: 100, y: 50 },
    zIndex: Z_INDEX_BASE,
    workspaceId: null,
  });

  // Contador para z-index (para traer al frente)
  const zIndexCounterRef = useRef(Z_INDEX_BASE);

  /**
   * Obtiene el siguiente z-index y lo incrementa
   */
  const getNextZIndex = useCallback(() => {
    zIndexCounterRef.current += 1;
    return zIndexCounterRef.current;
  }, []);

  /**
   * Abre la ventana de configuración de agentes
   */
  const abrirVentana = useCallback((workspaceId) => {
    setVentana((prev) => ({
      ...prev,
      abierta: true,
      minimizada: false,
      workspaceId,
      zIndex: getNextZIndex(),
    }));
  }, [getNextZIndex]);

  /**
   * Cierra la ventana
   */
  const cerrarVentana = useCallback(() => {
    setVentana((prev) => ({
      ...prev,
      abierta: false,
      minimizada: false,
      maximizada: false,
    }));
  }, []);

  /**
   * Minimiza/restaura la ventana
   */
  const toggleMinimizar = useCallback(() => {
    setVentana((prev) => ({
      ...prev,
      minimizada: !prev.minimizada,
    }));
  }, []);

  /**
   * Maximiza/restaura la ventana
   */
  const toggleMaximizar = useCallback(() => {
    setVentana((prev) => ({
      ...prev,
      maximizada: !prev.maximizada,
      zIndex: getNextZIndex(),
    }));
  }, [getNextZIndex]);

  /**
   * Trae la ventana al frente (actualiza z-index)
   */
  const enfocarVentana = useCallback(() => {
    setVentana((prev) => ({
      ...prev,
      minimizada: false,
      zIndex: getNextZIndex(),
    }));
  }, [getNextZIndex]);

  /**
   * Actualiza la posición de la ventana (al arrastrar)
   */
  const moverVentana = useCallback((nuevaPosicion) => {
    setVentana((prev) => ({
      ...prev,
      posicion: nuevaPosicion,
    }));
  }, []);

  return {
    ventana,
    abrirVentana,
    cerrarVentana,
    toggleMinimizar,
    toggleMaximizar,
    enfocarVentana,
    moverVentana,
  };
};

export default useVentanaConfigAgente;
