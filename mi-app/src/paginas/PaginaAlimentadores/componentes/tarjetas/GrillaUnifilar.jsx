// src/paginas/PaginaAlimentadores/componentes/tarjetas/GrillaUnifilar.jsx

import React, { useRef, useEffect, useCallback, useState } from "react";
import { HexColorPicker } from "react-colorful";
import "./GrillaUnifilar.css";

/**
 * Tamaño de cada celda en píxeles
 */
const TAMANO_CELDA = 12;

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
	// Herramienta activa: "pincel", "borrador" o "texto"
	herramienta,
	// ¿Está pintando? (mouse presionado)
	estaPintando,
	// Colores disponibles
	coloresDisponibles,
	// Fuentes y tamaños disponibles
	fuentesDisponibles = [],
	tamanosDisponibles = [],
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
	const [inputTexto, setInputTexto] = useState({ visible: false, x: 0, y: 0, valor: "", editandoId: null });
	// Estado para saber si Shift está presionado
	const [shiftPresionado, setShiftPresionado] = useState(false);
	// Estado para el color picker
	const [mostrarColorPicker, setMostrarColorPicker] = useState(false);
	// Estado para arrastrar texto
	const [arrastrando, setArrastrando] = useState({ activo: false, textoId: null, offsetX: 0, offsetY: 0 });

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
			for (let x = 0; x <= ancho; x += TAMANO_CELDA) {
				ctx.beginPath();
				ctx.moveTo(x + 0.5, 0); // +0.5 para líneas más nítidas
				ctx.lineTo(x + 0.5, alto);
				ctx.stroke();
			}

			// Líneas horizontales
			for (let y = 0; y <= alto; y += TAMANO_CELDA) {
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
				x * TAMANO_CELDA,
				y * TAMANO_CELDA,
				TAMANO_CELDA,
				TAMANO_CELDA
			);
		});

		// Dibujar textos
		textos.forEach((t) => {
			const fontStyle = `${t.cursiva ? "italic " : ""}${t.negrita ? "bold " : ""}${t.tamano}px ${t.fuente}`;
			ctx.font = fontStyle;
			ctx.fillStyle = t.color;
			ctx.textBaseline = "top";
			ctx.fillText(t.texto, t.x, t.y);

			// Si está seleccionado, dibujar borde
			if (modoEdicion && textoSeleccionadoId === t.id) {
				const metrics = ctx.measureText(t.texto);
				ctx.strokeStyle = "#22d3ee";
				ctx.lineWidth = 2;
				ctx.setLineDash([4, 2]);
				ctx.strokeRect(t.x - 2, t.y - 2, metrics.width + 4, t.tamano + 4);
				ctx.setLineDash([]);
			}
		});
	}, [celdas, textos, modoEdicion, dimensiones, textoSeleccionadoId]);

	/**
	 * Obtener coordenadas de celda desde evento de mouse
	 */
	const obtenerCoordenadas = useCallback((e) => {
		const canvas = canvasRef.current;
		if (!canvas) return null;

		const rect = canvas.getBoundingClientRect();
		const x = Math.floor((e.clientX - rect.left) / TAMANO_CELDA);
		const y = Math.floor((e.clientY - rect.top) / TAMANO_CELDA);

		return { x, y };
	}, []);

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
			const metrics = ctx.measureText(t.texto);

			if (
				px >= t.x - 2 &&
				px <= t.x + metrics.width + 2 &&
				py >= t.y - 2 &&
				py <= t.y + t.tamano + 2
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
	 * Mouse down - iniciar pintado, manejar texto, o iniciar arrastre
	 */
	const handleMouseDown = useCallback((e) => {
		if (!modoEdicion) return;
		e.preventDefault();

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
					editandoId: null
				});
			}
		} else {
			const coords = obtenerCoordenadas(e);
			if (coords) {
				onIniciarPintado(coords.x, coords.y);
				onPintarCelda(coords.x, coords.y, shiftPresionado);
			}
		}
	}, [modoEdicion, herramienta, obtenerCoordenadas, obtenerCoordenadasPixel, textoEnPunto, onIniciarPintado, onPintarCelda, onTextoSeleccionadoChange, shiftPresionado]);

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
			// Abrir input para editar el texto
			setInputTexto({
				visible: true,
				x: textoEncontrado.x,
				y: textoEncontrado.y,
				valor: textoEncontrado.texto,
				editandoId: textoEncontrado.id
			});
			onTextoSeleccionadoChange?.(textoEncontrado.id);
		}
	}, [modoEdicion, herramienta, obtenerCoordenadasPixel, textoEnPunto, onTextoSeleccionadoChange]);

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

		if (!estaPintando || herramienta === "texto") return;
		manejarPintado(e);
	}, [modoEdicion, arrastrando, estaPintando, herramienta, obtenerCoordenadasPixel, onActualizarTexto, manejarPintado]);

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
				// Actualizar texto existente
				onActualizarTexto?.(inputTexto.editandoId, { texto: inputTexto.valor });
			} else {
				// Agregar nuevo texto
				onAgregarTexto?.(inputTexto.x, inputTexto.y, inputTexto.valor);
			}
		} else if (inputTexto.editandoId) {
			// Si el texto queda vacío al editar, eliminar
			onEliminarTexto?.(inputTexto.editandoId);
		}
		setInputTexto({ visible: false, x: 0, y: 0, valor: "", editandoId: null });
	}, [inputTexto, onAgregarTexto, onActualizarTexto, onEliminarTexto]);

	/**
	 * Cancelar input de texto
	 */
	const cancelarTexto = useCallback(() => {
		setInputTexto({ visible: false, x: 0, y: 0, valor: "", editandoId: null });
	}, []);

	/**
	 * Manejar teclas en el input de texto
	 */
	const handleInputKeyDown = useCallback((e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			confirmarTexto();
		} else if (e.key === "Escape") {
			cancelarTexto();
		}
	}, [confirmarTexto, cancelarTexto]);

	// Si no hay dibujo y no está en modo edición, no renderizar nada
	if (!modoEdicion && Object.keys(celdas).length === 0 && textos.length === 0) {
		return null;
	}

	// Cursor según herramienta y estado
	const getCursor = () => {
		if (!modoEdicion) return "default";
		if (arrastrando.activo) return "grabbing";
		if (herramienta === "borrador") return "crosshair";
		if (herramienta === "texto") return "text";
		return "cell";
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

			{/* Input flotante para texto */}
			{inputTexto.visible && (
				<div
					className="grilla-unifilar__input-texto"
					style={{ left: inputTexto.x, top: inputTexto.y }}
				>
					<input
						type="text"
						autoFocus
						value={inputTexto.valor}
						onChange={(e) => setInputTexto(prev => ({ ...prev, valor: e.target.value }))}
						onKeyDown={handleInputKeyDown}
						onBlur={confirmarTexto}
						placeholder="Escribir texto..."
						style={{
							fontFamily: configTexto.fuente,
							fontSize: `${configTexto.tamano}px`,
							fontWeight: configTexto.negrita ? "bold" : "normal",
							fontStyle: configTexto.cursiva ? "italic" : "normal",
							color: colorSeleccionado,
						}}
					/>
				</div>
			)}

			{/* Barra de herramientas - solo en modo edición */}
			{modoEdicion && (
				<div className="grilla-unifilar__toolbar">
					{/* Selector de colores */}
					<div className="grilla-unifilar__colores">
						{coloresDisponibles.slice(1).map((c) => (
							<button
								key={c.id}
								type="button"
								className={`grilla-unifilar__color ${colorSeleccionado === c.color ? "grilla-unifilar__color--activo" : ""}`}
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
						{/* Botón multicolor para abrir color picker */}
						<div className="grilla-unifilar__color-picker-wrapper" ref={colorPickerRef}>
							<button
								type="button"
								className="grilla-unifilar__color grilla-unifilar__color--multicolor"
								onClick={() => setMostrarColorPicker(!mostrarColorPicker)}
								title="Elegir color personalizado"
							>
								<div className="grilla-unifilar__color-muestra" style={{ backgroundColor: colorSeleccionado }} />
							</button>
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
									</div>
								</div>
							)}
						</div>
					</div>

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
								className={`grilla-unifilar__btn grilla-unifilar__btn--formato ${configTexto.negrita ? "grilla-unifilar__btn--activo" : ""}`}
								onClick={() => onConfigTextoChange?.({ ...configTexto, negrita: !configTexto.negrita })}
								title="Negrita"
							>
								<strong>B</strong>
							</button>

							{/* Botón cursiva */}
							<button
								type="button"
								className={`grilla-unifilar__btn grilla-unifilar__btn--formato ${configTexto.cursiva ? "grilla-unifilar__btn--activo" : ""}`}
								onClick={() => onConfigTextoChange?.({ ...configTexto, cursiva: !configTexto.cursiva })}
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
