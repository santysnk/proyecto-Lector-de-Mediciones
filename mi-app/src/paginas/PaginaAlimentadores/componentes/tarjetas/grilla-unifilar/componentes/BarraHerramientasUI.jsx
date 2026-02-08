// componentes/BarraHerramientasUI.jsx
// Barra de herramientas de la grilla (componente principal)

import React from "react";
import { ColorPickerSimple } from "../../../modales/comunes";
import { PanelConfigChispas } from "./PanelConfigChispas";
import {
   IconoPincel, IconoBorrador, IconoBalde, IconoTexto, IconoMover,
   IconoEliminar, IconoGotero, IconoRayo, IconoDiana, IconoPlay,
   IconoPause, IconoConfig, IconoCheck, IconoX,
} from "./IconosHerramientas";

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
