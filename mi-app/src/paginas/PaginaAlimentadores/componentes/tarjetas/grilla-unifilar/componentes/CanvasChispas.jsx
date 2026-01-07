// componentes/CanvasChispas.jsx
// Canvas separado para renderizar chispas con animación independiente

import React, { useRef, useEffect } from "react";
import { hexToRgb, calcularAngulo, dibujarForma, dibujarGlow } from "../utilidades";

/**
 * Canvas de chispas - usa requestAnimationFrame independiente
 * @param {Object} props - Propiedades del componente
 */
export function CanvasChispas({
   ancho,
   alto,
   animandoChispas,
   chispasConfig,
   chispasRef,
   onObtenerPosicionPixelChispa,
   onObtenerEstelaPixeles
}) {
   const canvasRef = useRef(null);
   const animationRef = useRef(null);
   const propsRef = useRef({ onObtenerPosicionPixelChispa, onObtenerEstelaPixeles });

   // Mantener ref actualizado
   useEffect(() => {
      propsRef.current = { onObtenerPosicionPixelChispa, onObtenerEstelaPixeles };
   }, [onObtenerPosicionPixelChispa, onObtenerEstelaPixeles]);

   // Loop de animación de chispas
   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || ancho === 0) return;

      canvas.width = ancho;
      canvas.height = alto;

      const ctx = canvas.getContext("2d");

      const colorChispa = chispasConfig.color || "#fef08a";
      const tamanoChispa = chispasConfig.tamano || 4;
      const mostrarEstela = chispasConfig.estela !== false;
      const formaChispa = chispasConfig.forma || "circulo";
      const rgb = hexToRgb(colorChispa);

      const dibujarChispas = () => {
         ctx.clearRect(0, 0, ancho, alto);

         const chispasActuales = chispasRef?.current || [];
         const { onObtenerPosicionPixelChispa: getPosicion, onObtenerEstelaPixeles: getEstela } = propsRef.current;

         if (chispasActuales.length > 0 && getPosicion) {
            for (let i = 0; i < chispasActuales.length; i++) {
               const chispa = chispasActuales[i];
               const angulo = calcularAngulo(chispa);

               // Dibujar estela
               if (mostrarEstela && getEstela) {
                  const estelaPixeles = getEstela(chispa);
                  for (let j = 0; j < estelaPixeles.length; j++) {
                     const punto = estelaPixeles[j];
                     dibujarForma(
                        ctx,
                        punto.x,
                        punto.y,
                        tamanoChispa * 0.6,
                        `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${punto.opacidad * 0.6})`,
                        formaChispa,
                        angulo,
                        punto.opacidad * 0.6
                     );
                  }
               }

               // Dibujar chispa principal
               const pos = getPosicion(chispa);

               // Efecto de brillo
               if (["circulo", "estrella", "anillo"].includes(formaChispa)) {
                  dibujarGlow(ctx, pos.x, pos.y, tamanoChispa, colorChispa);
               }

               dibujarForma(ctx, pos.x, pos.y, tamanoChispa, colorChispa, formaChispa, angulo);
            }
         }

         if (animandoChispas) {
            animationRef.current = requestAnimationFrame(dibujarChispas);
         }
      };

      if (animandoChispas) {
         animationRef.current = requestAnimationFrame(dibujarChispas);
      } else {
         ctx.clearRect(0, 0, ancho, alto);
      }

      return () => {
         if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
         }
      };
   }, [ancho, alto, animandoChispas, chispasConfig, chispasRef]);

   return (
      <canvas
         ref={canvasRef}
         className="grilla-unifilar__canvas-chispas"
         style={{ pointerEvents: "none" }}
      />
   );
}
