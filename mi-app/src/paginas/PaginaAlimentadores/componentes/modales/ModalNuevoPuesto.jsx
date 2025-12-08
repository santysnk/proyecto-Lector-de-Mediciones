// src/paginas/PaginaAlimentadores/componentes/modales/ModalNuevoPuesto.jsx

import React, { useState } from "react";      // React + estado local para el formulario
import "./ModalNuevoPuesto.css";              // estilos del modal

/**
 * Modal para crear un nuevo puesto.
 * Permite ingresar nombre y seleccionar color.
 */
const ModalNuevoPuesto = ({
	abierto,                                   // boolean: controla si el modal se muestra
	onCerrar,                                  // callback para cerrar sin crear
	onCrear,                                   // callback que recibe (nombre, color)
	coloresSistema,                            // array de colores disponibles
}) => {
	const [nombrePuesto, setNombrePuesto] = useState("");          // valor del input de nombre
	const [colorPuesto, setColorPuesto] = useState(coloresSistema[0]); // color seleccionado actualmente

	const handleSubmit = (e) => {
		e.preventDefault();
		const nombre = nombrePuesto.trim();                        // evita espacios al inicio/fin
		if (!nombre) return;                                       // no permite crear puestos sin nombre

		onCrear(nombre, colorPuesto);                              // delega la creación al padre

		// Limpiar (el cierre lo maneja el padre)
		setNombrePuesto("");
		setColorPuesto(coloresSistema[0]);
	};

	const handleCerrar = () => {
		setNombrePuesto("");                                       // resetea el formulario
		setColorPuesto(coloresSistema[0]);
		onCerrar();                                                // notifica cierre al padre
	};

	if (!abierto) return null;                                     // si no está abierto, no renderiza nada

	return (
		<div className="alim-modal-overlay">
			<div className="alim-modal alim-modal-sm">
				<h2>Nuevo Puesto</h2>
				<form onSubmit={handleSubmit}>
					<label className="alim-modal-label">
						Nombre del Puesto
						<input
							type="text"
							className="alim-modal-input"
							value={nombrePuesto}
							onChange={(e) => setNombrePuesto(e.target.value)}
							placeholder="Ej: PUESTO 1"
							autoFocus
						/>
					</label>

					<div className="alim-color-picker">
						<div className="alim-color-grid">
							{coloresSistema.map((c) => (
								<button
									key={c}
									type="button"
									className={
										"alim-color-swatch" +
										(colorPuesto === c
											? " alim-color-swatch-selected"
											: "")
									}
									style={{ backgroundColor: c }}
									onClick={() => setColorPuesto(c)}   // selecciona el color para el nuevo puesto
								/>
							))}
						</div>
					</div>

					<div className="alim-modal-actions">
						<button
							type="button"
							className="alim-modal-btn alim-modal-btn-cancelar"
							onClick={handleCerrar}
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="alim-modal-btn alim-modal-btn-aceptar"
						>
							Crear
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ModalNuevoPuesto;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (ModalNuevoPuesto.jsx)

 - Modal simple para dar de alta un puesto: solo pide nombre y color, y delega
   la lógica real de creación al hook `usarPuestos` vía `onCrear`.

 - Mantiene su propio estado local `nombrePuesto` y `colorPuesto`, y los resetea
   tanto al cerrar como al enviar el formulario.

 - La grilla de colores recorre `coloresSistema` y pinta un botón por color;
   el seleccionado se marca con la clase `alim-color-swatch-selected`.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (ModalNuevoPuesto.jsx)

0) Visión general del componente

   `ModalNuevoPuesto` es un modal muy simple que sirve para dar de alta un
   puesto nuevo.

   - Pide dos cosas:
       • nombre del puesto,
       • color del puesto (elegido de una paleta).

   - No crea nada por sí mismo: le pasa los datos al padre mediante `onCrear`
     y el padre se encarga de actualizar el estado global (hook `usarPuestos`). 


1) Props del componente

   const ModalNuevoPuesto = ({
     abierto,
     onCerrar,
     onCrear,
     coloresSistema,
   }) => { ... }

   - `abierto` (boolean):
       • true  → el modal se muestra,
       • false → el componente devuelve `null` y no pinta nada en la pantalla.

   - `onCerrar()`:
       • se llama cuando el usuario cancela el modal,
       • sirve para que el padre oculte el modal (y haga cualquier acción extra).

   - `onCrear(nombre, color)`:
       • callback al que se le envían:
           - el nombre limpio del puesto,
           - el color elegido de la lista.
       • el padre lo usa para llamar a `agregarPuesto` del contexto.

   - `coloresSistema` (array de strings):
       • lista de colores disponibles para elegir,
       • también se usa para definir el color inicial por defecto.


