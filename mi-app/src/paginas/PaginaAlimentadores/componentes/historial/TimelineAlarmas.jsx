/**
 * Componente de visualización timeline para alarmas/estados basados en bits
 * Muestra barras horizontales coloreadas por severidad para cada bit activo
 */

import { useMemo } from "react";
import PropTypes from "prop-types";
import "./TimelineAlarmas.css";

/**
 * Mapeo de severidades a clases CSS
 */
const SEVERIDAD_CLASES = {
   alarma: "timeline-segmento--alarma",
   warning: "timeline-segmento--warning",
   info: "timeline-segmento--info",
   estado: "timeline-segmento--estado",
};

/**
 * Formatea una fecha para mostrar en el tooltip
 * Formato: dd/MM/yy - HH:mm:sshs
 */
const formatearHora = (fecha) => {
   if (!fecha) return "";
   const d = new Date(fecha);
   const dia = String(d.getDate()).padStart(2, "0");
   const mes = String(d.getMonth() + 1).padStart(2, "0");
   const anio = String(d.getFullYear()).slice(-2);
   const hora = String(d.getHours()).padStart(2, "0");
   const minutos = String(d.getMinutes()).padStart(2, "0");
   const segundos = String(d.getSeconds()).padStart(2, "0");
   return `${dia}/${mes}/${anio} - ${hora}:${minutos}:${segundos}hs`;
};

/**
 * Extrae los bits activos de un valor numérico
 * @param {number} valor - Valor con bits
 * @returns {number[]} Array de índices de bits activos
 */
const extraerBitsActivos = (valor) => {
   const bits = [];
   if (valor === null || valor === undefined) return bits;
   for (let i = 0; i < 16; i++) {
      if ((valor >> i) & 1) {
         bits.push(i);
      }
   }
   return bits;
};

/**
 * Procesa los datos para obtener períodos de actividad por cada bit
 * @param {Array} datos - Datos con {x: Date, y: valorBits}
 * @param {Object} etiquetasBits - Configuración de etiquetas por bit
 * @returns {Array} Array de bits con sus períodos
 */
const procesarPeriodosBits = (datos, etiquetasBits) => {
   if (!datos || datos.length === 0) return [];

   // Obtener todos los bits que aparecen en los datos o están definidos en etiquetas
   const bitsEnDatos = new Set();
   datos.forEach((d) => {
      extraerBitsActivos(d.y).forEach((bit) => bitsEnDatos.add(bit));
   });

   // Combinar con bits definidos en etiquetas
   if (etiquetasBits) {
      Object.keys(etiquetasBits).forEach((bit) => bitsEnDatos.add(parseInt(bit, 10)));
   }

   const bitsOrdenados = Array.from(bitsEnDatos).sort((a, b) => a - b);

   // Procesar cada bit - solo incluir bits que tengan etiqueta con texto configurado
   return bitsOrdenados
      .filter((bitIndex) => {
         const config = etiquetasBits?.[bitIndex];
         // Solo incluir si tiene una etiqueta con texto no vacío
         return config?.texto && config.texto.trim() !== "";
      })
      .map((bitIndex) => {
         const config = etiquetasBits[bitIndex];
         const nombre = config.texto;
         const severidad = config.severidad || "estado";

      // Encontrar períodos donde este bit está activo
      const periodos = [];
      let periodoActual = null;

      for (let i = 0; i < datos.length; i++) {
         const dato = datos[i];
         const bitActivo = (dato.y >> bitIndex) & 1;

         if (bitActivo && !periodoActual) {
            // Inicio de período
            periodoActual = { inicio: dato.x, fin: dato.x };
         } else if (bitActivo && periodoActual) {
            // Continuar período
            periodoActual.fin = dato.x;
         } else if (!bitActivo && periodoActual) {
            // Fin de período
            periodos.push(periodoActual);
            periodoActual = null;
         }
      }

      // Cerrar período si quedó abierto
      if (periodoActual) {
         periodos.push(periodoActual);
      }

      return {
         indice: bitIndex,
         nombre,
         severidad,
         periodos,
         tieneActividad: periodos.length > 0,
      };
   });
};

/**
 * Calcula la posición y ancho de un segmento en porcentaje
 */
