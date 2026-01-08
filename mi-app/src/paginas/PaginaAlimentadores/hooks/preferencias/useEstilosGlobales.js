/**
 * Hook para manejar los estilos globales de las tarjetas de alimentador
 * Persiste en localStorage y proporciona funciones para actualizar cada sección
 */

import { useState, useCallback, useEffect } from "react";
import {
  ESTILOS_GLOBALES_DEFAULT,
  ESTILOS_GLOBALES_STORAGE_KEY,
} from "../../constantes/estilosGlobalesTarjeta";

/**
 * Hook que maneja los estilos globales de las tarjetas
 * @returns {Object} Estado y funciones para manejar estilos globales
 */
const useEstilosGlobales = () => {
  const [estilos, setEstilos] = useState(() => {
    // Intentar cargar desde localStorage al inicializar
    try {
      const guardado = localStorage.getItem(ESTILOS_GLOBALES_STORAGE_KEY);
      if (guardado) {
        const parseado = JSON.parse(guardado);
        // Merge con defaults para asegurar que todos los campos existan
        return {
          header: { ...ESTILOS_GLOBALES_DEFAULT.header, ...parseado.header },
          tituloZona: { ...ESTILOS_GLOBALES_DEFAULT.tituloZona, ...parseado.tituloZona },
          tituloBox: { ...ESTILOS_GLOBALES_DEFAULT.tituloBox, ...parseado.tituloBox },
          valorBox: { ...ESTILOS_GLOBALES_DEFAULT.valorBox, ...parseado.valorBox },
          box: { ...ESTILOS_GLOBALES_DEFAULT.box, ...parseado.box },
        };
      }
    } catch (e) {
      console.warn("[EstilosGlobales] Error cargando estilos:", e);
    }
    return ESTILOS_GLOBALES_DEFAULT;
  });

  // Guardar en localStorage cuando cambian los estilos
  useEffect(() => {
    try {
      localStorage.setItem(ESTILOS_GLOBALES_STORAGE_KEY, JSON.stringify(estilos));
    } catch (e) {
      console.warn("[EstilosGlobales] Error guardando estilos:", e);
    }
  }, [estilos]);

  /**
   * Actualiza los estilos del header
   * @param {Object} cambios - Propiedades a cambiar
   */
  const actualizarHeader = useCallback((cambios) => {
    setEstilos((prev) => ({
      ...prev,
      header: { ...prev.header, ...cambios },
    }));
  }, []);

  /**
   * Actualiza los estilos del título de zona (afecta superior e inferior)
   * @param {Object} cambios - Propiedades a cambiar
   */
  const actualizarTituloZona = useCallback((cambios) => {
    setEstilos((prev) => ({
      ...prev,
      tituloZona: { ...prev.tituloZona, ...cambios },
    }));
  }, []);

  /**
   * Actualiza los estilos de los títulos de box (R, S, T)
   * @param {Object} cambios - Propiedades a cambiar
   */
  const actualizarTituloBox = useCallback((cambios) => {
    setEstilos((prev) => ({
      ...prev,
      tituloBox: { ...prev.tituloBox, ...cambios },
    }));
  }, []);

  /**
   * Actualiza los estilos del valor dentro del box
   * @param {Object} cambios - Propiedades a cambiar
   */
  const actualizarValorBox = useCallback((cambios) => {
    setEstilos((prev) => ({
      ...prev,
      valorBox: { ...prev.valorBox, ...cambios },
    }));
  }, []);

  /**
   * Actualiza los estilos del contenedor del box
   * @param {Object} cambios - Propiedades a cambiar
   */
  const actualizarBox = useCallback((cambios) => {
    setEstilos((prev) => ({
      ...prev,
      box: { ...prev.box, ...cambios },
    }));
  }, []);

  /**
   * Resetea todos los estilos a los valores por defecto
   */
  const resetearEstilos = useCallback(() => {
    setEstilos(ESTILOS_GLOBALES_DEFAULT);
  }, []);

  /**
   * Aplica un objeto completo de estilos (para guardar desde TabApariencia)
   * @param {Object} nuevosEstilos - Objeto con todos los estilos a aplicar
   */
  const aplicarTodosEstilos = useCallback((nuevosEstilos) => {
    setEstilos({
      header: { ...ESTILOS_GLOBALES_DEFAULT.header, ...nuevosEstilos.header },
      tituloZona: { ...ESTILOS_GLOBALES_DEFAULT.tituloZona, ...nuevosEstilos.tituloZona },
      tituloBox: { ...ESTILOS_GLOBALES_DEFAULT.tituloBox, ...nuevosEstilos.tituloBox },
      valorBox: { ...ESTILOS_GLOBALES_DEFAULT.valorBox, ...nuevosEstilos.valorBox },
      box: { ...ESTILOS_GLOBALES_DEFAULT.box, ...nuevosEstilos.box },
    });
  }, []);

  /**
   * Genera el objeto de estilos CSS para aplicar en TarjetaAlimentador
   * @returns {Object} Objeto con estilos CSS listos para usar
   */
  const obtenerEstilosCSS = useCallback(() => {
    return {
      // Estilos para .alim-card-title
      headerTitle: {
        fontFamily: estilos.header.fontFamily,
        fontSize: estilos.header.fontSize,
        fontWeight: estilos.header.fontWeight,
      },
      // Estilos para .alim-card-section-title
      tituloZona: {
        fontFamily: estilos.tituloZona.fontFamily,
        fontSize: estilos.tituloZona.fontSize,
      },
      // Estilos para .alim-card-meter-phase
      tituloBox: {
        fontFamily: estilos.tituloBox.fontFamily,
        fontSize: estilos.tituloBox.fontSize,
      },
      // Estilos para .alim-card-meter-value
      valorBox: {
        fontFamily: estilos.valorBox.fontFamily,
        fontSize: estilos.valorBox.fontSize,
        color: estilos.valorBox.color,
      },
      // Estilos para .alim-card-meter y .alim-card-meters
      box: {
        gap: estilos.box.gap,
        width: estilos.box.width,
        height: estilos.box.height,
      },
    };
  }, [estilos]);

  return {
    estilos,
    actualizarHeader,
    actualizarTituloZona,
    actualizarTituloBox,
    actualizarValorBox,
    actualizarBox,
    resetearEstilos,
    aplicarTodosEstilos,
    obtenerEstilosCSS,
  };
};

export default useEstilosGlobales;
