// hooks/useConfigRele.js
// Hook para manejar la configuración de un registrador de tipo Relé

import { useState, useEffect, useRef, useCallback } from "react";

const CONFIG_INICIAL = {
   plantillaId: "",
   conexion: {
      ip: "",
      puerto: "",
      unitId: "",
   },
   registroInicial: "",
   cantidadRegistros: "",
   intervalo: 60,
   transformadorTIId: "",
   transformadorTVId: "",
   funcionalidadesActivas: {},
};

/**
 * Hook para manejar la configuración de un relé
 * @param {Object} params - Parámetros del hook
 * @param {Object} params.configuracionInicial - Configuración inicial para edición
 * @param {Function} params.onChange - Callback cuando cambia la configuración
 * @param {Function} params.obtenerPlantilla - Función para obtener una plantilla por ID
 * @returns {Object} Estado y funciones de configuración
 */
export function useConfigRele({ configuracionInicial, onChange, obtenerPlantilla }) {
   const configAnteriorRef = useRef(null);
   const inicializadoRef = useRef(false);

   const [config, setConfig] = useState(CONFIG_INICIAL);

   // Estado para filas expandidas en la tabla de funcionalidades
   const [filasExpandidas, setFilasExpandidas] = useState(new Set());

   // Estado para el tab activo en funcionalidades
   const [tabFuncionalidadesActivo, setTabFuncionalidadesActivo] = useState("mediciones");

   // Cargar configuración inicial si existe (solo una vez al montar)
   useEffect(() => {
      if (configuracionInicial && !inicializadoRef.current) {
         inicializadoRef.current = true;
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
            funcionalidadesActivas: configuracionInicial.funcionalidadesActivas || {},
         }));
         configAnteriorRef.current = JSON.stringify(configuracionInicial);
      }
   }, [configuracionInicial]);

   // Notificar cambios al padre
   useEffect(() => {
      if (!onChange) return;

      const configActualStr = JSON.stringify(config);

      if (configAnteriorRef.current !== configActualStr) {
         configAnteriorRef.current = configActualStr;
         console.log('[useConfigRele] onChange llamado con:', config);
         onChange(config);
      }
   }, [config, onChange]);

   // Obtener la plantilla seleccionada
   const plantillaSeleccionada = config.plantillaId
      ? obtenerPlantilla(config.plantillaId)
      : null;

   /**
    * Generar configuración inicial basada en una plantilla
    */
   const generarConfigDesdePlantilla = useCallback((plantilla) => {
      if (!plantilla) return {};

      const funcActivas = {};
      Object.entries(plantilla.funcionalidades || {}).forEach(([funcId, func]) => {
         if (func.habilitado !== false) {
            funcActivas[funcId] = {
               nombre: func.nombre,
               habilitado: true,
               registros: func.registros || [{ etiqueta: "", valor: func.registro || 0 }],
            };
         }
      });

      return funcActivas;
   }, []);

   /**
    * Cambiar plantilla seleccionada
    */
   const handlePlantillaChange = useCallback((plantillaId) => {
      if (!plantillaId) {
         setConfig((prev) => ({
            ...prev,
            plantillaId: "",
            funcionalidadesActivas: {},
         }));
         return;
      }

      const plantilla = obtenerPlantilla(plantillaId);
      const funcionalidadesIniciales = generarConfigDesdePlantilla(plantilla);

      setConfig((prev) => ({
         ...prev,
         plantillaId,
         funcionalidadesActivas: funcionalidadesIniciales,
      }));
   }, [obtenerPlantilla, generarConfigDesdePlantilla]);

   /**
    * Cambiar campo de conexión
    */
   const handleConexionChange = useCallback((campo, valor) => {
      setConfig((prev) => ({
         ...prev,
         conexion: {
            ...prev.conexion,
            [campo]: valor,
         },
      }));
   }, []);

   /**
    * Cambiar registro inicial
    */
   const handleRegistroInicialChange = useCallback((valor) => {
      setConfig((prev) => ({
         ...prev,
         registroInicial: valor === "" ? "" : parseInt(valor) || 0,
      }));
   }, []);

   /**
    * Cambiar cantidad de registros
    */
   const handleCantidadRegistrosChange = useCallback((valor) => {
      setConfig((prev) => ({
         ...prev,
         cantidadRegistros: valor === "" ? "" : parseInt(valor) || 0,
      }));
   }, []);

   /**
    * Cambiar intervalo
    */
   const handleIntervaloChange = useCallback((valor) => {
      setConfig((prev) => ({
         ...prev,
         intervalo: valor === "" ? "" : parseInt(valor) || 0,
      }));
   }, []);

   /**
    * Toggle habilitar/deshabilitar una funcionalidad
    */
   const handleToggleFuncionalidad = useCallback((funcId) => {
      setConfig((prev) => {
         const estadoActual = prev.funcionalidadesActivas[funcId];
         const plantillaFunc = plantillaSeleccionada?.funcionalidades?.[funcId];

         if (estadoActual?.habilitado) {
            const nuevasFunc = { ...prev.funcionalidadesActivas };
            nuevasFunc[funcId] = { ...nuevasFunc[funcId], habilitado: false };
            return { ...prev, funcionalidadesActivas: nuevasFunc };
         } else {
            return {
               ...prev,
               funcionalidadesActivas: {
                  ...prev.funcionalidadesActivas,
                  [funcId]: {
                     nombre: plantillaFunc?.nombre || funcId,
                     habilitado: true,
                     registros: plantillaFunc?.registros || [{ etiqueta: "", valor: 0 }],
                  },
               },
            };
         }
      });
   }, [plantillaSeleccionada]);

   /**
    * Cambiar valor de un registro específico
    */
   const handleCambiarRegistro = useCallback((funcId, regIndex, valor) => {
      setConfig((prev) => ({
         ...prev,
         funcionalidadesActivas: {
            ...prev.funcionalidadesActivas,
            [funcId]: {
               ...prev.funcionalidadesActivas[funcId],
               registros: prev.funcionalidadesActivas[funcId].registros.map((reg, idx) =>
                  idx === regIndex
                     ? { ...reg, valor: valor === "" ? "" : parseInt(valor) || 0 }
                     : reg
               ),
            },
         },
      }));
   }, []);

   /**
    * Toggle expandir/colapsar fila
    */
   const toggleFilaExpandida = useCallback((funcId) => {
      setFilasExpandidas((prev) => {
         const nuevas = new Set(prev);
         if (nuevas.has(funcId)) {
            nuevas.delete(funcId);
         } else {
            nuevas.add(funcId);
         }
         return nuevas;
      });
   }, []);

   /**
    * Aplicar plantilla recién creada
    */
   const aplicarPlantillaCreada = useCallback((nuevaPlantilla) => {
      const funcionalidadesIniciales = generarConfigDesdePlantilla(nuevaPlantilla);
      setConfig((prev) => ({
         ...prev,
         plantillaId: nuevaPlantilla.id,
         funcionalidadesActivas: funcionalidadesIniciales,
      }));
   }, [generarConfigDesdePlantilla]);

   /**
    * Actualizar funcionalidades cuando se actualiza la plantilla seleccionada
    */
   const actualizarFuncionalidades = useCallback((plantillaActualizada) => {
      const funcionalidadesActualizadas = generarConfigDesdePlantilla(plantillaActualizada);
      setConfig((prev) => ({
         ...prev,
         funcionalidadesActivas: funcionalidadesActualizadas,
      }));
   }, [generarConfigDesdePlantilla]);

   // Verificar si la plantilla seleccionada aún existe
   const plantillaNoEncontrada = config.plantillaId && !plantillaSeleccionada;

   // Obtener lista de funcionalidades de la plantilla
   const funcionalidadesPlantilla = plantillaSeleccionada
      ? Object.entries(plantillaSeleccionada.funcionalidades || {})
      : [];

   // Contar funcionalidades activas
   const cantidadActivas = Object.values(config.funcionalidadesActivas).filter(
      (f) => f.habilitado
   ).length;

   return {
      // Estado
      config,
      plantillaSeleccionada,
      plantillaNoEncontrada,
      funcionalidadesPlantilla,
      cantidadActivas,
      filasExpandidas,
      tabFuncionalidadesActivo,

      // Setters
      setTabFuncionalidadesActivo,

      // Handlers
      handlePlantillaChange,
      handleConexionChange,
      handleRegistroInicialChange,
      handleCantidadRegistrosChange,
      handleIntervaloChange,
      handleToggleFuncionalidad,
      handleCambiarRegistro,
      toggleFilaExpandida,
      aplicarPlantillaCreada,
      actualizarFuncionalidades,
   };
}
