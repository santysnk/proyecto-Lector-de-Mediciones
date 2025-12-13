// src/paginas/PaginaAlimentadores/componentes/tarjetas/SkeletonCard.jsx
// Componente skeleton (esqueleto) que se muestra mientras se carga/guarda un alimentador

import React from "react";
import "./SkeletonCard.css";

const SkeletonCard = () => {
	return (
		<div className="skeleton-card">
			{/* Header de la tarjeta - botones a la izquierda, título a la derecha */}
			<div className="skeleton-header">
				<div className="skeleton-buttons">
					<div className="skeleton-button-square"></div>
					<div className="skeleton-button-square"></div>
				</div>
				<div className="skeleton-title"></div>
			</div>

			{/* Parte superior (ej: Corriente) */}
			<div className="skeleton-section">
				<div className="skeleton-section-title"></div>
				<div className="skeleton-boxes">
					<div className="skeleton-box">
						<div className="skeleton-label"></div>
						<div className="skeleton-value"></div>
					</div>
					<div className="skeleton-box">
						<div className="skeleton-label"></div>
						<div className="skeleton-value"></div>
					</div>
					<div className="skeleton-box">
						<div className="skeleton-label"></div>
						<div className="skeleton-value"></div>
					</div>
				</div>
			</div>

			{/* Parte inferior (ej: Tensión) */}
			<div className="skeleton-section">
				<div className="skeleton-section-title"></div>
				<div className="skeleton-boxes">
					<div className="skeleton-box">
						<div className="skeleton-label"></div>
						<div className="skeleton-value"></div>
					</div>
					<div className="skeleton-box">
						<div className="skeleton-label"></div>
						<div className="skeleton-value"></div>
					</div>
					<div className="skeleton-box">
						<div className="skeleton-label"></div>
						<div className="skeleton-value"></div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SkeletonCard;
