// src/paginas/PaginaAlimentadores/componentes/tarjetas/CajaMedicion.jsx

import React from "react";

/**
 * Formatea un valor según la cantidad de decimales configurada.
 * Solo afecta a valores numéricos, no modifica el valor interno.
 * @param {string} valor - Valor original (puede ser "--,--" o número con coma)
 * @param {number} decimales - Cantidad de decimales a mostrar (0, 1 o 2)
 */
const formatearValorConDecimales = (valor, decimales) => {
	// Si no se especifica decimales, usar 2 por defecto
	if (decimales === undefined || decimales === null) return valor;

	// Si es placeholder, ajustar según decimales
	if (valor === "--,--" || valor === "--" || valor === "--,-") {
		if (decimales === 0) return "--";
		if (decimales === 1) return "--,-";
		return "--,--";
	}

	// Convertir coma a punto para parsear
	const numStr = String(valor).replace(",", ".");
	const num = parseFloat(numStr);
	if (isNaN(num)) return valor;

	return num.toFixed(decimales).replace(".", ",");
};

/**
 * Caja individual de medición con su animación de borde y valor.
 */
const CajaMedicion = ({
	box,                              // { etiqueta, valor, enabled, origen }
	indice,                           // posición dentro del grupo (0..3)
	zona,                             // "sup" o "inf" para identificar el lado
	mideRele,                         // indica si la medición de relé está activa
	mideAnalizador,                   // indica si la medición de analizador está activa
	mostrarProgresoRele,              // activa animación de borde para relé
	mostrarProgresoAnalizador,        // activa animación de borde para analizador
	periodoRele,                      // periodo configurado (segundos) para relé
	periodoAnalizador,                // periodo configurado (segundos) para analizador
	contadorRele,                     // cuántas lecturas se hicieron para relé
	contadorAnalizador,               // cuántas lecturas se hicieron para analizador
	// Polling de lecturas desde BD
	estaPolling = false,              // indica si hay polling activo
	mostrarProgresoPolling = false,   // activa animación de borde para polling
	periodoPolling = 60,              // periodo de polling en segundos
	contadorPolling = 0,              // cuántas lecturas se hicieron durante polling
	// Error de polling
	tieneError = false,               // indica si hay error de lectura
	// Estilos globales del box
	estilosBox = null,                // { tituloBox, valorBox, box }
}) => {
	const esDelRele = box.origen === "rele" || !box.origen;       // si no se especifica origen, asumimos relé
	const esDelAnalizador = box.origen === "analizador";

	// ===== MODO POLLING (tiene prioridad cuando está activo) =====
	// En modo polling, todas las cajas habilitadas muestran animación
	const pollingActivo = estaPolling && box.enabled;
	const progresoPollingHabilitado = pollingActivo && mostrarProgresoPolling;

	// ===== MODO MEDICIÓN TRADICIONAL (rele/analizador) =====
	const medicionActiva =
		!estaPolling &&                                            // solo si NO hay polling activo
		box.enabled &&                                             // la caja debe estar habilitada
		((esDelRele && mideRele) || (esDelAnalizador && mideAnalizador)); // y el equipo correspondiente debe estar midiendo

	const progresoTradicionalHabilitado =
		(esDelRele && mostrarProgresoRele) ||
		(esDelAnalizador && mostrarProgresoAnalizador);            // control global de cuándo mostrar borde animado

	// ===== DECIDIR QUÉ ANIMACIÓN USAR =====
	// Prioridad: polling > medición tradicional
	let duracionAnimacion;
	let contadorLecturas;
	let propiedadDuracion;
	let usarAnimacion = false;

	if (pollingActivo && progresoPollingHabilitado) {
		// Usar animación de polling (reutiliza el CSS de relé)
		duracionAnimacion = periodoPolling;
		contadorLecturas = contadorPolling;
		propiedadDuracion = "--rw-progress-duration-rele";          // reutiliza la animación del relé
		usarAnimacion = true;
	} else if (medicionActiva && progresoTradicionalHabilitado) {
		// Usar animación tradicional
		duracionAnimacion = esDelAnalizador ? periodoAnalizador : periodoRele;
		contadorLecturas = esDelAnalizador ? contadorAnalizador : contadorRele;
		propiedadDuracion = esDelRele
			? "--rw-progress-duration-rele"
			: "--rw-progress-duration-analizador";
		usarAnimacion = true;
	} else {
		// Sin animación
		duracionAnimacion = 60;
		contadorLecturas = 0;
		propiedadDuracion = "--rw-progress-duration-rele";
	}

	const equipo = pollingActivo ? "polling" : (esDelAnalizador ? "analizador" : "rele");

	let clasesValor = "alim-card-meter-value";                    // clase base del valor

	// TEMPORALMENTE DESACTIVADO: animación de borde en el box
	// Se usa la barra de progreso horizontal en su lugar
	// if (usarAnimacion && !tieneError) {
	// 	if (pollingActivo || esDelRele) {
	// 		clasesValor += " alim-meter-progress-rele";
	// 	} else if (esDelAnalizador) {
	// 		clasesValor += " alim-meter-progress-analizador";
	// 	}
	// }

	// si hay error, agregar clase de error
	if (tieneError && box.enabled) {
		clasesValor += " alim-card-meter-value--error";
	}

	// Key que incluye el contador de lecturas para reiniciar animación
	const claveValor = `${zona}-${indice}-${equipo}-c${contadorLecturas}`;

	// Determinar qué valor mostrar (aplicando formato de decimales)
	const decimalesConfig = estilosBox?.valorBox?.decimales;
	let valorMostrar = box.valor ?? "--,--";
	if (tieneError && box.enabled) {
		valorMostrar = "ERROR";
	} else {
		valorMostrar = formatearValorConDecimales(valorMostrar, decimalesConfig);
	}

	// Construir estilos del título del box (etiqueta como R, S, T)
	const estiloTituloBox = estilosBox?.tituloBox ? {
		fontFamily: estilosBox.tituloBox.fontFamily,
		fontSize: estilosBox.tituloBox.fontSize,
	} : {};

	// Construir estilos del valor del box (número) - ahora con tamaño fijo y overflow
	const boxHeight = estilosBox?.box?.height;
	const estiloValorBase = {
		...(estilosBox?.valorBox ? {
			fontFamily: estilosBox.valorBox.fontFamily,
			fontSize: estilosBox.valorBox.fontSize,
			color: estilosBox.valorBox.color,
		} : {}),
		// El box ahora tiene tamaño fijo, el texto se recorta si no cabe
		width: "100%",
		...(boxHeight && boxHeight !== "auto" ? { height: boxHeight } : {}),
		overflow: "hidden",
		textOverflow: "ellipsis",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	};

	// Combinar con estilos de animación si corresponde
	const estiloValor = usarAnimacion && !tieneError
		? {
			...estiloValorBase,
			[propiedadDuracion]: `${duracionAnimacion}s`,
		}
		: estiloValorBase;

	// Estilos del contenedor del box (ancho fijo)
	const estiloMeter = estilosBox?.box?.width ? {
		width: estilosBox.box.width,
		flex: `0 0 ${estilosBox.box.width}`,
	} : {};

	return (
		<div
			key={`${zona}-${indice}`}
			className="alim-card-meter"
			style={Object.keys(estiloMeter).length > 0 ? estiloMeter : undefined}
		>
			<span
				className="alim-card-meter-phase"
				style={estiloTituloBox}
			>
				{box.etiqueta}
			</span>
			<span
				key={claveValor}
				className={clasesValor}
				style={Object.keys(estiloValor).length > 0 ? estiloValor : undefined}
			>
				{valorMostrar}
			</span>
		</div>
	);
};

