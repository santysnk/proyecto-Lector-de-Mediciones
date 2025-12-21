// src/paginas/PaginaAlimentadores/componentes/modales/ModalEditarPuestos.jsx

import React, { useState, useEffect } from "react";      // React + hooks para estado y efectos
import "./ModalEditarPuestos.css";                       // estilos específicos de este modal
import ColorPickerSimple from "./ColorPickerSimple";     // selector de color minimalista

const ModalEditarPuestos = ({
	abierto,                                              // si es false, el modal no se renderiza
	puestos,                                              // lista original de puestos proveniente del contexto
	onCerrar,                                             // callback para cerrar sin guardar
	onGuardar,                                            // callback que recibe los puestos modificados
	rolGlobal,                                            // rol del usuario para controlar permisos de edición
	// Props de escala por puesto
	obtenerEscalaPuesto,                                  // (puestoId) => number | undefined
	onEscalaPuestoChange,                                 // (puestoId, escala) => void
	ESCALA_MIN = 0.5,
	ESCALA_MAX = 2.0,
}) => {
	const [puestosEditados, setPuestosEditados] = useState([]); // copia editable local

	// Solo superadmin y admin pueden editar nombres y eliminar puestos
	const puedeEditarNombre = rolGlobal === 'superadmin' || rolGlobal === 'admin';

	useEffect(() => {
		if (abierto) {
			// cuando se abre, clono el array de puestos para no mutar el original
			setPuestosEditados(puestos.map((p) => ({ ...p })));
		}
	}, [abierto, puestos]);

	const handleSubmit = () => {
		onGuardar(puestosEditados);                       // devuelvo al caller la versión editada
	};

	const cambiarNombre = (id, nombreNuevo) => {
		// recorro el array y sólo modifico el puesto que coincide por id
		setPuestosEditados((prev) =>
			prev.map((p) => (p.id === id ? { ...p, nombre: nombreNuevo } : p))
		);
	};

	const cambiarColorBoton = (id, colorNuevo) => {
		setPuestosEditados((prev) =>
			prev.map((p) => (p.id === id ? { ...p, color: colorNuevo } : p))
		);
	};

	const cambiarColorFondo = (id, colorNuevo) => {
		setPuestosEditados((prev) =>
			prev.map((p) => (p.id === id ? { ...p, bgColor: colorNuevo } : p))
		);
	};

	const eliminar = (id) => {
		// filtro el puesto con ese id para "borrarlo" de la lista local
		setPuestosEditados((prev) => prev.filter((p) => p.id !== id));
	};

	if (!abierto) return null;                            // si no está abierto, no dibujo nada

	return (
		<div className="editar-fondo-oscuro">
			<div className="editar-contenedor">
				<h2>Editar puestos</h2>

				<div className="editar-lista">
					{puestosEditados.map((p) => (
						<div key={p.id} className="editar-fila">
							<input
								type="text"
								className="editar-nombre"
								value={p.nombre}
								onChange={(e) => cambiarNombre(p.id, e.target.value)} // actualiza nombre en la copia local
								disabled={!puedeEditarNombre}                         // solo admin/superadmin pueden editar nombre
							/>

							<div className="editar-controles">
								<ColorPickerSimple
									color={p.color || "#22c55e"}
									onChange={(newColor) => cambiarColorBoton(p.id, newColor)}
									label="Botón"
								/>

								<ColorPickerSimple
									color={p.bgColor || "#e5e7eb"}
									onChange={(newColor) => cambiarColorFondo(p.id, newColor)}
									label="Fondo"
								/>

								{/* Control de escala por puesto */}
								{obtenerEscalaPuesto && onEscalaPuestoChange && (
									<div className="editar-escala">
										<label className="editar-escala-label">Escala</label>
										<input
											type="number"
											step="0.1"
											min={ESCALA_MIN}
											max={ESCALA_MAX}
											value={obtenerEscalaPuesto(p.id) ?? 1.0}
											onChange={(e) => {
												const valor = parseFloat(e.target.value);
												if (!isNaN(valor) && valor >= ESCALA_MIN && valor <= ESCALA_MAX) {
													onEscalaPuestoChange(p.id, valor);
												}
											}}
											className="editar-escala-input"
										/>
									</div>
								)}

								{/* Solo admin/superadmin pueden eliminar puestos */}
								{puedeEditarNombre && (
									<button
										type="button"
										className="editar-eliminar"
										onClick={() => eliminar(p.id)}             // elimina el puesto de la lista local
									>
										Eliminar
									</button>
								)}
							</div>
						</div>
					))}
				</div>

				<div className="editar-acciones">
					<button
						type="button"
						className="editar-boton editar-cancelar"
						onClick={onCerrar}                                  // cierro sin persistir cambios
					>
						Cancelar
					</button>
					<button
						type="button"
						className="editar-boton editar-guardar"
						onClick={handleSubmit}                              // guardo todos los cambios hechos
					>
						Guardar
					</button>
				</div>
			</div>
		</div>
	);
};

