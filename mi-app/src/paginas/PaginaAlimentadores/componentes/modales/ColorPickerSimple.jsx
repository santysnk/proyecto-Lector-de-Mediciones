// src/paginas/PaginaAlimentadores/componentes/modales/ColorPickerSimple.jsx
// Componente minimalista de selector de color con picker inline

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker, HexColorInput } from "react-colorful";
import "./ColorPickerSimple.css";

const ColorPickerSimple = ({ color, onChange, label, posicionArriba = false }) => {
	const [mostrarPicker, setMostrarPicker] = useState(false);
	const [posicion, setPosicion] = useState({ top: 0, left: 0 });
	const [valorHex, setValorHex] = useState(color);
	const pickerRef = useRef(null);
	const buttonRef = useRef(null);

	// Calcular posición del picker al abrirlo/cerrarlo (toggle)
	const togglePicker = (e) => {
		e.stopPropagation();

		// Si ya está abierto, cerrarlo
		if (mostrarPicker) {
			setMostrarPicker(false);
			return;
		}

		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			// Altura aproximada del popover (picker + input hex)
			const alturaPopover = 260;
			const anchoPopover = 240;

			// Calcular posición vertical
			let top;
			if (posicionArriba) {
				top = rect.top - alturaPopover - 8;
				// Si no cabe arriba, mostrar abajo
				if (top < 10) {
					top = rect.bottom + 8;
				}
			} else {
				top = rect.bottom + 8;
				// Si no cabe abajo, mostrar arriba
				if (top + alturaPopover > window.innerHeight - 10) {
					top = rect.top - alturaPopover - 8;
				}
			}

			// Calcular posición horizontal centrada
			let left = rect.left + rect.width / 2 - anchoPopover / 2;
			// Asegurar que no se salga por la izquierda
			if (left < 10) {
				left = 10;
			}
			// Asegurar que no se salga por la derecha
			if (left + anchoPopover > window.innerWidth - 10) {
				left = window.innerWidth - anchoPopover - 10;
			}

			setPosicion({ top, left });
			setMostrarPicker(true);
		}
	};

	// Actualizar valor hex cuando cambia el color desde el picker
	const handleColorChange = (nuevoColor) => {
		setValorHex(nuevoColor);
		onChange(nuevoColor);
	};

	// Manejar cambio en el input de texto
	const handleInputChange = (e) => {
		const valor = e.target.value;
		setValorHex(valor);

		// Validar que sea un color hex válido antes de notificar al padre
		if (/^#[0-9A-Fa-f]{6}$/.test(valor)) {
			onChange(valor);
		}
	};

	// Copiar al portapapeles
	const copiarColor = () => {
		navigator.clipboard.writeText(valorHex);
	};

	// Cerrar el picker al hacer click fuera
	useEffect(() => {
		if (!mostrarPicker) return;

		const handleClickOutside = (event) => {
			if (
				pickerRef.current &&
				!pickerRef.current.contains(event.target) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target)
			) {
				setMostrarPicker(false);
			}
		};

		// Agregar listener después de un pequeño delay para evitar que el mismo click que abre el picker lo cierre
		const timeoutId = setTimeout(() => {
			document.addEventListener("mousedown", handleClickOutside);
		}, 10);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [mostrarPicker]);

	return (
		<div className="color-picker-simple">
			<span className="color-picker-simple-label">{label}</span>
			<div className="color-picker-simple-wrapper">
				<button
					ref={buttonRef}
					type="button"
					className="color-picker-simple-button"
					style={{ backgroundColor: color }}
					onClick={togglePicker}
				/>
				{mostrarPicker &&
					createPortal(
						<div
							ref={pickerRef}
							className="color-picker-simple-popover"
							style={{ top: `${posicion.top}px`, left: `${posicion.left}px` }}
							onClick={(e) => e.stopPropagation()}
							onMouseDown={(e) => e.stopPropagation()}
						>
							<HexColorPicker color={color} onChange={handleColorChange} />
							<div className="color-picker-hex-input-wrapper">
								<input
									type="text"
									value={valorHex}
									onChange={handleInputChange}
									className="color-picker-hex-input"
									placeholder="#000000"
									maxLength={7}
								/>
								<button
									type="button"
									className="color-picker-copy-btn"
									onClick={copiarColor}
									title="Copiar color"
								>
									📋
								</button>
							</div>
						</div>,
						document.body
					)}
			</div>
		</div>
	);
};

export default ColorPickerSimple;
