// src/paginas/PaginaAlimentadores/componentes/modales/configuracion/DisplayRegistrosModbus.jsx

import React from "react";                        
import "./DisplayRegistrosModbus.css";            // estilos específicos de la grilla de registros

// Componente reutilizable para mostrar registros Modbus
// Muestra índice, dirección y valor de cada registro leído.
const DisplayRegistrosModbus = ({ registros, titulo = "Registros leídos" }) => {
	if (!registros || registros.length === 0) {
		return null;                                // si no hay registros, no muestra nada
	}

	return (
		<div className="alim-registros-display">
			<h4 className="alim-registros-title">{titulo}</h4>
			<div className="alim-registros-grid">
				{registros.map((reg, idx) => (
					<div key={idx} className="alim-registro-item">
						<span className="alim-registro-label">
							Índice {reg.index} (Dir: {reg.address})
						</span>
						<span className="alim-registro-value">{reg.value}</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default DisplayRegistrosModbus;

{/*---------------------------------------------------------------------------
 NOTA PERSONAL SOBRE ESTE ARCHIVO (DisplayRegistrosModbus.jsx)

 - Este componente es una vista compacta para listar registros Modbus:
   se le pasa un array de objetos `{ index, address, value }` y los dibuja
   en una grilla simple con etiqueta y valor.

 - El `titulo` es opcional y por defecto muestra "Registros leídos", pero
   puede sobreescribirse desde cualquier tab que quiera reutilizar este
   display.

 - Hoy en día las tabs de configuración ya tienen su propia tabla embebida,
   pero este componente queda disponible si quiero mostrar registros en
   otra parte de la app sin duplicar markup ni estilos.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (DisplayRegistrosModbus.jsx)

0) Visión general del componente

   `DisplayRegistrosModbus` es un componente de sólo lectura que recibe una
   lista de registros Modbus ya obtenidos y los muestra en una grilla compacta.

   Cada registro se espera con la forma:
     { index, address, value }

   Sirve como “visor genérico” de lecturas: no hace requests, no decide qué
   leer ni cada cuánto; sólo se ocupa de presentar la información.


1) Props

   const DisplayRegistrosModbus = ({ registros, titulo = "Registros leídos" }) => { ... }

   - `registros`:
       • array de objetos con la info de cada registro,
       • si es `null`, `undefined` o un array vacío, el componente no dibuja
         nada (devuelve `null`).

   - `titulo` (opcional):
       • string que se muestra sobre la grilla,
       • por defecto: `"Registros leídos"`,
       • se puede sobrescribir para contextualizar (ej: "Lectura de prueba", 
         "Última medición", etc.). 


2) Early return cuando no hay registros

   if (!registros || registros.length === 0) {
     return null;
   }

   - Este guard clause evita renderizar el contenedor cuando no hay nada
     que mostrar.

   - Ventajas:
       • no se ocupa espacio en pantalla innecesariamente,
       • simplifica el layout del padre, que no necesita hacer un `if` externo
         sólo para ocultar este bloque.


3) Contenedor principal y título

   return (
     <div className="alim-registros-display">
       <h4 className="alim-registros-title">{titulo}</h4>
       <div className="alim-registros-grid">
         {registros.map((reg, idx) => (
           ...
         ))}
       </div>
     </div>
   );

   - `<div className="alim-registros-display">`:
       • wrapper general del bloque, útil para margen, borde, etc.

   - `<h4 className="alim-registros-title">`:
       • muestra el título que llega por prop,
       • permite darle estilo consistente a todos los visores de registros.

   - `<div className="alim-registros-grid">`:
       • contenedor donde se listan todos los registros,
       • el CSS decide si se ve como lista, grilla, columnas, etc.


4) Render de cada registro

   {registros.map((reg, idx) => (
     <div key={idx} className="alim-registro-item">
       <span className="alim-registro-label">
         Índice {reg.index} (Dir: {reg.address})
       </span>
       <span className="alim-registro-value">{reg.value}</span>
     </div>
   ))}

   - `map((reg, idx) => ...)`:
       • recorre todos los registros recibidos.

   - `key={idx}`:
       • se usa el índice de iteración como key; alcanza porque la lista es
         puramente de lectura y no hay operaciones de reordenar/editar que
         requieran keys estables más complejas.
       • alternativamente, podría usarse `reg.index` si se prefiere.

   - `alim-registro-label`:
       • muestra una descripción corta del registro:
           Índice {reg.index} (Dir: {reg.address})
         donde:
           • `index` suele ser la posición dentro del bloque leído,
           • `address` es la dirección Modbus efectiva.

   - `alim-registro-value`:
       • muestra el valor leído (`reg.value`), tal como lo entrega el backend,
         ya convertido al tipo que se quiera mostrar (número, texto, etc.). 


5) Uso típico dentro de otros componentes

   - Un componente padre (p. ej. una tab de configuración) hace la lectura:

       const registros = await leerRegistrosModbus(...);

     y luego renderiza:

       <DisplayRegistrosModbus
         registros={registros}
         titulo="Resultado del test de conexión"
       />

   - De esta forma:
       • la lógica de red (requests, errores, reintentos) vive en el padre,
       • `DisplayRegistrosModbus` se mantiene como componente “tonto”,
         reutilizable en cualquier parte donde se quieran ver registros
         sin duplicar markup ni estilos.

---------------------------------------------------------------------------*/
