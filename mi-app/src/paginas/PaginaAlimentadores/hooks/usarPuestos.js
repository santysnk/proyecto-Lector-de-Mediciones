import { useState, useEffect } from 'react';
import { CLAVES_STORAGE } from '../constantes/clavesAlmacenamiento';
import { guardarEnStorage, leerDeStorage } from '../utilidades/almacenamiento';
import { COLORES_SISTEMA } from '../constantes/colores';

/**
 * ==============================================================================
 * HOOK: usarPuestos
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Este es un "Hook Personalizado" (Custom Hook). Su trabajo es manejar toda la
 * lógica relacionada con los "Puestos" (las estaciones de monitoreo).
 * Actúa como el cerebro que recuerda qué puestos existen, cuál está seleccionado
 * y permite agregar, borrar o modificar puestos y sus alimentadores.
 * 
 * ¿CÓMO SE VINCULA?
 * - Se usa principalmente en "PaginaAlimentadores.jsx".
 * - Utiliza "almacenamiento.js" para guardar los datos en el navegador (LocalStorage),
 *   así no se pierden cuando recargas la página.
 * - Usa "colores.js" para asignar colores por defecto a los nuevos puestos.
 * 
 * FINALIDAD:
 * Centralizar la gestión de datos de los puestos en un solo lugar, separando
 * la lógica de datos (aquí) de la interfaz visual (los componentes).
 */

