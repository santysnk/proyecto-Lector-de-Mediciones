// src/paginas/PaginaAlimentadores/hooks/puestos/useArrastrarSoltar.js
// Hook para manejar drag & drop de tarjetas de alimentadores

import { useState } from "react";

export const useArrastrarSoltar = () => {
	const [elementoArrastrandoId, setElementoArrastrandoId] = useState(null);

	const alIniciarArrastre = (id) => setElementoArrastrandoId(id);
	const alTerminarArrastre = () => setElementoArrastrandoId(null);
	const alPasarPorEncima = (evento) => evento.preventDefault();

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

	const moverAlFinal = (lista, idElemento) => {
		const nuevaLista = [...lista];
		const indice = nuevaLista.findIndex((item) => item.id === idElemento);

		if (indice === -1) return lista;
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
