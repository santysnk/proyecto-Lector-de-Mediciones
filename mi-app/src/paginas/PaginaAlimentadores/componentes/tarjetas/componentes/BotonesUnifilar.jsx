// componentes/BotonesUnifilar.jsx
// Botones flotantes para controlar la grilla unifiliar y visibilidad

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
export const BotonesArchivo = ({ onExportar, onImportar, onCerrar }) => (
   <div className="grilla-btns-archivo">
      {/* Fila superior: guardar */}
      <div className="grilla-btns-archivo-fila">
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
      </div>
      {/* Fila inferior: cargar + cerrar */}
      <div className="grilla-btns-archivo-fila">
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
         <button
            type="button"
            className="grilla-btn-archivo grilla-btn-archivo--cerrar"
            onClick={onCerrar}
            title="Salir del modo edición"
         >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
               <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
         </button>
      </div>
   </div>
);

/**
 * Botón flotante para ocultar/mostrar la card "Nuevo Registrador"
 * @param {Object} props
 * @param {boolean} props.visible - Si la card está visible
 * @param {Function} props.onToggle - Handler para alternar visibilidad
 */
export const BotonToggleNuevoRegistrador = ({ visible, onToggle }) => (
   <button
      type="button"
      className={`grilla-btn-toggle-nuevo${visible ? "" : " grilla-btn-toggle-nuevo--oculto"}`}
      onClick={onToggle}
      title={visible ? "Ocultar card Nuevo Registrador" : "Mostrar card Nuevo Registrador"}
   >
      {visible ? (
         <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
         </svg>
      ) : (
         <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
         </svg>
      )}
   </button>
);