export const usarPuestos = () => {
	const COLOR_FONDO_POR_DEFECTO = "#e5e7eb";

	// ==========================================================================
	// 1. ESTADOS (La memoria del componente)
	// ==========================================================================

	// Lista de todos los puestos. Se inicia leyendo del almacenamiento local.
	const [puestos, setPuestos] = useState(() => {
		return leerDeStorage(CLAVES_STORAGE.PUESTOS, []); // Si no hay nada guardado, inicia como lista vacía []
	});

	// ID del puesto que el usuario está viendo actualmente.
	const [puestoSeleccionadoId, setPuestoSeleccionadoId] = useState(() => {
		const idGuardado = leerDeStorage(CLAVES_STORAGE.PUESTO_SELECCIONADO);
		return idGuardado ? Number(idGuardado) : null;
	});

	// Objeto completo del puesto seleccionado (calculado automáticamente)
	// Busca en la lista 'puestos' el que coincida con 'puestoSeleccionadoId'
	const puestoSeleccionado =
		puestos.find((p) => p.id === puestoSeleccionadoId) || puestos[0] || null;

	// ==========================================================================
	// 2. EFECTOS (Reacciones automáticas)
	// ==========================================================================

	// Cada vez que cambie la lista de 'puestos', guardarla en el navegador
	useEffect(() => {
		guardarEnStorage(CLAVES_STORAGE.PUESTOS, puestos);
	}, [puestos]);

	// Cada vez que cambie el 'puestoSeleccionadoId', guardar la selección
	useEffect(() => {
		if (puestoSeleccionadoId != null) {
			guardarEnStorage(CLAVES_STORAGE.PUESTO_SELECCIONADO, puestoSeleccionadoId);
		} else {
			localStorage.removeItem(CLAVES_STORAGE.PUESTO_SELECCIONADO); // Si es null, borrar del storage
		}
	}, [puestoSeleccionadoId]);

	// Si hay puestos pero no hay ninguno seleccionado, seleccionar el primero automáticamente
	useEffect(() => {
		if (!puestos.length) return; // Si no hay puestos, no hacer nada

		const seleccionValida = puestos.some((p) => p.id === puestoSeleccionadoId);
		if (puestoSeleccionadoId == null || !seleccionValida) {
			setPuestoSeleccionadoId(puestos[0].id); // Seleccionar el primero por defecto
		}
	}, [puestos, puestoSeleccionadoId]);

	// ==========================================================================
	// 3. FUNCIONES (Acciones que se pueden realizar)
	// ==========================================================================

	/**
	 * Crea un nuevo puesto y lo agrega a la lista.
	 * @param {string} nombrePuesto - El nombre que escribió el usuario
	 * @param {string} colorPuesto - El color elegido
	 */
	const agregarPuesto = (nombrePuesto, colorPuesto) => {
		const nuevoPuesto = {
			id: Date.now(), 				// Usamos la hora actual como ID único
			nombre: nombrePuesto.trim(), 	// Quitamos espacios al inicio y final
			color: colorPuesto || COLORES_SISTEMA[0],
			bgColor: COLOR_FONDO_POR_DEFECTO,
			alimentadores: [], 				// Un puesto nuevo empieza sin alimentadores
		};

		setPuestos((anteriores) => [...anteriores, nuevoPuesto]); // Agregamos el nuevo a la lista existente
		setPuestoSeleccionadoId(nuevoPuesto.id); // Lo seleccionamos automáticamente
	};

	/**
	 * Reemplaza la lista completa de puestos.
	 * Se usa cuando editamos el orden o propiedades de varios puestos a la vez.
	 */
	const actualizarPuestos = (nuevaListaPuestos) => {
		const sinVacios = nuevaListaPuestos.filter((p) => p.nombre.trim() !== ""); // Evitar puestos sin nombre
		setPuestos(sinVacios);

		// Si el puesto que estábamos viendo se borró, seleccionamos otro
		const seleccionExiste = sinVacios.some((p) => p.id === puestoSeleccionadoId);
		if (!seleccionExiste) {
			setPuestoSeleccionadoId(sinVacios[0]?.id || null);
		}
	};

	/**
	 * Borra un puesto de la lista.
	 */
	const eliminarPuesto = (idPuesto) => {
		setPuestos((anteriores) => anteriores.filter((p) => p.id !== idPuesto)); // Filtramos para dejar fuera el que queremos borrar
	};

	/**
	 * Cambia el puesto activo.
	 */
	const seleccionarPuesto = (idPuesto) => {
		setPuestoSeleccionadoId(idPuesto);
	};

	/**
	 * Agrega un nuevo alimentador (tarjeta) al puesto que está seleccionado actualmente.
	 */
	const agregarAlimentador = (datosAlimentador) => {
		if (!puestoSeleccionado) return;

		const nuevoAlimentador = {
			id: Date.now(), 		// ID único para el alimentador
			...datosAlimentador, 	// Copiamos todos los datos que vienen del formulario
		};

		// Actualizamos la lista de puestos buscando el seleccionado y agregándole el alimentador
		setPuestos((anteriores) =>
			anteriores.map((p) =>
				p.id === puestoSeleccionado.id
					? { ...p, alimentadores: [...p.alimentadores, nuevoAlimentador] } // Aquí se agrega
					: p // Los otros puestos no cambian
			)
		);
	};

	/**
	 * Modifica un alimentador existente (ej: cambiar nombre, configuración, etc).
	 */
	const actualizarAlimentador = (idPuesto, idAlimentador, nuevosDatos) => {
		setPuestos((anteriores) =>
			anteriores.map((p) =>
				p.id === idPuesto
					? {
						...p,
						alimentadores: p.alimentadores.map((a) =>
							a.id === idAlimentador ? { ...a, ...nuevosDatos } : a // Solo modificamos el alimentador coincidente
						),
					}
					: p
			)
		);
	};

	/**
	 * Borra un alimentador específico de un puesto.
	 */
	const eliminarAlimentador = (idPuesto, idAlimentador) => {
		setPuestos((anteriores) =>
			anteriores.map((p) =>
				p.id === idPuesto
					? {
						...p,
						alimentadores: p.alimentadores.filter(
							(a) => a.id !== idAlimentador // Filtramos para quitar el alimentador
						),
					}
					: p
			)
		);
	};

	/**
	 * Cambia el orden de los alimentadores (usado por Drag & Drop).
	 */
	const reordenarAlimentadores = (idPuesto, nuevoOrdenAlimentadores) => {
		setPuestos((anteriores) =>
			anteriores.map((p) =>
				p.id === idPuesto
					? { ...p, alimentadores: nuevoOrdenAlimentadores } // Reemplazamos la lista con el nuevo orden
					: p
			)
		);
	};

	// Devolvemos todo lo que los componentes necesitan usar
	return {
		// Estados (Datos)
		puestos,
		puestoSeleccionado,
		puestoSeleccionadoId,

		// Funciones (Acciones)
		agregarPuesto,
		eliminarPuesto,
		seleccionarPuesto,
		actualizarPuestos,
		setPuestos,

		agregarAlimentador,
		actualizarAlimentador,
		eliminarAlimentador,
		reordenarAlimentadores,
	};
};
