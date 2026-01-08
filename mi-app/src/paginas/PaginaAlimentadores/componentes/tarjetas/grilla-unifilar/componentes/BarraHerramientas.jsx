// componentes/BarraHerramientas.jsx
// Barra de herramientas de la grilla

import React from "react";
import { ColorPickerSimple } from "../../../modales/comunes";
import { PanelConfigChispas } from "./PanelConfigChispas";

// Iconos SVG
const IconoPincel = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z"/>
   </svg>
);

const IconoBorrador = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83l3.85 3.85c.39.39.9.59 1.41.59h8.48c.53 0 1.04-.21 1.41-.59l3.67-3.67c.78-.78.78-2.05 0-2.83L12.56 3.59C12.17 3.2 11.66 3 11.14 3h4zm-9.71 18H8.3l8.57-8.57-2.83-2.83L5.43 18.17l-.01 2.83z"/>
   </svg>
);

const IconoBalde = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5zM5.21 10L10 5.21 14.79 10H5.21zM16.56 8.94L10 2.38 3.44 8.94c-.59.59-.59 1.54 0 2.12l6.56 6.56c.59.59 1.54.59 2.12 0l6.44-6.44c.59-.59.59-1.54 0-2.12l-.12-.12z"/>
   </svg>
);

const IconoTexto = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M5 4v3h5.5v12h3V7H19V4H5z"/>
   </svg>
);

const IconoMover = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/>
   </svg>
);

const IconoEliminar = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
   </svg>
);

const IconoGotero = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-3.12 3.12-1.41-1.41-1.42 1.42 1.41 1.41-7.83 7.83a2 2 0 00-.59 1.42V19h2.83c.53 0 1.04-.21 1.42-.59l7.83-7.83 1.41 1.41 1.42-1.42-1.41-1.41 3.12-3.12a1 1 0 00.09-1.41zM6.41 18H5v-1.41l7.83-7.83 1.41 1.41L6.41 18z"/>
   </svg>
);

const IconoRayo = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66l.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/>
   </svg>
);

const IconoDiana = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2"/>
   </svg>
);

const IconoPlay = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M8 5v14l11-7z"/>
   </svg>
);

const IconoPause = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
   </svg>
);

const IconoConfig = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
   </svg>
);

const IconoCheck = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
   </svg>
);

const IconoX = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
   </svg>
);

/**
 * Componente de barra de herramientas
 */