export default CajaMedicion;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (CajaMedicion.jsx)

 - Representa un único “display” de la tarjeta (por ejemplo, fase R de corriente),
   encargado de mostrar etiqueta, valor y, opcionalmente, el borde de progreso.

 - `box.origen` decide si la caja pertenece al relé o al analizador; si no se
   indica, se asume relé por defecto.

 - El par `medicionActiva` + `progresoHabilitado` controla cuándo se aplica la
   clase de borde animado: solo si la caja está habilitada y el equipo está
   midiendo (y la vista decidió mostrar progreso).

 - La key `claveValor` incluye el contador de lecturas para que React vuelva a
   montar el span del valor cuando llegue una nueva lectura, reiniciando así la
   animación de borde.

 - `propiedadDuracion` permite ajustar la duración de la animación vía variable
   CSS diferente para relé y analizador.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (CajaMedicion.jsx)

0) Visión general del componente

   `CajaMedicion` es el “display” individual dentro de la tarjeta:

   - Muestra:
       • una etiqueta (ej: "R", "S", "T" o un nombre personalizado),
       • un valor numérico o placeholder (`"--,--"`).

   - Opcionalmente dibuja una animación de borde alrededor del valor para indicar
     el progreso del período de medición (tipo “barra de progreso circular”):

       • puede representar el período del relé,
       • o el del analizador, según el origen definido en la caja.


