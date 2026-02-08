// componentes/modales/lectura-completa/ComponentesEstado.jsx
// Componentes de estado: panel REF615, LEDs, sección de estados

import { IndicadorLED, ContenedorMediciones } from "./ComponentesMedicion";

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

const LedProgramable = ({ nombre, activo, tipo }) => (
   <div className={`led-programable ${activo ? "led-programable--activo" : ""} led-programable--${tipo || "info"}`}>
      <span className="led-programable-indicador">●</span>
      <span className="led-programable-nombre">{nombre}</span>
   </div>
);

export const PanelEstadosREF615 = ({
   estadoLeds,
   estadoSalud,
   interpretarEstado,
   etiquetasPersonalizadas
}) => {
   const salud = estadoSalud?.valor !== null && estadoSalud?.valor !== undefined
      ? interpretarEstado(estadoSalud.registro, estadoSalud.valor, null)
      : null;

   const valorLeds = estadoLeds?.valor || 0;

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

   const ledReady = salud ? !salud.bitsActivos?.some(b => b.posicion === 0) : true;
   const ledStart = ledsProgramables.some(led => led.activo && led.tipo === "warning");
   const ledTrip = ledsProgramables.some(led => led.activo && led.tipo === "alarma");

   return (
      <div className="panel-ref615">
         <div className="panel-ref615-sistema">
            <LedSistema nombre="Ready" activo={ledReady} color="verde" />
            <LedSistema nombre="Start" activo={ledStart} color="amarillo" />
            <LedSistema nombre="Trip" activo={ledTrip} color="rojo" />
         </div>

         <div className="panel-ref615-cuerpo">
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

export const SeccionEstados = ({ funcionalidad, interpretarEstado, etiquetasBits }) => {
   if (!funcionalidad || !funcionalidad.registros || funcionalidad.registros.length === 0) {
      return null;
   }

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

export const ContenidoFuncionalidades = ({
   mediciones,
   estados,
   obtenerTransformador,
   interpretarEstado,
   etiquetasBits,
}) => {
   const estadoLeds = estados.find(e =>
      e.registros?.[0]?.registro === 172 ||
      e.registros?.some(r => r.registro === 172) ||
      e.nombre?.toLowerCase().includes("led")
   );
   const estadoSalud = estados.find(e =>
      e.registros?.[0]?.registro === 127 ||
      e.registros?.some(r => r.registro === 127) ||
      e.nombre?.toLowerCase().includes("salud") ||
      e.nombre?.toLowerCase().includes("ssr1") ||
      e.nombre?.toLowerCase().includes("ready")
   );

   const tieneEstadosREF615 = estadoLeds || estadoSalud;

   return (
      <>
         {mediciones.length > 0 ? (
            <ContenedorMediciones
               mediciones={mediciones}
               obtenerTransformador={obtenerTransformador}
            />
         ) : (
            <p className="modal-lectura-sin-datos">No hay mediciones configuradas</p>
         )}

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

export const SpinnerCarga = () => (
   <div className="modal-lectura-cargando">
      <div className="modal-lectura-spinner" />
      <span>Cargando funcionalidades...</span>
   </div>
);
