// src/paginas/PaginaAlimentadores/componentes/modales/mapeo/ConfiguradorBox.jsx

import React, { useState, useRef, useEffect } from "react";

// Configurador individual de cada box de medición
// Permite habilitar/deshabilitar y definir etiqueta, registro, origen y fórmula.
// Soporta drag & drop de registros desde la vista previa.
const ConfiguradorBox = ({
	index,
	box,
	onChange,
	placeholder,
	esDuplicado,           // boolean: indica si este registro está duplicado
	mensajeDuplicado,      // string: mensaje para el tooltip
}) => {
	const [isDragOver, setIsDragOver] = useState(false);
	const [mostrarTooltip, setMostrarTooltip] = useState(false);
	const [mostrarToastLocal, setMostrarToastLocal] = useState(false);  // toast local debajo del input

	// Maneja cuando se arrastra algo sobre el input de registro
	const handleDragOver = (e) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
		setIsDragOver(true);
	};

	const handleDragLeave = () => {
		setIsDragOver(false);
	};

	// Maneja cuando se suelta un registro sobre el input
	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragOver(false);

		try {
			const data = JSON.parse(e.dataTransfer.getData("application/json"));
			if (data.address !== undefined) {
				// Actualizar el registro con el address del registro arrastrado
				onChange(index, "registro", String(data.address));
				// Actualizar el origen según de dónde viene el registro
				if (data.origen) {
					onChange(index, "origen", data.origen);
				}
			}
		} catch (err) {
			console.error("Error al procesar el drop:", err);
		}
	};

	// Efecto para mostrar toast local cuando se detecta duplicado
	const prevEsDuplicado = useRef(esDuplicado);
	useEffect(() => {
		// Solo mostrar toast si pasó de no-duplicado a duplicado
		if (esDuplicado && !prevEsDuplicado.current) {
			setMostrarToastLocal(true);
			// Ocultar después de 3 segundos
			const timer = setTimeout(() => {
				setMostrarToastLocal(false);
			}, 3000);
			return () => clearTimeout(timer);
		}
		prevEsDuplicado.current = esDuplicado;
	}, [esDuplicado]);

	return (
		<div className="map-box">
			{/* Checkbox + texto "Box N" */}
			<label className="map-box__check">
				<input
					type="checkbox"
					checked={!!box.enabled}                             // activo si `enabled` es true
					onChange={(e) => onChange(index, "enabled", e.target.checked)}
				/>
				<span>Box {index + 1}</span>                           {/* número de box 1..4 */}
			</label>

			{/* Etiqueta visible en la card (R, S, T, Total, etc.) */}
			<input
				type="text"
				className="map-input map-box__label"
				placeholder={placeholder}                              // texto sugerido según posición
				value={box.label || ""}                                // etiqueta actual o vacío
				onChange={(e) => onChange(index, "label", e.target.value)}
			/>

			{/* Registro Modbus que se leerá para esta magnitud - acepta drop */}
			<div className="map-box__registro-wrapper">
				<input
					type="number"
					className={`map-input map-box__registro ${isDragOver ? "drop-over" : ""} ${esDuplicado ? "duplicado" : ""}`}
					placeholder="Registro"
					value={box.registro || ""}                             // número de registro como string
					onChange={(e) => onChange(index, "registro", e.target.value)}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				/>
				{/* Icono de advertencia para registros duplicados */}
				{esDuplicado && (
					<span
						className="map-box__warning-icon"
						onMouseEnter={() => setMostrarTooltip(true)}
						onMouseLeave={() => setMostrarTooltip(false)}
					>
						⚠️
						{/* Tooltip con mensaje */}
						{mostrarTooltip && mensajeDuplicado && (
							<div className="map-box__warning-tooltip">
								{mensajeDuplicado}
							</div>
						)}
					</span>
				)}
				{/* Toast local que aparece debajo del input */}
				{mostrarToastLocal && (
					<div className="map-box__toast-local">
						⚠️ Registro duplicado
					</div>
				)}
			</div>

			{/* Origen: de qué equipo viene el dato (relé o analizador) */}
			<select
				className="map-select map-box__origen"
				value={box.origen || "rele"}                           // por defecto se asume relé
				onChange={(e) => onChange(index, "origen", e.target.value)}
			>
				<option value="rele">Relé</option>
				<option value="analizador">Analizador</option>
			</select>

			{/* Fórmula opcional para transformar la lectura (x = valor crudo) */}
			<input
				type="text"
				className="map-input map-box__formula"
				placeholder="Fórmula (ej: x * 500 / 1000)"
				value={box.formula || ""}                             // expresión que se evaluará luego
				onChange={(e) => onChange(index, "formula", e.target.value)}
			/>
		</div>
	);
};