1) Props y rol de cada una

   const CajaMedicion = ({
     box,
     indice,
     zona,
     mideRele,
     mideAnalizador,
     mostrarProgresoRele,
     mostrarProgresoAnalizador,
     periodoRele,
     periodoAnalizador,
     contadorRele,
     contadorAnalizador,
   }) => { ... }

   - `box`:
       • objeto con la configuración de esta caja:
           - `box.etiqueta`  → texto a mostrar encima del valor,
           - `box.valor`     → lectura procesada (como string),
           - `box.enabled`   → si la caja está habilitada para mostrar medición,
           - `box.origen`    → `"rele"`, `"analizador"` o `undefined`:
               · si es `"rele"`, la caja depende del relé,
               · si es `"analizador"`, depende del analizador,
               · si no se indica, se asume relé por defecto.

   - `indice`:
       • posición dentro del grupo de cajas (0, 1, 2 o 3),
       • se usa para construir keys únicas.

   - `zona`:
       • indica si esta caja está en la parte:
           - `"sup"` → bloque superior de la tarjeta,
           - `"inf"` → bloque inferior.
       • también participa en la generación de keys.

   - `mideRele` / `mideAnalizador`:
       • booleans que indican si hay mediciones activas para cada equipo.
       • vienen del contexto y reflejan el estado real de los timers.

   - `mostrarProgresoRele` / `mostrarProgresoAnalizador`:
       • booleans que controlan si se debe animar el borde para cada equipo.
       • los gestiona `TarjetaAlimentador` según si ya hubo lecturas, etc.

   - `periodoRele` / `periodoAnalizador`:
       • duración del ciclo de actualización en segundos,
       • se usan para ajustar la velocidad de la animación del borde.

   - `contadorRele` / `contadorAnalizador`:
       • se incrementan en cada lectura,
       • sirven para forzar el reinicio de la animación cuando llega un nuevo set
         de datos (usando la key).


2) Banderas de origen: esDelRele / esDelAnalizador

   const esDelRele = box.origen === "rele" || !box.origen;
   const esDelAnalizador = box.origen === "analizador";

   - `esDelRele`:
       • es true si `box.origen` es `"rele"`,
       • o si `box.origen` no está definido (`!box.origen`),
       • en otras palabras: si no se aclara, asumimos relé como origen por defecto.

   - `esDelAnalizador`:
       • true solo si `box.origen === "analizador"`.

   - Esto permite que la misma caja se integre a la lógica de:
       • mediciones y animaciones del relé,
       • o del analizador,
       • sin mezclar ambas cosas a la vez.


3) Determinar si la medición está activa en esta caja

   const medicionActiva =
     box.enabled &&
     ((esDelRele && mideRele) || (esDelAnalizador && mideAnalizador));

   - La caja solo debe considerarse “activa” si se cumplen dos condiciones:

       1) `box.enabled` es true:
           • el mapeo habilitó esta caja (se decidió usarla).

       2) El equipo correspondiente está midiendo:
           • si la caja es del relé → se requiere `mideRele === true`,
           • si es del analizador → se requiere `mideAnalizador === true`.

   - Si cualquiera de estas condiciones falla:
       • `medicionActiva` será false,
       • no se mostrará animación de progreso.


4) Control de progreso: progresoHabilitado

   const progresoHabilitado =
     (esDelRele && mostrarProgresoRele) ||
     (esDelAnalizador && mostrarProgresoAnalizador);

   - Esta bandera no mira solo el estado de medición, sino la decisión de la vista
     sobre si debe mostrarse la animación en este momento.

   - Resumen:

       • Para cajas de relé:
             `esDelRele && mostrarProgresoRele`

       • Para cajas de analizador:
             `esDelAnalizador && mostrarProgresoAnalizador`

   - `mostrarProgresoRele` / `mostrarProgresoAnalizador` los maneja
     `TarjetaAlimentador` usando contadores de lecturas:
       • se activan cuando llega al menos una lectura,
       • se apagan si se detiene la medición o se cambia de puesto.


