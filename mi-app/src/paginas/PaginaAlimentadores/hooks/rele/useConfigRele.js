// hooks/rele/useConfigRele.js
// Hook para manejar la configuración de un registrador de tipo Relé

import { useState, useEffect, useRef, useCallback } from "react";
import { CONFIG_INICIAL, generarConfigDesdePlantilla, migrarFuncionalidadesConOrden } from "./configReleUtils";

export function useConfigRele({ configuracionInicial, onChange, obtenerPlantilla }) {
   const configAnteriorRef = useRef(null);
   const inicializadoRef = useRef(false);
   const [config, setConfig] = useState(CONFIG_INICIAL);
   const [filasExpandidas, setFilasExpandidas] = useState(new Set());
   const [tabFuncionalidadesActivo, setTabFuncionalidadesActivo] = useState("mediciones");

   useEffect(() => {
      if (configuracionInicial && !inicializadoRef.current) {
         inicializadoRef.current = true;
         const funcActivas = configuracionInicial.funcionalidadesActivas || {};
         const plantilla = obtenerPlantilla(configuracionInicial.plantillaId);
         const funcMigradas = migrarFuncionalidadesConOrden(funcActivas, plantilla);
         setConfig((prev) => ({
            ...prev,
            plantillaId: configuracionInicial.plantillaId || "",
            conexion: {
               ip: configuracionInicial.conexion?.ip ?? "",
               puerto: configuracionInicial.conexion?.puerto ?? "",
               unitId: configuracionInicial.conexion?.unitId ?? "",
            },
            registroInicial: configuracionInicial.registroInicial ?? "",
            cantidadRegistros: configuracionInicial.cantidadRegistros ?? "",
            intervalo: configuracionInicial.intervalo || 60,
            transformadorTIId: configuracionInicial.transformadorTIId || "",
            transformadorTVId: configuracionInicial.transformadorTVId || "",
            funcionalidadesActivas: funcMigradas,
         }));
         configAnteriorRef.current = JSON.stringify(configuracionInicial);
      }
   }, [configuracionInicial, obtenerPlantilla]);

   useEffect(() => {
      if (!onChange) return;
      const configActualStr = JSON.stringify(config);
      if (configAnteriorRef.current !== configActualStr) {
         configAnteriorRef.current = configActualStr;
         onChange(config);
      }
   }, [config, onChange]);

   const plantillaSeleccionada = config.plantillaId ? obtenerPlantilla(config.plantillaId) : null;

   const handlePlantillaChange = useCallback((plantillaId) => {
      if (!plantillaId) {
         setConfig((prev) => ({ ...prev, plantillaId: "", funcionalidadesActivas: {} }));
         return;
      }
      const plantilla = obtenerPlantilla(plantillaId);
      setConfig((prev) => ({ ...prev, plantillaId, funcionalidadesActivas: generarConfigDesdePlantilla(plantilla) }));
   }, [obtenerPlantilla]);

   const handleConexionChange = useCallback((campo, valor) => {
      setConfig((prev) => ({ ...prev, conexion: { ...prev.conexion, [campo]: valor } }));
   }, []);

   const handleRegistroInicialChange = useCallback((valor) => {
      setConfig((prev) => ({ ...prev, registroInicial: valor === "" ? "" : parseInt(valor) || 0 }));
   }, []);

   const handleCantidadRegistrosChange = useCallback((valor) => {
      setConfig((prev) => ({ ...prev, cantidadRegistros: valor === "" ? "" : parseInt(valor) || 0 }));
   }, []);

   const handleIntervaloChange = useCallback((valor) => {
      setConfig((prev) => ({ ...prev, intervalo: valor === "" ? "" : parseInt(valor) || 0 }));
   }, []);

   const handleToggleFuncionalidad = useCallback((funcId) => {
      setConfig((prev) => {
         const estadoActual = prev.funcionalidadesActivas[funcId];
         const plantillaFunc = plantillaSeleccionada?.funcionalidades?.[funcId];
         if (estadoActual?.habilitado) {
            return { ...prev, funcionalidadesActivas: { ...prev.funcionalidadesActivas, [funcId]: { ...prev.funcionalidadesActivas[funcId], habilitado: false } } };
         }
         return {
            ...prev,
            funcionalidadesActivas: {
               ...prev.funcionalidadesActivas,
               [funcId]: {
                  nombre: plantillaFunc?.nombre || funcId, habilitado: true,
                  registros: plantillaFunc?.registros || [{ etiqueta: "", valor: 0 }],
                  orden: estadoActual?.orden ?? plantillaFunc?.orden ?? Infinity,
               },
            },
         };
      });
   }, [plantillaSeleccionada]);

   const handleCambiarRegistro = useCallback((funcId, regIndex, valor) => {
      setConfig((prev) => ({
         ...prev,
         funcionalidadesActivas: {
            ...prev.funcionalidadesActivas,
            [funcId]: {
               ...prev.funcionalidadesActivas[funcId],
               registros: prev.funcionalidadesActivas[funcId].registros.map((reg, idx) =>
                  idx === regIndex ? { ...reg, valor: valor === "" ? "" : parseInt(valor) || 0 } : reg
               ),
            },
         },
      }));
   }, []);

   const toggleFilaExpandida = useCallback((funcId) => {
      setFilasExpandidas((prev) => {
         const nuevas = new Set(prev);
         nuevas.has(funcId) ? nuevas.delete(funcId) : nuevas.add(funcId);
         return nuevas;
      });
   }, []);

   const aplicarPlantillaCreada = useCallback((nuevaPlantilla) => {
      setConfig((prev) => ({ ...prev, plantillaId: nuevaPlantilla.id, funcionalidadesActivas: generarConfigDesdePlantilla(nuevaPlantilla) }));
   }, []);

   const actualizarFuncionalidades = useCallback((plantillaActualizada) => {
      setConfig((prev) => ({ ...prev, funcionalidadesActivas: generarConfigDesdePlantilla(plantillaActualizada) }));
   }, []);

   const plantillaNoEncontrada = config.plantillaId && !plantillaSeleccionada;

   const funcionalidadesPlantilla = plantillaSeleccionada
      ? Object.entries(plantillaSeleccionada.funcionalidades || {}).sort(([, a], [, b]) => (a.orden ?? Infinity) - (b.orden ?? Infinity))
      : [];

   const cantidadActivas = Object.values(config.funcionalidadesActivas).filter((f) => f.habilitado).length;

   return {
      config, plantillaSeleccionada, plantillaNoEncontrada, funcionalidadesPlantilla,
      cantidadActivas, filasExpandidas, tabFuncionalidadesActivo, setTabFuncionalidadesActivo,
      handlePlantillaChange, handleConexionChange, handleRegistroInicialChange,
      handleCantidadRegistrosChange, handleIntervaloChange, handleToggleFuncionalidad,
      handleCambiarRegistro, toggleFilaExpandida, aplicarPlantillaCreada, actualizarFuncionalidades,
   };
}
