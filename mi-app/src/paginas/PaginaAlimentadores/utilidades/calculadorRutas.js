// src/paginas/PaginaAlimentadores/utilidades/calculadorRutas.js

/**
 * Utilidades para calcular rutas en el diagrama unifilar.
 * Las chispas viajan desde bornes emisores hasta bornes receptores
 * siguiendo las líneas (celdas adyacentes) del diagrama.
 */

/**
 * Construye un grafo de adyacencia a partir de las celdas pintadas.
 * Cada celda puede conectarse con sus 4 vecinos (arriba, abajo, izquierda, derecha)
 * si estos también están pintados (sin importar el color).
 *
 * @param {Object} celdas - Objeto con claves "x,y" y valores de color
 * @returns {Object} Grafo de adyacencia { "x,y": ["x1,y1", "x2,y2", ...] }
 */
export function construirGrafo(celdas) {
	const grafo = {};
	const clavesCeldas = Object.keys(celdas);

	// Para búsqueda rápida
	const celdasSet = new Set(clavesCeldas);

	clavesCeldas.forEach(clave => {
		const [x, y] = clave.split(",").map(Number);
		const vecinos = [];

		// Verificar los 4 vecinos
		const posiblesVecinos = [
			`${x},${y - 1}`, // arriba
			`${x},${y + 1}`, // abajo
			`${x - 1},${y}`, // izquierda
			`${x + 1},${y}`, // derecha
		];

		posiblesVecinos.forEach(vecino => {
			if (celdasSet.has(vecino)) {
				vecinos.push(vecino);
			}
		});

		grafo[clave] = vecinos;
	});

	return grafo;
}

/**
 * Calcula todas las rutas posibles desde un emisor hasta cualquier receptor.
 * Usa BFS para encontrar el camino más corto a cada receptor.
 *
 * @param {Object} emisor - Borne emisor { x, y, id, ... }
 * @param {Array} bornes - Array de todos los bornes
 * @param {Object} grafo - Grafo de adyacencia
 * @returns {Array} Array de rutas [{ receptorId, ruta: ["x,y", ...] }, ...]
 */
export function calcularRutasDesdeEmisor(emisor, bornes, grafo) {
	const claveEmisor = `${emisor.x},${emisor.y}`;
	const receptores = bornes.filter(b => b.tipo === "RECEPTOR");

	// Si no hay grafo o el emisor no está en el grafo, retornar vacío
	if (!grafo[claveEmisor]) {
		return [];
	}

	// Crear mapa de posición a borne para búsqueda rápida
	const posicionAReceptor = {};
	receptores.forEach(r => {
		posicionAReceptor[`${r.x},${r.y}`] = r;
	});

	// BFS para encontrar rutas a todos los receptores
	const rutas = [];
	const visitados = new Set([claveEmisor]);
	const cola = [[claveEmisor, [claveEmisor]]]; // [posición, rutaHastaAquí]

	while (cola.length > 0) {
		const [posActual, rutaActual] = cola.shift();

		// Si llegamos a un receptor, guardar la ruta
		if (posActual !== claveEmisor && posicionAReceptor[posActual]) {
			rutas.push({
				receptorId: posicionAReceptor[posActual].id,
				ruta: rutaActual,
			});
			// Continuamos buscando para encontrar otros receptores
		}

		// Explorar vecinos
		const vecinos = grafo[posActual] || [];
		vecinos.forEach(vecino => {
			if (!visitados.has(vecino)) {
				visitados.add(vecino);
				cola.push([vecino, [...rutaActual, vecino]]);
			}
		});
	}

	return rutas;
}

/**
 * Verifica si desde una celda se puede llegar a algún receptor
 * (usado para decisiones en bifurcaciones).
 *
 * @param {string} celda - Clave de la celda "x,y"
 * @param {Set} receptoresSet - Set de claves de receptores
 * @param {Object} grafo - Grafo de adyacencia
 * @param {Set} visitados - Celdas ya visitadas (para evitar ciclos)
 * @returns {boolean} true si se puede llegar a un receptor
 */
