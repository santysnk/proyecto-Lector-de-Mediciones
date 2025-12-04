import { useState } from 'react';

/**
 * Hook personalizado para manejar drag & drop (arrastrar y soltar)
 * Simplifica la lógica de reordenamiento de alimentadores
 * 
 * @returns {Object} Estado y funciones para drag & drop
 */
export const usarArrastrarSoltar = () => {
	// ID del elemento que se está arrastrando actualmente
	const [elementoArrastrandoId, setElementoArrastrandoId] = useState(null);

	/**
	 * Maneja el inicio del arrastre
	 * 
	 * @param {number} id - ID del elemento arrastrado
	 */
	const alIniciarArrastre = (id) => {
		setElementoArrastrandoId(id);
	};

	/**
	 * Maneja el fin del arrastre
	 * Limpia el estado
	 */
	const alTerminarArrastre = () => {
		setElementoArrastrandoId(null);
	};

	/**
	 * Permite que un elemento sea un destino válido de drop
	 * 
	 * @param {Event} evento - Evento dragover
	 */
	const alPasarPorEncima = (evento) => {
		evento.preventDefault();
	};

	/**
	 * Reordena una lista moviendo un elemento a la posición de otro
	 * 
	 * @param {Array} lista Lista original
	 * @param {number} idOrigen - ID del elemento a mover
	 * @param {number} idDestino - ID del elemento destino
	 * @returns {Array} Nueva lista reordenada
	 */
	const reordenarLista = (lista, idOrigen, idDestino) => {
		if (idOrigen === idDestino) return lista;

		const nuevaLista = [...lista];
		const indiceOrigen = nuevaLista.findIndex((item) => item.id === idOrigen);
		const indiceDestino = nuevaLista.findIndex((item) => item.id === idDestino);

		if (indiceOrigen === -1 || indiceDestino === -1) return lista;

		// Remover elemento del origen
		const [elementoMovido] = nuevaLista.splice(indiceOrigen, 1);

		// Insertar en la posición destino
		nuevaLista.splice(indiceDestino, 0, elementoMovido);

		return nuevaLista;
	};

	/**
	 * Mueve un elemento al final de la lista
	 * 
	 * @param {Array} lista - Lista original
	 * @param {number} idElemento - ID del elemento a mover
	 * @returns {Array} Nueva lista con elemento al final
	 */
	const moverAlFinal = (lista, idElemento) => {
		const nuevaLista = [...lista];
		const indice = nuevaLista.findIndex((item) => item.id === idElemento);

		if (indice === -1) return lista;

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