2) Estado local del formulario

   const [nombrePuesto, setNombrePuesto] = useState("");
   const [colorPuesto, setColorPuesto] = useState(coloresSistema[0]);

   - `nombrePuesto`:
       • guarda lo que el usuario escribe en el input de texto,
       • se actualiza en `onChange` del input.

   - `colorPuesto`:
       • guarda el color actualmente seleccionado en la grilla de colores,
       • arranca con el primer color de `coloresSistema`.

   - Cuando se envía el formulario o se cierra el modal, ambos estados se
     resetean para que el modal vuelva a abrirse “limpio” la próxima vez. 


3) handleSubmit: envío del formulario

   const handleSubmit = (e) => {
     e.preventDefault();
     const nombre = nombrePuesto.trim();
     if (!nombre) return;

     onCrear(nombre, colorPuesto);
     setNombrePuesto("");
     setColorPuesto(coloresSistema[0]);
   };

   - `e.preventDefault()`:
       • evita que el formulario haga un submit tradicional (recarga de página).

   - `const nombre = nombrePuesto.trim();`:
       • recorta espacios al inicio y al final del texto.

   - `if (!nombre) return;`:
       • si el nombre queda vacío después del `trim`, no hace nada (no se crea
         un puesto sin nombre).

   - `onCrear(nombre, colorPuesto);`:
       • le pasa los datos al padre,
       • en `VistaAlimentadores`, esto termina llamando a `agregarPuesto`.

   - Luego resetea el estado del formulario:
       • `setNombrePuesto("")`,
       • `setColorPuesto(coloresSistema[0])`.
       • el cierre visual del modal lo hace el padre (en el callback `onCrear`
         normalmente se llama después a `cerrarModal("nuevoPuesto")`). 


4) handleCerrar: cierre manual del modal

   const handleCerrar = () => {
     setNombrePuesto("");
     setColorPuesto(coloresSistema[0]);
     onCerrar();
   };

   - Hace dos cosas:

       1) Limpia el formulario:
           • deja `nombrePuesto` vacío,
           • devuelve `colorPuesto` al primer color del sistema.

       2) Llama a `onCerrar()`:
           • le avisa al padre que debe ocultar este modal.

   - Este handler se usa en el botón “Cancelar”.


5) Renderizado condicional según `abierto`

   if (!abierto) return null;

   - Si `abierto` es false:
       • el componente no dibuja nada,
       • React se comporta como si el modal no existiera en el árbol de
         componentes.

   - Es un patrón típico para modales: el padre solo cambia `abierto` a true
     para “insertar” el modal en la UI. 


6) JSX del modal

   return (
     <div className="alim-modal-overlay">
       <div className="alim-modal alim-modal-sm">
         <h2>Nuevo Puesto</h2>
         <form onSubmit={handleSubmit}>
           ...
         </form>
       </div>
     </div>
   );

   6.1) Overlay

   - `<div className="alim-modal-overlay">`:
       • capa oscura por detrás del cuadro,
       • normalmente ocupa toda la pantalla y centra el modal,
       • los estilos están en `ModalNuevoPuesto.css` / CSS común de modales.

   6.2) Contenedor del modal

   - `<div className="alim-modal alim-modal-sm">`:
       • caja blanca del modal,
       • `alim-modal-sm` indica una versión más chica para este caso puntual.

   6.3) Input de nombre

   - `value={nombrePuesto}` + `onChange={...}`:
       • input controlado por estado,
       • el texto siempre refleja el valor de `nombrePuesto`.

   - `placeholder="Ej: PUESTO 1"`:
       • guía al usuario sobre el tipo de nombre esperado.

   - `autoFocus`:
       • cuando el modal se abre, el cursor se posiciona directamente en este
         campo para escribir sin tener que hacer clic.

   6.4) Selector de color

   {coloresSistema.map((c) => (
     <button
       key={c}
       type="button"
       className={
         "alim-color-swatch" +
         (colorPuesto === c ? " alim-color-swatch-selected" : "")
       }
       style={{ backgroundColor: c }}
       onClick={() => setColorPuesto(c)}
     />
   ))}

   - Recorre `coloresSistema` y genera un botón por color.

   - `className`:
       • todos tienen la clase `"alim-color-swatch"`,
       • el seleccionado agrega `"alim-color-swatch-selected"` para marcarlo
         visualmente.

   - `style={{ backgroundColor: c }}`:
       • pinta el botón con el color real.

   - `type="button"`:
       • importante para que al hacer clic no dispare un submit del formulario.

   - `onClick={() => setColorPuesto(c)}`:
       • al pulsar, se actualiza el color elegido en el estado local.

   6.5) Botones de acción

   - Botón “Cancelar”:
       • `type="button"`,
       • `onClick={handleCerrar}`,
       • solo cierra y resetea el formulario.

   - Botón “Crear”:
       • `type="submit"`,
       • dispara `handleSubmit` vía el `onSubmit` del `<form>`,
       • si el nombre es válido, llama a `onCrear` y limpia el formulario. 


7) Export

   export default ModalNuevoPuesto;

   - Exporta el componente como default para que `VistaAlimentadores` lo use
     como parte de la sección de modales del panel.

---------------------------------------------------------------------------*/