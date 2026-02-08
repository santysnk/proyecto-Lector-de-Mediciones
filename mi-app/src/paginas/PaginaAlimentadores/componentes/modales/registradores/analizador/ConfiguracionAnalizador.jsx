// componentes/modales/registradores/analizador/ConfiguracionAnalizador.jsx
// Componente para configurar un registrador de tipo Analizador de Redes

import React, { useState, useEffect, useRef } from "react";
import { usePlantillasAnalizador, useConfigAnalizador } from "../../../../hooks/analizador";
import { useTransformadores } from "../../../../hooks/mediciones";
import { useConsolaTest } from "../../../../hooks/agentes";
import ModalPlantillasAnalizador from "./ModalPlantillasAnalizador";
import SeccionTransformadores from "../SeccionTransformadores";
import ModalTransformadores from "../ModalTransformadores";
import { SeccionConexion, SeccionPlantilla } from "./SeccionesConfigAnalizador";
import { SeccionConsola } from "./ConsolaAnalizador";
import { SeccionFuncionalidades } from "./FuncionalidadesAnalizador";
import "../ConfiguracionRegistrador.css";

const ConfiguracionAnalizador = ({ configuracionInicial, onChange, agenteId, workspaceId }) => {
   const {
      plantillas,
      cargando: cargandoPlantillas,
      crearPlantilla,
      actualizarPlantilla,
      eliminarPlantilla,
      obtenerPlantilla,
   } = usePlantillasAnalizador(workspaceId);

   const {
      transformadores,
      obtenerTIs,
      obtenerTVs,
      obtenerRelaciones,
      obtenerPorId: obtenerTransformadorPorId,
      crearTransformador,
      actualizarTransformador,
      eliminarTransformador,
   } = useTransformadores(workspaceId);

   const configHook = useConfigAnalizador({
      configuracionInicial,
      onChange,
      obtenerPlantilla,
   });

   const consolaHook = useConsolaTest({
      config: configHook.config,
      agenteId,
   });

   const [modalPlantillasAbierto, setModalPlantillasAbierto] = useState(false);
   const [plantillaParaEditar, setPlantillaParaEditar] = useState(null);
   const [modalTransformadoresAbierto, setModalTransformadoresAbierto] = useState(false);
   const [dropdownTransformadoresAbierto, setDropdownTransformadoresAbierto] = useState(false);
   const dropdownTransformadoresRef = useRef(null);

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (dropdownTransformadoresRef.current && !dropdownTransformadoresRef.current.contains(event.target)) {
            setDropdownTransformadoresAbierto(false);
         }
      };

      if (dropdownTransformadoresAbierto) {
         document.addEventListener("mousedown", handleClickOutside);
      }

      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, [dropdownTransformadoresAbierto]);

   const handleCrearPlantilla = (datos) => {
      const nueva = crearPlantilla(datos);
      if (nueva) {
         configHook.aplicarPlantillaCreada(nueva);
      }
      return nueva;
   };

   const handleActualizarPlantilla = (id, datos) => {
      const exito = actualizarPlantilla(id, datos);
      if (exito && configHook.config.plantillaId === id) {
         const plantillaActualizada = { id, ...datos, funcionalidades: datos.funcionalidades || {} };
         configHook.actualizarFuncionalidades(plantillaActualizada);
      }
      return exito;
   };

   const aplicarFormulaTransformador = (valor, transformadorId) => {
      if (valor === null || valor === undefined || !transformadorId) return null;

      const transformador = obtenerTransformadorPorId(transformadorId);
      if (!transformador || !transformador.formula) return null;

      try {
         const x = valor;
         // eslint-disable-next-line no-new-func
         const resultado = new Function("x", `return ${transformador.formula}`)(x);
         return typeof resultado === "number" && !isNaN(resultado) ? resultado : null;
      } catch (error) {
         console.error("Error al aplicar fórmula del transformador:", error);
         return null;
      }
   };

   return (
      <div className="config-rele">
         <div className="config-rele-row-superior">
            <div className="config-rele-col-izquierda">
               <SeccionConexion
                  config={configHook.config}
                  onConexionChange={configHook.handleConexionChange}
                  onRegistroInicialChange={configHook.handleRegistroInicialChange}
                  onCantidadRegistrosChange={configHook.handleCantidadRegistrosChange}
                  onIntervaloChange={configHook.handleIntervaloChange}
               />

               <SeccionTransformadores
                  dropdownAbierto={dropdownTransformadoresAbierto}
                  setDropdownAbierto={setDropdownTransformadoresAbierto}
                  dropdownRef={dropdownTransformadoresRef}
                  obtenerTIs={obtenerTIs}
                  obtenerTVs={obtenerTVs}
                  obtenerRelaciones={obtenerRelaciones}
                  onAbrirModal={() => setModalTransformadoresAbierto(true)}
               />
            </div>

            <SeccionPlantilla
               plantillas={plantillas}
               config={configHook.config}
               cargandoPlantillas={cargandoPlantillas}
               plantillaSeleccionada={configHook.plantillaSeleccionada}
               plantillaNoEncontrada={configHook.plantillaNoEncontrada}
               onPlantillaChange={(e) => configHook.handlePlantillaChange(e.target.value)}
               onAbrirModalCrear={() => {
                  setPlantillaParaEditar(null);
                  setModalPlantillasAbierto(true);
               }}
               onAbrirModalGestionar={() => {
                  setPlantillaParaEditar(null);
                  setModalPlantillasAbierto(true);
               }}
            />
         </div>

         <div className="config-rele-row-inferior">
            <SeccionConsola
               consolaHook={consolaHook}
               registrosCrudos={consolaHook.registrosCrudos}
               plantillaSeleccionada={configHook.plantillaSeleccionada}
               funcionalidadesPlantilla={configHook.funcionalidadesPlantilla}
               funcionalidadesActivas={configHook.config.funcionalidadesActivas}
               obtenerTransformadorPorId={obtenerTransformadorPorId}
               aplicarFormulaTransformador={aplicarFormulaTransformador}
            />

            {configHook.plantillaSeleccionada && configHook.funcionalidadesPlantilla.length > 0 && (
               <SeccionFuncionalidades
                  cantidadActivas={configHook.cantidadActivas}
                  funcionalidadesPlantilla={configHook.funcionalidadesPlantilla}
                  funcionalidadesActivas={configHook.config.funcionalidadesActivas}
                  filasExpandidas={configHook.filasExpandidas}
                  onToggleFuncionalidad={configHook.handleToggleFuncionalidad}
                  onToggleFilaExpandida={configHook.toggleFilaExpandida}
                  obtenerTransformadorPorId={obtenerTransformadorPorId}
               />
            )}
         </div>

         <ModalPlantillasAnalizador
            abierto={modalPlantillasAbierto}
            onCerrar={() => {
               setModalPlantillasAbierto(false);
               setPlantillaParaEditar(null);
            }}
            plantillas={plantillas}
            onCrear={handleCrearPlantilla}
            onActualizar={handleActualizarPlantilla}
            onEliminar={eliminarPlantilla}
            plantillaEditando={plantillaParaEditar}
            obtenerTIs={obtenerTIs}
            obtenerTVs={obtenerTVs}
            obtenerRelaciones={obtenerRelaciones}
         />

         <ModalTransformadores
            abierto={modalTransformadoresAbierto}
            onCerrar={() => setModalTransformadoresAbierto(false)}
            transformadores={transformadores}
            onCrear={crearTransformador}
            onActualizar={actualizarTransformador}
            onEliminar={eliminarTransformador}
         />
      </div>
   );
};

export default ConfiguracionAnalizador;
