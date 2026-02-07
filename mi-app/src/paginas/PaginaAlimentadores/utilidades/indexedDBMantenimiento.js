// @ts-check
/**
 * Operaciones de mantenimiento y estadísticas de IndexedDB
 */

import { STORE_NAME } from "./indexedDBConexion";

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
      const cursor = /** @type {IDBRequest} */ (event.target).result;
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
