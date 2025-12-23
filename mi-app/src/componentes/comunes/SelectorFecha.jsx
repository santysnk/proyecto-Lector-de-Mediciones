/**
 * Componente SelectorFecha - DatePicker modular reutilizable
 * Soporta selección de día único o rango de fechas
 * Navegación drill-down: días → meses → años
 *
 * Modo rango:
 * - Primer click: selecciona "desde"
 * - Segundo click: selecciona "hasta" (si es después del desde) o nuevo "desde" (si es antes)
 * - Los días entre ambos se marcan con color de fondo
 */

import { useState, useRef, useEffect } from "react";
import "./SelectorFecha.css";

const SelectorFecha = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className = "",
  // Nuevas props para modo rango
  modoRango = false,
  valueHasta = null,
  onChangeRango = null, // (desde, hasta) => void
}) => {
  const [abierto, setAbierto] = useState(false);
  const [mesActual, setMesActual] = useState(() => {
    const fecha = value ? new Date(value) : new Date();
    return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  });
  // Vista actual: "dias" | "meses" | "anios"
  const [vistaActual, setVistaActual] = useState("dias");
  // Para modo rango: guardamos temporalmente el "desde" mientras se selecciona el "hasta"
  const [seleccionandoRango, setSeleccionandoRango] = useState(false);
  const contenedorRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
        setVistaActual("dias");
        // Si estaba seleccionando rango y cierra, mantener solo el desde
        if (seleccionandoRango && value && !valueHasta) {
          setSeleccionandoRango(false);
        }
      }
    };

    if (abierto) {
      document.addEventListener("mousedown", handleClickFuera);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickFuera);
    };
  }, [abierto, seleccionandoRango, value, valueHasta]);

  // Actualizar mes cuando cambia el valor
  useEffect(() => {
    if (value) {
      const fecha = new Date(value);
      setMesActual(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
    }
  }, [value]);

  // Reset vista cuando se abre
  useEffect(() => {
    if (abierto) {
      setVistaActual("dias");
    }
  }, [abierto]);

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const nombresMesesCortos = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  const nombresDias = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

  const obtenerDiasMes = (fecha) => {
    const year = fecha.getFullYear();
    const month = fecha.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay();

    const dias = [];

    // Días del mes anterior
    const mesAnterior = new Date(year, month, 0);
    const diasMesAnterior = mesAnterior.getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      dias.push({
        dia: diasMesAnterior - i,
        mesActual: false,
        fecha: new Date(year, month - 1, diasMesAnterior - i),
      });
    }

    // Días del mes actual
    for (let i = 1; i <= diasEnMes; i++) {
      dias.push({
        dia: i,
        mesActual: true,
        fecha: new Date(year, month, i),
      });
    }

    // Días del mes siguiente para completar la última fila (solo si es necesario)
    const diasEnUltimaFila = dias.length % 7;
    if (diasEnUltimaFila > 0) {
      const diasRestantes = 7 - diasEnUltimaFila;
      for (let i = 1; i <= diasRestantes; i++) {
        dias.push({
          dia: i,
          mesActual: false,
          fecha: new Date(year, month + 1, i),
        });
      }
    }

    return dias;
  };

  // Obtener década actual (ej: 2020-2029)
  const obtenerDecada = (year) => {
    const inicio = Math.floor(year / 10) * 10;
    return { inicio, fin: inicio + 9 };
  };

  const irMesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1));
  };

  const irMesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));
  };

  const irAnioAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear() - 1, mesActual.getMonth(), 1));
  };

  const irAnioSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear() + 1, mesActual.getMonth(), 1));
  };

  const irDecadaAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear() - 10, mesActual.getMonth(), 1));
  };

  const irDecadaSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear() + 10, mesActual.getMonth(), 1));
  };

  const seleccionarMes = (mesIndex) => {
    setMesActual(new Date(mesActual.getFullYear(), mesIndex, 1));
    setVistaActual("dias");
  };

  const seleccionarAnio = (year) => {
    setMesActual(new Date(year, mesActual.getMonth(), 1));
    setVistaActual("meses");
  };

  const normalizarFecha = (fecha) => {
    const d = new Date(fecha);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const compararFechas = (fecha1, fecha2) => {
    const d1 = normalizarFecha(fecha1);
    const d2 = normalizarFecha(fecha2);
    return d1.getTime() - d2.getTime();
  };

  const seleccionarDia = (dia) => {
    if (disabled) return;

    const fechaSeleccionada = dia.fecha;

    // Validar min/max
    if (minDate && fechaSeleccionada < new Date(minDate)) return;
    if (maxDate && fechaSeleccionada > new Date(maxDate)) return;

    if (modoRango && onChangeRango) {
      // Modo rango
      if (!value || (value && valueHasta)) {
        // No hay desde, o ya hay rango completo: empezar nuevo rango
        onChangeRango(fechaSeleccionada, null);
        setSeleccionandoRango(true);
      } else if (value && !valueHasta) {
        // Ya hay desde, seleccionar hasta
        const desde = new Date(value);
        if (compararFechas(fechaSeleccionada, desde) < 0) {
          // Click en fecha anterior al desde: usar como nuevo desde
          onChangeRango(fechaSeleccionada, null);
          setSeleccionandoRango(true);
        } else if (compararFechas(fechaSeleccionada, desde) === 0) {
          // Mismo día: selección de día único
          onChangeRango(fechaSeleccionada, fechaSeleccionada);
          setSeleccionandoRango(false);
          setAbierto(false);
        } else {
          // Fecha posterior: completar rango
          onChangeRango(desde, fechaSeleccionada);
          setSeleccionandoRango(false);
          setAbierto(false);
        }
      }
    } else {
      // Modo día único
      onChange(fechaSeleccionada);
      setAbierto(false);
    }
  };

  const esDiaSeleccionado = (dia) => {
    if (!value) return false;
    return compararFechas(dia.fecha, value) === 0;
  };

  const esDiaHasta = (dia) => {
    if (!valueHasta) return false;
    return compararFechas(dia.fecha, valueHasta) === 0;
  };

  const esDiaEnRango = (dia) => {
    if (!modoRango || !value || !valueHasta) return false;
    const fechaDia = normalizarFecha(dia.fecha);
    const desde = normalizarFecha(value);
    const hasta = normalizarFecha(valueHasta);
    return fechaDia > desde && fechaDia < hasta;
  };

  const esHoy = (dia) => {
    const hoy = new Date();
    return (
      dia.fecha.getDate() === hoy.getDate() &&
      dia.fecha.getMonth() === hoy.getMonth() &&
      dia.fecha.getFullYear() === hoy.getFullYear()
    );
  };

  const esDiaDeshabilitado = (dia) => {
    if (minDate && dia.fecha < new Date(minDate)) return true;
    if (maxDate && dia.fecha > new Date(maxDate)) return true;
    return false;
  };

  const esMesActual = (mesIndex) => {
    const hoy = new Date();
    return mesIndex === hoy.getMonth() && mesActual.getFullYear() === hoy.getFullYear();
  };

  const esAnioActual = (year) => {
    return year === new Date().getFullYear();
  };

  const formatearFechaDisplay = (fecha) => {
    if (!fecha) return "";
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, "0");
    const mes = (d.getMonth() + 1).toString().padStart(2, "0");
    const anio = d.getFullYear().toString().slice(-2);
    return `${dia}/${mes}/${anio}`;
  };

  const obtenerTextoBoton = () => {
    if (modoRango) {
      if (value && valueHasta) {
        if (compararFechas(value, valueHasta) === 0) {
          return formatearFechaDisplay(value);
        }
        return `${formatearFechaDisplay(value)} - ${formatearFechaDisplay(valueHasta)}`;
      }
      if (value && !valueHasta) {
        return `${formatearFechaDisplay(value)} - ...`;
      }
    } else if (value) {
      return formatearFechaDisplay(value);
    }
    return placeholder;
  };

  const limpiarSeleccion = () => {
    if (modoRango && onChangeRango) {
      onChangeRango(null, null);
    } else {
      onChange(null);
    }
    setSeleccionandoRango(false);
    setAbierto(false);
  };

  const tieneSeleccion = modoRango ? (value || valueHasta) : value;

  const dias = obtenerDiasMes(mesActual);
  const decada = obtenerDecada(mesActual.getFullYear());

  // Renderizar header según vista
  const renderHeader = () => {
    if (vistaActual === "dias") {
      return (
        <div className="selector-fecha-header">
          <button type="button" className="selector-fecha-nav" onClick={irMesAnterior}>
            ◀
          </button>
          <button
            type="button"
            className="selector-fecha-titulo"
            onClick={() => setVistaActual("meses")}
          >
            {nombresMeses[mesActual.getMonth()]} {mesActual.getFullYear()}
          </button>
          <button type="button" className="selector-fecha-nav" onClick={irMesSiguiente}>
            ▶
          </button>
        </div>
      );
    }

    if (vistaActual === "meses") {
      return (
        <div className="selector-fecha-header">
          <button type="button" className="selector-fecha-nav" onClick={irAnioAnterior}>
            ◀
          </button>
          <button
            type="button"
            className="selector-fecha-titulo"
            onClick={() => setVistaActual("anios")}
          >
            {mesActual.getFullYear()}
          </button>
          <button type="button" className="selector-fecha-nav" onClick={irAnioSiguiente}>
            ▶
          </button>
        </div>
      );
    }

    // Vista años
    return (
      <div className="selector-fecha-header">
        <button type="button" className="selector-fecha-nav" onClick={irDecadaAnterior}>
          ◀
        </button>
        <span className="selector-fecha-titulo selector-fecha-titulo--no-click">
          {decada.inicio} - {decada.fin}
        </span>
        <button type="button" className="selector-fecha-nav" onClick={irDecadaSiguiente}>
          ▶
        </button>
      </div>
    );
  };

  // Renderizar contenido según vista
  const renderContenido = () => {
    if (vistaActual === "dias") {
      return (
        <>
          <div className="selector-fecha-dias-semana">
            {nombresDias.map((nombre) => (
              <span key={nombre} className="selector-fecha-dia-semana">
                {nombre}
              </span>
            ))}
          </div>
          <div className="selector-fecha-grilla">
            {dias.map((dia, index) => (
              <button
                key={index}
                type="button"
                className={`selector-fecha-dia ${
                  !dia.mesActual ? "selector-fecha-dia--otro-mes" : ""
                } ${esDiaSeleccionado(dia) ? "selector-fecha-dia--desde" : ""} ${
                  esDiaHasta(dia) ? "selector-fecha-dia--hasta" : ""
                } ${esDiaEnRango(dia) ? "selector-fecha-dia--en-rango" : ""} ${
                  esHoy(dia) ? "selector-fecha-dia--hoy" : ""
                } ${esDiaDeshabilitado(dia) ? "selector-fecha-dia--deshabilitado" : ""}`}
                onClick={() => seleccionarDia(dia)}
                disabled={esDiaDeshabilitado(dia)}
              >
                {dia.dia}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (vistaActual === "meses") {
      return (
        <div className="selector-fecha-grilla-meses">
          {nombresMesesCortos.map((nombre, index) => (
            <button
              key={index}
              type="button"
              className={`selector-fecha-mes-item ${
                esMesActual(index) ? "selector-fecha-mes-item--actual" : ""
              } ${
                mesActual.getMonth() === index ? "selector-fecha-mes-item--seleccionado" : ""
              }`}
              onClick={() => seleccionarMes(index)}
            >
              {nombre}
            </button>
          ))}
        </div>
      );
    }

    // Vista años
    const anios = [];
    for (let i = decada.inicio; i <= decada.fin; i++) {
      anios.push(i);
    }

    return (
      <div className="selector-fecha-grilla-anios">
        {anios.map((year) => (
          <button
            key={year}
            type="button"
            className={`selector-fecha-anio-item ${
              esAnioActual(year) ? "selector-fecha-anio-item--actual" : ""
            } ${
              mesActual.getFullYear() === year ? "selector-fecha-anio-item--seleccionado" : ""
            }`}
            onClick={() => seleccionarAnio(year)}
          >
            {year}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`selector-fecha ${className}`} ref={contenedorRef}>
      <button
        type="button"
        className={`selector-fecha-btn ${abierto ? "selector-fecha-btn--activo" : ""} ${disabled ? "selector-fecha-btn--disabled" : ""} ${tieneSeleccion ? "selector-fecha-btn--con-valor" : ""}`}
        onClick={() => !disabled && setAbierto(!abierto)}
        disabled={disabled}
        title={obtenerTextoBoton()}
      >
        <span className="selector-fecha-icono">📅</span>
      </button>

      {abierto && (
        <div className="selector-fecha-dropdown">
          {/* Indicador de modo rango */}
          {modoRango && (
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
                <button
                  type="button"
                  className="selector-fecha-limpiar-mini"
                  onClick={limpiarSeleccion}
                  title="Limpiar selección"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}

          {renderHeader()}
          {renderContenido()}

          {/* Footer solo para modo simple (no rango) */}
          {!modoRango && tieneSeleccion && vistaActual === "dias" && (
            <div className="selector-fecha-footer">
              <button
                type="button"
                className="selector-fecha-limpiar"
                onClick={limpiarSeleccion}
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectorFecha;
