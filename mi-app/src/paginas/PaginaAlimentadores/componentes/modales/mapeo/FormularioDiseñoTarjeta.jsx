// src/paginas/PaginaAlimentadores/componentes/modales/mapeo/FormularioDiseñoTarjeta.jsx

import React from "react";                          
import ConfiguradorBox from "./ConfiguradorBox.jsx"; // subcomponente que configura cada "box" individual

// Opciones predefinidas para el título del bloque (magnitudes típicas)
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

// Placeholders sugeridos para las etiquetas de cada box
const PLACEHOLDERS_BOX = [
	"Ej: R o L1",
	"Ej: S o L2",
	"Ej: T o L3",
	"Ej: Total",
];

// Formulario para diseñar una parte de la tarjeta (superior o inferior)
// Permite configurar título, cantidad de boxes y cada box individual
const FormularioDiseñoTarjeta = ({
	zona,                                            // "superior" | "inferior" (para identificar la zona)
	tituloBloque,                                    // texto que se muestra como título del bloque (h4)
	placeholderTitulo,                               // placeholder para el campo de título personalizado
	design,                                          // objeto con estructura: { tituloId, tituloCustom, cantidad, boxes }
	onChangeTitulo,                                  // callback cuando cambia la opción de título
	onChangeTituloCustom,                            // callback cuando se edita el título personalizado
	onChangeCantidad,                                // callback para la cantidad de boxes (1..4)
	onChangeBox,                                     // callback que actualiza un box puntual
}) => {
	const cant = design.cantidad || 1;               // cantidad de boxes activos (por defecto 1)

	return (
		<section className="map-part">
			<h4 className="map-part__title">{tituloBloque}</h4>

			{/* Fila con: selector de título + cantidad de boxes */}
			<div className="map-part__header">
				{/* Selector de título (magnitud) + input opcional para título custom */}
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

				{/* Campo para elegir cuántos boxes de medición se mostrarán */}
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

			{/* Lista de configuradores de box (uno por cada posición activa) */}
			<div className="map-box-list">
				{Array.from({ length: cant }).map((_, idx) => {
					const box = design.boxes[idx] || {};                // datos de la caja en esa posición
					const placeholderLabel =
						PLACEHOLDERS_BOX[idx] || `Box ${idx + 1}`;      // texto sugerido para la etiqueta

					return (
						<ConfiguradorBox
							key={`${zona}-${idx}`}                       // incluye la zona para evitar colisiones de key
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

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (FormularioDiseñoTarjeta.jsx)

 - Este componente es un "subformulario" reutilizable: se usa dos veces dentro
   de `ModalMapeoMediciones` para diseñar la parte superior e inferior de cada
   tarjeta de alimentador.

 - En vez de manejar estado propio, recibe el objeto `design` (con título,
   cantidad y array de `boxes`) y también los callbacks que modifican ese
   diseño en el estado del modal padre.

 - La lógica importante es:
     * `cant` define cuántos `ConfiguradorBox` se renderizan.
     * Cada box se identifica por `index` y usa `onChangeBox` para avisar
       al padre qué campo cambió (etiqueta, registro, origen, fórmula, etc.).

 - Pensarlo como "una plantilla de fila" que sabe mostrar/editar los datos,
   pero delega toda la persistencia de cambios al componente que la contiene.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (FormularioDiseñoTarjeta.jsx)

0) Visión general del componente

   `FormularioDiseñoTarjeta` es un subformulario reutilizable que se usa dos
   veces dentro de `ModalMapeoMediciones`:

   - Una vez para diseñar la parte SUPERIOR de la tarjeta.
   - Otra vez para diseñar la parte INFERIOR.

   En cada uso permite:
   - Elegir qué magnitud se muestra en el título del bloque
     (corriente, tensión, potencias, etc.).

   - Elegir cuántos boxes de medición se van a usar (1 a 4).

   - Configurar cada box (etiqueta, registro, origen, fórmula) a través del
     subcomponente `ConfiguradorBox`.

   No maneja estado propio: recibe el objeto `design` y callbacks para avisar
   al componente padre cuando algo cambia.


1) Constantes: OPCIONES_TITULO_CARD

   const OPCIONES_TITULO_CARD = [
     { id: "tension_linea", label: "Tensión de línea (kV)" },
     ...
     { id: "corriente_neutro", label: "Corriente de Neutro (A)" },
     { id: "custom", label: "Otro (personalizado)..." },
   ];

   - Es la lista de opciones del combo de “Título” del bloque.

   - Cada opción tiene:
       • `id`: clave interna que se guarda en `design.tituloId`,
       • `label`: texto descriptivo que ve el usuario.

   - La opción especial:
       • `id: "custom"` → permite escribir un texto libre en un input
         aparte (`design.tituloCustom`).


2) Constantes: PLACEHOLDERS_BOX

   const PLACEHOLDERS_BOX = [
     "Ej: R o L1",
     "Ej: S o L2",
     "Ej: T o L3",
     "Ej: Total",
   ];

   - Son textos sugeridos para el campo “Etiqueta” de cada box, según
     la posición (0..3).

   - Ayudan a recordar usos típicos:
       • 1.º box → fase R o L1,
       • 2.º box → fase S o L2,
       • 3.º box → fase T o L3,
       • 4.º box → Total (si aplica).

   - Si el índice es mayor a 3, se usa un fallback tipo `"Box N"`.


3) Props del componente

   const FormularioDiseñoTarjeta = ({
     zona,
     tituloBloque,
     placeholderTitulo,
     design,
     onChangeTitulo,
     onChangeTituloCustom,
     onChangeCantidad,
     onChangeBox,
   }) => { ... }

   - `zona` ("superior" | "inferior"):
       • indica qué parte de la tarjeta se está configurando,
       • se usa para construir keys únicas (`${zona}-${idx}`).

   - `tituloBloque` (string):
       • texto que se muestra como título visual del bloque (h4),
       • ej: "Parte superior", "Parte inferior".

   - `placeholderTitulo` (string):
       • placeholder del input de título personalizado,
       • ej: "CONSUMO (A)", "TENSIÓN (kV)".

   - `design` (objeto):
       • estructura del diseño de esta parte de la tarjeta:
         {
           tituloId,      // id de la magnitud elegida (o "custom")
           tituloCustom,  // texto personalizado si tituloId === "custom"
           cantidad,      // cuántos boxes activos se muestran
           boxes: [ ... ] // array de hasta 4 boxes
         }

   - `onChangeTitulo(tituloId)`:
       • callback cuando se cambia la opción del select de título.

   - `onChangeTituloCustom(texto)`:
       • callback cuando se escribe en el campo de título personalizado.

   - `onChangeCantidad(nuevaCantidad)`:
       • callback cuando se cambia la cantidad de boxes (1..4).

   - `onChangeBox(index, campo, valor)`:
       • callback que notifica un cambio en un box puntual,
       • el padre se encarga de actualizar `design.boxes[index][campo]`.


4) Cálculo de cantidad de boxes

   const cant = design.cantidad || 1;

   - `cant` define cuántos `ConfiguradorBox` se van a mostrar.

   - Si `design.cantidad` no está definido o vale 0, se usa `1` como
     cantidad mínima de boxes activos.


5) Estructura general del JSX

   return (
     <section className="map-part">
       <h4 className="map-part__title">{tituloBloque}</h4>

       <div className="map-part__header">
         // Aquí van:
         //  - selector de título (magnitud),
         //  - selector de cantidad de boxes.
       </div>

       <div className="map-box-list">
         // Aquí se renderiza la lista de ConfiguradorBox, uno por cada box activo.
       </div>
     </section>
   );

   - `<section className="map-part">`:
       • envuelve todo el bloque de configuración de esta zona.

   - `<h4 className="map-part__title">`:
       • muestra el título descriptivo de la sección (ej: “Parte superior”).

   - `<div className="map-part__header">`:
       • contiene la fila con:
           - selector de magnitud/título,
           - selector de cantidad de boxes.

   - `<div className="map-box-list">`:
       • lista de configuradores de box, uno por cada posición activa.


