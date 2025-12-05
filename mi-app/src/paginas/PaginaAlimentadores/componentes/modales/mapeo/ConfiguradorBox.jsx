import React from "react";
import "./ConfiguradorBox.css";

/**
 * ==============================================================================
 * SUBCOMPONENTE: ConfiguradorBox
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es la fila de configuración para UNA sola cajita de medición.
 * Permite definir:
 * 1. Si la caja está activada o no (Checkbox).
 * 2. Qué etiqueta mostrar (ej: "R", "S", "Total").
 * 3. Qué número de registro Modbus leer (ej: 100).
 * 4. De dónde leerlo (Relé o Analizador).
 * 5. Una fórmula matemática opcional para corregir el valor (ej: "x * 0.1").
 * 
 * ¿CÓMO FUNCIONA?
 * Es un componente controlado. Recibe sus valores por props y avisa al padre
 * cuando algo cambia mediante la función "onChange".
 */

const ConfiguradorBox = ({
	index, 			// Posición de la caja (0, 1, 2 o 3)
	box, 			// Objeto con la configuración actual { enabled, label, registro... }
	onChange, 		// Función para guardar cambios: onChange(index, campo, valor)
	placeholder 	// Texto de ayuda para la etiqueta
}) => {
	return (
		<div className="map-box">
			{/* 1. ACTIVAR / DESACTIVAR */}
			<label className="map-box__check" title="Activar esta caja">
				<input
					type="checkbox"
					checked={!!box.enabled}
					onChange={(e) => onChange(index, "enabled", e.target.checked)}
				/>
				<span>Box {index + 1}</span>
			</label>

			{/* 2. ETIQUETA VISIBLE */}
			<input
				type="text"
				className="map-input map-box__label"
				placeholder={placeholder}
				value={box.label || ""}
				onChange={(e) => onChange(index, "label", e.target.value)}
				title="Texto que se mostrará arriba del valor"
			/>

			{/* 3. NÚMERO DE REGISTRO */}
			<input
				type="number"
				className="map-input map-box__registro"
				placeholder="Registro"
				value={box.registro || ""}
				onChange={(e) => onChange(index, "registro", e.target.value)}
				title="Dirección Modbus del dato"
			/>

			{/* 4. ORIGEN DE DATOS */}
			<select
				className="map-select map-box__origen"
				value={box.origen || "rele"}
				onChange={(e) => onChange(index, "origen", e.target.value)}
				title="De qué equipo leer el dato"
			>
				<option value="rele">Relé</option>
				<option value="analizador">Analizador</option>
			</select>

			{/* 5. FÓRMULA MATEMÁTICA */}
			<input
				type="text"
				className="map-input map-box__formula"
				placeholder="Fórmula (ej: x * 500 / 1000)"
				value={box.formula || ""}
				onChange={(e) => onChange(index, "formula", e.target.value)}
				title="Operación matemática opcional. 'x' es el valor leído."
			/>
		</div>
	);
};

export default ConfiguradorBox;
