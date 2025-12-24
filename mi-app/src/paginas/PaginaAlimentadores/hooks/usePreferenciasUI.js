// src/paginas/PaginaAlimentadores/hooks/usarPreferenciasUI.js

import { useState, useEffect, useCallback } from "react";
import { CLAVES_STORAGE } from "../constantes/clavesAlmacenamiento";

// Valores por defecto - Gaps horizontales (entre tarjetas)
const GAP_DEFAULT = 10;
const GAP_MIN = 0;
const GAP_MAX = 500;

// Valores por defecto - Gaps verticales (entre filas)
const ROW_GAP_DEFAULT = 40;
const ROW_GAP_MIN = 0;
const ROW_GAP_MAX = 400;

// Valores por defecto - Escala de tarjetas
const ESCALA_DEFAULT = 1.0;
const ESCALA_MIN = 0.5;
const ESCALA_MAX = 2.0;

/**
 * Hook para manejar preferencias de UI:
 * - Espaciado horizontal individual por tarjeta
 * - Espaciado vertical por fila (índice de fila + puestoId)
 * - Escala de tarjetas (global, por puesto, individual)
 *
 * Persiste automáticamente en localStorage.
 *
 * Gaps horizontales: { "alimId1": 10, "alimId2": 50, ... }
 * Gaps verticales: { "puestoId:rowIndex": 20, ... } (combinación puesto+fila como key)
 * Escala global: número (ej: 1.0)
 * Escala por puesto: { "puestoId": 0.8, ... }
 * Escala por tarjeta: { "alimId": 1.2, ... }
 * Prioridad: Individual > Por puesto > Global > Default (1.0)
 */
