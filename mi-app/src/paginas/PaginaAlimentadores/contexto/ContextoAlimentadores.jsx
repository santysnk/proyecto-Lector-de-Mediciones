// src/paginas/PaginaAlimentadores/contexto/ContextoAlimentadores.jsx

// herramientas de React para contextos, estado y efectos
import React, { createContext, useContext, useMemo, useEffect, useState, } from "react";

import { usarPuestos } from "../hooks/usarPuestos";       // hook que maneja puestos y alimentadores (alta, baja, orden, selección)
import { usarMediciones } from "../hooks/usarMediciones"; // hook que maneja lecturas Modbus y timers de medición

// helpers que traducen registros crudos a valores para las tarjetas
import { obtenerDisenoTarjeta, calcularValoresLadoTarjeta, } from "../utilidades/calculosMediciones";      


const ContextoAlimentadores = createContext(null);         // contexto compartido para toda la página de alimentadores

export const ProveedorAlimentadores = ({ children }) => {
   const puestosHook = usarPuestos();                      // "módulo" de gestión de puestos y alimentadores
   const medicionesHook = usarMediciones();                // "módulo" de gestión de mediciones en vivo

   const { registrosEnVivo } = medicionesHook;             // lecturas crudas por alimentador/equipo
   const { puestoSeleccionado } = puestosHook;             // puesto actualmente activo en la vista

   const [lecturasTarjetas, setLecturasTarjetas] = useState({});    // valores ya calculados para mostrar en cada tarjeta

   // ----------------------------------------------------------------
   // Recalcula los valores a mostrar en cada tarjeta cuando cambian:
   // - el puesto seleccionado
   // - los registros en vivo (Modbus) de sus alimentadores
   // - el mapeo/diseño de tarjetas de cada alimentador
   // ----------------------------------------------------------------
   useEffect(() => {
      if (!puestoSeleccionado) {
         setLecturasTarjetas({});                                        // si no hay puesto activo, no mostramos nada
         return;
      }

      setLecturasTarjetas(() => {
         const nuevo = {};

         puestoSeleccionado.alimentadores.forEach((alim) => {
            
            const regsDelAlim = registrosEnVivo[alim.id] || null;        // registros crudos para este alimentador

            const diseno = obtenerDisenoTarjeta(alim.mapeoMediciones);   // diseño (qué se muestra arriba/abajo)

            
            const parteSuperior = calcularValoresLadoTarjeta(            // valores + etiquetas para la parte superior
               regsDelAlim,
               diseno.superior
            );

           
            const parteInferior = calcularValoresLadoTarjeta(            // valores + etiquetas para la parte inferior
               regsDelAlim,
               diseno.inferior
            );

            
            nuevo[alim.id] = { parteSuperior, parteInferior };           // guardo el resultado por id de alimentador
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

	// useMemo: memoriza el “paquete” de datos/funciones del contexto para no volver a crearlo en cada render y
	// evitar re-renders innecesarios en los hijos
	const valorContexto = useMemo(() => ({

		// =====================
		// Datos de puestos
		// =====================
		puestos: puestosHook.puestos,                            // lista completa de puestos (cada uno con sus alimentadores)
		puestoSeleccionado: puestosHook.puestoSeleccionado,      // objeto del puesto actualmente elegido en la UI
		puestoSeleccionadoId: puestosHook.puestoSeleccionadoId,  // id numérico del puesto seleccionado (atajo rápido)

		agregarPuesto: puestosHook.agregarPuesto,                // crea un nuevo puesto y lo agrega a la lista
		eliminarPuesto: puestosHook.eliminarPuesto,              // borra un puesto por id
		seleccionarPuesto: puestosHook.seleccionarPuesto,        // cambia el puesto activo en la pantalla
		actualizarPuestos: puestosHook.actualizarPuestos,        // reemplaza la lista de puestos (por ejemplo, desde el modal de edición)
		setPuestos: puestosHook.setPuestos,                      // setter “crudo” para casos especiales (importación, reset, etc.)

		// =====================
		// Alimentadores (dentro de cada puesto)
		// =====================
		agregarAlimentador: puestosHook.agregarAlimentador,         // agrega un alimentador al puesto seleccionado
		actualizarAlimentador: puestosHook.actualizarAlimentador,   // modifica un alimentador específico de un puesto
		eliminarAlimentador: puestosHook.eliminarAlimentador,       // elimina un alimentador de un puesto
		reordenarAlimentadores: puestosHook.reordenarAlimentadores, // guarda el nuevo orden de las tarjetas después del drag & drop

		// =====================
		// Mediciones y lecturas
		// =====================
		lecturasTarjetas,                                  // lecturas ya procesadas y organizadas para pintar en las tarjetas (superior/inferior)
		registrosEnVivo: medicionesHook.registrosEnVivo,   // lecturas crudas tal como vienen de Modbus (por alimentador/equipo)

		iniciarMedicion: medicionesHook.iniciarMedicion,   // arranca una medición periódica para un alimentador/equipo
		detenerMedicion: medicionesHook.detenerMedicion,   // detiene la medición y limpia timers/estado
		iniciarMedicionConCalculo,                         // igual que iniciarMedicion pero aceptando overrides desde la UI
		alternarMedicion,                                  // prende/apaga una medición según su estado actual (toggle)

		obtenerRegistros: medicionesHook.obtenerRegistros, // devuelve los registros crudos de un alimentador/equipo
		estaMidiendo: medicionesHook.estaMidiendo,         // indica si ese alimentador/equipo está midiendo (true/false)
		obtenerTimestampInicio: medicionesHook.obtenerTimestampInicio,     // devuelve el último timestamp de lectura (para animaciones/tiempos)
		obtenerContadorLecturas: medicionesHook.obtenerContadorLecturas,   // cuántas lecturas se hicieron desde que se inició la medición
	}),
	[puestosHook, medicionesHook, lecturasTarjetas]       // solo recrear este “paquete” cuando cambien los hooks o las lecturas calculadas
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

{
   /*---------------------------------------------------------------------------
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

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (ContextoAlimentadores.jsx)

0) Visión general del archivo

   Este archivo define el “cerebro compartido” de la página de alimentadores.

   Hace tres cosas principales:

   1) Crea un contexto (`ContextoAlimentadores`) para compartir datos y funciones entre muchos componentes 
	   sin pasar props en cadena.

   2) Define un componente provider (`ProveedorAlimentadores`) que:

       - usa los hooks `usarPuestos` y `usarMediciones`,

       - calcula `lecturasTarjetas` a partir de los registros en vivo,

       - arma un objeto `valorContexto` con TODO lo que la UI necesita (datos + acciones),

       - y lo expone a todos sus hijos mediante el contexto.

   3) Expone un hook de conveniencia (`usarContextoAlimentadores`) para que cualquier componente hijo pueda 
	   leer el contexto de forma segura.


1) Creación del contexto

   const ContextoAlimentadores = createContext(null);

   - Crea un contexto nuevo con valor inicial `null`.

   - Este contexto es el “canal” por el que se van a compartir:
       • la lista de puestos,
       • el puesto seleccionado,
       • los alimentadores,
       • las lecturas en vivo y procesadas,
       • y las funciones para operar todo eso.

   - Que el valor inicial sea `null` ayuda a detectar usos incorrectos:
       • si alguien intenta leer el contexto sin estar dentro del provider, el hook `usarContextoAlimentadores` 
		   tirará un error claro.


2) ProveedorAlimentadores: combinación de hooks

   export const ProveedorAlimentadores = ({ children }) => {
     const puestosHook = usarPuestos();
     const medicionesHook = usarMediciones();

     const { registrosEnVivo } = medicionesHook;
     const { puestoSeleccionado } = puestosHook;

     const [lecturasTarjetas, setLecturasTarjetas] = useState({});
     // ...
   };

   - `usarPuestos()` aporta toda la parte “estructural”:
       • puestos,
       • alimentadores,
       • selección,
       • altas/bajas,
       • reordenamiento.

   - `usarMediciones()` aporta la parte “dinámica”:
       • lecturas Modbus crudas (`registrosEnVivo`),
       • timers,
       • estados de medición activa.

   - Se extraen:
       • `registrosEnVivo` → lecturas crudas por alimentador/equipo,
       • `puestoSeleccionado` → el puesto que está activo en la vista.

   - `lecturasTarjetas` es un estado local que va a guardar:
       • los valores ya calculados y organizados para cada tarjeta (parte superior e inferior por alimentador).


3) useEffect: cálculo de lecturasTarjetas

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

         const parteSuperior = calcularValoresLadoTarjeta(
           regsDelAlim,
           diseno.superior
         );

         const parteInferior = calcularValoresLadoTarjeta(
           regsDelAlim,
           diseno.inferior
         );

         nuevo[alim.id] = { parteSuperior, parteInferior };
       });

       return nuevo;
     });
   }, [puestoSeleccionado, registrosEnVivo]);

   - Este efecto se encarga de transformar:
       • “registros crudos de Modbus” + “mapeo configurado”, en:
       		• “lecturas listas para mostrar en las tarjetas” (`lecturasTarjetas`).

   - Se vuelve a ejecutar cada vez que cambia:
       • el `puestoSeleccionado`,
       • o los `registrosEnVivo`.

   - Si no hay ningún puesto seleccionado:
       • limpia `lecturasTarjetas` (objeto vacío),
       • así la UI sabe que no hay nada que mostrar.

   - Si sí hay un puesto:
       1) Crea un objeto `nuevo = {}`.

       2) Recorre todos los `alimentadores` del puesto seleccionado.

       3) Para cada alimentador:
            • toma sus registros crudos (`regsDelAlim`),
            • calcula el diseño de la tarjeta (`obtenerDisenoTarjeta`),
            • calcula qué mostrar en la parte superior (`calcularValoresLadoTarjeta` con `diseno.superior`),
            • calcula qué mostrar en la parte inferior (`calcularValoresLadoTarjeta` con `diseno.inferior`),
            • guarda el resultado como:
                nuevo[alim.id] = { parteSuperior, parteInferior }.

       4) Devuelve `nuevo` y se guarda en `lecturasTarjetas`.

   - Resultado: `lecturasTarjetas` tiene, para cada alimentador, las infos ya masticadas para que las tarjetas 
	  solo se preocupen por mostrarlas, sin tener que recalcular nada por su cuenta.


4) Helpers sobre mediciones

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

   - `iniciarMedicionConCalculo`:
       • simplemente reenvía la llamada a `medicionesHook.iniciarMedicion`, permitiendo pasar una 
		   configuración “override”, es decir, (usar una configuración por encima (temporalmente) de 
			la configuración original, sin modificar la original), desde los modales 
			(cambios de período, índices, etc. sin alterar la config original).

   - `alternarMedicion`:
       • consulta `estaMidiendo(alimId, equipo)` en el hook de mediciones,
       • si está midiendo → llama a `detenerMedicion`,
       • si no está midiendo → llama a `iniciarMedicionConCalculo`.

   - Este helper simplifica mucho la UI:
       • la tarjeta o el botón no tiene que decidir si debe iniciar o detener,
         solo llama a `alternarMedicion` y listo.


5) valorContexto con useMemo

   const valorContexto = useMemo(
     () => ({
       // datos y funciones de puestos,
       // datos y funciones de alimentadores,
       // lecturas y funciones de medición...
     }),
     [puestosHook, medicionesHook, lecturasTarjetas]
   );

   - `valorContexto` es el “paquete” completo que se va a compartir por contexto: mezcla todo lo que 
	   exponen `usarPuestos` y `usarMediciones` más el estado `lecturasTarjetas`.

   - Dentro del objeto se agrupa en tres bloques:

       a) Datos y acciones de puestos:
          - `puestos`, `puestoSeleccionado`, `puestoSeleccionadoId`,
          - `agregarPuesto`, `eliminarPuesto`, `seleccionarPuesto`,
          - `actualizarPuestos`, `setPuestos`.

       b) Acciones sobre alimentadores:
          - `agregarAlimentador`, `actualizarAlimentador`,
          - `eliminarAlimentador`, `reordenarAlimentadores`.

       c) Mediciones y lecturas:
          - `lecturasTarjetas`, `registrosEnVivo`,
          - `iniciarMedicion`, `detenerMedicion`,
          - `iniciarMedicionConCalculo`, `alternarMedicion`,
          - `obtenerRegistros`, `estaMidiendo`,
          - `obtenerTimestampInicio`, `obtenerContadorLecturas`.

   - El uso de `useMemo`:
       • evita crear un nuevo objeto en cada render si nada relevante cambió,
       • solo vuelve a crear `valorContexto` cuando cambia:
           - `puestosHook`,
           - `medicionesHook`,
           - o `lecturasTarjetas`.
       • al mantener estable (cuando se puede) la referencia de este objeto, se reducen re-renders 
		   innecesarios en componentes hijos que consumen el contexto.


6) Provider del contexto

   return (
     <ContextoAlimentadores.Provider value={valorContexto}>
       {children}
     </ContextoAlimentadores.Provider>
   );

   - Envuelve a todos los componentes hijos (`children`) con el provider del contexto, usando `valorContexto` como `value`.

   - Cualquier componente dentro de `<ProveedorAlimentadores>...</ProveedorAlimentadores>`
     puede acceder a estos datos y funciones usando `usarContextoAlimentadores()`.

   - En la práctica, en App.jsx se usa algo así:
       <ProveedorAlimentadores>
         <VistaAlimentadores />
       </ProveedorAlimentadores>
     y toda la vista de alimentadores queda “conectada” a este contexto.


7) Hook usarContextoAlimentadores

   export const usarContextoAlimentadores = () => {
     const contexto = useContext(ContextoAlimentadores);

     if (!contexto) {
       throw new Error(
         "usarContextoAlimentadores debe usarse dentro de ProveedorAlimentadores"
       );
     }

     return contexto;
   };

   - Es un hook de conveniencia para no usar `useContext` directamente en
     todos lados.

   - Internamente:
       • llama a `useContext(ContextoAlimentadores)` para leer el contexto,
       • si el contexto es `null` o `undefined`, lanza un error claro.

   - Esto ayuda a detectar rápidamente errores de uso, por ejemplo:
       • intentar usar `usarContextoAlimentadores()` en un componente que está
         fuera de `<ProveedorAlimentadores>`.

   - Desde la UI, el uso típico es:
       const {
         puestos,
         puestoSeleccionado,
         lecturasTarjetas,
         iniciarMedicion,
         // ...
       } = usarContextoAlimentadores();

       y así se accede a todo sin pasar props por todos los niveles.

-----------------------------------------------------------------------------------------*/

