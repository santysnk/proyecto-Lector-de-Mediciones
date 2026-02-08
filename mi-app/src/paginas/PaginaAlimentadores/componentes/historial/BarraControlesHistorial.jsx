/**
 * Barra de controles para la ventana de historial
 * REDISEÑADO: Usa selectores de funcionalidad y tabsMedicion según modo
 */

import PropTypes from "prop-types";
import { MODOS_HISTORIAL } from "../../constantes/funcionalidadesRele";
import IndicadoresCache from "./IndicadoresCache";
import SelectorDatosHistorial from "./SelectorDatosHistorial";
import ControlesVisualizacion from "./ControlesVisualizacion";

const BarraControlesHistorial = (props) => {
   return (
      <div className="ventana-controles">
         <IndicadoresCache
            panelDatosAbierto={props.panelDatosAbierto}
            onTogglePanel={props.onTogglePanel}
            graficoVisible={props.graficoVisible}
            onToggleGrafico={props.onToggleGrafico}
            precargaProgreso={props.precargaProgreso}
            precargaCompleta={props.precargaCompleta}
            precargando={props.precargando}
            fuenteDatos={props.fuenteDatos}
            onLimpiarCache={props.onLimpiarCache}
         />

         <SelectorDatosHistorial
            registradoresUnicos={props.registradoresUnicos}
            registradorSeleccionadoId={props.registradorSeleccionadoId}
            onRegistradorChange={props.onRegistradorChange}
            funcionalidades={props.funcionalidades}
            funcionalidadesPorCategoria={props.funcionalidadesPorCategoria}
            funcionalidadSeleccionadaId={props.funcionalidadSeleccionadaId}
            onFuncionalidadChange={props.onFuncionalidadChange}
            cargandoFuncionalidades={props.cargandoFuncionalidades}
            alimentadorId={props.alimentadorId}
            alimentadores={props.alimentadores}
            onAlimentadorChange={props.onAlimentadorChange}
         />

         <ControlesVisualizacion
            tabsMedicion={props.tabsMedicion}
            indiceMedicionSeleccionado={props.indiceMedicionSeleccionado}
            onMedicionChange={props.onMedicionChange}
            modoVisualizacion={props.modoVisualizacion}
            rangoSeleccionado={props.rangoSeleccionado}
            onRangoChange={props.onRangoChange}
            fechaRangoDesde={props.fechaRangoDesde}
            fechaRangoHasta={props.fechaRangoHasta}
            onFechaRangoChange={props.onFechaRangoChange}
            tipoGrafico={props.tipoGrafico}
            onTipoGraficoChange={props.onTipoGraficoChange}
         />
      </div>
   );
};

BarraControlesHistorial.propTypes = {
   panelDatosAbierto: PropTypes.bool.isRequired,
   onTogglePanel: PropTypes.func.isRequired,
   registradoresUnicos: PropTypes.array,
   registradorSeleccionadoId: PropTypes.string,
   onRegistradorChange: PropTypes.func,
   funcionalidades: PropTypes.array,
   funcionalidadesPorCategoria: PropTypes.object,
   funcionalidadSeleccionadaId: PropTypes.string,
   onFuncionalidadChange: PropTypes.func,
   cargandoFuncionalidades: PropTypes.bool,
   tabsMedicion: PropTypes.arrayOf(
      PropTypes.shape({
         indice: PropTypes.number.isRequired,
         etiqueta: PropTypes.string.isRequired,
      })
   ),
   indiceMedicionSeleccionado: PropTypes.number,
   onMedicionChange: PropTypes.func,
   modoVisualizacion: PropTypes.oneOf(["individual", "fases", "combinar32bits", "bits"]),
   rangoSeleccionado: PropTypes.string.isRequired,
   onRangoChange: PropTypes.func.isRequired,
   fechaRangoDesde: PropTypes.instanceOf(Date),
   fechaRangoHasta: PropTypes.instanceOf(Date),
   onFechaRangoChange: PropTypes.func.isRequired,
   tipoGrafico: PropTypes.oneOf(["line", "area", "bar"]).isRequired,
   onTipoGraficoChange: PropTypes.func.isRequired,
   alimentadorId: PropTypes.string,
   alimentadores: PropTypes.array,
   onAlimentadorChange: PropTypes.func,
   precargaProgreso: PropTypes.number,
   precargaCompleta: PropTypes.bool,
   precargando: PropTypes.bool,
   fuenteDatos: PropTypes.oneOf(["local", "remoto", "mixto", null]),
   onLimpiarCache: PropTypes.func.isRequired,
   graficoVisible: PropTypes.bool,
   onToggleGrafico: PropTypes.func,
};

BarraControlesHistorial.defaultProps = {
   registradoresUnicos: [],
   registradorSeleccionadoId: null,
   onRegistradorChange: () => {},
   funcionalidades: [],
   funcionalidadesPorCategoria: {},
   funcionalidadSeleccionadaId: null,
   onFuncionalidadChange: () => {},
   cargandoFuncionalidades: false,
   tabsMedicion: [],
   indiceMedicionSeleccionado: 0,
   onMedicionChange: () => {},
   modoVisualizacion: "individual",
   fechaRangoDesde: null,
   fechaRangoHasta: null,
   alimentadorId: "",
   alimentadores: [],
   onAlimentadorChange: () => {},
   precargaProgreso: 0,
   precargaCompleta: false,
   precargando: false,
   fuenteDatos: null,
   graficoVisible: true,
   onToggleGrafico: () => {},
};

export default BarraControlesHistorial;
