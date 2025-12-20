// src/paginas/PaginaAlimentadores/hooks/usarGrillaUnifilar.js

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Clave base para localStorage - cada puesto tendrá su propio dibujo
 */
const CLAVE_BASE = "rw-grilla-unifilar";

/**
 * Colores predefinidos para dibujar el diagrama unifiliar
 */
export const COLORES_UNIFILAR = [
	{ id: "negro", color: "#1f2937", nombre: "Negro" },
	{ id: "rojo", color: "#dc2626", nombre: "Rojo" },
	{ id: "azul", color: "#2563eb", nombre: "Azul" },
	{ id: "verde", color: "#16a34a", nombre: "Verde" },
	{ id: "amarillo", color: "#ca8a04", nombre: "Amarillo" },
	{ id: "naranja", color: "#ea580c", nombre: "Naranja" },
	{ id: "violeta", color: "#7c3aed", nombre: "Violeta" },
	{ id: "celeste", color: "#0891b2", nombre: "Celeste" },
];

/**
 * Fuentes disponibles para texto
 */
export const FUENTES_DISPONIBLES = [
	{ id: "arial", nombre: "Arial", familia: "Arial, sans-serif" },
	{ id: "helvetica", nombre: "Helvetica", familia: "Helvetica, Arial, sans-serif" },
	{ id: "times", nombre: "Times New Roman", familia: "Times New Roman, serif" },
	{ id: "courier", nombre: "Courier", familia: "Courier New, monospace" },
	{ id: "georgia", nombre: "Georgia", familia: "Georgia, serif" },
	{ id: "verdana", nombre: "Verdana", familia: "Verdana, sans-serif" },
];

/**
 * Tamaños de fuente disponibles
 */
export const TAMANOS_FUENTE = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48];

/**
 * Hook para manejar la grilla de dibujo unifiliar
 *
 * @param {string} puestoId - ID del puesto actual
 * @param {string} workspaceId - ID del workspace actual
 * @returns {Object} Estado y funciones para manejar la grilla
 */
