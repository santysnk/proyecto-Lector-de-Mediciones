// src/paginas/PaginaAlimentadores/componentes/modales/TabApariencia.jsx
// Pestaña de configuración de apariencia global de las tarjetas

import { useState, useCallback, useRef } from "react";
import { LIMITES_TAMAÑO } from "../../../constantes/estilosGlobalesTarjeta";
import { useEstilosApariencia } from "../../../hooks/preferencias";
import { PreviewTarjeta } from "../apariencia";
import {
   SeccionHeader,
   SeccionZona,
   SeccionFases,
   SeccionValores,
   SeccionDimensiones,
} from "./SeccionesApariencia";
import {
   SLIDES_CARRUSEL,
   SlideFuenteTamaño,
   SlideColoresDecimales,
   SlideDimensiones,
} from "./CarruselApariencia";
import "./TabApariencia.css";

const TabApariencia = ({ estilosIniciales, onGuardar, onCancelar }) => {
   const [slideActual, setSlideActual] = useState(0);
   const inputArchivoRef = useRef(null);

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

   const irAlSlideAnterior = useCallback(() => {
      setSlideActual((prev) => (prev > 0 ? prev - 1 : SLIDES_CARRUSEL.length - 1));
   }, []);

   const irAlSlideSiguiente = useCallback(() => {
      setSlideActual((prev) => (prev < SLIDES_CARRUSEL.length - 1 ? prev + 1 : 0));
   }, []);

   const handleGuardar = () => {
      onGuardar(estilos);
   };

   return (
      <div className="tab-apariencia">
         <div className="apariencia-layout">
            {/* Columna de controles */}
            <div className="apariencia-controles-columna">
               {/* Desktop */}
               <div className="apariencia-controles-unificado apariencia-controles-desktop">
                  <SeccionHeader estilos={estilos} actualizarHeader={actualizarHeader} remANumero={remANumero} />
                  <div className="apariencia-separador" />
                  <SeccionZona estilos={estilos} actualizarTituloZona={actualizarTituloZona} remANumero={remANumero} />
                  <div className="apariencia-separador" />
                  <SeccionFases estilos={estilos} actualizarTituloBox={actualizarTituloBox} remANumero={remANumero} />
                  <div className="apariencia-separador" />
                  <SeccionValores estilos={estilos} actualizarValorBox={actualizarValorBox} remANumero={remANumero} />
                  <div className="apariencia-separador" />
                  <SeccionDimensiones estilos={estilos} actualizarBox={actualizarBox} pxANumero={pxANumero} />
               </div>

               {/* Móvil: Carrusel */}
               <div className="apariencia-carrusel">
                  <div className="carrusel-navegacion">
                     <button type="button" className="carrusel-flecha carrusel-flecha--izq" onClick={irAlSlideAnterior} aria-label="Slide anterior">◀</button>
                     <span className="carrusel-titulo-central">{SLIDES_CARRUSEL[slideActual].label}</span>
                     <button type="button" className="carrusel-flecha carrusel-flecha--der" onClick={irAlSlideSiguiente} aria-label="Slide siguiente">▶</button>
                  </div>

                  <div className="carrusel-contenedor">
                     <SlideFuenteTamaño estilos={estilos} seccion="header" actualizar={actualizarHeader} remANumero={remANumero} limites={LIMITES_TAMAÑO.header} slideActual={slideActual} indice={0} />
                     <SlideFuenteTamaño estilos={estilos} seccion="tituloZona" actualizar={actualizarTituloZona} remANumero={remANumero} limites={LIMITES_TAMAÑO.tituloZona} slideActual={slideActual} indice={1} />
                     <SlideFuenteTamaño estilos={estilos} seccion="tituloBox" actualizar={actualizarTituloBox} remANumero={remANumero} limites={LIMITES_TAMAÑO.tituloBox} slideActual={slideActual} indice={2} />
                     <SlideFuenteTamaño estilos={estilos} seccion="valorBox" actualizar={actualizarValorBox} remANumero={remANumero} limites={LIMITES_TAMAÑO.valorBox} slideActual={slideActual} indice={3} />
                     <SlideColoresDecimales estilos={estilos} actualizarValorBox={actualizarValorBox} slideActual={slideActual} />
                     <SlideDimensiones estilos={estilos} actualizarBox={actualizarBox} pxANumero={pxANumero} slideActual={slideActual} />
                  </div>
               </div>
            </div>

            {/* Preview */}
            <div className="apariencia-preview-columna">
               <div className="apariencia-preview-label">Vista previa</div>
               <PreviewTarjeta estilos={estilos} valores={valoresPreview} onRandomizar={randomizarValores} onResetearValores={resetearValoresPreview} />
            </div>
         </div>

         {/* Footer */}
         <div className="apariencia-footer">
            <div className="apariencia-footer-izquierda">
               <button type="button" className="apariencia-btn apariencia-btn--reset" onClick={restaurarDefecto}>Restaurar por defecto</button>
               <button type="button" className="apariencia-btn apariencia-btn--importar" onClick={() => inputArchivoRef.current?.click()} title="Importar configuración desde archivo">Importar</button>
               <button type="button" className="apariencia-btn apariencia-btn--exportar" onClick={exportarConfiguracion} title="Exportar configuración a archivo">Exportar</button>
               <input ref={inputArchivoRef} type="file" accept=".json" onChange={importarConfiguracion} style={{ display: "none" }} />
            </div>
            <div className="apariencia-footer-derecha">
               <button type="button" className="apariencia-btn apariencia-btn--cancelar" onClick={onCancelar}>Cancelar</button>
               <button type="button" className="apariencia-btn apariencia-btn--guardar" onClick={handleGuardar}>Guardar</button>
            </div>
         </div>
      </div>
   );
};

export default TabApariencia;
