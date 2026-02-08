// componentes/modales/comunes/CarruselApariencia.jsx
// Slides del carrusel móvil para el tab de apariencia

import {
   FUENTES_DISPONIBLES,
   LIMITES_TAMAÑO,
   COLORES_VALOR_PREDEFINIDOS,
   OPCIONES_DECIMALES,
} from "../../../constantes/estilosGlobalesTarjeta";
import {
   SelectorFuente,
   SliderConFlechas,
   ColorPickerBoton,
} from "../apariencia";

export const SLIDES_CARRUSEL = [
   { id: "header", label: "Header" },
   { id: "zona", label: "Zona" },
   { id: "fases", label: "Fases" },
   { id: "valores1", label: "Valores 1/2" },
   { id: "valores2", label: "Valores 2/2" },
   { id: "dimensiones", label: "Dimensiones" },
];

export const SlideFuenteTamaño = ({
   estilos,
   seccion,
   actualizar,
   remANumero,
   limites,
   slideActual,
   indice,
}) => (
   <div className={`carrusel-slide ${slideActual === indice ? "carrusel-slide--activo" : ""}`}>
      <div className="carrusel-fila">
         <span className="carrusel-label">Fuente:</span>
         <SelectorFuente
            value={estilos[seccion].fontFamily}
            onChange={(fontFamily) => actualizar({ fontFamily })}
            fuentes={FUENTES_DISPONIBLES}
         />
      </div>
      <div className="carrusel-fila">
         <span className="carrusel-label">Tamaño:</span>
         <SliderConFlechas
            value={remANumero(estilos[seccion].fontSize)}
            onChange={(val) => actualizar({ fontSize: `${val}rem` })}
            min={limites.min}
            max={limites.max}
            step={limites.step}
            valorDisplay={estilos[seccion].fontSize}
         />
      </div>
   </div>
);

export const SlideColoresDecimales = ({ estilos, actualizarValorBox, slideActual }) => (
   <div className={`carrusel-slide ${slideActual === 4 ? "carrusel-slide--activo" : ""}`}>
      <div className="carrusel-fila carrusel-fila--colores">
         <span className="carrusel-label">Color:</span>
         <div className="apariencia-colores-inline">
            {COLORES_VALOR_PREDEFINIDOS.map((color) => (
               <button
                  key={color}
                  type="button"
                  className={`apariencia-color-btn ${estilos.valorBox.color === color ? "apariencia-color-btn--activo" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => actualizarValorBox({ color })}
                  title={color}
               />
            ))}
            <ColorPickerBoton
               color={estilos.valorBox.color}
               onChange={(color) => actualizarValorBox({ color })}
            />
         </div>
      </div>
      <div className="carrusel-fila">
         <span className="carrusel-label">Decimales:</span>
         <div className="apariencia-decimales-inline">
            {OPCIONES_DECIMALES.map((opcion) => (
               <button
                  key={opcion.valor}
                  type="button"
                  className={`apariencia-decimal-btn ${(estilos.valorBox.decimales ?? 2) === opcion.valor ? "apariencia-decimal-btn--activo" : ""}`}
                  onClick={() => actualizarValorBox({ decimales: opcion.valor })}
               >
                  {opcion.valor}
               </button>
            ))}
         </div>
      </div>
   </div>
);

export const SlideDimensiones = ({ estilos, actualizarBox, pxANumero, slideActual }) => (
   <div className={`carrusel-slide ${slideActual === 5 ? "carrusel-slide--activo" : ""}`}>
      <div className="carrusel-fila">
         <span className="carrusel-label">Ancho:</span>
         <SliderConFlechas
            value={pxANumero(estilos.box.width)}
            onChange={(val) => actualizarBox({ width: `${val}px` })}
            min={LIMITES_TAMAÑO.boxWidth.min}
            max={LIMITES_TAMAÑO.boxWidth.max}
            step={LIMITES_TAMAÑO.boxWidth.step}
            valorDisplay={estilos.box.width}
         />
      </div>
      <div className="carrusel-fila">
         <span className="carrusel-label">Alto:</span>
         <SliderConFlechas
            value={
               estilos.box.height === "auto"
                  ? LIMITES_TAMAÑO.boxHeight.min
                  : pxANumero(estilos.box.height)
            }
            onChange={(val) => actualizarBox({ height: `${val}px` })}
            min={LIMITES_TAMAÑO.boxHeight.min}
            max={LIMITES_TAMAÑO.boxHeight.max}
            step={LIMITES_TAMAÑO.boxHeight.step}
            valorDisplay={estilos.box.height}
         />
      </div>
      <div className="carrusel-fila">
         <span className="carrusel-label">Espacio:</span>
         <SliderConFlechas
            value={pxANumero(estilos.box.gap)}
            onChange={(val) => actualizarBox({ gap: `${val}px` })}
            min={LIMITES_TAMAÑO.gap.min}
            max={LIMITES_TAMAÑO.gap.max}
            step={LIMITES_TAMAÑO.gap.step}
            valorDisplay={estilos.box.gap}
         />
      </div>
   </div>
);
