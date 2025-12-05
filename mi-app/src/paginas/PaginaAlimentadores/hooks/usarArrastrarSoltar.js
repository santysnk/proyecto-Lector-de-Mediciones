import { useState } from 'react';

/**
 * ==============================================================================
 * HOOK: usarArrastrarSoltar
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Este hook encapsula toda la lógica necesaria para mover elementos de una lista
 * arrastrándolos con el mouse (Drag & Drop).
 * 
 * ¿CÓMO SE VINCULA?
 * - Se usa en "PaginaAlimentadores.jsx" para permitir reordenar las tarjetas
 *   de los alimentadores.
 * 
 * FINALIDAD:
 * Simplificar el manejo de eventos del navegador (dragstart, dragover, drop)
 * y proporcionar funciones fáciles de usar para reordenar listas.
 */

export const usarArrastrarSoltar = () => {
	// ==========================================================================
	// 1. ESTADOS
	// ==========================================================================

	// Guarda el ID del elemento que el usuario está moviendo en este momento.
	// Si es null, significa que no se está arrastrando nada.
	const [elementoArrastrandoId, setElementoArrastrandoId] = useState(null);

	// ==========================================================================
	// 2. HANDLERS DE EVENTOS (Reacciones al mouse)
	// ==========================================================================

	/**
	 * Se ejecuta cuando el usuario hace clic y empieza a mover un elemento.
	 * @param {number} id - El ID del elemento que se empezó a mover
	 */
	const alIniciarArrastre = (id) => {
		setElementoArrastrandoId(id);
	};

	/**
	 * Se ejecuta cuando el usuario suelta el elemento o cancela la acción.
	 */
	const alTerminarArrastre = () => {
		setElementoArrastrandoId(null);
	};

	/**
	 * Se ejecuta cuando pasamos un elemento arrastrado por encima de otro.
	 * Es necesario prevenir el comportamiento por defecto del navegador para
	 * permitir que se pueda "soltar" (drop) el elemento.
	 */
	const alPasarPorEncima = (evento) => {
		evento.preventDefault();
	};

	// ==========================================================================
	// 3. FUNCIONES DE UTILIDAD (Lógica de listas)
	// ==========================================================================

	/**
	 * Toma una lista y mueve un elemento de una posición a otra.
	 * 
	 * @param {Array} lista - La lista original
	 * @param {number} idOrigen - ID del elemento que queremos mover
	 * @param {number} idDestino - ID del elemento sobre el cual lo soltamos
	 */
	const reordenarLista = (lista, idOrigen, idDestino) => {
		// Si lo soltamos sobre sí mismo, no hacemos nada
		if (idOrigen === idDestino) return lista;

		const nuevaLista = [...lista]; // Creamos una copia para no modificar la original directamente
		const indiceOrigen = nuevaLista.findIndex((item) => item.id === idOrigen);
		const indiceDestino = nuevaLista.findIndex((item) => item.id === idDestino);

		// Si no encontramos alguno de los elementos, devolvemos la lista igual
		if (indiceOrigen === -1 || indiceDestino === -1) return lista;

		// 1. Sacamos el elemento de su posición original
		const [elementoMovido] = nuevaLista.splice(indiceOrigen, 1);

		// 2. Lo insertamos en la nueva posición
		nuevaLista.splice(indiceDestino, 0, elementoMovido);

		return nuevaLista;
	};

	/**
	 * Mueve un elemento al final de todo.
	 * Útil cuando soltamos una tarjeta en un espacio vacío al final de la lista.
	 */
	const moverAlFinal = (lista, idElemento) => {
		const nuevaLista = [...lista];
		const indice = nuevaLista.findIndex((item) => item.id === idElemento);

		if (indice === -1) return lista;

		// 1. Sacamos el elemento
		const [elementoMovido] = nuevaLista.splice(indice, 1);

		// 2. Lo agregamos al final
		nuevaLista.push(elementoMovido);

		return nuevaLista;
	};

	return {
		// Estado
		elementoArrastrandoId,
		estaArrastrando: elementoArrastrandoId !== null, // Booleano útil para estilos visuales

		// Handlers para conectar a los componentes
		alIniciarArrastre,
		alTerminarArrastre,
		alPasarPorEncima,

		// Funciones para modificar los datos
		reordenarLista,
		moverAlFinal,
	};
};
