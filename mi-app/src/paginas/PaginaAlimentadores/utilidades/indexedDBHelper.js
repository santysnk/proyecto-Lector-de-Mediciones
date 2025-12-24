/**
 * Helper para operaciones con IndexedDB
 * Almacena lecturas de los últimos 48 horas para acceso rápido local
 */

const DB_NAME = "RelayWatchHistorial";
const DB_VERSION = 1;
const STORE_NAME = "lecturas";

/**
 * Abre la conexión a IndexedDB y crea el schema si es necesario
 * @returns {Promise<IDBDatabase>}
 */
export const abrirDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Error abriendo IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Crear object store con índices
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Índices para consultas eficientes
        store.createIndex("alimentadorId", "alimentadorId", { unique: false });
        store.createIndex("registradorId", "registradorId", { unique: false });
        store.createIndex("zona", "zona", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });

        // Índice compuesto para búsquedas por alimentador + zona + tiempo
        store.createIndex(
          "alimZonaTimestamp",
          ["alimentadorId", "zona", "timestamp"],
          { unique: false }
        );
      }
    };
  });
};

/**
 * Guarda una lectura en IndexedDB
 * @param {IDBDatabase} db - Conexión a la base de datos
 * @param {Object} lectura - Datos de la lectura
 * @returns {Promise<number>} - ID de la lectura insertada
 */
export const guardarLectura = async (db, lectura) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const registro = {
      alimentadorId: lectura.alimentadorId,
      registradorId: lectura.registradorId,
      zona: lectura.zona,
      timestamp: lectura.timestamp || Date.now(),
      valores: lectura.valores,
      indiceInicial: lectura.indiceInicial,
      exito: lectura.exito,
      createdAt: Date.now(),
    };

    const request = store.add(registro);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Obtiene lecturas en un rango de tiempo para un alimentador/zona específicos
 * @param {IDBDatabase} db - Conexión a la base de datos
 * @param {string} alimentadorId - ID del alimentador
 * @param {string} registradorId - ID del registrador (opcional, para filtrar)
 * @param {string} zona - "superior" o "inferior"
 * @param {number} desde - Timestamp inicial (ms)
 * @param {number} hasta - Timestamp final (ms)
 * @returns {Promise<Array>} - Array de lecturas
 */
export const obtenerLecturasRango = async (
  db,
  alimentadorId,
  registradorId,
  zona,
  desde,
  hasta
) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("alimZonaTimestamp");

    // Rango de búsqueda usando índice compuesto
    const rango = IDBKeyRange.bound(
      [alimentadorId, zona, desde],
      [alimentadorId, zona, hasta]
    );

    const request = index.getAll(rango);

    request.onsuccess = () => {
      let resultados = request.result;

      // Filtrar por registradorId si se especifica
      if (registradorId) {
        resultados = resultados.filter((r) => r.registradorId === registradorId);
      }

      // Ordenar por timestamp ascendente
      resultados.sort((a, b) => a.timestamp - b.timestamp);

      resolve(resultados);
    };

    request.onerror = () => reject(request.error);
  });
};

/**
 * Elimina lecturas más antiguas que el tiempo de retención
 * @param {IDBDatabase} db - Conexión a la base de datos
 * @param {number} horasRetencion - Horas de datos a mantener (default: 48)
 * @returns {Promise<number>} - Cantidad de registros eliminados
 */
export const limpiarLecturasAntiguas = async (db, horasRetencion = 48) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("timestamp");

    const limite = Date.now() - horasRetencion * 60 * 60 * 1000;
    const rango = IDBKeyRange.upperBound(limite);

    let eliminados = 0;
    const request = index.openCursor(rango);

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        eliminados++;
        cursor.continue();
      } else {
        resolve(eliminados);
      }
    };

    request.onerror = () => reject(request.error);
  });
};

/**
 * Cuenta el número de lecturas para un alimentador
 * @param {IDBDatabase} db - Conexión a la base de datos
 * @param {string} alimentadorId - ID del alimentador
 * @returns {Promise<number>} - Cantidad de lecturas
 */
