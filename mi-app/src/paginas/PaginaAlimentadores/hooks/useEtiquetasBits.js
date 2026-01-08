// hooks/useEtiquetasBits.js
// Hook para manejar las etiquetas de bits (LEDs del panel frontal)

import { useState, useEffect, useCallback } from "react";
import { PLANTILLAS_ETIQUETAS_LEDS } from "../utilidades/interpreteRegistrosREF615";

const STORAGE_KEY_PLANTILLAS_ETIQUETAS = "plantillasEtiquetasLeds";

/**
 * Hook para manejar las etiquetas de bits y plantillas personalizadas
 * @returns {Object} Estado y funciones de etiquetas
 */
export function useEtiquetasBits() {
   // Estado para etiquetas de bits
   const [etiquetasBits, setEtiquetasBits] = useState({});
   const [seccionAbierta, setSeccionAbierta] = useState(false);
   const [cantidadBits, setCantidadBits] = useState(1);

   // Estado para plantillas personalizadas
   const [plantillasPersonalizadas, setPlantillasPersonalizadas] = useState({});
   const [plantillaSeleccionada, setPlantillaSeleccionada] = useState("");

   // Estado para modo creación de nueva plantilla
   const [modoNuevaPlantilla, setModoNuevaPlantilla] = useState(false);
   const [nombreNuevaPlantilla, setNombreNuevaPlantilla] = useState("");

   // Cargar plantillas personalizadas desde localStorage al montar
   useEffect(() => {
      try {
         const guardadas = localStorage.getItem(STORAGE_KEY_PLANTILLAS_ETIQUETAS);
         if (guardadas) {
            setPlantillasPersonalizadas(JSON.parse(guardadas));
         }
      } catch (error) {
         console.error("Error al cargar plantillas de etiquetas:", error);
      }
   }, []);

   /**
    * Cambiar texto de una etiqueta de bit
    */
   const cambiarEtiquetaBit = useCallback((bit, texto) => {
      setEtiquetasBits((prev) => ({
         ...prev,
         [bit]: {
            ...prev[bit],
            texto: texto,
            severidad: prev[bit]?.severidad || "info"
         }
      }));
   }, []);

   /**
    * Cambiar severidad de una etiqueta de bit
    */
   const cambiarSeveridadBit = useCallback((bit, severidad) => {
      setEtiquetasBits((prev) => ({
         ...prev,
         [bit]: {
            ...prev[bit],
            texto: prev[bit]?.texto || "",
            severidad: severidad
         }
      }));
   }, []);

   /**
    * Aplicar una plantilla de etiquetas (predefinida o personalizada)
    */
   const aplicarPlantilla = useCallback((tipoPlantilla) => {
      // Buscar en plantillas predefinidas
      if (PLANTILLAS_ETIQUETAS_LEDS[tipoPlantilla]) {
         setEtiquetasBits(PLANTILLAS_ETIQUETAS_LEDS[tipoPlantilla].etiquetas);
         setCantidadBits(Object.keys(PLANTILLAS_ETIQUETAS_LEDS[tipoPlantilla].etiquetas).length);
         setModoNuevaPlantilla(false);
         setPlantillaSeleccionada(tipoPlantilla);
         return;
      }
      // Buscar en plantillas personalizadas
      if (plantillasPersonalizadas[tipoPlantilla]) {
         setEtiquetasBits(plantillasPersonalizadas[tipoPlantilla].etiquetas);
         setCantidadBits(Object.keys(plantillasPersonalizadas[tipoPlantilla].etiquetas).length);
         setModoNuevaPlantilla(false);
         setPlantillaSeleccionada(tipoPlantilla);
      }
   }, [plantillasPersonalizadas]);

   /**
    * Iniciar modo de creación de nueva plantilla
    */
   const iniciarNuevaPlantilla = useCallback(() => {
      setModoNuevaPlantilla(true);
      setNombreNuevaPlantilla("");
      setCantidadBits(1);
      setEtiquetasBits({ 0: { texto: "", severidad: "info" } });
   }, []);

   /**
    * Cancelar creación de nueva plantilla
    */
   const cancelarNuevaPlantilla = useCallback(() => {
      setModoNuevaPlantilla(false);
      setNombreNuevaPlantilla("");
      setCantidadBits(1);
      setEtiquetasBits({});
   }, []);

   /**
    * Agregar una fila de bit
    */
   const agregarFilaBit = useCallback(() => {
      const nuevoBit = cantidadBits;
      setCantidadBits(nuevoBit + 1);
      setEtiquetasBits((prev) => ({
         ...prev,
         [nuevoBit]: { texto: "", severidad: "info" }
      }));
   }, [cantidadBits]);

   /**
    * Quitar la última fila de bit
    */
   const quitarFilaBit = useCallback(() => {
      if (cantidadBits <= 1) return;
      const bitAQuitar = cantidadBits - 1;
      setCantidadBits(bitAQuitar);
      setEtiquetasBits((prev) => {
         const nuevas = { ...prev };
         delete nuevas[bitAQuitar];
         return nuevas;
      });
   }, [cantidadBits]);

   /**
    * Guardar plantilla personalizada
    */
   const guardarPlantillaPersonalizada = useCallback(() => {
      if (!nombreNuevaPlantilla.trim()) {
         return { exito: false, error: "Ingresa un nombre para la plantilla de etiquetas" };
      }

      // Limpiar etiquetas vacías
      const etiquetasLimpias = {};
      Object.entries(etiquetasBits).forEach(([bit, etiqueta]) => {
         if (etiqueta.texto && etiqueta.texto.trim() !== "") {
            etiquetasLimpias[bit] = {
               texto: etiqueta.texto.trim(),
               severidad: etiqueta.severidad || "info"
            };
         }
      });

      const id = "custom-" + Date.now().toString(36);
      const nuevaPlantilla = {
         nombre: nombreNuevaPlantilla.trim(),
         etiquetas: etiquetasLimpias
      };

      const nuevasPlantillas = {
         ...plantillasPersonalizadas,
         [id]: nuevaPlantilla
      };

      try {
         localStorage.setItem(STORAGE_KEY_PLANTILLAS_ETIQUETAS, JSON.stringify(nuevasPlantillas));
         setPlantillasPersonalizadas(nuevasPlantillas);
         setModoNuevaPlantilla(false);
         setNombreNuevaPlantilla("");
         return { exito: true };
      } catch (error) {
         console.error("Error al guardar plantilla de etiquetas:", error);
         return { exito: false, error: "Error al guardar la plantilla" };
      }
   }, [nombreNuevaPlantilla, etiquetasBits, plantillasPersonalizadas]);

   /**
    * Eliminar plantilla personalizada
    */
   const eliminarPlantillaPersonalizada = useCallback((id) => {
      const nuevasPlantillas = { ...plantillasPersonalizadas };
      delete nuevasPlantillas[id];

      try {
         localStorage.setItem(STORAGE_KEY_PLANTILLAS_ETIQUETAS, JSON.stringify(nuevasPlantillas));
         setPlantillasPersonalizadas(nuevasPlantillas);
      } catch (error) {
         console.error("Error al eliminar plantilla de etiquetas:", error);
      }
   }, [plantillasPersonalizadas]);

   /**
    * Limpiar todas las etiquetas
    */
   const limpiarEtiquetas = useCallback(() => {
      setEtiquetasBits({});
      setModoNuevaPlantilla(false);
      setCantidadBits(1);
      setPlantillaSeleccionada("");
   }, []);

   /**
    * Contar etiquetas configuradas
    */
   const contarEtiquetasConfiguradas = useCallback(() => {
      return Object.values(etiquetasBits).filter(e => e.texto && e.texto.trim() !== "").length;
   }, [etiquetasBits]);

   /**
    * Obtener nombre de una plantilla por su ID
    */
   const obtenerNombrePlantilla = useCallback((idPlantilla) => {
      if (!idPlantilla) return null;

      if (PLANTILLAS_ETIQUETAS_LEDS[idPlantilla]) {
         return PLANTILLAS_ETIQUETAS_LEDS[idPlantilla].nombre;
      }

      if (plantillasPersonalizadas[idPlantilla]) {
         return plantillasPersonalizadas[idPlantilla].nombre;
      }

      return null;
   }, [plantillasPersonalizadas]);

   /**
    * Cargar etiquetas desde una plantilla existente
    */
   const cargarDesdeObjeto = useCallback((etiquetas, plantillaId = "") => {
      setEtiquetasBits(etiquetas || {});
      setPlantillaSeleccionada(plantillaId);
      if (Object.keys(etiquetas || {}).length > 0) {
         const maxBit = Math.max(...Object.keys(etiquetas).map(Number));
         setCantidadBits(maxBit + 1);
         setSeccionAbierta(true);
      }
   }, []);

   /**
    * Limpiar etiquetas vacías para guardar
    */
   const obtenerEtiquetasLimpias = useCallback(() => {
      const etiquetasLimpias = {};
      Object.entries(etiquetasBits).forEach(([bit, etiqueta]) => {
         if (etiqueta.texto && etiqueta.texto.trim() !== "") {
            etiquetasLimpias[bit] = {
               texto: etiqueta.texto.trim(),
               severidad: etiqueta.severidad || "info"
            };
         }
      });
      return etiquetasLimpias;
   }, [etiquetasBits]);

   /**
    * Resetear todo el estado
    */
   const resetear = useCallback(() => {
      setEtiquetasBits({});
      setSeccionAbierta(false);
      setCantidadBits(1);
      setPlantillaSeleccionada("");
      setModoNuevaPlantilla(false);
      setNombreNuevaPlantilla("");
   }, []);

   return {
      // Estado
      etiquetasBits,
      seccionAbierta,
      cantidadBits,
      plantillasPersonalizadas,
      plantillaSeleccionada,
      modoNuevaPlantilla,
      nombreNuevaPlantilla,

      // Setters
      setSeccionAbierta,
      setNombreNuevaPlantilla,

      // Funciones
      cambiarEtiquetaBit,
      cambiarSeveridadBit,
      aplicarPlantilla,
      iniciarNuevaPlantilla,
      cancelarNuevaPlantilla,
      agregarFilaBit,
      quitarFilaBit,
      guardarPlantillaPersonalizada,
      eliminarPlantillaPersonalizada,
      limpiarEtiquetas,
      contarEtiquetasConfiguradas,
      obtenerNombrePlantilla,
      cargarDesdeObjeto,
      obtenerEtiquetasLimpias,
      resetear,
   };
}
