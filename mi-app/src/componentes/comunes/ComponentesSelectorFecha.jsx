// componentes/comunes/ComponentesSelectorFecha.jsx
// Sub-componentes extraídos de SelectorFecha

import React from "react";
import { NOMBRES_MESES, NOMBRES_MESES_CORTOS, NOMBRES_DIAS, esDiaEnRango, esHoy, esDiaDeshabilitado, compararFechas, formatearFechaDisplay } from "./selectorFechaUtils";

export const HeaderCalendario = ({ vistaActual, mesActual, decada, onNavAnterior, onNavSiguiente, onCambiarVista }) => {
   if (vistaActual === "dias") {
      return (
         <div className="selector-fecha-header">
            <button type="button" className="selector-fecha-nav" onClick={onNavAnterior}>◀</button>
            <button type="button" className="selector-fecha-titulo" onClick={() => onCambiarVista("meses")}>
               {NOMBRES_MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
            </button>
            <button type="button" className="selector-fecha-nav" onClick={onNavSiguiente}>▶</button>
         </div>
      );
   }
   if (vistaActual === "meses") {
      return (
         <div className="selector-fecha-header">
            <button type="button" className="selector-fecha-nav" onClick={onNavAnterior}>◀</button>
            <button type="button" className="selector-fecha-titulo" onClick={() => onCambiarVista("anios")}>{mesActual.getFullYear()}</button>
            <button type="button" className="selector-fecha-nav" onClick={onNavSiguiente}>▶</button>
         </div>
      );
   }
   return (
      <div className="selector-fecha-header">
         <button type="button" className="selector-fecha-nav" onClick={onNavAnterior}>◀</button>
         <span className="selector-fecha-titulo selector-fecha-titulo--no-click">{decada.inicio} - {decada.fin}</span>
         <button type="button" className="selector-fecha-nav" onClick={onNavSiguiente}>▶</button>
      </div>
   );
};

export const VistaDias = ({ dias, value, valueHasta, modoRango, minDate, maxDate, onSeleccionarDia }) => (
   <>
      <div className="selector-fecha-dias-semana">
         {NOMBRES_DIAS.map((nombre) => <span key={nombre} className="selector-fecha-dia-semana">{nombre}</span>)}
      </div>
      <div className="selector-fecha-grilla">
         {dias.map((dia, index) => {
            const seleccionado = value && compararFechas(dia.fecha, value) === 0;
            const esHasta = valueHasta && compararFechas(dia.fecha, valueHasta) === 0;
            const deshabilitado = esDiaDeshabilitado(dia, minDate, maxDate);
            return (
               <button
                  key={index} type="button" onClick={() => onSeleccionarDia(dia)} disabled={deshabilitado}
                  className={`selector-fecha-dia ${!dia.mesActual ? "selector-fecha-dia--otro-mes" : ""} ${seleccionado ? "selector-fecha-dia--desde" : ""} ${esHasta ? "selector-fecha-dia--hasta" : ""} ${esDiaEnRango(dia, modoRango, value, valueHasta) ? "selector-fecha-dia--en-rango" : ""} ${esHoy(dia) ? "selector-fecha-dia--hoy" : ""} ${deshabilitado ? "selector-fecha-dia--deshabilitado" : ""}`}
               >
                  {dia.dia}
               </button>
            );
         })}
      </div>
   </>
);

export const VistaMeses = ({ mesActual, onSeleccionarMes }) => {
   const hoy = new Date();
   return (
      <div className="selector-fecha-grilla-meses">
         {NOMBRES_MESES_CORTOS.map((nombre, index) => (
            <button
               key={index} type="button" onClick={() => onSeleccionarMes(index)}
               className={`selector-fecha-mes-item ${index === hoy.getMonth() && mesActual.getFullYear() === hoy.getFullYear() ? "selector-fecha-mes-item--actual" : ""} ${mesActual.getMonth() === index ? "selector-fecha-mes-item--seleccionado" : ""}`}
            >
               {nombre}
            </button>
         ))}
      </div>
   );
};

export const VistaAnios = ({ mesActual, decada, onSeleccionarAnio }) => {
   const anioActual = new Date().getFullYear();
   const anios = [];
   for (let i = decada.inicio; i <= decada.fin; i++) anios.push(i);
   return (
      <div className="selector-fecha-grilla-anios">
         {anios.map((year) => (
            <button
               key={year} type="button" onClick={() => onSeleccionarAnio(year)}
               className={`selector-fecha-anio-item ${year === anioActual ? "selector-fecha-anio-item--actual" : ""} ${mesActual.getFullYear() === year ? "selector-fecha-anio-item--seleccionado" : ""}`}
            >
               {year}
            </button>
         ))}
      </div>
   );
};

export const IndicadorRango = ({ value, valueHasta, tieneSeleccion, onLimpiar }) => (
   <div className="selector-fecha-modo">
      <div className="selector-fecha-modo-contenido">
         {!value ? (
            <span className="selector-fecha-instruccion">Selecciona fecha inicial</span>
         ) : !valueHasta ? (
            <span className="selector-fecha-instruccion selector-fecha-instruccion--activo">
               <span className="selector-fecha-desde-badge">{formatearFechaDisplay(value)}</span>
               → Selecciona fecha final
            </span>
         ) : (
            <span className="selector-fecha-instruccion selector-fecha-instruccion--completo">
               <span className="selector-fecha-desde-badge">{formatearFechaDisplay(value)}</span>
               →
               <span className="selector-fecha-hasta-badge">{formatearFechaDisplay(valueHasta)}</span>
            </span>
         )}
      </div>
      {tieneSeleccion && (
         <button type="button" className="selector-fecha-limpiar-mini" onClick={onLimpiar} title="Limpiar selección">Limpiar</button>
      )}
   </div>
);
