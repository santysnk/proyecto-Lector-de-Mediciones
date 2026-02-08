// componentes/comunes/selectorFechaUtils.js
// Funciones puras y constantes extraídas de SelectorFecha

export const NOMBRES_MESES = [
   "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
   "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const NOMBRES_MESES_CORTOS = [
   "Ene", "Feb", "Mar", "Abr", "May", "Jun",
   "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export const NOMBRES_DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

export function obtenerDiasMes(fecha) {
   const year = fecha.getFullYear();
   const month = fecha.getMonth();
   const primerDia = new Date(year, month, 1);
   const ultimoDia = new Date(year, month + 1, 0);
   const diasEnMes = ultimoDia.getDate();
   const diaSemanaInicio = primerDia.getDay();
   const dias = [];

   const mesAnterior = new Date(year, month, 0);
   const diasMesAnterior = mesAnterior.getDate();
   for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      dias.push({ dia: diasMesAnterior - i, mesActual: false, fecha: new Date(year, month - 1, diasMesAnterior - i) });
   }
   for (let i = 1; i <= diasEnMes; i++) {
      dias.push({ dia: i, mesActual: true, fecha: new Date(year, month, i) });
   }
   const diasEnUltimaFila = dias.length % 7;
   if (diasEnUltimaFila > 0) {
      const diasRestantes = 7 - diasEnUltimaFila;
      for (let i = 1; i <= diasRestantes; i++) {
         dias.push({ dia: i, mesActual: false, fecha: new Date(year, month + 1, i) });
      }
   }
   return dias;
}

export function obtenerDecada(year) {
   const inicio = Math.floor(year / 10) * 10;
   return { inicio, fin: inicio + 9 };
}

export function normalizarFecha(fecha) {
   const d = new Date(fecha);
   return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function compararFechas(fecha1, fecha2) {
   return normalizarFecha(fecha1).getTime() - normalizarFecha(fecha2).getTime();
}

export function formatearFechaDisplay(fecha) {
   if (!fecha) return "";
   const d = new Date(fecha);
   const dia = d.getDate().toString().padStart(2, "0");
   const mes = (d.getMonth() + 1).toString().padStart(2, "0");
   const anio = d.getFullYear().toString().slice(-2);
   return `${dia}/${mes}/${anio}`;
}

export function esDiaEnRango(dia, modoRango, value, valueHasta) {
   if (!modoRango || !value || !valueHasta) return false;
   const fechaDia = normalizarFecha(dia.fecha);
   return fechaDia > normalizarFecha(value) && fechaDia < normalizarFecha(valueHasta);
}

export function esHoy(dia) {
   const hoy = new Date();
   return dia.fecha.getDate() === hoy.getDate() && dia.fecha.getMonth() === hoy.getMonth() && dia.fecha.getFullYear() === hoy.getFullYear();
}

export function esDiaDeshabilitado(dia, minDate, maxDate) {
   if (minDate && dia.fecha < new Date(minDate)) return true;
   if (maxDate && dia.fecha > new Date(maxDate)) return true;
   return false;
}

export function obtenerTextoBoton(modoRango, value, valueHasta, placeholder) {
   if (modoRango) {
      if (value && valueHasta) {
         return compararFechas(value, valueHasta) === 0 ? formatearFechaDisplay(value) : `${formatearFechaDisplay(value)} - ${formatearFechaDisplay(valueHasta)}`;
      }
      if (value && !valueHasta) return `${formatearFechaDisplay(value)} - ...`;
   } else if (value) {
      return formatearFechaDisplay(value);
   }
   return placeholder;
}