export default ConfiguradorBox;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (ConfiguradorBox.jsx)

 - Este componente representa una fila de configuración para un "box" de la
   tarjeta de mediciones. Cada fila corresponde a una magnitud que se mostrará
   en la tarjeta (ej: R, S, T o Total).

 - No guarda estado propio: simplemente recibe el objeto `box` y un callback
   `onChange(index, campo, valor)` que le delega al padre la actualización
   inmutable del estado.

 - La idea es que:
     * el checkbox controla si el box está habilitado,
     * `label` define el texto visible,
     * `registro` indica el registro Modbus que se leerá,
     * `origen` dice si viene del relé o del analizador,
     * `formula` permite transformar el valor crudo antes de mostrarlo.

 - Pensarlo como una "fila editable de tabla" que se repite varias veces dentro
   de `FormularioDiseñoTarjeta`, cada una con su `index` y sus propios datos.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (ConfiguradorBox.jsx)

0) Visión general del componente

   `ConfiguradorBox` representa una fila de configuración para un "box" de la
   tarjeta de mediciones. Cada fila define cómo se va a mostrar UNA magnitud
   en la tarjeta (por ejemplo, fase R, fase S, fase T o Total).

   Es un componente de presentación:
   - no tiene estado propio,
   - solo muestra los campos,
   - y avisa al padre cuando algo cambia usando `onChange(index, campo, valor)`.

   Se usa varias veces dentro de `FormularioDiseñoTarjeta`, uno por cada
   posición activa de la parte superior o inferior de la tarjeta.


1) Props del componente

   const ConfiguradorBox = ({ index, box, onChange, placeholder }) => { ... }

   - `index` (número):
       • posición del box dentro del bloque (0..3),
       • se usa para:
           - mostrar “Box N” (N = index + 1),
           - indicarle al padre qué box hay que actualizar.

   - `box` (objeto):
       • contiene la configuración actual de esa caja:
         {
           enabled,  // boolean: si el box se usa o no
           label,    // texto visible en la tarjeta (R, S, T, Total, etc.)
           registro, // número de registro Modbus como string
           origen,   // "rele" o "analizador"
           formula,  // expresión para transformar el valor crudo (ej: "x * 500 / 1000")
         }

   - `onChange(index, campo, valor)`:
       • callback que notifica al componente padre qué campo cambió,
       • el padre actualiza inmutablemente el array `boxes` en su propio estado.

   - `placeholder` (string):
       • texto sugerido para la etiqueta (ej: "Ej: R o L1"),
       • ayuda a orientar qué se espera en ese box según la posición.


2) Checkbox de habilitado

   <label className="map-box__check">
     <input
       type="checkbox"
       checked={!!box.enabled}
       onChange={(e) => onChange(index, "enabled", e.target.checked)}
     />
     <span>Box {index + 1}</span>
   </label>

   - `checked={!!box.enabled}`:
       • fuerza el valor a booleano:
           - true  si `enabled` es truthy,
           - false si es falsy o undefined.

   - Al cambiar el checkbox:
       • se llama a `onChange(index, "enabled", e.target.checked)`,
       • `e.target.checked` es true/false según el estado del checkbox.

   - El texto “Box N” sirve como etiqueta rápida para identificar la fila
     dentro de la configuración.


