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