export function BarraHerramientas({
   // Colores
   coloresDisponibles,
   colorSeleccionado,
   onCambiarColor,
   // Grosor
   grosoresDisponibles,
   grosorLinea,
   onCambiarGrosor,
   // Gotero
   modoGotero,
   onToggleGotero,
   // Herramientas
   herramienta,
   onSeleccionarPincel,
   onSeleccionarBorrador,
   onSeleccionarBalde,
   onSeleccionarTexto,
   onSeleccionarMover,
   onSeleccionarBorne,
   onLimpiarTodo,
   // Bornes y chispas
   tipoBorneActivo,
   onCambiarTipoBorne,
   bornes,
   animandoChispas,
   onToggleAnimacionChispas,
   panelChispasVisible,
   onTogglePanelChispas,
   chispasConfig,
   onActualizarChispasConfig,
   // Texto
   textoSeleccionadoId,
   textos,
   fuentesDisponibles,
   tamanosDisponibles,
   configTexto,
   onConfigTextoChange,
   onActualizarTexto,
   onEliminarTexto,
   inputTextoVisible,
   // Shift
   shiftPresionado,
   // Cerrar
   onCerrarEdicion
}) {
   const emisores = bornes.filter(b => b.tipo === "EMISOR").length;
   const receptores = bornes.filter(b => b.tipo === "RECEPTOR").length;
   const puedeAnimarChispas = emisores > 0 && receptores > 0;

   return (
      <div className="grilla-unifilar__toolbar">
         {/* Selector de colores */}
         <div className="grilla-unifilar__colores">
            {coloresDisponibles.map((c) => (
               <button
                  key={c.id}
                  type="button"
                  className={`grilla-unifilar__color ${colorSeleccionado === c.color ? "grilla-unifilar__color--activo" : ""} ${c.id === "negro" ? "grilla-unifilar__color--negro" : ""}`}
                  style={{ backgroundColor: c.color }}
                  onClick={() => {
                     onCambiarColor(c.color);
                     if (herramienta !== "texto") {
                        onSeleccionarPincel();
                     }
                  }}
                  title={c.nombre}
               />
            ))}
            <div className="grilla-unifilar__separador" />
            <ColorPickerSimple
               color={colorSeleccionado}
               onChange={(color) => {
                  onCambiarColor(color);
                  if (herramienta !== "texto") {
                     onSeleccionarPincel();
                  }
               }}
               label=""
               posicionArriba={true}
            />
         </div>

         {/* Sección de grosor y gotero */}
         <div className="grilla-unifilar__seccion-grosor">
            <select
               className="grilla-unifilar__select grilla-unifilar__select--grosor"
               value={grosorLinea}
               onChange={(e) => onCambiarGrosor?.(Number(e.target.value))}
               title="Grosor de línea"
            >
               {grosoresDisponibles.map((g) => (
                  <option key={g.id} value={g.valor}>
                     {g.nombre}
                  </option>
               ))}
            </select>
            <button
               type="button"
               className={`grilla-unifilar__btn ${modoGotero ? "grilla-unifilar__btn--activo" : ""}`}
               onClick={onToggleGotero}
               title="Gotero - clic en el canvas para copiar color"
            >
               <IconoGotero />
            </button>
         </div>

         {/* Herramientas */}
         <div className="grilla-unifilar__herramientas">
            <button
               type="button"
               className={`grilla-unifilar__btn ${herramienta === "pincel" ? "grilla-unifilar__btn--activo" : ""}`}
               onClick={onSeleccionarPincel}
               title="Pincel (mantener Shift para línea recta)"
            >
               <IconoPincel />
            </button>
            <button
               type="button"
               className={`grilla-unifilar__btn ${herramienta === "borrador" ? "grilla-unifilar__btn--activo" : ""}`}
               onClick={onSeleccionarBorrador}
               title="Borrador"
            >
               <IconoBorrador />
            </button>
            <button
               type="button"
               className={`grilla-unifilar__btn ${herramienta === "balde" ? "grilla-unifilar__btn--activo" : ""}`}
               onClick={onSeleccionarBalde}
               title="Balde de pintura (cambiar color de líneas conectadas)"
            >
               <IconoBalde />
            </button>
            <button
               type="button"
               className={`grilla-unifilar__btn ${herramienta === "texto" ? "grilla-unifilar__btn--activo" : ""}`}
               onClick={onSeleccionarTexto}
               title="Texto (doble clic para editar, arrastrar para mover)"
            >
               <IconoTexto />
            </button>
            <button
               type="button"
               className={`grilla-unifilar__btn ${herramienta === "mover" ? "grilla-unifilar__btn--activo" : ""}`}
               onClick={onSeleccionarMover}
               title="Mover líneas (arrastra líneas conectadas)"
            >
               <IconoMover />
            </button>
            <button
               type="button"
               className="grilla-unifilar__btn grilla-unifilar__btn--peligro"
               onClick={onLimpiarTodo}
               title="Limpiar todo"
            >
               <IconoEliminar />
            </button>

            <div className="grilla-unifilar__separador" />

            {/* Herramientas de bornes y chispas */}
            <button
               type="button"
               className={`grilla-unifilar__btn grilla-unifilar__btn--emisor ${herramienta === "borne" && tipoBorneActivo === "EMISOR" ? "grilla-unifilar__btn--activo" : ""}`}
               onClick={() => {
                  onCambiarTipoBorne("EMISOR");
                  onSeleccionarBorne?.();
               }}
               title="Colocar borne emisor (origen de chispas)"
            >
               <IconoRayo />
            </button>
            <button
               type="button"
               className={`grilla-unifilar__btn grilla-unifilar__btn--receptor ${herramienta === "borne" && tipoBorneActivo === "RECEPTOR" ? "grilla-unifilar__btn--activo" : ""}`}
               onClick={() => {
                  onCambiarTipoBorne("RECEPTOR");
                  onSeleccionarBorne?.();
               }}
               title="Colocar borne receptor (destino de chispas)"
            >
               <IconoDiana />
            </button>
            <button
               type="button"
               className={`grilla-unifilar__btn ${animandoChispas ? "grilla-unifilar__btn--activo grilla-unifilar__btn--animando" : ""}`}
               onClick={onToggleAnimacionChispas}
               title={animandoChispas ? "Detener animación de chispas" : "Iniciar animación de chispas"}
               disabled={!puedeAnimarChispas}
            >
               {animandoChispas ? <IconoPause /> : <IconoPlay />}
            </button>
            <button
               type="button"
               className={`grilla-unifilar__btn ${panelChispasVisible ? "grilla-unifilar__btn--activo" : ""}`}
               onClick={onTogglePanelChispas}
               title="Configuración de chispas"
            >
               <IconoConfig />
            </button>
         </div>

         {/* Opciones de texto */}
         {herramienta === "texto" && (
            <div className="grilla-unifilar__texto-opciones">
               <select
                  className="grilla-unifilar__select"
                  value={configTexto.fuente}
                  onChange={(e) => {
                     const nuevaFuente = e.target.value;
                     onConfigTextoChange?.({ ...configTexto, fuente: nuevaFuente });
                     if (!inputTextoVisible && textoSeleccionadoId) {
                        onActualizarTexto?.(textoSeleccionadoId, { fuente: nuevaFuente });
                     }
                  }}
                  title="Fuente"
               >
                  {fuentesDisponibles.map((f) => (
                     <option key={f.id} value={f.familia}>
                        {f.nombre}
                     </option>
                  ))}
               </select>

               <select
                  className="grilla-unifilar__select grilla-unifilar__select--tamano"
                  value={configTexto.tamano}
                  onChange={(e) => {
                     const nuevoTamano = Number(e.target.value);
                     onConfigTextoChange?.({ ...configTexto, tamano: nuevoTamano });
                     if (!inputTextoVisible && textoSeleccionadoId) {
                        onActualizarTexto?.(textoSeleccionadoId, { tamano: nuevoTamano });
                     }
                  }}
                  title="Tamaño"
               >
                  {tamanosDisponibles.map((t) => (
                     <option key={t} value={t}>
                        {t}px
                     </option>
                  ))}
               </select>

               <button
                  type="button"
                  className={`grilla-unifilar__btn grilla-unifilar__btn--formato ${configTexto.negrita ? "grilla-unifilar__btn--activo" : ""}`}
                  onClick={() => {
                     if (inputTextoVisible) {
                        onConfigTextoChange?.({ ...configTexto, negrita: !configTexto.negrita });
                     } else if (textoSeleccionadoId) {
                        const textoActual = textos.find(t => t.id === textoSeleccionadoId);
                        if (textoActual) {
                           onActualizarTexto?.(textoSeleccionadoId, { negrita: !textoActual.negrita });
                        }
                     } else {
                        onConfigTextoChange?.({ ...configTexto, negrita: !configTexto.negrita });
                     }
                  }}
                  title="Negrita"
               >
                  <strong>B</strong>
               </button>

               <button
                  type="button"
                  className={`grilla-unifilar__btn grilla-unifilar__btn--formato ${configTexto.cursiva ? "grilla-unifilar__btn--activo" : ""}`}
                  onClick={() => {
                     if (inputTextoVisible) {
                        onConfigTextoChange?.({ ...configTexto, cursiva: !configTexto.cursiva });
                     } else if (textoSeleccionadoId) {
                        const textoActual = textos.find(t => t.id === textoSeleccionadoId);
                        if (textoActual) {
                           onActualizarTexto?.(textoSeleccionadoId, { cursiva: !textoActual.cursiva });
                        }
                     } else {
                        onConfigTextoChange?.({ ...configTexto, cursiva: !configTexto.cursiva });
                     }
                  }}
                  title="Cursiva"
               >
                  <em>I</em>
               </button>

               {textoSeleccionadoId && (
                  <button
                     type="button"
                     className="grilla-unifilar__btn grilla-unifilar__btn--peligro"
                     onClick={() => onEliminarTexto?.(textoSeleccionadoId)}
                     title="Eliminar texto (Delete)"
                  >
                     <IconoX />
                  </button>
               )}
            </div>
         )}

         {/* Panel de configuración de chispas */}
         <PanelConfigChispas
            visible={panelChispasVisible}
            bornes={bornes}
            chispasConfig={chispasConfig}
            onActualizarChispasConfig={onActualizarChispasConfig}
         />

         {/* Indicador de Shift */}
         {herramienta === "pincel" && shiftPresionado && (
            <div className="grilla-unifilar__shift-indicator">
               Línea recta
            </div>
         )}

         {/* Botón cerrar */}
         <button
            type="button"
            className="grilla-unifilar__btn grilla-unifilar__btn--cerrar"
            onClick={onCerrarEdicion}
            title="Finalizar edición"
         >
            <IconoCheck />
            <span>Listo</span>
         </button>
      </div>
   );
}
