// src/paginas/PaginaAlimentadores/hooks/usarMediciones.js

import { useState, useRef, useEffect } from "react";              // estado, refs y efectos de React
import { leerRegistrosModbus } from "../utilidades/clienteModbus"; // cliente (simulado o real) para leer registros Modbus

/**
 * Hook personalizado para manejar mediciones de Modbus.
 * Controla timers periódicos, lecturas y estado de mediciones activas.
 *
 * @returns {Object} Estado y funciones para trabajar con mediciones.
 */
export const usarMediciones = () => {
	// Registros leídos en vivo por alimentador y equipo
	// Estructura: { [alimId]: { rele: [{index, address, value}], analizador: [...] } }
	const [registrosEnVivo, setRegistrosEnVivo] = useState({});

	// Estados de mediciones activas por alimentador y equipo
	// Estructura: { [alimId]: { rele: boolean, analizador: boolean } }
	const [medicionesActivas, setMedicionesActivas] = useState({});

	// Timestamps de inicio de mediciones (para sincronizar animaciones)
	// Estructura: { [alimId]: { rele: timestamp, analizador: timestamp } }
	const [timestampsInicio, setTimestampsInicio] = useState({});

	// Contador de lecturas (se incrementa con cada nueva inserción de datos)
	// Estructura: { [alimId]: { rele: number, analizador: number } }
	const [contadorLecturas, setContadorLecturas] = useState({});

	// Timers de setInterval (no generan re-render, por eso se guardan en un ref)
	// Estructura: { [alimId]: { rele: timerId, analizador: timerId } }
	const timersRef = useRef({});

	// Efecto: limpiar todos los timers al desmontar el componente raíz
	useEffect(() => {
		return () => {
			Object.values(timersRef.current).forEach((timersPorAlim) => {
				if (timersPorAlim?.rele) clearInterval(timersPorAlim.rele);
				if (timersPorAlim?.analizador) clearInterval(timersPorAlim.analizador);
			});
			timersRef.current = {};
		};
	}, []);

	/**
	 * Hace una lectura única (un "tick") de Modbus.
	 *
	 * @param {Object} alimentador - Objeto alimentador completo.
	 * @param {string} equipo - "rele" o "analizador".
	 * @returns {Promise<Array|null>} Registros leídos o null si hay error.
	 */
	const hacerLecturaModbus = async (alimentador, equipo) => {
		if (!alimentador) return null;

		// Obtener configuración según el equipo
		const configuracion =
			equipo === "analizador" ? alimentador.analizador : alimentador.rele;

		// Validar que tenga los datos necesarios
		if (!configuracion?.ip || !configuracion?.puerto) {
			return null;
		}

		try {
			const registros = await leerRegistrosModbus({
				ip: configuracion.ip.trim(),
				puerto: configuracion.puerto,
				indiceInicial: configuracion.indiceInicial,
				cantRegistros: configuracion.cantRegistros,
			});

			return registros;
		} catch (error) {
			console.error(`Error leyendo ${equipo}:`, error);
			return null;
		}
	};

	// Aplica nuevos registros y actualiza timestamp + contador de lecturas
	const aplicarRegistros = (alimId, equipo, registros) => {
		const ahora = Date.now();

		// Actualizar valores leídos
		setRegistrosEnVivo((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: registros,
			},
		}));

		// Actualizar timestamp de última lectura (por equipo)
		setTimestampsInicio((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: ahora,
			},
		}));

		// Incrementar contador de lecturas
		setContadorLecturas((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: (anteriores[alimId]?.[equipo] || 0) + 1,
			},
		}));
	};

	/**
	 * Inicia medición periódica para un alimentador y equipo.
	 *
	 * @param {Object} alimentador - Alimentador completo.
	 * @param {string} equipo - "rele" o "analizador".
	 * @param {Object} configuracionOverride - Configuración temporal (opcional).
	 */
	const iniciarMedicion = async (alimentador, equipo, configuracionOverride) => {
		const alimId = alimentador.id;

		// Si hay override, mezclarlo con la config del alimentador
		let alimentadorConfig = { ...alimentador };
		if (configuracionOverride) {
			if (configuracionOverride.periodoSegundos != null) {
				alimentadorConfig.periodoSegundos =
					configuracionOverride.periodoSegundos;
			}
			if (configuracionOverride.rele) {
				alimentadorConfig.rele = {
					...(alimentadorConfig.rele || {}),
					...configuracionOverride.rele,
				};
			}
			if (configuracionOverride.analizador) {
				alimentadorConfig.analizador = {
					...(alimentadorConfig.analizador || {}),
					...configuracionOverride.analizador,
				};
			}
		}

		// Lectura inmediata (primer tick)
		const registros = await hacerLecturaModbus(alimentadorConfig, equipo);

		if (registros) {
			aplicarRegistros(alimId, equipo, registros);
		}

		// Determinar período de actualización
		let periodoSegundos = 60; // por defecto
		if (equipo === "rele") {
			periodoSegundos = alimentadorConfig.periodoSegundos || 60;
		} else {
			periodoSegundos =
				alimentadorConfig.analizador?.periodoSegundos || 60;
		}

		// Configurar timer periódico
		const timerId = setInterval(async () => {
			const regs = await hacerLecturaModbus(alimentadorConfig, equipo);

			if (regs) {
				aplicarRegistros(alimId, equipo, regs);
			}
		}, periodoSegundos * 1000);

		// Guardar referencia al timer
		timersRef.current[alimId] = {
			...(timersRef.current[alimId] || {}),
			[equipo]: timerId,
		};

		// Marcar como medición activa
		setMedicionesActivas((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: true,
			},
		}));
	};

	/**
	 * Detiene medición de un alimentador y equipo.
	 *
	 * @param {number} alimId - ID del alimentador.
	 * @param {string} equipo - "rele" o "analizador".
	 */
	const detenerMedicion = (alimId, equipo) => {
		const timers = timersRef.current[alimId];

		// Limpiar el interval si existe
		if (timers?.[equipo]) {
			clearInterval(timers[equipo]);
			delete timers[equipo];
		}

		// Si no quedan timers, eliminar entrada completa
		if (timers && Object.keys(timers).length === 0) {
			delete timersRef.current[alimId];
		}

		// Marcar como inactiva y limpiar timestamp
		setMedicionesActivas((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: false,
			},
		}));

		setTimestampsInicio((anteriores) => {
			const nuevo = { ...anteriores };
			if (nuevo[alimId]) {
				delete nuevo[alimId][equipo];
				if (Object.keys(nuevo[alimId]).length === 0) {
					delete nuevo[alimId];
				}
			}
			return nuevo;
		});
	};

	/**
	 * Alterna medición (on/off) de un alimentador y equipo.
	 *
	 * @param {Object} alimentador - Alimentador completo.
	 * @param {string} equipo - "rele" o "analizador".
	 * @param {Object} configuracionOverride - Config temporal (opcional).
	 */
	const alternarMedicion = (alimentador, equipo, configuracionOverride) => {
		const alimId = alimentador.id;
		const estaActiva = medicionesActivas[alimId]?.[equipo];

		if (estaActiva) {
			detenerMedicion(alimId, equipo);
		} else {
			iniciarMedicion(alimentador, equipo, configuracionOverride);
		}
	};

	/**
	 * Obtiene los registros de un alimentador y equipo.
	 *
	 * @param {number} alimId - ID del alimentador.
	 * @param {string} equipo - "rele" o "analizador".
	 * @returns {Array} Lista de registros o array vacío.
	 */
	const obtenerRegistros = (alimId, equipo) => {
		return registrosEnVivo[alimId]?.[equipo] || [];
	};

	/**
	 * Verifica si un alimentador está midiendo.
	 *
	 * @param {number} alimId - ID del alimentador.
	 * @param {string} equipo - "rele" o "analizador".
	 * @returns {boolean} true si está midiendo.
	 */
	const estaMidiendo = (alimId, equipo) => {
		return !!medicionesActivas[alimId]?.[equipo];
	};

	/**
	 * Obtiene el timestamp de inicio de una medición.
	 *
	 * @param {number} alimId - ID del alimentador.
	 * @param {string} equipo - "rele" o "analizador".
	 * @returns {number|null} Timestamp de inicio o null.
	 */
	const obtenerTimestampInicio = (alimId, equipo) => {
		return timestampsInicio[alimId]?.[equipo] || null;
	};

	/**
	 * Obtiene el contador de lecturas de una medición.
	 *
	 * @param {number} alimId - ID del alimentador.
	 * @param {string} equipo - "rele" o "analizador".
	 * @returns {number} Contador de lecturas.
	 */
	const obtenerContadorLecturas = (alimId, equipo) => {
		return contadorLecturas[alimId]?.[equipo] || 0;
	};

	/**
	 * Actualiza los registros directamente (útil para preview o testing).
	 *
	 * @param {number} alimId - ID del alimentador.
	 * @param {Object|Function} nuevosDatosOFuncion - { rele?: [...], analizador?: [...] }
	 *        o una función (prevRegistros) => nuevosDatos para actualizar basándose en el estado anterior.
	 */
	const actualizarRegistros = (alimId, nuevosDatosOFuncion) => {
		setRegistrosEnVivo((anteriores) => {
			const registrosAnteriores = anteriores[alimId] || {};
			// Soportar tanto objeto directo como función actualizadora
			const nuevosDatos = typeof nuevosDatosOFuncion === 'function'
				? nuevosDatosOFuncion(registrosAnteriores)
				: nuevosDatosOFuncion;

			return {
				...anteriores,
				[alimId]: {
					...registrosAnteriores,
					...nuevosDatos,
				},
			};
		});
	};

	return {
		// Estados
		registrosEnVivo,
		medicionesActivas,

		// Funciones
		iniciarMedicion,
		detenerMedicion,
		alternarMedicion,
		obtenerRegistros,
		estaMidiendo,
		obtenerTimestampInicio,
		obtenerContadorLecturas,
		actualizarRegistros,
	};
};

