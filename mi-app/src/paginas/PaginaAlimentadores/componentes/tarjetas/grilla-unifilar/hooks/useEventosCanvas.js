/**
 * Hook que agrupa todos los event handlers del canvas de la grilla unifiliar
 */

import { useState, useCallback, useEffect } from "react";
import { obtenerCoordenadasCelda, obtenerCoordenadasPixel, hayCeldaEn } from "../utilidades";

/**
 * @param {Object} config - Todas las dependencias necesarias
 * @returns {Object} Event handlers y estado del menú contextual
 */
export const useEventosCanvas = ({
   canvasRef,
   posicionMouseRef,
   grosorLinea,
   modoEdicion,
   modoGotero,
   setModoGotero,
   herramienta,
   estaPintando,
   textoSeleccionadoId,
   tipoBorneActivo,
   bornes,
   celdas,
   textEditor,
   dragLines,
   areaBorrador,
   shiftPresionado,
   onIniciarPintado,
   onPintarCelda,
   onDetenerPintado,
   onRellenarConectadas,
   onTextoSeleccionadoChange,
   onCambiarColor,
   onAgregarBorne,
   onEliminarBorneEnPosicion,
   onEliminarTexto,
}) => {
   const [menuContextual, setMenuContextual] = useState({
      visible: false, x: 0, y: 0, pixelX: 0, pixelY: 0, hayTextoEnPosicion: false,
   });
   const [sobreTexto, setSobreTexto] = useState(false);
   const [sobreLinea, setSobreLinea] = useState(false);

   // Capturar color con gotero
   const capturarColorGotero = useCallback((e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0].toString(16).padStart(2, "0");
      const g = pixel[1].toString(16).padStart(2, "0");
      const b = pixel[2].toString(16).padStart(2, "0");

      onCambiarColor(`#${r}${g}${b}`);
      setModoGotero(false);
   }, [canvasRef, onCambiarColor, setModoGotero]);

   // Mouse down
   const handleMouseDown = useCallback((e) => {
      if (!modoEdicion) return;
      if (e.button !== 0) return;
      e.preventDefault();

      if (menuContextual.visible) {
         setMenuContextual(prev => ({ ...prev, visible: false }));
         return;
      }

      if (modoGotero) {
         capturarColorGotero(e);
         return;
      }

      const coordsCelda = obtenerCoordenadasCelda(e, canvasRef.current, grosorLinea);
      const coordsPixel = obtenerCoordenadasPixel(e, canvasRef.current);

      if (herramienta === "texto") {
         if (!coordsPixel) return;
         const textoEncontrado = textEditor.textoEnPunto(coordsPixel.x, coordsPixel.y, canvasRef.current);

         if (textoEncontrado) {
            onTextoSeleccionadoChange?.(textoEncontrado.id);
            dragLines.iniciarArrastreTexto(textoEncontrado.id, coordsPixel.x, coordsPixel.y, textoEncontrado.x, textoEncontrado.y);
         } else {
            if (textoSeleccionadoId) {
               onTextoSeleccionadoChange?.(null);
               return;
            }
            textEditor.abrirEditorNuevo(coordsPixel.x, coordsPixel.y);
         }
      } else if (herramienta === "borne") {
         if (coordsCelda) {
            const borneExistente = bornes.find(b => b.x === coordsCelda.x && b.y === coordsCelda.y);
            if (borneExistente) {
               onEliminarBorneEnPosicion?.(coordsCelda.x, coordsCelda.y);
            } else {
               onAgregarBorne?.(coordsCelda.x, coordsCelda.y, tipoBorneActivo);
            }
         }
      } else if (herramienta === "balde") {
         if (coordsCelda) {
            onRellenarConectadas?.(coordsCelda.x, coordsCelda.y);
         }
      } else if (herramienta === "mover") {
         if (coordsCelda && hayCeldaEn(coordsCelda.x, coordsCelda.y, celdas)) {
            dragLines.iniciarArrastreLineas(coordsCelda.x, coordsCelda.y);
         }
      } else if (herramienta === "borrador") {
         if (coordsCelda) {
            areaBorrador.iniciarSeleccion(coordsCelda.x, coordsCelda.y);
         }
      } else {
         if (coordsCelda) {
            onIniciarPintado(coordsCelda.x, coordsCelda.y);
            onPintarCelda(coordsCelda.x, coordsCelda.y, shiftPresionado);
         }
      }
   }, [
      modoEdicion, modoGotero, capturarColorGotero, herramienta, grosorLinea,
      textEditor, dragLines, areaBorrador, onIniciarPintado, onPintarCelda,
      onRellenarConectadas, onTextoSeleccionadoChange, shiftPresionado,
      menuContextual.visible, textoSeleccionadoId, tipoBorneActivo,
      bornes, onAgregarBorne, onEliminarBorneEnPosicion, celdas, canvasRef
   ]);

   // Doble click para editar texto
   const handleDoubleClick = useCallback((e) => {
      if (!modoEdicion || herramienta !== "texto") return;
      e.preventDefault();

      const coordsPixel = obtenerCoordenadasPixel(e, canvasRef.current);
      if (!coordsPixel) return;

      const textoEncontrado = textEditor.textoEnPunto(coordsPixel.x, coordsPixel.y, canvasRef.current);
      if (textoEncontrado) {
         textEditor.abrirEditorExistente(textoEncontrado, canvasRef.current);
      }
   }, [modoEdicion, herramienta, textEditor, canvasRef]);

   // Mouse move
   const handleMouseMove = useCallback((e) => {
      if (!modoEdicion) return;

      const coordsPixel = obtenerCoordenadasPixel(e, canvasRef.current);
      if (coordsPixel) {
         posicionMouseRef.current = { x: coordsPixel.x, y: coordsPixel.y };
      }

      if (dragLines.arrastrando.activo) {
         if (coordsPixel) {
            dragLines.moverTextoArrastrando(coordsPixel.x, coordsPixel.y);
         }
         return;
      }

      if (dragLines.arrastrandoLineas.activo) {
         const coordsCelda = obtenerCoordenadasCelda(e, canvasRef.current, grosorLinea);
         if (coordsCelda) {
            dragLines.moverLineasArrastrando(coordsCelda.x, coordsCelda.y);
         }
         return;
      }

      if (areaBorrador.areaBorrador.activo) {
         const coordsCelda = obtenerCoordenadasCelda(e, canvasRef.current, grosorLinea);
         if (coordsCelda) {
            areaBorrador.actualizarSeleccion(coordsCelda.x, coordsCelda.y);
         }
         return;
      }

      if (herramienta === "texto" && coordsPixel) {
         const textoEncontrado = textEditor.textoEnPunto(coordsPixel.x, coordsPixel.y, canvasRef.current);
         setSobreTexto(!!textoEncontrado);
      }

      if (herramienta === "mover") {
         const coordsCelda = obtenerCoordenadasCelda(e, canvasRef.current, grosorLinea);
         if (coordsCelda) {
            setSobreLinea(hayCeldaEn(coordsCelda.x, coordsCelda.y, celdas));
         }
      }

      if (!estaPintando || herramienta === "texto" || herramienta === "mover" || herramienta === "borrador") return;

      const coordsCelda = obtenerCoordenadasCelda(e, canvasRef.current, grosorLinea);
      if (coordsCelda) {
         onPintarCelda(coordsCelda.x, coordsCelda.y, shiftPresionado);
      }
   }, [modoEdicion, dragLines, areaBorrador, herramienta, estaPintando, grosorLinea, textEditor, onPintarCelda, shiftPresionado, celdas, canvasRef, posicionMouseRef]);

   // Mouse up
   const handleMouseUp = useCallback(() => {
      if (!modoEdicion) return;

      if (areaBorrador.areaBorrador.activo) {
         areaBorrador.confirmarBorrado();
      }

      onDetenerPintado();
      dragLines.detenerArrastre();
   }, [modoEdicion, onDetenerPintado, areaBorrador, dragLines]);

   // Mouse leave
   const handleMouseLeave = useCallback(() => {
      if (estaPintando) onDetenerPintado();
      dragLines.detenerArrastre();
      areaBorrador.cancelarSeleccion();
      setSobreTexto(false);
      setSobreLinea(false);
   }, [estaPintando, onDetenerPintado, dragLines, areaBorrador]);

   // Context menu
   const handleContextMenu = useCallback((e) => {
      if (!modoEdicion) return;
      if (herramienta !== "texto") {
         e.preventDefault();
         return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (menuContextual.visible) {
         setMenuContextual(prev => ({ ...prev, visible: false }));
         return;
      }

      const coordsPixel = obtenerCoordenadasPixel(e, canvasRef.current);
      if (!coordsPixel) return;

      const textoEncontrado = textEditor.textoEnPunto(coordsPixel.x, coordsPixel.y, canvasRef.current);
      if (textoEncontrado) {
         onTextoSeleccionadoChange?.(textoEncontrado.id);
      } else {
         if (textoSeleccionadoId) {
            onTextoSeleccionadoChange?.(null);
            return;
         }
      }

      const rect = canvasRef.current.getBoundingClientRect();
      setMenuContextual({
         visible: true,
         x: e.clientX - rect.left,
         y: e.clientY - rect.top,
         pixelX: coordsPixel.x,
         pixelY: coordsPixel.y,
         hayTextoEnPosicion: !!textoEncontrado,
      });
   }, [modoEdicion, herramienta, textEditor, onTextoSeleccionadoChange, textoSeleccionadoId, menuContextual.visible, canvasRef]);

   // Cerrar menú contextual
   useEffect(() => {
      const handleClick = () => {
         if (menuContextual.visible) {
            setMenuContextual(prev => ({ ...prev, visible: false }));
         }
      };

      if (menuContextual.visible) {
         setTimeout(() => window.addEventListener("click", handleClick), 0);
      }

      return () => window.removeEventListener("click", handleClick);
   }, [menuContextual.visible]);

   // Touch events
   const handleTouchStart = useCallback((e) => {
      if (!modoEdicion || herramienta === "texto") return;
      e.preventDefault();
      const touch = e.touches[0];
      const coordsCelda = obtenerCoordenadasCelda({ clientX: touch.clientX, clientY: touch.clientY }, canvasRef.current, grosorLinea);
      if (coordsCelda) {
         onIniciarPintado(coordsCelda.x, coordsCelda.y);
         onPintarCelda(coordsCelda.x, coordsCelda.y, false);
      }
   }, [modoEdicion, herramienta, grosorLinea, onIniciarPintado, onPintarCelda, canvasRef]);

   const handleTouchMove = useCallback((e) => {
      if (!modoEdicion || !estaPintando || herramienta === "texto") return;
      e.preventDefault();
      const touch = e.touches[0];
      const coordsCelda = obtenerCoordenadasCelda({ clientX: touch.clientX, clientY: touch.clientY }, canvasRef.current, grosorLinea);
      if (coordsCelda) {
         onPintarCelda(coordsCelda.x, coordsCelda.y, false);
      }
   }, [modoEdicion, estaPintando, herramienta, grosorLinea, onPintarCelda, canvasRef]);

   const handleTouchEnd = useCallback(() => {
      if (!modoEdicion) return;
      onDetenerPintado();
   }, [modoEdicion, onDetenerPintado]);

   // Handlers del menú contextual
   const handleCopiarMenu = useCallback(() => {
      if (textoSeleccionadoId) {
         textEditor.copiarTexto(textoSeleccionadoId);
         onTextoSeleccionadoChange?.(null);
      }
      setMenuContextual(prev => ({ ...prev, visible: false }));
   }, [textoSeleccionadoId, textEditor, onTextoSeleccionadoChange]);

   const handlePegarMenu = useCallback(() => {
      textEditor.pegarTexto(menuContextual.pixelX, menuContextual.pixelY);
      setMenuContextual(prev => ({ ...prev, visible: false }));
   }, [textEditor, menuContextual.pixelX, menuContextual.pixelY]);

   const handleEliminarMenu = useCallback(() => {
      if (textoSeleccionadoId) {
         onEliminarTexto?.(textoSeleccionadoId);
      }
      setMenuContextual(prev => ({ ...prev, visible: false }));
   }, [textoSeleccionadoId, onEliminarTexto]);

   return {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleMouseLeave,
      handleDoubleClick,
      handleContextMenu,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleCopiarMenu,
      handlePegarMenu,
      handleEliminarMenu,
      menuContextual,
      sobreTexto,
      sobreLinea,
   };
};
