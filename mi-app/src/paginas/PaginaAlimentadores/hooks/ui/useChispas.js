// src/paginas/PaginaAlimentadores/hooks/usarChispas.js

import { useState, useCallback, useRef, useEffect } from "react";
import {
	construirGrafo,
	calcularRutasDesdeEmisor,
} from "../../utilidades/calculadorRutas.js";

/**
 * Límite máximo de chispas simultáneas para evitar problemas de rendimiento
 */
const MAX_CHISPAS = 100;

/**
 * Hook para manejar la animación de chispas en el diagrama unifilar.
 *
 * OPTIMIZADO: Las chispas se manejan con refs mutables, sin usar setState
 * durante la animación. Esto elimina los re-renders de React y el GC.
 *
 * @param {Object} params - Parámetros del hook
 * @param {Array} params.bornes - Array de bornes
 * @param {Object} params.celdas - Objeto de celdas pintadas
 * @param {Object} params.chispasConfig - Configuración de chispas
 * @param {number} params.grosorLinea - Grosor de línea en píxeles
 * @returns {Object} Estado y funciones para manejar chispas
 */
const useChispas = ({
	bornes = [],
	celdas = {},
	chispasConfig = {},
	grosorLinea = 12,
}) => {
	// Estado de animación activa (solo este causa re-render, y solo al iniciar/detener)
	const [animando, setAnimando] = useState(false);
	const animandoRef = useRef(false);

	// *** CAMBIO CLAVE: Las chispas son un REF, no un estado ***
	// Esto evita re-renders durante la animación
	const chispasRef = useRef([]);

	// Referencias para el loop de animación
	const animationFrameRef = useRef(null);
	const lastTimeRef = useRef(0);

	// Referencias para timers de emisión
	const emisionTimersRef = useRef({});

	// Grafo de conectividad (se recalcula cuando cambian las celdas)
	const grafoRef = useRef({});

	// Rutas precalculadas desde cada emisor
	const rutasRef = useRef({});

	// Refs para la configuración actual (para evitar closures obsoletos)
	const configRef = useRef(chispasConfig);
	const bornesRef = useRef(bornes);
	const grosorLineaRef = useRef(grosorLinea);

	// ID counter para chispas (evita Date.now() y Math.random())
	const chispaIdRef = useRef(0);

	// Mantener refs actualizados
	useEffect(() => {
		configRef.current = chispasConfig;
	}, [chispasConfig]);

	useEffect(() => {
		bornesRef.current = bornes;
	}, [bornes]);

	useEffect(() => {
		grosorLineaRef.current = grosorLinea;
	}, [grosorLinea]);

	/**
	 * Recalcular el grafo cuando cambian las celdas
	 */
	useEffect(() => {
		grafoRef.current = construirGrafo(celdas);
	}, [celdas]);

	/**
	 * Recalcular rutas cuando cambian bornes o celdas
	 */
	useEffect(() => {
		const emisores = bornes.filter(b => b.tipo === "EMISOR");
		const nuevasRutas = {};

		emisores.forEach(emisor => {
			nuevasRutas[emisor.id] = calcularRutasDesdeEmisor(emisor, bornes, grafoRef.current);
		});

		rutasRef.current = nuevasRutas;
	}, [bornes, celdas]);

	/**
	 * Crear una nueva chispa desde un emisor
	 */
	const crearChispa = useCallback((emisor) => {
		const rutas = rutasRef.current[emisor.id] || [];

		// Si no hay rutas a receptores, no crear chispa
		if (rutas.length === 0) {
			return null;
		}

		// Elegir una ruta aleatoria si hay varias
		const rutaElegida = rutas[Math.floor(Math.random() * rutas.length)];

		chispaIdRef.current += 1;

		return {
			id: chispaIdRef.current,
			ruta: rutaElegida.ruta,
			posicion: 0,
			progreso: 0, // 0-1 entre celdas
			emisorId: emisor.id,
			receptorId: rutaElegida.receptorId,
			estela: [], // Array mutable - se modifica in-place
		};
	}, []);

	/**
	 * Emitir una chispa desde un emisor específico
	 * *** MODIFICADO: Agrega directamente al ref, sin setState ***
	 */
	const emitirDesdeEmisor = useCallback((emisorId) => {
		const emisor = bornesRef.current.find(b => b.id === emisorId && b.tipo === "EMISOR");
		if (!emisor || !emisor.activo) {
			return;
		}

		// Verificar límite de chispas
		if (chispasRef.current.length >= MAX_CHISPAS) {
			return;
		}

		const nuevaChispa = crearChispa(emisor);
		if (!nuevaChispa) {
			return;
		}

		// *** Agregar directamente al array del ref ***
		chispasRef.current.push(nuevaChispa);
	}, [crearChispa]);

	/**
	 * Loop de animación - actualiza posiciones de chispas
	 * *** MODIFICADO: Modifica el ref directamente, sin setState ***
	 */
	const loopAnimacion = useCallback((timestamp) => {
		if (!animandoRef.current) {
			return;
		}

		const deltaTime = lastTimeRef.current === 0 ? 16 : timestamp - lastTimeRef.current;
		lastTimeRef.current = timestamp;

		// Velocidad en celdas por segundo
		const velocidad = configRef.current.velocidad || 8;
		const longitudEstela = configRef.current.longitudEstela || 5;

		// Calcular cuánto avanzar
		const avance = (velocidad * deltaTime) / 1000;

		const chispas = chispasRef.current;

		// Actualizar chispas IN-PLACE
		for (let i = chispas.length - 1; i >= 0; i--) {
			const chispa = chispas[i];
			chispa.progreso += avance;

			// Manejar múltiples avances de celda si la velocidad es muy alta
			while (chispa.progreso >= 1) {
				const estela = chispa.estela;

				// Shift estela hacia el final (in-place)
				for (let j = Math.min(estela.length, longitudEstela - 1); j > 0; j--) {
					estela[j] = estela[j - 1];
				}
				// Agregar posición actual al inicio
				estela[0] = chispa.ruta[chispa.posicion];

				// Ajustar longitud de estela
				if (estela.length < longitudEstela) {
					estela.length = Math.min(estela.length + 1, longitudEstela);
				} else if (estela.length > longitudEstela) {
					estela.length = longitudEstela;
				}

				chispa.posicion += 1;
				chispa.progreso -= 1;

				// Verificar si llegamos al final de la ruta
				if (chispa.posicion >= chispa.ruta.length - 1) {
					// Eliminar chispa del array (in-place)
					chispas.splice(i, 1);
					break;
				}
			}
		}

		// Continuar el loop
		animationFrameRef.current = requestAnimationFrame(loopAnimacion);
	}, []);

	/**
	 * Iniciar los timers de emisión para todos los emisores activos
	 */
	const iniciarEmisiones = useCallback(() => {
		// Limpiar timers anteriores
		Object.values(emisionTimersRef.current).forEach(clearInterval);
		emisionTimersRef.current = {};

		const emisores = bornesRef.current.filter(b => b.tipo === "EMISOR" && b.activo);
		const frecuencia = configRef.current.frecuenciaEmision || 2000;

		emisores.forEach(emisor => {
			// Emitir una chispa inmediatamente
			emitirDesdeEmisor(emisor.id);

			// Configurar timer para emisiones periódicas
			const timer = setInterval(() => {
				if (animandoRef.current) {
					emitirDesdeEmisor(emisor.id);
				}
			}, frecuencia);

			emisionTimersRef.current[emisor.id] = timer;
		});
	}, [emitirDesdeEmisor]);

	/**
	 * Detener todos los timers de emisión
	 */
	const detenerEmisiones = useCallback(() => {
		Object.values(emisionTimersRef.current).forEach(clearInterval);
		emisionTimersRef.current = {};
	}, []);

	/**
	 * Reiniciar timers cuando cambia la frecuencia de emisión (mientras está animando)
	 */
	const frecuenciaActual = chispasConfig.frecuenciaEmision || 2000;

	useEffect(() => {
		if (animandoRef.current) {
			// Limpiar timers anteriores
			Object.values(emisionTimersRef.current).forEach(clearInterval);
			emisionTimersRef.current = {};

			const emisores = bornesRef.current.filter(b => b.tipo === "EMISOR" && b.activo);

			emisores.forEach(emisor => {
				// Configurar timer con la nueva frecuencia
				const timer = setInterval(() => {
					if (animandoRef.current) {
						emitirDesdeEmisor(emisor.id);
					}
				}, frecuenciaActual);

				emisionTimersRef.current[emisor.id] = timer;
			});
		}
	}, [frecuenciaActual, emitirDesdeEmisor]);

	/**
	 * Iniciar animación
	 */
	const iniciarAnimacion = useCallback(() => {
		// Verificar que hay emisores y receptores
		const emisores = bornesRef.current.filter(b => b.tipo === "EMISOR" && b.activo);
		const receptores = bornesRef.current.filter(b => b.tipo === "RECEPTOR");

		if (emisores.length === 0 || receptores.length === 0) {
			return;
		}

		animandoRef.current = true;
		setAnimando(true);
		lastTimeRef.current = 0;

		// Limpiar chispas anteriores
		chispasRef.current = [];

		// Iniciar emisiones
		iniciarEmisiones();

		// Iniciar loop de animación
		animationFrameRef.current = requestAnimationFrame(loopAnimacion);
	}, [iniciarEmisiones, loopAnimacion]);

	/**
	 * Detener animación
	 */
	const detenerAnimacion = useCallback(() => {
		animandoRef.current = false;
		setAnimando(false);
		detenerEmisiones();
		chispasRef.current = [];

		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
	}, [detenerEmisiones]);

	/**
	 * Toggle animación
	 */
	const toggleAnimacion = useCallback(() => {
		if (animandoRef.current) {
			detenerAnimacion();
		} else {
			iniciarAnimacion();
		}
	}, [iniciarAnimacion, detenerAnimacion]);

	/**
	 * Obtener posición en píxeles de una chispa para renderizado
	 * Usa interpolación lineal para movimiento constante y fluido
	 *
	 * @param {Object} chispa - Objeto chispa con ruta, posicion y progreso
	 * @returns {Object} { x, y } posición en píxeles
	 */
	const obtenerPosicionPixel = useCallback((chispa) => {
		const { ruta, posicion, progreso } = chispa;
		const grosor = grosorLineaRef.current;

		if (!ruta || ruta.length === 0) {
			return { x: 0, y: 0 };
		}

		// Posición actual
		const [x1, y1] = ruta[posicion].split(",").map(Number);

		// Si estamos al final de la ruta, retornar la última posición
		if (posicion >= ruta.length - 1) {
			return {
				x: x1 * grosor + grosor / 2,
				y: y1 * grosor + grosor / 2,
			};
		}

		// Posición siguiente para interpolación
		const [x2, y2] = ruta[posicion + 1].split(",").map(Number);

		// Interpolación lineal simple - movimiento constante sin aceleración
		const x = (x1 + (x2 - x1) * progreso) * grosor + grosor / 2;
		const y = (y1 + (y2 - y1) * progreso) * grosor + grosor / 2;

		return { x, y };
	}, []);

	/**
	 * Obtener posiciones de la estela de una chispa
	 *
	 * @param {Object} chispa - Objeto chispa
	 * @returns {Array} Array de { x, y, opacidad }
	 */
	const obtenerEstelaPixeles = useCallback((chispa) => {
		const { estela } = chispa;
		const grosor = grosorLineaRef.current;

		if (!estela || estela.length === 0) {
			return [];
		}

		const resultado = [];
		for (let i = 0; i < estela.length; i++) {
			const clave = estela[i];
			if (!clave) continue;
			const [x, y] = clave.split(",").map(Number);
			resultado.push({
				x: x * grosor + grosor / 2,
				y: y * grosor + grosor / 2,
				opacidad: 1 - (i + 1) / (estela.length + 1),
			});
		}
		return resultado;
	}, []);

	/**
	 * Limpiar al desmontar
	 */
	useEffect(() => {
		return () => {
			animandoRef.current = false;
			detenerEmisiones();
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			chispasRef.current = [];
		};
	}, [detenerEmisiones]);

	return {
		// Estado
		animando,
		// *** CAMBIO: Devolver la referencia al array de chispas ***
		// El componente que usa este hook debe leer chispasRef.current
		chispas: chispasRef.current,
		chispasRef, // También exponer el ref directamente

		// Acciones
		iniciarAnimacion,
		detenerAnimacion,
		toggleAnimacion,

		// Utilidades para renderizado
		obtenerPosicionPixel,
		obtenerEstelaPixeles,
	};
};

export default useChispas;
