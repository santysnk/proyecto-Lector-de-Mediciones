// hooks/rele/usePlantillasRele.js
// Hook para gestionar plantillas de relés de protección (usa API)

import { useState, useEffect, useCallback, useRef } from "react";
import {
   obtenerPlantillasAPI, crearPlantillaAPI, actualizarPlantillaAPI,
   eliminarPlantillaAPI, migrarPlantillasAPI,
} from "../../../../servicios/api/plantillasDispositivo";
import { FUNCIONALIDADES_DISPONIBLES } from "../../constantes/funcionalidadesRele";
import { STORAGE_KEY_LEGACY, formatearPlantilla } from "./plantillasReleUtils";

export const usePlantillasRele = (workspaceId) => {
   const [plantillas, setPlantillas] = useState([]);
   const [cargando, setCargando] = useState(true);
   const [error, setError] = useState(null);
   const migracionIniciada = useRef(false);

   const migrarDesdeLocalStorage = useCallback(async () => {
      if (!workspaceId || migracionIniciada.current) return null;
      try {
         const datosLocal = localStorage.getItem(STORAGE_KEY_LEGACY);
         if (!datosLocal) return null;
         const plantillasLocal = JSON.parse(datosLocal);
         if (!Array.isArray(plantillasLocal) || plantillasLocal.length === 0) return null;

         migracionIniciada.current = true;
         const resultado = await migrarPlantillasAPI(workspaceId, plantillasLocal, 'rele');
         if (resultado?.plantillas) {
            localStorage.removeItem(STORAGE_KEY_LEGACY);
            return resultado.plantillas;
         }
         return null;
      } catch (err) {
         console.error('[usePlantillasRele] Error en migración:', err);
         migracionIniciada.current = false;
         return null;
      }
   }, [workspaceId]);

   const cargarPlantillas = useCallback(async () => {
      if (!workspaceId) { setPlantillas([]); setCargando(false); return; }
      setCargando(true);
      setError(null);
      try {
         const resultado = await obtenerPlantillasAPI(workspaceId, 'rele');
         let datos = resultado?.plantillas || [];
         if (datos.length === 0) {
            const migrados = await migrarDesdeLocalStorage();
            if (migrados?.length > 0) datos = migrados;
         }
         setPlantillas(datos.map(formatearPlantilla));
      } catch (err) {
         console.error('[usePlantillasRele] Error cargando:', err);
         setError(err.message || 'Error cargando plantillas');
         try {
            const datosLocal = localStorage.getItem(STORAGE_KEY_LEGACY);
            if (datosLocal) setPlantillas(JSON.parse(datosLocal));
         } catch { setPlantillas([]); }
      } finally {
         setCargando(false);
      }
   }, [workspaceId, migrarDesdeLocalStorage]);

   useEffect(() => { cargarPlantillas(); }, [cargarPlantillas]);

   const crearPlantilla = useCallback(async (datos) => {
      if (!workspaceId) return null;
      try {
         const resultado = await crearPlantillaAPI(workspaceId, {
            tipo_dispositivo: 'rele', nombre: datos.nombre?.trim(),
            descripcion: datos.descripcion?.trim() || null,
            funcionalidades: datos.funcionalidades || {},
            etiquetas_bits: {}, plantilla_etiquetas_id: null,
         });
         if (resultado?.plantilla) {
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
   }, [workspaceId]);

   const actualizarPlantilla = useCallback(async (id, datos) => {
      try {
         const resultado = await actualizarPlantillaAPI(id, {
            nombre: datos.nombre?.trim(), descripcion: datos.descripcion?.trim(),
            funcionalidades: datos.funcionalidades, etiquetas_bits: {}, plantilla_etiquetas_id: null,
         });
         if (resultado?.plantilla) {
            const plantillaFormateada = formatearPlantilla(resultado.plantilla);
            setPlantillas((prev) => prev.map((p) => (p.id === id ? plantillaFormateada : p)));
            return true;
         }
         return false;
      } catch (err) {
         console.error('[usePlantillasRele] Error actualizando:', err);
         setError(err.message);
         return false;
      }
   }, []);

   const eliminarPlantilla = useCallback(async (id) => {
      try {
         await eliminarPlantillaAPI(id);
         setPlantillas((prev) => prev.filter((p) => p.id !== id));
         return true;
      } catch (err) {
         console.error('[usePlantillasRele] Error eliminando:', err);
         setError(err.message);
         return false;
      }
   }, []);

   const obtenerPlantilla = useCallback((id) => plantillas.find((p) => p.id === id) || null, [plantillas]);

   const obtenerFuncionalidadesPlantilla = useCallback((plantillaId) => {
      const plantilla = obtenerPlantilla(plantillaId);
      if (!plantilla) return {};
      const funcionalidades = {};
      Object.keys(plantilla.funcionalidades || {}).forEach((funcId) => {
         const funcPlantilla = plantilla.funcionalidades[funcId];
         const funcBase = FUNCIONALIDADES_DISPONIBLES[funcId];
         if (funcBase && funcPlantilla.habilitado) {
            funcionalidades[funcId] = {
               habilitado: true, registro: funcPlantilla.registro || funcBase.registroDefault,
               cantidad: funcBase.cantidad, nombre: funcBase.nombre,
            };
         }
      });
      return funcionalidades;
   }, [obtenerPlantilla]);

   const generarConfiguracionInicial = useCallback((plantillaId) => {
      const plantilla = obtenerPlantilla(plantillaId);
      if (!plantilla) return {};
      const config = {};
      Object.keys(plantilla.funcionalidades || {}).forEach((funcId) => {
         const funcPlantilla = plantilla.funcionalidades[funcId];
         const funcBase = FUNCIONALIDADES_DISPONIBLES[funcId];
         if (funcBase && funcPlantilla.habilitado) {
            config[funcId] = { habilitado: true, registro: funcPlantilla.registro || funcBase.registroDefault };
         }
      });
      return config;
   }, [obtenerPlantilla]);

   return {
      plantillas, cargando, error,
      crearPlantilla, actualizarPlantilla, eliminarPlantilla,
      obtenerPlantilla, obtenerFuncionalidadesPlantilla, generarConfiguracionInicial,
      recargar: cargarPlantillas,
   };
};

export default usePlantillasRele;