export default ModalEditarPuestos;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (ModalEditarPuestos.jsx)

 - Este modal funciona como un "panel de edición masiva" para todos los puestos:
   permite renombrarlos, cambiar el color del botón y el color de fondo, o
   directamente eliminarlos.

 - Al abrirse (`abierto === true`), clona el array `puestos` en `puestosEditados`
   para trabajar siempre sobre una copia local y no mutar el estado global
   del contexto hasta que realmente aprieto "Guardar".

 - Cada helper (`cambiarNombre`, `cambiarColorBoton`, `cambiarColorFondo`,
   `eliminar`) modifica sólo el puesto indicado buscando por `id` y usando
   funciones de actualización inmutables (`map` / `filter`).

 - Al confirmar, `handleSubmit` llama a `onGuardar(puestosEditados)` y el
   componente padre decide cómo persistir esos cambios (por ejemplo, usando
   `usarPuestos` y guardando en localStorage).

 - Si alguna vez quiero agregar más propiedades editables (por ejemplo, un
   "orden" o una descripción), basta con extender el objeto `p` y agregar
   los campos en esta lista, manteniendo el mismo patrón de edición local.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (ModalEditarPuestos.jsx)

0) Visión general del componente

   `ModalEditarPuestos` es un panel de edición masiva de puestos. Permite:

   - Cambiar el nombre de cada puesto.
   - Cambiar el color del botón del puesto (color principal).
   - Cambiar el color de fondo asociado a ese puesto.
   - Eliminar puestos completos de la lista.

   La gracia es que todo se hace sobre una copia local (`puestosEditados`) y
   recién cuando el usuario pulsa “Guardar” se envían los cambios al exterior.


1) Props del componente

   const ModalEditarPuestos = ({
     abierto,
     puestos,
     onCerrar,
     onGuardar,
   }) => { ... }

   - `abierto` (boolean):
       • Si es false    → el modal no se renderiza (devuelve `null`).
       • Si es true     → se dibuja overlay + contenido del modal.

   - `puestos` (array):
       • Lista de puestos que viene del contexto/global.
       • Cada elemento suele ser algo como:
         { id, nombre, color, bgColor, ... }.

   - `onCerrar()`:
       • Se llama al pulsar “Cancelar” o cuando se quiera cerrar sin guardar.

   - `onGuardar(puestosEditados)`:
       • Recibe la versión editada de la lista de puestos,
       • El padre (VistaAlimentadores / usarPuestos) decide cómo persistirla
         (estado global, localStorage, etc.).


