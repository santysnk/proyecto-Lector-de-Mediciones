// hooks/analizador/usePlantillasAnalizador.js
// Hook para manejar las plantillas de configuración de analizadores

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rw-plantillas-analizador";

/**
 * Genera un ID único para plantillas
 */
const generarId = () => `plt-analizador-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Hook para gestionar plantillas de analizadores en localStorage
 * @returns {Object} Estado y funciones de plantillas
 */
export function usePlantillasAnalizador() {
   const [plantillas, setPlantillas] = useState([]);
   const [cargando, setCargando] = useState(true);

   /**
    * Cargar plantillas desde localStorage
    */
   const cargarPlantillas = useCallback(() => {
      try {
         const datos = localStorage.getItem(STORAGE_KEY);
         if (datos) {
            setPlantillas(JSON.parse(datos));
         }
      } catch (error) {
         console.error("Error al cargar plantillas de analizador:", error);
      } finally {
         setCargando(false);
      }
   }, []);

   // Cargar al montar
   useEffect(() => {
      cargarPlantillas();
   }, [cargarPlantillas]);

   /**
    * Guardar plantillas en localStorage
    */
   const guardarEnStorage = useCallback((nuevasPlantillas) => {
      try {
         localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevasPlantillas));
         setPlantillas(nuevasPlantillas);
      } catch (error) {
         console.error("Error al guardar plantillas de analizador:", error);
      }
   }, []);

   /**
    * Crear una nueva plantilla
    * @param {Object} datos - Datos de la plantilla
    * @returns {Object|null} La plantilla creada o null si falla
    */
   const crearPlantilla = useCallback((datos) => {
      const nuevaPlantilla = {
         id: generarId(),
         nombre: datos.nombre?.trim() || "Nueva Plantilla",
         descripcion: datos.descripcion?.trim() || "",
         fechaCreacion: new Date().toISOString(),
         fechaModificacion: new Date().toISOString(),
         funcionalidades: datos.funcionalidades || {},
      };

      const nuevasPlantillas = [...plantillas, nuevaPlantilla];
      guardarEnStorage(nuevasPlantillas);
      return nuevaPlantilla;
   }, [plantillas, guardarEnStorage]);

   /**
    * Actualizar una plantilla existente
    * @param {string} id - ID de la plantilla
    * @param {Object} datos - Nuevos datos
    * @returns {boolean} Si la operación fue exitosa
    */
   const actualizarPlantilla = useCallback((id, datos) => {
      const index = plantillas.findIndex((p) => p.id === id);
      if (index === -1) return false;

      const plantillaActualizada = {
         ...plantillas[index],
         ...datos,
         fechaModificacion: new Date().toISOString(),
      };

      const nuevasPlantillas = [...plantillas];
      nuevasPlantillas[index] = plantillaActualizada;
      guardarEnStorage(nuevasPlantillas);
      return true;
   }, [plantillas, guardarEnStorage]);

   /**
    * Eliminar una plantilla
    * @param {string} id - ID de la plantilla
    * @returns {boolean} Si la operación fue exitosa
    */
   const eliminarPlantilla = useCallback((id) => {
      const nuevasPlantillas = plantillas.filter((p) => p.id !== id);
      if (nuevasPlantillas.length === plantillas.length) return false;

      guardarEnStorage(nuevasPlantillas);
      return true;
   }, [plantillas, guardarEnStorage]);

   /**
    * Obtener una plantilla por ID
    * @param {string} id - ID de la plantilla
    * @returns {Object|null} La plantilla o null
    */
   const obtenerPlantilla = useCallback((id) => {
      return plantillas.find((p) => p.id === id) || null;
   }, [plantillas]);

   return {
      plantillas,
      cargando,
      crearPlantilla,
      actualizarPlantilla,
      eliminarPlantilla,
      obtenerPlantilla,
      recargar: cargarPlantillas,
   };
}
