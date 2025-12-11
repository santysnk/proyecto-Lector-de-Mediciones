// src/paginas/PaginaAlimentadores/componentes/tarjetas/GrillaTarjetas.jsx

import React from "react";
import TarjetaAlimentador from "./TarjetaAlimentador.jsx"; // tarjeta individual de alimentador
import GapResizer from "./GapResizer.jsx";                 // control para ajustar espaciado entre tarjetas
import "./GrillaTarjetas.css";                             // estilos de la grilla + tarjeta "+" de nuevo

/**
 * Grilla de tarjetas de alimentadores.
 * Maneja el display de tarjetas y la tarjeta de agregar nuevo.
 */
const GrillaTarjetas = ({
	alimentadores,                     // lista de alimentadores del puesto actual
	lecturas,                          // mapa { alimId: { parteSuperior, parteInferior } }
	puestoId,                          // id del puesto al que pertenecen
	elementoArrastrandoId,            // id del alimentador que se está arrastrando (o null)
	onAbrirConfiguracion,             // callback para abrir modal de configuración
	onAbrirMapeo,                     // callback para abrir modal de mapeo
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	onDropAlFinal,                    // callback cuando se suelta en la tarjeta "mover al final"
	onAgregarNuevo,                   // callback para crear un nuevo registrador
	estaMidiendo,                     // función (alimId, equipo) => boolean
	obtenerTimestampInicio,           // función (alimId, equipo) => timestamp
	obtenerContadorLecturas,          // función (alimId, equipo) => número de lecturas
	gapTarjetas,                      // gap en px entre tarjetas
	onGapChange,                      // función (nuevoGap) para cambiar el gap
}) => {
	// Determinar si mostrar el resizer (solo después de la primera tarjeta, no durante drag & drop)
	const mostrarResizer = !elementoArrastrandoId && alimentadores.length > 1;

	return (
		<div
			className="alim-cards-grid"
			style={{
				rowGap: "20px" // gap vertical fijo entre filas
			}}
		>
			{alimentadores.map((alim, index) => {
				const lecturasAlim = lecturas[alim.id] || {};                 // lecturas calculadas para este alimentador
				const mideRele = estaMidiendo(alim.id, "rele");               // estado de medición del relé
				const mideAnalizador = estaMidiendo(alim.id, "analizador");   // estado de medición del analizador

				// Mostrar GapResizer solo después de la primera tarjeta
				const esPrimeraTarjeta = index === 0;

				return (
					<React.Fragment key={alim.id}>
						<TarjetaAlimentador
							nombre={alim.nombre}
							color={alim.color}
							onConfigClick={() => onAbrirConfiguracion(puestoId, alim)}
							onMapClick={() => onAbrirMapeo(puestoId, alim)}
							topSide={lecturasAlim.parteSuperior}
							bottomSide={lecturasAlim.parteInferior}
							draggable={true}
							isDragging={elementoArrastrandoId === alim.id}
							onDragStart={() => onDragStart(alim.id)}
							onDragOver={onDragOver}
							onDrop={(e) => {
								e.preventDefault();
								onDrop(alim.id);
							}}
							onDragEnd={onDragEnd}
							mideRele={mideRele}
							mideAnalizador={mideAnalizador}
							periodoRele={alim.periodoSegundos || 60}
							periodoAnalizador={alim.analizador?.periodoSegundos || 60}
							timestampInicioRele={obtenerTimestampInicio(alim.id, "rele")}
							timestampInicioAnalizador={obtenerTimestampInicio(
								alim.id,
								"analizador"
							)}
							contadorRele={obtenerContadorLecturas(alim.id, "rele")}
							contadorAnalizador={obtenerContadorLecturas(
								alim.id,
								"analizador"
							)}
						/>
						{/* Temporalmente deshabilitado para probar drag & drop
						{mostrarResizer && esPrimeraTarjeta && (
							<GapResizer
								gap={gapTarjetas}
								onGapChange={onGapChange}
							/>
						)}
						*/}
					</React.Fragment>
				);
			})}

			{elementoArrastrandoId ? (
				// Área de drop especial para mandar una tarjeta al final del listado
				<div
					className="alim-card-add"
					onDragOver={onDragOver}
					onDrop={(e) => {
						e.preventDefault();
						onDropAlFinal();
					}}
				>
					<span
						style={{
							textAlign: "center",
							padding: "1rem",
						}}
					>
						Soltar aquí para mover al final
					</span>
				</div>
			) : (
				// Tarjeta "+" para crear un nuevo registrador
				<div className="alim-card-add" onClick={onAgregarNuevo}>
					<span className="alim-card-add-plus">+</span>
					<span className="alim-card-add-text">Nuevo Registrador</span>
				</div>
			)}
		</div>
	);
};