/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (usarMediciones.js)

 - Este hook encapsula toda la lógica de mediciones Modbus por alimentador y
   por equipo ("rele" y "analizador"): timers, lecturas, timestamps y contadores.

 - `registrosEnVivo` guarda los registros crudos por alimentador/equipo. 
   `aplicarRegistros` se encarga de actualizar este estado, el timestamp y el
   contador de lecturas cada vez que llega un nuevo set de datos.

 - `iniciarMedicion` arma la configuración efectiva (mezcla la propia del
   alimentador con overrides temporales), hace una primera lectura inmediata y
   luego configura un `setInterval` que vuelve a leer cada `periodoSegundos`.
   La referencia a ese timer se guarda en `timersRef` para poder detenerlo luego.

 - `detenerMedicion` limpia el timer correspondiente, marca la medición como
   inactiva y borra el timestamp asociado a ese equipo/alimentador.

 - `alternarMedicion` usa `estaMidiendo` para decidir si debe llamar a
   `iniciarMedicion` o `detenerMedicion`, simplificando muchísimo el código en
   los componentes de UI.

 - Los helpers `obtenerRegistros`, `estaMidiendo`, `obtenerTimestampInicio` y
   `obtenerContadorLecturas` son atajos que evitan que la UI tenga que conocer
   la estructura interna de los estados.

 - `actualizarRegistros` permite, por ejemplo, mostrar valores de prueba o hacer
   previews sin depender de una lectura real de Modbus.
