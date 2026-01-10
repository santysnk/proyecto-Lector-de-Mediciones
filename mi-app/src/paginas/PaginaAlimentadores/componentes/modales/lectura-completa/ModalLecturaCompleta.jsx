// componentes/modales/lectura-completa/ModalLecturaCompleta.jsx
// Modal para mostrar todos los datos de una lectura expandida

import { createPortal } from "react-dom";
import { formatearValor } from "../../../utilidades/calculosFormulas";
import "./ModalLecturaCompleta.css";

/**
 * Componente de indicador LED visual
 * @param {Object} props
 * @param {boolean} props.activo - Si el LED está activo
 * @param {string} props.tipo - Tipo de severidad (info, estado, warning, alarma, error)
 * @param {string} props.nombre - Nombre del estado
 * @param {string} props.descripcion - Descripción del estado
 */
const IndicadorLED = ({ activo, tipo, nombre, descripcion }) => {
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
 * Infiere la unidad de medida basándose en el nombre de la funcionalidad
 * @param {string} nombreFuncionalidad - Nombre de la funcionalidad
 * @returns {{ unidad: string, sinDecimales: boolean }} Unidad de medida y si debe mostrarse sin decimales
 */
const inferirUnidad = (nombreFuncionalidad) => {
   if (!nombreFuncionalidad) return { unidad: "", sinDecimales: false };
   const nombre = nombreFuncionalidad.toLowerCase();

   // Factor de potencia - sin unidad (verificar primero para evitar conflictos)
   if (nombre.includes("factor") || nombre.includes("fp") || nombre.includes("pf") || nombre.includes("cos")) {
      return { unidad: "", sinDecimales: false };
   }

   // Corrientes - en Amperes
   if (nombre.includes("corriente") || nombre.includes("current")) {
      return { unidad: "A", sinDecimales: false };
   }

   // Tensiones - siempre en kV
   if (nombre.includes("tensión") || nombre.includes("tension") || nombre.includes("voltage")) {
      return { unidad: "kV", sinDecimales: false };
   }

   // Potencias - sin decimales
   if (nombre.includes("potencia activa") || nombre.includes("active power") || nombre.includes(" p")) {
      return { unidad: "kW", sinDecimales: true };
   }
   if (nombre.includes("potencia reactiva") || nombre.includes("reactive power") || nombre.includes(" q")) {
      return { unidad: "kVAr", sinDecimales: true };
   }
   if (nombre.includes("potencia aparente") || nombre.includes("apparent power") || nombre.includes(" s")) {
      return { unidad: "kVA", sinDecimales: true };
   }

   // Frecuencia
   if (nombre.includes("frecuencia") || nombre.includes("frequency")) {
      return { unidad: "Hz", sinDecimales: false };
   }

   // Energía
   if (nombre.includes("energía") || nombre.includes("energia") || nombre.includes("energy")) {
      if (nombre.includes("reactiva")) return { unidad: "kVArh", sinDecimales: false };
      return { unidad: "kWh", sinDecimales: false };
   }

   return { unidad: "", sinDecimales: false };
};

/**
 * Aplica la fórmula del transformador a un valor
 */
const aplicarTransformador = (valor, transformadorId, obtenerTransformador) => {
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
 * Contenedor unificado de mediciones con tabla horizontal (etiquetas como columnas)
 * @param {Object} props
 * @param {Array} props.mediciones - Array de funcionalidades de medición
 * @param {Function} props.obtenerTransformador - Función para obtener transformador por ID
 */
const ContenedorMediciones = ({ mediciones, obtenerTransformador }) => {
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
                        {/* Primera celda: nombre de la funcionalidad */}
                        <td className="modal-lectura-celda-nombre">{func.nombre}</td>
                        {/* Celdas de valores */}
                        {func.registros.map((reg, idx) => {
                           const valorTransformado = aplicarTransformador(reg.valor, reg.transformadorId, obtenerTransformador);
                           let valorFormateado = "--";
                           if (valorTransformado !== null) {
                              valorFormateado = sinDecimales
                                 ? Math.round(valorTransformado).toLocaleString("es-AR")
                                 : formatearValor(valorTransformado);
                           }

                           // Simplificar etiqueta para potencias: mostrar solo (S), (P), (Q)
                           let etiquetaMostrar = reg.etiqueta;
                           const etiquetaLower = (reg.etiqueta || "").toLowerCase();
                           if (etiquetaLower.includes("potencia aparente") || etiquetaLower.includes("(s)")) {
                              etiquetaMostrar = "(S)";
                           } else if (etiquetaLower.includes("potencia activa") || etiquetaLower.includes("(p)")) {
                              etiquetaMostrar = "(P)";
                           } else if (etiquetaLower.includes("potencia reactiva") || etiquetaLower.includes("(q)")) {
                              etiquetaMostrar = "(Q)";
                           }

                           return (
                              <td key={`${func.id}-${idx}`} className="modal-lectura-celda-valor">
                                 <span className="modal-lectura-etiqueta">{etiquetaMostrar}</span>
                                 <span className="modal-lectura-dos-puntos">:</span>
                                 <span className="modal-lectura-valor">
                                    {valorFormateado}
                                    {unidad && valorTransformado !== null && (
                                       <span className="modal-lectura-unidad"> {unidad}</span>
                                    )}
                                 </span>
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

/**
 * LED de sistema (Ready/Start/Trip) - Fila superior del panel
 */
const LedSistema = ({ nombre, activo, color }) => {
   const colorClase = {
      verde: "led-sistema--verde",
      amarillo: "led-sistema--amarillo",
      rojo: "led-sistema--rojo"
   }[color] || "led-sistema--gris";

   return (
      <div className={`led-sistema ${colorClase} ${activo ? "led-sistema--activo" : ""}`}>
         <span className="led-sistema-indicador">●</span>
         <span className="led-sistema-nombre">{nombre}</span>
      </div>
   );
};

/**
 * LED programable (columna derecha del panel)
 */
const LedProgramable = ({ nombre, activo, tipo }) => {
   return (
      <div className={`led-programable ${activo ? "led-programable--activo" : ""} led-programable--${tipo || "info"}`}>
         <span className="led-programable-indicador">{activo ? "●" : "○"}</span>
         <span className="led-programable-nombre">{nombre}</span>
      </div>
   );
};

/**
 * Panel de estados estilo REF615
 * Simula el aspecto del panel frontal del relé ABB REF615
 */
const PanelEstadosREF615 = ({
   estadoLeds,
   estadoSalud,
   interpretarEstado,
   etiquetasPersonalizadas
}) => {
   // Interpretar registro de salud para Ready
   const salud = estadoSalud?.valor !== null && estadoSalud?.valor !== undefined
      ? interpretarEstado(estadoSalud.registro, estadoSalud.valor, null)
      : null;

   // Valor del registro de LEDs para operaciones de bits
   const valorLeds = estadoLeds?.valor || 0;

   // Determinar estado de LEDs de sistema basándose en registro 172
   const ledReady = salud ? !salud.bitsActivos?.some(b => b.posicion === 0) : true;
   const ledStart = (valorLeds >> 1) & 1; // Bit 1 del registro 172
   const ledTrip = (valorLeds >> 2) & 1;  // Bit 2 del registro 172

   // LEDs programables: usar todas las etiquetas personalizadas del usuario
   const ledsProgramables = etiquetasPersonalizadas
      ? Object.entries(etiquetasPersonalizadas)
         .map(([bit, config]) => ({
            posicion: parseInt(bit),
            nombre: config.texto || config.nombre || `LED ${parseInt(bit) + 1}`,
            activo: (valorLeds >> parseInt(bit)) & 1,
            tipo: config.severidad || "info"
         }))
         .sort((a, b) => a.posicion - b.posicion)
      : [];

   return (
      <div className="panel-ref615">
         {/* LEDs de Sistema - Fila superior */}
         <div className="panel-ref615-sistema">
            <LedSistema
               nombre="Ready"
               activo={ledReady}
               color="verde"
            />
            <LedSistema
               nombre="Start"
               activo={ledStart}
               color="amarillo"
            />
            <LedSistema
               nombre="Trip"
               activo={ledTrip}
               color="rojo"
            />
         </div>

         {/* Contenedor principal con info y LEDs programables */}
         <div className="panel-ref615-cuerpo">
            {/* Zona de información/resumen */}
            <div className="panel-ref615-info">
               <div className="panel-ref615-estado-general">
                  {ledTrip ? (
                     <span className="estado-critico">DISPARO ACTIVO</span>
                  ) : ledStart ? (
                     <span className="estado-warning">PROTECCION EN ARRANQUE</span>
                  ) : (
                     <span className="estado-ok">OPERACION NORMAL</span>
                  )}
               </div>
            </div>

            {/* LEDs Programables - Columna derecha (solo si hay etiquetas configuradas) */}
            {ledsProgramables.length > 0 && (
               <div className="panel-ref615-leds-programables">
                  {ledsProgramables.map((led) => (
                     <LedProgramable
                        key={led.posicion}
                        nombre={led.nombre}
                        activo={led.activo}
                        tipo={led.tipo}
                     />
                  ))}
               </div>
            )}
         </div>
      </div>
   );
};

/**
 * Sección de estados/LEDs (fallback para registradores sin formato REF615)
 * @param {Object} props
 * @param {Object} props.funcionalidad - Datos de la funcionalidad de estados
 * @param {Function} props.interpretarEstado - Función para interpretar bits
 * @param {Object} props.etiquetasBits - Etiquetas personalizadas de bits
 */
const SeccionEstados = ({ funcionalidad, interpretarEstado, etiquetasBits }) => {
   if (!funcionalidad || !funcionalidad.registros || funcionalidad.registros.length === 0) {
      return null;
   }

   // Interpretar el primer registro como bits de estado
   const primerRegistro = funcionalidad.registros[0];
   if (primerRegistro.valor === null || primerRegistro.valor === undefined) {
      return (
         <div className="modal-lectura-seccion modal-lectura-seccion--estados">
            <h3 className="modal-lectura-seccion-titulo">{funcionalidad.nombre}</h3>
            <p className="modal-lectura-sin-datos">Sin datos de estado disponibles</p>
         </div>
      );
   }

   const interpretacion = interpretarEstado(
      primerRegistro.registro,
      primerRegistro.valor,
      etiquetasBits
   );

   // Combinar bits activos e inactivos para mostrar todos
   const todosLosBits = [
      ...(interpretacion.bitsActivos || []),
      ...(interpretacion.bitsInactivos || []),
   ].sort((a, b) => a.posicion - b.posicion);

   return (
      <div className="modal-lectura-seccion modal-lectura-seccion--estados">
         <h3 className="modal-lectura-seccion-titulo">{funcionalidad.nombre}</h3>
         <div className="modal-lectura-leds-grid">
            {todosLosBits.map((bit) => (
               <IndicadorLED
                  key={`led-${bit.posicion}`}
                  activo={bit.activo}
                  tipo={bit.tipo}
                  nombre={bit.nombre}
                  descripcion={bit.descripcion}
               />
            ))}
         </div>
         {interpretacion.resumen && (
            <p className="modal-lectura-resumen">{interpretacion.resumen}</p>
         )}
      </div>
   );
};

/**
 * Contenido de mediciones y estados
 */
const ContenidoFuncionalidades = ({
   mediciones,
   estados,
   obtenerTransformador,
   interpretarEstado,
   etiquetasBits,
}) => {
   // Buscar estados relevantes para el panel REF615
   const estadoLeds = estados.find(e =>
      e.registros?.[0]?.registro === 172 ||
      e.nombre?.toLowerCase().includes("led")
   );
   const estadoSalud = estados.find(e =>
      e.registros?.[0]?.registro === 127 ||
      e.nombre?.toLowerCase().includes("salud") ||
      e.nombre?.toLowerCase().includes("ssr1")
   );

   // Verificar si hay estados para el panel REF615
   const tieneEstadosREF615 = estadoLeds || estadoSalud;

   return (
      <>
         {/* Contenedor unificado de mediciones con subtablas */}
         {mediciones.length > 0 ? (
            <ContenedorMediciones
               mediciones={mediciones}
               obtenerTransformador={obtenerTransformador}
            />
         ) : (
            <p className="modal-lectura-sin-datos">No hay mediciones configuradas</p>
         )}

         {/* Panel de Estados estilo REF615 */}
         {tieneEstadosREF615 && (
            <PanelEstadosREF615
               estadoLeds={estadoLeds?.registros?.[0]}
               estadoSalud={estadoSalud?.registros?.[0]}
               interpretarEstado={interpretarEstado}
               etiquetasPersonalizadas={etiquetasBits}
            />
         )}
      </>
   );
};

/**
 * Spinner de carga
 */
const SpinnerCarga = () => (
   <div className="modal-lectura-cargando">
      <div className="modal-lectura-spinner" />
      <span>Cargando funcionalidades...</span>
   </div>
);

/**
 * Modal de lectura completa
 * @param {Object} props
 * @param {boolean} props.abierto - Si el modal está abierto
 * @param {Function} props.onCerrar - Callback para cerrar
 * @param {Object} props.alimentador - Datos del alimentador
 * @param {string} props.timestampFormateado - Timestamp de la lectura formateado
 * @param {Object} props.funcionalidadesTabActivo - Funcionalidades del tab activo { mediciones, estados }
 * @param {Array} props.tabs - Lista de tabs (si hay múltiples registradores)
 * @param {string} props.tabActivo - ID del tab activo
 * @param {Function} props.setTabActivo - Función para cambiar el tab activo
 * @param {boolean} props.cargandoFuncionalidades - Si está cargando funcionalidades
 * @param {Function} props.interpretarEstado - Función para interpretar bits
 * @param {Function} props.exportarCSV - Función para exportar a CSV
 * @param {Function} props.obtenerTransformador - Función para obtener transformador por ID
 * @param {Object} props.etiquetasBits - Etiquetas personalizadas de bits (LEDs programables)
 */
export function ModalLecturaCompleta({
   abierto,
   onCerrar,
   alimentador,
   timestampFormateado,
   funcionalidadesTabActivo,
   tabs = [],
   tabActivo,
   setTabActivo,
   cargandoFuncionalidades,
   interpretarEstado,
   exportarCSV,
   obtenerTransformador,
   etiquetasBits = null,
}) {
   if (!abierto || !alimentador) return null;

   const colorHeader = alimentador.color || "#0ea5e9";

   const contenidoModal = (
      <div className="modal-lectura-overlay" onClick={onCerrar}>
         <div
            className="modal-lectura-contenedor"
            onClick={(e) => e.stopPropagation()}
            style={{ "--color-header": colorHeader }}
         >
            {/* Header */}
            <div className="modal-lectura-header">
               <div className="modal-lectura-header-info">
                  <span className="modal-lectura-indicador">▲</span>
                  <h2 className="modal-lectura-titulo">{alimentador.nombre}</h2>
               </div>
               <button
                  type="button"
                  className="modal-lectura-cerrar"
                  onClick={onCerrar}
                  title="Cerrar"
               >
                  <span>×</span>
               </button>
            </div>

            {/* Subtítulo con timestamp */}
            <div className="modal-lectura-subtitulo">
               {timestampFormateado && (
                  <span className="modal-lectura-timestamp">Última lectura: {timestampFormateado}</span>
               )}
            </div>

            {/* Tabs si hay múltiples registradores */}
            {tabs.length > 0 && (
               <div className="modal-lectura-tabs">
                  {tabs.map((tab) => (
                     <button
                        key={tab.id}
                        type="button"
                        className={`modal-lectura-tab ${tabActivo === tab.id ? "modal-lectura-tab--activo" : ""}`}
                        onClick={() => setTabActivo(tab.id)}
                     >
                        {tab.nombre}
                     </button>
                  ))}
               </div>
            )}

            {/* Contenido */}
            <div className="modal-lectura-contenido">
               {cargandoFuncionalidades ? (
                  <SpinnerCarga />
               ) : (
                  <ContenidoFuncionalidades
                     mediciones={funcionalidadesTabActivo?.mediciones || []}
                     estados={funcionalidadesTabActivo?.estados || []}
                     obtenerTransformador={obtenerTransformador}
                     interpretarEstado={interpretarEstado}
                     etiquetasBits={etiquetasBits}
                  />
               )}
            </div>

            {/* Footer con acciones */}
            <div className="modal-lectura-footer">
               <button
                  type="button"
                  className="modal-lectura-btn modal-lectura-btn--exportar"
                  onClick={exportarCSV}
                  title="Exportar a CSV"
                  disabled={cargandoFuncionalidades}
               >
                  <span className="modal-lectura-btn-icon">↓</span>
                  Exportar CSV
               </button>
            </div>
         </div>
      </div>
   );

   return createPortal(contenidoModal, document.body);
}

export default ModalLecturaCompleta;
