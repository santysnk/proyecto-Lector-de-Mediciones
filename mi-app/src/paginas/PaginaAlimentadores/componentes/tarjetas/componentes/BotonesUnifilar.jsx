// componentes/BotonesUnifilar.jsx
// Botones flotantes para controlar la grilla unifiliar

/**
 * Botón flotante para activar modo edición de diagrama
 * @param {Object} props
 * @param {Function} props.onActivar - Handler para activar edición
 */
export const BotonEditarDiagrama = ({ onActivar }) => (
   <button
      type="button"
      className="grilla-btn-editar-diagrama"
      onClick={onActivar}
      title="Editar diagrama unifiliar"
   >
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
         <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      </svg>
   </button>
);

/**
 * Botones para guardar/cargar diagrama desde archivo
 * @param {Object} props
 * @param {Function} props.onExportar - Handler para exportar
 * @param {Function} props.onImportar - Handler para importar (recibe archivo)
 */
export const BotonesArchivo = ({ onExportar, onImportar }) => (
   <div className="grilla-btns-archivo">
      {/* Botón guardar */}
      <button
         type="button"
         className="grilla-btn-archivo grilla-btn-archivo--guardar"
         onClick={onExportar}
         title="Guardar diagrama a archivo"
      >
         <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
         </svg>
      </button>
      {/* Botón abrir */}
      <label className="grilla-btn-archivo grilla-btn-archivo--abrir" title="Cargar diagrama desde archivo">
         <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
         </svg>
         <input
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={async (e) => {
               const archivo = e.target.files?.[0];
               if (archivo) {
                  const exito = await onImportar(archivo);
                  if (!exito) {
                     alert("Error al cargar el archivo. Verifica que sea un archivo JSON válido.");
                  }
               }
               e.target.value = "";
            }}
         />
      </label>
   </div>
);
