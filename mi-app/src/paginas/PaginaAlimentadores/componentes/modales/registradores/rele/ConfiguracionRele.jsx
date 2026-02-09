import React, { useState, useEffect, useRef } from "react";
import { usePlantillasRele, useConfigRele } from "../../../../hooks/rele";
import { useTransformadores } from "../../../../hooks/mediciones";
import { useConsolaTest } from "../../../../hooks/agentes";
import ModalPlantillasRele from "./ModalPlantillasRele";
import ModalTransformadores from "../ModalTransformadores";
import SeccionTransformadores from "../SeccionTransformadores";
import { SeccionConexion, SeccionPlantilla, SeccionConsola, SeccionFuncionalidades } from "./ComponentesConfigRele";
import "../ConfiguracionRegistrador.css";

const ConfiguracionRele = ({ configuracionInicial, onChange, agenteId, workspaceId, plantillasGlobal = false }) => {
   const { plantillas, cargando: cargandoPlantillas, crearPlantilla, actualizarPlantilla, eliminarPlantilla, obtenerPlantilla } = usePlantillasRele(workspaceId, { global: plantillasGlobal });
   const { transformadores, obtenerTIs, obtenerTVs, obtenerRelaciones, obtenerPorId: obtenerTransformadorPorId, crearTransformador, actualizarTransformador, eliminarTransformador } = useTransformadores(workspaceId, { global: plantillasGlobal });
   const configHook = useConfigRele({ configuracionInicial, onChange, obtenerPlantilla });
   const consolaHook = useConsolaTest({ config: configHook.config, agenteId });

   const [modalPlantillasAbierto, setModalPlantillasAbierto] = useState(false);
   const [plantillaParaEditar, setPlantillaParaEditar] = useState(null);
   const [modalTransformadoresAbierto, setModalTransformadoresAbierto] = useState(false);
   const [tipoTransformadorModal, setTipoTransformadorModal] = useState("TI");
   const [dropdownTransformadoresAbierto, setDropdownTransformadoresAbierto] = useState(false);
   const dropdownTransformadoresRef = useRef(null);

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (dropdownTransformadoresRef.current && !dropdownTransformadoresRef.current.contains(event.target)) setDropdownTransformadoresAbierto(false);
      };
      if (dropdownTransformadoresAbierto) document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, [dropdownTransformadoresAbierto]);

   const handleCrearPlantilla = (datos) => {
      const nueva = crearPlantilla(datos);
      if (nueva) configHook.aplicarPlantillaCreada(nueva);
      return nueva;
   };

   const handleActualizarPlantilla = (id, datos) => {
      const exito = actualizarPlantilla(id, datos);
      if (exito && configHook.config.plantillaId === id) {
         configHook.actualizarFuncionalidades({ id, ...datos, funcionalidades: datos.funcionalidades || {} });
      }
      return exito;
   };

   const aplicarFormulaTransformador = (valor, transformadorId) => {
      if (valor === null || valor === undefined || !transformadorId) return null;
      const transformador = obtenerTransformadorPorId(transformadorId);
      if (!transformador || !transformador.formula) return null;
      try {
         // eslint-disable-next-line no-new-func
         const resultado = new Function("x", `return ${transformador.formula}`)(valor);
         return typeof resultado === "number" && !isNaN(resultado) ? resultado : null;
      } catch { return null; }
   };

   return (
      <div className="config-rele">
         <div className="config-rele-row-superior">
            <div className="config-rele-col-izquierda">
               <SeccionConexion config={configHook.config} onConexionChange={configHook.handleConexionChange} onRegistroInicialChange={configHook.handleRegistroInicialChange} onCantidadRegistrosChange={configHook.handleCantidadRegistrosChange} onIntervaloChange={configHook.handleIntervaloChange} />
               <SeccionTransformadores dropdownAbierto={dropdownTransformadoresAbierto} setDropdownAbierto={setDropdownTransformadoresAbierto} dropdownRef={dropdownTransformadoresRef} obtenerTIs={obtenerTIs} obtenerTVs={obtenerTVs} obtenerRelaciones={obtenerRelaciones} onAbrirModal={() => { setTipoTransformadorModal("TI"); setModalTransformadoresAbierto(true); setDropdownTransformadoresAbierto(false); }} />
            </div>
            <SeccionPlantilla plantillas={plantillas} config={configHook.config} cargandoPlantillas={cargandoPlantillas} plantillaSeleccionada={configHook.plantillaSeleccionada} plantillaNoEncontrada={configHook.plantillaNoEncontrada} onPlantillaChange={(e) => configHook.handlePlantillaChange(e.target.value)} onAbrirModalCrear={() => { setPlantillaParaEditar(null); setModalPlantillasAbierto(true); }} onAbrirModalGestionar={() => { setPlantillaParaEditar(null); setModalPlantillasAbierto(true); }} />
         </div>
         <div className="config-rele-row-inferior">
            <SeccionConsola consolaHook={consolaHook} registrosCrudos={consolaHook.registrosCrudos} plantillaSeleccionada={configHook.plantillaSeleccionada} funcionalidadesPlantilla={configHook.funcionalidadesPlantilla} funcionalidadesActivas={configHook.config.funcionalidadesActivas} obtenerTransformadorPorId={obtenerTransformadorPorId} aplicarFormulaTransformador={aplicarFormulaTransformador} />
            {configHook.plantillaSeleccionada && configHook.funcionalidadesPlantilla.length > 0 && (
               <SeccionFuncionalidades cantidadActivas={configHook.cantidadActivas} tabActivo={configHook.tabFuncionalidadesActivo} setTabActivo={configHook.setTabFuncionalidadesActivo} funcionalidadesPlantilla={configHook.funcionalidadesPlantilla} funcionalidadesActivas={configHook.config.funcionalidadesActivas} filasExpandidas={configHook.filasExpandidas} onToggleFuncionalidad={configHook.handleToggleFuncionalidad} onToggleFilaExpandida={configHook.toggleFilaExpandida} obtenerTransformadorPorId={obtenerTransformadorPorId} />
            )}
         </div>
         <ModalPlantillasRele abierto={modalPlantillasAbierto} onCerrar={() => { setModalPlantillasAbierto(false); setPlantillaParaEditar(null); }} plantillas={plantillas} onCrear={handleCrearPlantilla} onActualizar={handleActualizarPlantilla} onEliminar={eliminarPlantilla} plantillaEditando={plantillaParaEditar} workspaceId={workspaceId} />
         <ModalTransformadores abierto={modalTransformadoresAbierto} onCerrar={() => setModalTransformadoresAbierto(false)} transformadores={transformadores} onCrear={crearTransformador} onActualizar={actualizarTransformador} onEliminar={eliminarTransformador} tipoInicial={tipoTransformadorModal} />
      </div>
   );
};

export default ConfiguracionRele;
