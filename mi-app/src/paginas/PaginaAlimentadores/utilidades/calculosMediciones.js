// src/paginas/PaginaAlimentadores/utilidades/calculosMediciones.js

import { aplicarFormula, formatearValor } from "./calculosFormulas"; // helpers para fórmulas y formato de números
import {
	TITULOS_MEDICIONES,
	ETIQUETAS_POR_DEFECTO,
	DISEÑO_TARJETA_POR_DEFECTO,
} from "../constantes/titulosMediciones";

/**
 * Obtiene la lista de registros según el origen (rele o analizador).
 *
 * @param {Object} registrosPorOrigen - { rele: [...], analizador: [...] }.
 * @param {string} origen - "rele" o "analizador".
 * @returns {Array|null} Lista de registros o null.
 */
export const obtenerListaRegistros = (registrosPorOrigen, origen) => {
	if (!registrosPorOrigen) return null;
	const clave = origen === "analizador" ? "analizador" : "rele"; // default: rele
	const lista = registrosPorOrigen[clave];
	return Array.isArray(lista) ? lista : null;
};

/**
 * Obtiene el diseño de la tarjeta desde card_design o mapeoMediciones (legacy).
 * Si no hay configuración, devuelve el diseño por defecto.
 *
 * @param {Object} cardDesign - Configuración directa de card_design (nuevo formato)
 *                              o mapeoMediciones.cardDesign (legacy).
 * @returns {Object} Diseño con estructura { superior: {...}, inferior: {...} }.
 */
export const obtenerDisenoTarjeta = (cardDesign) => {
	// Si no hay diseño, usar por defecto
	if (!cardDesign || Object.keys(cardDesign).length === 0) {
		return DISEÑO_TARJETA_POR_DEFECTO;
	}

	// Nuevo formato: card_design ya tiene { superior, inferior } directamente
	// Legacy: mapeoMediciones tenía cardDesign.superior/inferior
	const diseño = cardDesign.cardDesign || cardDesign;

	// Si el diseño tiene superior/inferior, usarlo
	if (diseño.superior || diseño.inferior) {
		return {
			superior: normalizarLadoDiseno(diseño.superior, DISEÑO_TARJETA_POR_DEFECTO.superior),
			inferior: normalizarLadoDiseno(diseño.inferior, DISEÑO_TARJETA_POR_DEFECTO.inferior),
		};
	}

	return DISEÑO_TARJETA_POR_DEFECTO;
};

/**
 * Normaliza un lado del diseño, convirtiendo el formato del modal al formato esperado.
 * El modal guarda: { tituloId, tituloCustom, cantidad, boxes: [{ enabled, label, indice, formula }] }
 * El cálculo espera: { tituloId, tituloCustom, cantidad, boxes: [{ enabled, label, registro, formula, origen }] }
 */
const normalizarLadoDiseno = (lado, ladoDefault) => {
	if (!lado) return ladoDefault;

	// Normalizar los boxes: convertir 'indice' a 'registro' si es necesario
	const boxesNormalizados = (lado.boxes || []).map((box) => ({
		enabled: !!box.enabled,
		label: box.label || "",
		// El modal guarda 'indice', el cálculo espera 'registro'
		registro: box.registro !== undefined ? box.registro : box.indice,
		formula: box.formula || "",
		origen: box.origen || "rele", // por defecto relé
	}));

	return {
		...ladoDefault,
		...lado,
		boxes: boxesNormalizados,
	};
};

/**
 * Resuelve el título de un lado de la tarjeta.
 * Puede ser un título predefinido o uno personalizado.
 *
 * @param {Object} diseñoLado - { tituloId, tituloCustom, ... }.
 * @returns {string} Título a mostrar.
 */
