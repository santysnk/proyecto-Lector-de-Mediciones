// src/paginas/PaginaAlimentadores/contexto/ContextoAlimentadoresSupabase.jsx
// Contexto de alimentadores que usa Supabase para persistencia

import React, { createContext, useContext, useMemo, useEffect, useState } from "react";

import { usarPuestosSupabase } from "../hooks/usarPuestosSupabase";
import { usarMediciones } from "../hooks/usarMediciones";
import { usarContextoConfiguracion } from "./ContextoConfiguracion";

import { obtenerDisenoTarjeta, calcularValoresLadoTarjeta } from "../utilidades/calculosMediciones";

const ContextoAlimentadores = createContext(null);

/**
 * Provider de alimentadores que usa Supabase.
 * Requiere estar envuelto por ProveedorConfiguracion.
 */
export const ProveedorAlimentadoresSupabase = ({ children }) => {
  // Obtener configuración activa del contexto superior
  const {
    configuracionSeleccionada,
    configuracionSeleccionadaId,
    cargando: cargandoConfig,
  } = usarContextoConfiguracion();

  // Hook de puestos conectado a Supabase
  const puestosHook = usarPuestosSupabase(configuracionSeleccionadaId);

  // Hook de mediciones (sin cambios, funciona igual)
  const medicionesHook = usarMediciones();

  const { registrosEnVivo } = medicionesHook;
  const { puestoSeleccionado, cargando: cargandoPuestos } = puestosHook;

  const [lecturasTarjetas, setLecturasTarjetas] = useState({});

  // Estado de carga combinado
  const cargando = cargandoConfig || cargandoPuestos;

  // Recalcular lecturas de tarjetas cuando cambian los datos
  useEffect(() => {
    if (!puestoSeleccionado) {
      setLecturasTarjetas({});
      return;
    }

    setLecturasTarjetas(() => {
      const nuevo = {};

      puestoSeleccionado.alimentadores.forEach((alim) => {
        const regsDelAlim = registrosEnVivo[alim.id] || null;
        const diseno = obtenerDisenoTarjeta(alim.mapeoMediciones);

        const parteSuperior = calcularValoresLadoTarjeta(regsDelAlim, diseno.superior);
        const parteInferior = calcularValoresLadoTarjeta(regsDelAlim, diseno.inferior);

        nuevo[alim.id] = { parteSuperior, parteInferior };
      });

      return nuevo;
    });
  }, [puestoSeleccionado, registrosEnVivo]);

  // Helpers sobre mediciones
  const iniciarMedicionConCalculo = async (alimentador, equipo, override) => {
    await medicionesHook.iniciarMedicion(alimentador, equipo, override);
  };

  const alternarMedicion = (alimentador, equipo, override) => {
    if (medicionesHook.estaMidiendo(alimentador.id, equipo)) {
      medicionesHook.detenerMedicion(alimentador.id, equipo);
    } else {
      iniciarMedicionConCalculo(alimentador, equipo, override);
    }
  };

  // Objeto de contexto
  const valorContexto = useMemo(
    () => ({
      // Estados de carga
      cargando,
      error: puestosHook.error,

      // Configuración actual
      configuracionSeleccionada,
      configuracionSeleccionadaId,

      // Datos de puestos
      puestos: puestosHook.puestos,
      puestoSeleccionado: puestosHook.puestoSeleccionado,
      puestoSeleccionadoId: puestosHook.puestoSeleccionadoId,

      agregarPuesto: puestosHook.agregarPuesto,
      eliminarPuesto: puestosHook.eliminarPuesto,
      seleccionarPuesto: puestosHook.seleccionarPuesto,
      actualizarPuestos: puestosHook.actualizarPuestos,
      setPuestos: puestosHook.setPuestos,
      cargarPuestos: puestosHook.cargarPuestos,

      // Alimentadores
      agregarAlimentador: puestosHook.agregarAlimentador,
      actualizarAlimentador: puestosHook.actualizarAlimentador,
      eliminarAlimentador: puestosHook.eliminarAlimentador,
      reordenarAlimentadores: puestosHook.reordenarAlimentadores,

      // Mediciones y lecturas
      lecturasTarjetas,
      registrosEnVivo: medicionesHook.registrosEnVivo,

      iniciarMedicion: medicionesHook.iniciarMedicion,
      detenerMedicion: medicionesHook.detenerMedicion,
      iniciarMedicionConCalculo,
      alternarMedicion,

      obtenerRegistros: medicionesHook.obtenerRegistros,
      estaMidiendo: medicionesHook.estaMidiendo,
      obtenerTimestampInicio: medicionesHook.obtenerTimestampInicio,
      obtenerContadorLecturas: medicionesHook.obtenerContadorLecturas,
    }),
    [puestosHook, medicionesHook, lecturasTarjetas, configuracionSeleccionada, cargando]
  );

  return (
    <ContextoAlimentadores.Provider value={valorContexto}>
      {children}
    </ContextoAlimentadores.Provider>
  );
};

export const usarContextoAlimentadores = () => {
  const contexto = useContext(ContextoAlimentadores);

  if (!contexto) {
    throw new Error(
      "usarContextoAlimentadores debe usarse dentro de ProveedorAlimentadoresSupabase"
    );
  }

  return contexto;
};
