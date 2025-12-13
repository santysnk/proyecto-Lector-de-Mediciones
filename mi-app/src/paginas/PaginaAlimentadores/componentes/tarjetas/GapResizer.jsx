// src/paginas/PaginaAlimentadores/componentes/tarjetas/GapResizer.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./GapResizer.css";

/**
 * Componente que permite ajustar el gap entre tarjetas.
 * Aparece como una línea con un círculo al hacer hover entre tarjetas.
 *
 * Comportamiento:
 * - Al hacer hover sobre el handle: aparece la barra de gap con el valor actual
 * - Al arrastrar con click izquierdo: ajusta el gap visualmente
 * - Al hacer doble click: se habilita la edición manual del input
 * - Enter o click fuera del input: confirma el valor y oculta la barra
 * - Escape: cancela y oculta la barra
 *
 * @param {number} gap - Gap actual en píxeles
 * @param {function} onGapChange - Callback (nuevoGap)
 */
const GapResizer = ({ gap, onGapChange, minGap = 0, maxGap = 500 }) => {
	const [isHovered, setIsHovered] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isEditing, setIsEditing] = useState(false); // true = input editable
	const [inputValue, setInputValue] = useState(gap);
	const inputRef = useRef(null);
	const containerRef = useRef(null);
	const hitboxRef = useRef(null);
	const startXRef = useRef(0);
	const startGapRef = useRef(gap);

	// Actualizar inputValue cuando cambia el gap desde afuera (pero no durante edición)
	useEffect(() => {
		if (!isEditing) {
			setInputValue(gap);
		}
	}, [gap, isEditing]);

	// Detectar clicks fuera del componente para cerrar
	// NOTA: No cerrar si está en modo edición (solo Enter/Escape cierran)
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (containerRef.current && !containerRef.current.contains(e.target)) {
				// Solo ocultar si NO está editando
				if (!isEditing) {
					setIsHovered(false);
				}
			}
		};

		// Solo escuchar si está activo y no editando
		if (isHovered && !isEditing) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isHovered, isEditing]);

	// ===== DRAG HANDLERS =====
	const handleMouseDown = useCallback((e) => {
		// Solo drag con click izquierdo (button 0)
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();
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

	const handleMouseUp = useCallback((e) => {
		setIsDragging(false);

		// Verificar si el mouse está fuera del hitbox al soltar
		// Si está fuera, ocultar la barra
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
	// Click en el valor para habilitar edición
	const handleValueClick = (e) => {
		e.stopPropagation();
		if (!isDragging) {
			setIsEditing(true);
			setInputValue(gap);
		}
	};

	// Enfocar el input cuando se activa la edición
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
		// Al perder foco (click fuera), confirmar valor y cerrar igual que Enter
		confirmarValor();
		setIsHovered(false);
	};

	const handleInputKeyDown = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			confirmarValor();
			// También ocultar la barra de gap completamente
			setIsHovered(false);
		} else if (e.key === "Escape") {
			setInputValue(gap);
			setIsEditing(false);
			// También ocultar la barra de gap completamente
			setIsHovered(false);
		}
	};

	const isActive = isHovered || isDragging || isEditing;

	return (
		<div
			ref={containerRef}
			className={`gap-resizer ${isActive ? "gap-resizer--active" : ""}`}
			style={{ width: `${gap}px` }}
		>
			{/* Hitbox centrado directamente en el gap-resizer */}
			<div
				ref={hitboxRef}
				className="gap-resizer__hitbox"
				style={{ width: `${Math.min(30, gap)}px` }}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => !isDragging && !isEditing && setIsHovered(false)}
				onMouseDown={handleMouseDown}
				onDoubleClick={handleDoubleClick}
			/>

			{/* Handle visual (solo decorativo, los eventos van al hitbox) */}
			<div
				className={`gap-resizer__handle ${isDragging ? "gap-resizer__handle--dragging" : ""}`}
				title="Arrastra para ajustar el espaciado"
			>
				<div className="gap-resizer__line" />
				<div className="gap-resizer__circle" />
				<div className="gap-resizer__line" />
			</div>

			{isActive && (
				<div className="gap-resizer__input-container">
					{isEditing ? (
						<input
							ref={inputRef}
							type="number"
							className="gap-resizer__input"
							value={inputValue}
							onChange={handleInputChange}
							onBlur={handleInputBlur}
							onKeyDown={handleInputKeyDown}
							min={minGap}
							max={maxGap}
						/>
					) : (
						<span
							className="gap-resizer__value"
							onClick={handleValueClick}
							title="Click para editar"
						>
							{gap}px
						</span>
					)}
				</div>
			)}
		</div>
	);
};

export default GapResizer;
