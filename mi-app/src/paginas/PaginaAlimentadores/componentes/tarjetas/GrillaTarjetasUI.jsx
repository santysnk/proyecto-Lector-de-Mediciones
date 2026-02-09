// src/paginas/PaginaAlimentadores/componentes/tarjetas/GrillaTarjetasUI.jsx
// Grilla de tarjetas de alimentadores

import React, { useRef, useState, useCallback } from "react";
import TarjetaAlimentador from "./TarjetaAlimentador.jsx";
import GapResizer from "./GapResizer.jsx";
import RowGapResizer from "./RowGapResizer.jsx";
import GrillaUnifilar from "./GrillaUnifilar.jsx";
import { useGrillaUnifilar } from "../../hooks/grilla-unifilar";
import { useChispas } from "../../hooks/ui";
import { useDeteccionFilas, useModoMobile } from "./hooks";
import { puedeHacerPolling, GAP_FIJO_MOBILE, ROW_GAP_FIJO_MOBILE } from "./utilidades";
import { BotonEditarDiagrama, BotonesArchivo, BotonToggleNuevoRegistrador } from "./componentes";
import { ESCALA_MIN, ESCALA_MAX } from "../../constantes/escalas";
import { useAlarmasGrilla } from "./useAlarmasGrilla";
import "./GrillaTarjetas.css";

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

   // Estado para ocultar/mostrar card "Nuevo Registrador"
   const [mostrarNuevoRegistrador, setMostrarNuevoRegistrador] = useState(() => {
      const guardado = localStorage.getItem("ocultar_nuevo_registrador");
      return guardado !== "true";
   });

   const toggleNuevoRegistrador = useCallback(() => {
      setMostrarNuevoRegistrador(prev => {
         const nuevoValor = !prev;
         if (nuevoValor) {
            localStorage.removeItem("ocultar_nuevo_registrador");
         } else {
            localStorage.setItem("ocultar_nuevo_registrador", "true");
         }
         return nuevoValor;
      });
   }, []);

   // Hook de alarmas
   const {
      alarmasVistasPorAlimentador,
      obtenerAlarmasActivas,
      handleMarcarAlarmaVista,
      handleMarcarTodasAlarmasVistas,
   } = useAlarmasGrilla({ alimentadores, registrosEnVivo });

   // Hook de detección de filas
   const { posicionesEntreFilas, filasPorTarjeta } = useDeteccionFilas({
      gridRef, alimentadores, obtenerGap, onGapChange, puestoId, obtenerRowGap,
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

         {/* Botón toggle Nuevo Registrador - solo en desktop y si puede agregar */}
         {!esModoMobile && puedeAgregarNuevo && (
            <BotonToggleNuevoRegistrador
               visible={mostrarNuevoRegistrador}
               onToggle={toggleNuevoRegistrador}
            />
         )}

         {/* Botón editar diagrama - solo en desktop */}
         {!esModoMobile && !grillaUnifilar.modoEdicion && (
            <BotonEditarDiagrama onActivar={grillaUnifilar.activarEdicion} />
         )}

         {/* Botones guardar/cargar/cerrar - solo en modo edición y desktop */}
         {!esModoMobile && grillaUnifilar.modoEdicion && (
            <BotonesArchivo
               onExportar={grillaUnifilar.exportarAArchivo}
               onImportar={grillaUnifilar.importarDesdeArchivo}
               onCerrar={grillaUnifilar.desactivarEdicion}
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
            <div className="alim-empty-message">
               <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="2" />
                  <line x1="12" y1="9" x2="12" y2="15" />
                  <line x1="9" y1="12" x2="15" y2="12" />
               </svg>
               <p className="alim-empty-message-titulo">Este puesto no tiene alimentadores</p>
               <p className="alim-empty-message-texto">
                  Usá la tarjeta <strong>Nuevo Registrador</strong> para agregar uno.
               </p>
            </div>
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

            {/* Zona de drop al arrastrar */}
            {elementoArrastrandoId && (() => {
               const marginTopNuevo = obtenerMarginTop("nuevo-registrador");
               const styleNuevo = {
                  width: 304, minWidth: 304, maxWidth: 304,
                  height: 279, minHeight: 279,
                  ...(marginTopNuevo > 0 && { marginTop: `${marginTopNuevo}px` }),
               };
               return (
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
               );
            })()}

            {/* Card "Nuevo Registrador" con animación scale */}
            {!elementoArrastrandoId && puedeAgregarNuevo && (() => {
               const marginTopNuevo = obtenerMarginTop("nuevo-registrador");
               return (
                  <div
                     className={`alim-card-add alim-card-add--nuevo${mostrarNuevoRegistrador ? "" : " alim-card-add--nuevo-oculto"}`}
                     style={marginTopNuevo > 0 ? { marginTop: `${marginTopNuevo}px` } : undefined}
                     onClick={mostrarNuevoRegistrador ? onAgregarNuevo : undefined}
                  >
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