---------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (usarMediciones.js)

0) Visión general del hook

   Este hook se encarga de TODO lo relacionado con mediciones Modbus:

   - Guardar los registros leídos en vivo, por alimentador y por equipo (rele / analizador).

   - Manejar qué mediciones están activas y sus timers (setInterval).

   - Llevar timestamps de la última lectura y un contador de cuántas lecturas se hicieron.

   - Ofrecer funciones simples para la UI: iniciar, detener, alternar medición y leer el 
	  estado actual sin que los componentes tengan que saber cómo se guardan las cosas internamente.

   Estructuras internas (todas indexadas por alimId y equipo "rele"/"analizador"):

   - registrosEnVivo[alimId][equipo]        → registros crudos leídos.
   - medicionesActivas[alimId][equipo]      → true/false según si está midiendo.
   - timestampsInicio[alimId][equipo]       → timestamp (Date.now()) de última lectura.
   - contadorLecturas[alimId][equipo]       → cuántas lecturas se realizaron.
   - timersRef.current[alimId][equipo]      → id del setInterval asociado.


1) Efecto de limpieza de timers (useEffect)

   useEffect(() => {
     return () => {
       Object.values(timersRef.current).forEach((timersPorAlim) => {
         if (timersPorAlim?.rele) clearInterval(timersPorAlim.rele);
         if (timersPorAlim?.analizador) clearInterval(timersPorAlim.analizador);
       });
       timersRef.current = {};
     };
   }, []);

   - Este efecto se ejecuta solo una vez al montar el hook.

   - Devuelve una función de limpieza que se corre cuando el componente raíz que usa este hook 
	  se desmonta.

   - Esa función:
       • recorre todos los timers guardados en timersRef,
       • hace clearInterval de cada uno (rele y analizador),
       • limpia la referencia a timersRef.

   - De esta forma nos aseguramos de que no queden timers corriendo en segundo plano cuando 
	  se abandona la pantalla.