export const resolverTituloLado = (diseñoLado) => {
	if (!diseñoLado) return "";

	// Si es custom, usar el título personalizado
	if (diseñoLado.tituloId === "custom") {
		return (diseñoLado.tituloCustom || "").trim();
	}

	// Sino, buscar en la lista de títulos predefinidos
	return TITULOS_MEDICIONES[diseñoLado.tituloId] || "";
};

/**
 * Calcula los valores para mostrar en un lado de la tarjeta (superior o inferior).
 * Aplica fórmulas, formatea valores y maneja errores.
 *
 * @param {Object} registrosPorOrigen - { rele: [...], analizador: [...] }.
 * @param {Object} diseñoLado - Configuración del lado de la tarjeta.
 * @returns {Object} { titulo: string, boxes: [{ etiqueta, valor, enabled, origen }] }.
 */
export const calcularValoresLadoTarjeta = (registrosPorOrigen, diseñoLado) => {
	if (!diseñoLado) {
		return {
			titulo: "",
			boxes: [],
		};
	}

	const titulo = resolverTituloLado(diseñoLado); // texto que va arriba del grupo
	const cantidad = Math.min(
		4,
		Math.max(1, Number(diseñoLado.cantidad) || 1)
	); // fuerza cantidad a [1,4]
	const boxesSalida = [];

	const etiquetasDefault = ETIQUETAS_POR_DEFECTO[diseñoLado.tituloId] || [];

	for (let i = 0; i < cantidad; i++) {
		const configuracion = diseñoLado.boxes?.[i] || {};
		const etiqueta =
			(configuracion.label || "").trim() ||
			etiquetasDefault[i] ||
			`Box ${i + 1}`; // etiqueta efectiva que se verá

		let valorMostrado = "--,--"; // placeholder por defecto

		if (configuracion.enabled) {
			const numeroRegistro = Number(configuracion.registro);

			// Si hay registro configurado (número válido o 0, y no string vacío)
			if (
				(Number.isFinite(numeroRegistro) || numeroRegistro === 0) &&
				configuracion.registro !== ""
			) {
				const origen = configuracion.origen || "rele"; // default: rele
				const listaRegistros = obtenerListaRegistros(
					registrosPorOrigen,
					origen
				);

				if (listaRegistros && listaRegistros.length > 0) {
					// Buscar el registro por su dirección (address)
					const registroEncontrado = listaRegistros.find(
						(r) => r.address === numeroRegistro
					);

					if (!registroEncontrado) {
						valorMostrado = "ERROR"; // no se encontró el registro
					} else {
						// Aplicar fórmula al valor del registro
						const valorCalculado = aplicarFormula(
							configuracion.formula || "x",
							registroEncontrado.value
						);

						if (
							valorCalculado == null ||
							Number.isNaN(valorCalculado)
						) {
							valorMostrado = "ERROR";
						} else {
							valorMostrado = formatearValor(valorCalculado);
						}
					}
				}
			}
		}

		boxesSalida.push({
			etiqueta,
			valor: valorMostrado,
			enabled: !!configuracion.enabled,
			origen: configuracion.origen || "rele",
		});
	}

	return { titulo, boxes: boxesSalida };
};

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (calculosMediciones.js)

 - Este módulo es el "traductor" entre los registros Modbus crudos y lo que
   termina viendo la tarjeta en pantalla.

 - Flujo general:
     * `obtenerListaRegistros` elige la lista correcta (`rele` o `analizador`)
       dentro del objeto `{ rele, analizador }`.

     * `obtenerDisenoTarjeta` fusiona el `cardDesign` guardado en el mapeo con
       `DISEÑO_TARJETA_POR_DEFECTO` para garantizar que siempre haya estructura
       válida para superior e inferior.

     * `resolverTituloLado` convierte `tituloId` en un texto legible, o usa
       el `tituloCustom` si se eligió la opción "custom".

     * `calcularValoresLadoTarjeta` recorre cada box configurado:
         - busca el registro por `address`,
         - aplica la fórmula configurada (con `aplicarFormula`),
         - formatea el resultado (`formatearValor`),
         - o deja "ERROR" / "--,--" según corresponda.

 - El resultado de `calcularValoresLadoTarjeta` es lo que consume la
   `TarjetaAlimentador` para pintar etiquetas y valores en cada caja.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (calculosMediciones.js)