const usarGrillaUnifilar = (puestoId, workspaceId) => {
	// Estado del dibujo: objeto con claves "x,y" y valores de color
	const [celdas, setCeldas] = useState({});
	// Textos: array de { id, x, y, texto, color, fuente, tamano, negrita, cursiva }
	const [textos, setTextos] = useState([]);
	// Modo edición activo
	const [modoEdicion, setModoEdicion] = useState(false);
	// Color seleccionado para pintar
	const [colorSeleccionado, setColorSeleccionado] = useState(COLORES_UNIFILAR[0].color);
	// Herramienta activa: "pincel", "borrador" o "texto"
	const [herramienta, setHerramienta] = useState("pincel");
	// Estado de pintando (mouse presionado)
	const [estaPintando, setEstaPintando] = useState(false);
	// Punto inicial para líneas rectas con Shift
	const puntoInicialRef = useRef(null);
	// Dirección bloqueada para Shift (null, "horizontal", "vertical")
	const direccionBloqueadaRef = useRef(null);

	// Configuración de texto
	const [configTexto, setConfigTexto] = useState({
		fuente: FUENTES_DISPONIBLES[0].familia,
		tamano: 16,
		negrita: false,
		cursiva: false,
	});

	// Texto seleccionado para editar/eliminar
	const [textoSeleccionadoId, setTextoSeleccionadoId] = useState(null);

	/**
	 * Genera la clave única de localStorage para este puesto/workspace
	 */
	const obtenerClave = useCallback(() => {
		if (!puestoId || !workspaceId) return null;
		return `${CLAVE_BASE}-${workspaceId}-${puestoId}`;
	}, [puestoId, workspaceId]);

	/**
	 * Cargar datos del localStorage al montar o cambiar de puesto
	 */
	useEffect(() => {
		const clave = obtenerClave();
		if (!clave) {
			setCeldas({});
			setTextos([]);
			return;
		}

		try {
			const datos = localStorage.getItem(clave);
			if (datos) {
				const parsed = JSON.parse(datos);
				// Compatibilidad: si es objeto plano (formato antiguo), son solo celdas
				if (parsed && typeof parsed === "object" && !parsed.celdas) {
					setCeldas(parsed);
					setTextos([]);
				} else {
					// Formato nuevo con celdas y textos
					setCeldas(parsed.celdas || {});
					setTextos(parsed.textos || []);
				}
			} else {
				setCeldas({});
				setTextos([]);
			}
		} catch (error) {
			console.error("Error al cargar grilla unifiliar:", error);
			setCeldas({});
			setTextos([]);
		}
	}, [obtenerClave]);

	/**
	 * Guardar en localStorage (celdas y textos)
	 */
	const guardarDatos = useCallback((nuevasCeldas, nuevosTextos) => {
		const clave = obtenerClave();
		if (!clave) return;

		try {
			const sinCeldas = Object.keys(nuevasCeldas).length === 0;
			const sinTextos = nuevosTextos.length === 0;

			if (sinCeldas && sinTextos) {
				localStorage.removeItem(clave);
			} else {
				localStorage.setItem(clave, JSON.stringify({
					celdas: nuevasCeldas,
					textos: nuevosTextos,
				}));
			}
		} catch (error) {
			console.error("Error al guardar grilla unifiliar:", error);
		}
	}, [obtenerClave]);

	/**
	 * Pintar una celda con el color seleccionado
	 * @param {number} x - Coordenada X de la celda
	 * @param {number} y - Coordenada Y de la celda
	 * @param {boolean} shiftPresionado - Si Shift está presionado para línea recta
	 */
	const pintarCelda = useCallback((x, y, shiftPresionado = false) => {
		let xFinal = x;
		let yFinal = y;

		// Si Shift está presionado, restringir a línea recta
		if (shiftPresionado && puntoInicialRef.current) {
			const { x: xInicial, y: yInicial } = puntoInicialRef.current;
			const deltaX = Math.abs(x - xInicial);
			const deltaY = Math.abs(y - yInicial);

			// Determinar dirección si no está bloqueada
			if (direccionBloqueadaRef.current === null && (deltaX > 1 || deltaY > 1)) {
				direccionBloqueadaRef.current = deltaX > deltaY ? "horizontal" : "vertical";
			}

			// Aplicar restricción según dirección
			if (direccionBloqueadaRef.current === "horizontal") {
				yFinal = yInicial;
			} else if (direccionBloqueadaRef.current === "vertical") {
				xFinal = xInicial;
			}
		}

		const claveCelda = `${xFinal},${yFinal}`;

		setCeldas(prev => {
			let nuevasCeldas;

			if (herramienta === "borrador") {
				// Borrar celda
				nuevasCeldas = { ...prev };
				delete nuevasCeldas[claveCelda];
			} else {
				// Pintar celda con el color seleccionado
				nuevasCeldas = {
					...prev,
					[claveCelda]: colorSeleccionado
				};
			}

			// Guardar inmediatamente (usamos textos actuales)
			setTextos(currentTextos => {
				guardarDatos(nuevasCeldas, currentTextos);
				return currentTextos;
			});
			return nuevasCeldas;
		});
	}, [colorSeleccionado, herramienta, guardarDatos]);

	/**
	 * Limpiar todo el dibujo (celdas y textos)
	 */
	const limpiarTodo = useCallback(() => {
		setCeldas({});
		setTextos([]);
		guardarDatos({}, []);
	}, [guardarDatos]);

	/**
	 * Activar modo edición
	 */
	const activarEdicion = useCallback(() => {
		setModoEdicion(true);
	}, []);

	/**
	 * Desactivar modo edición
	 */
	const desactivarEdicion = useCallback(() => {
		setModoEdicion(false);
		setEstaPintando(false);
	}, []);

	/**
	 * Toggle modo edición
	 */
	const toggleEdicion = useCallback(() => {
		if (modoEdicion) {
			desactivarEdicion();
		} else {
			activarEdicion();
		}
	}, [modoEdicion, activarEdicion, desactivarEdicion]);

	/**
	 * Iniciar pintado (mouse down)
	 * @param {number} x - Coordenada X inicial
	 * @param {number} y - Coordenada Y inicial
	 */
	const iniciarPintado = useCallback((x, y) => {
		setEstaPintando(true);
		// Guardar punto inicial para líneas rectas con Shift
		puntoInicialRef.current = { x, y };
		direccionBloqueadaRef.current = null;
	}, []);

	/**
	 * Detener pintado (mouse up)
	 */
	const detenerPintado = useCallback(() => {
		setEstaPintando(false);
		// Limpiar punto inicial
		puntoInicialRef.current = null;
		direccionBloqueadaRef.current = null;
	}, []);

	/**
	 * Seleccionar herramienta pincel
	 */
	const seleccionarPincel = useCallback(() => {
		setHerramienta("pincel");
	}, []);

	/**
	 * Seleccionar herramienta borrador
	 */
	const seleccionarBorrador = useCallback(() => {
		setHerramienta("borrador");
		setTextoSeleccionadoId(null);
	}, []);

	/**
	 * Seleccionar herramienta texto
	 */
	const seleccionarTexto = useCallback(() => {
		setHerramienta("texto");
	}, []);

	/**
	 * Agregar un nuevo texto
	 * @param {number} x - Coordenada X en píxeles
	 * @param {number} y - Coordenada Y en píxeles
	 * @param {string} contenido - Texto a mostrar
	 */
	const agregarTexto = useCallback((x, y, contenido) => {
		if (!contenido.trim()) return;

		const nuevoTexto = {
			id: `texto-${Date.now()}`,
			x,
			y,
			texto: contenido,
			color: colorSeleccionado,
			fuente: configTexto.fuente,
			tamano: configTexto.tamano,
			negrita: configTexto.negrita,
			cursiva: configTexto.cursiva,
		};

		setTextos(prev => {
			const nuevosTextos = [...prev, nuevoTexto];
			setCeldas(currentCeldas => {
				guardarDatos(currentCeldas, nuevosTextos);
				return currentCeldas;
			});
			return nuevosTextos;
		});
	}, [colorSeleccionado, configTexto, guardarDatos]);

	/**
	 * Actualizar un texto existente
	 */
	const actualizarTexto = useCallback((id, cambios) => {
		setTextos(prev => {
			const nuevosTextos = prev.map(t =>
				t.id === id ? { ...t, ...cambios } : t
			);
			setCeldas(currentCeldas => {
				guardarDatos(currentCeldas, nuevosTextos);
				return currentCeldas;
			});
			return nuevosTextos;
		});
	}, [guardarDatos]);

	/**
	 * Eliminar un texto
	 */
	const eliminarTexto = useCallback((id) => {
		setTextos(prev => {
			const nuevosTextos = prev.filter(t => t.id !== id);
			setCeldas(currentCeldas => {
				guardarDatos(currentCeldas, nuevosTextos);
				return currentCeldas;
			});
			return nuevosTextos;
		});
		setTextoSeleccionadoId(null);
	}, [guardarDatos]);

	/**
	 * Verificar si hay celdas o textos dibujados
	 */
	const tieneDibujo = Object.keys(celdas).length > 0 || textos.length > 0;

	return {
		// Estado
		celdas,
		textos,
		modoEdicion,
		colorSeleccionado,
		herramienta,
		estaPintando,
		tieneDibujo,

		// Configuración de texto
		configTexto,
		setConfigTexto,
		textoSeleccionadoId,
		setTextoSeleccionadoId,

		// Colores y fuentes disponibles
		coloresDisponibles: COLORES_UNIFILAR,
		fuentesDisponibles: FUENTES_DISPONIBLES,
		tamanosDisponibles: TAMANOS_FUENTE,

		// Acciones de edición
		toggleEdicion,
		activarEdicion,
		desactivarEdicion,

		// Acciones de pintado
		pintarCelda,
		limpiarTodo,
		iniciarPintado,
		detenerPintado,

		// Acciones de texto
		agregarTexto,
		actualizarTexto,
		eliminarTexto,

		// Selección de herramientas
		setColorSeleccionado,
		seleccionarPincel,
		seleccionarBorrador,
		seleccionarTexto,
	};
};

export default usarGrillaUnifilar;
