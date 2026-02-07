// @ts-check
/**
 * Operaciones de lectura/escritura de lecturas en IndexedDB
 */

import { STORE_NAME } from "./indexedDBConexion";

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

    request.onsuccess = () => resolve(/** @type {number} */ (request.result));
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
        fromCache: true,
      };

      const request = store.add(registro);
      request.onsuccess = () => guardadas++;
    }
  });
};
