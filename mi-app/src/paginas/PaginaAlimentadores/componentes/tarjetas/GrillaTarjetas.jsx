// src/paginas/PaginaAlimentadores/componentes/tarjetas/GrillaTarjetas.jsx
// Grilla de tarjetas de alimentadores

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import TarjetaAlimentador from "./TarjetaAlimentador.jsx";
import GapResizer from "./GapResizer.jsx";
import RowGapResizer from "./RowGapResizer.jsx";
import GrillaUnifilar from "./GrillaUnifilar.jsx";
import { useGrillaUnifilar } from "../../hooks/grilla-unifilar";
import { useChispas } from "../../hooks/ui";
import { useDeteccionFilas, useModoMobile } from "./hooks";
import { puedeHacerPolling, GAP_FIJO_MOBILE, ROW_GAP_FIJO_MOBILE } from "./utilidades";
import { BotonEditarDiagrama, BotonesArchivo } from "./componentes";
import { ESCALA_MIN, ESCALA_MAX } from "../../constantes/escalas";
import { obtenerFuncionalidadesRegistrador } from "@/servicios/api/registradores";
import "./GrillaTarjetas.css";

// Clave para localStorage de alarmas vistas
const STORAGE_KEY_ALARMAS_VISTAS = "rw-alarmas-vistas";

/**
 * Grilla de tarjetas de alimentadores.
 * Estructura flex-wrap con controles de gap horizontales y verticales.
 */
