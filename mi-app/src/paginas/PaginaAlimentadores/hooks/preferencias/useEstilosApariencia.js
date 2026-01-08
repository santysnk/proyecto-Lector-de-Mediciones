// hooks/useEstilosApariencia.js
// Hook para manejar el estado de estilos de apariencia de tarjetas

import { useState, useCallback, useEffect, useRef } from "react";
import { ESTILOS_GLOBALES_DEFAULT } from "../../constantes/estilosGlobalesTarjeta";

// Versión del formato de archivo para compatibilidad futura
const FORMATO_VERSION = 1;

// Valores por defecto para el preview
const VALORES_DEFAULT = ["--,--", "--,--", "--,--"];

/**
 * Genera un valor aleatorio con formato de medición
 * @param {number} decimales - Cantidad de decimales a mostrar (0, 1 o 2)
 */
const generarValorAleatorio = (decimales = 2) => {
   const valor = (Math.random() * 500).toFixed(decimales);
   return valor.replace(".", ",");
};

/**
 * Convierte una cadena rem a número
 */
const remANumero = (remStr) => {
   if (typeof remStr === "number") return remStr;
   return parseFloat(remStr) || 1;
};

/**
 * Convierte una cadena px a número
 */
const pxANumero = (pxStr) => {
   if (typeof pxStr === "number") return pxStr;
   return parseInt(pxStr) || 80;
};

/**
 * Hook para manejar el estado de estilos de apariencia de tarjetas
 * @param {Object} params
 * @param {Object} params.estilosIniciales - Estilos iniciales para edición
 * @returns {Object} Estado y funciones de estilos
 */
