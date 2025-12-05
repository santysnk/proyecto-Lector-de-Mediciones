import React from "react";
import ConfiguradorBox from "./ConfiguradorBox.jsx";
import "./FormularioDiseñoTarjeta.css";

const OPCIONES_TITULO_CARD = [
	{ id: "tension_linea", label: "Tensión de línea (kV)" },
	{ id: "tension_entre_lineas", label: "Tensión entre líneas (kV)" },
	{ id: "corriente_132", label: "Corriente de línea (A) (en 13,2 kV)" },
	{ id: "corriente_33", label: "Corriente de línea (A) (en 33 kV)" },
	{ id: "potencia_activa", label: "Potencia activa (kW)" },
	{ id: "potencia_reactiva", label: "Potencia reactiva (kVAr)" },
	{ id: "potencia_aparente", label: "Potencia aparente (kVA)" },
	{ id: "factor_potencia", label: "Factor de Potencia" },
	{ id: "frecuencia", label: "Frecuencia (Hz)" },
	{ id: "corriente_neutro", label: "Corriente de Neutro (A)" },
	{ id: "custom", label: "Otro (personalizado)..." },
];

const PLACEHOLDERS_BOX = [
	"Ej: R o L1",
	"Ej: S o L2",
	"Ej: T o L3",
	"Ej: Total",
];

/**
 * Formulario para diseñar una parte de la tarjeta (superior o inferior)
 * Permite configurar título, cantidad de boxes y cada box individual
 */
const FormularioDiseñoTarjeta = ({
	zona,
	tituloBloque,
	placeholderTitulo,
	design,
	onChangeTitulo,
	onChangeTituloCustom,
	onChangeCantidad,
	onChangeBox,
}) => {
	const cant = design.cantidad || 1;

	return (
		<section className="map-part">
			<h4 className="map-part__title">{tituloBloque}</h4>

			{/* Título + Cantidad de boxes */}
			<div className="map-part__header">
				{/* Campo Título */}
				<div className="map-field map-field--grow">
					<span className="map-field__label">Título</span>
					<div className="map-field__inline">
						<select
							className="map-select"
							value={design.tituloId || "corriente_132"}
							onChange={(e) => onChangeTitulo(e.target.value)}
						>
							{OPCIONES_TITULO_CARD.map((op) => (
								<option key={op.id} value={op.id}>
									{op.label}
								</option>
							))}
						</select>

						{design.tituloId === "custom" && (
							<input
								type="text"
								className="map-input map-input--full"
								placeholder={placeholderTitulo}
								value={design.tituloCustom || ""}
								onChange={(e) => onChangeTituloCustom(e.target.value)}
							/>
						)}
					</div>
				</div>

				{/* Campo Cantidad */}
				<div className="map-field map-field--small">
					<span className="map-field__label">
						Cantidad de boxes de medición
					</span>
					<select
						className="map-select"
						value={cant}
						onChange={(e) => onChangeCantidad(Number(e.target.value))}
					>
						{[1, 2, 3, 4].map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Lista de boxes */}
			<div className="map-box-list">
				{Array.from({ length: cant }).map((_, idx) => {
					const box = design.boxes[idx] || {};
					const placeholderLabel = PLACEHOLDERS_BOX[idx] || `Box ${idx + 1}`;

					return (
						<ConfiguradorBox
							key={idx}
							index={idx}
							box={box}
							onChange={onChangeBox}
							placeholder={placeholderLabel}
						/>
					);
				})}
			</div>
		</section>
	);
};

export default FormularioDiseñoTarjeta;
