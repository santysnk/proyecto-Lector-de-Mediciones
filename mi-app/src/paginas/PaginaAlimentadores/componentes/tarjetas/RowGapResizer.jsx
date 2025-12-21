// src/paginas/PaginaAlimentadores/componentes/tarjetas/RowGapResizer.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./RowGapResizer.css";

/**
 * Componente que permite ajustar el gap vertical entre filas de tarjetas.
 * Aparece como una línea horizontal con un círculo al hacer hover entre filas.
 *
 * Comportamiento:
 * - Al hacer hover sobre el handle: aparece la barra de gap con el valor actual
 * - Al arrastrar con click izquierdo: ajusta el gap visualmente (movimiento vertical)
 * - Al hacer doble click: se habilita la edición manual del input
 * - Enter o click fuera del input: confirma el valor y oculta la barra
 * - Escape: cancela y oculta la barra
 *
 * @param {number} gap - Gap actual en píxeles
 * @param {function} onGapChange - Callback (nuevoGap)
 * @param {number} rowIndex - Índice de la fila (0 = primera fila, separación del menú)
 */
const RowGapResizer = ({ gap, onGapChange, rowIndex, minGap = 0, maxGap = 400 }) => {
	const [isHovered, setIsHovered] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [inputValue, setInputValue] = useState(gap);
	const inputRef = useRef(null);
	const containerRef = useRef(null);
	const hitboxRef = useRef(null);
	const startYRef = useRef(0);
	const startGapRef = useRef(gap);

	// Actualizar inputValue cuando cambia el gap desde afuera
	useEffect(() => {
		if (!isEditing) {
			setInputValue(gap);
		}
	}, [gap, isEditing]);

	// Detectar clicks fuera del componente para cerrar
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (containerRef.current && !containerRef.current.contains(e.target)) {
				if (!isEditing) {
					setIsHovered(false);
				}
			}
		};

		if (isHovered && !isEditing) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isHovered, isEditing]);

	// ===== DRAG HANDLERS =====
	const handleMouseDown = useCallback((e) => {
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
		startYRef.current = e.clientY;
		startGapRef.current = gap;
	}, [gap]);

	const handleMouseMove = useCallback((e) => {
		if (!isDragging) return;

		const deltaY = e.clientY - startYRef.current;
		// Cada 2px de movimiento = 1px de gap
		const newGap = Math.round(startGapRef.current + deltaY / 2);
		const clampedGap = Math.max(minGap, Math.min(maxGap, newGap));

		onGapChange(clampedGap);
		setInputValue(clampedGap);
	}, [isDragging, minGap, maxGap, onGapChange]);

	const handleMouseUp = useCallback((e) => {
		setIsDragging(false);

		// Verificar si el mouse está fuera del hitbox al soltar
		if (hitboxRef.current) {
			const rect = hitboxRef.current.getBoundingClientRect();
			const mouseX = e.clientX;
			const mouseY = e.clientY;
			const isOutside =
				mouseX < rect.left ||
				mouseX > rect.right ||
				mouseY < rect.top ||
				mouseY > rect.bottom;

			if (isOutside && !isEditing) {
				setIsHovered(false);
			}
		}
	}, [isEditing]);

	// Doble click para activar modo edición
	const handleDoubleClick = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsEditing(true);
		setInputValue(gap);
	}, [gap]);

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

	// ===== INPUT HANDLERS =====
	const handleValueClick = (e) => {
		e.stopPropagation();
		if (!isDragging) {
			setIsEditing(true);
			setInputValue(gap);
		}
	};

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleInputChange = (e) => {
		setInputValue(e.target.value);
	};

	const confirmarValor = () => {
		const numValue = parseInt(inputValue, 10);
		if (!isNaN(numValue)) {
			const clampedGap = Math.max(minGap, Math.min(maxGap, numValue));
			onGapChange(clampedGap);
			setInputValue(clampedGap);
		} else {
			setInputValue(gap);
		}
		setIsEditing(false);
	};

	const handleInputBlur = () => {
		confirmarValor();
		setIsHovered(false);
	};

	const handleInputKeyDown = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			confirmarValor();
			setIsHovered(false);
		} else if (e.key === "Escape") {
			setInputValue(gap);
			setIsEditing(false);
			setIsHovered(false);
		}
	};

	const isActive = isHovered || isDragging || isEditing;

	return (
		<div
			ref={containerRef}
			className={`row-gap-resizer ${isActive ? "row-gap-resizer--active" : ""}`}
			style={{ height: `${gap}px` }}
		>
			<div className="row-gap-resizer__track">
				<div className="row-gap-resizer__handle-wrapper">
					{/* Zona de hitbox invisible */}
					<div
						ref={hitboxRef}
						className="row-gap-resizer__hitbox"
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => !isDragging && !isEditing && setIsHovered(false)}
						onMouseDown={handleMouseDown}
						onDoubleClick={handleDoubleClick}
					/>
					{/* Handle visual */}
					<div
						className={`row-gap-resizer__handle ${isDragging ? "row-gap-resizer__handle--dragging" : ""}`}
						title="Arrastra para ajustar el espaciado vertical"
					>
						<div className="row-gap-resizer__line" />
						<div className="row-gap-resizer__circle" />
						<div className="row-gap-resizer__line" />
					</div>
				</div>

				{isActive && (
					<div className="row-gap-resizer__input-container">
						{isEditing ? (
							<input
								ref={inputRef}
								type="number"
								className="row-gap-resizer__input"
								value={inputValue}
								onChange={handleInputChange}
								onBlur={handleInputBlur}
								onKeyDown={handleInputKeyDown}
								min={minGap}
								max={maxGap}
							/>
						) : (
							<span
								className="row-gap-resizer__value"
								onClick={handleValueClick}
								title="Click para editar"
							>
								{gap}px
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default RowGapResizer;
