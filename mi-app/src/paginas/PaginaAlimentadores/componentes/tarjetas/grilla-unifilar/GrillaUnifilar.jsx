// grilla-unifilar/GrillaUnifilar.jsx
// Componente refactorizado de grilla unifiliar

import React, { useRef, useEffect, useCallback, useState } from "react";
import { obtenerCoordenadasCelda, obtenerCoordenadasPixel, hayCeldaEn } from "./utilidades";
import { useTextEditor, useDragLines, useAreaBorrador, useKeyboardShortcuts } from "./hooks";
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
   const [dimensiones, setDimensiones] = useState({ ancho: 0, alto: 0 });
   const [modoGotero, setModoGotero] = useState(false);
   const [tipoBorneActivo, setTipoBorneActivo] = useState("EMISOR");
   const [panelChispasVisible, setPanelChispasVisible] = useState(false);
   const [sobreTexto, setSobreTexto] = useState(false);
   const [sobreLinea, setSobreLinea] = useState(false);
   const [menuContextual, setMenuContextual] = useState({
      visible: false,
      x: 0,
      y: 0,
      pixelX: 0,
      pixelY: 0,
      hayTextoEnPosicion: false,
   });

   // Hooks personalizados
   const textEditor = useTextEditor({
      textos,
      colorSeleccionado,
      configTexto,
      onAgregarTexto,
      onActualizarTexto,
      onEliminarTexto,
      onTextoSeleccionadoChange,
      onCambiarColor,
      onConfigTextoChange
   });

   const dragLines = useDragLines({
      onActualizarTexto,
      onMoverCeldasConectadas,
      onObtenerCeldasConectadas,
      celdas
   });

   const areaBorrador = useAreaBorrador({ onBorrarArea });

   const { shiftPresionado } = useKeyboardShortcuts({
      textoSeleccionadoId,
      herramienta,
      inputTextoVisible: textEditor.inputTexto.visible,
      modoEdicion,
      textos,
      onEliminarTexto,
      onCopiarTexto: textEditor.copiarTexto,
      onPegarTexto: textEditor.pegarTexto,
      posicionMouseRef
   });

   // Calcular dimensiones
   useEffect(() => {
      let resizeObserver = null;
      let timer = null;

      const actualizarDimensiones = () => {
         if (!contenedorRef.current) return;
         const padre = contenedorRef.current.parentElement;
         if (!padre) return;

         const rect = padre.getBoundingClientRect();
         if (rect.width > 0 && rect.height > 0) {
            setDimensiones({ ancho: rect.width, alto: rect.height });
         }
      };

      requestAnimationFrame(actualizarDimensiones);
      timer = setTimeout(actualizarDimensiones, 50);
      const timer2 = setTimeout(actualizarDimensiones, 150);

      resizeObserver = new ResizeObserver(actualizarDimensiones);
      if (contenedorRef.current?.parentElement) {
         resizeObserver.observe(contenedorRef.current.parentElement);
      }

      window.addEventListener("resize", actualizarDimensiones);

      return () => {
         clearTimeout(timer);
         clearTimeout(timer2);
         if (resizeObserver) resizeObserver.disconnect();
         window.removeEventListener("resize", actualizarDimensiones);
      };
   }, [modoEdicion]);

   // Dibujar canvas principal
   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || dimensiones.ancho === 0) return;

      const ctx = canvas.getContext("2d");
      const { ancho, alto } = dimensiones;

      canvas.width = ancho;
      canvas.height = alto;
      ctx.clearRect(0, 0, ancho, alto);

      // Dibujar grilla en modo edición
      if (modoEdicion) {
         ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
         ctx.lineWidth = 1;

         for (let x = 0; x <= ancho; x += grosorLinea) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, alto);
            ctx.stroke();
         }

         for (let y = 0; y <= alto; y += grosorLinea) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(ancho, y + 0.5);
            ctx.stroke();
         }
      }

      // Dibujar celdas pintadas
      Object.entries(celdas).forEach(([clave, color]) => {
         const [x, y] = clave.split(",").map(Number);
         ctx.fillStyle = color;
         ctx.fillRect(x * grosorLinea, y * grosorLinea, grosorLinea, grosorLinea);
      });

      // Dibujar textos
      textos.forEach((t) => {
         const fontStyle = `${t.cursiva ? "italic " : ""}${t.negrita ? "bold " : ""}${t.tamano}px ${t.fuente}`;
         ctx.font = fontStyle;
         ctx.fillStyle = t.color;
         ctx.textBaseline = "top";

         const lineas = t.texto.split("\n");
         const alturaLinea = t.tamano * 1.2;
         let anchoMaximo = 0;

         lineas.forEach((linea, index) => {
            ctx.fillText(linea, t.x, t.y + index * alturaLinea);
            const anchoLinea = ctx.measureText(linea).width;
            if (anchoLinea > anchoMaximo) anchoMaximo = anchoLinea;
         });

         if (modoEdicion && textoSeleccionadoId === t.id) {
            const alturaTotal = lineas.length * alturaLinea;
            ctx.strokeStyle = "#22d3ee";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 2]);
            ctx.strokeRect(t.x - 2, t.y - 2, anchoMaximo + 4, alturaTotal + 4);
            ctx.setLineDash([]);
         }
      });

      // Dibujar bornes
      bornes.forEach((borne) => {
         const centroX = borne.x * grosorLinea + grosorLinea / 2;
         const centroY = borne.y * grosorLinea + grosorLinea / 2;
         const radio = grosorLinea * 0.8;

         ctx.beginPath();
         ctx.arc(centroX, centroY, radio, 0, Math.PI * 2);
         ctx.fillStyle = borne.color;
         ctx.fill();
         ctx.strokeStyle = borne.tipo === "EMISOR" ? "#0ea5e9" : "#ea580c";
         ctx.lineWidth = 2;
         ctx.stroke();

         ctx.font = `bold ${grosorLinea * 0.7}px sans-serif`;
         ctx.fillStyle = "#ffffff";
         ctx.textAlign = "center";
         ctx.textBaseline = "middle";
         ctx.fillText(borne.tipo === "EMISOR" ? "E" : "R", centroX, centroY);
      });

      // Dibujar área de selección del borrador
      if (areaBorrador.areaBorrador.activo) {
         const { inicioX, inicioY, actualX, actualY } = areaBorrador.areaBorrador;
         const minX = Math.min(inicioX, actualX);
         const maxX = Math.max(inicioX, actualX);
         const minY = Math.min(inicioY, actualY);
         const maxY = Math.max(inicioY, actualY);

         const rectX = minX * grosorLinea;
         const rectY = minY * grosorLinea;
         const rectW = (maxX - minX + 1) * grosorLinea;
         const rectH = (maxY - minY + 1) * grosorLinea;

         ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
         ctx.fillRect(rectX, rectY, rectW, rectH);

         ctx.strokeStyle = "#ef4444";
         ctx.lineWidth = 2;
         ctx.setLineDash([6, 3]);
         ctx.strokeRect(rectX, rectY, rectW, rectH);
         ctx.setLineDash([]);
      }
   }, [celdas, textos, modoEdicion, dimensiones, textoSeleccionadoId, grosorLinea, areaBorrador.areaBorrador, bornes]);

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
   }, [onCambiarColor]);

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
      bornes, onAgregarBorne, onEliminarBorneEnPosicion, celdas
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
   }, [modoEdicion, herramienta, textEditor]);

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
   }, [modoEdicion, dragLines, areaBorrador, herramienta, estaPintando, grosorLinea, textEditor, onPintarCelda, shiftPresionado, celdas]);

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
   }, [modoEdicion, herramienta, textEditor, onTextoSeleccionadoChange, textoSeleccionadoId, menuContextual.visible]);

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
   }, [modoEdicion, herramienta, grosorLinea, onIniciarPintado, onPintarCelda]);

   const handleTouchMove = useCallback((e) => {
      if (!modoEdicion || !estaPintando || herramienta === "texto") return;
      e.preventDefault();
      const touch = e.touches[0];
      const coordsCelda = obtenerCoordenadasCelda({ clientX: touch.clientX, clientY: touch.clientY }, canvasRef.current, grosorLinea);
      if (coordsCelda) {
         onPintarCelda(coordsCelda.x, coordsCelda.y, false);
      }
   }, [modoEdicion, estaPintando, herramienta, grosorLinea, onPintarCelda]);

   const handleTouchEnd = useCallback(() => {
      if (!modoEdicion) return;
      onDetenerPintado();
   }, [modoEdicion, onDetenerPintado]);

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
      if (herramienta === "mover") return sobreLinea ? "grab" : "move";
      if (herramienta === "texto") return sobreTexto ? "grab" : "text";
      return "crosshair";
   };

   return (
      <div
         ref={contenedorRef}
         className={`grilla-unifilar ${modoEdicion ? "grilla-unifilar--editando" : "grilla-unifilar--fondo"}`}
         onContextMenu={handleContextMenu}
      >
         <canvas
            ref={canvasRef}
            className="grilla-unifilar__canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
            visible={menuContextual.visible}
            x={menuContextual.x}
            y={menuContextual.y}
            hayTextoEnPosicion={menuContextual.hayTextoEnPosicion}
            textoCopiado={textEditor.textoCopiado}
            onCopiar={() => {
               if (textoSeleccionadoId) {
                  textEditor.copiarTexto(textoSeleccionadoId);
                  onTextoSeleccionadoChange?.(null);
               }
               setMenuContextual(prev => ({ ...prev, visible: false }));
            }}
            onPegar={() => {
               textEditor.pegarTexto(menuContextual.pixelX, menuContextual.pixelY);
               setMenuContextual(prev => ({ ...prev, visible: false }));
            }}
            onEliminar={() => {
               if (textoSeleccionadoId) {
                  onEliminarTexto?.(textoSeleccionadoId);
               }
               setMenuContextual(prev => ({ ...prev, visible: false }));
            }}
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
