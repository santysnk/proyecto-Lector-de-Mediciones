// src/paginas/PaginaAlimentadores/hooks/usarArrastrarSoltar.js

import { useState } from "react"; // hook de React para manejar estado local

/**
 * Hook personalizado para manejar drag & drop (arrastrar y soltar).
 * Simplifica la lógica de reordenamiento de alimentadores.
 *
 * @returns {Object} Estado y funciones para drag & drop.
 */
export const useArrastrarSoltar = () => {
	// ID del elemento que se está arrastrando actualmente (o null si ninguno)
	const [elementoArrastrandoId, setElementoArrastrandoId] = useState(null);

	/**
	 * Maneja el inicio del arrastre.
	 *
	 * @param {number} id - ID del elemento arrastrado.
	 */
	const alIniciarArrastre = (id) => {
		setElementoArrastrandoId(id);
	};

	/**
	 * Maneja el fin del arrastre.
	 * Limpia el estado interno.
	 */
	const alTerminarArrastre = () => {
		setElementoArrastrandoId(null);
	};

	/**
	 * Permite que un elemento sea un destino válido de drop.
	 *
	 * @param {DragEvent} evento - Evento dragover.
	 */
	const alPasarPorEncima = (evento) => {
		evento.preventDefault(); // sin esto, el navegador no permite soltar
	};

	/**
	 * Reordena una lista moviendo un elemento a la posición de otro.
	 *
	 * @param {Array} lista - Lista original.
	 * @param {number} idOrigen - ID del elemento a mover.
	 * @param {number} idDestino - ID del elemento destino.
	 * @returns {Array} Nueva lista reordenada.
	 */
	const reordenarLista = (lista, idOrigen, idDestino) => {
		if (idOrigen === idDestino) return lista; // nada que hacer si son el mismo

		const nuevaLista = [...lista];
		const indiceOrigen = nuevaLista.findIndex((item) => item.id === idOrigen);
		const indiceDestino = nuevaLista.findIndex((item) => item.id === idDestino);

		if (indiceOrigen === -1 || indiceDestino === -1) return lista; // ids inválidos

		// Remover elemento del origen
		const [elementoMovido] = nuevaLista.splice(indiceOrigen, 1);

		// Insertar en la posición destino
		nuevaLista.splice(indiceDestino, 0, elementoMovido);

		return nuevaLista;
	};

	/**
	 * Mueve un elemento al final de la lista.
	 *
	 * @param {Array} lista - Lista original.
	 * @param {number} idElemento - ID del elemento a mover.
	 * @returns {Array} Nueva lista con elemento al final.
	 */
	const moverAlFinal = (lista, idElemento) => {
		const nuevaLista = [...lista];
		const indice = nuevaLista.findIndex((item) => item.id === idElemento);

		if (indice === -1) return lista; // id no encontrado

		// Remover y agregar al final
		const [elementoMovido] = nuevaLista.splice(indice, 1);
		nuevaLista.push(elementoMovido);

		return nuevaLista;
	};

	return {
		// Estado
		elementoArrastrandoId,
		estaArrastrando: elementoArrastrandoId !== null,

		// Handlers de eventos
		alIniciarArrastre,
		alTerminarArrastre,
		alPasarPorEncima,

		// Funciones de utilidad
		reordenarLista,
		moverAlFinal,
	};
};

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (usarArrastrarSoltar.js)

 - Este hook concentra la lógica de drag & drop usada para reordenar tarjetas
   de alimentadores en la grilla.

 - `elementoArrastrandoId` guarda el id de la tarjeta que estoy arrastrando; si
   es `null`, significa que no hay ningún drag activo. La propiedad derivada
   `estaArrastrando` es simplemente un atajo (`id !== null`).

 - `alIniciarArrastre(id)` se llama en `onDragStart` de una tarjeta: marca qué
   tarjeta se está moviendo.

 - `alTerminarArrastre()` se llama en `onDragEnd` o después de soltar: limpia el
   estado y vuelve todo a "sin arrastre".

 - `alPasarPorEncima(evento)` se usa en `onDragOver` de los destinos; la llamada
   a `evento.preventDefault()` es lo que le dice al navegador "acá sí se puede
   soltar", sin eso el drop no se dispara.

 - `reordenarLista(lista, idOrigen, idDestino)` recibe la lista actual de
   alimentadores y los ids origen/destino, calcula los índices y devuelve una
   nueva lista con el elemento movido a la posición correcta.

 - `moverAlFinal(lista, idElemento)` se usa para el área de "soltá acá para
   enviar al final": quita el elemento de su posición actual y lo agrega al
   final del array.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (usarArrastrarSoltar.js)

0) Visión general del hook

   Este hook encapsula toda la lógica básica de “arrastrar y soltar” que se usa para reordenar tarjetas de 
	alimentadores.

   La idea es que los componentes de UI no tengan que:
     - recordar qué tarjeta se está arrastrando,
     - calcular a mano el nuevo orden,
     - ni saber cómo funciona el drag & drop nativo del navegador.

   En cambio, solo usan:
     - estado: `elementoArrastrandoId` y `estaArrastrando`,
     - handlers: `alIniciarArrastre`, `alTerminarArrastre`, `alPasarPorEncima`,
     - utilidades: `reordenarLista` y `moverAlFinal`.


1) Estado: elementoArrastrandoId

   const [elementoArrastrandoId, setElementoArrastrandoId] = useState(null);

   - Guarda el id del elemento (tarjeta) que se está arrastrando en este momento.

   - Si vale `null`, significa que actualmente NO hay ningún drag activo.

   - Es el “marcador” que nos permite saber:
       • quién es el origen,
       • qué elemento hay que mover cuando se suelta sobre otro,
       • o si debemos mostrar estilos especiales cuando hay un arrastre activo.

   En el return se expone también:

     estaArrastrando: elementoArrastrandoId !== null

   - Es un booleano derivado:
       • true  → si hay algo en movimiento,
       • false → si no.

   - Sirve para que la UI pueda cambiar estilos (por ejemplo, resaltar zonas de drop) sin tener que 
	  comparar directamente contra `null`.


