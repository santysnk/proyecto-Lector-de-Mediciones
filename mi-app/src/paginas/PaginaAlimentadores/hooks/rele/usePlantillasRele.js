// hooks/rele/usePlantillasRele.js
// Hook para gestionar plantillas de relés de protección
// ACTUALIZADO: Usa API en lugar de localStorage

import { useState, useEffect, useCallback, useRef } from "react";
import {
   obtenerPlantillasAPI,
   crearPlantillaAPI,
   actualizarPlantillaAPI,
   eliminarPlantillaAPI,
   migrarPlantillasAPI,
} from "../../../../servicios/api/plantillasDispositivo";
import { FUNCIONALIDADES_DISPONIBLES } from "../../constantes/funcionalidadesRele";

// Clave de localStorage para migración
const STORAGE_KEY_LEGACY = "rw-plantillas-rele";

/**
 * Hook para gestionar plantillas de relés de protección.
 * @param {string} workspaceId - ID del workspace actual
 */
export const usePlantillasRele = (workspaceId) => {
   const [plantillas, setPlantillas] = useState([]);
   const [cargando, setCargando] = useState(true);
   const [error, setError] = useState(null);

   // Ref para evitar múltiples migraciones
   const migracionIniciada = useRef(false);

   /**
    * Migra datos de localStorage a la BD (una sola vez)
    */
   const migrarDesdeLocalStorage = useCallback(async () => {
      if (!workspaceId || migracionIniciada.current) return null;

      try {
         const datosLocal = localStorage.getItem(STORAGE_KEY_LEGACY);
         if (!datosLocal) return null;

         const plantillasLocal = JSON.parse(datosLocal);
         if (!Array.isArray(plantillasLocal) || plantillasLocal.length === 0) {
            return null;
         }

         migracionIniciada.current = true;
         console.log(`[usePlantillasRele] Migrando ${plantillasLocal.length} plantillas a BD...`);

         const resultado = await migrarPlantillasAPI(workspaceId, plantillasLocal, 'rele');

         if (resultado?.plantillas) {
            // Migración exitosa - limpiar localStorage
            localStorage.removeItem(STORAGE_KEY_LEGACY);
            console.log('[usePlantillasRele] Migración completada, localStorage limpiado');
            return resultado.plantillas;
         }

         return null;
      } catch (err) {
         console.error('[usePlantillasRele] Error en migración:', err);
         migracionIniciada.current = false;
         return null;
      }
   }, [workspaceId]);

   /**
    * Carga las plantillas desde la API
    */
   const cargarPlantillas = useCallback(async () => {
      if (!workspaceId) {
         setPlantillas([]);
         setCargando(false);
         return;
      }

      setCargando(true);
      setError(null);

      try {
         const resultado = await obtenerPlantillasAPI(workspaceId, 'rele');
         let datos = resultado?.plantillas || [];

         // Si no hay datos en BD, intentar migrar desde localStorage
         if (datos.length === 0) {
            const migrados = await migrarDesdeLocalStorage();
            if (migrados && migrados.length > 0) {
               datos = migrados;
            }
         }

         // Formatear plantillas
         setPlantillas(datos.map(formatearPlantilla));

      } catch (err) {
         console.error('[usePlantillasRele] Error cargando:', err);
         setError(err.message || 'Error cargando plantillas');

         // Fallback: intentar cargar de localStorage si la API falla
         try {
            const datosLocal = localStorage.getItem(STORAGE_KEY_LEGACY);
            if (datosLocal) {
               setPlantillas(JSON.parse(datosLocal));
            }
         } catch {
            setPlantillas([]);
         }
      } finally {
         setCargando(false);
      }
   }, [workspaceId, migrarDesdeLocalStorage]);

   // Cargar al montar o cambiar workspace
   useEffect(() => {
      cargarPlantillas();
   }, [cargarPlantillas]);

   /**
    * Crea una nueva plantilla
    * @param {Object} datos - { nombre, descripcion, funcionalidades }
    */
   const crearPlantilla = useCallback(
      async (datos) => {
         if (!workspaceId) return null;

         try {
            const resultado = await crearPlantillaAPI(workspaceId, {
               tipo_dispositivo: 'rele',
               nombre: datos.nombre?.trim(),
               descripcion: datos.descripcion?.trim() || null,
               funcionalidades: datos.funcionalidades || {},
               // Etiquetas de bits ahora están embebidas en cada funcionalidad
               etiquetas_bits: {},
               plantilla_etiquetas_id: null,
            });

            if (resultado?.plantilla) {
               // Convertir formato BD a formato frontend
               const plantillaFormateada = formatearPlantilla(resultado.plantilla);
               setPlantillas((prev) => [...prev, plantillaFormateada]);
               return plantillaFormateada;
            }

            return null;
         } catch (err) {
            console.error('[usePlantillasRele] Error creando:', err);
            setError(err.message);
            return null;
         }
      },
      [workspaceId]
   );

   /**
    * Actualiza una plantilla existente
    * @param {string} id - ID de la plantilla
    * @param {Object} datos - Datos a actualizar
    */
   const actualizarPlantilla = useCallback(
      async (id, datos) => {
         try {
            const resultado = await actualizarPlantillaAPI(id, {
               nombre: datos.nombre?.trim(),
               descripcion: datos.descripcion?.trim(),
               funcionalidades: datos.funcionalidades,
               // Limpiar etiquetas globales (ahora están embebidas en cada funcionalidad)
               etiquetas_bits: {},
               plantilla_etiquetas_id: null,
            });

            if (resultado?.plantilla) {
               const plantillaFormateada = formatearPlantilla(resultado.plantilla);
               setPlantillas((prev) =>
                  prev.map((p) => (p.id === id ? plantillaFormateada : p))
               );
               return true;
            }

            return false;
         } catch (err) {
            console.error('[usePlantillasRele] Error actualizando:', err);
            setError(err.message);
            return false;
         }
      },
      []
   );

   /**
    * Elimina una plantilla
    * @param {string} id - ID de la plantilla a eliminar
    */
   const eliminarPlantilla = useCallback(
      async (id) => {
         try {
            await eliminarPlantillaAPI(id);
            setPlantillas((prev) => prev.filter((p) => p.id !== id));
            return true;
         } catch (err) {
            console.error('[usePlantillasRele] Error eliminando:', err);
            setError(err.message);
            return false;
         }
      },
      []
   );

   /**
    * Obtiene una plantilla por ID
    * @param {string} id - ID de la plantilla
    */
   const obtenerPlantilla = useCallback(
      (id) => plantillas.find((p) => p.id === id) || null,
      [plantillas]
   );

   /**
    * Obtiene las funcionalidades de una plantilla con sus valores por defecto
    * @param {string} plantillaId - ID de la plantilla
    */
   const obtenerFuncionalidadesPlantilla = useCallback(
      (plantillaId) => {
         const plantilla = obtenerPlantilla(plantillaId);
         if (!plantilla) return {};

         const funcionalidades = {};
         Object.keys(plantilla.funcionalidades || {}).forEach((funcId) => {
            const funcPlantilla = plantilla.funcionalidades[funcId];
            const funcBase = FUNCIONALIDADES_DISPONIBLES[funcId];

            if (funcBase && funcPlantilla.habilitado) {
               funcionalidades[funcId] = {
                  habilitado: true,
                  registro: funcPlantilla.registro || funcBase.registroDefault,
                  cantidad: funcBase.cantidad,
                  nombre: funcBase.nombre,
               };
            }
         });

         return funcionalidades;
      },
      [obtenerPlantilla]
   );

   /**
    * Genera la configuración de funcionalidades activas por defecto basada en una plantilla
    * @param {string} plantillaId - ID de la plantilla
    */
   const generarConfiguracionInicial = useCallback(
      (plantillaId) => {
         const plantilla = obtenerPlantilla(plantillaId);
         if (!plantilla) return {};

         const config = {};
         Object.keys(plantilla.funcionalidades || {}).forEach((funcId) => {
            const funcPlantilla = plantilla.funcionalidades[funcId];
            const funcBase = FUNCIONALIDADES_DISPONIBLES[funcId];

            if (funcBase && funcPlantilla.habilitado) {
               config[funcId] = {
                  habilitado: true,
                  registro: funcPlantilla.registro || funcBase.registroDefault,
               };
            }
         });

         return config;
      },
      [obtenerPlantilla]
   );

   return {
      plantillas,
      cargando,
      error,
      crearPlantilla,
      actualizarPlantilla,
      eliminarPlantilla,
      obtenerPlantilla,
      obtenerFuncionalidadesPlantilla,
      generarConfiguracionInicial,
      recargar: cargarPlantillas,
   };
};

/**
 * Convierte el formato de BD al formato esperado por el frontend
 */
function formatearPlantilla(plantillaBD) {
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

export default usePlantillasRele;
