// componentes/modales/lectura-completa/ModalLecturaCompleta.jsx
// Modal para mostrar todos los datos de una lectura expandida

import { createPortal } from "react-dom";
import { ContenidoFuncionalidades, SpinnerCarga } from "./ComponentesEstado";
import "./ModalLecturaCompleta.css";

/**
 * Modal de lectura completa
 */
export function ModalLecturaCompleta({
   abierto,
   onCerrar,
   alimentador,
   timestampFormateado,
   funcionalidadesTabActivo,
   tabs = [],
   tabActivo,
   setTabActivo,
   cargandoFuncionalidades,
   interpretarEstado,
   exportarCSV,
   obtenerTransformador,
   etiquetasBits = null,
}) {
   if (!abierto || !alimentador) return null;

   const colorHeader = alimentador.color || "#0ea5e9";

   const contenidoModal = (
      <div className="modal-lectura-overlay" onClick={onCerrar}>
         <div
            className="modal-lectura-contenedor"
            onClick={(e) => e.stopPropagation()}
            style={{ "--color-header": colorHeader }}
         >
            {/* Header */}
            <div className="modal-lectura-header">
               <div className="modal-lectura-header-info">
                  <span className="modal-lectura-indicador">▲</span>
                  <h2 className="modal-lectura-titulo">{alimentador.nombre}</h2>
               </div>
               <button
                  type="button"
                  className="modal-lectura-cerrar"
                  onClick={onCerrar}
                  title="Cerrar"
               >
                  <span>×</span>
               </button>
            </div>

            {/* Subtítulo con timestamp */}
            <div className="modal-lectura-subtitulo">
               <span className="modal-lectura-timestamp">
                  {timestampFormateado
                     ? `Última lectura: ${timestampFormateado}`
                     : "Sin fecha de lectura disponible"}
               </span>
            </div>

            {/* Tabs si hay múltiples registradores */}
            {tabs.length > 0 && (
               <div className="modal-lectura-tabs">
                  {tabs.map((tab) => (
                     <button
                        key={tab.id}
                        type="button"
                        className={`modal-lectura-tab ${tabActivo === tab.id ? "modal-lectura-tab--activo" : ""}`}
                        onClick={() => setTabActivo(tab.id)}
                     >
                        {tab.nombre}
                     </button>
                  ))}
               </div>
            )}

            {/* Contenido */}
            <div className="modal-lectura-contenido">
               {cargandoFuncionalidades ? (
                  <SpinnerCarga />
               ) : (
                  <ContenidoFuncionalidades
                     mediciones={funcionalidadesTabActivo?.mediciones || []}
                     estados={funcionalidadesTabActivo?.estados || []}
                     obtenerTransformador={obtenerTransformador}
                     interpretarEstado={interpretarEstado}
                     etiquetasBits={etiquetasBits}
                  />
               )}
            </div>

            {/* Footer */}
            <div className="modal-lectura-footer">
               <button
                  type="button"
                  className="modal-lectura-btn modal-lectura-btn--exportar"
                  onClick={exportarCSV}
                  title="Exportar a CSV"
                  disabled={cargandoFuncionalidades}
               >
                  <span className="modal-lectura-btn-icon">↓</span>
                  Exportar CSV
               </button>
            </div>
         </div>
      </div>
   );

   return createPortal(contenidoModal, document.body);
}

export default ModalLecturaCompleta;
