// componentes/modales/lectura-completa/ComponentesMedicion.jsx
// Componentes de medición: tabla de valores, indicador LED, utilidades

import { formatearValor } from "../../../utilidades/calculosFormulas";

/**
 * Infiere la unidad de medida basándose en el nombre de la funcionalidad
 */
export const inferirUnidad = (nombreFuncionalidad) => {
   if (!nombreFuncionalidad) return { unidad: "", sinDecimales: false };
   const nombre = nombreFuncionalidad.toLowerCase();

   if (nombre.includes("factor") || nombre.includes("fp") || nombre.includes("pf") || nombre.includes("cos")) {
      return { unidad: "", sinDecimales: false };
   }
   if (nombre.includes("corriente") || nombre.includes("current")) {
      return { unidad: "A", sinDecimales: false };
   }
   if (nombre.includes("tensión") || nombre.includes("tension") || nombre.includes("voltage")) {
      return { unidad: "kV", sinDecimales: false };
   }
   if (nombre.includes("potencia activa") || nombre.includes("active power") || nombre.includes(" p")) {
      return { unidad: "kW", sinDecimales: true };
   }
   if (nombre.includes("potencia reactiva") || nombre.includes("reactive power") || nombre.includes(" q")) {
      return { unidad: "kVAr", sinDecimales: true };
   }
   if (nombre.includes("potencia aparente") || nombre.includes("apparent power") || nombre.includes(" s")) {
      return { unidad: "kVA", sinDecimales: true };
   }
   if (nombre.includes("frecuencia") || nombre.includes("frequency")) {
      return { unidad: "Hz", sinDecimales: false };
   }
   if (nombre.includes("energía") || nombre.includes("energia") || nombre.includes("energy")) {
      if (nombre.includes("reactiva")) return { unidad: "kVArh", sinDecimales: false };
      return { unidad: "kWh", sinDecimales: false };
   }

   return { unidad: "", sinDecimales: false };
};

/**
 * Aplica la fórmula del transformador a un valor
 */
export const aplicarTransformador = (valor, transformadorId, obtenerTransformador) => {
   if (valor === null || valor === undefined) return null;
   if (!transformadorId || !obtenerTransformador) return valor;

   const transformador = obtenerTransformador(transformadorId);
   if (!transformador?.formula) return valor;

   try {
      const x = Number(valor);
      if (Number.isNaN(x)) return null;
      // eslint-disable-next-line no-new-func
      return new Function("x", `return ${transformador.formula}`)(x);
   } catch {
      return valor;
   }
};

/**
 * Indicador LED visual
 */
export const IndicadorLED = ({ activo, tipo, nombre, descripcion }) => {
   const claseBase = "modal-lectura-led";
   const claseTipo = `modal-lectura-led--${tipo || "info"}`;
   const claseActivo = activo ? "modal-lectura-led--activo" : "modal-lectura-led--inactivo";
   const claseParpadeo = activo && (tipo === "alarma" || tipo === "error") ? "modal-lectura-led--parpadeo" : "";

   return (
      <div
         className={`${claseBase} ${claseTipo} ${claseActivo} ${claseParpadeo}`}
         title={descripcion || nombre}
      >
         <span className="modal-lectura-led-icon">{activo ? "●" : "○"}</span>
         <span className="modal-lectura-led-nombre">{nombre}</span>
      </div>
   );
};

/**
 * Contenedor unificado de mediciones con tabla horizontal
 */
export const ContenedorMediciones = ({ mediciones, obtenerTransformador }) => {
   if (mediciones.length === 0) {
      return null;
   }

   return (
      <div className="modal-lectura-seccion">
         <h3 className="modal-lectura-seccion-titulo">Mediciones</h3>
         <table className="modal-lectura-tabla-horizontal">
            <tbody>
               {mediciones.map((func) => {
                  if (!func.registros || func.registros.length === 0) return null;

                  const { unidad, sinDecimales } = inferirUnidad(func.nombre);

                  return (
                     <tr key={func.id || func.nombre} className="modal-lectura-fila">
                        <td className="modal-lectura-celda-nombre">{func.nombre}</td>
                        {func.registros.map((reg, idx) => {
                           const valorTransformado = aplicarTransformador(reg.valor, reg.transformadorId, obtenerTransformador);
                           let valorFormateado = "--";
                           if (valorTransformado !== null) {
                              valorFormateado = sinDecimales
                                 ? Math.round(valorTransformado).toLocaleString("es-AR")
                                 : formatearValor(valorTransformado);
                           }

                           let etiquetaMostrar = reg.etiqueta;
                           const etiquetaLower = (reg.etiqueta || "").toLowerCase();
                           if (etiquetaLower.includes("potencia aparente") || etiquetaLower.includes("(s)")) {
                              etiquetaMostrar = "(S)";
                           } else if (etiquetaLower.includes("potencia activa") || etiquetaLower.includes("(p)")) {
                              etiquetaMostrar = "(P)";
                           } else if (etiquetaLower.includes("potencia reactiva") || etiquetaLower.includes("(q)")) {
                              etiquetaMostrar = "(Q)";
                           }

                           const esEtiquetaLarga = etiquetaMostrar && etiquetaMostrar.length > 16;

                           return (
                              <td key={`${func.id}-${idx}`} className={`modal-lectura-celda-valor ${esEtiquetaLarga ? 'modal-lectura-celda-valor--vertical' : ''}`}>
                                 {esEtiquetaLarga ? (
                                    <>
                                       <span className="modal-lectura-etiqueta-arriba">{etiquetaMostrar}</span>
                                       <span className="modal-lectura-valor">
                                          {valorFormateado}
                                          {unidad && valorTransformado !== null && (
                                             <span className="modal-lectura-unidad"> {unidad}</span>
                                          )}
                                       </span>
                                    </>
                                 ) : (
                                    <>
                                       <span className="modal-lectura-etiqueta">{etiquetaMostrar}</span>
                                       <span className="modal-lectura-dos-puntos">:</span>
                                       <span className="modal-lectura-valor">
                                          {valorFormateado}
                                          {unidad && valorTransformado !== null && (
                                             <span className="modal-lectura-unidad"> {unidad}</span>
                                          )}
                                       </span>
                                    </>
                                 )}
                              </td>
                           );
                        })}
                     </tr>
                  );
               })}
            </tbody>
         </table>
      </div>
   );
};
