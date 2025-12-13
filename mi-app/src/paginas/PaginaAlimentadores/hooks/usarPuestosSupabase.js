// src/paginas/PaginaAlimentadores/hooks/usarPuestosSupabase.js
// Hook para manejar puestos y alimentadores usando Supabase

import { useState, useEffect, useCallback } from "react";
import {
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto as eliminarPuestoAPI,
  reordenarPuestos,
  obtenerAlimentadores,
  crearAlimentador,
  actualizarAlimentadorAPI,
  eliminarAlimentadorAPI,
  reordenarAlimentadores as reordenarAlimentadoresAPI,
} from "../../../servicios/apiService";
import { CLAVES_STORAGE } from "../constantes/clavesAlmacenamiento";
import { COLORES_SISTEMA } from "../constantes/colores";

/**
 * Hook para manejar puestos y alimentadores conectados a Supabase.
 * Requiere una configuración seleccionada para funcionar.
 *
 * @param {number|null} configuracionId - ID de la configuración activa
 * @returns {Object} Estado y funciones para trabajar con puestos y alimentadores.
 */
export const usarPuestosSupabase = (configuracionId) => {
  const COLOR_FONDO_POR_DEFECTO = "#e5e7eb";

  // Estado: lista de puestos (cada uno con sus alimentadores)
  const [puestos, setPuestos] = useState([]);

  // Estado de carga
  const [cargando, setCargando] = useState(false);

  // Error si ocurre
  const [error, setError] = useState(null);

  // Estado: ID del puesto actualmente seleccionado
  const [puestoSeleccionadoId, setPuestoSeleccionadoId] = useState(() => {
    const idGuardado = localStorage.getItem(CLAVES_STORAGE.PUESTO_SELECCIONADO);
    return idGuardado ? Number(idGuardado) : null;
  });

  // Derivado: objeto completo del puesto seleccionado
  const puestoSeleccionado =
    puestos.find((p) => p.id === puestoSeleccionadoId) ||
    puestos[0] ||
    null;

  /**
   * Transforma un puesto de la DB al formato del frontend
   * Convierte snake_case a camelCase para consistencia
   */
  function transformarPuestoDeDB(puesto) {
    // Parsear gaps_verticales si viene como string JSON
    let gapsVerticales = { "0": 40 };
    if (puesto.gaps_verticales) {
      if (typeof puesto.gaps_verticales === "string") {
        try {
          gapsVerticales = JSON.parse(puesto.gaps_verticales);
        } catch {
          gapsVerticales = { "0": 40 };
        }
      } else {
        gapsVerticales = puesto.gaps_verticales;
      }
    }

    return {
      ...puesto,
      bgColor: puesto.bg_color || "#e5e7eb",
      // Mantener bg_color por compatibilidad con código existente
      bg_color: puesto.bg_color || "#e5e7eb",
      // Gaps verticales por fila
      gapsVerticales,
    };
  }

  /**
   * Carga los puestos y sus alimentadores desde el backend
   */
  const cargarPuestos = useCallback(async () => {
    if (!configuracionId) {
      setPuestos([]);
      return;
    }

    try {
      setCargando(true);
      setError(null);

      // Obtener puestos de la configuración
      const puestosData = await obtenerPuestos(configuracionId);

      // Para cada puesto, cargar sus alimentadores
      const puestosConAlimentadores = await Promise.all(
        puestosData.map(async (puesto) => {
          try {
            const alimentadores = await obtenerAlimentadores(puesto.id);
            return {
              ...transformarPuestoDeDB(puesto),
              alimentadores: alimentadores.map(transformarAlimentadorDeDB),
            };
          } catch (err) {
            console.error(`Error cargando alimentadores del puesto ${puesto.id}:`, err);
            return { ...transformarPuestoDeDB(puesto), alimentadores: [] };
          }
        })
      );

      setPuestos(puestosConAlimentadores);

      // Auto-seleccionar primer puesto si no hay selección válida
      if (puestosConAlimentadores.length > 0) {
        const seleccionValida = puestosConAlimentadores.some(
          (p) => p.id === puestoSeleccionadoId
        );
        if (!seleccionValida) {
          setPuestoSeleccionadoId(puestosConAlimentadores[0].id);
        }
      }
    } catch (err) {
      console.error("Error cargando puestos:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [configuracionId, puestoSeleccionadoId]);

  // Cargar puestos cuando cambie la configuración
  useEffect(() => {
    cargarPuestos();
  }, [configuracionId]);

  // Guardar selección de puesto en localStorage
  useEffect(() => {
    if (puestoSeleccionadoId != null) {
      localStorage.setItem(CLAVES_STORAGE.PUESTO_SELECCIONADO, puestoSeleccionadoId.toString());
    } else {
      localStorage.removeItem(CLAVES_STORAGE.PUESTO_SELECCIONADO);
    }
  }, [puestoSeleccionadoId]);

  /**
   * Transforma un alimentador de la DB al formato del frontend
   * Genera el formato con objetos rele/analizador que espera el modal
   */
  function transformarAlimentadorDeDB(alim) {
    // Para campos numéricos opcionales: si no hay valor en DB, devolver null/undefined
    // para que el modal muestre el placeholder en lugar de un valor por defecto
    const releConfig = alim.config_rele || {};
    const analizadorConfig = alim.config_analizador || {};

    return {
      id: alim.id,
      nombre: alim.nombre,
      color: alim.color || COLORES_SISTEMA[0],
      tipoDispositivo: alim.tipo || "rele",
      // Gap horizontal a la derecha de esta tarjeta
      gapHorizontal: alim.gap_horizontal != null ? alim.gap_horizontal : 10,
      // Formato nuevo que espera el modal
      // Si no hay valor guardado, dejamos null para que se muestre el placeholder
      rele: {
        ip: releConfig.ip || "",
        puerto: releConfig.puerto != null ? releConfig.puerto : null,
        unitId: releConfig.unitId || 1,
        indiceInicial: releConfig.indiceInicial != null ? releConfig.indiceInicial : null,
        cantRegistros: releConfig.cantRegistros != null ? releConfig.cantRegistros : null,
      },
      periodoSegundos: releConfig.periodoLectura != null ? releConfig.periodoLectura : 60,
      analizador: {
        ip: analizadorConfig.ip || "",
        puerto: analizadorConfig.puerto != null ? analizadorConfig.puerto : null,
        unitId: analizadorConfig.unitId || 2,
        indiceInicial: analizadorConfig.indiceInicial != null ? analizadorConfig.indiceInicial : null,
        cantRegistros: analizadorConfig.cantRegistros != null ? analizadorConfig.cantRegistros : null,
        periodoSegundos: analizadorConfig.periodoLectura != null ? analizadorConfig.periodoLectura : 60,
      },
      // Campos legacy para compatibilidad con otras partes del código
      ip: releConfig.ip || "",
      puerto: releConfig.puerto != null ? releConfig.puerto : null,
      unitId: releConfig.unitId || 1,
      periodoLectura: releConfig.periodoLectura != null ? releConfig.periodoLectura : 60,
      indiceInicio: releConfig.indiceInicial != null ? releConfig.indiceInicial : null,
      indiceFin: releConfig.indiceInicial != null && releConfig.cantRegistros != null
        ? releConfig.indiceInicial + releConfig.cantRegistros
        : null,
      ipAnalizador: analizadorConfig.ip || "",
      puertoAnalizador: analizadorConfig.puerto != null ? analizadorConfig.puerto : null,
      unitIdAnalizador: analizadorConfig.unitId || 2,
      periodoLecturaAnalizador: analizadorConfig.periodoLectura != null ? analizadorConfig.periodoLectura : 60,
      indiceInicioAnalizador: analizadorConfig.indiceInicial != null ? analizadorConfig.indiceInicial : null,
      indiceFinAnalizador: analizadorConfig.indiceInicial != null && analizadorConfig.cantRegistros != null
        ? analizadorConfig.indiceInicial + analizadorConfig.cantRegistros
        : null,
      mapeoMediciones: alim.mapeo_mediciones || {},
    };
  }

  /**
   * Transforma un alimentador del frontend al formato de la DB
   * Acepta tanto el formato plano (legacy) como el formato con objetos rele/analizador anidados
   */
  function transformarAlimentadorADB(alim) {
    // Detectar si viene en formato nuevo (con objetos rele/analizador) o formato plano
    const tieneFormatoNuevo = alim.rele || alim.analizador;

    if (tieneFormatoNuevo) {
      // Formato nuevo del modal: { rele: {...}, analizador: {...} }
      // Preservar null para campos numéricos opcionales (puerto, indiceInicial, cantRegistros)
      // para que al cargar se muestren los placeholders en lugar de valores por defecto
      return {
        nombre: alim.nombre,
        color: alim.color,
        tipo: alim.tipoDispositivo || "rele",
        gap_horizontal: alim.gapHorizontal != null ? alim.gapHorizontal : 10,
        config_rele: alim.rele ? {
          ip: alim.rele.ip || "",
          puerto: alim.rele.puerto != null ? alim.rele.puerto : null,
          unitId: alim.rele.unitId || 1,
          periodoLectura: alim.periodoSegundos || 60,
          indiceInicial: alim.rele.indiceInicial != null ? alim.rele.indiceInicial : null,
          cantRegistros: alim.rele.cantRegistros != null ? alim.rele.cantRegistros : null,
        } : null,
        config_analizador: alim.analizador ? {
          ip: alim.analizador.ip || "",
          puerto: alim.analizador.puerto != null ? alim.analizador.puerto : null,
          unitId: alim.analizador.unitId || 2,
          periodoLectura: alim.analizador.periodoSegundos || 60,
          indiceInicial: alim.analizador.indiceInicial != null ? alim.analizador.indiceInicial : null,
          cantRegistros: alim.analizador.cantRegistros != null ? alim.analizador.cantRegistros : null,
        } : null,
        mapeo_mediciones: alim.mapeoMediciones || {},
      };
    }

    // Formato plano (legacy)
    // Preservar null para campos numéricos opcionales
    return {
      nombre: alim.nombre,
      color: alim.color,
      tipo: alim.tipoDispositivo || "rele",
      gap_horizontal: alim.gapHorizontal != null ? alim.gapHorizontal : 10,
      config_rele: {
        ip: alim.ip || "",
        puerto: alim.puerto != null ? alim.puerto : null,
        unitId: alim.unitId || 1,
        periodoLectura: alim.periodoLectura || 60,
        indiceInicial: alim.indiceInicio != null ? alim.indiceInicio : null,
        cantRegistros: alim.indiceFin != null && alim.indiceInicio != null
          ? (alim.indiceFin - alim.indiceInicio)
          : null,
      },
      config_analizador: {
        ip: alim.ipAnalizador || "",
        puerto: alim.puertoAnalizador != null ? alim.puertoAnalizador : null,
        unitId: alim.unitIdAnalizador || 2,
        periodoLectura: alim.periodoLecturaAnalizador || 60,
        indiceInicial: alim.indiceInicioAnalizador != null ? alim.indiceInicioAnalizador : null,
        cantRegistros: alim.indiceFinAnalizador != null && alim.indiceInicioAnalizador != null
          ? (alim.indiceFinAnalizador - alim.indiceInicioAnalizador)
          : null,
      },
      mapeo_mediciones: alim.mapeoMediciones || {},
    };
  }

  /**
   * Agrega un nuevo puesto
   */
  const agregarPuesto = async (nombrePuesto, colorPuesto) => {
    if (!configuracionId) return;

    try {
      setError(null);
      const nuevoPuesto = await crearPuesto(configuracionId, {
        nombre: nombrePuesto.trim(),
        color: colorPuesto || COLORES_SISTEMA[0],
        bg_color: COLOR_FONDO_POR_DEFECTO,
      });

      const puestoConAlimentadores = { ...nuevoPuesto, alimentadores: [] };
      setPuestos((prev) => [...prev, puestoConAlimentadores]);
      setPuestoSeleccionadoId(nuevoPuesto.id);

      return nuevoPuesto;
    } catch (err) {
      console.error("Error creando puesto:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Actualiza la lista completa de puestos (para edición masiva)
   */
  const actualizarPuestos = async (nuevaListaPuestos) => {
    const sinVacios = nuevaListaPuestos.filter((p) => p.nombre.trim() !== "");

    // Actualizar cada puesto en el backend
    try {
      setError(null);

      for (const puesto of sinVacios) {
        await actualizarPuesto(puesto.id, {
          nombre: puesto.nombre,
          color: puesto.color,
          bg_color: puesto.bgColor || puesto.bg_color,
        });
      }

      setPuestos(sinVacios);

      // Si el seleccionado se eliminó, seleccionar el primero
      const seleccionExiste = sinVacios.some((p) => p.id === puestoSeleccionadoId);
      if (!seleccionExiste) {
        setPuestoSeleccionadoId(sinVacios[0]?.id || null);
      }
    } catch (err) {
      console.error("Error actualizando puestos:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Elimina un puesto
   */
  const eliminarPuesto = async (idPuesto) => {
    try {
      setError(null);
      await eliminarPuestoAPI(idPuesto);
      setPuestos((prev) => prev.filter((p) => p.id !== idPuesto));

      // Si se eliminó el seleccionado, seleccionar otro
      if (puestoSeleccionadoId === idPuesto) {
        const restantes = puestos.filter((p) => p.id !== idPuesto);
        setPuestoSeleccionadoId(restantes[0]?.id || null);
      }
    } catch (err) {
      console.error("Error eliminando puesto:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Selecciona un puesto como activo
   */
  const seleccionarPuesto = (idPuesto) => {
    setPuestoSeleccionadoId(idPuesto);
  };

  /**
   * Agrega un alimentador al puesto seleccionado
   */
  const agregarAlimentador = async (datosAlimentador) => {
    if (!puestoSeleccionado) return;

    try {
      setError(null);
      const datosDB = transformarAlimentadorADB(datosAlimentador);
      const nuevoAlimentador = await crearAlimentador(puestoSeleccionado.id, datosDB);

      const alimentadorFrontend = transformarAlimentadorDeDB(nuevoAlimentador);

      setPuestos((prev) =>
        prev.map((p) =>
          p.id === puestoSeleccionado.id
            ? { ...p, alimentadores: [...p.alimentadores, alimentadorFrontend] }
            : p
        )
      );

      return alimentadorFrontend;
    } catch (err) {
      console.error("Error creando alimentador:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Actualiza un alimentador existente
   */
  const actualizarAlimentador = async (idPuesto, idAlimentador, nuevosDatos) => {
    try {
      setError(null);
      const datosDB = transformarAlimentadorADB(nuevosDatos);
      const actualizado = await actualizarAlimentadorAPI(idAlimentador, datosDB);

      const alimentadorFrontend = transformarAlimentadorDeDB(actualizado);

      setPuestos((prev) =>
        prev.map((p) =>
          p.id === idPuesto
            ? {
                ...p,
                alimentadores: p.alimentadores.map((a) =>
                  a.id === idAlimentador ? alimentadorFrontend : a
                ),
              }
            : p
        )
      );

      return alimentadorFrontend;
    } catch (err) {
      console.error("Error actualizando alimentador:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Elimina un alimentador
   */
  const eliminarAlimentador = async (idPuesto, idAlimentador) => {
    try {
      setError(null);
      await eliminarAlimentadorAPI(idAlimentador);

      setPuestos((prev) =>
        prev.map((p) =>
          p.id === idPuesto
            ? { ...p, alimentadores: p.alimentadores.filter((a) => a.id !== idAlimentador) }
            : p
        )
      );
    } catch (err) {
      console.error("Error eliminando alimentador:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Reordena los alimentadores de un puesto (solo estado local).
   * La sincronización con BD se hace al presionar "Guardar cambios".
   */
  const reordenarAlimentadores = (idPuesto, nuevoOrdenAlimentadores) => {
    // Solo actualizar estado local - la sincronización con BD
    // se hace mediante el botón "Guardar cambios" (draft/publish pattern)
    setPuestos((prev) =>
      prev.map((p) =>
        p.id === idPuesto ? { ...p, alimentadores: nuevoOrdenAlimentadores } : p
      )
    );
  };

  return {
    // Estados
    puestos,
    puestoSeleccionado,
    puestoSeleccionadoId,
    cargando,
    error,

    // Funciones de puestos
    cargarPuestos,
    agregarPuesto,
    eliminarPuesto,
    seleccionarPuesto,
    actualizarPuestos,
    setPuestos,

    // Funciones de alimentadores
    agregarAlimentador,
    actualizarAlimentador,
    eliminarAlimentador,
    reordenarAlimentadores,
  };
};
