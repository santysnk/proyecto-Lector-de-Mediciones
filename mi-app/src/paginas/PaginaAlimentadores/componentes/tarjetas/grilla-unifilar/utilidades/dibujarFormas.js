// utilidades/dibujarFormas.js
// Funciones para dibujar formas de chispas en el canvas

/**
 * Convertir color hex a RGB
 * @param {string} hex - Color en formato hexadecimal
 * @returns {{r: number, g: number, b: number}}
 */
export function hexToRgb(hex) {
   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
   } : { r: 254, g: 240, b: 138 };
}

/**
 * Calcular ángulo de dirección de una chispa
 * @param {Object} chispa - Objeto chispa con ruta y posición
 * @returns {number} Ángulo en radianes
 */
export function calcularAngulo(chispa) {
   const { ruta, posicion } = chispa;
   if (!ruta || ruta.length < 2 || posicion >= ruta.length - 1) return 0;
   const [x1, y1] = ruta[posicion].split(",").map(Number);
   const [x2, y2] = ruta[posicion + 1].split(",").map(Number);
   return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Dibujar una forma en el canvas
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} tamano - Tamaño de la forma
 * @param {string} color - Color de la forma
 * @param {string} forma - Tipo de forma
 * @param {number} angulo - Ángulo de rotación
 * @param {number} opacidad - Opacidad de la forma
 */
export function dibujarForma(ctx, x, y, tamano, color, forma, angulo = 0, opacidad = 1) {
   ctx.save();
   ctx.translate(x, y);
   ctx.rotate(angulo);
   ctx.globalAlpha = opacidad;

   switch (forma) {
      case "cuadrado":
         ctx.fillStyle = color;
         ctx.fillRect(-tamano, -tamano, tamano * 2, tamano * 2);
         break;

      case "estrella":
         ctx.fillStyle = color;
         ctx.beginPath();
         for (let i = 0; i < 8; i++) {
            const radio = i % 2 === 0 ? tamano * 1.2 : tamano * 0.4;
            const a = (i * Math.PI) / 4;
            if (i === 0) ctx.moveTo(Math.cos(a) * radio, Math.sin(a) * radio);
            else ctx.lineTo(Math.cos(a) * radio, Math.sin(a) * radio);
         }
         ctx.closePath();
         ctx.fill();
         break;

      case "rayo":
         ctx.fillStyle = color;
         ctx.beginPath();
         ctx.moveTo(-tamano * 1.2, -tamano * 0.3);
         ctx.lineTo(-tamano * 0.3, tamano * 0.5);
         ctx.lineTo(-tamano * 0.3, 0);
         ctx.lineTo(tamano * 1.2, tamano * 0.3);
         ctx.lineTo(tamano * 0.3, -tamano * 0.5);
         ctx.lineTo(tamano * 0.3, 0);
         ctx.closePath();
         ctx.fill();
         break;

      case "flecha":
         ctx.fillStyle = color;
         ctx.beginPath();
         ctx.moveTo(tamano * 1.2, 0);
         ctx.lineTo(-tamano * 0.8, -tamano * 0.8);
         ctx.lineTo(-tamano * 0.4, 0);
         ctx.lineTo(-tamano * 0.8, tamano * 0.8);
         ctx.closePath();
         ctx.fill();
         break;

      case "gota":
         ctx.fillStyle = color;
         ctx.beginPath();
         ctx.moveTo(tamano * 1.2, 0);
         ctx.quadraticCurveTo(0, -tamano * 0.8, -tamano * 0.8, 0);
         ctx.quadraticCurveTo(0, tamano * 0.8, tamano * 1.2, 0);
         ctx.fill();
         break;

      case "anillo":
         ctx.strokeStyle = color;
         ctx.lineWidth = tamano * 0.4;
         ctx.beginPath();
         ctx.arc(0, 0, tamano * 0.8, 0, Math.PI * 2);
         ctx.stroke();
         break;

      case "barra":
         if (color.startsWith("#")) {
            const gradientBarra = ctx.createLinearGradient(-tamano * 6, 0, tamano * 6, 0);
            gradientBarra.addColorStop(0, "transparent");
            gradientBarra.addColorStop(0.15, `${color}15`);
            gradientBarra.addColorStop(0.3, `${color}40`);
            gradientBarra.addColorStop(0.45, `${color}80`);
            gradientBarra.addColorStop(0.5, color);
            gradientBarra.addColorStop(0.55, `${color}80`);
            gradientBarra.addColorStop(0.7, `${color}40`);
            gradientBarra.addColorStop(0.85, `${color}15`);
            gradientBarra.addColorStop(1, "transparent");
            ctx.fillStyle = gradientBarra;
            ctx.fillRect(-tamano * 6, -tamano * 1.2, tamano * 12, tamano * 2.4);
         }
         ctx.fillStyle = color;
         ctx.fillRect(-tamano * 0.4, -tamano * 1.2, tamano * 0.8, tamano * 2.4);
         break;

      case "circulo":
      default:
         ctx.fillStyle = color;
         ctx.beginPath();
         ctx.arc(0, 0, tamano, 0, Math.PI * 2);
         ctx.fill();
         break;
   }

   ctx.restore();
}

/**
 * Dibujar efecto de brillo (glow) para una chispa
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} tamano - Tamaño de la chispa
 * @param {string} color - Color de la chispa
 */
export function dibujarGlow(ctx, x, y, tamano, color) {
   const gradient = ctx.createRadialGradient(x, y, 0, x, y, tamano * 2);
   gradient.addColorStop(0, color);
   gradient.addColorStop(0.5, `${color}80`);
   gradient.addColorStop(1, "transparent");

   ctx.beginPath();
   ctx.arc(x, y, tamano * 2, 0, Math.PI * 2);
   ctx.fillStyle = gradient;
   ctx.fill();
}
