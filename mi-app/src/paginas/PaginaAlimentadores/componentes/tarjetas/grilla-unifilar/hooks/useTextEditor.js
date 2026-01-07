// hooks/useTextEditor.js
// Hook para manejar la edición de texto en la grilla

import { useState, useCallback, useRef } from "react";

/**
 * Estado inicial del input de texto
 */
const INPUT_INICIAL = {
   visible: false,
   x: 0,
   y: 0,
   valor: "",
   editandoId: null,
   ancho: 220,
   alto: 55,
   valorOriginal: ""
};

/**
 * Estado inicial de redimensionamiento
 */
const REDIMENSION_INICIAL = {
   activo: false,
   handle: null,
   inicioX: 0,
   inicioY: 0,
   anchoInicial: 0,
   altoInicial: 0
};

/**
 * Hook para manejar el editor de texto
 * @param {Object} params - Parámetros del hook
 * @returns {Object} Estado y funciones del editor
 */
export function useTextEditor({
   textos,
   colorSeleccionado,
   configTexto,
   onAgregarTexto,
   onActualizarTexto,
   onEliminarTexto,
   onTextoSeleccionadoChange,
   onCambiarColor,
   onConfigTextoChange
}) {
   const [inputTexto, setInputTexto] = useState(INPUT_INICIAL);
   const [redimensionando, setRedimensionando] = useState(REDIMENSION_INICIAL);
   const [textoCopiado, setTextoCopiado] = useState(null);
   const textareaRef = useRef(null);

   /**
    * Verificar si un punto está sobre un texto
    */
   const textoEnPunto = useCallback((px, py, canvas) => {
      if (!canvas) return null;

      const ctx = canvas.getContext("2d");

      for (let i = textos.length - 1; i >= 0; i--) {
         const t = textos[i];
         const fontStyle = `${t.cursiva ? "italic " : ""}${t.negrita ? "bold " : ""}${t.tamano}px ${t.fuente}`;
         ctx.font = fontStyle;

         const lineas = t.texto.split("\n");
         const alturaLinea = t.tamano * 1.2;
         let anchoMaximo = 0;
         lineas.forEach(linea => {
            const anchoLinea = ctx.measureText(linea).width;
            if (anchoLinea > anchoMaximo) anchoMaximo = anchoLinea;
         });
         const alturaTotal = lineas.length * alturaLinea;

         if (
            px >= t.x - 2 &&
            px <= t.x + anchoMaximo + 2 &&
            py >= t.y - 2 &&
            py <= t.y + alturaTotal + 2
         ) {
            return t;
         }
      }
      return null;
   }, [textos]);

   /**
    * Abrir editor para nuevo texto
    */
   const abrirEditorNuevo = useCallback((x, y) => {
      setInputTexto({
         visible: true,
         x,
         y,
         valor: "",
         editandoId: null,
         ancho: 220,
         alto: 55,
         valorOriginal: ""
      });
   }, []);

   /**
    * Abrir editor para texto existente
    */
   const abrirEditorExistente = useCallback((texto, canvas) => {
      const ctx = canvas?.getContext("2d");
      let anchoCalculado = 200;
      let altoCalculado = 40;

      if (ctx) {
         const fontStyle = `${texto.cursiva ? "italic " : ""}${texto.negrita ? "bold " : ""}${texto.tamano}px ${texto.fuente}`;
         ctx.font = fontStyle;
         const lineas = texto.texto.split("\n");
         const alturaLinea = texto.tamano * 1.2;
         let anchoMax = 0;
         lineas.forEach(linea => {
            const w = ctx.measureText(linea).width;
            if (w > anchoMax) anchoMax = w;
         });
         anchoCalculado = Math.max(200, anchoMax + 30);
         altoCalculado = Math.max(40, lineas.length * alturaLinea + 20);
      }

      onCambiarColor?.(texto.color);
      onConfigTextoChange?.({
         fuente: texto.fuente,
         tamano: texto.tamano,
         negrita: texto.negrita,
         cursiva: texto.cursiva,
      });

      setInputTexto({
         visible: true,
         x: texto.x,
         y: texto.y,
         valor: texto.texto,
         editandoId: texto.id,
         ancho: anchoCalculado,
         alto: altoCalculado,
         valorOriginal: texto.texto
      });
      onTextoSeleccionadoChange?.(texto.id);
   }, [onCambiarColor, onConfigTextoChange, onTextoSeleccionadoChange]);

   /**
    * Confirmar texto ingresado
    */
   const confirmarTexto = useCallback(() => {
      if (inputTexto.valor.trim()) {
         if (inputTexto.editandoId) {
            onActualizarTexto?.(inputTexto.editandoId, {
               texto: inputTexto.valor,
               color: colorSeleccionado,
               fuente: configTexto.fuente,
               tamano: configTexto.tamano,
               negrita: configTexto.negrita,
               cursiva: configTexto.cursiva,
            });
         } else {
            onAgregarTexto?.(inputTexto.x, inputTexto.y, inputTexto.valor);
         }
      } else if (inputTexto.editandoId) {
         onEliminarTexto?.(inputTexto.editandoId);
      }
      setInputTexto(INPUT_INICIAL);
   }, [inputTexto, colorSeleccionado, configTexto, onAgregarTexto, onActualizarTexto, onEliminarTexto]);

   /**
    * Cancelar edición
    */
   const cancelarTexto = useCallback(() => {
      setInputTexto(INPUT_INICIAL);
   }, []);

   /**
    * Eliminar texto actual
    */
   const eliminarTextoActual = useCallback(() => {
      if (inputTexto.editandoId) {
         onEliminarTexto?.(inputTexto.editandoId);
      }
      setInputTexto(INPUT_INICIAL);
   }, [inputTexto.editandoId, onEliminarTexto]);

   /**
    * Manejar teclas en el textarea
    */
   const handleInputKeyDown = useCallback((e) => {
      if (e.key === "Enter") {
         if (e.altKey) {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const valor = inputTexto.valor;
            const nuevoValor = valor.substring(0, start) + "\n" + valor.substring(end);
            setInputTexto(prev => ({ ...prev, valor: nuevoValor }));
            setTimeout(() => {
               textarea.selectionStart = textarea.selectionEnd = start + 1;
            }, 0);
         } else {
            e.preventDefault();
            confirmarTexto();
         }
      } else if (e.key === "Escape") {
         cancelarTexto();
      }
   }, [confirmarTexto, cancelarTexto, inputTexto.valor]);

   /**
    * Manejar cambio de texto
    */
   const handleTextareaInput = useCallback((e) => {
      setInputTexto(prev => ({ ...prev, valor: e.target.value }));
   }, []);

   /**
    * Iniciar redimensionamiento
    */
   const iniciarRedimension = useCallback((e, handle) => {
      e.preventDefault();
      e.stopPropagation();
      setRedimensionando({
         activo: true,
         handle,
         inicioX: e.clientX,
         inicioY: e.clientY,
         anchoInicial: inputTexto.ancho,
         altoInicial: inputTexto.alto,
      });
   }, [inputTexto.ancho, inputTexto.alto]);

   /**
    * Copiar texto
    */
   const copiarTexto = useCallback((textoId) => {
      const textoACopiar = textos.find(t => t.id === textoId);
      if (textoACopiar) {
         setTextoCopiado({ ...textoACopiar });
      }
   }, [textos]);

   /**
    * Pegar texto
    */
   const pegarTexto = useCallback((x, y) => {
      if (textoCopiado) {
         onAgregarTexto?.(x, y, textoCopiado.texto);
         setTimeout(() => {
            const ultimoTexto = textos[textos.length - 1];
            if (ultimoTexto) {
               onActualizarTexto?.(ultimoTexto.id, {
                  color: textoCopiado.color,
                  fuente: textoCopiado.fuente,
                  tamano: textoCopiado.tamano,
                  negrita: textoCopiado.negrita,
                  cursiva: textoCopiado.cursiva,
               });
            }
         }, 50);
      }
   }, [textoCopiado, textos, onAgregarTexto, onActualizarTexto]);

   return {
      inputTexto,
      setInputTexto,
      redimensionando,
      setRedimensionando,
      textoCopiado,
      textareaRef,
      textoEnPunto,
      abrirEditorNuevo,
      abrirEditorExistente,
      confirmarTexto,
      cancelarTexto,
      eliminarTextoActual,
      handleInputKeyDown,
      handleTextareaInput,
      iniciarRedimension,
      copiarTexto,
      pegarTexto
   };
}
