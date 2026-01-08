// src/paginas/PaginaAlimentadores/componentes/modales/TabApariencia.jsx
// Pestaña de configuración de apariencia global de las tarjetas

import { useState, useCallback, useRef } from "react";
import {
   FUENTES_DISPONIBLES,
   LIMITES_TAMAÑO,
   COLORES_VALOR_PREDEFINIDOS,
   OPCIONES_DECIMALES,
} from "../../../constantes/estilosGlobalesTarjeta";
import { useEstilosApariencia } from "../../../hooks/preferencias";
import {
   SelectorFuente,
   SliderConFlechas,
   ColorPickerBoton,
   PreviewTarjeta,
} from "../apariencia";
import "./TabApariencia.css";

/**
 * Nombres de los slides del carrusel para móvil
 */
const SLIDES_CARRUSEL = [
   { id: "header", label: "Header" },
   { id: "zona", label: "Zona" },
   { id: "fases", label: "Fases" },
   { id: "valores1", label: "Valores 1/2" },
   { id: "valores2", label: "Valores 2/2" },
   { id: "dimensiones", label: "Dimensiones" },
];

// ============================================================================
// Componentes de sección para Desktop
// ============================================================================

/**
 * Sección de configuración del header
 */
const SeccionHeader = ({ estilos, actualizarHeader, remANumero }) => (
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

/**
 * Sección de configuración de título de zona
 */
const SeccionZona = ({ estilos, actualizarTituloZona, remANumero }) => (
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

/**
 * Sección de configuración de fases (títulos de box)
 */
const SeccionFases = ({ estilos, actualizarTituloBox, remANumero }) => (
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

/**
 * Sección de configuración de valores (fuente, tamaño, color, decimales)
 */
const SeccionValores = ({ estilos, actualizarValorBox, remANumero }) => (
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

      {/* Colores y Decimales en una fila */}
      <div className="apariencia-colores-decimales">
         {/* Colores a la izquierda */}
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

         {/* Decimales a la derecha */}
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

/**
 * Sección de configuración de dimensiones (ancho, alto, espacio)
 */
const SeccionDimensiones = ({ estilos, actualizarBox, pxANumero }) => (
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

// ============================================================================
// Componentes de slide para Carrusel móvil
// ============================================================================

/**
 * Slide genérico para fuente y tamaño
 */
const SlideFuenteTamaño = ({
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

/**
 * Slide de colores y decimales
 */
const SlideColoresDecimales = ({ estilos, actualizarValorBox, slideActual }) => (
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

/**
 * Slide de dimensiones
 */
const SlideDimensiones = ({ estilos, actualizarBox, pxANumero, slideActual }) => (
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

// ============================================================================
// Componente principal TabApariencia
// ============================================================================

/**
 * Componente para configurar la apariencia global de las tarjetas
 */
const TabApariencia = ({ estilosIniciales, onGuardar, onCancelar }) => {
   // Estado para el carrusel en móvil
   const [slideActual, setSlideActual] = useState(0);

   // Referencia para el input de archivo oculto
   const inputArchivoRef = useRef(null);

   // Hook de manejo de estilos
   const {
      estilos,
      valoresPreview,
      actualizarHeader,
      actualizarTituloZona,
      actualizarTituloBox,
      actualizarValorBox,
      actualizarBox,
      restaurarDefecto,
      randomizarValores,
      resetearValoresPreview,
      exportarConfiguracion,
      importarConfiguracion,
      remANumero,
      pxANumero,
   } = useEstilosApariencia({ estilosIniciales });

   // Navegación del carrusel
   const irAlSlideAnterior = useCallback(() => {
      setSlideActual((prev) => (prev > 0 ? prev - 1 : SLIDES_CARRUSEL.length - 1));
   }, []);

   const irAlSlideSiguiente = useCallback(() => {
      setSlideActual((prev) => (prev < SLIDES_CARRUSEL.length - 1 ? prev + 1 : 0));
   }, []);

   // Guardar cambios
   const handleGuardar = () => {
      onGuardar(estilos);
   };

   return (
      <div className="tab-apariencia">
         <div className="apariencia-layout">
            {/* Columna de controles */}
            <div className="apariencia-controles-columna">
               {/* Versión Desktop: contenedor con scroll */}
               <div className="apariencia-controles-unificado apariencia-controles-desktop">
                  <SeccionHeader
                     estilos={estilos}
                     actualizarHeader={actualizarHeader}
                     remANumero={remANumero}
                  />
                  <div className="apariencia-separador" />

                  <SeccionZona
                     estilos={estilos}
                     actualizarTituloZona={actualizarTituloZona}
                     remANumero={remANumero}
                  />
                  <div className="apariencia-separador" />

                  <SeccionFases
                     estilos={estilos}
                     actualizarTituloBox={actualizarTituloBox}
                     remANumero={remANumero}
                  />
                  <div className="apariencia-separador" />

                  <SeccionValores
                     estilos={estilos}
                     actualizarValorBox={actualizarValorBox}
                     remANumero={remANumero}
                  />
                  <div className="apariencia-separador" />

                  <SeccionDimensiones
                     estilos={estilos}
                     actualizarBox={actualizarBox}
                     pxANumero={pxANumero}
                  />
               </div>

               {/* Versión Móvil: Carrusel con flechas */}
               <div className="apariencia-carrusel">
                  {/* Navegación del carrusel con título en el centro */}
                  <div className="carrusel-navegacion">
                     <button
                        type="button"
                        className="carrusel-flecha carrusel-flecha--izq"
                        onClick={irAlSlideAnterior}
                        aria-label="Slide anterior"
                     >
                        ◀
                     </button>

                     <span className="carrusel-titulo-central">
                        {SLIDES_CARRUSEL[slideActual].label}
                     </span>

                     <button
                        type="button"
                        className="carrusel-flecha carrusel-flecha--der"
                        onClick={irAlSlideSiguiente}
                        aria-label="Slide siguiente"
                     >
                        ▶
                     </button>
                  </div>

                  {/* Contenedor de slides */}
                  <div className="carrusel-contenedor">
                     {/* Slide 0: Header */}
                     <SlideFuenteTamaño
                        estilos={estilos}
                        seccion="header"
                        actualizar={actualizarHeader}
                        remANumero={remANumero}
                        limites={LIMITES_TAMAÑO.header}
                        slideActual={slideActual}
                        indice={0}
                     />

                     {/* Slide 1: Zona */}
                     <SlideFuenteTamaño
                        estilos={estilos}
                        seccion="tituloZona"
                        actualizar={actualizarTituloZona}
                        remANumero={remANumero}
                        limites={LIMITES_TAMAÑO.tituloZona}
                        slideActual={slideActual}
                        indice={1}
                     />

                     {/* Slide 2: Fases */}
                     <SlideFuenteTamaño
                        estilos={estilos}
                        seccion="tituloBox"
                        actualizar={actualizarTituloBox}
                        remANumero={remANumero}
                        limites={LIMITES_TAMAÑO.tituloBox}
                        slideActual={slideActual}
                        indice={2}
                     />

                     {/* Slide 3: Valores 1/2 (Fuente y Tamaño) */}
                     <SlideFuenteTamaño
                        estilos={estilos}
                        seccion="valorBox"
                        actualizar={actualizarValorBox}
                        remANumero={remANumero}
                        limites={LIMITES_TAMAÑO.valorBox}
                        slideActual={slideActual}
                        indice={3}
                     />

                     {/* Slide 4: Valores 2/2 (Color y Decimales) */}
                     <SlideColoresDecimales
                        estilos={estilos}
                        actualizarValorBox={actualizarValorBox}
                        slideActual={slideActual}
                     />

                     {/* Slide 5: Dimensiones */}
                     <SlideDimensiones
                        estilos={estilos}
                        actualizarBox={actualizarBox}
                        pxANumero={pxANumero}
                        slideActual={slideActual}
                     />
                  </div>
               </div>
            </div>

            {/* Columna de preview */}
            <div className="apariencia-preview-columna">
               <div className="apariencia-preview-label">Vista previa</div>
               <PreviewTarjeta
                  estilos={estilos}
                  valores={valoresPreview}
                  onRandomizar={randomizarValores}
                  onResetearValores={resetearValoresPreview}
               />
            </div>
         </div>

         {/* Footer con botones */}
         <div className="apariencia-footer">
            <div className="apariencia-footer-izquierda">
               <button
                  type="button"
                  className="apariencia-btn apariencia-btn--reset"
                  onClick={restaurarDefecto}
               >
                  Restaurar por defecto
               </button>
               <button
                  type="button"
                  className="apariencia-btn apariencia-btn--importar"
                  onClick={() => inputArchivoRef.current?.click()}
                  title="Importar configuración desde archivo"
               >
                  Importar
               </button>
               <button
                  type="button"
                  className="apariencia-btn apariencia-btn--exportar"
                  onClick={exportarConfiguracion}
                  title="Exportar configuración a archivo"
               >
                  Exportar
               </button>
               {/* Input oculto para importar archivo */}
               <input
                  ref={inputArchivoRef}
                  type="file"
                  accept=".json"
                  onChange={importarConfiguracion}
                  style={{ display: "none" }}
               />
            </div>
            <div className="apariencia-footer-derecha">
               <button
                  type="button"
                  className="apariencia-btn apariencia-btn--cancelar"
                  onClick={onCancelar}
               >
                  Cancelar
               </button>
               <button
                  type="button"
                  className="apariencia-btn apariencia-btn--guardar"
                  onClick={handleGuardar}
               >
                  Guardar
               </button>
            </div>
         </div>
      </div>
   );
};

export default TabApariencia;