6) Selector de título (magnitud)

   <div className="map-field map-field--grow">
     <span className="map-field__label">Título</span>
     <div className="map-field__inline">
       <select
         className="map-select"
         value={design.tituloId || "corriente_132"}
         onChange={(e) => onChangeTitulo(e.target.value)}
       >
         {OPCIONES_TITULO_CARD.map((op) => (
           <option key={op.id} value={op.id}>{op.label}</option>
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

   - `value={design.tituloId || "corriente_132"}`:
       • si no hay título definido, toma una opción por defecto
         (corriente en 13,2 kV).

   - Al cambiar el select:
       • se llama a `onChangeTitulo(nuevoId)` y el padre actualiza `design`.

   - Si el usuario elige `"custom"`:
       • se muestra un `<input>` adicional,
       • su valor se vincula a `design.tituloCustom`,
       • `onChange` dispara `onChangeTituloCustom(texto)`.


7) Selector de cantidad de boxes

   <div className="map-field map-field--small">
     <span className="map-field__label">Cantidad de boxes de medición</span>
     <select
       className="map-select"
       value={cant}
       onChange={(e) => onChangeCantidad(Number(e.target.value))}
     >
       {[1, 2, 3, 4].map((n) => (
         <option key={n} value={n}>{n}</option>
       ))}
     </select>
   </div>

   - Permite elegir entre 1 y 4 boxes.

   - Al cambiar:
       • convierte el valor a número,
       • llama a `onChangeCantidad(n)` para que el padre actualice
         `design.cantidad` y eventualmente el array `boxes` asociado.


8) Lista de configuradores de box

   <div className="map-box-list">
     {Array.from({ length: cant }).map((_, idx) => {
       const box = design.boxes[idx] || {};
       const placeholderLabel =
         PLACEHOLDERS_BOX[idx] || `Box ${idx + 1}`;

       return (
         <ConfiguradorBox
           key={`${zona}-${idx}`}
           index={idx}
           box={box}
           onChange={onChangeBox}
           placeholder={placeholderLabel}
         />
       );
     })}
   </div>

   - Se construye un array de longitud `cant` con `Array.from`.

   - Para cada índice `idx`:
       • se toma `design.boxes[idx]` (o `{}` si todavía no existe),
       • se calcula un `placeholderLabel` acorde a la posición,
       • se renderiza un `ConfiguradorBox`.

   - Props pasadas a `ConfiguradorBox`:
       • `index`: posición del box dentro de la zona (0..3),
       • `box`: objeto con los datos actuales (enabled, label, registro, origen, fórmula),
       • `onChange`: callback común `onChangeBox(index, campo, valor)` que el
         subcomponente llamará al modificarse algo,
       • `placeholder`: texto sugerido para la etiqueta.

   - La `key` incluye `zona` e índice:
       • evita colisiones entre la parte superior e inferior
         (ej: `"superior-0"` vs `"inferior-0"`).


9) Resumen mental

   - Pensar este componente como:
       • “un molde de formulario de diseño” que solamente:
           - muestra las opciones de configuración,
           - levanta los cambios y los envía hacia arriba.

   - Toda la responsabilidad de:
       • guardar `design`,
       • inicializarlo con defaults,
       • combinarlo con mapeos antiguos,
     está en `ModalMapeoMediciones`.

   - Esto facilita el mantenimiento:
       • si en el futuro se agregan nuevas magnitudes o campos a un box,
         se pueden extender las constantes y el `ConfiguradorBox` sin
         tocar la lógica de estado aquí dentro.

---------------------------------------------------------------------------*/