const GrillaTarjetas = ({
   alimentadores,
   lecturas,
   puestoId,
   workspaceId,
   elementoArrastrandoId,
   onAbrirConfiguracion,
   onAbrirHistorial,
   onExpandirLectura,
   onDragStart,
   onDragOver,
   onDrop,
   onDragEnd,
   onDropAlFinal,
   onAgregarNuevo,
   puedeAgregarNuevo = true,
   esObservador = false,
   estaMidiendo,
   obtenerTimestampInicio,
   obtenerContadorLecturas,
   obtenerGap,
   onGapChange,
   obtenerRowGap,
   onRowGapChange,
   skeletonCard = null,
   estaPolling,
   onPlayStopClick,
   obtenerContadorPolling,
   obtenerErrorPolling,
   obtenerEscalaEfectiva,
   onEscalaChange,
   registrosEnVivo = {},
}) => {
   const gridRef = useRef(null);
   const esModoMobile = useModoMobile();

   // Estado de alarmas vistas por alimentador
   const [alarmasVistasPorAlimentador, setAlarmasVistasPorAlimentador] = useState(() => {
      try {
         const guardadas = localStorage.getItem(STORAGE_KEY_ALARMAS_VISTAS);
         return guardadas ? JSON.parse(guardadas) : {};
      } catch {
         return {};
      }
   });

   // Persistir alarmas vistas en localStorage
   useEffect(() => {
      try {
         localStorage.setItem(STORAGE_KEY_ALARMAS_VISTAS, JSON.stringify(alarmasVistasPorAlimentador));
      } catch (e) {
         console.warn("No se pudo guardar alarmas vistas en localStorage:", e);
      }
   }, [alarmasVistasPorAlimentador]);

   // Caché de etiquetasBits por registrador (cargado desde API)
   const [etiquetasBitsCache, setEtiquetasBitsCache] = useState({});

   // Obtener IDs únicos de registradores de todos los alimentadores
   const registradoresIds = useMemo(() => {
      const ids = new Set();
      alimentadores.forEach(alim => {
         const regId = alim.config_tarjeta?.superior?.registrador_id
                    || alim.config_tarjeta?.inferior?.registrador_id
                    || alim.card_design?.superior?.registrador_id
                    || alim.card_design?.inferior?.registrador_id;
         if (regId) ids.add(regId);
      });
      return Array.from(ids);
   }, [alimentadores]);

   // Cargar etiquetasBits de registradores que no están en caché
   useEffect(() => {
      const cargarEtiquetasFaltantes = async () => {
         const faltantes = registradoresIds.filter(id => !etiquetasBitsCache[id]);
         if (faltantes.length === 0) return;

         for (const regId of faltantes) {
            try {
               const resultado = await obtenerFuncionalidadesRegistrador(regId);
               if (resultado?.etiquetasBits) {
                  setEtiquetasBitsCache(prev => ({
                     ...prev,
                     [regId]: resultado.etiquetasBits
                  }));
               }
            } catch (error) {
               console.warn(`Error cargando etiquetasBits del registrador ${regId}:`, error);
            }
         }
      };

      cargarEtiquetasFaltantes();
   }, [registradoresIds, etiquetasBitsCache]);

   // Funcion para obtener alarmas activas de un alimentador
   const obtenerAlarmasActivas = useCallback((alimentador) => {
      // 1. Obtener registros en vivo del alimentador
      const registrosAlim = registrosEnVivo[alimentador.id];
      if (!registrosAlim?.rele || !Array.isArray(registrosAlim.rele)) return [];

      // 2. Buscar registro 172 (LEDs)
      const registro172 = registrosAlim.rele.find(r => r.address === 172);
      if (!registro172) return [];

      const valorLeds = registro172.value || 0;

      // 3. Obtener ID del registrador configurado
      const regId = alimentador.config_tarjeta?.superior?.registrador_id
                 || alimentador.config_tarjeta?.inferior?.registrador_id
                 || alimentador.card_design?.superior?.registrador_id
                 || alimentador.card_design?.inferior?.registrador_id;

      if (!regId) return [];

      // 4. Obtener etiquetas de bits desde el caché
      const etiquetasBits = etiquetasBitsCache[regId];
      if (!etiquetasBits) return [];

      // 5. Extraer bits activos que sean alarmas/warnings
      const alarmas = [];
      Object.entries(etiquetasBits).forEach(([bit, config]) => {
         const bitNum = parseInt(bit);
         const activo = (valorLeds >> bitNum) & 1;

         // Solo incluir si es warning o alarma (no "estado" ni "info")
         if (activo && (config.severidad === "warning" || config.severidad === "alarma")) {
            alarmas.push({
               id: `${alimentador.id}-bit-${bit}`,
               nombre: config.texto || config.nombre || `LED ${bitNum + 1}`,
               tipo: config.severidad
            });
         }
      });

      return alarmas;
   }, [registrosEnVivo, etiquetasBitsCache]);

   // Handler para marcar/desmarcar una alarma como vista (toggle)
   const handleMarcarAlarmaVista = useCallback((alimentadorId, alarmaId) => {
      setAlarmasVistasPorAlimentador(prev => {
         const estadoActual = prev[alimentadorId]?.[alarmaId] || false;
         return {
            ...prev,
            [alimentadorId]: {
               ...prev[alimentadorId],
               [alarmaId]: !estadoActual // Toggle
            }
         };
      });
   }, []);

   // Handler para marcar todas las alarmas como vistas
   const handleMarcarTodasAlarmasVistas = useCallback((alimentadorId, alarmas) => {
      const vistas = {};
      alarmas.forEach(a => {
         vistas[a.id] = true;
      });

      setAlarmasVistasPorAlimentador(prev => ({
         ...prev,
         [alimentadorId]: {
            ...prev[alimentadorId],
            ...vistas
         }
      }));
   }, []);

   // Hook de detección de filas
   const { posicionesEntreFilas, filasPorTarjeta } = useDeteccionFilas({
      gridRef,
      alimentadores,
      obtenerGap,
      onGapChange,
      puestoId,
      obtenerRowGap,
   });

   // Hook para la grilla unifiliar
   const grillaUnifilar = useGrillaUnifilar(puestoId, workspaceId);

   // Hook para animación de chispas
   const chispasHook = useChispas({
      bornes: grillaUnifilar.bornes,
      celdas: grillaUnifilar.celdas,
      chispasConfig: grillaUnifilar.chispasConfig,
      grosorLinea: grillaUnifilar.grosorLinea,
   });

   // Valores para modo móvil o desktop
   const rowGapPrimero = esModoMobile ? ROW_GAP_FIJO_MOBILE : obtenerRowGap(puestoId, 0);

   // Función para obtener el margin-top de una tarjeta según su fila
   const obtenerMarginTop = (alimId) => {
      const fila = filasPorTarjeta[alimId];
      if (fila === undefined || fila === 0) return 0;
      return esModoMobile ? ROW_GAP_FIJO_MOBILE : obtenerRowGap(puestoId, fila);
   };

   return (
      <div className="grilla-con-row-gaps">
         {/* Grilla unifiliar - solo en desktop */}
         {!esModoMobile && (
            <GrillaUnifilar
               celdas={grillaUnifilar.celdas}
               textos={grillaUnifilar.textos}
               modoEdicion={grillaUnifilar.modoEdicion}
               colorSeleccionado={grillaUnifilar.colorSeleccionado}
               herramienta={grillaUnifilar.herramienta}
               estaPintando={grillaUnifilar.estaPintando}
               coloresDisponibles={grillaUnifilar.coloresDisponibles}
               fuentesDisponibles={grillaUnifilar.fuentesDisponibles}
               tamanosDisponibles={grillaUnifilar.tamanosDisponibles}
               grosoresDisponibles={grillaUnifilar.grosoresDisponibles}
               grosorLinea={grillaUnifilar.grosorLinea}
               onCambiarGrosor={grillaUnifilar.cambiarGrosor}
               configTexto={grillaUnifilar.configTexto}
               onConfigTextoChange={grillaUnifilar.setConfigTexto}
               textoSeleccionadoId={grillaUnifilar.textoSeleccionadoId}
               onTextoSeleccionadoChange={grillaUnifilar.setTextoSeleccionadoId}
               onPintarCelda={grillaUnifilar.pintarCelda}
               onIniciarPintado={grillaUnifilar.iniciarPintado}
               onDetenerPintado={grillaUnifilar.detenerPintado}
               onCambiarColor={grillaUnifilar.setColorSeleccionado}
               onSeleccionarPincel={grillaUnifilar.seleccionarPincel}
               onSeleccionarBorrador={grillaUnifilar.seleccionarBorrador}
               onSeleccionarTexto={grillaUnifilar.seleccionarTexto}
               onSeleccionarBalde={grillaUnifilar.seleccionarBalde}
               onSeleccionarMover={grillaUnifilar.seleccionarMover}
               onRellenarConectadas={grillaUnifilar.rellenarConectadas}
               onBorrarArea={grillaUnifilar.borrarArea}
               onObtenerCeldasConectadas={grillaUnifilar.obtenerCeldasConectadas}
               onMoverCeldasConectadas={grillaUnifilar.moverCeldasConectadas}
               onAgregarTexto={grillaUnifilar.agregarTexto}
               onActualizarTexto={grillaUnifilar.actualizarTexto}
               onEliminarTexto={grillaUnifilar.eliminarTexto}
               onLimpiarTodo={grillaUnifilar.limpiarTodo}
               onCerrarEdicion={grillaUnifilar.desactivarEdicion}
               bornes={grillaUnifilar.bornes}
               chispasConfig={grillaUnifilar.chispasConfig}
               tiposBorne={grillaUnifilar.tiposBorne}
               onSeleccionarBorne={grillaUnifilar.seleccionarBorne}
               onAgregarBorne={grillaUnifilar.agregarBorne}
               onEliminarBorneEnPosicion={grillaUnifilar.eliminarBorneEnPosicion}
               onActualizarChispasConfig={grillaUnifilar.actualizarChispasConfig}
               animandoChispas={chispasHook.animando}
               onToggleAnimacionChispas={chispasHook.toggleAnimacion}
               chispasRef={chispasHook.chispasRef}
               onObtenerPosicionPixelChispa={chispasHook.obtenerPosicionPixel}
               onObtenerEstelaPixeles={chispasHook.obtenerEstelaPixeles}
            />
         )}

         {/* Botón editar diagrama - solo en desktop */}
         {!esModoMobile && !grillaUnifilar.modoEdicion && (
            <BotonEditarDiagrama onActivar={grillaUnifilar.activarEdicion} />
         )}

         {/* Botones guardar/cargar - solo en modo edición y desktop */}
         {!esModoMobile && grillaUnifilar.modoEdicion && (
            <BotonesArchivo
               onExportar={grillaUnifilar.exportarAArchivo}
               onImportar={grillaUnifilar.importarDesdeArchivo}
            />
         )}

         {/* RowGapResizer primera fila - solo en desktop */}
         {!elementoArrastrandoId && !esModoMobile ? (
            <RowGapResizer
               gap={obtenerRowGap(puestoId, 0)}
               onGapChange={(nuevoGap) => onRowGapChange(puestoId, 0, nuevoGap)}
               rowIndex={0}
            />
         ) : (
            <div style={{ height: rowGapPrimero }} />
         )}

         {/* Mensaje sin alimentadores */}
         {alimentadores.length === 0 && (
            <p className="alim-empty-message">
               Este puesto no tiene alimentadores. Haz clic en el botón de abajo para agregar.
            </p>
         )}

         <div ref={gridRef} className="alim-cards-grid">
            {alimentadores.map((alim) => {
               const lecturasAlim = lecturas[alim.id] || {};
               const mideRele = estaMidiendo(alim.id, "rele");
               const mideAnalizador = estaMidiendo(alim.id, "analizador");
               const gapTarjeta = obtenerGap(alim.id);
               const marginTop = obtenerMarginTop(alim.id);
               const alarmasActivas = obtenerAlarmasActivas(alim);

               return (
                  <React.Fragment key={alim.id}>
                     <div
                        className="alim-card-wrapper"
                        data-alim-id={alim.id}
                        style={marginTop > 0 ? { marginTop: `${marginTop}px` } : undefined}
                     >
                        <TarjetaAlimentador
                           nombre={alim.nombre}
                           color={alim.color}
                           onConfigClick={() => onAbrirConfiguracion(puestoId, alim)}
                           onHistorialClick={
                              onAbrirHistorial ? () => onAbrirHistorial(puestoId, alim) : undefined
                           }
                           onExpandirClick={
                              onExpandirLectura ? () => onExpandirLectura(alim) : undefined
                           }
                           esObservador={esObservador}
                           topSide={lecturasAlim.parteSuperior}
                           bottomSide={lecturasAlim.parteInferior}
                           draggable={true}
                           isDragging={elementoArrastrandoId === alim.id}
                           onDragStart={() => onDragStart(alim.id)}
                           onDragOver={onDragOver}
                           onDrop={(e) => {
                              e.preventDefault();
                              onDrop(alim.id);
                           }}
                           onDragEnd={onDragEnd}
                           mideRele={mideRele}
                           mideAnalizador={mideAnalizador}
                           periodoRele={alim.periodoSegundos || 60}
                           periodoAnalizador={alim.analizador?.periodoSegundos || 60}
                           timestampInicioRele={obtenerTimestampInicio(alim.id, "rele")}
                           timestampInicioAnalizador={obtenerTimestampInicio(alim.id, "analizador")}
                           contadorRele={obtenerContadorLecturas(alim.id, "rele")}
                           contadorAnalizador={obtenerContadorLecturas(alim.id, "analizador")}
                           estaPolling={estaPolling ? estaPolling(alim.id) : false}
                           puedePolling={puedeHacerPolling(alim)}
                           onPlayStopClick={() => onPlayStopClick && onPlayStopClick(alim.id)}
                           contadorPolling={obtenerContadorPolling ? obtenerContadorPolling(alim.id) : 0}
                           periodoPolling={(alim.intervalo_consulta_ms || 60000) / 1000}
                           errorPolling={obtenerErrorPolling ? obtenerErrorPolling(alim.id) : null}
                           escala={obtenerEscalaEfectiva ? obtenerEscalaEfectiva(alim.id, puestoId) : 1.0}
                           onEscalaChange={
                              !esModoMobile && onEscalaChange
                                 ? (nuevaEscala) => onEscalaChange(alim.id, nuevaEscala)
                                 : undefined
                           }
                           ESCALA_MIN={ESCALA_MIN}
                           ESCALA_MAX={ESCALA_MAX}
                           alarmasActivas={alarmasActivas}
                           alarmasVistas={alarmasVistasPorAlimentador[alim.id] || {}}
                           onMarcarAlarmaVista={(alarmaId) => handleMarcarAlarmaVista(alim.id, alarmaId)}
                           onMarcarTodasAlarmasVistas={() => handleMarcarTodasAlarmasVistas(alim.id, alarmasActivas)}
                        />
                     </div>
                     {!elementoArrastrandoId && !esModoMobile ? (
                        <div style={marginTop > 0 ? { marginTop: `${marginTop}px` } : undefined}>
                           <GapResizer
                              gap={gapTarjeta}
                              onGapChange={(nuevoGap) => onGapChange(alim.id, nuevoGap)}
                           />
                        </div>
                     ) : (
                        <div
                           className="gap-spacer"
                           style={{
                              width: esModoMobile ? GAP_FIJO_MOBILE : gapTarjeta,
                              ...(marginTop > 0 && { marginTop: `${marginTop}px` }),
                           }}
                        />
                     )}
                  </React.Fragment>
               );
            })}

            {/* Skeleton card */}
            {skeletonCard && (() => {
               const marginTopSkeleton = obtenerMarginTop("nuevo-registrador");
               return (
                  <React.Fragment>
                     <div
                        className="alim-card-wrapper"
                        data-alim-id="skeleton"
                        style={marginTopSkeleton > 0 ? { marginTop: `${marginTopSkeleton}px` } : undefined}
                     >
                        {skeletonCard}
                     </div>
                     <div className="gap-spacer" style={{ width: esModoMobile ? GAP_FIJO_MOBILE : 10 }} />
                  </React.Fragment>
               );
            })()}

            {/* Tarjeta "Nuevo Registrador" o zona de drop */}
            {(elementoArrastrandoId || puedeAgregarNuevo) && (() => {
               const marginTopNuevo = obtenerMarginTop("nuevo-registrador");
               const styleNuevo = {
                  width: 304,
                  minWidth: 304,
                  maxWidth: 304,
                  height: 279,
                  minHeight: 279,
                  ...(marginTopNuevo > 0 && { marginTop: `${marginTopNuevo}px` }),
               };

               return elementoArrastrandoId ? (
                  <div
                     className="alim-card-add"
                     style={styleNuevo}
                     onDragOver={onDragOver}
                     onDrop={(e) => {
                        e.preventDefault();
                        onDropAlFinal();
                     }}
                  >
                     <span style={{ textAlign: "center", padding: "1rem" }}>
                        Soltar aquí para mover al final
                     </span>
                  </div>
               ) : (
                  <div className="alim-card-add" style={styleNuevo} onClick={onAgregarNuevo}>
                     <span className="alim-card-add-plus">+</span>
                     <span className="alim-card-add-text">Nuevo Registrador</span>
                  </div>
               );
            })()}

            {/* RowGapResizers entre filas - solo en desktop */}
            {!elementoArrastrandoId &&
               !esModoMobile &&
               posicionesEntreFilas.map((pos) => (
                  <div
                     key={`row-gap-${pos.filaIndex}`}
                     className="row-gap-resizer-overlay"
                     style={{ top: `${pos.top}px` }}
                  >
                     <RowGapResizer
                        gap={obtenerRowGap(puestoId, pos.filaIndex)}
                        onGapChange={(nuevoGap) => onRowGapChange(puestoId, pos.filaIndex, nuevoGap)}
                        rowIndex={pos.filaIndex}
                     />
                  </div>
               ))}
         </div>
      </div>
   );
};

export default GrillaTarjetas;
