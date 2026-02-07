// Re-exports para mantener compatibilidad con imports existentes
export { abrirDB } from "./indexedDBConexion";

export {
	guardarLectura,
	obtenerLecturasRango,
	obtenerTimestampsExistentes,
	cachearLecturasRemotas,
} from "./indexedDBLecturas";

export {
	limpiarLecturasAntiguas,
	obtenerEstadisticas,
	limpiarTodo,
} from "./indexedDBMantenimiento";
