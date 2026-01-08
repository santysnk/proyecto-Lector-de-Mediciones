// hooks/useFuncionalidadesPlantilla.js
// Hook para manejar el CRUD de funcionalidades en plantillas de relé

import { useState, useCallback } from "react";

// Categorías disponibles para las funcionalidades
export const CATEGORIAS_FUNCIONALIDADES = {
   mediciones: { id: "mediciones", nombre: "Mediciones", icono: "📊" },
   estados: { id: "estados", nombre: "Estados y Alarmas", icono: "🚦" },
   sistema: { id: "sistema", nombre: "Sistema", icono: "⚙️" },
};

/**
 * Hook para manejar el CRUD de funcionalidades
 * @returns {Object} Estado y funciones de funcionalidades
 */
export function useFuncionalidadesPlantilla() {
   const [funcionalidades, setFuncionalidades] = useState([]);

   // Estado para agregar nueva funcionalidad
   const [nuevaFunc, setNuevaFunc] = useState({
      nombre: "",
      cantidad: 1,
      categoria: "mediciones",
   });

   /**
    * Generar ID único para funcionalidad
    */
   const generarIdFunc = useCallback(() => {
      return "func-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
   }, []);

   /**
    * Agregar nueva funcionalidad
    * @returns {{ exito: boolean, error?: string }}
    */
   const agregarFuncionalidad = useCallback(() => {
      if (!nuevaFunc.nombre.trim()) {
         return { exito: false, error: "Ingresa un nombre para la funcionalidad" };
      }

      const cantidad = parseInt(nuevaFunc.cantidad) || 1;

      // Crear array de registros vacíos según la cantidad
      const registros = Array.from({ length: cantidad }, () => ({
         etiqueta: "",
         valor: 0,
      }));

      const nuevaFuncionalidad = {
         id: generarIdFunc(),
         nombre: nuevaFunc.nombre.trim(),
         categoria: nuevaFunc.categoria,
         habilitado: true,
         registros,
      };

      setFuncionalidades((prev) => [...prev, nuevaFuncionalidad]);
      setNuevaFunc({ nombre: "", cantidad: 1, categoria: nuevaFunc.categoria });
      return { exito: true };
   }, [nuevaFunc, generarIdFunc]);

   /**
    * Eliminar funcionalidad
    */
   const eliminarFuncionalidad = useCallback((funcId) => {
      setFuncionalidades((prev) => prev.filter((f) => f.id !== funcId));
   }, []);

   /**
    * Toggle habilitar/deshabilitar funcionalidad
    */
   const toggleFuncionalidad = useCallback((funcId) => {
      setFuncionalidades((prev) =>
         prev.map((f) =>
            f.id === funcId ? { ...f, habilitado: !f.habilitado } : f
         )
      );
   }, []);

   /**
    * Cambiar etiqueta de un registro
    */
   const cambiarEtiquetaRegistro = useCallback((funcId, regIndex, valor) => {
      setFuncionalidades((prev) =>
         prev.map((f) => {
            if (f.id !== funcId) return f;
            const nuevosRegistros = [...f.registros];
            nuevosRegistros[regIndex] = { ...nuevosRegistros[regIndex], etiqueta: valor };
            return { ...f, registros: nuevosRegistros };
         })
      );
   }, []);

   /**
    * Cambiar valor de un registro
    */
   const cambiarValorRegistro = useCallback((funcId, regIndex, valor) => {
      setFuncionalidades((prev) =>
         prev.map((f) => {
            if (f.id !== funcId) return f;
            const nuevosRegistros = [...f.registros];
            nuevosRegistros[regIndex] = {
               ...nuevosRegistros[regIndex],
               valor: valor === "" ? "" : parseInt(valor) || 0,
            };
            return { ...f, registros: nuevosRegistros };
         })
      );
   }, []);

   /**
    * Cambiar transformador de un registro específico
    */
   const cambiarTransformadorRegistro = useCallback((funcId, registroIndex, transformadorId) => {
      setFuncionalidades((prev) =>
         prev.map((f) => {
            if (f.id !== funcId) return f;
            const nuevosRegistros = f.registros.map((reg, idx) =>
               idx === registroIndex
                  ? { ...reg, transformadorId: transformadorId || null }
                  : reg
            );
            return { ...f, registros: nuevosRegistros };
         })
      );
   }, []);

   /**
    * Aplicar un transformador a todos los registros de una funcionalidad
    */
   const aplicarTransformadorATodos = useCallback((funcId, transformadorId) => {
      setFuncionalidades((prev) =>
         prev.map((f) => {
            if (f.id !== funcId) return f;
            const nuevosRegistros = f.registros.map((reg) => ({
               ...reg,
               transformadorId: transformadorId || null,
            }));
            return { ...f, registros: nuevosRegistros };
         })
      );
   }, []);

   /**
    * Mover funcionalidad hacia arriba
    */
   const moverFuncionalidadArriba = useCallback((funcId) => {
      setFuncionalidades((prev) => {
         const index = prev.findIndex((f) => f.id === funcId);
         if (index <= 0) return prev;
         const newArr = [...prev];
         [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
         return newArr;
      });
   }, []);

   /**
    * Mover funcionalidad hacia abajo
    */
   const moverFuncionalidadAbajo = useCallback((funcId) => {
      setFuncionalidades((prev) => {
         const index = prev.findIndex((f) => f.id === funcId);
         if (index < 0 || index >= prev.length - 1) return prev;
         const newArr = [...prev];
         [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
         return newArr;
      });
   }, []);

   /**
    * Cargar funcionalidades desde un objeto de plantilla
    */
   const cargarDesdeObjeto = useCallback((funcionalidadesObj) => {
      const funcsArray = Object.entries(funcionalidadesObj || {}).map(
         ([id, data]) => {
            // Migración: si hay transformadorId a nivel de funcionalidad, aplicarlo a cada registro
            const transformadorIdGrupo = data.transformadorId || null;
            const registrosBase = data.registros || [{ etiqueta: "", valor: data.registro || 0 }];
            const registrosMigrados = registrosBase.map((reg) => ({
               ...reg,
               transformadorId: reg.transformadorId !== undefined ? reg.transformadorId : transformadorIdGrupo,
            }));
            return {
               id,
               nombre: data.nombre || id,
               habilitado: data.habilitado !== false,
               categoria: data.categoria || "mediciones",
               registros: registrosMigrados,
            };
         }
      );
      setFuncionalidades(funcsArray);
   }, []);

   /**
    * Convertir funcionalidades a objeto para guardar
    */
   const obtenerParaGuardar = useCallback(() => {
      const funcParaGuardar = {};
      funcionalidades.forEach((func) => {
         if (func.habilitado) {
            funcParaGuardar[func.id] = {
               nombre: func.nombre,
               categoria: func.categoria || "mediciones",
               habilitado: true,
               registros: func.registros,
               registro: func.registros[0]?.valor || 0,
            };
         }
      });
      return funcParaGuardar;
   }, [funcionalidades]);

   /**
    * Contar funcionalidades en una plantilla
    */
   const contarFuncionalidades = useCallback((plantilla) => {
      return Object.values(plantilla?.funcionalidades || {}).filter(
         (f) => f.habilitado !== false
      ).length;
   }, []);

   /**
    * Resetear todo el estado
    */
   const resetear = useCallback(() => {
      setFuncionalidades([]);
      setNuevaFunc({ nombre: "", cantidad: 1, categoria: "mediciones" });
   }, []);

   return {
      // Estado
      funcionalidades,
      nuevaFunc,

      // Setters
      setNuevaFunc,
      setFuncionalidades,

      // Funciones
      agregarFuncionalidad,
      eliminarFuncionalidad,
      toggleFuncionalidad,
      cambiarEtiquetaRegistro,
      cambiarValorRegistro,
      cambiarTransformadorRegistro,
      aplicarTransformadorATodos,
      moverFuncionalidadArriba,
      moverFuncionalidadAbajo,
      cargarDesdeObjeto,
      obtenerParaGuardar,
      contarFuncionalidades,
      resetear,
   };
}