3) Campo de etiqueta (label)

   <input
     type="text"
     className="map-input map-box__label"
     placeholder={placeholder}
     value={box.label || ""}
     onChange={(e) => onChange(index, "label", e.target.value)}
   />

   - Representa el texto visible en la tarjeta de medición:
       • ejemplos típicos: R, S, T, L1, L2, L3, Total.

   - `placeholder={placeholder}`:
       • muestra el texto sugerido según la posición (por ejemplo,
         “Ej: R o L1” para el primer box).

   - `value={box.label || ""}`:
       • si no hay etiqueta definida, usa string vacío para mantener el input
         controlado.

   - Cada cambio dispara:
       • `onChange(index, "label", nuevoTexto)`.


4) Campo de registro Modbus

   <input
     type="number"
     className="map-input map-box__registro"
     placeholder="Registro"
     value={box.registro || ""}
     onChange={(e) => onChange(index, "registro", e.target.value)}
   />

   - Indica qué registro Modbus se leerá para este box.

   - Aunque el tipo es `"number"`, el valor se maneja como string en el estado
     para:
       • facilitar el input parcial (vacío, 0, etc.),
       • convertir a número más adelante, en el momento de armar la lectura
         o el mapeo definitivo.

   - Al modificarse:
       • se llama a `onChange(index, "registro", valorComoString)`.


5) Selector de origen (relé / analizador)

   <select
     className="map-select map-box__origen"
     value={box.origen || "rele"}
     onChange={(e) => onChange(index, "origen", e.target.value)}
   >
     <option value="rele">Relé</option>
     <option value="analizador">Analizador</option>
   </select>

   - Decide de qué equipo se toma el dato:
       • "rele"       → registros del relé asociado,
       • "analizador" → registros del analizador.

   - `value={box.origen || "rele"}`:
       • si no se especificó origen, se asume `"rele"` como valor por defecto.

   - Cada cambio dispara:
       • `onChange(index, "origen", "rele" | "analizador")`.

   - Este campo se usa más adelante para decidir:
       • qué conjunto de registros en vivo usar,
       • y qué animación de borde aplicar en la tarjeta (`CajaMedicion`).


6) Campo de fórmula

   <input
     type="text"
     className="map-input map-box__formula"
     placeholder="Fórmula (ej: x * 500 / 1000)"
     value={box.formula || ""}
     onChange={(e) => onChange(index, "formula", e.target.value)}
   />

   - Permite definir una fórmula opcional que transforma el valor crudo que
     viene del registro Modbus.

   - Convención típica:
       • `x` representa el valor leído,
       • la expresión indica cómo convertirlo a la unidad deseada.
         Ejemplo:
           - si el registro trae un valor en kA y quiero A:
             fórmula: `x * 1000`.

   - Si `box.formula` está vacío o null:
       • se asume que el valor se usa “tal cual” o con una transformación
         por defecto en otra parte del código.


7) Flujo de datos y patrón de uso

   - Este componente no sabe:
       • cómo se guardan los datos,
       • ni cómo se usan después para calcular lecturas.

   - Su única responsabilidad es:
       • pintar los campos de configuración,
       • convertir los cambios del usuario en llamadas a `onChange`.

   - Patrón típico desde el padre:
       • se tiene un array `boxes` en el estado del modal,
       • se pasa `box = boxes[index]`,
       • `onChange` se implementa como una función que:
           - clona el array,
           - actualiza `boxes[index][campo] = valor`,
           - guarda el nuevo array en el estado.

   - De esta forma, `ConfiguradorBox` se mantiene muy simple y reutilizable,
     y toda la lógica de estado vive en el contenedor (`FormularioDiseñoTarjeta`
     y, por encima, `ModalMapeoMediciones`).

---------------------------------------------------------------------------*/
