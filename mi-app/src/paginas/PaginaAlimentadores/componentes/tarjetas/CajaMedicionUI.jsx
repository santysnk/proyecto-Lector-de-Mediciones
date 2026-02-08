// src/paginas/PaginaAlimentadores/componentes/tarjetas/CajaMedicionUI.jsx

import React from "react";
import { formatearValorConDecimales } from "./formatearValorConDecimales";

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
