// hooks/analizador/useFuncionalidadesAnalizador.js
// Hook para manejar el estado de funcionalidades en el formulario de plantillas de analizador

import { useState, useCallback } from "react";

/**
 * Genera un ID único para funcionalidades
 */
const generarIdFunc = () => `func-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

/**
 * Hook para gestionar funcionalidades en el formulario de creación/edición de plantillas
 * @returns {Object} Estado y funciones de funcionalidades
 */
export function useFuncionalidadesAnalizador() {
   const [funcionalidades, setFuncionalidades] = useState([]);

   // Estado para nueva funcionalidad
   const [nuevaFunc, setNuevaFunc] = useState({
      nombre: "",
      cantidad: 1,
   });

   /**
    * Agregar una nueva funcionalidad
    */
   const agregarFuncionalidad = useCallback(() => {
      if (!nuevaFunc.nombre.trim()) return;

      const cantidad = parseInt(nuevaFunc.cantidad) || 1;
      const registros = Array.from({ length: cantidad }, () => ({
         etiqueta: "",
         valor: 0,
         transformadorId: null,
      }));

      const nueva = {
         id: generarIdFunc(),
         nombre: nuevaFunc.nombre.trim(),
         habilitado: true,
         registros,
      };

      setFuncionalidades((prev) => [...prev, nueva]);
      setNuevaFunc({ nombre: "", cantidad: 1 });
   }, [nuevaFunc]);

   /**
    * Eliminar una funcionalidad
    */
   const eliminarFuncionalidad = useCallback((funcId) => {
      setFuncionalidades((prev) => prev.filter((f) => f.id !== funcId));
   }, []);

   /**
    * Toggle habilitar/deshabilitar funcionalidad
    */
   const toggleFuncionalidad = useCallback((funcId) => {
      setFuncionalidades((prev) =>
         prev.map((f) => (f.id === funcId ? { ...f, habilitado: !f.habilitado } : f))
      );
   }, []);

   /**
    * Cambiar etiqueta de un registro
    */
   const cambiarEtiquetaRegistro = useCallback((funcId, regIndex, valor) => {
      setFuncionalidades((prev) =>
         prev.map((f) =>
            f.id === funcId
               ? {
                    ...f,
                    registros: f.registros.map((r, i) =>
                       i === regIndex ? { ...r, etiqueta: valor } : r
                    ),
                 }
               : f
         )
      );
   }, []);

   /**
    * Cambiar valor de un registro
    */
   const cambiarValorRegistro = useCallback((funcId, regIndex, valor) => {
      setFuncionalidades((prev) =>
         prev.map((f) =>
            f.id === funcId
               ? {
                    ...f,
                    registros: f.registros.map((r, i) =>
                       i === regIndex
                          ? { ...r, valor: valor === "" ? "" : parseInt(valor) || 0 }
                          : r
                    ),
                 }
               : f
         )
      );
   }, []);

   /**
    * Cambiar transformador de un registro
    */
   const cambiarTransformadorRegistro = useCallback((funcId, regIndex, transformadorId) => {
      setFuncionalidades((prev) =>
         prev.map((f) =>
            f.id === funcId
               ? {
                    ...f,
                    registros: f.registros.map((r, i) =>
                       i === regIndex ? { ...r, transformadorId: transformadorId || null } : r
                    ),
                 }
               : f
         )
      );
   }, []);

   /**
    * Mover funcionalidad hacia arriba
    */
   const moverFuncionalidadArriba = useCallback((funcId) => {
      setFuncionalidades((prev) => {
         const index = prev.findIndex((f) => f.id === funcId);
         if (index <= 0) return prev;
         const nuevo = [...prev];
         [nuevo[index - 1], nuevo[index]] = [nuevo[index], nuevo[index - 1]];
         return nuevo;
      });
   }, []);

   /**
    * Mover funcionalidad hacia abajo
    */
   const moverFuncionalidadAbajo = useCallback((funcId) => {
      setFuncionalidades((prev) => {
         const index = prev.findIndex((f) => f.id === funcId);
         if (index === -1 || index >= prev.length - 1) return prev;
         const nuevo = [...prev];
         [nuevo[index], nuevo[index + 1]] = [nuevo[index + 1], nuevo[index]];
         return nuevo;
      });
   }, []);

   /**
    * Cargar funcionalidades desde un objeto (para edición)
    */
   const cargarDesdeObjeto = useCallback((funcionalidadesObj) => {
      if (!funcionalidadesObj) {
         setFuncionalidades([]);
         return;
      }

      const funcs = Object.entries(funcionalidadesObj).map(([id, func]) => ({
         id,
         nombre: func.nombre || id,
         habilitado: func.habilitado !== false,
         registros: func.registros || [{ etiqueta: "", valor: 0, transformadorId: null }],
      }));

      setFuncionalidades(funcs);
   }, []);

   /**
    * Convertir funcionalidades a objeto para guardar
    */
   const obtenerParaGuardar = useCallback(() => {
      const resultado = {};
      funcionalidades.forEach((func) => {
         resultado[func.id] = {
            nombre: func.nombre,
            habilitado: func.habilitado,
            registros: func.registros.map((r) => ({
               etiqueta: r.etiqueta || "",
               valor: r.valor || 0,
               transformadorId: r.transformadorId || null,
            })),
         };
      });
      return resultado;
   }, [funcionalidades]);

   /**
    * Resetear el estado
    */
   const resetear = useCallback(() => {
      setFuncionalidades([]);
      setNuevaFunc({ nombre: "", cantidad: 1 });
   }, []);

   /**
    * Contar funcionalidades habilitadas
    */
   const contarFuncionalidades = useCallback((plantilla) => {
      if (!plantilla?.funcionalidades) return 0;
      return Object.values(plantilla.funcionalidades).filter((f) => f.habilitado !== false).length;
   }, []);

   return {
      funcionalidades,
      nuevaFunc,
      setNuevaFunc,

      // CRUD
      agregarFuncionalidad,
      eliminarFuncionalidad,
      toggleFuncionalidad,

      // Edición de registros
      cambiarEtiquetaRegistro,
      cambiarValorRegistro,
      cambiarTransformadorRegistro,

      // Orden
      moverFuncionalidadArriba,
      moverFuncionalidadAbajo,

      // Conversión
      cargarDesdeObjeto,
      obtenerParaGuardar,

      // Utilidades
      resetear,
      contarFuncionalidades,
   };
}
