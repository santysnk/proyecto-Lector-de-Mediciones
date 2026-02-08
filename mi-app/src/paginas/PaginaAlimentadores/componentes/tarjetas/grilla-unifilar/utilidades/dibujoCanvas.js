/**
 * Función pura para dibujar el contenido del canvas de la grilla unifiliar
 */

/**
 * Dibuja todo el contenido del canvas: grilla, celdas, textos, bornes y área de borrado
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} params
 */
export const dibujarContenidoCanvas = (ctx, {
   ancho,
   alto,
   modoEdicion,
   grosorLinea,
   celdas,
   textos,
   textoSeleccionadoId,
   bornes,
   areaBorradorState,
}) => {
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
   if (areaBorradorState.activo) {
      const { inicioX, inicioY, actualX, actualY } = areaBorradorState;
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
};
