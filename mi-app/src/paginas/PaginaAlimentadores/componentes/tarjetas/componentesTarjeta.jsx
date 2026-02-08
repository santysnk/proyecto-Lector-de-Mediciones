// src/paginas/PaginaAlimentadores/componentes/tarjetas/componentesTarjeta.jsx
// Helper y sub-componentes auxiliares de TarjetaAlimentador

import React from "react";

/**
 * Prepara la estructura de un lado de la tarjeta (sup/inf)
 */
export const construirLado = (side, tituloDefault) => {
	const cajasPorDefecto = ["R", "S", "T"].map((label) => ({
		etiqueta: label,
		valor: "--,--",
		enabled: false,
		origen: null,
	}));

	if (!side) {
		return {
			titulo: tituloDefault,
			boxes: cajasPorDefecto,
			oculto: false,
		};
	}

	const titulo = (side.titulo && String(side.titulo).trim()) || tituloDefault;
	const oculto = !!side.oculto;

	let boxes = Array.isArray(side.boxes) ? side.boxes : [];
	boxes = boxes.slice(0, 4);

	if (boxes.length === 0) {
		boxes = cajasPorDefecto;
	} else {
		boxes = boxes.map((b, idx) => ({
			etiqueta: (b?.etiqueta && String(b.etiqueta).trim()) || `Box ${idx + 1}`,
			valor: b?.valor == null || b.valor === "" ? "--,--" : String(b.valor),
			enabled: !!b?.enabled,
			origen: b?.origen || null,
		}));
	}

	return { titulo, boxes, oculto };
};

/**
 * Barra de progreso de polling animada
 */
export const BarraProgresoPolling = ({ cicloPolling, periodoPolling }) => (
	<div className="alim-card-progress-track" key={cicloPolling}>
		<div
			className="alim-card-progress-fill"
			style={{ "--progress-duration": `${periodoPolling}s` }}
		>
			<div className="alim-card-progress-spark" />
		</div>
	</div>
);

/**
 * Overlay de error crítico
 */
export const OverlayError = () => (
	<div className="alim-card-error-overlay alim-card-error-overlay--parpadeo">
		<div className="alim-card-error-content">
			<span className="alim-card-error-icon">⚠</span>
			<span className="alim-card-error-title">ATENCIÓN</span>
			<span className="alim-card-error-message">Posiblemente fuera de servicio</span>
			<span className="alim-card-error-detail">
				Las últimas 3 lecturas no fueron válidas o dieron error
			</span>
		</div>
	</div>
);

/**
 * Botón de escala (triángulo)
 */
export const BotonEscala = ({ triangleRef, escala, escalaModificada, onClick }) => (
	<button
		ref={triangleRef}
		type="button"
		className={`alim-card-scale-btn${escalaModificada ? " alim-card-scale-btn--active" : ""}`}
		onClick={onClick}
		title={`Escala: ${escala}x (click para cambiar)`}
	>
		<span className="alim-card-scale-triangle">▼</span>
		{escalaModificada && <span className="alim-card-scale-value">{escala}x</span>}
	</button>
);