2) hacerLecturaModbus

   const hacerLecturaModbus = async (alimentador, equipo) => {
     if (!alimentador) return null;

     const configuracion =
       equipo === "analizador" ? alimentador.analizador : alimentador.rele;

     if (!configuracion?.ip || !configuracion?.puerto) {
       return null;
     }

     try {
       const registros = await leerRegistrosModbus({
         ip: configuracion.ip.trim(),
         puerto: configuracion.puerto,
         indiceInicial: configuracion.indiceInicial,
         cantRegistros: configuracion.cantRegistros,
       });

       return registros;
     } catch (error) {
       console.error(`Error leyendo ${equipo}:`, error);
       return null;
     }
   };

   - Recibe el objeto `alimentador` completo y el tipo de equipo: "rele" o "analizador".

   - Según el equipo, toma la sección de configuración correspondiente
	  (alimentador.rele o alimentador.analizador).

   - Valida que exista IP y puerto; si falta algo, devuelve null y no intenta leer.

   - Llama a `leerRegistrosModbus` pasando IP, puerto, índice inicial y cantidad de registros.

   - Si la lectura sale bien, devuelve el array de registros.

   - Si hay error (timeout, conexión, etc.), captura la excepción, registra en consola y devuelve null.


3) aplicarRegistros

   const aplicarRegistros = (alimId, equipo, registros) => {
     const ahora = Date.now();

     setRegistrosEnVivo((anteriores) => ({
       ...anteriores,
       [alimId]: {
         ...(anteriores[alimId] || {}),
         [equipo]: registros,
       },
     }));

     setTimestampsInicio((anteriores) => ({
       ...anteriores,
       [alimId]: {
         ...(anteriores[alimId] || {}),
         [equipo]: ahora,
       },
     }));

     setContadorLecturas((anteriores) => ({
       ...anteriores,
       [alimId]: {
         ...(anteriores[alimId] || {}),
         [equipo]: (anteriores[alimId]?.[equipo] || 0) + 1,
       },
     }));
   };

   - Se encarga de “aplicar” una nueva tanda de registros a los estados internos del hook.

   - Recibe:
       • alimId → id del alimentador,
       • equipo → "rele" o "analizador",
       • registros → array devuelto por hacerLecturaModbus.

   - Hace tres cosas:
       1) Actualiza `registrosEnVivo` para ese alimentador y equipo.

       2) Guarda el timestamp actual (`ahora`) en `timestampsInicio` para ese equipo de ese alimentador.

       3) Incrementa el contador de lecturas `contadorLecturas` para ese mismo par alimId/equipo.

   - Siempre respeta la estructura inmutable: crea nuevos objetos a partir de los anteriores,
	  sin modificar los existentes directamente.


