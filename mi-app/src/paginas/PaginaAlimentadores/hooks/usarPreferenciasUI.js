// src/paginas/PaginaAlimentadores/hooks/usarPreferenciasUI.js

import { useState, useEffect, useCallback } from "react";
import { CLAVES_STORAGE } from "../constantes/clavesAlmacenamiento";

// Valores por defecto
const GAP_DEFAULT = 10; // gap por defecto entre tarjetas (10px)
const GAP_MIN = 0;
const GAP_MAX = 500;

/**
 * Hook para manejar preferencias de UI (espaciado individual por tarjeta)
 * Persiste automáticamente en localStorage.
 *
 * Cada tarjeta tiene su propio gap a la derecha, guardado como:
 * { "alimId1": 10, "alimId2": 50, ... }
 */
export const usarPreferenciasUI = () => {
	// Cargar gaps desde localStorage: { alimId: gap, ... }
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

	// Guardar en localStorage cuando cambia
	useEffect(() => {
		localStorage.setItem(CLAVES_STORAGE.GAP_TARJETAS, JSON.stringify(gapsPorTarjeta));
	}, [gapsPorTarjeta]);

	// Obtener el gap de una tarjeta específica
	const obtenerGap = useCallback((alimId) => {
		const gap = gapsPorTarjeta[alimId];
		return gap !== undefined ? gap : GAP_DEFAULT;
	}, [gapsPorTarjeta]);

	// Establecer el gap de una tarjeta específica
	const establecerGap = useCallback((alimId, nuevoGap) => {
		const gapValidado = Math.max(GAP_MIN, Math.min(GAP_MAX, nuevoGap));
		setGapsPorTarjetaState(prev => ({
			...prev,
			[alimId]: gapValidado
		}));
	}, []);

	// Resetear gap de una tarjeta al valor por defecto
	const resetearGap = useCallback((alimId) => {
		setGapsPorTarjetaState(prev => {
			const nuevo = { ...prev };
			delete nuevo[alimId];
			return nuevo;
		});
	}, []);

	// Resetear todos los gaps
	const resetearTodosLosGaps = useCallback(() => {
		setGapsPorTarjetaState({});
	}, []);

	return {
		gapsPorTarjeta,
		obtenerGap,
		establecerGap,
		resetearGap,
		resetearTodosLosGaps,
		GAP_MIN,
		GAP_MAX,
		GAP_DEFAULT,
	};
};