export const contarLecturas = async (db, alimentadorId) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("alimentadorId");

    const request = index.count(alimentadorId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Obtiene estadísticas del almacenamiento
 * @param {IDBDatabase} db - Conexión a la base de datos
 * @returns {Promise<Object>} - Estadísticas
 */
export const obtenerEstadisticas = async (db) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const countRequest = store.count();

    countRequest.onsuccess = () => {
      resolve({
        totalLecturas: countRequest.result,
      });
    };

    countRequest.onerror = () => reject(countRequest.error);
  });
};

/**
 * Elimina todas las lecturas (para testing o reset)
 * @param {IDBDatabase} db - Conexión a la base de datos
 * @returns {Promise<void>}
 */
export const limpiarTodo = async (db) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Obtiene los timestamps existentes en un rango para evitar duplicados
 * @param {IDBDatabase} db - Conexión a la base de datos
 * @param {string} alimentadorId - ID del alimentador
 * @param {string} zona - "superior" o "inferior"
 * @param {number} desde - Timestamp inicial (ms)
 * @param {number} hasta - Timestamp final (ms)
 * @returns {Promise<Set<number>>} - Set de timestamps existentes
 */
export const obtenerTimestampsExistentes = async (
  db,
  alimentadorId,
  zona,
  desde,
  hasta
) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("alimZonaTimestamp");

    const rango = IDBKeyRange.bound(
      [alimentadorId, zona, desde],
      [alimentadorId, zona, hasta]
    );

    const request = index.getAll(rango);

    request.onsuccess = () => {
      const timestamps = new Set(request.result.map((r) => r.timestamp));
      resolve(timestamps);
    };

    request.onerror = () => reject(request.error);
  });
};

/**
 * Cachea datos remotos en IndexedDB, evitando duplicados por timestamp
 * @param {IDBDatabase} db - Conexión a la base de datos
 * @param {string} alimentadorId - ID del alimentador
 * @param {string} registradorId - ID del registrador
 * @param {string} zona - "superior" o "inferior"
 * @param {Array} lecturas - Array de lecturas remotas a cachear
 * @returns {Promise<number>} - Cantidad de lecturas nuevas guardadas
 */
export const cachearLecturasRemotas = async (
  db,
  alimentadorId,
  registradorId,
  zona,
  lecturas
) => {
  if (!lecturas || lecturas.length === 0) return 0;

  // Obtener rango de timestamps de las lecturas a cachear
  const timestamps = lecturas.map((l) =>
    typeof l.timestamp === "string" ? new Date(l.timestamp).getTime() : l.timestamp
  );
  const desde = Math.min(...timestamps);
  const hasta = Math.max(...timestamps);

  // Obtener timestamps que ya existen en local
  const existentes = await obtenerTimestampsExistentes(
    db,
    alimentadorId,
    zona,
    desde,
    hasta
  );

  // Filtrar solo las lecturas nuevas
  const lecturasNuevas = lecturas.filter((l) => {
    const ts = typeof l.timestamp === "string" ? new Date(l.timestamp).getTime() : l.timestamp;
    return !existentes.has(ts);
  });

  if (lecturasNuevas.length === 0) return 0;

  // Guardar las nuevas en una transacción
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    let guardadas = 0;

    tx.oncomplete = () => resolve(guardadas);
    tx.onerror = () => reject(tx.error);

    for (const lectura of lecturasNuevas) {
      const ts = typeof lectura.timestamp === "string"
        ? new Date(lectura.timestamp).getTime()
        : lectura.timestamp;

      const registro = {
        alimentadorId,
        registradorId,
        zona,
        timestamp: ts,
        valores: lectura.valores,
        indiceInicial: lectura.indice_inicial ?? lectura.indiceInicial ?? 0,
        exito: lectura.exito !== false,
        createdAt: Date.now(),
        fromCache: true, // Marca para identificar datos cacheados
      };

      const request = store.add(registro);
      request.onsuccess = () => guardadas++;
    }
  });
};