4) iniciarMedicion

   const iniciarMedicion = async (alimentador, equipo, configuracionOverride) => {
     const alimId = alimentador.id;

     let alimentadorConfig = { ...alimentador };
     if (configuracionOverride) {
       if (configuracionOverride.periodoSegundos != null) {
         alimentadorConfig.periodoSegundos =
           configuracionOverride.periodoSegundos;
       }
       if (configuracionOverride.rele) {
         alimentadorConfig.rele = {
           ...(alimentadorConfig.rele || {}),
           ...configuracionOverride.rele,
         };
       }
       if (configuracionOverride.analizador) {
         alimentadorConfig.analizador = {
           ...(alimentadorConfig.analizador || {}),
           ...configuracionOverride.analizador,
         };
       }
     }

     const registros = await hacerLecturaModbus(alimentadorConfig, equipo);

     if (registros) {
       aplicarRegistros(alimId, equipo, registros);
     }

     let periodoSegundos = 60;
     if (equipo === "rele") {
       periodoSegundos = alimentadorConfig.periodoSegundos || 60;
     } else {
       periodoSegundos =
         alimentadorConfig.analizador?.periodoSegundos || 60;
     }

     const timerId = setInterval(async () => {
       const regs = await hacerLecturaModbus(alimentadorConfig, equipo);
       if (regs) {
         aplicarRegistros(alimId, equipo, regs);
       }
     }, periodoSegundos * 1000);

     timersRef.current[alimId] = {
       ...(timersRef.current[alimId] || {}),
       [equipo]: timerId,
     };

     setMedicionesActivas((anteriores) => ({
       ...anteriores,
       [alimId]: {
         ...(anteriores[alimId] || {}),
         [equipo]: true,
       },
     }));
   };

   - Inicia una medición periódica para un alimentador y para un equipo ("rele" o "analizador").

   - Permite recibir un `configuracionOverride` para usar valores temporales
     (por ejemplo, cambiar el período sin tocar la configuración guardada).

   - Mezcla la configuración del alimentador con los overrides:
       • periodoSegundos,
       • campos específicos de rele o analizador.

   - Hace primero una lectura inmediata (primer tick):
       • si la lectura devuelve registros, los aplica llamando a `aplicarRegistros`.

   - Calcula cada cuántos segundos hay que repetir la lectura:
       • usa `alimentadorConfig.periodoSegundos` o `analizador.periodoSegundos`, según el equipo; 
		   si no hay dato, usa 60 s por defecto.

   - Crea un `setInterval` que:
       • vuelve a leer periódicamente Modbus,
       • aplica los registros cada vez que llegan.

   - Guarda el id del timer en `timersRef.current[alimId][equipo]`.

   - Marca esa medición como activa en `medicionesActivas[alimId][equipo] = true`.


5) detenerMedicion

   const detenerMedicion = (alimId, equipo) => {
     const timers = timersRef.current[alimId];

     if (timers?.[equipo]) {
       clearInterval(timers[equipo]);
       delete timers[equipo];
     }

     if (timers && Object.keys(timers).length === 0) {
       delete timersRef.current[alimId];
     }

     setMedicionesActivas((anteriores) => ({
       ...anteriores,
       [alimId]: {
         ...(anteriores[alimId] || {}),
         [equipo]: false,
       },
     }));

     setTimestampsInicio((anteriores) => {
       const nuevo = { ...anteriores };
       if (nuevo[alimId]) {
         delete nuevo[alimId][equipo];
         if (Object.keys(nuevo[alimId]).length === 0) {
           delete nuevo[alimId];
         }
       }
       return nuevo;
     });
   };

   - Recibe el id del alimentador y el equipo ("rele" o "analizador") a detener.

   - Si existe un timer para ese par alimId/equipo:
       • llama a `clearInterval` para cortar el ciclo de lecturas,
       • borra la referencia a ese timer.

   - Si ya no quedan timers para ese alimentador, elimina también la entrada completa en `timersRef.current`.

   - Marca la medición como inactiva en `medicionesActivas` para ese equipo.

   - Limpia el timestamp en `timestampsInicio`:
       • borra la clave del equipo,
       • si no quedan más equipos con timestamp para ese alimId, elimina la entrada entera.

   - Con esto se asegura que no queden restos de estado de una medición detenida.