2) alIniciarArrastre

   const alIniciarArrastre = (id) => {
     setElementoArrastrandoId(id);
   };

   - Se llama normalmente desde el evento `onDragStart` de una tarjeta.

   - Recibe el `id` del elemento que se empezó a arrastrar.

   - Actualiza el estado `elementoArrastrandoId` con ese id.

   - En otras palabras:
       • marca “esta tarjeta es la que estoy moviendo”.

   - A partir de ese momento, las funciones de reordenamiento pueden usar ese id como `idOrigen`.


3) alTerminarArrastre

   const alTerminarArrastre = () => {
     setElementoArrastrandoId(null);
   };

   - Se llama al finalizar el drag:
       • típicamente en `onDragEnd`,
       • o después de procesar un drop exitoso.

   - Vuelve a poner `elementoArrastrandoId` en `null`.

   - Deja al hook en estado “neutral”:
       • no hay arrastres activos,
       • `estaArrastrando` pasa a ser `false`.

   - Es importante para que no queden marcadas tarjetas como si siguieran en movimiento.


4) alPasarPorEncima

   const alPasarPorEncima = (evento) => {
     evento.preventDefault();
   };

   - Se usa en el evento `onDragOver` de los elementos que pueden recibir un drop 
	  (por ejemplo, otras tarjetas o una zona especial “soltar aquí”).

   - La llamada a `evento.preventDefault()` es la clave:
       • por defecto, el navegador NO permite soltar en todos lados,
       • al hacer preventDefault() le indicamos que este elemento SÍ acepta drops.

   - Si no se llama a esto, el evento `onDrop` no se dispara en ese destino.


5) reordenarLista

   const reordenarLista = (lista, idOrigen, idDestino) => {
     if (idOrigen === idDestino) return lista;

     const nuevaLista = [...lista];
     const indiceOrigen = nuevaLista.findIndex((item) => item.id === idOrigen);
     const indiceDestino = nuevaLista.findIndex((item) => item.id === idDestino);

     if (indiceOrigen === -1 || indiceDestino === -1) return lista;

     const [elementoMovido] = nuevaLista.splice(indiceOrigen, 1);
     nuevaLista.splice(indiceDestino, 0, elementoMovido);

     return nuevaLista;
   };

   - Esta función no toca el estado por sí misma, solo calcula un NUEVO array.

   - Recibe:
       • `lista`: la lista actual de elementos (ej: alimentadores),
       • `idOrigen`: id del elemento que se está moviendo,
       • `idDestino`: id del elemento sobre el que se suelta.

   - Pasos que sigue:
       1) Si el origen y el destino son el mismo id, no hace nada y devuelve la lista tal cual (no tiene sentido moverlo sobre sí mismo).
		 
       2) Clona la lista original con `[...]` para no mutarla directamente.

       3) Busca las posiciones (índices) de origen y destino en ese nuevo array.

       4) Si alguno de los ids no existe (`findIndex === -1`), devuelve la lista sin cambios.

       5) Usa `splice` para:
            • sacar el elemento de su posición original,
            • y volver a insertarlo en la posición del destino.

       6) Devuelve la `nuevaLista` con el elemento movido.

   - Esta función suele usarse junto con el estado de `puestos`:
       • primero se calcula el nuevo orden de alimentadores con `reordenarLista`,
       • luego se guarda ese orden llamando a `reordenarAlimentadores` del hook `usarPuestos`.


6) moverAlFinal

   const moverAlFinal = (lista, idElemento) => {
     const nuevaLista = [...lista];
     const indice = nuevaLista.findIndex((item) => item.id === idElemento);

     if (indice === -1) return lista;

     const [elementoMovido] = nuevaLista.splice(indice, 1);
     nuevaLista.push(elementoMovido);

     return nuevaLista;
   };

   - Permite tomar un elemento de la lista y mandarlo al final.

   - Recibe:
       • `lista`: lista original,
       • `idElemento`: id del elemento que queremos mover.

   - Pasos:
       1) Clona la lista para no mutar la original.
       2) Busca el índice del elemento con ese id.
       3) Si no lo encuentra, devuelve la lista original.
       4) Usa `splice` para quitarlo de donde está,
       5) y luego `push` para agregarlo al final.

   - Esta función está pensada para zonas como:
       • “soltá acá para enviar al final”, donde no interesa la posición exacta del destino, solo que el elemento
       vaya al último lugar.


7) return del hook

   return {
     // Estado
     elementoArrastrandoId,
     estaArrastrando: elementoArrastrandoId !== null,

     // Handlers de eventos
     alIniciarArrastre,
     alTerminarArrastre,
     alPasarPorEncima,

     // Funciones de utilidad
     reordenarLista,
     moverAlFinal,
   };

   - Expone:
       • `elementoArrastrandoId`: id actual en movimiento (o null),
       • `estaArrastrando`: booleano de conveniencia para la UI.
		 
   - Y las funciones que la vista usa directamente:
       • `alIniciarArrastre`   → se pega a `onDragStart`,
       • `alTerminarArrastre`  → se pega a `onDragEnd` / luego de un drop,
       • `alPasarPorEncima`    → se pega a `onDragOver`,
       • `reordenarLista` y `moverAlFinal` → sirven para calcular el nuevo
         orden antes de actualizar el estado global de puestos/alimentadores.
---------------------------------------------------------------------------*/
