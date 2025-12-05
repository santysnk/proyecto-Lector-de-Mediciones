import React from "react";
import ConfiguradorBox from "./ConfiguradorBox.jsx";
import "./FormularioDiseñoTarjeta.css";

/**
 * ==============================================================================
 * SUBCOMPONENTE: FormularioDiseñoTarjeta
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es el panel donde configuras UNA de las mitades de la tarjeta (la de arriba o la de abajo).
 * Aquí decides:
 * 1. El título general de esa mitad (ej: "CONSUMO").
 * 2. Cuántas cajitas de datos mostrar (1 a 4).
 * 3. Qué mostrar en cada cajita (usando el subcomponente ConfiguradorBox).
 * 
 * ¿CÓMO FUNCIONA?
 * Recibe la configuración actual de esa mitad ("design") y muestra los controles.
 * Si cambias la cantidad de boxes, automáticamente agrega o quita elementos.
 */

// Opciones predefinidas para los títulos
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

// Textos de ayuda para las etiquetas de las cajas
const PLACEHOLDERS_BOX = [
	"Ej: R o L1",
	"Ej: S o L2",
	"Ej: T o L3",
	"Ej: Total",
];

const FormularioDiseñoTarjeta = ({
	zona, 					// "superior" o "inferior" (solo informativo)
	tituloBloque, 			// Título visual del formulario (ej: "Parte superior")
	placeholderTitulo, 		// Ejemplo de título
	design, 				// Objeto con la configuración actual
	onChangeTitulo, 		// Función al cambiar el select de título
	onChangeTituloCustom, 	// Función al escribir un título propio
	onChangeCantidad, 		// Función al cambiar el número de boxes
	onChangeBox, 			// Función al editar una caja específica
}) => {
	const cant = design.cantidad || 1;

	return (
		<section className="map-part">
			<h4 className="map-part__title">{tituloBloque}</h4>

			{/* CABECERA: Título y Cantidad */}
			<div className="map-part__header">

				{/* SELECTOR DE TÍTULO */}
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

						{/* Input extra si elige "Personalizado" */}
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

				{/* SELECTOR DE CANTIDAD */}
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

			{/* LISTA DE CAJAS (Se generan dinámicamente según la cantidad elegida) */}
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