6) alternarMedicion

   const alternarMedicion = (alimentador, equipo, configuracionOverride) => {
     const alimId = alimentador.id;
     const estaActiva = medicionesActivas[alimId]?.[equipo];

     if (estaActiva) {
       detenerMedicion(alimId, equipo);
     } else {
       iniciarMedicion(alimentador, equipo, configuracionOverride);
     }
   };

   - Función comodín para la UI: ON/OFF de una medición.

   - Revisa en `medicionesActivas` si ese alimentador/equipo está actualmente midiendo.

   - Si está midiendo → llama a `detenerMedicion`.

   - Si no está midiendo → llama a `iniciarMedicion`.

   - Permite que el componente visual solo tenga que llamar a una función (alternar) 
	  y no decidir manualmente qué hacer en cada caso.


7) obtenerRegistros

   const obtenerRegistros = (alimId, equipo) => {
     return registrosEnVivo[alimId]?.[equipo] || [];
   };

   - Devuelve los registros crudos guardados para un alimentador y equipo.

   - Si no hay nada cargado todavía, devuelve un array vacío.

   - La idea es que la UI use esto en lugar de acceder directamente a `registrosEnVivo` 
	   y tener que hacer las comprobaciones a mano.


8) estaMidiendo

   const estaMidiendo = (alimId, equipo) => {
     return !!medicionesActivas[alimId]?.[equipo];
   };

   - Devuelve true si para ese alimId/equipo la medición está activa.

   - Usa `!!` para convertir cualquier valor “truthy”/“falsy” a un booleano puro.

			Ese acceso puede devolver varias cosas:
					true → si está midiendo.
					false → si no.
					undefined → si nunca se inicializó para ese alimId/equipo.

			Con undefined también entra en el “falso”, entonces ya no está claro si significa:
			“no está midiendo” o “no sé, nunca lo inicialicé”.	

			Al usar !!: te asegurás de que SIEMPRE devuelva true o false, nunca undefined ni null.

   - Simplifica al resto de la app la consulta de estado: se consulta una sola función 
	  y no la estructura interna.


9) obtenerTimestampInicio

   const obtenerTimestampInicio = (alimId, equipo) => {
     return timestampsInicio[alimId]?.[equipo] || null;
   };

   - Devuelve el timestamp (Date.now() en milisegundos) de la última lectura registrada 
	  para ese alimentador/equipo.

   - Si no existe, devuelve null.

   - Permite sincronizar animaciones o cálculos de “hace cuánto se actualizó”.


10) obtenerContadorLecturas

   const obtenerContadorLecturas = (alimId, equipo) => {
     return contadorLecturas[alimId]?.[equipo] || 0;
   };

   - Devuelve cuántas lecturas se han aplicado para ese alimId/equipo.

   - Si nunca se leyó nada, devuelve 0.

   - Puede ser útil para estadísticas o para mostrar en la UI el número de ciclos completados.


11) actualizarRegistros

   const actualizarRegistros = (alimId, nuevosDatos) => {
     setRegistrosEnVivo((anteriores) => ({
       ...anteriores,
       [alimId]: {
         ...(anteriores[alimId] || {}),
         ...nuevosDatos,
       },
     }));
   };

   - Permite actualizar `registrosEnVivo` manualmente para un alimentador.

   - `nuevosDatos` puede incluir `rele`, `analizador` o ambos.

   - Útil para:
       • mostrar datos de prueba,
       • hacer previews sin conexión real a Modbus,
       • o cargar lecturas desde otra fuente.

   - Respeta siempre la estructura inmutable: copia lo anterior y mezcla solo los datos 
	  que llegan en `nuevosDatos`.


12) return del hook

   return {
     // Estados
     registrosEnVivo,
     medicionesActivas,

     // Funciones
     iniciarMedicion,
     detenerMedicion,
     alternarMedicion,
     obtenerRegistros,
     estaMidiendo,
     obtenerTimestampInicio,
     obtenerContadorLecturas,
     actualizarRegistros,
   };

   - Expone hacia afuera:
       • los dos estados principales: `registrosEnVivo` y `medicionesActivas`,
       • y todas las funciones que la UI necesita para controlar mediciones.

   - De este modo, cualquier componente que llame a `usarMediciones()` tiene una API clara para:
       • arrancar/parar mediciones,
       • consultar qué se está midiendo,
       • recuperar registros,
       • y trabajar con timestamps y contadores sin conocer el detalle interno.

------------------------------------------------------------------------------------------------*/

