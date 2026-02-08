// componentes/modales/comunes/SeccionesApariencia.jsx
// Secciones desktop para el tab de apariencia

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

export const SeccionHeader = ({ estilos, actualizarHeader, remANumero }) => (
   <div className="apariencia-grupo">
      <span className="apariencia-grupo-label">Header</span>
      <SelectorFuente
         value={estilos.header.fontFamily}
         onChange={(fontFamily) => actualizarHeader({ fontFamily })}
         fuentes={FUENTES_DISPONIBLES}
      />
      <SliderConFlechas
         value={remANumero(estilos.header.fontSize)}
         onChange={(val) => actualizarHeader({ fontSize: `${val}rem` })}
         min={LIMITES_TAMAÑO.header.min}
         max={LIMITES_TAMAÑO.header.max}
         step={LIMITES_TAMAÑO.header.step}
         valorDisplay={estilos.header.fontSize}
      />
   </div>
);

export const SeccionZona = ({ estilos, actualizarTituloZona, remANumero }) => (
   <div className="apariencia-grupo">
      <span className="apariencia-grupo-label">Zona</span>
      <SelectorFuente
         value={estilos.tituloZona.fontFamily}
         onChange={(fontFamily) => actualizarTituloZona({ fontFamily })}
         fuentes={FUENTES_DISPONIBLES}
      />
      <SliderConFlechas
         value={remANumero(estilos.tituloZona.fontSize)}
         onChange={(val) => actualizarTituloZona({ fontSize: `${val}rem` })}
         min={LIMITES_TAMAÑO.tituloZona.min}
         max={LIMITES_TAMAÑO.tituloZona.max}
         step={LIMITES_TAMAÑO.tituloZona.step}
         valorDisplay={estilos.tituloZona.fontSize}
      />
   </div>
);

export const SeccionFases = ({ estilos, actualizarTituloBox, remANumero }) => (
   <div className="apariencia-grupo">
      <span className="apariencia-grupo-label">Fases</span>
      <SelectorFuente
         value={estilos.tituloBox.fontFamily}
         onChange={(fontFamily) => actualizarTituloBox({ fontFamily })}
         fuentes={FUENTES_DISPONIBLES}
      />
      <SliderConFlechas
         value={remANumero(estilos.tituloBox.fontSize)}
         onChange={(val) => actualizarTituloBox({ fontSize: `${val}rem` })}
         min={LIMITES_TAMAÑO.tituloBox.min}
         max={LIMITES_TAMAÑO.tituloBox.max}
         step={LIMITES_TAMAÑO.tituloBox.step}
         valorDisplay={estilos.tituloBox.fontSize}
      />
   </div>
);

export const SeccionValores = ({ estilos, actualizarValorBox, remANumero }) => (
   <>
      <div className="apariencia-grupo">
         <span className="apariencia-grupo-label">Valores</span>
         <SelectorFuente
            value={estilos.valorBox.fontFamily}
            onChange={(fontFamily) => actualizarValorBox({ fontFamily })}
            fuentes={FUENTES_DISPONIBLES}
         />
         <SliderConFlechas
            value={remANumero(estilos.valorBox.fontSize)}
            onChange={(val) => actualizarValorBox({ fontSize: `${val}rem` })}
            min={LIMITES_TAMAÑO.valorBox.min}
            max={LIMITES_TAMAÑO.valorBox.max}
            step={LIMITES_TAMAÑO.valorBox.step}
            valorDisplay={estilos.valorBox.fontSize}
         />
      </div>

      <div className="apariencia-colores-decimales">
         <div className="apariencia-colores-grupo">
            <span className="apariencia-mini-label">Color:</span>
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

         <div className="apariencia-decimales-grupo">
            <span className="apariencia-mini-label">Decimales:</span>
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
   </>
);

export const SeccionDimensiones = ({ estilos, actualizarBox, pxANumero }) => (
   <div className="apariencia-grupo apariencia-grupo--dimensiones">
      <span className="apariencia-grupo-label">Dimensiones</span>
      <div className="apariencia-dimensiones-fila">
         <div className="apariencia-dimension-item">
            <label>Ancho</label>
            <SliderConFlechas
               value={pxANumero(estilos.box.width)}
               onChange={(val) => actualizarBox({ width: `${val}px` })}
               min={LIMITES_TAMAÑO.boxWidth.min}
               max={LIMITES_TAMAÑO.boxWidth.max}
               step={LIMITES_TAMAÑO.boxWidth.step}
               valorDisplay={estilos.box.width}
            />
         </div>
         <div className="apariencia-dimension-item">
            <label>Espacio</label>
            <SliderConFlechas
               value={pxANumero(estilos.box.gap)}
               onChange={(val) => actualizarBox({ gap: `${val}px` })}
               min={LIMITES_TAMAÑO.gap.min}
               max={LIMITES_TAMAÑO.gap.max}
               step={LIMITES_TAMAÑO.gap.step}
               valorDisplay={estilos.box.gap}
            />
         </div>
         <div className="apariencia-dimension-item">
            <label>Alto</label>
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
      </div>
   </div>
);
