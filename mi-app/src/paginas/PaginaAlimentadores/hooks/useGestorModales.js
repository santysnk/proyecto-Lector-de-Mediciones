// src/paginas/PaginaAlimentadores/hooks/useGestorModales.js

import { useState, useCallback } from "react"; // estado y memoización de callbacks de React

/**
 * Gestor simple de modales identificados por una clave.
 * Permite abrir/cerrar y guardar datos asociados al modal.
 *
 * Estructura interna:
 *   estadoModales = {
 *     [idModal]: { abierto: boolean, datos: any }
 *   }
 */
export const useGestorModales = () => {
	const [estadoModales, setEstadoModales] = useState({});        // mapa de estados por id de modal

	const abrirModal = useCallback((idModal, datos = null) => {
		setEstadoModales((prev) => ({
			...prev,
			[idModal]: { abierto: true, datos },           // marca el modal como abierto y guarda datos opcionales
		}));
	}, []);

	const cerrarModal = useCallback((idModal) => {
		setEstadoModales((prev) => ({
			...prev,
			[idModal]: { abierto: false, datos: null },     // lo marca como cerrado y limpia datos
		}));
	}, []);

	const obtenerEstado = useCallback(
		(idModal) => estadoModales[idModal] || { abierto: false, datos: null }, // estado por defecto si nunca se abrió
		[estadoModales]
	);

	return { abrirModal, cerrarModal, obtenerEstado, estadoModales };
};

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (useGestorModales.js)

 - Este hook es un "mini gestor de ventanas": centraliza el estado de todos los modales usando una 
   clave (`idModal`) para cada uno.

 - `abrirModal(id, datos)` abre el modal con esa clave y opcionalmente le asocia un objeto `datos` 
   (por ejemplo, el alimentador que se está editando).

 - `cerrarModal(id)` cierra el modal y descarta cualquier dato previo asociado.

 - `obtenerEstado(id)` devuelve siempre un objeto con la forma `{ abierto: boolean, datos: any }`, 
   aunque ese modal nunca se haya abierto.

 - Al usar este hook en `VistaAlimentadores`, cada modal (nuevo puesto, editar puestos, configuración 
   de alimentador, mapeo) simplemente pide su estado con `obtenerEstado("clave")` y lo abre/cierra 
	llamando a `abrirModal` o `cerrarModal`.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (useGestorModales.js)

0) Visión general del hook

   Este hook es un “mini centro de control de modales”. Sirve para manejar
   varios modales a la vez usando una clave de texto (idModal) para cada uno.

   La estructura interna es:

     estadoModales = {
       [idModal]: {
         abierto: boolean,   // si el modal está visible o no
         datos: any          // info asociada al modal (por ejemplo, el alimentador a editar)
       }
     }

   En vez de tener un useState por cada modal (`isNuevoPuestoAbierto`, `isEditarPuestoAbierto`, etc.), 
	todo se maneja en un solo objeto y con tres funciones simples: abrir, cerrar y leer estado.


1) estadoModales (useState)

   const [estadoModales, setEstadoModales] = useState({});

   - `estadoModales` empieza como un objeto vacío: no hay modales abiertos.

   - Cada vez que abrimos o cerramos un modal, vamos agregando o modificando entradas en este objeto 
	  con la forma:
       estadoModales["configAlim1"] = { abierto: true/false, datos: ... }

   - Tener todo en un solo estado hace fácil:
       • pasar el estado completo para debug,
       • o mostrar un panel de “qué modales están abiertos” si se necesitara.


2) abrirModal

   const abrirModal = useCallback((idModal, datos = null) => {
     setEstadoModales((prev) => ({
       ...prev,
       [idModal]: { abierto: true, datos },
     }));
   }, []);

   - Recibe:
       • `idModal`: una clave string que identifica al modal (ej: "nuevoPuesto", "editarAlimentador",
		   "mapeoAlim3", etc.),
       • `datos` (opcional): cualquier objeto que queramos asociar a ese modal (por ejemplo, el alimentador 
		   que se está editando).

   - Usa `setEstadoModales` con función para tomar el estado anterior (`prev`) y devolver uno nuevo:
       • copia todo lo que ya existía (`...prev`),
       • reemplaza o crea la entrada para esa clave `idModal` con:
           { abierto: true, datos }.

   - Resultado: el modal queda marcado como abierto y con los datos que le pasamos.

   - Está envuelto en `useCallback(..., [])` para que la referencia de la función se mantenga estable entre 
	  renders (ayuda a evitar renders extra si se pasa como prop a otros componentes).


3) cerrarModal

   const cerrarModal = useCallback((idModal) => {
     setEstadoModales((prev) => ({
       ...prev,
       [idModal]: { abierto: false, datos: null },
     }));
   }, []);

   - Recibe `idModal`, la misma clave que se usó para abrir el modal.

   - Actualiza el estado:
       • mantiene el resto del objeto igual (`...prev`),
       • para esa clave, pone:
           { abierto: false, datos: null }.

   - Es decir:
       • marca el modal como cerrado,
       • y borra cualquier dato que se hubiera guardado antes.

   - También está memoizada con `useCallback` para que su referencia no cambie en cada render sin necesidad.


4) obtenerEstado

   const obtenerEstado = useCallback(
     (idModal) => estadoModales[idModal] || { abierto: false, datos: null },
     [estadoModales]
   );

   - Recibe `idModal` y devuelve SIEMPRE un objeto con esta forma:
       { abierto: boolean, datos: any }

   - Si ese modal ya fue usado antes:
       • devuelve el estado real guardado en `estadoModales[idModal]`.

   - Si ese modal nunca se abrió:
       • devuelve un estado “por defecto”:
           { abierto: false, datos: null }.

   - Esto simplifica mucho la UI porque evita tener que hacer chequeos tipo:
       if (estado && estado.abierto) ...
     En cambio, el componente puede hacer directamente:
       const { abierto, datos } = obtenerEstado("configAlim1");

   - Está envuelta en `useCallback` dependiente de `estadoModales` para que solo cambie la referencia 
	  de la función cuando cambia el estado de los modales, no en cada render.


5) return del hook

   return { abrirModal, cerrarModal, obtenerEstado, estadoModales };

   - Expone cuatro cosas hacia los componentes que usan este hook:

       • `abrirModal(id, datos?)`
           → marca el modal como abierto y asocia datos opcionales.

       • `cerrarModal(id)`
           → marca el modal como cerrado y limpia los datos asociados.

       • `obtenerEstado(id)`
           → devuelve siempre un objeto `{ abierto, datos }` para ese modal, aunque jamás se haya abierto.

       • `estadoModales`
           → estado completo con todos los modales; útil para debug o para vistas que quieran mostrar 
			    un resumen general.

   - En `VistaAlimentadores`, cada modal se maneja así:
       const { abierto, datos } = obtenerEstado("claveDelModal");

       y se abre/cierra con:
         abrirModal("claveDelModal", datosOpcionales);
         cerrarModal("claveDelModal");

   - De esta forma, no se acumula lógica de “qué modal está abierto” en cada
     componente: todo pasa por este hook centralizado.
---------------------------------------------------------------------------*/


