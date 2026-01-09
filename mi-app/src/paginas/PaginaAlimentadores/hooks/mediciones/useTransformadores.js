// hooks/mediciones/useTransformadores.js
// Hook para gestionar transformadores de intensidad (TI) y voltaje (TV)
// ACTUALIZADO: Usa API en lugar de localStorage

import { useState, useEffect, useCallback, useRef } from "react";
import {
   obtenerTransformadoresAPI,
   crearTransformadorAPI,
   actualizarTransformadorAPI,
   eliminarTransformadorAPI,
   migrarTransformadoresAPI,
} from "../../../../servicios/api/transformadores";

// Clave de localStorage para migración
const STORAGE_KEY_LEGACY = "transformadores_ti_tv";

// Transformadores por defecto (solo si no hay nada en BD ni localStorage)
const TRANSFORMADORES_DEFAULT = [
   { tipo: "TI", nombre: "TI 200/1", formula: "x * 200 / 1000" },
   { tipo: "TI", nombre: "TI 400/1", formula: "x * 400 / 1000" },
   { tipo: "TV", nombre: "TV 33kV", formula: "x * 33000 / 10000" },
   { tipo: "TV", nombre: "TV 13.2kV", formula: "x * 13200 / 10000" },
];

/**
 * Hook para gestionar transformadores de intensidad (TI) y voltaje (TV)
 * @param {string} workspaceId - ID del workspace actual
 */
export const useTransformadores = (workspaceId) => {
   const [transformadores, setTransformadores] = useState([]);
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

         const transformadoresLocal = JSON.parse(datosLocal);
         if (!Array.isArray(transformadoresLocal) || transformadoresLocal.length === 0) {
            return null;
         }

         migracionIniciada.current = true;
         console.log(`[useTransformadores] Migrando ${transformadoresLocal.length} transformadores a BD...`);

         const resultado = await migrarTransformadoresAPI(workspaceId, transformadoresLocal);

         if (resultado?.transformadores) {
            // Migración exitosa - limpiar localStorage
            localStorage.removeItem(STORAGE_KEY_LEGACY);
            console.log('[useTransformadores] Migración completada, localStorage limpiado');
            return resultado.transformadores;
         }

         return null;
      } catch (err) {
         console.error('[useTransformadores] Error en migración:', err);
         migracionIniciada.current = false;
         return null;
      }
   }, [workspaceId]);

   /**
    * Carga transformadores desde la API
    */
   const cargarTransformadores = useCallback(async () => {
      if (!workspaceId) {
         setTransformadores([]);
         setCargando(false);
         return;
      }

      setCargando(true);
      setError(null);

      try {
         const resultado = await obtenerTransformadoresAPI(workspaceId);
         let datos = resultado?.transformadores || [];

         // Si no hay datos en BD, intentar migrar desde localStorage
         if (datos.length === 0) {
            const migrados = await migrarDesdeLocalStorage();
            if (migrados && migrados.length > 0) {
               datos = migrados;
            }
         }

         // Si aún no hay datos, crear los por defecto
         if (datos.length === 0) {
            console.log('[useTransformadores] Creando transformadores por defecto...');
            const resultadoMigrar = await migrarTransformadoresAPI(workspaceId, TRANSFORMADORES_DEFAULT);
            datos = resultadoMigrar?.transformadores || [];
         }

         setTransformadores(datos);

      } catch (err) {
         console.error('[useTransformadores] Error cargando:', err);
         setError(err.message || 'Error cargando transformadores');

         // Fallback: intentar cargar de localStorage si la API falla
         try {
            const datosLocal = localStorage.getItem(STORAGE_KEY_LEGACY);
            if (datosLocal) {
               setTransformadores(JSON.parse(datosLocal));
            }
         } catch {
            setTransformadores([]);
         }
      } finally {
         setCargando(false);
      }
   }, [workspaceId, migrarDesdeLocalStorage]);

   // Cargar al montar o cambiar workspace
   useEffect(() => {
      cargarTransformadores();
   }, [cargarTransformadores]);

   // Obtener transformadores por tipo
   const obtenerPorTipo = useCallback(
      (tipo) => transformadores.filter((t) => t.tipo === tipo),
      [transformadores]
   );

   // Obtener TIs
   const obtenerTIs = useCallback(() => obtenerPorTipo("TI"), [obtenerPorTipo]);

   // Obtener TVs
   const obtenerTVs = useCallback(() => obtenerPorTipo("TV"), [obtenerPorTipo]);

   // Obtener Relaciones
   const obtenerRelaciones = useCallback(() => obtenerPorTipo("REL"), [obtenerPorTipo]);

   // Obtener transformador por ID
   const obtenerPorId = useCallback(
      (id) => transformadores.find((t) => t.id === id) || null,
      [transformadores]
   );

   /**
    * Crear transformador
    */
   const crearTransformador = useCallback(
      async (datos) => {
         if (!workspaceId) return null;

         try {
            const resultado = await crearTransformadorAPI(workspaceId, {
               tipo: datos.tipo,
               nombre: datos.nombre?.trim(),
               formula: datos.formula?.trim(),
               descripcion: datos.descripcion?.trim(),
            });

            if (resultado?.transformador) {
               setTransformadores((prev) => [...prev, resultado.transformador]);
               return resultado.transformador;
            }

            return null;
         } catch (err) {
            console.error('[useTransformadores] Error creando:', err);
            setError(err.message);
            return null;
         }
      },
      [workspaceId]
   );

   /**
    * Actualizar transformador
    */
   const actualizarTransformador = useCallback(
      async (id, datos) => {
         try {
            const resultado = await actualizarTransformadorAPI(id, {
               tipo: datos.tipo,
               nombre: datos.nombre?.trim(),
               formula: datos.formula?.trim(),
               descripcion: datos.descripcion?.trim(),
            });

            if (resultado?.transformador) {
               setTransformadores((prev) =>
                  prev.map((t) => (t.id === id ? resultado.transformador : t))
               );
               return true;
            }

            return false;
         } catch (err) {
            console.error('[useTransformadores] Error actualizando:', err);
            setError(err.message);
            return false;
         }
      },
      []
   );

   /**
    * Eliminar transformador
    */
   const eliminarTransformador = useCallback(
      async (id) => {
         try {
            await eliminarTransformadorAPI(id);
            setTransformadores((prev) => prev.filter((t) => t.id !== id));
            return true;
         } catch (err) {
            console.error('[useTransformadores] Error eliminando:', err);
            setError(err.message);
            return false;
         }
      },
      []
   );

   return {
      transformadores,
      cargando,
      error,
      obtenerTIs,
      obtenerTVs,
      obtenerRelaciones,
      obtenerPorId,
      crearTransformador,
      actualizarTransformador,
      eliminarTransformador,
      recargar: cargarTransformadores,
   };
};

export default useTransformadores;
