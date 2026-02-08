// Re-exports para mantener compatibilidad con imports existentes
export { normalizarTimestamps, combinarYDeduplicar, calcularLimiteLocal, rangoExcede48h, calcularCobertura } from "./utilidadesFuenteDatos";
export { consultarYCachearRemoto, obtenerDatosLocales } from "./consultasFuenteDatos";
export { determinarEstrategia, obtenerDatosHibrido } from "./estrategiaFuenteDatos";