export default GrillaTarjetas;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (GrillaTarjetas.jsx)

 - Este componente se encarga de recorrer la lista de `alimentadores` del puesto
   actual y dibujar una `TarjetaAlimentador` para cada uno, pasándole lecturas,
   estado de medición y props de drag & drop.

 - Además, al final de la grilla agrega una tarjeta especial:
   * Si hay un elemento arrastrándose (`elementoArrastrandoId`), muestra un área
     de drop con el mensaje "Soltar aquí para mover al final".
   * Si no hay drag activo, muestra la tarjeta "+" para crear un nuevo registrador.

 - De esta forma la lógica de layout de tarjetas queda concentrada acá y la
   tarjeta individual (`TarjetaAlimentador`) se mantiene enfocada solo en su
   propio contenido y aspecto.
---------------------------------------------------------------------------*/}

;

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (GrillaTarjetas.jsx)

0) Visión general del componente

   `GrillaTarjetas` es el componente que organiza visualmente todas las tarjetas
   de alimentadores de un puesto.

   - Se encarga de:
       • recorrer la lista de `alimentadores`,
       • crear una `TarjetaAlimentador` por cada uno,
       • pasarle lecturas y estado de medición,
       • manejar el soporte de drag & drop,
       • y mostrar al final:
           - o un área de “soltar para mover al final” (cuando hay drag activo),
           - o la tarjeta “+ Nuevo Registrador” (cuando no hay drag).


1) Props principales

   const GrillaTarjetas = ({
     alimentadores,
     lecturas,
     puestoId,
     elementoArrastrandoId,
     onAbrirConfiguracion,
     onAbrirMapeo,
     onDragStart,
     onDragOver,
     onDrop,
     onDragEnd,
     onDropAlFinal,
     onAgregarNuevo,
     estaMidiendo,
     obtenerTimestampInicio,
     obtenerContadorLecturas,
   }) => { ... }

   - `alimentadores`:
       • array con los alimentadores del puesto seleccionado,
       • cada elemento incluye datos como id, nombre, color, config de relé/analizador, etc.

   - `lecturas`:
       • objeto con la forma:
           { [alimId]: { parteSuperior, parteInferior } }
       • viene ya procesado desde el contexto (`lecturasTarjetas`),
       • cada lado (`parteSuperior` / `parteInferior`) trae título y lista de cajas.

   - `puestoId`:
       • id del puesto actual,
       • se pasa a los callbacks de configuración/mapeo para saber a qué puesto pertenece el alimentador.

   - `elementoArrastrandoId`:
       • id del alimentador que se está arrastrando en este momento,
       • si es `null`, no hay drag activo.

   - Callbacks de interacción:
       • `onAbrirConfiguracion(puestoId, alimentador)`:
           - abre el modal de configuración del registrador.

       • `onAbrirMapeo(puestoId, alimentador)`:
           - abre el modal de mapeo de mediciones.

       • `onDragStart(alimId)`, `onDragOver`, `onDrop(alimId)`, `onDragEnd`:
           - funciones que vienen del hook de drag & drop y de la vista padre.

       • `onDropAlFinal()`:
           - se llama cuando se suelta una tarjeta en el área “mover al final”.

       • `onAgregarNuevo()`:
           - se llama al hacer clic en la tarjeta “+ Nuevo Registrador”.

   - Funciones de medición:
       • `estaMidiendo(alimId, equipo)`:
           - devuelve true/false según si el alimentador/equipo está midiendo.

       • `obtenerTimestampInicio(alimId, equipo)`:
           - timestamp de la última medición (reservado para futuras animaciones).

       • `obtenerContadorLecturas(alimId, equipo)`:
           - cuántas lecturas se hicieron desde que se inició la medición.


2) Render principal de la grilla

   return (
     <div className="alim-cards-grid">
       {alimentadores.map((alim) => { ... return <TarjetaAlimentador ... /> })}
       {elementoArrastrandoId ? ( ... ) : ( ... )}
     </div>
   );

   - El contenedor principal es un `<div>` con clase `"alim-cards-grid"`.

   - Dentro, primero se pintan todas las tarjetas de alimentadores.

   - Luego, se pinta:
       • el área de drop para “mover al final” si hay drag activo,
       • o la tarjeta “+” si no lo hay.


