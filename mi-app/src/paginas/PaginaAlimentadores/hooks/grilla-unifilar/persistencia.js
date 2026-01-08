/**
 * Funciones de persistencia para la grilla unifiliar
 */

import { CLAVE_BASE, ESTADO_INICIAL, GROSORES_LINEA } from "./constantes";

/**
 * Genera la clave única de localStorage
 * @param {string} puestoId
 * @param {string} workspaceId
 * @returns {string|null}
 */
export const generarClave = (puestoId, workspaceId) => {
   if (!puestoId || !workspaceId) return null;
   return `${CLAVE_BASE}-${workspaceId}-${puestoId}`;
};

/**
 * Carga los datos de localStorage
 * @param {string} clave - Clave de localStorage
 * @returns {Object} Estado cargado
 */
export const cargarDatos = (clave) => {
   if (!clave) return ESTADO_INICIAL;

   try {
      const datos = localStorage.getItem(clave);
      if (!datos) return ESTADO_INICIAL;

      const parsed = JSON.parse(datos);

      // Compatibilidad: formato antiguo (solo celdas)
      if (parsed && typeof parsed === "object" && !parsed.celdas) {
         return {
            ...ESTADO_INICIAL,
            celdas: parsed,
         };
      }

      // Formato nuevo
      return {
         celdas: parsed.celdas || {},
         textos: parsed.textos || [],
         grosorLinea: parsed.grosor || GROSORES_LINEA[1].valor,
         bornes: parsed.bornes || [],
         chispasConfig: parsed.chispasConfig || ESTADO_INICIAL.chispasConfig,
      };
   } catch (error) {
      console.error("Error al cargar grilla unifiliar:", error);
      return ESTADO_INICIAL;
   }
};

/**
 * Guarda los datos en localStorage
 * @param {string} clave - Clave de localStorage
 * @param {Object} datos - Datos a guardar
 */
export const guardarDatosEnStorage = (clave, { celdas, textos, grosorLinea, bornes, chispasConfig }) => {
   if (!clave) return;

   try {
      const sinCeldas = Object.keys(celdas).length === 0;
      const sinTextos = textos.length === 0;
      const sinBornes = bornes.length === 0;

      if (sinCeldas && sinTextos && sinBornes) {
         localStorage.removeItem(clave);
      } else {
         localStorage.setItem(
            clave,
            JSON.stringify({
               celdas,
               textos,
               grosor: grosorLinea,
               bornes,
               chispasConfig,
            })
         );
      }
   } catch (error) {
      console.error("Error al guardar grilla unifiliar:", error);
   }
};

/**
 * Exporta el dibujo a un archivo JSON
 * @param {Object} datos - Datos a exportar
 * @param {string} puestoId - ID del puesto
 */
export const exportarAArchivo = ({ celdas, textos, grosorLinea }, puestoId) => {
   const datos = {
      version: 1,
      celdas,
      textos,
      grosor: grosorLinea,
      exportadoEn: new Date().toISOString(),
   };

   const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
   const url = URL.createObjectURL(blob);
   const link = document.createElement("a");
   link.href = url;
   link.download = `diagrama-unifiliar-${puestoId || "sin-puesto"}.json`;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   URL.revokeObjectURL(url);
};

/**
 * Importa un dibujo desde un archivo JSON
 * @param {File} archivo - Archivo a importar
 * @returns {Promise<{exito: boolean, datos: Object|null}>}
 */
export const importarDesdeArchivo = (archivo) => {
   return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
         try {
            const datos = JSON.parse(e.target.result);

            if (!datos || typeof datos !== "object") {
               console.error("Archivo inválido: no es un objeto JSON");
               resolve({ exito: false, datos: null });
               return;
            }

            // Extraer datos (compatible con formato antiguo y nuevo)
            const celdas = datos.celdas || (datos.version ? {} : datos);
            const textos = datos.textos || [];
            const grosorLinea = datos.grosor || GROSORES_LINEA[1].valor;

            if (typeof celdas !== "object" || Array.isArray(celdas)) {
               console.error("Archivo inválido: celdas no es un objeto");
               resolve({ exito: false, datos: null });
               return;
            }

            resolve({
               exito: true,
               datos: { celdas, textos, grosorLinea },
            });
         } catch (error) {
            console.error("Error al parsear archivo JSON:", error);
            resolve({ exito: false, datos: null });
         }
      };

      reader.onerror = () => {
         console.error("Error al leer archivo");
         resolve({ exito: false, datos: null });
      };

      reader.readAsText(archivo);
   });
};
