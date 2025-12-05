import { useState, useRef, useEffect } from 'react';
import { leerRegistrosModbus } from '../utilidades/clienteModbus';

/**
 * ==============================================================================
 * HOOK: usarMediciones
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Este hook es el encargado de realizar las lecturas de datos reales desde los
 * equipos (Relés y Analizadores) utilizando el protocolo Modbus.
 * Funciona como un "motor de encuestas" que pregunta periódicamente a los equipos
 * por sus valores actuales.
 * 
 * ¿CÓMO SE VINCULA?
 * - Se usa en "PaginaAlimentadores.jsx" para alimentar las tarjetas con datos vivos.
 * - Utiliza "clienteModbus.js" para hacer la comunicación técnica de red.
 * 
 * FINALIDAD:
 * Abstraer la complejidad de los timers (setInterval) y la gestión de estado
 * de las mediciones, para que los componentes solo se preocupen por mostrar los datos.
 */

export const usarMediciones = () => {
	// ==========================================================================
	// 1. ESTADOS (Memoria de mediciones)
	// ==========================================================================

	// Guarda los últimos valores leídos de cada equipo.
	// Estructura: { [idAlimentador]: { rele: [datos...], analizador: [datos...] } }
	const [registrosEnVivo, setRegistrosEnVivo] = useState({});

	// Controla qué equipos se están midiendo actualmente (encendido/apagado).
	// Estructura: { [idAlimentador]: { rele: true/false, analizador: true/false } }
	const [medicionesActivas, setMedicionesActivas] = useState({});

	// Guarda la hora exacta (timestamp) de la última lectura exitosa.
	// Se usa para sincronizar las animaciones de borde en las tarjetas.
	const [timestampsInicio, setTimestampsInicio] = useState({});

	// Cuenta cuántas lecturas han llegado.
	// Útil para forzar el reinicio de animaciones cada vez que llega un dato nuevo.
	const [contadorLecturas, setContadorLecturas] = useState({});

	// Referencia para guardar los IDs de los timers (setInterval).
	// Usamos useRef porque no queremos que el componente se renderice cada vez que guardamos un ID.
	const timersRef = useRef({});

	// ==========================================================================
	// 2. EFECTOS (Limpieza)
	// ==========================================================================

	// Cuando el usuario sale de la página, nos aseguramos de apagar todos los timers
	// para que no sigan consumiendo recursos en segundo plano.
	useEffect(() => {
		return () => {
			Object.values(timersRef.current).forEach((timersPorAlim) => {
				if (timersPorAlim?.rele) clearInterval(timersPorAlim.rele);
				if (timersPorAlim?.analizador) clearInterval(timersPorAlim.analizador);
			});
			timersRef.current = {};
		};
	}, []);

	// ==========================================================================
	// 3. FUNCIONES INTERNAS (Helpers)
	// ==========================================================================

	/**
	 * Realiza una única lectura técnica al equipo usando Modbus.
	 * Maneja errores silenciosamente (solo loguea en consola) para no romper la app.
	 */
	const hacerLecturaModbus = async (alimentador, equipo) => {
		if (!alimentador) return null;

		// Elegir configuración según si es Relé o Analizador
		const configuracion = equipo === "analizador"
			? alimentador.analizador
			: alimentador.rele;

		// Si no tiene IP o puerto configurado, no podemos medir
		if (!configuracion?.ip || !configuracion?.puerto) {
			return null;
		}

		try {
			// Llamada a la utilidad de bajo nivel
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

	/**
	 * Función central para guardar nuevos datos.
	 * Actualiza:
	 * 1. Los valores leídos
	 * 2. El timestamp (hora) de lectura
	 * 3. El contador de lecturas (para animaciones)
	 */
	const aplicarRegistros = (alimId, equipo, registros) => {
		const ahora = Date.now();

		// 1. Guardar valores
		setRegistrosEnVivo((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: registros,
			},
		}));

		// 2. Guardar hora
		setTimestampsInicio((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: ahora,
			},
		}));

		// 3. Incrementar contador
		setContadorLecturas((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: (anteriores[alimId]?.[equipo] || 0) + 1,
			},
		}));
	};


	// ==========================================================================
	// 4. FUNCIONES PÚBLICAS (Acciones)
	// ==========================================================================

	/**
	 * Comienza el ciclo de medición periódica.
	 * 
	 * @param {Object} alimentador - El objeto con la configuración
	 * @param {string} equipo - "rele" o "analizador"
	 * @param {Object} configuracionOverride - (Opcional) Para probar configuraciones temporales
	 */
	const iniciarMedicion = async (alimentador, equipo, configuracionOverride) => {
		const alimId = alimentador.id;

		// Preparar configuración (mezclando la guardada con la temporal si existe)
		let alimentadorConfig = { ...alimentador };
		if (configuracionOverride) {
			if (configuracionOverride.periodoSegundos != null) {
				alimentadorConfig.periodoSegundos = configuracionOverride.periodoSegundos;
			}
			if (configuracionOverride.rele) {
				alimentadorConfig.rele = { ...(alimentadorConfig.rele || {}), ...configuracionOverride.rele };
			}
			if (configuracionOverride.analizador) {
				alimentadorConfig.analizador = { ...(alimentadorConfig.analizador || {}), ...configuracionOverride.analizador };
			}
		}

		// 1. Hacer una primera lectura inmediata (para no esperar al primer timer)
		const registros = await hacerLecturaModbus(alimentadorConfig, equipo);
		if (registros) {
			aplicarRegistros(alimId, equipo, registros);
		}

		// 2. Configurar el intervalo de tiempo
		let periodoSegundos = 60;
		if (equipo === "rele") {
			periodoSegundos = alimentadorConfig.periodoSegundos || 60;
		} else {
			periodoSegundos = alimentadorConfig.analizador?.periodoSegundos || 60;
		}

		// 3. Iniciar el ciclo infinito de lecturas
		const timerId = setInterval(async () => {
			const regs = await hacerLecturaModbus(alimentadorConfig, equipo);
			if (regs) {
				aplicarRegistros(alimId, equipo, regs);
			}
		}, periodoSegundos * 1000);

		// 4. Guardar referencia al timer para poder detenerlo después
		timersRef.current[alimId] = {
			...(timersRef.current[alimId] || {}),
			[equipo]: timerId,
		};

		// 5. Marcar estado como "midiendo"
		const ahora = Date.now();
		setMedicionesActivas((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: true,
			},
		}));
	};

	/**
	 * Detiene la medición y limpia los recursos.
	 */
	const detenerMedicion = (alimId, equipo) => {
		const timers = timersRef.current[alimId];

		// Detener el intervalo
		if (timers?.[equipo]) {
			clearInterval(timers[equipo]);
			delete timers[equipo];
		}

		// Limpiar referencia si ya no hay timers
		if (timers && Object.keys(timers).length === 0) {
			delete timersRef.current[alimId];
		}

		// Actualizar estado a "no midiendo"
		setMedicionesActivas((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: false,
			},
		}));

		// Limpiar timestamp
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
	 * Interruptor simple: Si está midiendo lo apaga, si está apagado lo enciende.
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
	 * Devuelve los últimos registros leídos para un equipo.
	 */
	const obtenerRegistros = (alimId, equipo) => {
		return registrosEnVivo[alimId]?.[equipo] || [];
	};

	/**
	 * Devuelve true si el equipo está midiendo actualmente.
	 */
	const estaMidiendo = (alimId, equipo) => {
		return !!medicionesActivas[alimId]?.[equipo];
	};

	/**
	 * Devuelve la hora de la última lectura.
	 */
	const obtenerTimestampInicio = (alimId, equipo) => {
		return timestampsInicio[alimId]?.[equipo] || null;
	};

	/**
	 * Devuelve el número de lecturas realizadas (contador).
	 */
	const obtenerContadorLecturas = (alimId, equipo) => {
		return contadorLecturas[alimId]?.[equipo] || 0;
	};

	/**
	 * Permite inyectar datos manualmente (útil para pruebas o simulación).
	 */
	const actualizarRegistros = (alimId, nuevosDatos) => {
		setRegistrosEnVivo((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				...nuevosDatos,
			},
		}));
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
