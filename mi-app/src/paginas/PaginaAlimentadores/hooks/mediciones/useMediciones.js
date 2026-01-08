// src/paginas/PaginaAlimentadores/hooks/usarMediciones.js

import { useState, useCallback } from "react";

/**
 * Hook para manejar el estado de registros/mediciones de alimentadores.
 *
 * Este hook gestiona el estado de los registros leídos desde Supabase (via polling)
 * y provee funciones auxiliares para consultar el estado de las mediciones.
 *
 * NOTA: El flujo anterior de lectura directa Modbus (simulado/real con timers internos)
 * fue eliminado. Ahora las lecturas vienen del polling en VistaAlimentadores que
 * consulta la tabla `lecturas` de Supabase.
 */
export const useMediciones = () => {
	// Registros leídos en vivo por alimentador
	// Estructura: { [alimId]: { rele: [{index, address, value}], analizador: [...] } }
	const [registrosEnVivo, setRegistrosEnVivo] = useState({});

	// Timestamps de última actualización por alimentador/equipo
	// Estructura: { [alimId]: { rele: timestamp, analizador: timestamp } }
	const [timestampsInicio, setTimestampsInicio] = useState({});

	// Contador de lecturas por alimentador/equipo
	// Estructura: { [alimId]: { rele: number, analizador: number } }
	const [contadorLecturas, setContadorLecturas] = useState({});

	/**
	 * Actualiza los registros de un alimentador.
	 * Usado por el polling de Supabase para cargar nuevas lecturas.
	 *
	 * @param {string} alimId - ID del alimentador.
	 * @param {Object|Function} nuevosDatosOFuncion - Datos nuevos o función actualizadora.
	 */
	const actualizarRegistros = useCallback((alimId, nuevosDatosOFuncion) => {
		const ahora = Date.now();

		setRegistrosEnVivo((anteriores) => {
			const registrosAnteriores = anteriores[alimId] || {};
			const nuevosDatos = typeof nuevosDatosOFuncion === 'function'
				? nuevosDatosOFuncion(registrosAnteriores)
				: nuevosDatosOFuncion;

			return {
				...anteriores,
				[alimId]: {
					...registrosAnteriores,
					...nuevosDatos,
				},
			};
		});

		// Actualizar timestamp
		setTimestampsInicio((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				rele: ahora, // Por ahora usamos rele como default
			},
		}));

		// Incrementar contador
		setContadorLecturas((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				rele: (anteriores[alimId]?.rele || 0) + 1,
			},
		}));
	}, []);

	/**
	 * Obtiene los registros de un alimentador y equipo.
	 */
	const obtenerRegistros = useCallback((alimId, equipo) => {
		return registrosEnVivo[alimId]?.[equipo] || [];
	}, [registrosEnVivo]);

	/**
	 * Verifica si un alimentador tiene datos cargados (está "midiendo").
	 * En el nuevo flujo, esto indica si hay datos de polling disponibles.
	 */
	const estaMidiendo = useCallback((alimId, equipo) => {
		const registros = registrosEnVivo[alimId]?.[equipo];
		return Array.isArray(registros) && registros.length > 0;
	}, [registrosEnVivo]);

	/**
	 * Obtiene el timestamp de la última actualización.
	 */
	const obtenerTimestampInicio = useCallback((alimId, equipo) => {
		return timestampsInicio[alimId]?.[equipo] || null;
	}, [timestampsInicio]);

	/**
	 * Obtiene el contador de lecturas.
	 */
	const obtenerContadorLecturas = useCallback((alimId, equipo) => {
		return contadorLecturas[alimId]?.[equipo] || 0;
	}, [contadorLecturas]);

	/**
	 * Limpia los datos de un alimentador (usado al eliminar).
	 */
	const detenerMedicion = useCallback((alimId, equipo) => {
		// Limpiar registros del equipo
		setRegistrosEnVivo((anteriores) => {
			if (!anteriores[alimId]) return anteriores;

			const nuevo = { ...anteriores };
			if (nuevo[alimId]?.[equipo]) {
				delete nuevo[alimId][equipo];
				if (Object.keys(nuevo[alimId]).length === 0) {
					delete nuevo[alimId];
				}
			}
			return nuevo;
		});

		// Limpiar timestamp
		setTimestampsInicio((anteriores) => {
			if (!anteriores[alimId]) return anteriores;

			const nuevo = { ...anteriores };
			if (nuevo[alimId]?.[equipo]) {
				delete nuevo[alimId][equipo];
				if (Object.keys(nuevo[alimId]).length === 0) {
					delete nuevo[alimId];
				}
			}
			return nuevo;
		});

		// Limpiar contador
		setContadorLecturas((anteriores) => {
			if (!anteriores[alimId]) return anteriores;

			const nuevo = { ...anteriores };
			if (nuevo[alimId]?.[equipo]) {
				delete nuevo[alimId][equipo];
				if (Object.keys(nuevo[alimId]).length === 0) {
					delete nuevo[alimId];
				}
			}
			return nuevo;
		});
	}, []);

	return {
		// Estado
		registrosEnVivo,

		// Funciones
		actualizarRegistros,
		obtenerRegistros,
		estaMidiendo,
		obtenerTimestampInicio,
		obtenerContadorLecturas,
		detenerMedicion,
	};
};