export function llegaAReceptor(celda, receptoresSet, grafo, visitados = new Set()) {
	if (receptoresSet.has(celda)) {
		return true;
	}

	if (visitados.has(celda)) {
		return false;
	}

	visitados.add(celda);

	const vecinos = grafo[celda] || [];
	for (const vecino of vecinos) {
		if (!visitados.has(vecino)) {
			if (llegaAReceptor(vecino, receptoresSet, grafo, visitados)) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Dado el estado actual de una chispa en una bifurcación,
 * determina hacia qué caminos debe continuar.
 *
 * Reglas:
 * - Si ambos caminos llevan a receptores: la chispa se divide (retorna ambos)
 * - Si ambos caminos llevan a emisores: la chispa desaparece (retorna vacío)
 * - Si hay mezcla: sigue solo hacia el receptor (retorna solo el camino correcto)
 *
 * @param {string} posicionActual - Clave de la celda actual
 * @param {string} posicionAnterior - Clave de la celda anterior (de donde viene)
 * @param {Object} grafo - Grafo de adyacencia
 * @param {Array} bornes - Array de todos los bornes
 * @returns {Array} Array de claves de celdas hacia donde continuar
 */
export function decidirDireccionEnBifurcacion(posicionActual, posicionAnterior, grafo, bornes) {
	const vecinos = grafo[posicionActual] || [];

	// Filtrar el vecino de donde venimos
	const posiblesCaminos = vecinos.filter(v => v !== posicionAnterior);

	// Si solo hay un camino o ninguno, no hay decisión
	if (posiblesCaminos.length <= 1) {
		return posiblesCaminos;
	}

	// Crear sets para búsqueda rápida
	const emisoresSet = new Set(
		bornes.filter(b => b.tipo === "EMISOR").map(b => `${b.x},${b.y}`)
	);
	const receptoresSet = new Set(
		bornes.filter(b => b.tipo === "RECEPTOR").map(b => `${b.x},${b.y}`)
	);

	// Verificar cada camino si lleva a receptor
	const caminosAReceptor = [];
	const caminosAEmisor = [];

	posiblesCaminos.forEach(camino => {
		// Clonar visitados para cada exploración
		const visitados = new Set([posicionActual, posicionAnterior]);

		if (llegaAReceptor(camino, receptoresSet, grafo, visitados)) {
			caminosAReceptor.push(camino);
		} else {
			// Si no llega a receptor, asumimos que lleva a emisor o callejón sin salida
			caminosAEmisor.push(camino);
		}
	});

	// Aplicar reglas de bifurcación
	if (caminosAReceptor.length > 0) {
		// Si hay caminos a receptores, seguir todos ellos (dividir chispa)
		return caminosAReceptor;
	} else {
		// Todos llevan a emisores o callejones: la chispa desaparece
		return [];
	}
}

/**
 * Precalcula todas las rutas desde todos los emisores a todos los receptores.
 * Útil para inicializar el sistema de chispas.
 *
 * @param {Array} bornes - Array de todos los bornes
 * @param {Object} celdas - Objeto de celdas pintadas
 * @returns {Object} Mapa { emisorId: [{ receptorId, ruta }, ...] }
 */
export function precalcularTodasLasRutas(bornes, celdas) {
	const grafo = construirGrafo(celdas);
	const emisores = bornes.filter(b => b.tipo === "EMISOR");
	const resultado = {};

	emisores.forEach(emisor => {
		resultado[emisor.id] = calcularRutasDesdeEmisor(emisor, bornes, grafo);
	});

	return resultado;
}

/**
 * Obtiene el siguiente paso para una chispa en movimiento.
 * Maneja bifurcaciones según las reglas del sistema.
 *
 * @param {Object} chispa - Estado de la chispa { ruta, posicion, ... }
 * @param {Object} grafo - Grafo de adyacencia
 * @param {Array} bornes - Array de todos los bornes
 * @returns {Object} { continuar: boolean, nuevasPosiciones: [clave, ...] }
 */
export function obtenerSiguientePaso(chispa, grafo, bornes) {
	const { ruta, posicion } = chispa;

	// Si ya llegamos al final de la ruta
	if (posicion >= ruta.length - 1) {
		return { continuar: false, nuevasPosiciones: [] };
	}

	const posActual = ruta[posicion];
	const posSiguiente = ruta[posicion + 1];

	// Verificar si hay bifurcación en el siguiente paso
	const vecinosSiguiente = grafo[posSiguiente] || [];

	if (vecinosSiguiente.length > 2) {
		// Hay bifurcación - decidir hacia dónde ir
		const direcciones = decidirDireccionEnBifurcacion(posSiguiente, posActual, grafo, bornes);

		if (direcciones.length === 0) {
			// La chispa desaparece
			return { continuar: false, nuevasPosiciones: [] };
		}

		// Retornar las posibles direcciones (para dividir chispa si hay más de una)
		return { continuar: true, nuevasPosiciones: direcciones };
	}

	// Sin bifurcación - continuar normalmente
	return { continuar: true, nuevasPosiciones: [posSiguiente] };
}
