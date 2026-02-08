// grilla-unifilar/GrillaUnifilarComponente.jsx
// Componente refactorizado de grilla unifiliar

import React, { useRef, useEffect, useState } from "react";
import { dibujarContenidoCanvas } from "./utilidades";
import { useTextEditor, useDragLines, useAreaBorrador, useKeyboardShortcuts, useDimensionesCanvas, useEventosCanvas } from "./hooks";
import { MenuContextual, EditorTexto, BarraHerramientas, CanvasChispas } from "./componentes";
import "../GrillaUnifilar.css";

/**
 * Componente de grilla unifiliar para dibujar diagramas
 * Funciona en dos modos:
 * - Modo edición: grilla visible al frente, permite dibujar
 * - Modo normal: solo muestra el dibujo como fondo transparente
 */
const GrillaUnifilar = ({
   celdas,
   textos = [],
   modoEdicion,
   colorSeleccionado,
   herramienta,
   estaPintando,
   coloresDisponibles,
   fuentesDisponibles = [],
   tamanosDisponibles = [],
   grosoresDisponibles = [],
   grosorLinea = 12,
   onCambiarGrosor,
   configTexto = {},
   onConfigTextoChange,
   textoSeleccionadoId,
   onTextoSeleccionadoChange,
   onPintarCelda,
   onIniciarPintado,
   onDetenerPintado,
   onCambiarColor,
   onSeleccionarPincel,
   onSeleccionarBorrador,
   onSeleccionarTexto,
   onSeleccionarBalde,
   onSeleccionarMover,
   onSeleccionarBorne,
   onRellenarConectadas,
   onBorrarArea,
   onObtenerCeldasConectadas,
   onMoverCeldasConectadas,
   onAgregarTexto,
   onActualizarTexto,
   onEliminarTexto,
   onLimpiarTodo,
   onCerrarEdicion,
   bornes = [],
   chispasConfig = {},
   tiposBorne = {},
   onAgregarBorne,
   onEliminarBorneEnPosicion,
   onActualizarChispasConfig,
   animandoChispas = false,
   onToggleAnimacionChispas,
   chispasRef: chispasRefProp,
   onObtenerPosicionPixelChispa,
   onObtenerEstelaPixeles,
}) => {
   const canvasRef = useRef(null);
   const contenedorRef = useRef(null);
   const posicionMouseRef = useRef({ x: 0, y: 0 });
   const [modoGotero, setModoGotero] = useState(false);
   const [tipoBorneActivo, setTipoBorneActivo] = useState("EMISOR");
   const [panelChispasVisible, setPanelChispasVisible] = useState(false);

   // Hooks personalizados
   const textEditor = useTextEditor({
      textos, colorSeleccionado, configTexto,
      onAgregarTexto, onActualizarTexto, onEliminarTexto,
      onTextoSeleccionadoChange, onCambiarColor, onConfigTextoChange,
   });

   const dragLines = useDragLines({
      onActualizarTexto, onMoverCeldasConectadas, onObtenerCeldasConectadas, celdas,
   });

   const areaBorrador = useAreaBorrador({ onBorrarArea });

   const { shiftPresionado } = useKeyboardShortcuts({
      textoSeleccionadoId, herramienta,
      inputTextoVisible: textEditor.inputTexto.visible,
      modoEdicion, textos, onEliminarTexto,
      onCopiarTexto: textEditor.copiarTexto,
      onPegarTexto: textEditor.pegarTexto,
      posicionMouseRef,
   });

   // Dimensiones del canvas
   const dimensiones = useDimensionesCanvas(contenedorRef, modoEdicion);

   // Event handlers del canvas
   const eventos = useEventosCanvas({
      canvasRef, posicionMouseRef, grosorLinea, modoEdicion, modoGotero, setModoGotero,
      herramienta, estaPintando, textoSeleccionadoId, tipoBorneActivo, bornes, celdas,
      textEditor, dragLines, areaBorrador, shiftPresionado,
      onIniciarPintado, onPintarCelda, onDetenerPintado, onRellenarConectadas,
      onTextoSeleccionadoChange, onCambiarColor, onAgregarBorne, onEliminarBorneEnPosicion,
      onEliminarTexto,
   });

   // Dibujar canvas principal
   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || dimensiones.ancho === 0) return;

      const ctx = canvas.getContext("2d");
      canvas.width = dimensiones.ancho;
      canvas.height = dimensiones.alto;

      dibujarContenidoCanvas(ctx, {
         ancho: dimensiones.ancho,
         alto: dimensiones.alto,
         modoEdicion,
         grosorLinea,
         celdas,
         textos,
         textoSeleccionadoId,
         bornes,
         areaBorradorState: areaBorrador.areaBorrador,
      });
   }, [celdas, textos, modoEdicion, dimensiones, textoSeleccionadoId, grosorLinea, areaBorrador.areaBorrador, bornes]);

   // Redimensionamiento del textarea
   useEffect(() => {
      if (!textEditor.redimensionando.activo) return;

      const handleMouseMove = (e) => {
         const deltaX = e.clientX - textEditor.redimensionando.inicioX;
         const deltaY = e.clientY - textEditor.redimensionando.inicioY;
         const handle = textEditor.redimensionando.handle;

         let nuevoAncho = textEditor.redimensionando.anchoInicial;
         let nuevoAlto = textEditor.redimensionando.altoInicial;

         if (handle.includes("e")) nuevoAncho = Math.max(100, textEditor.redimensionando.anchoInicial + deltaX);
         if (handle.includes("w")) nuevoAncho = Math.max(100, textEditor.redimensionando.anchoInicial - deltaX);
         if (handle.includes("s")) nuevoAlto = Math.max(30, textEditor.redimensionando.altoInicial + deltaY);
         if (handle.includes("n")) nuevoAlto = Math.max(30, textEditor.redimensionando.altoInicial - deltaY);

         textEditor.setInputTexto(prev => ({ ...prev, ancho: nuevoAncho, alto: nuevoAlto }));
      };

      const handleMouseUp = () => {
         textEditor.setRedimensionando({ activo: false, handle: null, inicioX: 0, inicioY: 0, anchoInicial: 0, altoInicial: 0 });
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
         window.removeEventListener("mousemove", handleMouseMove);
         window.removeEventListener("mouseup", handleMouseUp);
      };
   }, [textEditor.redimensionando, textEditor]);

   // No renderizar si no hay contenido y no está en modo edición
   if (!modoEdicion && Object.keys(celdas).length === 0 && textos.length === 0) {
      return null;
   }

   // Determinar cursor
   const getCursor = () => {
      if (!modoEdicion) return "default";
      if (modoGotero) return "crosshair";
      if (dragLines.arrastrando.activo) return "grabbing";
      if (dragLines.arrastrandoLineas.activo) return "grabbing";
      if (herramienta === "borrador") return "crosshair";
      if (herramienta === "balde") return "crosshair";
      if (herramienta === "borne") return "crosshair";
      if (herramienta === "mover") return eventos.sobreLinea ? "grab" : "move";
      if (herramienta === "texto") return eventos.sobreTexto ? "grab" : "text";
      return "crosshair";
   };

   return (
      <div
         ref={contenedorRef}
         className={`grilla-unifilar ${modoEdicion ? "grilla-unifilar--editando" : "grilla-unifilar--fondo"}`}
         onContextMenu={eventos.handleContextMenu}
      >
         <canvas
            ref={canvasRef}
            className="grilla-unifilar__canvas"
            onMouseDown={eventos.handleMouseDown}
            onMouseMove={eventos.handleMouseMove}
            onMouseUp={eventos.handleMouseUp}
            onMouseLeave={eventos.handleMouseLeave}
            onDoubleClick={eventos.handleDoubleClick}
            onContextMenu={eventos.handleContextMenu}
            onTouchStart={eventos.handleTouchStart}
            onTouchMove={eventos.handleTouchMove}
            onTouchEnd={eventos.handleTouchEnd}
            style={{ cursor: getCursor() }}
         />

         <CanvasChispas
            ancho={dimensiones.ancho}
            alto={dimensiones.alto}
            animandoChispas={animandoChispas}
            chispasConfig={chispasConfig}
            chispasRef={chispasRefProp}
            onObtenerPosicionPixelChispa={onObtenerPosicionPixelChispa}
            onObtenerEstelaPixeles={onObtenerEstelaPixeles}
         />

         <MenuContextual
            visible={eventos.menuContextual.visible}
            x={eventos.menuContextual.x}
            y={eventos.menuContextual.y}
            hayTextoEnPosicion={eventos.menuContextual.hayTextoEnPosicion}
            textoCopiado={textEditor.textoCopiado}
            onCopiar={eventos.handleCopiarMenu}
            onPegar={eventos.handlePegarMenu}
            onEliminar={eventos.handleEliminarMenu}
         />

         <EditorTexto
            visible={textEditor.inputTexto.visible}
            x={textEditor.inputTexto.x}
            y={textEditor.inputTexto.y}
            valor={textEditor.inputTexto.valor}
            ancho={textEditor.inputTexto.ancho}
            alto={textEditor.inputTexto.alto}
            editandoId={textEditor.inputTexto.editandoId}
            configTexto={configTexto}
            colorSeleccionado={colorSeleccionado}
            textareaRef={textEditor.textareaRef}
            onCambiarValor={(valor) => textEditor.setInputTexto(prev => ({ ...prev, valor }))}
            onKeyDown={textEditor.handleInputKeyDown}
            onConfirmar={textEditor.confirmarTexto}
            onCancelar={textEditor.cancelarTexto}
            onIniciarRedimension={textEditor.iniciarRedimension}
         />

         {modoEdicion && (
            <BarraHerramientas
               coloresDisponibles={coloresDisponibles}
               colorSeleccionado={colorSeleccionado}
               onCambiarColor={onCambiarColor}
               grosoresDisponibles={grosoresDisponibles}
               grosorLinea={grosorLinea}
               onCambiarGrosor={onCambiarGrosor}
               modoGotero={modoGotero}
               onToggleGotero={() => setModoGotero(!modoGotero)}
               herramienta={herramienta}
               onSeleccionarPincel={onSeleccionarPincel}
               onSeleccionarBorrador={onSeleccionarBorrador}
               onSeleccionarBalde={onSeleccionarBalde}
               onSeleccionarTexto={onSeleccionarTexto}
               onSeleccionarMover={onSeleccionarMover}
               onSeleccionarBorne={onSeleccionarBorne}
               onLimpiarTodo={onLimpiarTodo}
               tipoBorneActivo={tipoBorneActivo}
               onCambiarTipoBorne={setTipoBorneActivo}
               bornes={bornes}
               animandoChispas={animandoChispas}
               onToggleAnimacionChispas={onToggleAnimacionChispas}
               panelChispasVisible={panelChispasVisible}
               onTogglePanelChispas={() => setPanelChispasVisible(!panelChispasVisible)}
               chispasConfig={chispasConfig}
               onActualizarChispasConfig={onActualizarChispasConfig}
               textoSeleccionadoId={textoSeleccionadoId}
               textos={textos}
               fuentesDisponibles={fuentesDisponibles}
               tamanosDisponibles={tamanosDisponibles}
               configTexto={configTexto}
               onConfigTextoChange={onConfigTextoChange}
               onActualizarTexto={onActualizarTexto}
               onEliminarTexto={onEliminarTexto}
               inputTextoVisible={textEditor.inputTexto.visible}
               shiftPresionado={shiftPresionado}
               onCerrarEdicion={onCerrarEdicion}
            />
         )}
      </div>
   );
};

export default GrillaUnifilar;