3) Mapeo de alimentadores → TarjetaAlimentador

   {alimentadores.map((alim) => {
     const lecturasAlim = lecturas[alim.id] || {};
     const mideRele = estaMidiendo(alim.id, "rele");
     const mideAnalizador = estaMidiendo(alim.id, "analizador");

     return (
       <TarjetaAlimentador
         key={alim.id}
         nombre={alim.nombre}
         color={alim.color}
         onConfigClick={() => onAbrirConfiguracion(puestoId, alim)}
         onMapClick={() => onAbrirMapeo(puestoId, alim)}
         topSide={lecturasAlim.parteSuperior}
         bottomSide={lecturasAlim.parteInferior}
         draggable={true}
         isDragging={elementoArrastrandoId === alim.id}
         onDragStart={() => onDragStart(alim.id)}
         onDragOver={onDragOver}
         onDrop={() => onDrop(alim.id)}
         onDragEnd={onDragEnd}
         mideRele={mideRele}
         mideAnalizador={mideAnalizador}
         periodoRele={alim.periodoSegundos || 60}
         periodoAnalizador={alim.analizador?.periodoSegundos || 60}
         timestampInicioRele={obtenerTimestampInicio(alim.id, "rele")}
         timestampInicioAnalizador={obtenerTimestampInicio(alim.id, "analizador")}
         contadorRele={obtenerContadorLecturas(alim.id, "rele")}
         contadorAnalizador={obtenerContadorLecturas(alim.id, "analizador")}
       />
     );
   })}

   - `lecturasAlim`:
       • se extrae `lecturas[alim.id]` o `{}` si no hay lecturas aún.

   - `mideRele` / `mideAnalizador`:
       • se calculan consultando el contexto via `estaMidiendo`.

   - Props clave que se pasan a `TarjetaAlimentador`:

       • Identidad y apariencia:
           - `key={alim.id}`: clave única para React.
           - `nombre={alim.nombre}` y `color={alim.color}`.

       • Acciones:
           - `onConfigClick` y `onMapClick`:
               · envuelven los callbacks de la vista para pasar puesto + alimentador.

       • Diseño/lecturas:
           - `topSide={lecturasAlim.parteSuperior}`,
           - `bottomSide={lecturasAlim.parteInferior}`.

       • Drag & drop:
           - `draggable={true}`: permite arrastrar la tarjeta.
           - `isDragging={elementoArrastrandoId === alim.id}`:
               · true si esta es la tarjeta actualmente en movimiento.
           - `onDragStart={() => onDragStart(alim.id)}`:
               · marca qué tarjeta se empezó a arrastrar.
           - `onDragOver={onDragOver}`, `onDrop={() => onDrop(alim.id)}`,
             `onDragEnd={onDragEnd}`:
               · se delegan al hook de drag & drop enlazado en la vista.

       • Estado de medición:
           - `mideRele`, `mideAnalizador`:
               · booleans para estilos y animaciones.

           - `periodoRele`, `periodoAnalizador`:
               · se obtienen de la config del alimentador o 60s por defecto.

           - `timestampInicioRele`, `timestampInicioAnalizador`:
               · se pasan por si se usan en animaciones/indicadores.
					
           - `contadorRele`, `contadorAnalizador`:
               · se usan dentro de `TarjetaAlimentador` / `CajaMedicion`
                 para reiniciar animaciones cuando llegan nuevas lecturas.


4) Tarjeta final: drop para “mover al final” o “Nuevo Registrador”

   {elementoArrastrandoId ? (
     <div
       className="alim-card-add"
       onDragOver={onDragOver}
       onDrop={onDropAlFinal}
     >
       <span style={{ textAlign: "center", padding: "1rem" }}>
         Soltar aquí para mover al final
       </span>
     </div>
   ) : (
     <div className="alim-card-add" onClick={onAgregarNuevo}>
       <span className="alim-card-add-plus">+</span>
       <span className="alim-card-add-text">Nuevo Registrador</span>
     </div>
   )}

   - Si `elementoArrastrandoId` tiene un valor (hay tarjeta en drag):

       • se muestra un `<div className="alim-card-add">` que funciona como zona
         de drop especial.

       • `onDragOver={onDragOver}`:
           - permite que la tarjeta se pueda soltar encima.

       • `onDrop={onDropAlFinal}`:
           - cuando se suelta, la vista calcula el nuevo orden moviendo
             ese alimentador al final de la lista.

       • Texto:
           - “Soltar aquí para mover al final”.

   - Si NO hay drag activo (`elementoArrastrandoId` es null):

       • se dibuja la tarjeta "+" clásica para crear un nuevo registrador.

       • `onClick={onAgregarNuevo}`:
           - dispara la acción que abre el modal de alta de alimentador.


5) Export

   export default GrillaTarjetas;

   - Se exporta como componente por defecto para que `VistaAlimentadores`
     lo utilice como cuerpo principal de la sección de tarjetas.

---------------------------------------------------------------------------*/