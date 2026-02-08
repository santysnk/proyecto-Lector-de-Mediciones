// hooks/rele/plantillasReleUtils.js
// Funciones puras para usePlantillasRele

export const STORAGE_KEY_LEGACY = "rw-plantillas-rele";

export function formatearPlantilla(plantillaBD) {
   return {
      id: plantillaBD.id,
      nombre: plantillaBD.nombre,
      descripcion: plantillaBD.descripcion || '',
      fechaCreacion: plantillaBD.created_at,
      fechaModificacion: plantillaBD.updated_at,
      funcionalidades: plantillaBD.funcionalidades || {},
      etiquetasBits: plantillaBD.etiquetas_bits || {},
      plantillaEtiquetasId: plantillaBD.plantilla_etiquetas_id,
   };
}