2) Estado local y sincronización al abrir

   const [puestosEditados, setPuestosEditados] = useState([]);

   - `puestosEditados` es una copia editable de `puestos`:
       • Esto evita modificar directamente el array original del contexto.
       • Permite descartar cambios fácilmente si el usuario cancela.

   useEffect(() => {
     if (abierto) {
       setPuestosEditados(puestos.map((p) => ({ ...p })));
     }
   }, [abierto, puestos]);

   - Cuando el modal se abre (`abierto` pasa a true):

       1) Se recorre `puestos` y se crea un nuevo array con copias
          superficiales de cada puesto (`{ ...p }`).
       2) Se guarda en `puestosEditados`.

   - De esta forma:
       • el usuario siempre edita la versión más actual de la lista,
       • y no hay riesgo de mutar accidentalmente el array original.


3) Handlers de actualización

   3.1) handleSubmit

   const handleSubmit = () => {
     onGuardar(puestosEditados);
   };

   - Se ejecuta al pulsar el botón “Guardar”.
   - Entrega la lista `puestosEditados` al exterior.
   - A partir de ahí, el componente padre decide:
       • actualizar el contexto (`actualizarPuestos`),
       • cerrar el modal,
       • y persistir si hace falta.

   3.2) cambiarNombre(id, nombreNuevo)

   - Busca el puesto con ese `id` y actualiza solo su `nombre`:

       setPuestosEditados((prev) =>
         prev.map((p) => p.id === id ? { ...p, nombre: nombreNuevo } : p)
       );

   - Se apoya en:
       • `map` → devuelve un nuevo array,
       • spread `{ ...p, nombre: nombreNuevo }` → respeta inmutabilidad.

   3.3) cambiarColorBoton(id, colorNuevo)

   - Mismo patrón que `cambiarNombre`, pero actualizando `color`.

   3.4) cambiarColorFondo(id, colorNuevo)

   - Mismo patrón, pero actualizando `bgColor`, que es el color de fondo
     del puesto (usado luego en el `<main>` de VistaAlimentadores).

   3.5) eliminar(id)

   - Elimina el puesto con ese `id` de la copia local:

       setPuestosEditados((prev) => prev.filter((p) => p.id !== id));

   - Solo afecta al listado interno del modal; el estado global no se toca
     hasta que se pulsa “Guardar”.


4) Lógica de renderizado condicional

   if (!abierto) return null;

   - Si el modal no está abierto, no se renderiza nada.
   - Esto ahorra trabajo de React y evita que el overlay interfiera con la UI.


5) Estructura JSX del modal

   5.1) Overlay y contenedor

   - `<div className="alim-modal-overlay">`:
       • fondo semitransparente que oscurece la pantalla.

   - `<div className="alim-modal">`:
       • caja blanca centrada donde vive el contenido del modal.

   5.2) Lista editable de puestos

   {puestosEditados.map((p) => (
     <div key={p.id} className="alim-edit-row">
       <input ... value={p.nombre} onChange={(e) => cambiarNombre(...)} />
       ...
       <input type="color" ... value={p.color} onChange={...} />
       <input type="color" ... value={p.bgColor || "#e5e7eb"} onChange={...} />
       <button onClick={() => eliminar(p.id)}>Eliminar</button>
     </div>
   ))}

   - Por cada puesto se dibuja una fila con:

       • Input de texto para el nombre:
           - enlazado a `p.nombre`,
           - cualquier cambio llama a `cambiarNombre`.

       • Dos “pickers” de color:
           - uno para el color del botón (`p.color`),
           - otro para el color de fondo (`p.bgColor` o gris claro por defecto).
           - ambos actualizan la copia local por medio de sus handlers.

       • Botón “Eliminar”:
           - quita el puesto de `puestosEditados`.
           - la eliminación real se consolida solo si se pulsa “Guardar”.

   5.3) Botones de acción

   - Botón “Cancelar”:
       • type="button",
       • llama a `onCerrar`,
       • descarta cualquier cambio hecho desde que se abrió el modal.

   - Botón “Guardar”:
       • type="button",
       • llama a `handleSubmit`,
       • envía `puestosEditados` al padre para que los persista.

---------------------------------------------------------------------------*/