export function useEstilosApariencia({ estilosIniciales }) {
   // Ref para guardar los estilos iniciales y solo sincronizar una vez
   const estilosInicialesRef = useRef(null);

   // Estado local para los estilos (copia editable)
   const [estilos, setEstilos] = useState(() => ({
      header: { ...ESTILOS_GLOBALES_DEFAULT.header, ...estilosIniciales?.header },
      tituloZona: { ...ESTILOS_GLOBALES_DEFAULT.tituloZona, ...estilosIniciales?.tituloZona },
      tituloBox: { ...ESTILOS_GLOBALES_DEFAULT.tituloBox, ...estilosIniciales?.tituloBox },
      valorBox: { ...ESTILOS_GLOBALES_DEFAULT.valorBox, ...estilosIniciales?.valorBox },
      box: { ...ESTILOS_GLOBALES_DEFAULT.box, ...estilosIniciales?.box },
   }));

   // Estado para los valores del preview
   const [valoresPreview, setValoresPreview] = useState(VALORES_DEFAULT);

   // Reiniciar estado local solo cuando cambian los estilos iniciales realmente
   useEffect(() => {
      const estilosStr = JSON.stringify(estilosIniciales);
      if (estilosIniciales && estilosInicialesRef.current !== estilosStr) {
         estilosInicialesRef.current = estilosStr;
         setEstilos({
            header: { ...ESTILOS_GLOBALES_DEFAULT.header, ...estilosIniciales.header },
            tituloZona: { ...ESTILOS_GLOBALES_DEFAULT.tituloZona, ...estilosIniciales.tituloZona },
            tituloBox: { ...ESTILOS_GLOBALES_DEFAULT.tituloBox, ...estilosIniciales.tituloBox },
            valorBox: { ...ESTILOS_GLOBALES_DEFAULT.valorBox, ...estilosIniciales.valorBox },
            box: { ...ESTILOS_GLOBALES_DEFAULT.box, ...estilosIniciales.box },
         });
      }
   }, [estilosIniciales]);

   // Funciones para actualizar cada sección
   const actualizarHeader = useCallback((cambios) => {
      setEstilos((prev) => ({
         ...prev,
         header: { ...prev.header, ...cambios },
      }));
   }, []);

   const actualizarTituloZona = useCallback((cambios) => {
      setEstilos((prev) => ({
         ...prev,
         tituloZona: { ...prev.tituloZona, ...cambios },
      }));
   }, []);

   const actualizarTituloBox = useCallback((cambios) => {
      setEstilos((prev) => ({
         ...prev,
         tituloBox: { ...prev.tituloBox, ...cambios },
      }));
   }, []);

   const actualizarValorBox = useCallback((cambios) => {
      setEstilos((prev) => ({
         ...prev,
         valorBox: { ...prev.valorBox, ...cambios },
      }));
   }, []);

   const actualizarBox = useCallback((cambios) => {
      setEstilos((prev) => ({
         ...prev,
         box: { ...prev.box, ...cambios },
      }));
   }, []);

   // Restaurar valores por defecto
   const restaurarDefecto = useCallback(() => {
      setEstilos(ESTILOS_GLOBALES_DEFAULT);
   }, []);

   // Randomizar valores del preview
   const randomizarValores = useCallback(() => {
      const decimales = estilos.valorBox.decimales ?? 2;
      setValoresPreview([
         generarValorAleatorio(decimales),
         generarValorAleatorio(decimales),
         generarValorAleatorio(decimales),
      ]);
   }, [estilos.valorBox.decimales]);

   // Resetear valores del preview
   const resetearValoresPreview = useCallback(() => {
      setValoresPreview(VALORES_DEFAULT);
   }, []);

   // Exportar configuración a archivo JSON
   const exportarConfiguracion = useCallback(async () => {
      const configuracion = {
         version: FORMATO_VERSION,
         fechaExportacion: new Date().toISOString(),
         estilos: estilos,
      };

      const contenidoJSON = JSON.stringify(configuracion, null, 2);
      const nombreArchivo = `apariencia-tarjetas-${new Date().toISOString().slice(0, 10)}.json`;

      // Intentar usar File System Access API (Chrome, Edge)
      if ("showSaveFilePicker" in window) {
         try {
            const handle = await window.showSaveFilePicker({
               suggestedName: nombreArchivo,
               types: [
                  {
                     description: "Archivo JSON",
                     accept: { "application/json": [".json"] },
                  },
               ],
            });
            const writable = await handle.createWritable();
            await writable.write(contenidoJSON);
            await writable.close();
            return; // Éxito con File System Access API
         } catch (err) {
            // Si el usuario cancela, no hacer nada
            if (err.name === "AbortError") return;
            // Si hay otro error, usar el fallback
            console.warn("File System Access API falló, usando fallback:", err);
         }
      }

      // Fallback para navegadores sin soporte (Firefox, Safari, etc.)
      const blob = new Blob([contenidoJSON], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
   }, [estilos]);

   // Importar configuración desde archivo JSON
   const importarConfiguracion = useCallback((evento) => {
      const archivo = evento.target.files?.[0];
      if (!archivo) return;

      const lector = new FileReader();
      lector.onload = (e) => {
         try {
            const contenido = JSON.parse(e.target.result);

            // Validar que tenga la estructura esperada
            if (!contenido.estilos) {
               alert("El archivo no tiene el formato correcto de configuración.");
               return;
            }

            // Aplicar los estilos importados
            setEstilos({
               header: { ...ESTILOS_GLOBALES_DEFAULT.header, ...contenido.estilos.header },
               tituloZona: {
                  ...ESTILOS_GLOBALES_DEFAULT.tituloZona,
                  ...contenido.estilos.tituloZona,
               },
               tituloBox: {
                  ...ESTILOS_GLOBALES_DEFAULT.tituloBox,
                  ...contenido.estilos.tituloBox,
               },
               valorBox: { ...ESTILOS_GLOBALES_DEFAULT.valorBox, ...contenido.estilos.valorBox },
               box: { ...ESTILOS_GLOBALES_DEFAULT.box, ...contenido.estilos.box },
            });
         } catch {
            alert("Error al leer el archivo. Asegúrate de que sea un archivo JSON válido.");
         }
      };
      lector.readAsText(archivo);

      // Limpiar el input para permitir reimportar el mismo archivo
      evento.target.value = "";
   }, []);

   return {
      // Estado
      estilos,
      valoresPreview,

      // Funciones de actualización
      actualizarHeader,
      actualizarTituloZona,
      actualizarTituloBox,
      actualizarValorBox,
      actualizarBox,

      // Funciones de utilidad
      restaurarDefecto,
      randomizarValores,
      resetearValoresPreview,
      exportarConfiguracion,
      importarConfiguracion,

      // Helpers de conversión
      remANumero,
      pxANumero,
   };
}
