// src/paginas/PaginaAlimentadores/componentes/tarjetas/GrillaUnifilar.jsx

import React, { useRef, useEffect, useCallback, useState } from "react";
import { HexColorPicker } from "react-colorful";
import "./GrillaUnifilar.css";

/**
 * Componente de grilla unifiliar para dibujar diagramas
 *
 * Funciona en dos modos:
 * - Modo edición: grilla visible al frente, permite dibujar
 * - Modo normal: solo muestra el dibujo como fondo transparente
 */
const GrillaUnifilar = ({
	// Estado de las celdas pintadas
	celdas,
	// Textos agregados
	textos = [],
	// ¿Está en modo edición?
	modoEdicion,
	// Color seleccionado para pintar
	colorSeleccionado,
	// Herramienta activa: "pincel", "borrador", "texto" o "balde"
	herramienta,
	// ¿Está pintando? (mouse presionado)
	estaPintando,
	// Colores disponibles
	coloresDisponibles,
	// Fuentes y tamaños disponibles
	fuentesDisponibles = [],
	tamanosDisponibles = [],
	// Grosores de línea
	grosoresDisponibles = [],
	grosorLinea = 12,
	onCambiarGrosor,
	// Configuración de texto actual
	configTexto = {},
	onConfigTextoChange,
	// Texto seleccionado
	textoSeleccionadoId,
	onTextoSeleccionadoChange,
	// Callbacks
	onPintarCelda,
	onIniciarPintado,
	onDetenerPintado,
	onCambiarColor,
	onSeleccionarPincel,
	onSeleccionarBorrador,
	onSeleccionarTexto,
	onSeleccionarBalde,
	onRellenarConectadas,
	onAgregarTexto,
	onActualizarTexto,
	onEliminarTexto,
	onLimpiarTodo,
	onCerrarEdicion,
}) => {
	const canvasRef = useRef(null);
	const contenedorRef = useRef(null);
	const colorPickerRef = useRef(null);
	const [dimensiones, setDimensiones] = useState({ ancho: 0, alto: 0 });
	// Estado para el input de texto (nuevo o edición)
	// valorOriginal guarda el texto antes de editar para poder descartarlo
	const [inputTexto, setInputTexto] = useState({ visible: false, x: 0, y: 0, valor: "", editandoId: null, ancho: 200, alto: 40, valorOriginal: "" });
	// Estado para redimensionar el textarea
	const [redimensionando, setRedimensionando] = useState({ activo: false, handle: null, inicioX: 0, inicioY: 0, anchoInicial: 0, altoInicial: 0 });
	const textareaRef = useRef(null);
	// Estado para saber si Shift está presionado
	const [shiftPresionado, setShiftPresionado] = useState(false);
	// Estado para el color picker
	const [mostrarColorPicker, setMostrarColorPicker] = useState(false);
	// Estado para arrastrar texto
	const [arrastrando, setArrastrando] = useState({ activo: false, textoId: null, offsetX: 0, offsetY: 0 });
	// Estado para saber si el mouse está sobre un texto (para cambiar cursor)
	const [sobreTexto, setSobreTexto] = useState(false);
	// Estado para modo gotero (eyedropper)
	const [modoGotero, setModoGotero] = useState(false);

	/**
	 * Detectar teclas Shift presionadas y Delete para eliminar texto
	 */
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Shift") {
				setShiftPresionado(true);
			}
			// Delete o Backspace para eliminar texto seleccionado
			if ((e.key === "Delete" || e.key === "Backspace") && textoSeleccionadoId && herramienta === "texto" && !inputTexto.visible) {
				e.preventDefault();
				onEliminarTexto?.(textoSeleccionadoId);
			}
		};
		const handleKeyUp = (e) => {
			if (e.key === "Shift") {
				setShiftPresionado(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [textoSeleccionadoId, herramienta, inputTexto.visible, onEliminarTexto]);

	/**
	 * Cerrar color picker al hacer click fuera
	 */
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
				setMostrarColorPicker(false);
			}
		};

		if (mostrarColorPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [mostrarColorPicker]);

	/**
	 * Calcular dimensiones - siempre usa el contenedor padre (para que las coordenadas coincidan)
	 */
	useEffect(() => {
		let resizeObserver = null;
		let timer = null;

		const actualizarDimensiones = () => {
			if (!contenedorRef.current) return;

			// Obtener el contenedor padre (.grilla-con-row-gaps)
			const padre = contenedorRef.current.parentElement;
			if (!padre) return;

			const rect = padre.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				setDimensiones({
					ancho: rect.width,
					alto: rect.height
				});
			}
		};

		// Esperar un frame para que el CSS se aplique
		requestAnimationFrame(actualizarDimensiones);

		// También actualizar después de pequeños delays para asegurar que las dimensiones sean correctas
		timer = setTimeout(actualizarDimensiones, 50);
		const timer2 = setTimeout(actualizarDimensiones, 150);

		// Observar cambios de tamaño del contenedor
		resizeObserver = new ResizeObserver(actualizarDimensiones);
		if (contenedorRef.current?.parentElement) {
			resizeObserver.observe(contenedorRef.current.parentElement);
		}

		window.addEventListener("resize", actualizarDimensiones);

		return () => {
			clearTimeout(timer);
			clearTimeout(timer2);
			if (resizeObserver) resizeObserver.disconnect();
			window.removeEventListener("resize", actualizarDimensiones);
		};
	}, [modoEdicion]); // Re-calcular cuando cambia el modo

	/**
	 * Dibujar el canvas
	 */
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || dimensiones.ancho === 0) return;

		const ctx = canvas.getContext("2d");
		const { ancho, alto } = dimensiones;

		// Ajustar tamaño del canvas
		canvas.width = ancho;
		canvas.height = alto;

		// Limpiar canvas
		ctx.clearRect(0, 0, ancho, alto);

		// Dibujar grilla solo en modo edición
		if (modoEdicion) {
			ctx.strokeStyle = "rgba(148, 163, 184, 0.5)"; // Color más visible
			ctx.lineWidth = 1;

			// Líneas verticales
			for (let x = 0; x <= ancho; x += grosorLinea) {
				ctx.beginPath();
				ctx.moveTo(x + 0.5, 0); // +0.5 para líneas más nítidas
				ctx.lineTo(x + 0.5, alto);
				ctx.stroke();
			}

			// Líneas horizontales
			for (let y = 0; y <= alto; y += grosorLinea) {
				ctx.beginPath();
				ctx.moveTo(0, y + 0.5); // +0.5 para líneas más nítidas
				ctx.lineTo(ancho, y + 0.5);
				ctx.stroke();
			}
		}

		// Dibujar celdas pintadas
		Object.entries(celdas).forEach(([clave, color]) => {
			const [x, y] = clave.split(",").map(Number);
			ctx.fillStyle = color;
			ctx.fillRect(
				x * grosorLinea,
				y * grosorLinea,
				grosorLinea,
				grosorLinea
			);
		});

		// Dibujar textos (con soporte multilínea)
		textos.forEach((t) => {
			const fontStyle = `${t.cursiva ? "italic " : ""}${t.negrita ? "bold " : ""}${t.tamano}px ${t.fuente}`;
			ctx.font = fontStyle;
			ctx.fillStyle = t.color;
			ctx.textBaseline = "top";

			// Dividir texto en líneas
			const lineas = t.texto.split("\n");
			const alturaLinea = t.tamano * 1.2; // 1.2 de line-height
			let anchoMaximo = 0;

			// Dibujar cada línea
			lineas.forEach((linea, index) => {
				ctx.fillText(linea, t.x, t.y + index * alturaLinea);
				const anchoLinea = ctx.measureText(linea).width;
				if (anchoLinea > anchoMaximo) anchoMaximo = anchoLinea;
			});

			// Si está seleccionado, dibujar borde
			if (modoEdicion && textoSeleccionadoId === t.id) {
				const alturaTotal = lineas.length * alturaLinea;
				ctx.strokeStyle = "#22d3ee";
				ctx.lineWidth = 2;
				ctx.setLineDash([4, 2]);
				ctx.strokeRect(t.x - 2, t.y - 2, anchoMaximo + 4, alturaTotal + 4);
				ctx.setLineDash([]);
			}
		});
	}, [celdas, textos, modoEdicion, dimensiones, textoSeleccionadoId, grosorLinea]);

	/**
	 * Obtener coordenadas de celda desde evento de mouse
	 */
	const obtenerCoordenadas = useCallback((e) => {
		const canvas = canvasRef.current;
		if (!canvas) return null;

		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((e.clientX - rect.left) / grosorLinea);
		const y = Math.floor((e.clientY - rect.top) / grosorLinea);

		return { x, y };
	}, [grosorLinea]);

	/**
	 * Obtener coordenadas en píxeles desde evento de mouse
	 */
	const obtenerCoordenadasPixel = useCallback((e) => {
		const canvas = canvasRef.current;
		if (!canvas) return null;

		const rect = canvas.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}, []);

	/**
	 * Verificar si un punto está sobre un texto y devolver el texto
	 * (con soporte para texto multilínea)
	 */
	const textoEnPunto = useCallback((px, py) => {
		const canvas = canvasRef.current;
		if (!canvas) return null;

		const ctx = canvas.getContext("2d");

		// Buscar en orden inverso (los últimos están encima)
		for (let i = textos.length - 1; i >= 0; i--) {
			const t = textos[i];
			const fontStyle = `${t.cursiva ? "italic " : ""}${t.negrita ? "bold " : ""}${t.tamano}px ${t.fuente}`;
			ctx.font = fontStyle;

			// Calcular dimensiones considerando múltiples líneas
			const lineas = t.texto.split("\n");
			const alturaLinea = t.tamano * 1.2;
			let anchoMaximo = 0;
			lineas.forEach(linea => {
				const anchoLinea = ctx.measureText(linea).width;
				if (anchoLinea > anchoMaximo) anchoMaximo = anchoLinea;
			});
			const alturaTotal = lineas.length * alturaLinea;

			if (
				px >= t.x - 2 &&
				px <= t.x + anchoMaximo + 2 &&
				py >= t.y - 2 &&
				py <= t.y + alturaTotal + 2
			) {
				return t;
			}
		}
		return null;
	}, [textos]);

	/**
	 * Manejar click o movimiento con mouse presionado
	 */
	const manejarPintado = useCallback((e) => {
		if (!modoEdicion || herramienta === "texto") return;

		const coords = obtenerCoordenadas(e);
		if (coords) {
			onPintarCelda(coords.x, coords.y, shiftPresionado);
		}
	}, [modoEdicion, herramienta, obtenerCoordenadas, onPintarCelda, shiftPresionado]);

	/**
	 * Capturar color del canvas con el gotero
	 */
	const capturarColorGotero = useCallback((e) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Obtener el color del píxel
		const pixel = ctx.getImageData(x, y, 1, 1).data;

		// Convertir a hex
		const r = pixel[0].toString(16).padStart(2, "0");
		const g = pixel[1].toString(16).padStart(2, "0");
		const b = pixel[2].toString(16).padStart(2, "0");
		const colorHex = `#${r}${g}${b}`;

		// Cambiar el color seleccionado
		onCambiarColor(colorHex);

		// Desactivar modo gotero
		setModoGotero(false);
	}, [onCambiarColor]);

	/**
	 * Mouse down - iniciar pintado, manejar texto, o iniciar arrastre
	 */
	const handleMouseDown = useCallback((e) => {
		if (!modoEdicion) return;
		e.preventDefault();

		// Si el modo gotero está activo, capturar el color
		if (modoGotero) {
			capturarColorGotero(e);
			return;
		}

		if (herramienta === "texto") {
			const coords = obtenerCoordenadasPixel(e);
			if (!coords) return;

			// Verificar si hay un texto en esta posición
			const textoEncontrado = textoEnPunto(coords.x, coords.y);

			if (textoEncontrado) {
				// Seleccionar texto existente e iniciar arrastre
				onTextoSeleccionadoChange?.(textoEncontrado.id);
				setArrastrando({
					activo: true,
					textoId: textoEncontrado.id,
					offsetX: coords.x - textoEncontrado.x,
					offsetY: coords.y - textoEncontrado.y
				});
			} else {
				// Mostrar input para nuevo texto
				onTextoSeleccionadoChange?.(null);
				setInputTexto({
					visible: true,
					x: coords.x,
					y: coords.y,
					valor: "",
					editandoId: null,
					ancho: 200,
					alto: 40,
					valorOriginal: ""
				});
			}
		} else if (herramienta === "balde") {
			// Herramienta balde: rellenar celdas conectadas
			const coords = obtenerCoordenadas(e);
			if (coords) {
				onRellenarConectadas?.(coords.x, coords.y);
			}
		} else {
			// Pincel o borrador
			const coords = obtenerCoordenadas(e);
			if (coords) {
				onIniciarPintado(coords.x, coords.y);
				onPintarCelda(coords.x, coords.y, shiftPresionado);
			}
		}
	}, [modoEdicion, modoGotero, capturarColorGotero, herramienta, obtenerCoordenadas, obtenerCoordenadasPixel, textoEnPunto, onIniciarPintado, onPintarCelda, onRellenarConectadas, onTextoSeleccionadoChange, shiftPresionado]);

	/**
	 * Doble clic - editar texto existente
	 */
	const handleDoubleClick = useCallback((e) => {
		if (!modoEdicion || herramienta !== "texto") return;
		e.preventDefault();

		const coords = obtenerCoordenadasPixel(e);
		if (!coords) return;

		const textoEncontrado = textoEnPunto(coords.x, coords.y);
		if (textoEncontrado) {
			// Cargar el color y configuración del texto en los controles
			onCambiarColor(textoEncontrado.color);
			onConfigTextoChange?.({
				fuente: textoEncontrado.fuente,
				tamano: textoEncontrado.tamano,
				negrita: textoEncontrado.negrita,
				cursiva: textoEncontrado.cursiva,
			});
			// Abrir input para editar el texto - calcular dimensiones según el texto existente
			const canvas = canvasRef.current;
			const ctx = canvas?.getContext("2d");
			let anchoCalculado = 200;
			let altoCalculado = 40;
			if (ctx) {
				const fontStyle = `${textoEncontrado.cursiva ? "italic " : ""}${textoEncontrado.negrita ? "bold " : ""}${textoEncontrado.tamano}px ${textoEncontrado.fuente}`;
				ctx.font = fontStyle;
				const lineas = textoEncontrado.texto.split("\n");
				const alturaLinea = textoEncontrado.tamano * 1.2;
				let anchoMax = 0;
				lineas.forEach(linea => {
					const w = ctx.measureText(linea).width;
					if (w > anchoMax) anchoMax = w;
				});
				anchoCalculado = Math.max(200, anchoMax + 30);
				altoCalculado = Math.max(40, lineas.length * alturaLinea + 20);
			}
			setInputTexto({
				visible: true,
				x: textoEncontrado.x,
				y: textoEncontrado.y,
				valor: textoEncontrado.texto,
				editandoId: textoEncontrado.id,
				ancho: anchoCalculado,
				alto: altoCalculado,
				valorOriginal: textoEncontrado.texto
			});
			onTextoSeleccionadoChange?.(textoEncontrado.id);
		}
	}, [modoEdicion, herramienta, obtenerCoordenadasPixel, textoEnPunto, onTextoSeleccionadoChange, onCambiarColor, onConfigTextoChange]);

	/**
	 * Mouse move - continuar pintado o arrastre de texto
	 */
	const handleMouseMove = useCallback((e) => {
		if (!modoEdicion) return;

		// Mover texto si está arrastrando
		if (arrastrando.activo && arrastrando.textoId) {
			const coords = obtenerCoordenadasPixel(e);
			if (coords) {
				onActualizarTexto?.(arrastrando.textoId, {
					x: coords.x - arrastrando.offsetX,
					y: coords.y - arrastrando.offsetY
				});
			}
			return;
		}

		// Detectar si el mouse está sobre un texto (para cambiar cursor)
		if (herramienta === "texto") {
			const coords = obtenerCoordenadasPixel(e);
			if (coords) {
				const textoEncontrado = textoEnPunto(coords.x, coords.y);
				setSobreTexto(!!textoEncontrado);
			}
		}

		if (!estaPintando || herramienta === "texto") return;
		manejarPintado(e);
	}, [modoEdicion, arrastrando, estaPintando, herramienta, obtenerCoordenadasPixel, onActualizarTexto, manejarPintado, textoEnPunto]);

	/**
	 * Mouse up - detener pintado o arrastre
	 */
	const handleMouseUp = useCallback(() => {
		if (!modoEdicion) return;
		onDetenerPintado();
		setArrastrando({ activo: false, textoId: null, offsetX: 0, offsetY: 0 });
	}, [modoEdicion, onDetenerPintado]);

	/**
	 * Mouse leave - detener pintado si sale del canvas
	 */
	const handleMouseLeave = useCallback(() => {
		if (estaPintando) {
			onDetenerPintado();
		}
		if (arrastrando.activo) {
			setArrastrando({ activo: false, textoId: null, offsetX: 0, offsetY: 0 });
		}
		setSobreTexto(false);
	}, [estaPintando, arrastrando.activo, onDetenerPintado]);

	// Touch events para móvil
	const handleTouchStart = useCallback((e) => {
		if (!modoEdicion || herramienta === "texto") return;
		e.preventDefault();
		const touch = e.touches[0];
		const coords = obtenerCoordenadas({ clientX: touch.clientX, clientY: touch.clientY });
		if (coords) {
			onIniciarPintado(coords.x, coords.y);
			onPintarCelda(coords.x, coords.y, false);
		}
	}, [modoEdicion, herramienta, obtenerCoordenadas, onIniciarPintado, onPintarCelda]);

	const handleTouchMove = useCallback((e) => {
		if (!modoEdicion || !estaPintando || herramienta === "texto") return;
		e.preventDefault();
		const touch = e.touches[0];
		const mouseEvent = { clientX: touch.clientX, clientY: touch.clientY };
		manejarPintado(mouseEvent);
	}, [modoEdicion, estaPintando, herramienta, manejarPintado]);

	const handleTouchEnd = useCallback(() => {
		if (!modoEdicion) return;
		onDetenerPintado();
	}, [modoEdicion, onDetenerPintado]);

	/**
	 * Confirmar texto ingresado (nuevo o editado)
	 */
	const confirmarTexto = useCallback(() => {
		if (inputTexto.valor.trim()) {
			if (inputTexto.editandoId) {
				// Actualizar texto existente - incluir color, fuente, tamaño, negrita y cursiva
				onActualizarTexto?.(inputTexto.editandoId, {
					texto: inputTexto.valor,
					color: colorSeleccionado,
					fuente: configTexto.fuente,
					tamano: configTexto.tamano,
					negrita: configTexto.negrita,
					cursiva: configTexto.cursiva,
				});
			} else {
				// Agregar nuevo texto
				onAgregarTexto?.(inputTexto.x, inputTexto.y, inputTexto.valor);
			}
		} else if (inputTexto.editandoId) {
			// Si el texto queda vacío al editar, eliminar
			onEliminarTexto?.(inputTexto.editandoId);
		}
		setInputTexto({ visible: false, x: 0, y: 0, valor: "", editandoId: null, ancho: 200, alto: 40, valorOriginal: "" });
	}, [inputTexto, colorSeleccionado, configTexto, onAgregarTexto, onActualizarTexto, onEliminarTexto]);

	/**
	 * Cancelar input de texto (para nuevo texto, simplemente cierra)
	 */
	const cancelarTexto = useCallback(() => {
		setInputTexto({ visible: false, x: 0, y: 0, valor: "", editandoId: null, ancho: 200, alto: 40, valorOriginal: "" });
	}, []);

	/**
	 * Descartar cambios y volver al valor original (solo para edición)
	 */
	const descartarCambios = useCallback(() => {
		setInputTexto({ visible: false, x: 0, y: 0, valor: "", editandoId: null, ancho: 200, alto: 40, valorOriginal: "" });
	}, []);

	/**
	 * Eliminar el texto que se está editando
	 */
	const eliminarTextoActual = useCallback(() => {
		if (inputTexto.editandoId) {
			onEliminarTexto?.(inputTexto.editandoId);
		}
		setInputTexto({ visible: false, x: 0, y: 0, valor: "", editandoId: null, ancho: 200, alto: 40, valorOriginal: "" });
	}, [inputTexto.editandoId, onEliminarTexto]);

	/**
	 * Manejar teclas en el textarea de texto
	 * - Enter: confirma el texto
	 * - Alt+Enter: agrega salto de línea
	 * - Escape: cancela
	 */
	const handleInputKeyDown = useCallback((e) => {
		if (e.key === "Enter") {
			if (e.altKey) {
				// Alt+Enter: insertar salto de línea
				e.preventDefault();
				const textarea = e.target;
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const valor = inputTexto.valor;
				const nuevoValor = valor.substring(0, start) + "\n" + valor.substring(end);
				setInputTexto(prev => ({ ...prev, valor: nuevoValor }));
				// Reposicionar cursor después del salto de línea
				setTimeout(() => {
					textarea.selectionStart = textarea.selectionEnd = start + 1;
				}, 0);
			} else {
				// Enter solo: confirmar texto
				e.preventDefault();
				confirmarTexto();
			}
		} else if (e.key === "Escape") {
			cancelarTexto();
		}
	}, [confirmarTexto, cancelarTexto, inputTexto.valor]);

	/**
	 * Manejar cambio de texto en el textarea
	 */
	const handleTextareaInput = useCallback((e) => {
		setInputTexto(prev => ({ ...prev, valor: e.target.value }));
	}, []);

	/**
	 * Iniciar redimensionamiento del textarea
	 */
	const iniciarRedimension = useCallback((e, handle) => {
		e.preventDefault();
		e.stopPropagation();
		setRedimensionando({
			activo: true,
			handle,
			inicioX: e.clientX,
			inicioY: e.clientY,
			anchoInicial: inputTexto.ancho,
			altoInicial: inputTexto.alto,
		});
	}, [inputTexto.ancho, inputTexto.alto]);

	/**
	 * Manejar movimiento durante redimensionamiento
	 */
	useEffect(() => {
		if (!redimensionando.activo) return;

		const handleMouseMove = (e) => {
			const deltaX = e.clientX - redimensionando.inicioX;
			const deltaY = e.clientY - redimensionando.inicioY;
			const handle = redimensionando.handle;

			let nuevoAncho = redimensionando.anchoInicial;
			let nuevoAlto = redimensionando.altoInicial;

			// Calcular nuevo tamaño según el handle
			if (handle.includes("e")) nuevoAncho = Math.max(100, redimensionando.anchoInicial + deltaX);
			if (handle.includes("w")) nuevoAncho = Math.max(100, redimensionando.anchoInicial - deltaX);
			if (handle.includes("s")) nuevoAlto = Math.max(30, redimensionando.altoInicial + deltaY);
			if (handle.includes("n")) nuevoAlto = Math.max(30, redimensionando.altoInicial - deltaY);

			setInputTexto(prev => ({ ...prev, ancho: nuevoAncho, alto: nuevoAlto }));
		};

		const handleMouseUp = () => {
			setRedimensionando({ activo: false, handle: null, inicioX: 0, inicioY: 0, anchoInicial: 0, altoInicial: 0 });
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [redimensionando]);

	// Si no hay dibujo y no está en modo edición, no renderizar nada
	if (!modoEdicion && Object.keys(celdas).length === 0 && textos.length === 0) {
		return null;
	}

	// Cursor según herramienta y estado
	const getCursor = () => {
		if (!modoEdicion) return "default";
		// Si el modo gotero está activo, mostrar cursor de cuentagotas
		if (modoGotero) return "crosshair";
		if (arrastrando.activo) return "grabbing";
		if (herramienta === "borrador") return "crosshair";
		if (herramienta === "balde") return "crosshair";
		if (herramienta === "texto") {
			// Mostrar manito si está sobre un texto existente
			if (sobreTexto) return "grab";
			return "text";
		}
		// Pincel usa el mismo cursor que borrador (crosshair)
		return "crosshair";
	};

	return (
		<div
			ref={contenedorRef}
			className={`grilla-unifilar ${modoEdicion ? "grilla-unifilar--editando" : "grilla-unifilar--fondo"}`}
		>
			<canvas
				ref={canvasRef}
				className="grilla-unifilar__canvas"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				onDoubleClick={handleDoubleClick}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				style={{ cursor: getCursor() }}
			/>

			{/* Textarea flotante redimensionable para texto */}
			{inputTexto.visible && (
				<div
					className="grilla-unifilar__input-texto"
					style={{ left: inputTexto.x, top: inputTexto.y }}
				>
					<div className="grilla-unifilar__input-wrapper">
						<div
							className="grilla-unifilar__textarea-container"
							style={{ width: inputTexto.ancho, height: inputTexto.alto }}
						>
							<textarea
								ref={textareaRef}
								autoFocus
								value={inputTexto.valor}
								onChange={handleTextareaInput}
								onKeyDown={handleInputKeyDown}
								placeholder="Escribir texto... (Alt+Enter para nueva línea)"
								style={{
									fontFamily: configTexto.fuente,
									fontSize: `${configTexto.tamano}px`,
									fontWeight: configTexto.negrita ? "bold" : "normal",
									fontStyle: configTexto.cursiva ? "italic" : "normal",
									color: colorSeleccionado,
								}}
							/>
							{/* Handles de redimensionamiento - Esquinas */}
							<div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--nw" onMouseDown={(e) => iniciarRedimension(e, "nw")} />
							<div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--ne" onMouseDown={(e) => iniciarRedimension(e, "ne")} />
							<div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--sw" onMouseDown={(e) => iniciarRedimension(e, "sw")} />
							<div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--se" onMouseDown={(e) => iniciarRedimension(e, "se")} />
							{/* Handles de redimensionamiento - Lados */}
							<div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--n" onMouseDown={(e) => iniciarRedimension(e, "n")} />
							<div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--s" onMouseDown={(e) => iniciarRedimension(e, "s")} />
							<div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--e" onMouseDown={(e) => iniciarRedimension(e, "e")} />
							<div className="grilla-unifilar__resize-handle grilla-unifilar__resize-handle--w" onMouseDown={(e) => iniciarRedimension(e, "w")} />
						</div>
						{/* Botones de acción */}
						<div className="grilla-unifilar__input-acciones">
							{/* Aceptar */}
							<button
								type="button"
								className="grilla-unifilar__input-btn grilla-unifilar__input-btn--aceptar"
								onClick={confirmarTexto}
								title="Aceptar (Enter)"
							>
								<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
									<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
								</svg>
							</button>
							{/* Descartar - solo si está editando */}
							<button
								type="button"
								className={`grilla-unifilar__input-btn grilla-unifilar__input-btn--descartar ${!inputTexto.editandoId ? "grilla-unifilar__input-btn--disabled" : ""}`}
								onClick={descartarCambios}
								disabled={!inputTexto.editandoId}
								title="Descartar cambios (Esc)"
							>
								<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
									<path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
								</svg>
							</button>
							{/* Eliminar - solo si está editando */}
							<button
								type="button"
								className={`grilla-unifilar__input-btn grilla-unifilar__input-btn--eliminar ${!inputTexto.editandoId ? "grilla-unifilar__input-btn--disabled" : ""}`}
								onClick={eliminarTextoActual}
								disabled={!inputTexto.editandoId}
								title="Eliminar texto"
							>
								<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
									<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Barra de herramientas - solo en modo edición */}
			{modoEdicion && (
				<div className="grilla-unifilar__toolbar">
					{/* Selector de colores */}
					<div className="grilla-unifilar__colores">
						{coloresDisponibles.map((c) => (
							<button
								key={c.id}
								type="button"
								className={`grilla-unifilar__color ${colorSeleccionado === c.color ? "grilla-unifilar__color--activo" : ""} ${c.id === "negro" ? "grilla-unifilar__color--negro" : ""}`}
								style={{ backgroundColor: c.color }}
								onClick={() => {
									onCambiarColor(c.color);
									if (herramienta !== "texto") {
										onSeleccionarPincel();
									}
								}}
								title={c.nombre}
							/>
						))}
						{/* Botón para abrir color picker - muestra el color seleccionado */}
						<div className="grilla-unifilar__color-picker-wrapper" ref={colorPickerRef}>
							<button
								type="button"
								className="grilla-unifilar__color grilla-unifilar__color--picker"
								style={{ backgroundColor: colorSeleccionado }}
								onClick={() => setMostrarColorPicker(!mostrarColorPicker)}
								title="Elegir color personalizado"
							></button>
							{mostrarColorPicker && (
								<div className="grilla-unifilar__color-picker-popover">
									<HexColorPicker
										color={colorSeleccionado}
										onChange={(color) => {
											onCambiarColor(color);
											if (herramienta !== "texto") {
												onSeleccionarPincel();
											}
										}}
									/>
									<div className="grilla-unifilar__color-picker-hex">
										<input
											type="text"
											value={colorSeleccionado}
											onChange={(e) => {
												const val = e.target.value;
												if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
													onCambiarColor(val);
												}
											}}
											maxLength={7}
										/>
										<button
											type="button"
											className={`grilla-unifilar__btn-gotero ${modoGotero ? "grilla-unifilar__btn-gotero--activo" : ""}`}
											onClick={() => {
												setModoGotero(!modoGotero);
												setMostrarColorPicker(false);
											}}
											title="Gotero - clic en el canvas para copiar color"
										>
											<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
												<path d="M20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-3.12 3.12-1.41-1.41-1.42 1.42 1.41 1.41-7.83 7.83a2 2 0 00-.59 1.42V19h2.83c.53 0 1.04-.21 1.42-.59l7.83-7.83 1.41 1.41 1.42-1.42-1.41-1.41 3.12-3.12a1 1 0 00.09-1.41zM6.41 18H5v-1.41l7.83-7.83 1.41 1.41L6.41 18z"/>
											</svg>
										</button>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Selector de grosor de línea */}
					<select
						className="grilla-unifilar__select grilla-unifilar__select--grosor"
						value={grosorLinea}
						onChange={(e) => onCambiarGrosor?.(Number(e.target.value))}
						title="Grosor de línea"
					>
						{grosoresDisponibles.map((g) => (
							<option key={g.id} value={g.valor}>
								{g.nombre}
							</option>
						))}
					</select>

					{/* Herramientas */}
					<div className="grilla-unifilar__herramientas">
						<button
							type="button"
							className={`grilla-unifilar__btn ${herramienta === "pincel" ? "grilla-unifilar__btn--activo" : ""}`}
							onClick={onSeleccionarPincel}
							title="Pincel (mantener Shift para línea recta)"
						>
							<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
								<path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z"/>
							</svg>
						</button>
						<button
							type="button"
							className={`grilla-unifilar__btn ${herramienta === "borrador" ? "grilla-unifilar__btn--activo" : ""}`}
							onClick={onSeleccionarBorrador}
							title="Borrador"
						>
							<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
								<path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83l3.85 3.85c.39.39.9.59 1.41.59h8.48c.53 0 1.04-.21 1.41-.59l3.67-3.67c.78-.78.78-2.05 0-2.83L12.56 3.59C12.17 3.2 11.66 3 11.14 3h4zm-9.71 18H8.3l8.57-8.57-2.83-2.83L5.43 18.17l-.01 2.83z"/>
							</svg>
						</button>
						<button
							type="button"
							className={`grilla-unifilar__btn ${herramienta === "balde" ? "grilla-unifilar__btn--activo" : ""}`}
							onClick={onSeleccionarBalde}
							title="Balde de pintura (cambiar color de líneas conectadas)"
						>
							<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
								<path d="M19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5zM5.21 10L10 5.21 14.79 10H5.21zM16.56 8.94L10 2.38 3.44 8.94c-.59.59-.59 1.54 0 2.12l6.56 6.56c.59.59 1.54.59 2.12 0l6.44-6.44c.59-.59.59-1.54 0-2.12l-.12-.12z"/>
							</svg>
						</button>
						<button
							type="button"
							className={`grilla-unifilar__btn ${herramienta === "texto" ? "grilla-unifilar__btn--activo" : ""}`}
							onClick={onSeleccionarTexto}
							title="Texto (doble clic para editar, arrastrar para mover)"
						>
							<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
								<path d="M5 4v3h5.5v12h3V7H19V4H5z"/>
							</svg>
						</button>
						<button
							type="button"
							className="grilla-unifilar__btn grilla-unifilar__btn--peligro"
							onClick={onLimpiarTodo}
							title="Limpiar todo"
						>
							<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
								<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
							</svg>
						</button>
					</div>

					{/* Opciones de texto - solo si herramienta es texto */}
					{herramienta === "texto" && (
						<div className="grilla-unifilar__texto-opciones">
							{/* Selector de fuente */}
							<select
								className="grilla-unifilar__select"
								value={configTexto.fuente}
								onChange={(e) => onConfigTextoChange?.({ ...configTexto, fuente: e.target.value })}
								title="Fuente"
							>
								{fuentesDisponibles.map((f) => (
									<option key={f.id} value={f.familia}>
										{f.nombre}
									</option>
								))}
							</select>

							{/* Selector de tamaño */}
							<select
								className="grilla-unifilar__select grilla-unifilar__select--tamano"
								value={configTexto.tamano}
								onChange={(e) => onConfigTextoChange?.({ ...configTexto, tamano: Number(e.target.value) })}
								title="Tamaño"
							>
								{tamanosDisponibles.map((t) => (
									<option key={t} value={t}>
										{t}px
									</option>
								))}
							</select>

							{/* Botón negrita */}
							<button
								type="button"
								className={`grilla-unifilar__btn grilla-unifilar__btn--formato ${
									configTexto.negrita ? "grilla-unifilar__btn--activo" : ""
								}`}
								onClick={() => {
									// Si hay textarea abierto (editando o creando), cambiar configTexto
									if (inputTexto.visible) {
										onConfigTextoChange?.({ ...configTexto, negrita: !configTexto.negrita });
									} else if (textoSeleccionadoId) {
										// Si hay un texto seleccionado sin textarea, actualizarlo directamente
										const textoActual = textos.find(t => t.id === textoSeleccionadoId);
										if (textoActual) {
											onActualizarTexto?.(textoSeleccionadoId, { negrita: !textoActual.negrita });
										}
									} else {
										// Cambiar config para el próximo texto
										onConfigTextoChange?.({ ...configTexto, negrita: !configTexto.negrita });
									}
								}}
								title="Negrita"
							>
								<strong>B</strong>
							</button>

							{/* Botón cursiva */}
							<button
								type="button"
								className={`grilla-unifilar__btn grilla-unifilar__btn--formato ${
									configTexto.cursiva ? "grilla-unifilar__btn--activo" : ""
								}`}
								onClick={() => {
									// Si hay textarea abierto (editando o creando), cambiar configTexto
									if (inputTexto.visible) {
										onConfigTextoChange?.({ ...configTexto, cursiva: !configTexto.cursiva });
									} else if (textoSeleccionadoId) {
										// Si hay un texto seleccionado sin textarea, actualizarlo directamente
										const textoActual = textos.find(t => t.id === textoSeleccionadoId);
										if (textoActual) {
											onActualizarTexto?.(textoSeleccionadoId, { cursiva: !textoActual.cursiva });
										}
									} else {
										// Cambiar config para el próximo texto
										onConfigTextoChange?.({ ...configTexto, cursiva: !configTexto.cursiva });
									}
								}}
								title="Cursiva"
							>
								<em>I</em>
							</button>

							{/* Eliminar texto seleccionado */}
							{textoSeleccionadoId && (
								<button
									type="button"
									className="grilla-unifilar__btn grilla-unifilar__btn--peligro"
									onClick={() => onEliminarTexto?.(textoSeleccionadoId)}
									title="Eliminar texto (Delete)"
								>
									<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
										<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
									</svg>
								</button>
							)}
						</div>
					)}

					{/* Indicador de Shift */}
					{herramienta === "pincel" && shiftPresionado && (
						<div className="grilla-unifilar__shift-indicator">
							Línea recta
						</div>
					)}

					{/* Botón cerrar */}
					<button
						type="button"
						className="grilla-unifilar__btn grilla-unifilar__btn--cerrar"
						onClick={onCerrarEdicion}
						title="Finalizar edición"
					>
						<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
							<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
						</svg>
						<span>Listo</span>
					</button>
				</div>
			)}
		</div>
	);
};

export default GrillaUnifilar;
