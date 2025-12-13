// src/paginas/PaginaAlimentadores/componentes/modales/ColorPickerSimple.jsx
// Componente minimalista de selector de color con picker inline

import React, { useState, useRef, useEffect } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import "./ColorPickerSimple.css";

const ColorPickerSimple = ({ color, onChange, label }) => {
	const [mostrarPicker, setMostrarPicker] = useState(false);
	const [posicion, setPosicion] = useState({ top: 0, left: 0 });
	const [valorHex, setValorHex] = useState(color);
	const pickerRef = useRef(null);
	const buttonRef = useRef(null);

	// Calcular posición del picker al abrirlo
	const abrirPicker = () => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setPosicion({
				top: rect.bottom + 8,
				left: rect.left + rect.width / 2 - 100, // centrado (200px/2 = 100)
			});
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

		if (mostrarPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
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
					onClick={abrirPicker}
				/>
				{mostrarPicker && (
					<div
						ref={pickerRef}
						className="color-picker-simple-popover"
						style={{ top: `${posicion.top}px`, left: `${posicion.left}px` }}
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
					</div>
				)}
			</div>
		</div>
	);
};

export default ColorPickerSimple;