0) Visión general del módulo

   Este archivo es el "traductor" entre:
   - los registros Modbus crudos que vienen del relé / analizador, y
   - la estructura amigable que necesita la tarjeta para dibujar cada box
     (etiqueta, valor formateado, enabled, origen).

   Se apoya en:
     • `calculosFormulas.js` para aplicar fórmulas y formatear números,
     • las constantes de `titulosMediciones` para títulos y etiquetas por defecto.


1) obtenerListaRegistros(registrosPorOrigen, origen)

   export const obtenerListaRegistros = (registrosPorOrigen, origen) => {
     if (!registrosPorOrigen) return null;
     const clave = origen === "analizador" ? "analizador" : "rele";
     const lista = registrosPorOrigen[clave];
     return Array.isArray(lista) ? lista : null;
   };

   - Parámetros:
       • `registrosPorOrigen`: objeto con las listas de lecturas, por ejemplo
         `{ rele: [...], analizador: [...] }`.
       • `origen`: string `"rele"` o `"analizador"`.

   - Comportamiento:
       • Si el origen es `"analizador"`, usa la clave `"analizador"`;
         en cualquier otro caso cae a `"rele"` como valor por defecto.
       • Si encuentra una lista y es un array, la devuelve; si no, devuelve null.

   - Uso típico:
       • Desde `calcularValoresLadoTarjeta` para obtener la lista correcta
         antes de buscar un registro por dirección.


2) obtenerDisenoTarjeta(mapeoMediciones)

   export const obtenerDisenoTarjeta = (mapeoMediciones) => {
     const diseño = mapeoMediciones?.cardDesign;
     if (!diseño) return DISEÑO_TARJETA_POR_DEFECTO;

     return {
       superior: {
         ...DISEÑO_TARJETA_POR_DEFECTO.superior,
         ...(diseño.superior || {}),
       },
       inferior: {
         ...DISEÑO_TARJETA_POR_DEFECTO.inferior,
         ...(diseño.inferior || {}),
       },
     };
   };

   - Toma el `cardDesign` guardado en el mapeo (si existe) y lo fusiona con
     `DISEÑO_TARJETA_POR_DEFECTO`.

   - Objetivo:
       • garantizar que siempre haya un objeto bien formado para `superior` e
         `inferior`, con campos y estructuras mínimas aunque falten datos.

   - Si `mapeoMediciones` no tiene `cardDesign`, devuelve directamente el
     diseño por defecto (corriente arriba, tensión abajo, etc.).


3) resolverTituloLado(diseñoLado)

   export const resolverTituloLado = (diseñoLado) => {
     if (!diseñoLado) return "";

     if (diseñoLado.tituloId === "custom") {
       return (diseñoLado.tituloCustom || "").trim();
     }

     return TITULOS_MEDICIONES[diseñoLado.tituloId] || "";
   };

   - Si el `tituloId` es `"custom"`, usa el texto libre `tituloCustom`.

   - En caso contrario, busca el título en `TITULOS_MEDICIONES` usando
     `tituloId` como clave (ej: `"tension_linea"`, `"corriente_132"`, etc.).

   - Si no encuentra nada, devuelve string vacío.


