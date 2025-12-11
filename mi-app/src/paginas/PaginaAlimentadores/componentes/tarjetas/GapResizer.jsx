// src/paginas/PaginaAlimentadores/componentes/tarjetas/GapResizer.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./GapResizer.css";

/**
 * Componente que permite ajustar el gap entre tarjetas.
 * Aparece como una línea con un círculo al hacer hover entre tarjetas.
 * Se puede arrastrar para ajustar el espaciado o escribir un valor manualmente.
 *
 * @param {number} gap - Gap actual en píxeles
 * @param {function} onGapChange - Callback (nuevoGap)
 */
const GapResizer = ({ gap, onGapChange, minGap = 0, maxGap = 500 }) => {
	const [isHovered, setIsHovered] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [showInput, setShowInput] = useState(false);
	const [inputValue, setInputValue] = useState(gap);
	const handleRef = useRef(null);
	const startXRef = useRef(0);
	const startGapRef = useRef(gap);

	// Actualizar inputValue cuando cambia el gap desde afuera
	useEffect(() => {
		if (!isDragging) {
			setInputValue(gap);
		}
	}, [gap, isDragging]);

	const handleMouseDown = useCallback((e) => {
		e.preventDefault();
		setIsDragging(true);
		startXRef.current = e.clientX;
		startGapRef.current = gap;
	}, [gap]);

	const handleMouseMove = useCallback((e) => {
		if (!isDragging) return;

		const deltaX = e.clientX - startXRef.current;
		// Cada 2px de movimiento = 1px de gap
		const newGap = Math.round(startGapRef.current + deltaX / 2);
		const clampedGap = Math.max(minGap, Math.min(maxGap, newGap));

		onGapChange(clampedGap);
		setInputValue(clampedGap);
	}, [isDragging, minGap, maxGap, onGapChange]);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Agregar/remover listeners globales para el drag
	useEffect(() => {
		if (isDragging) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		}
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, handleMouseMove, handleMouseUp]);

	const handleInputChange = (e) => {
		const value = e.target.value;
		setInputValue(value);
	};

	const handleInputBlur = () => {
		const numValue = parseInt(inputValue, 10);
		if (!isNaN(numValue)) {
			const clampedGap = Math.max(minGap, Math.min(maxGap, numValue));
			onGapChange(clampedGap);
			setInputValue(clampedGap);
		} else {
			setInputValue(gap);
		}
		setShowInput(false);
	};

	const handleInputKeyDown = (e) => {
		if (e.key === "Enter") {
			handleInputBlur();
		} else if (e.key === "Escape") {
			setInputValue(gap);
			setShowInput(false);
		}
	};

	const handleHandleClick = () => {
		if (!isDragging) {
			setShowInput(true);
		}
	};

	const isActive = isHovered || isDragging || showInput;

	return (
		<div
			className={`gap-resizer ${isActive ? "gap-resizer--active" : ""}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => !isDragging && !showInput && setIsHovered(false)}
			style={{ width: `${gap}px` }}
		>
			<div className="gap-resizer__track">
				<div
					ref={handleRef}
					className={`gap-resizer__handle ${isDragging ? "gap-resizer__handle--dragging" : ""}`}
					onMouseDown={handleMouseDown}
					onClick={handleHandleClick}
					title="Arrastra para ajustar el espaciado"
				>
					<div className="gap-resizer__line" />
					<div className="gap-resizer__circle" />
					<div className="gap-resizer__line" />
				</div>

				{(isActive || showInput) && (
					<div className="gap-resizer__input-container">
						{showInput ? (
							<input
								type="number"
								className="gap-resizer__input"
								value={inputValue}
								onChange={handleInputChange}
								onBlur={handleInputBlur}
								onKeyDown={handleInputKeyDown}
								min={minGap}
								max={maxGap}
								autoFocus
							/>
						) : (
							<span className="gap-resizer__value">{gap}px</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default GapResizer;
