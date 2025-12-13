// src/paginas/PaginaAlimentadores/hooks/usarPuestos.js

import { useState, useEffect } from "react";                         
import { CLAVES_STORAGE } from "../constantes/clavesAlmacenamiento";             // claves centralizadas para localStorage
import { guardarEnStorage, leerDeStorage,} from "../utilidades/almacenamiento";  // helpers seguros para leer/escribir en localStorage
import { COLORES_SISTEMA } from "../constantes/colores";                         // paleta de colores disponible para puestos

/**
 * Hook personalizado para manejar puestos.
 * Maneja: estado, persistencia en localStorage, y selección activa.
 *
 * @returns {Object} Estado y funciones para trabajar con puestos y alimentadores.
 */

export const usarPuestos = () => {

  const COLOR_FONDO_POR_DEFECTO = "#e5e7eb";

    /**
   * Agrega un nuevo puesto a la lista.
   *
   * @param {string} nombrePuesto - Nombre del puesto.
   * @param {string} colorPuesto - Color hex del puesto.
   */

  const agregarPuesto = (nombrePuesto, colorPuesto) => {
    const nuevoPuesto = {
      id: Date.now(),                                      // id simple basado en timestamp
      nombre: nombrePuesto.trim(),
      color: colorPuesto || COLORES_SISTEMA[0],
      bgColor: COLOR_FONDO_POR_DEFECTO,
      alimentadores: [],
    };

    setPuestos((anteriores) => [...anteriores, nuevoPuesto]);

    setPuestoSeleccionadoId(nuevoPuesto.id);               // selecciona el puesto recién creado
  };

  // Estado: lista de todos los puestos
  // arranca leyendo desde localStorage (o [] si no hay nada)
  const [puestos, setPuestos] = useState(() => {
    return leerDeStorage(CLAVES_STORAGE.PUESTOS, []);         
  });

  // Estado: ID del puesto actualmente seleccionado
  const [puestoSeleccionadoId, setPuestoSeleccionadoId] = useState(() => {
    const idGuardado = leerDeStorage(CLAVES_STORAGE.PUESTO_SELECCIONADO);        // último id seleccionado guardado
    return idGuardado ? Number(idGuardado) : null;
  });

  // Derivado: objeto completo del puesto seleccionado
  const puestoSeleccionado =
    puestos.find((p) => p.id === puestoSeleccionadoId) ||
    puestos[0] ||                                                                 // si no hay id válido, toma el primero
    null;

  // Efecto: guardar puestos en localStorage cuando cambien
  useEffect(() => {
    guardarEnStorage(CLAVES_STORAGE.PUESTOS, puestos);
  }, [puestos]);


  // Efecto: guardar selección en localStorage cuando cambie
  useEffect(() => {

    if (puestoSeleccionadoId != null) {
		      guardarEnStorage(CLAVES_STORAGE.PUESTO_SELECCIONADO, puestoSeleccionadoId);
    } else {
      localStorage.removeItem(CLAVES_STORAGE.PUESTO_SELECCIONADO);
    }

  }, [puestoSeleccionadoId]);


  // Efecto: auto‑seleccionar primer puesto si no hay selección válida
  useEffect(() => {
    if (!puestos.length) return;                           // si no hay puestos, no hay nada que seleccionar

    const seleccionValida = puestos.some((p) => p.id === puestoSeleccionadoId);

    if (puestoSeleccionadoId == null || !seleccionValida) {
      setPuestoSeleccionadoId(puestos[0].id);              // corrige la selección al primer puesto disponible
    }
  }, [puestos, puestoSeleccionadoId]);


  

  /**
   * Actualiza la lista completa de puestos.
   * Útil para edición masiva desde el modal de edición.
   *
   * @param {Array} nuevaListaPuestos - Nueva lista de puestos.
   */

  const actualizarPuestos = (nuevaListaPuestos) => {
    const sinVacios = nuevaListaPuestos.filter((p) => p.nombre.trim() !== "");  // descarta puestos sin nombre

    setPuestos(sinVacios);

    // Si el seleccionado se eliminó, seleccionar el primero disponible
    const seleccionExiste = sinVacios.some((p) => p.id === puestoSeleccionadoId);

    if (!seleccionExiste) {
      setPuestoSeleccionadoId(sinVacios[0]?.id || null);
    }

    // NOTA: Los puestos se guardan en localStorage automáticamente mediante useEffect.
    // Si estás usando Supabase, las actualizaciones a la BD deben hacerse desde
    // el componente que llama a esta función (ej: ModalEditarPuestos).
  };


  /**
   * Elimina un puesto por su ID.
   *
   * @param {number} idPuesto - ID del puesto a eliminar.
   */
  const eliminarPuesto = (idPuesto) => {
    setPuestos((anteriores) =>
      anteriores.filter((p) => p.id !== idPuesto)
    );
  };

  /**
   * Selecciona un puesto como activo.
   *
   * @param {number} idPuesto - ID del puesto a seleccionar.
   */
  const seleccionarPuesto = (idPuesto) => {
    setPuestoSeleccionadoId(idPuesto);
  };

  /**
   * Agrega un alimentador al puesto seleccionado.
   *
   * @param {Object} datosAlimentador - Datos del nuevo alimentador.
   */
  const agregarAlimentador = (datosAlimentador) => {
    if (!puestoSeleccionado) return;

    const nuevoAlimentador = {
      id: Date.now(),
      ...datosAlimentador,
    };

    setPuestos((anteriores) =>
      anteriores.map((p) =>
        p.id === puestoSeleccionado.id ? { ...p, alimentadores: [...p.alimentadores, nuevoAlimentador], } : p)
    );
  };

  /**
   * Actualiza un alimentador existente.
   *
   * @param {number} idPuesto - ID del puesto que contiene el alimentador.
   * @param {number} idAlimentador - ID del alimentador a actualizar.
   * @param {Object} nuevosDatos - Nuevos datos del alimentador.
   */
  const actualizarAlimentador = (idPuesto, idAlimentador, nuevosDatos) => {
    setPuestos((anteriores) =>
      anteriores.map((p) =>
        p.id === idPuesto ? { ...p, alimentadores: p.alimentadores.map((a) => a.id === idAlimentador ? { ...a, ...nuevosDatos } : a), } : p)
    );
  };


  /**
   * Elimina un alimentador.
   *
   * @param {number} idPuesto - ID del puesto.
   * @param {number} idAlimentador - ID del alimentador a eliminar.
   */
  const eliminarAlimentador = (idPuesto, idAlimentador) => {
    setPuestos((anteriores) =>
      anteriores.map((p) =>
        p.id === idPuesto ? { ...p, alimentadores: p.alimentadores.filter((a) => a.id !== idAlimentador), } : p)
    );
  };


  /**
   * Reordena los alimentadores de un puesto.
   *
   * @param {number} idPuesto - ID del puesto.
   * @param {Array} nuevoOrdenAlimentadores - Nueva lista ordenada.
   */
  const reordenarAlimentadores = (idPuesto, nuevoOrdenAlimentadores) => {
    setPuestos((anteriores) =>
      anteriores.map((p) =>
        p.id === idPuesto ? { ...p, alimentadores: nuevoOrdenAlimentadores } : p)
    );
  };

  // Devolver estado y funciones
  return {
    // Estados
    puestos,
    puestoSeleccionado,
    puestoSeleccionadoId,

    // Funciones de puestos
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

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (usarPuestos.js)

 - Este hook concentra todo lo relacionado con la "estructura" de la pantalla:
   la lista de puestos, cuál está seleccionado y qué alimentadores tiene cada uno.

 - Al montarse, intenta recuperar la lista de puestos y el id seleccionado desde
   localStorage usando las claves de `CLAVES_STORAGE`; si no hay nada, parte de
   una lista vacía y sin selección.

 - Cada vez que cambia `puestos`, los guarda en localStorage; cada vez que cambia
   `puestoSeleccionadoId`, actualiza la clave correspondiente o la borra si es null.

 - Si por algún motivo el id seleccionado ya no existe (por ejemplo, borré ese
   puesto desde el modal de edición), un efecto corrige la selección apuntando al
   primer puesto disponible.

 - Las funciones públicas que expone (`agregarPuesto`, `eliminarPuesto`,
   `agregarAlimentador`, `actualizarAlimentador`, `reordenarAlimentadores`, etc.)
   son las que usa el contexto y la vista para modificar la estructura sin tocar
   directamente el estado interno.
-------------------------------------------------------------------------------
*/}

{/*---------------------------------------------------------------------------
 CÓDIGO + EXPLICACIÓN DE CADA FUNCIÓN (usarPuestos.js)

 1) agregarPuesto

   const agregarPuesto = (nombrePuesto, colorPuesto) => {
     const nuevoPuesto = {
       id: Date.now(),                    
       nombre: nombrePuesto.trim(),
       color: colorPuesto || COLORES_SISTEMA[0],
       bgColor: COLOR_FONDO_POR_DEFECTO,
       alimentadores: [],
     };

     setPuestos((anteriores) => [...anteriores, nuevoPuesto]);
     setPuestoSeleccionadoId(nuevoPuesto.id); 
   };

   - Recibe el nombre y el color que vienen del modal “Nuevo puesto”.

   - Crea un objeto `nuevoPuesto` con:
       • un id único (usando Date.now()),
       • el nombre sin espacios al inicio/fin,
       • el color elegido o uno por defecto si no se pasó nada,
       • un fondo por defecto,
       • un array vacío de `alimentadores`.

   - Agrega ese puesto al final de la lista de `puestos`.
	
   - Deja seleccionado automáticamente el puesto que se acaba de crear.

 2) actualizarPuestos

   const actualizarPuestos = (nuevaListaPuestos) => {
     const sinVacios = nuevaListaPuestos.filter((p) => p.nombre.trim() !== "");

     setPuestos(sinVacios);

     const seleccionExiste = sinVacios.some((p) => p.id === puestoSeleccionadoId);

     if (!seleccionExiste) {
       setPuestoSeleccionadoId(sinVacios[0]?.id || null);
     }
   };

   - Recibe la lista completa de puestos editada desde el modal “Editar puestos”.

   - Elimina de esa lista los puestos que quedaron sin nombre (nombre vacío).

   - Actualiza el estado `puestos` con esa lista depurada.

   - Revisa si el puesto que estaba seleccionado sigue existiendo:
       • si existe, se deja igual,
       • si fue eliminado, se selecciona el primer puesto disponible,
         o `null` si ya no queda ninguno.

 3) eliminarPuesto

   const eliminarPuesto = (idPuesto) => {
     setPuestos((anteriores) =>
       anteriores.filter((p) => p.id !== idPuesto)
     );
   };

   - Recibe el `idPuesto` que se quiere eliminar.

   - Crea una nueva lista de `puestos` sin el puesto que tenga ese id.

   - No se ocupa de la selección actual; ese ajuste lo hace otro efecto
     que vigila `puestoSeleccionadoId` y la lista de puestos.

 4) seleccionarPuesto

   const seleccionarPuesto = (idPuesto) => {
     setPuestoSeleccionadoId(idPuesto);
   };

   - Guarda en `puestoSeleccionadoId` el id del puesto que se eligió.

   - A partir de ese id, el resto de la app toma:
       • qué puesto está activo,
       • qué alimentadores hay que mostrar en la pantalla.

 5) agregarAlimentador

   const agregarAlimentador = (datosAlimentador) => {
     if (!puestoSeleccionado) return;

     const nuevoAlimentador = {
       id: Date.now(),
       ...datosAlimentador,
     };

     setPuestos((anteriores) =>
       anteriores.map((p) =>
         p.id === puestoSeleccionado.id
           ? {
               ...p,
               alimentadores: [...p.alimentadores, nuevoAlimentador],
             }
           : p
       )
     );
   };

   - Solo funciona si ya hay un `puestoSeleccionado`; si no, sale sin hacer nada.

   - Crea un `nuevoAlimentador` con:
       • un id único,
       • todos los campos que envía el modal (nombre, IP, etc.).

   - Recorre la lista de `puestos`:
       • cuando encuentra el puesto seleccionado, le agrega el nuevo
         alimentador al final de su array `alimentadores`,
       • los demás puestos quedan igual.

   - De esta forma solo se modifica el puesto activo y se respeta la estructura
     inmutable (se crean nuevos objetos en lugar de modificar los existentes).

 6) actualizarAlimentador

   const actualizarAlimentador = (idPuesto, idAlimentador, nuevosDatos) => {
     setPuestos((anteriores) =>
       anteriores.map((p) =>
         p.id === idPuesto
           ? {
               ...p,
               alimentadores: p.alimentadores.map((a) =>
                 a.id === idAlimentador ? { ...a, ...nuevosDatos } : a
               ),
             }
           : p
       )
     );
   };

   - Recibe:
       • `idPuesto`: en qué puesto hay que buscar,
       • `idAlimentador`: qué alimentador dentro de ese puesto queremos editar,
       • `nuevosDatos`: los campos actualizados (nombre, IP, etc.).

   - Recorre los puestos hasta encontrar el que coincide con `idPuesto`.

   - Dentro de ese puesto, recorre sus `alimentadores` y:
       • cuando encuentra el que tiene `idAlimentador`, crea una nueva versión
         mezclando los datos anteriores con `nuevosDatos`,
       • el resto de alimentadores se dejan tal cual.

   - Así actualiza solo el alimentador indicado sin tocar el resto de la estructura.

 7) eliminarAlimentador

   const eliminarAlimentador = (idPuesto, idAlimentador) => {
     setPuestos((anteriores) =>
       anteriores.map((p) =>
         p.id === idPuesto
           ? {
               ...p,
               alimentadores: p.alimentadores.filter(
                 (a) => a.id !== idAlimentador
               ),
             }
           : p
       )
     );
   };

   - Recibe:
       • `idPuesto`: puesto al que pertenece el alimentador,
       • `idAlimentador`: alimentador que se quiere borrar.

   - Busca el puesto con `idPuesto`.

   - En ese puesto, crea una nueva lista de `alimentadores` eliminando el que
     coincida con `idAlimentador`.

   - Devuelve una nueva lista de `puestos` donde solo ese puesto cambió,
     manteniendo la idea de no modificar directamente los objetos originales.

 8) reordenarAlimentadores

   const reordenarAlimentadores = (idPuesto, nuevoOrdenAlimentadores) => {
     setPuestos((anteriores) =>
       anteriores.map((p) =>
         p.id === idPuesto
           ? { ...p, alimentadores: nuevoOrdenAlimentadores }
           : p
       )
     );
   };

   - Recibe:
       • `idPuesto`: puesto al que corresponde el nuevo orden,
       • `nuevoOrdenAlimentadores`: array de alimentadores ya ordenado
         (por ejemplo, después de un drag & drop).
   - Reemplaza el array `alimentadores` de ese puesto por el nuevo orden.

   - No calcula el orden; solo guarda el resultado que le pasó la lógica
     de drag & drop.
---------------------------------------------------------------------------*/}
