import React from "react";
import "./ConfiguradorBox.css";

/**
 * Configurador individual de cada box de medición
 * Permite habilitar/deshabilitar y configurar registro, origen y fórmula
 */
const ConfiguradorBox = ({ index, box, onChange, placeholder }) => {
	return (
		<div className="map-box">
			{/* Checkbox + texto "Box N" */}
			<label className="map-box__check">
				<input
					type="checkbox"
					checked={!!box.enabled}
					onChange={(e) => onChange(index, "enabled", e.target.checked)}
				/>
				<span>Box {index + 1}</span>
			</label>

			{/* Etiqueta visible en la card */}
			<input
				type="text"
				className="map-input map-box__label"
				placeholder={placeholder}
				value={box.label || ""}
				onChange={(e) => onChange(index, "label", e.target.value)}
			/>

			{/* Registro Modbus */}
			<input
				type="number"
				className="map-input map-box__registro"
				placeholder="Registro"
				value={box.registro || ""}
				onChange={(e) => onChange(index, "registro", e.target.value)}
			/>

			{/* Origen: relé / analizador */}
			<select
				className="map-select map-box__origen"
				value={box.origen || "rele"}
				onChange={(e) => onChange(index, "origen", e.target.value)}
			>
				<option value="rele">Relé</option>
				<option value="analizador">Analizador</option>
			</select>

			{/* Fórmula */}
			<input
				type="text"
				className="map-input map-box__formula"
				placeholder="Fórmula (ej: x * 500 / 1000)"
				value={box.formula || ""}
				onChange={(e) => onChange(index, "formula", e.target.value)}
			/>
		</div>
	);
};

export default ConfiguradorBox;
