// componentes/comunes/SelectorFecha.jsx
// DatePicker modular: día único o rango, drill-down días → meses → años

import { useState, useRef, useEffect } from "react";
import { obtenerDiasMes, obtenerDecada, compararFechas, obtenerTextoBoton } from "./selectorFechaUtils";
import { HeaderCalendario, VistaDias, VistaMeses, VistaAnios, IndicadorRango } from "./ComponentesSelectorFecha";
import "./SelectorFecha.css";

const SelectorFecha = ({
   value, onChange, minDate, maxDate, placeholder = "Seleccionar fecha",
   disabled = false, className = "", modoRango = false, valueHasta = null, onChangeRango = null,
}) => {
   const [abierto, setAbierto] = useState(false);
   const [mesActual, setMesActual] = useState(() => {
      const fecha = value ? new Date(value) : new Date();
      return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
   });
   const [vistaActual, setVistaActual] = useState("dias");
   const [seleccionandoRango, setSeleccionandoRango] = useState(false);
   const contenedorRef = useRef(null);

   useEffect(() => {
      const handleClickFuera = (e) => {
         if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
            setAbierto(false); setVistaActual("dias");
            if (seleccionandoRango && value && !valueHasta) setSeleccionandoRango(false);
         }
      };
      if (abierto) document.addEventListener("mousedown", handleClickFuera);
      return () => document.removeEventListener("mousedown", handleClickFuera);
   }, [abierto, seleccionandoRango, value, valueHasta]);

   useEffect(() => { if (value) setMesActual(new Date(new Date(value).getFullYear(), new Date(value).getMonth(), 1)); }, [value]);
   useEffect(() => { if (abierto) setVistaActual("dias"); }, [abierto]);

   const navegar = (delta, unidad) => {
      if (unidad === "mes") setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + delta, 1));
      else if (unidad === "anio") setMesActual(new Date(mesActual.getFullYear() + delta, mesActual.getMonth(), 1));
      else setMesActual(new Date(mesActual.getFullYear() + delta * 10, mesActual.getMonth(), 1));
   };

   const seleccionarMes = (mesIndex) => { setMesActual(new Date(mesActual.getFullYear(), mesIndex, 1)); setVistaActual("dias"); };
   const seleccionarAnio = (year) => { setMesActual(new Date(year, mesActual.getMonth(), 1)); setVistaActual("meses"); };

   const seleccionarDia = (dia) => {
      if (disabled) return;
      const fechaSel = dia.fecha;
      if (minDate && fechaSel < new Date(minDate)) return;
      if (maxDate && fechaSel > new Date(maxDate)) return;

      if (modoRango && onChangeRango) {
         if (!value || (value && valueHasta)) {
            onChangeRango(fechaSel, null); setSeleccionandoRango(true);
         } else if (value && !valueHasta) {
            const cmp = compararFechas(fechaSel, value);
            if (cmp < 0) { onChangeRango(fechaSel, null); setSeleccionandoRango(true); }
            else if (cmp === 0) { onChangeRango(fechaSel, fechaSel); setSeleccionandoRango(false); setAbierto(false); }
            else { onChangeRango(new Date(value), fechaSel); setSeleccionandoRango(false); setAbierto(false); }
         }
      } else {
         onChange(fechaSel); setAbierto(false);
      }
   };

   const limpiarSeleccion = () => {
      if (modoRango && onChangeRango) onChangeRango(null, null); else onChange(null);
      setSeleccionandoRango(false); setAbierto(false);
   };

   const tieneSeleccion = modoRango ? (value || valueHasta) : value;
   const dias = obtenerDiasMes(mesActual);
   const decada = obtenerDecada(mesActual.getFullYear());

   const navAnterior = () => navegar(-1, vistaActual === "dias" ? "mes" : vistaActual === "meses" ? "anio" : "decada");
   const navSiguiente = () => navegar(1, vistaActual === "dias" ? "mes" : vistaActual === "meses" ? "anio" : "decada");

   return (
      <div className={`selector-fecha ${className}`} ref={contenedorRef}>
         <button
            type="button" disabled={disabled}
            className={`selector-fecha-btn ${abierto ? "selector-fecha-btn--activo" : ""} ${disabled ? "selector-fecha-btn--disabled" : ""} ${tieneSeleccion ? "selector-fecha-btn--con-valor" : ""}`}
            onClick={() => !disabled && setAbierto(!abierto)}
            title={obtenerTextoBoton(modoRango, value, valueHasta, placeholder)}
         >
            <span className="selector-fecha-icono">📅</span>
         </button>
         {abierto && (
            <div className="selector-fecha-dropdown">
               {modoRango && <IndicadorRango value={value} valueHasta={valueHasta} tieneSeleccion={tieneSeleccion} onLimpiar={limpiarSeleccion} />}
               <HeaderCalendario vistaActual={vistaActual} mesActual={mesActual} decada={decada} onNavAnterior={navAnterior} onNavSiguiente={navSiguiente} onCambiarVista={setVistaActual} />
               {vistaActual === "dias" && <VistaDias dias={dias} value={value} valueHasta={valueHasta} modoRango={modoRango} minDate={minDate} maxDate={maxDate} onSeleccionarDia={seleccionarDia} />}
               {vistaActual === "meses" && <VistaMeses mesActual={mesActual} onSeleccionarMes={seleccionarMes} />}
               {vistaActual === "anios" && <VistaAnios mesActual={mesActual} decada={decada} onSeleccionarAnio={seleccionarAnio} />}
               {!modoRango && tieneSeleccion && vistaActual === "dias" && (
                  <div className="selector-fecha-footer">
                     <button type="button" className="selector-fecha-limpiar" onClick={limpiarSeleccion}>Limpiar</button>
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export default SelectorFecha;
