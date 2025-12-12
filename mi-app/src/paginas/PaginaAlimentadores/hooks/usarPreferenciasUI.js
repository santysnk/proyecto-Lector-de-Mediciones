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
const ROW_GAP_MAX = 200;

/**
 * Hook para manejar preferencias de UI:
 * - Espaciado horizontal individual por tarjeta
 * - Espaciado vertical por fila (índice de fila)
 *
 * Persiste automáticamente en localStorage.
 *
 * Gaps horizontales: { "alimId1": 10, "alimId2": 50, ... }
 * Gaps verticales: { "0": 20, "1": 30, ... } (índice de fila como key)
 */
export const usarPreferenciasUI = () => {
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

	// Obtener el gap de una fila específica (índice 0 = separación del menú)
	const obtenerRowGap = useCallback((rowIndex) => {
		const gap = gapsPorFila[rowIndex];
		return gap !== undefined ? gap : ROW_GAP_DEFAULT;
	}, [gapsPorFila]);

	// Establecer el gap de una fila específica
	const establecerRowGap = useCallback((rowIndex, nuevoGap) => {
		const gapValidado = Math.max(ROW_GAP_MIN, Math.min(ROW_GAP_MAX, nuevoGap));
		setGapsPorFilaState(prev => ({
			...prev,
			[rowIndex]: gapValidado
		}));
	}, []);

	// Resetear gap de una fila al valor por defecto
	const resetearRowGap = useCallback((rowIndex) => {
		setGapsPorFilaState(prev => {
			const nuevo = { ...prev };
			delete nuevo[rowIndex];
			return nuevo;
		});
	}, []);

	// Resetear todos los gaps de filas
	const resetearTodosLosRowGaps = useCallback(() => {
		setGapsPorFilaState({});
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
	};
};