const calcularPosicionSegmento = (periodo, rangoInicio, rangoFin) => {
   const rangoTotalMs = rangoFin.getTime() - rangoInicio.getTime();
   if (rangoTotalMs <= 0) return { left: "0%", width: "0%" };

   const inicioMs = new Date(periodo.inicio).getTime() - rangoInicio.getTime();
   const duracionMs = new Date(periodo.fin).getTime() - new Date(periodo.inicio).getTime();

   const left = (inicioMs / rangoTotalMs) * 100;
   const width = Math.max((duracionMs / rangoTotalMs) * 100, 0.5); // Mínimo 0.5% para visibilidad

   return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(width, 100 - left)}%`,
   };
};

/**
 * Genera las marcas de tiempo para el eje X
 */
const generarMarcasTiempo = (rangoInicio, rangoFin) => {
   const marcas = [];
   const rangoMs = rangoFin.getTime() - rangoInicio.getTime();
   const numMarcas = 6;

   for (let i = 0; i <= numMarcas; i++) {
      const timestamp = rangoInicio.getTime() + (rangoMs * i) / numMarcas;
      const fecha = new Date(timestamp);
      marcas.push({
         posicion: `${(i / numMarcas) * 100}%`,
         etiqueta: fecha.toLocaleString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
         }),
      });
   }

   return marcas;
};

const TimelineAlarmas = ({ datos, etiquetasBits, rangoInicio, rangoFin }) => {
   // Calcular rango efectivo si no se proporciona
   const rangoEfectivo = useMemo(() => {
      if (rangoInicio && rangoFin) {
         return { inicio: rangoInicio, fin: rangoFin };
      }
      if (!datos || datos.length === 0) {
         const ahora = new Date();
         return { inicio: new Date(ahora.getTime() - 24 * 60 * 60 * 1000), fin: ahora };
      }
      const timestamps = datos.map((d) => new Date(d.x).getTime());
      return {
         inicio: new Date(Math.min(...timestamps)),
         fin: new Date(Math.max(...timestamps)),
      };
   }, [datos, rangoInicio, rangoFin]);

   // Procesar bits y períodos
   const bitsConPeriodos = useMemo(
      () => procesarPeriodosBits(datos, etiquetasBits),
      [datos, etiquetasBits]
   );

   // Filtrar solo bits con actividad
   const bitsConActividad = useMemo(
      () => bitsConPeriodos.filter((b) => b.tieneActividad),
      [bitsConPeriodos]
   );

   // Marcas de tiempo para el eje
   const marcasTiempo = useMemo(
      () => generarMarcasTiempo(rangoEfectivo.inicio, rangoEfectivo.fin),
      [rangoEfectivo]
   );

   if (!datos || datos.length === 0) {
      return (
         <div className="timeline-alarmas timeline-alarmas--vacio">
            <p>No hay datos de alarmas en este período</p>
         </div>
      );
   }

   if (bitsConActividad.length === 0) {
      return (
         <div className="timeline-alarmas timeline-alarmas--sin-alarmas">
            <p>Sin alarmas activas en este período</p>
         </div>
      );
   }

   return (
      <div className="timeline-alarmas">
         {/* Leyenda de severidades */}
         <div className="timeline-leyenda">
            <span className="timeline-leyenda-item timeline-leyenda-item--alarma">Alarma</span>
            <span className="timeline-leyenda-item timeline-leyenda-item--warning">Warning</span>
            <span className="timeline-leyenda-item timeline-leyenda-item--info">Info</span>
            <span className="timeline-leyenda-item timeline-leyenda-item--estado">Estado</span>
         </div>

         {/* Contenedor de filas */}
         <div className="timeline-filas">
            {bitsConActividad.map((bit) => (
               <div className="timeline-fila" key={bit.indice}>
                  <span className="timeline-etiqueta" title={bit.nombre}>
                     {bit.nombre}
                  </span>
                  <div className="timeline-barra">
                     {bit.periodos.map((periodo, idx) => {
                        const posicion = calcularPosicionSegmento(
                           periodo,
                           rangoEfectivo.inicio,
                           rangoEfectivo.fin
                        );
                        return (
                           <div
                              key={idx}
                              className={`timeline-segmento ${SEVERIDAD_CLASES[bit.severidad] || SEVERIDAD_CLASES.estado}`}
                              style={{ left: posicion.left, width: posicion.width }}
                              title={`${formatearHora(periodo.inicio)} - ${formatearHora(periodo.fin)}`}
                           />
                        );
                     })}
                  </div>
               </div>
            ))}
         </div>

         {/* Eje de tiempo */}
         <div className="timeline-eje-tiempo">
            {marcasTiempo.map((marca, idx) => (
               <span
                  key={idx}
                  className="timeline-marca-tiempo"
                  style={{ left: marca.posicion }}
               >
                  {marca.etiqueta}
               </span>
            ))}
         </div>
      </div>
   );
};

TimelineAlarmas.propTypes = {
   datos: PropTypes.arrayOf(
      PropTypes.shape({
         x: PropTypes.instanceOf(Date).isRequired,
         y: PropTypes.number.isRequired,
      })
   ).isRequired,
   etiquetasBits: PropTypes.objectOf(
      PropTypes.shape({
         texto: PropTypes.string,
         severidad: PropTypes.oneOf(["alarma", "warning", "info", "estado"]),
      })
   ),
   rangoInicio: PropTypes.instanceOf(Date),
   rangoFin: PropTypes.instanceOf(Date),
};

TimelineAlarmas.defaultProps = {
   etiquetasBits: {},
   rangoInicio: null,
   rangoFin: null,
};

export default TimelineAlarmas;
