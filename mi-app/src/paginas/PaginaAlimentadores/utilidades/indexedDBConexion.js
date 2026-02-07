// @ts-check
/**
 * Conexión y schema de IndexedDB para almacenamiento local de lecturas
 */

const DB_NAME = "RelayWatchHistorial";
const DB_VERSION = 1;
export const STORE_NAME = "lecturas";

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
      const db = /** @type {IDBOpenDBRequest} */ (event.target).result;

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
