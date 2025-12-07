// src/paginas/PaginaAlimentadores/contexto/ContextoAlimentadores.jsx

// herramientas de React para contextos, estado y efectos
import React, {createContext, useContext, useMemo, useEffect, useState} from "react"; 
import { usarPuestos } from "../hooks/usarPuestos";          // hook que maneja puestos y alimentadores (alta, baja, orden, selección)
import { usarMediciones } from "../hooks/usarMediciones";    // hook que maneja lecturas Modbus y timers de medición
import {
  obtenerDisenoTarjeta,
  calcularValoresLadoTarjeta,
} from "../utilidades/calculosMediciones";                   // helpers que traducen registros crudos a valores para las tarjetas

const ContextoAlimentadores = createContext(null);           // contexto compartido para toda la página de alimentadores

export const ProveedorAlimentadores = ({ children }) => {
  const puestosHook = usarPuestos();                         // "módulo" de gestión de puestos y alimentadores
  const medicionesHook = usarMediciones();                   // "módulo" de gestión de mediciones en vivo

  const { registrosEnVivo } = medicionesHook;                // lecturas crudas por alimentador/equipo
  const { puestoSeleccionado } = puestosHook;                // puesto actualmente activo en la vista

  const [lecturasTarjetas, setLecturasTarjetas] = useState({}); // valores ya calculados para mostrar en cada tarjeta

  // ----------------------------------------------------------------
  // Recalcula los valores a mostrar en cada tarjeta cuando cambian:
  // - el puesto seleccionado
  // - los registros en vivo (Modbus) de sus alimentadores
  // - el mapeo/diseño de tarjetas de cada alimentador
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!puestoSeleccionado) {
      setLecturasTarjetas({});                                      // si no hay puesto activo, no mostramos nada
      return;
    }

    setLecturasTarjetas(() => {
      const nuevo = {};

      puestoSeleccionado.alimentadores.forEach((alim) => {
		  // registros crudos para este alimentador	
        const regsDelAlim = registrosEnVivo[alim.id] || null;
		  
		  // diseño (qué se muestra arriba/abajo)
        const diseno = obtenerDisenoTarjeta(alim.mapeoMediciones);  

		  // valores + etiquetas para la parte superior
        const parteSuperior = calcularValoresLadoTarjeta(
          regsDelAlim,
          diseno.superior
        );        
        
		  // valores + etiquetas para la parte inferior
        const parteInferior = calcularValoresLadoTarjeta(
          regsDelAlim,
          diseno.inferior
        );                                                          

		  // guardo el resultado por id de alimentador
        nuevo[alim.id] = { parteSuperior, parteInferior };          
      });

      return nuevo;
    });
  }, [puestoSeleccionado, registrosEnVivo]);

  // ----------------------------------------------------------------
  // Helpers sobre mediciones
  // ----------------------------------------------------------------

  // Inicia una medición usando la lógica del hook, pero permite pasar overrides
  // de configuración (útil desde los modales de configuración).
  const iniciarMedicionConCalculo = async (alimentador, equipo, override) => {
    await medicionesHook.iniciarMedicion(alimentador, equipo, override);
  };

  // Alterna una medición (start/stop) sin repetir lógica en la vista
  const alternarMedicion = (alimentador, equipo, override) => {
    if (medicionesHook.estaMidiendo(alimentador.id, equipo)) {
      medicionesHook.detenerMedicion(alimentador.id, equipo);
    } else {
      iniciarMedicionConCalculo(alimentador, equipo, override);
    }
  };

  // ----------------------------------------------------------------
  // Objeto de contexto: empaqueta todo lo que la UI necesita
  // ----------------------------------------------------------------
  const valorContexto = useMemo(
    () => ({
      // Datos de puestos
      puestos: puestosHook.puestos,
      puestoSeleccionado: puestosHook.puestoSeleccionado,
      puestoSeleccionadoId: puestosHook.puestoSeleccionadoId,
      agregarPuesto: puestosHook.agregarPuesto,
      eliminarPuesto: puestosHook.eliminarPuesto,
      seleccionarPuesto: puestosHook.seleccionarPuesto,
      actualizarPuestos: puestosHook.actualizarPuestos,
      setPuestos: puestosHook.setPuestos,

      // Alimentadores
      agregarAlimentador: puestosHook.agregarAlimentador,
      actualizarAlimentador: puestosHook.actualizarAlimentador,
      eliminarAlimentador: puestosHook.eliminarAlimentador,
      reordenarAlimentadores: puestosHook.reordenarAlimentadores,

      // Mediciones y lecturas
      lecturasTarjetas,                                   // valores ya procesados listos para pintar en las tarjetas
      registrosEnVivo: medicionesHook.registrosEnVivo,    // registros crudos (por si alguna vista los necesita directo)
      iniciarMedicion: medicionesHook.iniciarMedicion,
      detenerMedicion: medicionesHook.detenerMedicion,
      iniciarMedicionConCalculo,
      alternarMedicion,
      obtenerRegistros: medicionesHook.obtenerRegistros,
      estaMidiendo: medicionesHook.estaMidiendo,
      obtenerTimestampInicio: medicionesHook.obtenerTimestampInicio,
      obtenerContadorLecturas: medicionesHook.obtenerContadorLecturas,
    }),
    [puestosHook, medicionesHook, lecturasTarjetas]
  );

  return (
    <ContextoAlimentadores.Provider value={valorContexto}>
      {children}
    </ContextoAlimentadores.Provider>
  );
};

export const usarContextoAlimentadores = () => {
  const contexto = useContext(ContextoAlimentadores);      // leo el contexto actual

  if (!contexto) {
    // ayuda a detectar usos fuera del provider
    throw new Error(
      "usarContextoAlimentadores debe usarse dentro de ProveedorAlimentadores"
    );
  }

  return contexto;
};

{/*---------------------------------------------------------------------------
 NOTA PERSONAL SOBRE ESTE ARCHIVO (ContextoAlimentadores.jsx)

 - Este archivo es el "cerebro compartido" de la página de alimentadores:
   junta lo que hacen `usarPuestos` y `usarMediciones` y lo expone por context.

 - `usarPuestos` maneja toda la parte estructural:
   puestos, lista de alimentadores, selección, altas/bajas y reordenamiento.

 - `usarMediciones` maneja la parte dinámica:
   timers, lecturas Modbus en vivo y estados de medición por alimentador/equipo.

 - El `useEffect` central recorre los alimentadores del puesto seleccionado,
   toma sus registros en vivo y el mapeo configurado, y genera `lecturasTarjetas`
   ya listas para que las tarjetas solo tengan que mostrarlas (sin recalcular).

 - `valorContexto` es un "paquete" con datos + funciones que consumen
   `VistaAlimentadores` y sus hijos mediante `usarContextoAlimentadores()`,
   evitando pasar props en cadena.

 - La regla mental:
   * ProveedorAlimentadores = orquestador (combina hooks y cálculos).
   * usarContextoAlimentadores = enchufe que cualquier componente puede usar
     para conectarse a ese orquestador.
-------------------------------------------------------------------------------
*/}