4) calcularValoresLadoTarjeta(registrosPorOrigen, diseñoLado)

   export const calcularValoresLadoTarjeta = (registrosPorOrigen, diseñoLado) => {
     if (!diseñoLado) {
       return { titulo: "", boxes: [] };
     }

     const titulo = resolverTituloLado(diseñoLado);
     const cantidad = Math.min(4, Math.max(1, Number(diseñoLado.cantidad) || 1));
     const boxesSalida = [];
     const etiquetasDefault = ETIQUETAS_POR_DEFECTO[diseñoLado.tituloId] || [];

     for (let i = 0; i < cantidad; i++) {
       const configuracion = diseñoLado.boxes?.[i] || {};
       const etiqueta =
         (configuracion.label || "").trim() ||
         etiquetasDefault[i] ||
         `Box ${i + 1}`;

       let valorMostrado = "--,--";

       if (configuracion.enabled) {
         const numeroRegistro = Number(configuracion.registro);

         if (
           (Number.isFinite(numeroRegistro) || numeroRegistro === 0) &&
           configuracion.registro !== ""
         ) {
           const origen = configuracion.origen || "rele";
           const listaRegistros = obtenerListaRegistros(registrosPorOrigen, origen);

           if (listaRegistros && listaRegistros.length > 0) {
             const registroEncontrado = listaRegistros.find(
               (r) => r.address === numeroRegistro
             );

             if (!registroEncontrado) {
               valorMostrado = "ERROR";
             } else {
               const valorCalculado = aplicarFormula(
                 configuracion.formula || "x",
                 registroEncontrado.value
               );

               if (valorCalculado == null || Number.isNaN(valorCalculado)) {
                 valorMostrado = "ERROR";
               } else {
                 valorMostrado = formatearValor(valorCalculado);
               }
             }
           }
         }
       }

       boxesSalida.push({
         etiqueta,
         valor: valorMostrado,
         enabled: !!configuracion.enabled,
         origen: configuracion.origen || "rele",
       });
     }

     return { titulo, boxes: boxesSalida };
   };

   - Paso a paso para cada box:

       1) Determina la etiqueta efectiva:
            • primero `configuracion.label` (si existe y no está vacío),
            • si no, una etiqueta por defecto según magnitud (R, S, T, Total),
            • si tampoco hay, usa "Box 1", "Box 2", etc.

       2) Inicializa `valorMostrado` en `"--,--"` como placeholder.

       3) Si el box está habilitado (`enabled === true`):
            • Valida el número de registro (`configuracion.registro`).
            • Determina el origen (`rele` o `analizador`).
            • Obtiene la lista de registros correspondiente con
              `obtenerListaRegistros`.
            • Busca el registro cuyo `address` coincida con el número
              configurado.

       4) Si encuentra el registro:
            • Aplica la fórmula de ese box con `aplicarFormula` (o "x" si
              no se definió fórmula).
            • Si el resultado es inválido → `"ERROR"`.
            • Si es válido → lo pasa por `formatearValor` para obtener un
              string "amigable" (dos decimales, coma, etc.).

       5) Agrega al array `boxesSalida` un objeto con:
            • `etiqueta`: texto visible en la tarjeta,
            • `valor`: texto formateado o "ERROR"/"--,--",
            • `enabled`: booleano,
            • `origen`: "rele" o "analizador".


5) Cómo se integra con el resto de la app

   - `ModalMapeoMediciones` define el `cardDesign` (qué boxes hay, qué
     registro leen, fórmula, origen, etc.) y lo guarda en `mapeoMediciones`
     dentro de cada alimentador.

   - Cuando llegan lecturas nuevas desde los equipos:

       1) Se arma un objeto `{ rele: [...], analizador: [...] }` con registros
          crudos (`index`, `address`, `value`).

       2) Se obtiene el diseño de tarjeta con `obtenerDisenoTarjeta`.

       3) Para cada lado (superior / inferior) se llama a
          `calcularValoresLadoTarjeta` y se obtienen `{ titulo, boxes }`.
			 
       4) Esa estructura es la que consume `TarjetaAlimentador` para renderizar
          cada `CajaMedicion` con su etiqueta, valor y comportamiento visual.

   - De esta forma, todo el cálculo numérico + mapeo queda concentrado en este
     módulo y las tarjetas se enfocan sólo en mostrar datos.

---------------------------------------------------------------------------*/