5) Equipo, duración y contador de lecturas

   const equipo = esDelAnalizador ? "analizador" : "rele";

   - Texto de conveniencia para identificar a cuál equipo está asociada la caja.

   const duracionAnimacion = esDelAnalizador
     ? periodoAnalizador
     : periodoRele;

   - “Cuánto dura” el ciclo de animación del borde:
       • si la caja es del analizador → usa `periodoAnalizador`,
       • si no → usa `periodoRele`.

   const contadorLecturas = esDelAnalizador
     ? contadorAnalizador
     : contadorRele;

   - Se elige el contador que corresponde al equipo de esta caja:

       • analizador → `contadorAnalizador`,
       • relé       → `contadorRele`.

   - Este valor se usará después para generar una key única y provocar que
     React remonte el elemento cuando cambie (reiniciando la animación).


6) Construcción de clases CSS para el valor

   let clasesValor = "alim-card-meter-value";

   if (medicionActiva && progresoHabilitado) {
     if (esDelRele) {
       clasesValor += " alim-meter-progress-rele";
     } else if (esDelAnalizador) {
       clasesValor += " alim-meter-progress-analizador";
     }
   }

   - Siempre partimos de la clase base `"alim-card-meter-value"`.

   - Si la medición está activa y el progreso está habilitado:

       • para cajas del relé:
           - se agrega `"alim-meter-progress-rele"`.

       • para cajas del analizador:
           - se agrega `"alim-meter-progress-analizador"`.

   - Estas clases extra son las que el CSS usa para dibujar el borde animado,
     usando las variables `--rw-progress-duration-rele` o
     `--rw-progress-duration-analizador`.


7) Key para reiniciar animación y variable CSS de duración

   const claveValor = `${zona}-${indice}-${equipo}-c${contadorLecturas}`;

   - Esta key se aplica al `<span>` que muestra el valor:

       • incluye:
           - `zona` (sup/inf),
           - `indice` dentro del grupo,
           - `equipo` ("rele"/"analizador"),
           - `contadorLecturas`.

   - Cuando `contadorLecturas` cambia (ej: llega una nueva lectura):

       • la key cambia,
       • React desmonta y vuelve a montar el `<span>`,
       • y la animación CSS se reinicia desde cero.

   const propiedadDuracion = esDelRele
     ? "--rw-progress-duration-rele"
     : "--rw-progress-duration-analizador";

   - Esta string representa el nombre de la variable CSS que controla 
     la duración de la animación:

       • para cajas del relé → `"--rw-progress-duration-rele"`,
       • para cajas del analizador → `"--rw-progress-duration-analizador"`.


8) JSX final

   return (
     <div key={`${zona}-${indice}`} className="alim-card-meter">
       <span className="alim-card-meter-phase">{box.etiqueta}</span>
       <span
         key={claveValor}
         className={clasesValor}
         style={
           medicionActiva && progresoHabilitado
             ? { [propiedadDuracion]: `${duracionAnimacion}s` }
             : undefined
         }
       >
         {box.valor ?? "--,--"}
       </span>
     </div>
   );

   - Contenedor de la caja:
       • `<div className="alim-card-meter">` agrupa etiqueta y valor.
       • usa `key={`${zona}-${indice`}` para identificar la caja dentro del
         grupo de `GrupoMedidores`.

   - Etiqueta:
       • `<span className="alim-card-meter-phase">{box.etiqueta}</span>`
       • muestra el texto configurado (ej: R, S, T, “Promedio”, etc.).

   - Valor:
       • `<span key={claveValor} className={clasesValor} ...>`
       • `key={claveValor}`:
           - se apoya en el contador de lecturas para reiniciar animación.
       • `className={clasesValor}`:
           - incluye o no las clases de animación según corresponda.
       • `style={ ... }`:
           - si la medición está activa y el progreso habilitado, se pasa
             un objeto con la variable CSS `[propiedadDuracion]` ajustada
             a `${duracionAnimacion}s`.
           - si no, `style` queda `undefined` y no se aplica ningún override.

       • `{box.valor ?? "--,--"}`:
           - muestra `box.valor` si está definido,
           - si viene `null` o `undefined`, muestra `"--,--"` como placeholder.


9) Export

   export default CajaMedicion;

   - Permite usar esta caja desde `TarjetaAlimentador`, que es la que decide
     cuántas cajas hay, cómo se agrupan y con qué parámetros se renderiza cada una.

---------------------------------------------------------------------------*/