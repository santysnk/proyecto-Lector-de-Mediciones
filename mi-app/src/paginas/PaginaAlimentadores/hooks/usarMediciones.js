import { useState, useRef, useEffect } from 'react';
import { leerRegistrosModbus } from '../utilidades/clienteModbus';

/**
 * Hook personalizado para manejar mediciones de Modbus
 * Controla timers periódicos, lecturas y estado de mediciones activas
 * 
 * @returns {Object} Estado y funciones para trabajar con mediciones
 */
export const usarMediciones = () => {
	// Registros leídos en vivo por alimentador y equipoç
	// Estructura: { [alimId]: { rele: [{index, address, value}], analizador: [...] } }
	const [registrosEnVivo, setRegistrosEnVivo] = useState({});

	// Estados de mediciones activas por alimentador y equipo
	// Estructura: { [alimId]: { rele: boolean, analizador: boolean } }
	const [medicionesActivas, setMedicionesActivas] = useState({});

	// Timestamps de inicio de mediciones (para sincronizar animaciones)
	// Estructura: { [alimId]: { rele: timestamp, analizador: timestamp } }
	const [timestampsInicio, setTimestampsInicio] = useState({});

	// Timers de setInterval (no genera re-render, por eso useRef)
	// Estructura: { [alimId]: { rele: timerId, analizador: timerId } }
	const timersRef = useRef({});

	// Efecto: Limpiar todos los timers al desmontar el componente
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
	 * Hace una lectura única (tick) de Modbus
	 * 
	 * @param {Object} alimentador - Objeto alimentador completo
	 * @param {string} equipo - "rele" o "analizador"
	 * @returns {Promise<Array|null>} Registros leídos o null si hay error
	 */
	const hacerLecturaModbus = async (alimentador, equipo) => {
		if (!alimentador) return null;

		// Obtener configuración según el equipo
		const configuracion = equipo === "analizador"
			? alimentador.analizador
			: alimentador.rele;

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

	// Aplica nuevos registros y actualiza el timestamp de última lectura
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

		// Actualizar timestamp de última lectura
		setTimestampsInicio((anteriores) => ({
			...anteriores,
			[alimId]: {
				...(anteriores[alimId] || {}),
				[equipo]: ahora,
			},
		}));
	};


	/**
	 * Inicia medición periódica para un alimentador y equipo
	 * 
	 * @param {Object} alimentador - Alimentador completo
	 * @param {string} equipo - "rele" o "analizador"
	 * @param {Object} configuracionOverride - Configuración temporal (opcional)
	 */
	const iniciarMedicion = async (alimentador, equipo, configuracionOverride) => {
		const alimId = alimentador.id;

		// Si hay override, mezclarlo con la config del alimentador
		let alimentadorConfig = { ...alimentador };
		if (configuracionOverride) {
			if (configuracionOverride.periodoSegundos != null) {
				alimentadorConfig.periodoSegundos = configuracionOverride.periodoSegundos;
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
		let periodoSegundos = 60; // Por defecto
		if (equipo === "rele") {
			periodoSegundos = alimentadorConfig.periodoSegundos || 60;
		} else {
			periodoSegundos = alimentadorConfig.analizador?.periodoSegundos || 60;
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

		// Marcar como medición activa y guardar timestamp de inicio
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
	 * Detiene medición de un alimentador y equipo
	 * 
	 * @param {number} alimId - ID del alimentador
	 * @param {string} equipo - "rele" o "analizador"
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
	 * Alterna medición (on/off) de un alimentador y equipo
	 * 
	 * @param {Object} alimentador - Alimentador completo
	 * @param {string} equipo - "rele" o "analizador"
	 * @param {Object} configuracionOverride - Config temporal (opcional)
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
	 * Obtiene los registros de un alimentador y equipo
	 * 
	 * @param {number} alimId - ID del alimentador
	 * @param {string} equipo - "rele" o "analizador"
	 * @returns {Array} Lista de registros o array vacío
	 */
	const obtenerRegistros = (alimId, equipo) => {
		return registrosEnVivo[alimId]?.[equipo] || [];
	};

	/**
	 * Verifica si un alimentador está midiendo
	 * 
	 * @param {number} alimId - ID del alimentador
	 * @param {string} equipo - "rele" o "analizador"
	 * @returns {boolean} true si está midiendo
	 */
	const estaMidiendo = (alimId, equipo) => {
		return !!medicionesActivas[alimId]?.[equipo];
	};

	/**
	 * Obtiene el timestamp de inicio de una medición
	 * 
	 * @param {number} alimId - ID del alimentador
	 * @param {string} equipo - "rele" o "analizador"
	 * @returns {number|null} Timestamp de inicio o null
	 */
	const obtenerTimestampInicio = (alimId, equipo) => {
		return timestampsInicio[alimId]?.[equipo] || null;
	};

	/**
	 * Actualiza los registros directamente (útil para preview)
	 * 
	 * @param {number} alimId - ID del alimentador
	 * @param {Object} nuevosDatos - { rele?: [...], analizador?: [...] }
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
		actualizarRegistros,
	};
};
