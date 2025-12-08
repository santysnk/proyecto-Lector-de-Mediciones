// src/paginas/PaginaAlimentadores/componentes/modales/configuracion/FormularioDatosBasicos.jsx

import React from "react";                                    
import { COLORES_SISTEMA } from "../../../constantes/colores"; // paleta global de colores para botones/tarjetas

// Formulario de datos básicos del alimentador:
// sólo maneja nombre visible y color asociado.
const FormularioDatosBasicos = ({ nombre, color, onChange }) => {
	return (
		<div className="alim-form-basicos">
			<label className="alim-modal-label" htmlFor="nombre-alimentador">
				Nombre del Alimentador
				<input
					id="nombre-alimentador"
					type="text"
					className="alim-modal-input"
					value={nombre}
					onChange={(e) => onChange("nombre", e.target.value)} // avisa al padre del nuevo nombre
					placeholder="Ej: ALIMENTADOR 1"
					required
					autoComplete="off"
					autoCorrect="off"
					spellCheck={false}
				/>
			</label>

			<label className="alim-modal-label">
				<div className="alim-color-grid">
					{COLORES_SISTEMA.map((c) => (
						<button
							key={c}
							type="button"
							className={
								"alim-color-swatch" +
								(color === c ? " alim-color-swatch-selected" : "")
							}                                           // marca visualmente el color elegido
							style={{ backgroundColor: c }}               // cuadradito pintado con ese color
							onClick={() => onChange("color", c)}        // notifica al padre el color elegido
							aria-label={`Elegir color ${c}`}
						/>
					))}
				</div>
			</label>
		</div>
	);
};

export default FormularioDatosBasicos;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (FormularioDatosBasicos.jsx)

 - Este formulario sólo se ocupa de los datos "humanos" del alimentador:
   el nombre que se muestra en la tarjeta y el color visual que lo distingue.

 - No guarda estado propio, recibe `nombre` y `color` desde el modal padre
   (`ModalConfiguracionAlimentador`) y devuelve cambios a través de
   `onChange(campo, valor)`.

 - La grilla de colores recorre `COLORES_SISTEMA` y dibuja un botón por cada
   color; si `color === c`, aplica la clase `alim-color-swatch-selected` para
   resaltarlo como color activo.

 - Si en el futuro quiero agregar más campos básicos (por ejemplo, descripción
   o un código interno), este es el lugar donde agregarlos sin tocar las tabs
   técnicas de relé y analizador.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (FormularioDatosBasicos.jsx)

0) Visión general del componente

   `FormularioDatosBasicos` es el bloque donde se cargan los datos "humanos"
   del alimentador:

   - Nombre que se ve en la tarjeta y en los modales.
   - Color visual que se usa para el botón y el fondo del alimentador.

   No maneja estado propio: todo se controla desde el modal padre
   (`ModalConfiguracionAlimentador`) y este formulario sólo dispara `onChange`
   cuando el usuario escribe o elige un color.


1) Props

   const FormularioDatosBasicos = ({ nombre, color, onChange }) => { ... }

   - `nombre`:
       • string con el texto actual del nombre del alimentador,
       • se usa como `value` del input de texto.

   - `color`:
       • string con el color actualmente seleccionado (ej: "#0ea5e9"),
       • se compara contra cada color de `COLORES_SISTEMA` para marcar
         cuál está activo.

   - `onChange(campo, valor)`:
       • callback genérico para avisar al padre que cambió algo,
       • se llama con:
           - `"nombre"` cuando cambia el texto,
           - `"color"` cuando se elige un color distinto.


2) Campo de nombre del alimentador

   <label className="alim-modal-label" htmlFor="nombre-alimentador">
     Nombre del Alimentador
     <input
       id="nombre-alimentador"
       type="text"
       className="alim-modal-input"
       value={nombre}
       onChange={(e) => onChange("nombre", e.target.value)}
       placeholder="Ej: ALIMENTADOR 1"
       required
       autoComplete="off"
       autoCorrect="off"
       spellCheck={false}
     />
   </label>

   - `value={nombre}`:
       • el input siempre refleja el valor que le llega desde arriba.

   - `onChange("nombre", e.target.value)`:
       • cada vez que el usuario escribe, se notifica al padre con el
         nuevo texto para que actualice el estado externo.

   - `placeholder="Ej: ALIMENTADOR 1"`:
       • sugerencia visual de formato, no se guarda si el usuario no escribe.

   - `required`, `autoComplete="off"`, `autoCorrect="off"`, `spellCheck={false}`:
       • marcan el campo como obligatorio,
       • y evitan correcciones automáticas o autocompletados que podrían
         ensuciar nombres técnicos.


3) Selector de color (paleta de cuadrados)

   <label className="alim-modal-label">
     <div className="alim-color-grid">
       {COLORES_SISTEMA.map((c) => (
         <button
           key={c}
           type="button"
           className={
             "alim-color-swatch" +
             (color === c ? " alim-color-swatch-selected" : "")
           }
           style={{ backgroundColor: c }}
           onClick={() => onChange("color", c)}
           aria-label={`Elegir color ${c}`}
         />
       ))}
     </div>
   </label>

   - `COLORES_SISTEMA`:
       • array global de colores definidos para la app,
       • asegura que todos los componentes usen la misma paleta.

   - `COLORES_SISTEMA.map((c) => ...)`:
       • por cada color `c`, se dibuja un botón cuadrado.

   - `className`:
       • siempre incluye `"alim-color-swatch"`,
       • si `color === c`, agrega `"alim-color-swatch-selected"` para
         resaltar visualmente el color elegido (borde, sombra, etc.).

   - `style={{ backgroundColor: c }}`:
       • pinta el cuadradito con el color correspondiente.

   - `onClick={() => onChange("color", c)}`:
       • al hacer clic, se avisa al padre que el color elegido es `c`,
         para que actualice su estado y lo propague de vuelta como prop.

   - `aria-label`:
       • mejora la accesibilidad describiendo la acción del botón
         a lectores de pantalla.


4) Ciclo de datos entre este formulario y el modal padre

   - El estado real vive en `ModalConfiguracionAlimentador`:
       • allí se declara:
           nombre, color, periodoSegundos, rele, analizador, etc.

   - `FormularioDatosBasicos`:
       • recibe `nombre` y `color` como props,
       • muestra esos datos en los controles,
       • y cada cambio dispara `onChange(campo, valor)`.

   - El padre:
       • escucha esos cambios y actualiza su propio estado,
       • luego vuelve a pasar los nuevos `nombre` y `color` al formulario.

   De esa forma este componente se mantiene “tonto” (sin estado propio)
   y sólo se ocupa de la parte visual y de disparar eventos.

---------------------------------------------------------------------------*/

