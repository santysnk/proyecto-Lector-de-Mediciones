import React, { useState, useEffect } from "react";
import "./TarjetaAlimentador.css";
import configIcon from "../../../../assets/imagenes/Config_Icon.png";
import mapIcon from "../../../../assets/imagenes/Mapeo_icon.png";

const TarjetaAlimentador = ({
	nombre,
	color,
	onConfigClick,
	onMapClick,
	topSide,
	bottomSide,
	draggable = false,
	isDragging = false,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,

	// NUEVO: info de mediciones y períodos
	mideRele = false,
	mideAnalizador = false,
	periodoRele = 60,
	periodoAnalizador = 60,
	timestampInicioRele = null,
	timestampInicioAnalizador = null,
}) => {
	// Estado para forzar actualización de delays cuando cambian las mediciones
	const [animationKey, setAnimationKey] = useState(0);

	// Recalcular key cuando cambian los timestamps o estados de medición
	useEffect(() => {
		setAnimationKey(prev => prev + 1);
	}, [timestampInicioRele, timestampInicioAnalizador, mideRele, mideAnalizador]);

	// ===== Helpers para armar cada lado de la tarjeta =====
	const buildSideDisplay = (side, tituloDefault) => {
		// Si todavía no hay lecturas / mapeo, mantenemos el comportamiento viejo:
		// título fijo y 3 boxes R, S, T con "--,--"
		const defaultBoxes = ["R", "S", "T"].map((label) => ({
			etiqueta: label,
			valor: "--,--",
			enabled: false,
			origen: null,
		}));

		if (!side) {
			return {
				titulo: tituloDefault,
				boxes: defaultBoxes,
			};
		}

		const titulo =
			(side.titulo && String(side.titulo).trim()) || tituloDefault;

		let boxes = Array.isArray(side.boxes) ? side.boxes : [];

		// Limitamos a 4 como máximo
		boxes = boxes.slice(0, 4);

		// Si por alguna razón no hay boxes, usamos los defaults
		if (boxes.length === 0) {
			boxes = defaultBoxes;
		} else {
			// Normalizamos cada box: etiqueta, valor
			// y preservamos enabled / origen
			boxes = boxes.map((b, idx) => ({
				etiqueta:
					(b?.etiqueta && String(b.etiqueta).trim()) || `Box ${idx + 1}`,
				valor:
					b?.valor == null || b.valor === "" ? "--,--" : String(b.valor),
				enabled: !!b?.enabled,
				origen: b?.origen || null,
			}));
		}

		return { titulo, boxes };
	};

	const sup = buildSideDisplay(topSide, "CONSUMO (A)");
	const inf = buildSideDisplay(bottomSide, "TENSIÓN (kV)");

	// detectar si algún lado tiene 4 boxes
	const maxBoxes = Math.max(sup.boxes.length, inf.boxes.length);
	const isWide = maxBoxes >= 4;

	// armar clases de la card
	const clasesCard = ["alim-card"];
	if (isWide) clasesCard.push("alim-card-wide");
	if (isDragging) clasesCard.push("alim-card-dragging");

	// Helper para calcular el delay de animación
	const calcularAnimationDelay = (timestamp, periodo) => {
		if (!timestamp) return 0;

		const ahora = Date.now();
		const tiempoTranscurrido = ahora - timestamp; // en milisegundos
		const tiempoEnCiclo = tiempoTranscurrido % (periodo * 1000); // posición en el ciclo actual
		return -(tiempoEnCiclo / 1000); // delay negativo en segundos
	};

	return (
		<div
			className={clasesCard.join(" ")}
			style={{ cursor: draggable ? "grab" : "default" }}
			draggable={draggable}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDrop={onDrop}
			onDragEnd={onDragEnd}
		>
			{/* Header con nombre y botones */}
			<div
				className="alim-card-header"
				style={{ backgroundColor: color || "#0ea5e9" }}
			>
				<div className="alim-card-icons">
					<button
						type="button"
						className="alim-card-icon-btn"
						onClick={onConfigClick}
						title="Configurar registrador"
					>
						<img
							src={configIcon}
							alt="Configurar"
							className="alim-card-icon"
						/>
					</button>

					<button
						type="button"
						className="alim-card-icon-btn alim-card-map-btn"
						onClick={onMapClick}
						title="Mapeo"
					>
						<img src={mapIcon} alt="Mapeo" className="alim-card-icon" />
					</button>
				</div>

				<span className="alim-card-title">{nombre}</span>
			</div>

			{/* Cuerpo con los 2 bloques (superior / inferior) */}
			<div className="alim-card-body">
				{/* ===== PARTE SUPERIOR ===== */}
				<div className="alim-card-section">
					<h3 className="alim-card-section-title">{sup.titulo}</h3>
					<div className="alim-card-meters">
						{sup.boxes.map((box, idx) => {
							const isFromRele = box.origen === "rele" || !box.origen; // por defecto relé
							const isFromAnalizador = box.origen === "analizador";

							const medicionActiva =
								box.enabled &&
								((isFromRele && mideRele) || (isFromAnalizador && mideAnalizador));

							const dur = isFromAnalizador ? periodoAnalizador : periodoRele;
							const timestamp = isFromAnalizador ? timestampInicioAnalizador : timestampInicioRele;

							let valueClass = "alim-card-meter-value";
							let valueStyle = {};

							if (medicionActiva) {
								const animationDelay = calcularAnimationDelay(timestamp, dur);

								if (isFromRele) {
									valueClass += " alim-meter-progress-rele";
									valueStyle = {
										"--rw-progress-duration-rele": `${dur}s`,
										animationDelay: `${animationDelay}s`,
									};
								} else if (isFromAnalizador) {
									valueClass += " alim-meter-progress-analizador";
									valueStyle = {
										"--rw-progress-duration-analizador": `${dur}s`,
										animationDelay: `${animationDelay}s`,
									};
								}
							}

							// Key única para forzar re-render de la animación
							const boxKey = `${idx}-${animationKey}-${medicionActiva ? 'active' : 'inactive'}`;

							return (
								<div key={boxKey} className="alim-card-meter">
									<span className="alim-card-meter-phase">{box.etiqueta}</span>
									<span className={valueClass} style={valueStyle}>
										{box.valor ?? "--,--"}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* ===== PARTE INFERIOR ===== */}
				<div className="alim-card-section">
					<h3 className="alim-card-section-title">{inf.titulo}</h3>

					<div className="alim-card-meters">
						{inf.boxes.map((box, idx) => {
							const isFromRele = box.origen === "rele" || !box.origen;
							const isFromAnalizador = box.origen === "analizador";

							const medicionActiva =
								box.enabled &&
								((isFromRele && mideRele) || (isFromAnalizador && mideAnalizador));

							const dur = isFromAnalizador ? periodoAnalizador : periodoRele;
							const timestamp = isFromAnalizador ? timestampInicioAnalizador : timestampInicioRele;

							let valueClass = "alim-card-meter-value";
							let valueStyle = {};

							if (medicionActiva) {
								const animationDelay = calcularAnimationDelay(timestamp, dur);

								if (isFromRele) {
									valueClass += " alim-meter-progress-rele";
									valueStyle = {
										"--rw-progress-duration-rele": `${dur}s`,
										animationDelay: `${animationDelay}s`,
									};
								} else if (isFromAnalizador) {
									valueClass += " alim-meter-progress-analizador";
									valueStyle = {
										"--rw-progress-duration-analizador": `${dur}s`,
										animationDelay: `${animationDelay}s`,
									};
								}
							}

							// Key única para forzar re-render de la animación
							const boxKey = `${idx}-${animationKey}-${medicionActiva ? 'active' : 'inactive'}`;

							return (
								<div key={boxKey} className="alim-card-meter">
									<span className="alim-card-meter-phase">{box.etiqueta}</span>
									<span className={valueClass} style={valueStyle}>
										{box.valor ?? "--,--"}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TarjetaAlimentador;
