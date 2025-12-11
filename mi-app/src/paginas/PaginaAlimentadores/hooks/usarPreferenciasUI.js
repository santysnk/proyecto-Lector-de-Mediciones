// src/paginas/PaginaAlimentadores/hooks/usarPreferenciasUI.js

import { useState, useEffect, useCallback } from "react";
import { CLAVES_STORAGE } from "../constantes/clavesAlmacenamiento";

// Valores por defecto
const GAP_DEFAULT = 20; // gap por defecto entre tarjetas
const GAP_MIN = 0;
const GAP_MAX = 500;

/**
 * Hook para manejar preferencias de UI (espaciado entre tarjetas)
 * Persiste automáticamente en localStorage.
 */
export const usarPreferenciasUI = () => {
	// Cargar gap desde localStorage
	const [gapTarjetas, setGapTarjetasState] = useState(() => {
		const guardado = localStorage.getItem(CLAVES_STORAGE.GAP_TARJETAS);
		if (guardado) {
			const parsed = parseInt(guardado, 10);
			return isNaN(parsed) ? GAP_DEFAULT : parsed;
		}
		return GAP_DEFAULT;
	});

	// Guardar en localStorage cuando cambia
	useEffect(() => {
		localStorage.setItem(CLAVES_STORAGE.GAP_TARJETAS, String(gapTarjetas));
	}, [gapTarjetas]);

	// Establecer el gap
	const setGapTarjetas = useCallback((nuevoGap) => {
		const gapValidado = Math.max(GAP_MIN, Math.min(GAP_MAX, nuevoGap));
		setGapTarjetasState(gapValidado);
	}, []);

	// Resetear preferencias
	const resetearPreferencias = useCallback(() => {
		setGapTarjetasState(GAP_DEFAULT);
	}, []);

	return {
		gapTarjetas,
		setGapTarjetas,
		resetearPreferencias,
		GAP_MIN,
		GAP_MAX,
		GAP_DEFAULT,
	};
};
