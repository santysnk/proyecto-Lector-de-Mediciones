// src/paginas/PaginaAlimentadores/componentes/tarjetas/GrupoMedidores.jsx

import React from "react"; 

/**
 * Renderiza un grupo de cajas de medición (parte superior o inferior).
 */
const GrupoMedidores = ({ titulo, boxes, zona, renderizarCaja, estiloTitulo, gap }) => {     // zona: "sup" o "inf"
	// Estilo del contenedor de boxes (gap dinámico)
	const estiloMeters = gap ? { gap } : {};

	return (
		<div className="alim-card-section">
			<h3
				className="alim-card-section-title"
				style={estiloTitulo || {}}
			>{titulo}</h3>            {/* título del bloque (ej: CONSUMO, TENSIÓN) */}
			<div
				className="alim-card-meters"
				style={Object.keys(estiloMeters).length > 0 ? estiloMeters : undefined}
			>
				{boxes.map((box, idx) => renderizarCaja(box, idx, zona))}     {/* delega el render de cada CajaMedicion */}
			</div>
		</div>
	);
};

export default GrupoMedidores;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (GrupoMedidores.jsx)

 - Este componente es un contenedor: solo recibe `titulo`, `boxes` y una
   función `renderizarCaja` y se encarga de ordenarlos dentro del layout de la
   tarjeta (`alim-card-section` / `alim-card-meters`).

 - La prop `zona` sirve para que el renderizador de cajas sepa si está dibujando
   la parte superior ("sup") o inferior ("inf") de la tarjeta.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (GrupoMedidores.jsx)

0) Visión general del componente

   `GrupoMedidores` es un componente muy simple que actúa como contenedor de un
   bloque de mediciones dentro de la tarjeta de alimentador.

   Podés verlo como “la fila” que contiene:
     - un título (por ejemplo: “CONSUMO (A)” o “TENSIÓN (kV)”),
     - una serie de cajas de medición (`CajaMedicion`) ordenadas en una línea.

   No sabe de dónde vienen los datos ni cómo se dibuja cada caja; solo recibe
   todo por props y lo coloca en el layout correcto.


1) Props del componente

   const GrupoMedidores = ({ titulo, boxes, zona, renderizarCaja }) => { ... }

   - `titulo` (string):
       • texto que se muestra arriba del grupo,
       • ejemplos: “CONSUMO (A)”, “TENSIÓN (kV)”, “POTENCIAS”, etc.

   - `boxes` (array):
       • lista de objetos de caja ya normalizados,
       • típicamente cada `box` tiene:
           - `etiqueta`  → texto de cabecera de la caja,
           - `valor`     → valor a mostrar,
           - `enabled`   → si está activa o no,
           - `origen`    → de dónde viene la medición (relé / analizador).

       • Este componente NO modifica ni interpreta ese contenido,
         solo los recorre para dibujarlos.

   - `zona` (string):
       • indica si este grupo pertenece a:
           - "sup" → parte superior de la tarjeta,
           - "inf" → parte inferior de la tarjeta.
       • Se le pasa al renderizador de cajas para que pueda ajustar estilos/
         lógica según la zona si es necesario.

   - `renderizarCaja` (función):
       • función que sabe cómo transformar `{ box, idx, zona }` en un elemento
         React (normalmente una `CajaMedicion`).
       • Firma típica: `(box, idx, zona) => <CajaMedicion ... />`
       • La idea es que `GrupoMedidores` no tenga que conocer los detalles de
         `CajaMedicion`; solo delega el trabajo.


2) JSX del componente

   return (
     <div className="alim-card-section">
       <h3 className="alim-card-section-title">{titulo}</h3>
       <div className="alim-card-meters">
         {boxes.map((box, idx) => renderizarCaja(box, idx, zona))}
       </div>
     </div>
   );

   2.1) Contenedor principal

   - `<div className="alim-card-section">`:
       • envuelve todo el bloque (título + cajas),
       • la clase se usa en CSS para dar márgenes, separación vertical, etc.

   2.2) Título de la sección

   - `<h3 className="alim-card-section-title">{titulo}</h3>`:
       • muestra el título que se pasó por props,
       • sirve como encabezado visual del grupo de medidores.

   2.3) Contenedor de cajas

   - `<div className="alim-card-meters">`:
       • contenedor donde se colocan las cajas de medición,
       • normalmente se renderizan en fila o grilla según el CSS.

   - `{boxes.map((box, idx) => renderizarCaja(box, idx, zona))}`:
       • recorre el array `boxes`,
       • por cada elemento llama a `renderizarCaja(box, idx, zona)`,
       • `renderizarCaja` devuelve el JSX de la caja (por ejemplo, `CajaMedicion`),
       • de esta forma:
           - `GrupoMedidores` no está atado a un tipo de caja específico,
           - solo se encarga de “invocar” al renderizador en el orden correcto.


3) Export

   export default GrupoMedidores;

   - Exporta el componente para ser usado dentro de `TarjetaAlimentador`.
   - La tarjeta crea los objetos `sup` e `inf` (con `titulo` y `boxes`) y
     luego se los pasa a `GrupoMedidores` para que los dibuje.

---------------------------------------------------------------------------*/