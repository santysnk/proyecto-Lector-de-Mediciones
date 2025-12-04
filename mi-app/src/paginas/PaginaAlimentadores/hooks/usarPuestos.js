import { useState, useEffect } from 'react';
import { CLAVES_STORAGE } from '../constantes/clavesAlmacenamiento';
import { guardarEnStorage, leerDeStorage } from '../utilidades/almacenamiento';
import { COLORES_SISTEMA } from '../constantes/colores';

/**
 * Hook personalizado para manejar puestos
 * Maneja: estado, persistencia en localStorage, y selección activa
 * 
 * @returns {Object} Estado y funciones para trabajar con puestos
 */
export const usarPuestos = () => {
	const COLOR_FONDO_POR_DEFECTO = "#e5e7eb";

	// Estado: lista de todos los puestos
	const [puestos, setPuestos] = useState(() => {
		return leerDeStorage(CLAVES_STORAGE.PUESTOS, []);
	});

	// Estado: ID del puesto actualmente seleccionado
	const [puestoSeleccionadoId, setPuestoSeleccionadoId] = useState(() => {
		const idGuardado = leerDeStorage(CLAVES_STORAGE.PUESTO_SELECCIONADO);
		return idGuardado ? Number(idGuardado) : null;
	});

	// Derivado: objeto completo del puesto seleccionado
	const puestoSeleccionado =
		puestos.find((p) => p.id === puestoSeleccionadoId) || puestos[0] || null;

	// Efecto: Guardar puestos en localStorage cuando cambien
	useEffect(() => {
		guardarEnStorage(CLAVES_STORAGE.PUESTOS, puestos);
	}, [puestos]);

	// Efecto: Guardar selección en localStorage cuando cambie
	useEffect(() => {
		if (puestoSeleccionadoId != null) {
			guardarEnStorage(CLAVES_STORAGE.PUESTO_SELECCIONADO, puestoSeleccionadoId);
		} else {
			localStorage.removeItem(CLAVES_STORAGE.PUESTO_SELECCIONADO);
		}
	}, [puestoSeleccionadoId]);

	// Efecto: Auto-seleccionar primer puesto si no hay selección
	useEffect(() => {
		if (!puestos.length) return;

		const seleccionValida = puestos.some((p) => p.id === puestoSeleccionadoId);
		if (puestoSeleccionadoId == null || !seleccionValida) {
			setPuestoSeleccionadoId(puestos[0].id);
		}
	}, [puestos, puestoSeleccionadoId]);

	/**
	 * Agrega un nuevo puesto a la lista
	 * 
	 * @param {string} nombrePuesto - Nombre del puesto
	 * @param {string} colorPuesto - Color hex del puesto
	 */
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

	/**
	 * Actualiza la lista completa de puestos
	 * Útil para edición masiva
	 * 
	 * @param {Array} nuevaListaPuestos - Nueva lista de puestos
	 */
	const actualizarPuestos = (nuevaListaPuestos) => {
		const sinVacios = nuevaListaPuestos.filter((p) => p.nombre.trim() !== "");
		setPuestos(sinVacios);

		// Si el seleccionado se eliminó, seleccionar el primero
		const seleccionExiste = sinVacios.some((p) => p.id === puestoSeleccionadoId);
		if (!seleccionExiste) {
			setPuestoSeleccionadoId(sinVacios[0]?.id || null);
		}
	};

	/**
	 * Elimina un puesto por su ID
	 * 
	 * @param {number} idPuesto - ID del puesto a eliminar
	 */
	const eliminarPuesto = (idPuesto) => {
		setPuestos((anteriores) => anteriores.filter((p) => p.id !== idPuesto));
	};

	/**
	 * Selecciona un puesto como activo
	 * 
	 * @param {number} idPuesto - ID del puesto a seleccionar
	 */
	const seleccionarPuesto = (idPuesto) => {
		setPuestoSeleccionadoId(idPuesto);
	};

	/**
	 * Agrega un alimentador al puesto seleccionado
	 * 
	 * @param {Object} datosAlimentador - Datos del nuevo alimentador
	 */
	const agregarAlimentador = (datosAlimentador) => {
		if (!puestoSeleccionado) return;

		const nuevoAlimentador = {
			id: Date.now(),
			...datosAlimentador,
		};

		setPuestos((anteriores) =>
			anteriores.map((p) =>
				p.id === puestoSeleccionado.id
					? { ...p, alimentadores: [...p.alimentadores, nuevoAlimentador] }
					: p
			)
		);
	};

	/**
	 * Actualiza un alimentador existente
	 * 
	 * @param {number} idPuesto - ID del puesto que contiene el alimentador
	 * @param {number} idAlimentador - ID del alimentador a actualizar
	 * @param {Object} nuevosDatos - Nuevos datos del alimentador
	 */
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

	/**
	 * Elimina un alimentador
	 * 
	 * @param {number} idPuesto - ID del puesto
	 * @param {number} idAlimentador - ID del alimentador a eliminar
	 */
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

	/**
	 * Reordena los alimentadores de un puesto
	 * 
	 * @param {number} idPuesto - ID del puesto
	 * @param {Array} nuevoOrdenAlimentadores - Nueva lista ordenada
	 */
	const reordenarAlimentadores = (idPuesto, nuevoOrdenAlimentadores) => {
		setPuestos((anteriores) =>
			anteriores.map((p) =>
				p.id === idPuesto
					? { ...p, alimentadores: nuevoOrdenAlimentadores }
					: p
			)
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