export const usePreferenciasUI = () => {
	// ===== GAPS HORIZONTALES (entre tarjetas) =====
	const [gapsPorTarjeta, setGapsPorTarjetaState] = useState(() => {
		const guardado = localStorage.getItem(CLAVES_STORAGE.GAP_TARJETAS);
		if (guardado) {
			try {
				return JSON.parse(guardado);
			} catch {
				return {};
			}
		}
		return {};
	});

	useEffect(() => {
		localStorage.setItem(CLAVES_STORAGE.GAP_TARJETAS, JSON.stringify(gapsPorTarjeta));
	}, [gapsPorTarjeta]);

	const obtenerGap = useCallback((alimId) => {
		const gap = gapsPorTarjeta[alimId];
		return gap !== undefined ? gap : GAP_DEFAULT;
	}, [gapsPorTarjeta]);

	const establecerGap = useCallback((alimId, nuevoGap) => {
		const gapValidado = Math.max(GAP_MIN, Math.min(GAP_MAX, nuevoGap));
		setGapsPorTarjetaState(prev => ({
			...prev,
			[alimId]: gapValidado
		}));
	}, []);

	const resetearGap = useCallback((alimId) => {
		setGapsPorTarjetaState(prev => {
			const nuevo = { ...prev };
			delete nuevo[alimId];
			return nuevo;
		});
	}, []);

	const resetearTodosLosGaps = useCallback(() => {
		setGapsPorTarjetaState({});
	}, []);

	// ===== GAPS VERTICALES (entre filas) =====
	const [gapsPorFila, setGapsPorFilaState] = useState(() => {
		const guardado = localStorage.getItem(CLAVES_STORAGE.GAP_FILAS);
		if (guardado) {
			try {
				return JSON.parse(guardado);
			} catch {
				return {};
			}
		}
		return {};
	});

	useEffect(() => {
		localStorage.setItem(CLAVES_STORAGE.GAP_FILAS, JSON.stringify(gapsPorFila));
	}, [gapsPorFila]);

	// Generar clave única para un gap de fila (combinando puestoId y rowIndex)
	const generarClaveRowGap = (puestoId, rowIndex) => `${puestoId}:${rowIndex}`;

	// Obtener el gap de una fila específica en un puesto específico
	const obtenerRowGap = useCallback((puestoId, rowIndex) => {
		if (!puestoId) return ROW_GAP_DEFAULT;
		const clave = generarClaveRowGap(puestoId, rowIndex);
		const gap = gapsPorFila[clave];
		return gap !== undefined ? gap : ROW_GAP_DEFAULT;
	}, [gapsPorFila]);

	// Establecer el gap de una fila específica en un puesto específico
	const establecerRowGap = useCallback((puestoId, rowIndex, nuevoGap) => {
		if (!puestoId) return;
		const clave = generarClaveRowGap(puestoId, rowIndex);
		const gapValidado = Math.max(ROW_GAP_MIN, Math.min(ROW_GAP_MAX, nuevoGap));
		setGapsPorFilaState(prev => ({
			...prev,
			[clave]: gapValidado
		}));
	}, []);

	// Resetear gap de una fila al valor por defecto
	const resetearRowGap = useCallback((puestoId, rowIndex) => {
		if (!puestoId) return;
		const clave = generarClaveRowGap(puestoId, rowIndex);
		setGapsPorFilaState(prev => {
			const nuevo = { ...prev };
			delete nuevo[clave];
			return nuevo;
		});
	}, []);

	// Resetear todos los gaps de filas
	const resetearTodosLosRowGaps = useCallback(() => {
		setGapsPorFilaState({});
	}, []);

	// ===== ESCALA GLOBAL =====
	const [escalaGlobal, setEscalaGlobalState] = useState(() => {
		const guardado = localStorage.getItem(CLAVES_STORAGE.ESCALA_GLOBAL);
		if (guardado) {
			const valor = parseFloat(guardado);
			if (!isNaN(valor)) return valor;
		}
		return ESCALA_DEFAULT;
	});

	useEffect(() => {
		localStorage.setItem(CLAVES_STORAGE.ESCALA_GLOBAL, escalaGlobal.toString());
	}, [escalaGlobal]);

	const establecerEscalaGlobal = useCallback((nuevaEscala) => {
		const escalaValidada = Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, nuevaEscala));
		setEscalaGlobalState(escalaValidada);
	}, []);

	const resetearEscalaGlobal = useCallback(() => {
		setEscalaGlobalState(ESCALA_DEFAULT);
	}, []);

	// ===== ESCALA POR PUESTO =====
	const [escalasPorPuesto, setEscalasPorPuestoState] = useState(() => {
		const guardado = localStorage.getItem(CLAVES_STORAGE.ESCALA_PUESTOS);
		if (guardado) {
			try {
				return JSON.parse(guardado);
			} catch {
				return {};
			}
		}
		return {};
	});

	useEffect(() => {
		localStorage.setItem(CLAVES_STORAGE.ESCALA_PUESTOS, JSON.stringify(escalasPorPuesto));
	}, [escalasPorPuesto]);

	const obtenerEscalaPuesto = useCallback((puestoId) => {
		if (!puestoId) return null;
		return escalasPorPuesto[puestoId];
	}, [escalasPorPuesto]);

	const establecerEscalaPuesto = useCallback((puestoId, nuevaEscala) => {
		if (!puestoId) return;
		const escalaValidada = Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, nuevaEscala));
		setEscalasPorPuestoState(prev => ({
			...prev,
			[puestoId]: escalaValidada
		}));
	}, []);

	const resetearEscalaPuesto = useCallback((puestoId) => {
		if (!puestoId) return;
		setEscalasPorPuestoState(prev => {
			const nuevo = { ...prev };
			delete nuevo[puestoId];
			return nuevo;
		});
	}, []);

	const resetearTodasLasEscalasPuestos = useCallback(() => {
		setEscalasPorPuestoState({});
	}, []);

	// ===== ESCALA POR TARJETA (individual) =====
	const [escalasPorTarjeta, setEscalasPorTarjetaState] = useState(() => {
		const guardado = localStorage.getItem(CLAVES_STORAGE.ESCALA_TARJETAS);
		if (guardado) {
			try {
				return JSON.parse(guardado);
			} catch {
				return {};
			}
		}
		return {};
	});

	useEffect(() => {
		localStorage.setItem(CLAVES_STORAGE.ESCALA_TARJETAS, JSON.stringify(escalasPorTarjeta));
	}, [escalasPorTarjeta]);

	const obtenerEscalaTarjeta = useCallback((alimId) => {
		if (!alimId) return null;
		return escalasPorTarjeta[alimId];
	}, [escalasPorTarjeta]);

	const establecerEscalaTarjeta = useCallback((alimId, nuevaEscala) => {
		if (!alimId) return;
		const escalaValidada = Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, nuevaEscala));
		setEscalasPorTarjetaState(prev => ({
			...prev,
			[alimId]: escalaValidada
		}));
	}, []);

	const resetearEscalaTarjeta = useCallback((alimId) => {
		if (!alimId) return;
		// Guardamos null para indicar "ignorar escala individual (incluso de BD)"
		// Esto permite que la escala del puesto tenga efecto
		setEscalasPorTarjetaState(prev => ({
			...prev,
			[alimId]: null
		}));
	}, []);

	const resetearTodasLasEscalasTarjetas = useCallback(() => {
		setEscalasPorTarjetaState({});
	}, []);

	/**
	 * Obtiene la escala efectiva de una tarjeta considerando la jerarquía:
	 * Individual > Por puesto > Global > Default
	 * @param {string} alimId - ID del alimentador
	 * @param {string} puestoId - ID del puesto (opcional, para escala por puesto)
	 * @returns {number} Escala efectiva a aplicar
	 */
	const obtenerEscalaEfectiva = useCallback((alimId, puestoId) => {
		// 1. Escala individual (máxima prioridad)
		const escalaIndividual = escalasPorTarjeta[alimId];
		if (escalaIndividual !== undefined) return escalaIndividual;

		// 2. Escala por puesto
		if (puestoId) {
			const escalaPuesto = escalasPorPuesto[puestoId];
			if (escalaPuesto !== undefined) return escalaPuesto;
		}

		// 3. Escala global
		if (escalaGlobal !== ESCALA_DEFAULT) return escalaGlobal;

		// 4. Default
		return ESCALA_DEFAULT;
	}, [escalasPorTarjeta, escalasPorPuesto, escalaGlobal]);

	// Resetear todas las escalas
	const resetearTodasLasEscalas = useCallback(() => {
		setEscalaGlobalState(ESCALA_DEFAULT);
		setEscalasPorPuestoState({});
		setEscalasPorTarjetaState({});
	}, []);

	return {
		// Gaps horizontales
		gapsPorTarjeta,
		obtenerGap,
		establecerGap,
		resetearGap,
		resetearTodosLosGaps,
		GAP_MIN,
		GAP_MAX,
		GAP_DEFAULT,
		// Gaps verticales
		gapsPorFila,
		obtenerRowGap,
		establecerRowGap,
		resetearRowGap,
		resetearTodosLosRowGaps,
		ROW_GAP_MIN,
		ROW_GAP_MAX,
		ROW_GAP_DEFAULT,
		// Escala global
		escalaGlobal,
		establecerEscalaGlobal,
		resetearEscalaGlobal,
		// Escala por puesto
		escalasPorPuesto,
		obtenerEscalaPuesto,
		establecerEscalaPuesto,
		resetearEscalaPuesto,
		resetearTodasLasEscalasPuestos,
		// Escala por tarjeta (individual)
		escalasPorTarjeta,
		obtenerEscalaTarjeta,
		establecerEscalaTarjeta,
		resetearEscalaTarjeta,
		resetearTodasLasEscalasTarjetas,
		// Escala efectiva (combina jerarquía)
		obtenerEscalaEfectiva,
		resetearTodasLasEscalas,
		// Constantes de escala
		ESCALA_MIN,
		ESCALA_MAX,
		ESCALA_DEFAULT,
	};
};
