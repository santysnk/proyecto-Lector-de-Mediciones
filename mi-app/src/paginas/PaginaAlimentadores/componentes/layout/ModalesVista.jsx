// componentes/layout/ModalesVista.jsx
// Contenedor de todos los modales de la vista de alimentadores

import { ModalNuevoPuesto, ModalEditarPuestos, ModalConfiguracionPuesto } from "../modales/puesto";
import ModalConfiguracionAlimentador from "../modales/ModalConfiguracionAlimentador.jsx";
import ModalConfigurarAgente from "../modales/ModalConfigurarAgente.jsx";
import { ModalGestionarAccesos, ModalPanelPermisos } from "../modales/permisos";

/**
 * Contenedor de todos los modales de la vista
 */
const ModalesVista = ({
   // Modal Nuevo Puesto
   modalNuevoPuestoAbierto,
   onCerrarNuevoPuesto,
   onCrearPuesto,
   coloresSistema,
   // Modal Editar Puestos
   modalEditarPuestosAbierto,
   puestosConPreferencias,
   onCerrarEditarPuestos,
   onGuardarPuestos,
   esCreador,
   rolEnWorkspace,
   esCompacto,
   obtenerEscalaPuesto,
   onEscalaPuestoChange,
   ESCALA_MIN,
   ESCALA_MAX,
   estilosGlobales,
   onGuardarEstilos,
   // Modal Alimentador
   modalAlimentadorAbierto,
   puestoNombre,
   workspaceId,
   modoAlimentador,
   alimentadorEnEdicion,
   onCancelarAlimentador,
   onConfirmarAlimentador,
   onEliminarAlimentador,
   // Modal Config Puesto
   modalConfigPuestoAbierto,
   puesto,
   onCerrarConfigPuesto,
   estaPolling,
   onPlayStopClick,
   buscarRegistrador,
   // Modal Agente
   ventanaConfigAgente,
   onCerrarConfigAgente,
   onMinimizarConfigAgente,
   onMaximizarConfigAgente,
   onEnfocarConfigAgente,
   onMoverConfigAgente,
   // Modal Accesos
   modalAccesosAbierto,
   onCerrarAccesos,
   usuarioActualId,
   // Modal Panel Permisos
   modalPanelPermisosAbierto,
   onCerrarPanelPermisos,
}) => {
   return (
      <>
         <ModalNuevoPuesto
            abierto={modalNuevoPuestoAbierto}
            onCerrar={onCerrarNuevoPuesto}
            onCrear={onCrearPuesto}
            coloresSistema={coloresSistema}
         />

         <ModalEditarPuestos
            abierto={modalEditarPuestosAbierto}
            puestos={puestosConPreferencias}
            onCerrar={onCerrarEditarPuestos}
            onGuardar={onGuardarPuestos}
            esCreador={esCreador}
            rolEnWorkspace={rolEnWorkspace}
            obtenerEscalaPuesto={!esCompacto ? obtenerEscalaPuesto : undefined}
            onEscalaPuestoChange={!esCompacto ? onEscalaPuestoChange : undefined}
            ESCALA_MIN={ESCALA_MIN}
            ESCALA_MAX={ESCALA_MAX}
            estilosGlobales={estilosGlobales}
            onGuardarEstilos={onGuardarEstilos}
         />

         <ModalConfiguracionAlimentador
            abierto={modalAlimentadorAbierto}
            puestoNombre={puestoNombre}
            workspaceId={workspaceId}
            modo={modoAlimentador}
            initialData={alimentadorEnEdicion}
            onCancelar={onCancelarAlimentador}
            onConfirmar={onConfirmarAlimentador}
            onEliminar={onEliminarAlimentador}
            esCreador={esCreador}
            rolEnWorkspace={rolEnWorkspace}
         />

         <ModalConfiguracionPuesto
            abierto={modalConfigPuestoAbierto}
            puesto={puesto}
            onCerrar={onCerrarConfigPuesto}
            estaPolling={estaPolling}
            onPlayStopClick={onPlayStopClick}
            buscarRegistrador={buscarRegistrador}
         />

         <ModalConfigurarAgente
            abierto={ventanaConfigAgente.abierta}
            workspaceId={ventanaConfigAgente.workspaceId}
            onCerrar={onCerrarConfigAgente}
            minimizada={ventanaConfigAgente.minimizada}
            maximizada={ventanaConfigAgente.maximizada}
            posicion={ventanaConfigAgente.posicion}
            zIndex={ventanaConfigAgente.zIndex}
            onMinimizar={onMinimizarConfigAgente}
            onMaximizar={onMaximizarConfigAgente}
            onEnfocar={onEnfocarConfigAgente}
            onMover={onMoverConfigAgente}
         />

         <ModalGestionarAccesos
            abierto={modalAccesosAbierto}
            workspaceId={workspaceId}
            workspaceNombre={puesto?.nombre}
            usuarioActualId={usuarioActualId}
            onCerrar={onCerrarAccesos}
         />

         <ModalPanelPermisos
            abierto={modalPanelPermisosAbierto}
            onCerrar={onCerrarPanelPermisos}
         />
      </>
   );
};

export default ModalesVista;
