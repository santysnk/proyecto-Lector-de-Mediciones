// hooks/rele/useFuncionalidadesPlantilla.js
// Hook para manejar el CRUD de funcionalidades en plantillas de relé

import { useState, useCallback } from "react";
import { MODOS_HISTORIAL, DEFAULT_CONFIG_HISTORIAL } from "../../constantes/funcionalidadesRele";
import { convertirDesdeObjeto, convertirParaGuardar, contarFuncionalidadesHabilitadas } from "./funcionalidadesPlantillaUtils";

export const CATEGORIAS_FUNCIONALIDADES = {
   mediciones: { id: "mediciones", nombre: "Mediciones", icono: "📊" },
   estados: { id: "estados", nombre: "Estados y Alarmas", icono: "🚦" },
   sistema: { id: "sistema", nombre: "Sistema", icono: "⚙️" },
};

export { MODOS_HISTORIAL, DEFAULT_CONFIG_HISTORIAL };

export function useFuncionalidadesPlantilla() {
   const [funcionalidades, setFuncionalidades] = useState([]);
   const [nuevaFunc, setNuevaFunc] = useState({ nombre: "", cantidad: 1, categoria: "mediciones" });

   const generarIdFunc = useCallback(() => {
      return "func-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
   }, []);

   const agregarFuncionalidad = useCallback(() => {
      if (!nuevaFunc.nombre.trim()) return { exito: false, error: "Ingresa un nombre para la funcionalidad" };
      const cantidad = parseInt(nuevaFunc.cantidad) || 1;
      const registros = Array.from({ length: cantidad }, () => ({ etiqueta: "", valor: 0 }));
      const nuevaFuncionalidad = {
         id: generarIdFunc(), nombre: nuevaFunc.nombre.trim(),
         categoria: nuevaFunc.categoria, habilitado: true, registros,
      };
      setFuncionalidades((prev) => [...prev, nuevaFuncionalidad]);
      setNuevaFunc({ nombre: "", cantidad: 1, categoria: nuevaFunc.categoria });
      return { exito: true };
   }, [nuevaFunc, generarIdFunc]);

   const eliminarFuncionalidad = useCallback((funcId) => {
      setFuncionalidades((prev) => prev.filter((f) => f.id !== funcId));
   }, []);

   const toggleFuncionalidad = useCallback((funcId) => {
      setFuncionalidades((prev) => prev.map((f) => f.id === funcId ? { ...f, habilitado: !f.habilitado } : f));
   }, []);

   const cambiarEtiquetaRegistro = useCallback((funcId, regIndex, valor) => {
      setFuncionalidades((prev) => prev.map((f) => {
         if (f.id !== funcId) return f;
         const nuevosRegistros = [...f.registros];
         nuevosRegistros[regIndex] = { ...nuevosRegistros[regIndex], etiqueta: valor };
         return { ...f, registros: nuevosRegistros };
      }));
   }, []);

   const cambiarValorRegistro = useCallback((funcId, regIndex, valor) => {
      setFuncionalidades((prev) => prev.map((f) => {
         if (f.id !== funcId) return f;
         const nuevosRegistros = [...f.registros];
         nuevosRegistros[regIndex] = { ...nuevosRegistros[regIndex], valor: valor === "" ? "" : parseInt(valor) || 0 };
         return { ...f, registros: nuevosRegistros };
      }));
   }, []);

   const cambiarTransformadorRegistro = useCallback((funcId, registroIndex, transformadorId) => {
      setFuncionalidades((prev) => prev.map((f) => {
         if (f.id !== funcId) return f;
         const nuevosRegistros = f.registros.map((reg, idx) => idx === registroIndex ? { ...reg, transformadorId: transformadorId || null } : reg);
         return { ...f, registros: nuevosRegistros };
      }));
   }, []);

   const aplicarTransformadorATodos = useCallback((funcId, transformadorId) => {
      setFuncionalidades((prev) => prev.map((f) => {
         if (f.id !== funcId) return f;
         return { ...f, registros: f.registros.map((reg) => ({ ...reg, transformadorId: transformadorId || null })) };
      }));
   }, []);

   const moverFuncionalidadArriba = useCallback((funcId) => {
      setFuncionalidades((prev) => {
         const index = prev.findIndex((f) => f.id === funcId);
         if (index <= 0) return prev;
         const newArr = [...prev];
         [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
         return newArr;
      });
   }, []);

   const moverFuncionalidadAbajo = useCallback((funcId) => {
      setFuncionalidades((prev) => {
         const index = prev.findIndex((f) => f.id === funcId);
         if (index < 0 || index >= prev.length - 1) return prev;
         const newArr = [...prev];
         [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
         return newArr;
      });
   }, []);

   const cargarDesdeObjeto = useCallback((funcionalidadesObj) => {
      setFuncionalidades(convertirDesdeObjeto(funcionalidadesObj));
   }, []);

   const obtenerParaGuardar = useCallback(() => {
      return convertirParaGuardar(funcionalidades);
   }, [funcionalidades]);

   const contarFuncionalidades = useCallback((plantilla) => {
      return contarFuncionalidadesHabilitadas(plantilla);
   }, []);

   const cambiarConfigHistorial = useCallback((funcId, campo, valor) => {
      setFuncionalidades((prev) => prev.map((func) => {
         if (func.id !== funcId) return func;
         return { ...func, configHistorial: { ...(func.configHistorial || DEFAULT_CONFIG_HISTORIAL), [campo]: valor } };
      }));
   }, []);

   const cambiarEtiquetaBitFunc = useCallback((funcId, bitIndex, texto) => {
      setFuncionalidades((prev) => prev.map((func) => {
         if (func.id !== funcId) return func;
         const etiquetasBits = { ...(func.etiquetasBits || {}) };
         if (!texto.trim()) { delete etiquetasBits[bitIndex]; }
         else { etiquetasBits[bitIndex] = { ...(etiquetasBits[bitIndex] || { severidad: "info" }), texto }; }
         return { ...func, etiquetasBits };
      }));
   }, []);

   const cambiarSeveridadBitFunc = useCallback((funcId, bitIndex, severidad) => {
      setFuncionalidades((prev) => prev.map((func) => {
         if (func.id !== funcId) return func;
         const etiquetasBits = { ...(func.etiquetasBits || {}) };
         etiquetasBits[bitIndex] = { ...(etiquetasBits[bitIndex] || { texto: "" }), severidad };
         return { ...func, etiquetasBits };
      }));
   }, []);

   const agregarBitFunc = useCallback((funcId) => {
      setFuncionalidades((prev) => prev.map((func) => {
         if (func.id !== funcId) return func;
         const etiquetasBits = { ...(func.etiquetasBits || {}) };
         const indicesExistentes = Object.keys(etiquetasBits).map(Number);
         const siguienteIndice = indicesExistentes.length > 0 ? Math.max(...indicesExistentes) + 1 : 0;
         etiquetasBits[siguienteIndice] = { texto: "", severidad: "info" };
         return { ...func, etiquetasBits };
      }));
   }, []);

   const quitarBitFunc = useCallback((funcId) => {
      setFuncionalidades((prev) => prev.map((func) => {
         if (func.id !== funcId) return func;
         const etiquetasBits = { ...(func.etiquetasBits || {}) };
         const indicesExistentes = Object.keys(etiquetasBits).map(Number);
         if (indicesExistentes.length === 0) return func;
         delete etiquetasBits[Math.max(...indicesExistentes)];
         return { ...func, etiquetasBits };
      }));
   }, []);

   const pegarEtiquetasBitsFunc = useCallback((funcId, etiquetasCopiadas) => {
      if (!etiquetasCopiadas || Object.keys(etiquetasCopiadas).length === 0) return;
      setFuncionalidades((prev) => prev.map((func) => {
         if (func.id !== funcId) return func;
         const nuevasEtiquetas = {};
         Object.entries(etiquetasCopiadas).forEach(([indice, config]) => { nuevasEtiquetas[indice] = { ...config }; });
         return { ...func, etiquetasBits: nuevasEtiquetas };
      }));
   }, []);

   const resetear = useCallback(() => {
      setFuncionalidades([]);
      setNuevaFunc({ nombre: "", cantidad: 1, categoria: "mediciones" });
   }, []);

   return {
      funcionalidades, nuevaFunc, setNuevaFunc, setFuncionalidades,
      agregarFuncionalidad, eliminarFuncionalidad, toggleFuncionalidad,
      cambiarEtiquetaRegistro, cambiarValorRegistro, cambiarTransformadorRegistro,
      aplicarTransformadorATodos, moverFuncionalidadArriba, moverFuncionalidadAbajo,
      cargarDesdeObjeto, obtenerParaGuardar, contarFuncionalidades, resetear,
      cambiarConfigHistorial, cambiarEtiquetaBitFunc, cambiarSeveridadBitFunc,
      agregarBitFunc, quitarBitFunc, pegarEtiquetasBitsFunc,
   };
}
