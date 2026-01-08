/**
 * Ventana flotante para visualizar el historial de lecturas con gráficos
 * Soporta: arrastrar, minimizar, maximizar, múltiples instancias
 */

import { useRef } from "react";
import ApexChartWrapper from "../../../../../componentes/comunes/ApexChartWrapper";
import { usarContextoAlimentadores } from "../../../contexto/ContextoAlimentadoresSupabase";
import { useVentanaHistorialLogica } from "../../../hooks/historial";
import { useArrastrarVentana } from "../../../hooks/ui";
import { exportarCSV } from "../../../utilidades/exportarCSV";
import { generarInformePDF } from "../../../utilidades/exportarInformePDF";
import ModalConfigInforme from "./ModalConfigInforme";
import PanelDatosHistorial from "../../historial/PanelDatosHistorial";
import BarraTituloVentana from "../../historial/BarraTituloVentana";
import BarraControlesHistorial from "../../historial/BarraControlesHistorial";
import ControlEscalaY from "../../historial/ControlEscalaY";
import EstadoGrafico from "../../historial/EstadoGrafico";
import EstadisticasHistorial from "../../historial/EstadisticasHistorial";
import "./VentanaHistorial.css";

const VentanaHistorial = ({
   ventana,
   onCerrar,
   onMinimizar,
   onMaximizar,
   onEnfocar,
   onMover,
}) => {
   const { alimentador: alimentadorInicial, cardDesign: cardDesignInicial, minimizada, maximizada, posicion, zIndex } = ventana;

   // Obtener alimentadores del puesto desde el contexto
   const { puestoSeleccionado } = usarContextoAlimentadores();
   const alimentadoresPuesto = puestoSeleccionado?.alimentadores || [];

   // Refs
   const ventanaRef = useRef(null);
   const headerRef = useRef(null);
   const chartRef = useRef(null);

   // Hook de arrastre
   const { arrastrando, handleMouseDown } = useArrastrarVentana({
      ventanaRef,
      maximizada,
      onEnfocar,
      onMover,
   });

   // Hook de lógica principal
   const {
      alimentador,
      cargando,
      error,
      datosGrafico,
      datosFiltrados,
      precargando,
      precargaProgreso,
      precargaCompleta,
      panelDatosAbierto,
      setPanelDatosAbierto,
      graficoVisible,
      setGraficoVisible,
      modalInformeVisible,
      setModalInformeVisible,
      editandoEscalaY,
      setEditandoEscalaY,
      zonaSeleccionada,
      setZonaSeleccionada,
      zonaDisponible,
      tituloSuperior,
      tituloInferior,
      tituloZonaActual,
      rangoSeleccionado,
      fechaRangoDesde,
      fechaRangoHasta,
      handleRangoChange,
      handleFechaRangoChange,
      tipoGrafico,
      handleTipoGraficoChange,
      opcionesGrafico,
      seriesGrafico,
      escalaYMax,
      setEscalaYMax,
      handleEscalaYManual,
      limitesEscalaY,
      intervaloFiltro,
      setIntervaloFiltro,
      fuenteDatosEfectiva,
      tituloPanelDatos,
      estadisticasGrafico,
      cargarDatos,
      handleLimpiarCache,
      handleAlimentadorChange,
   } = useVentanaHistorialLogica({
      alimentadorInicial,
      cardDesignInicial,
      minimizada,
      alimentadoresPuesto,
   });

   // Handlers de exportación
   const handleExportarCSV = () => {
      if (datosGrafico.length === 0) return;
      exportarCSV(datosGrafico, `historial_${alimentador?.nombre}_${zonaSeleccionada}_${Date.now()}`, {
         columnas: ["timestamp", "valor"],
         etiquetas: { timestamp: "Fecha/Hora", valor: `Promedio ${tituloZonaActual}` },
      });
   };

   const handleAbrirModalInforme = () => {
      if (datosGrafico.length === 0) return;
      setModalInformeVisible(true);
   };

   const handleGenerarInforme = async (configInforme) => {
      const { solicitadoPor, datosFiltrados: datosInforme, fechaInicio, fechaFin, intervalo, imagenGrafico } = configInforme;
      await generarInformePDF({
         nombreAlimentador: alimentador?.nombre || "Alimentador",
         tituloMedicion: tituloZonaActual,
         datos: datosInforme,
         fechaInicio,
         fechaFin,
         solicitadoPor,
         imagenGrafico,
         intervalo,
      });
   };

   // No renderizar si está minimizada
   if (minimizada) return null;

   const estiloVentana = maximizada
      ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", zIndex }
      : { position: "fixed", top: posicion.y, left: posicion.x, zIndex };

   return (
      <div
         ref={ventanaRef}
         className={`ventana-historial ${maximizada ? "ventana-historial--maximizada" : ""} ${arrastrando ? "ventana-historial--arrastrando" : ""}`}
         style={estiloVentana}
         onMouseDown={() => onEnfocar()}
      >
         {/* Header arrastrable */}
         <BarraTituloVentana
            ref={headerRef}
            nombre={alimentador?.nombre}
            maximizada={maximizada}
            onMinimizar={onMinimizar}
            onMaximizar={onMaximizar}
            onCerrar={onCerrar}
            onMouseDown={handleMouseDown}
         />

         {/* Contenido */}
         <div className="ventana-historial-content">
            {/* Barra de controles compacta */}
            <BarraControlesHistorial
               panelDatosAbierto={panelDatosAbierto}
               onTogglePanel={() => setPanelDatosAbierto(!panelDatosAbierto)}
               zonaSeleccionada={zonaSeleccionada}
               onZonaChange={setZonaSeleccionada}
               zonaDisponible={zonaDisponible}
               tituloSuperior={tituloSuperior}
               tituloInferior={tituloInferior}
               rangoSeleccionado={rangoSeleccionado}
               onRangoChange={handleRangoChange}
               fechaRangoDesde={fechaRangoDesde}
               fechaRangoHasta={fechaRangoHasta}
               onFechaRangoChange={handleFechaRangoChange}
               tipoGrafico={tipoGrafico}
               onTipoGraficoChange={handleTipoGraficoChange}
               alimentadorId={alimentador?.id}
               alimentadores={alimentadoresPuesto}
               onAlimentadorChange={handleAlimentadorChange}
               precargaProgreso={precargaProgreso}
               precargaCompleta={precargaCompleta}
               precargando={precargando}
               fuenteDatos={fuenteDatosEfectiva}
               onLimpiarCache={handleLimpiarCache}
               graficoVisible={graficoVisible}
               onToggleGrafico={() => setGraficoVisible(!graficoVisible)}
            />

            {/* Contenedor del gráfico y panel de datos */}
            <div className={`ventana-grafico-container ${!graficoVisible ? "ventana-grafico-container--oculto" : ""}`}>
               {/* Panel lateral de datos */}
               <PanelDatosHistorial
                  abierto={panelDatosAbierto}
                  tituloPeriodo={tituloPanelDatos}
                  intervaloFiltro={intervaloFiltro}
                  onIntervaloChange={setIntervaloFiltro}
                  datosFiltrados={datosFiltrados}
                  tipoGrafico={tipoGrafico}
               />

               {/* Control de escala Y */}
               <ControlEscalaY
                  visible={datosGrafico.length > 0 && !cargando && !error}
                  escalaYMax={escalaYMax}
                  setEscalaYMax={setEscalaYMax}
                  limitesEscalaY={limitesEscalaY}
                  editandoEscalaY={editandoEscalaY}
                  setEditandoEscalaY={setEditandoEscalaY}
                  handleEscalaYManual={handleEscalaYManual}
               />

               {/* Gráfico */}
               <div className="ventana-grafico">
                  <EstadoGrafico
                     cargando={cargando}
                     error={error}
                     precargando={precargando}
                     datosLength={datosGrafico.length}
                     onReintentar={cargarDatos}
                  >
                     <ApexChartWrapper
                        key={`chart-${tipoGrafico}-${escalaYMax}`}
                        ref={chartRef}
                        options={opcionesGrafico}
                        series={seriesGrafico}
                        type={tipoGrafico}
                        height="100%"
                     />
                  </EstadoGrafico>
               </div>
            </div>

            {/* Estadísticas */}
            <EstadisticasHistorial
               estadisticas={estadisticasGrafico}
               onExportarCSV={handleExportarCSV}
               onAbrirInforme={handleAbrirModalInforme}
               datosDisponibles={datosGrafico.length > 0}
            />
         </div>

         {/* Modal de configuración de informe */}
         <ModalConfigInforme
            visible={modalInformeVisible}
            onCerrar={() => setModalInformeVisible(false)}
            onGenerar={handleGenerarInforme}
            datos={datosGrafico}
            nombreAlimentador={alimentador?.nombre || "Alimentador"}
            tituloMedicion={tituloZonaActual}
            tipoGrafico={tipoGrafico}
         />
      </div>
   );
};

export default VentanaHistorial;
