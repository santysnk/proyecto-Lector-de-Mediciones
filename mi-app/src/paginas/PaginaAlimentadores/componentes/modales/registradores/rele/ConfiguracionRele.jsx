import React, { useState, useEffect, useRef } from "react";
import { usePlantillasRele, useConfigRele } from "../../../../hooks/rele";
import { useTransformadores } from "../../../../hooks/mediciones";
import { useConsolaTest } from "../../../../hooks/agentes";
import {
   interpretarRegistro,
   categoriaRequiereInterpretacion,
   obtenerClaseTipo
} from "../../../../utilidades/interpreteRegistrosREF615";
import ModalPlantillasRele from "./ModalPlantillasRele";
import ModalTransformadores from "../ModalTransformadores";
import SeccionTransformadores from "../SeccionTransformadores";
import "../ConfiguracionRegistrador.css";

// Categorías disponibles para las funcionalidades
const CATEGORIAS = {
   mediciones: { id: "mediciones", nombre: "Mediciones", icono: "📊" },
   estados: { id: "estados", nombre: "Estados y Alarmas", icono: "🚦" },
   sistema: { id: "sistema", nombre: "Sistema", icono: "⚙️" },
};

/**
 * Componente para configurar un registrador de tipo Relé de Protección.
 */
const ConfiguracionRele = ({ configuracionInicial, onChange, agenteId }) => {
   // Hooks de datos
   const {
      plantillas,
      cargando: cargandoPlantillas,
      crearPlantilla,
      actualizarPlantilla,
      eliminarPlantilla,
      obtenerPlantilla,
   } = usePlantillasRele();

   const {
      transformadores,
      obtenerTIs,
      obtenerTVs,
      obtenerRelaciones,
      obtenerPorId: obtenerTransformadorPorId,
      crearTransformador,
      actualizarTransformador,
      eliminarTransformador,
   } = useTransformadores();

   // Hook de configuración
   const configHook = useConfigRele({
      configuracionInicial,
      onChange,
      obtenerPlantilla,
   });

   // Hook de consola
   const consolaHook = useConsolaTest({
      config: configHook.config,
      agenteId,
   });

   // Estado de modales
   const [modalPlantillasAbierto, setModalPlantillasAbierto] = useState(false);
   const [plantillaParaEditar, setPlantillaParaEditar] = useState(null);
   const [modalTransformadoresAbierto, setModalTransformadoresAbierto] = useState(false);
   const [tipoTransformadorModal, setTipoTransformadorModal] = useState("TI");

   // Estado del dropdown de transformadores
   const [dropdownTransformadoresAbierto, setDropdownTransformadoresAbierto] = useState(false);
   const dropdownTransformadoresRef = useRef(null);

   // Cerrar dropdown al hacer click fuera
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

   // Handlers de plantillas
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

   // Aplicar fórmula de transformador
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
         {/* Fila superior: Conexión/Transformadores y Plantilla */}
         <div className="config-rele-row-superior">
            {/* Columna izquierda */}
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
                  onAbrirModal={() => {
                     setTipoTransformadorModal("TI");
                     setModalTransformadoresAbierto(true);
                     setDropdownTransformadoresAbierto(false);
                  }}
               />
            </div>

            {/* Sección Plantilla */}
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

         {/* Fila inferior: Consola + Funcionalidades */}
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
                  tabActivo={configHook.tabFuncionalidadesActivo}
                  setTabActivo={configHook.setTabFuncionalidadesActivo}
                  funcionalidadesPlantilla={configHook.funcionalidadesPlantilla}
                  funcionalidadesActivas={configHook.config.funcionalidadesActivas}
                  filasExpandidas={configHook.filasExpandidas}
                  onToggleFuncionalidad={configHook.handleToggleFuncionalidad}
                  onToggleFilaExpandida={configHook.toggleFilaExpandida}
                  obtenerTransformadorPorId={obtenerTransformadorPorId}
               />
            )}
         </div>

         {/* Modales */}
         <ModalPlantillasRele
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
         />

         <ModalTransformadores
            abierto={modalTransformadoresAbierto}
            onCerrar={() => setModalTransformadoresAbierto(false)}
            transformadores={transformadores}
            onCrear={crearTransformador}
            onActualizar={actualizarTransformador}
            onEliminar={eliminarTransformador}
            tipoInicial={tipoTransformadorModal}
         />
      </div>
   );
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const SeccionConexion = ({
   config,
   onConexionChange,
   onRegistroInicialChange,
   onCantidadRegistrosChange,
   onIntervaloChange,
}) => (
   <div className="config-rele-seccion config-rele-seccion--conexion">
      <h6>📡 Conexión Modbus TCP</h6>
      <div className="config-rele-conexion-fila">
         <div className="config-rele-conexion-grupo">
            <div className="config-rele-campo-inline">
               <label>IP</label>
               <input
                  type="text"
                  value={config.conexion.ip}
                  onChange={(e) => onConexionChange("ip", e.target.value)}
                  placeholder="Ej: 172.16.0.1"
               />
            </div>
            <div className="config-rele-campo-inline">
               <label>Puerto</label>
               <input
                  type="number"
                  value={config.conexion.puerto}
                  onChange={(e) => onConexionChange("puerto", e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="Ej: 502"
               />
            </div>
            <div className="config-rele-campo-inline">
               <label>Unit ID</label>
               <input
                  type="number"
                  value={config.conexion.unitId}
                  onChange={(e) => onConexionChange("unitId", e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="Ej: 1"
               />
            </div>
         </div>
         <div className="config-rele-conexion-grupo">
            <div className="config-rele-campo-inline">
               <label>Inicio</label>
               <input
                  type="number"
                  value={config.registroInicial}
                  onChange={(e) => onRegistroInicialChange(e.target.value)}
                  placeholder="Ej: 120"
                  min={0}
               />
            </div>
            <div className="config-rele-campo-inline">
               <label>Cant.</label>
               <input
                  type="number"
                  value={config.cantidadRegistros}
                  onChange={(e) => onCantidadRegistrosChange(e.target.value)}
                  placeholder="Ej: 80"
                  min={1}
               />
            </div>
         </div>
         <div className="config-rele-conexion-grupo">
            <div className="config-rele-campo-inline config-rele-campo-inline--con-sufijo">
               <label>Intervalo</label>
               <div className="config-rele-input-con-sufijo">
                  <input
                     type="number"
                     value={config.intervalo}
                     onChange={(e) => onIntervaloChange(e.target.value)}
                     min={1}
                  />
                  <span className="config-rele-input-sufijo">s</span>
               </div>
            </div>
         </div>
      </div>
   </div>
);

const SeccionPlantilla = ({
   plantillas,
   config,
   cargandoPlantillas,
   plantillaSeleccionada,
   plantillaNoEncontrada,
   onPlantillaChange,
   onAbrirModalCrear,
   onAbrirModalGestionar,
}) => (
   <div className="config-rele-seccion config-rele-seccion--plantilla">
      <h6>📋 Plantilla de Configuración</h6>

      <div className="config-rele-plantilla-row">
         <select
            value={config.plantillaId}
            onChange={onPlantillaChange}
            className={`config-rele-select ${plantillaNoEncontrada ? "config-rele-select--error" : ""}`}
         >
            <option value="">Seleccionar plantilla...</option>
            {plantillas.map((p) => (
               <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
         </select>

         <button type="button" className="config-rele-btn-plantilla" onClick={onAbrirModalCrear} title="Nueva plantilla">
            + Nueva
         </button>

         <button type="button" className="config-rele-btn-plantilla config-rele-btn-plantilla--secundario" onClick={onAbrirModalGestionar} title="Gestionar plantillas">
            Gestionar
         </button>
      </div>

      {plantillaNoEncontrada && (
         <div className="config-rele-alerta">La plantilla seleccionada ya no existe. Selecciona otra.</div>
      )}

      {plantillas.length === 0 && !cargandoPlantillas && (
         <div className="config-rele-mensaje">No hay plantillas. Crea una para continuar.</div>
      )}

      {plantillaSeleccionada?.descripcion && (
         <div className="config-rele-plantilla-desc">{plantillaSeleccionada.descripcion}</div>
      )}
   </div>
);

const SeccionConsola = ({
   consolaHook,
   registrosCrudos,
   plantillaSeleccionada,
   funcionalidadesPlantilla,
   funcionalidadesActivas,
   obtenerTransformadorPorId,
   aplicarFormulaTransformador,
}) => (
   <div className="config-rele-seccion config-rele-seccion--consola">
      <h6>🖥️ Consola de Test</h6>

      <div className="config-rele-consola-container" ref={consolaHook.containerRef}>
         <div ref={consolaHook.consolaRef} className="config-rele-consola" style={{ width: `${consolaHook.consolaWidth}%` }}>
            {consolaHook.consolaLogs.length === 0 ? (
               <div className="config-rele-consola-vacio">Presiona "Ejecutar Test" para probar la conexión Modbus</div>
            ) : (
               consolaHook.consolaLogs.map((log, index) => (
                  <div key={index} className={`config-rele-consola-linea config-rele-consola-linea--${log.tipo}`}>
                     <span className="config-rele-consola-timestamp">[{log.timestamp}]</span>
                     <span className="config-rele-consola-mensaje">{log.mensaje}</span>
                  </div>
               ))
            )}
         </div>

         <div ref={consolaHook.resizerRef} className="config-rele-resizer" onMouseDown={consolaHook.handleMouseDown} />

         <div className="config-rele-registros-panel" style={{ width: `${100 - consolaHook.consolaWidth}%` }}>
            {!registrosCrudos ? (
               <div className="config-rele-registros-vacio">Los valores aparecerán aquí después del test</div>
            ) : !plantillaSeleccionada ? (
               <div className="config-rele-registros-vacio">Selecciona una plantilla para ver las funcionalidades</div>
            ) : (
               <PanelValoresFuncionalidades
                  registrosCrudos={registrosCrudos}
                  plantillaSeleccionada={plantillaSeleccionada}
                  funcionalidadesPlantilla={funcionalidadesPlantilla}
                  funcionalidadesActivas={funcionalidadesActivas}
                  obtenerTransformadorPorId={obtenerTransformadorPorId}
                  aplicarFormulaTransformador={aplicarFormulaTransformador}
               />
            )}
         </div>
      </div>

      <div className="config-rele-consola-acciones">
         <button type="button" className="config-rele-btn-test" onClick={consolaHook.ejecutarTest} disabled={consolaHook.ejecutandoTest}>
            {consolaHook.ejecutandoTest ? "Ejecutando..." : "Ejecutar Test"}
         </button>
         <button type="button" className="config-rele-btn-csv" onClick={consolaHook.exportarCSV} disabled={!registrosCrudos} title={registrosCrudos ? `Exportar ${registrosCrudos.valores?.length || 0} registros` : "Ejecuta un test primero"}>
            Exportar CSV
         </button>
         <button type="button" className="config-rele-btn-limpiar" onClick={consolaHook.limpiarConsola} disabled={consolaHook.consolaLogs.length === 0 && !registrosCrudos}>
            Limpiar
         </button>
      </div>
   </div>
);

const PanelValoresFuncionalidades = ({
   registrosCrudos,
   plantillaSeleccionada,
   funcionalidadesPlantilla,
   funcionalidadesActivas,
   obtenerTransformadorPorId,
   aplicarFormulaTransformador,
}) => (
   <div className="config-rele-funcionalidades-valores">
      {Object.values(CATEGORIAS).map((categoria) => {
         const funcsActivas = funcionalidadesPlantilla.filter(([funcId, func]) => {
            const estadoActivo = funcionalidadesActivas[funcId];
            return estadoActivo?.habilitado && (func.categoria || "mediciones") === categoria.id;
         });

         if (funcsActivas.length === 0) return null;

         const requiereInterpretacion = categoriaRequiereInterpretacion(categoria.id);

         return (
            <div key={categoria.id} className="config-rele-valores-categoria">
               <div className="config-rele-valores-categoria-titulo">{categoria.nombre}</div>
               {funcsActivas.map(([funcId, plantillaFunc]) => {
                  const estadoActivo = funcionalidadesActivas[funcId];
                  const registrosPlantilla = plantillaFunc.registros || [];
                  const registrosEstado = estadoActivo?.registros || [];
                  const registros = registrosPlantilla.map((regPlantilla, idx) => ({
                     ...regPlantilla,
                     valor: registrosEstado[idx]?.valor ?? regPlantilla.valor,
                     etiqueta: registrosEstado[idx]?.etiqueta ?? regPlantilla.etiqueta,
                     transformadorId: regPlantilla.transformadorId,
                  }));

                  return (
                     <div key={funcId} className="config-rele-valores-func">
                        <div className="config-rele-valores-func-nombre">* {plantillaFunc.nombre}</div>
                        <div className="config-rele-valores-registros">
                           {registros.map((reg, index) => {
                              const regNum = reg.valor;
                              const indiceEnArray = regNum - registrosCrudos.indiceInicial;
                              const valorLeido = indiceEnArray >= 0 && indiceEnArray < registrosCrudos.valores.length
                                 ? registrosCrudos.valores[indiceEnArray]
                                 : null;

                              const transformadorId = reg.transformadorId || null;
                              const valorTransformado = transformadorId && valorLeido !== null
                                 ? aplicarFormulaTransformador(valorLeido, transformadorId)
                                 : null;
                              const transformador = transformadorId ? obtenerTransformadorPorId(transformadorId) : null;

                              const etiquetasPersonalizadas = regNum === 172 && plantillaSeleccionada?.etiquetasBits
                                 ? plantillaSeleccionada.etiquetasBits
                                 : null;

                              const interpretacion = requiereInterpretacion && valorLeido !== null
                                 ? interpretarRegistro(regNum, valorLeido, etiquetasPersonalizadas)
                                 : null;

                              return (
                                 <FilaRegistroValor
                                    key={index}
                                    reg={reg}
                                    index={index}
                                    regNum={regNum}
                                    valorLeido={valorLeido}
                                    valorTransformado={valorTransformado}
                                    transformador={transformador}
                                    interpretacion={interpretacion}
                                 />
                              );
                           })}
                        </div>
                     </div>
                  );
               })}
            </div>
         );
      })}
   </div>
);

const FilaRegistroValor = ({ reg, index, regNum, valorLeido, valorTransformado, transformador, interpretacion }) => (
   <div className="config-rele-valores-registro-container">
      <div className="config-rele-valores-registro">
         {reg.etiqueta || `Reg ${index + 1}`} [{regNum}] = {valorLeido !== null ? valorLeido : "—"}
         {valorTransformado !== null && (
            <span className="config-rele-valor-transformado" title={`Transformado con ${transformador?.nombre}: ${transformador?.formula}`}>
               {" → "}{valorTransformado.toFixed(2)}
            </span>
         )}
      </div>
      {interpretacion && interpretacion.tieneInterpretacion && (
         <div className="config-rele-interpretacion">
            {interpretacion.interpretacionEspecial && (
               <div className={`config-rele-interpretacion-especial ${obtenerClaseTipo(interpretacion.interpretacionEspecial.clase)}`}>
                  {interpretacion.interpretacionEspecial.icono && <span className="interpretacion-icono">{interpretacion.interpretacionEspecial.icono}</span>}
                  <span className="interpretacion-estado">{interpretacion.interpretacionEspecial.estado}</span>
               </div>
            )}
            {interpretacion.bitsActivos.length > 0 && !interpretacion.interpretacionEspecial?.icono && (
               <div className="config-rele-interpretacion-bits">
                  {interpretacion.bitsActivos.map((bit, bitIdx) => (
                     <span key={bitIdx} className={`config-rele-bit ${obtenerClaseTipo(bit.tipo)}`} title={bit.descripcion}>
                        {bit.nombre}
                     </span>
                  ))}
               </div>
            )}
            {interpretacion.bitsActivos.length === 0 && !interpretacion.interpretacionEspecial && (
               <div className="config-rele-interpretacion-vacio">Sin señales activas</div>
            )}
         </div>
      )}
   </div>
);

const SeccionFuncionalidades = ({
   cantidadActivas,
   tabActivo,
   setTabActivo,
   funcionalidadesPlantilla,
   funcionalidadesActivas,
   filasExpandidas,
   onToggleFuncionalidad,
   onToggleFilaExpandida,
   obtenerTransformadorPorId,
}) => (
   <div className="config-rele-seccion config-rele-seccion--funcionalidades">
      <h6>
         🔧 Funcionalidades a Monitorear
         <span className="config-rele-contador">{cantidadActivas} activas</span>
      </h6>

      <div className="config-rele-tabs">
         {Object.values(CATEGORIAS).map((categoria) => {
            const funcsDeCategoria = funcionalidadesPlantilla.filter(([, func]) => (func.categoria || "mediciones") === categoria.id);
            if (funcsDeCategoria.length === 0) return null;

            return (
               <button
                  key={categoria.id}
                  type="button"
                  className={`config-rele-tab ${tabActivo === categoria.id ? "activo" : ""}`}
                  onClick={() => setTabActivo(categoria.id)}
               >
                  <span className="config-rele-tab-icono">{categoria.icono}</span>
                  <span className="config-rele-tab-nombre">{categoria.nombre}</span>
                  <span className="config-rele-tab-contador">{funcsDeCategoria.length}</span>
               </button>
            );
         })}
      </div>

      <div className="config-rele-tab-contenido">
         <TablaFuncionalidades
            tabActivo={tabActivo}
            funcionalidadesPlantilla={funcionalidadesPlantilla}
            funcionalidadesActivas={funcionalidadesActivas}
            filasExpandidas={filasExpandidas}
            onToggleFuncionalidad={onToggleFuncionalidad}
            onToggleFilaExpandida={onToggleFilaExpandida}
            obtenerTransformadorPorId={obtenerTransformadorPorId}
         />
      </div>
   </div>
);

const TablaFuncionalidades = ({
   tabActivo,
   funcionalidadesPlantilla,
   funcionalidadesActivas,
   filasExpandidas,
   onToggleFuncionalidad,
   onToggleFilaExpandida,
   obtenerTransformadorPorId,
}) => {
   const funcsDeCategoria = funcionalidadesPlantilla.filter(([, func]) => (func.categoria || "mediciones") === tabActivo);

   if (funcsDeCategoria.length === 0) {
      return <div className="config-rele-tab-vacio">No hay funcionalidades en esta categoría</div>;
   }

   return (
      <table className="config-rele-tabla">
         <thead>
            <tr>
               <th className="config-rele-tabla-th-check"></th>
               <th className="config-rele-tabla-th-nombre">Funcionalidad</th>
               <th className="config-rele-tabla-th-registros">Registros</th>
               <th className="config-rele-tabla-th-ti-tv">TI / TV</th>
            </tr>
         </thead>
         <tbody>
            {funcsDeCategoria.map(([funcId, plantillaFunc]) => (
               <FilaFuncionalidad
                  key={funcId}
                  funcId={funcId}
                  plantillaFunc={plantillaFunc}
                  estadoActivo={funcionalidadesActivas[funcId]}
                  estaExpandida={filasExpandidas.has(funcId)}
                  onToggle={onToggleFuncionalidad}
                  onToggleExpandir={onToggleFilaExpandida}
                  obtenerTransformadorPorId={obtenerTransformadorPorId}
               />
            ))}
         </tbody>
      </table>
   );
};

const FilaFuncionalidad = ({
   funcId,
   plantillaFunc,
   estadoActivo,
   estaExpandida,
   onToggle,
   onToggleExpandir,
   obtenerTransformadorPorId,
}) => {
   const estaHabilitado = estadoActivo?.habilitado || false;
   const registrosPlantilla = plantillaFunc.registros || [];
   const registrosEstado = estadoActivo?.registros || [];
   const registros = registrosPlantilla.map((regPlantilla, idx) => ({
      ...regPlantilla,
      valor: registrosEstado[idx]?.valor ?? regPlantilla.valor,
      etiqueta: registrosEstado[idx]?.etiqueta ?? regPlantilla.etiqueta,
      transformadorId: regPlantilla.transformadorId,
   }));

   const transformadoresUnicos = new Map();
   registros.forEach((reg) => {
      if (reg.transformadorId) {
         const t = obtenerTransformadorPorId(reg.transformadorId);
         if (t) transformadoresUnicos.set(reg.transformadorId, t);
      }
   });
   const cantTransformadores = transformadoresUnicos.size;
   const primerTransformador = cantTransformadores > 0 ? Array.from(transformadoresUnicos.values())[0] : null;

   const resumenRegistros = registros.map((r) => `${r.etiqueta || "Reg"}: ${r.valor}`).join(" | ");

   return (
      <React.Fragment>
         <tr className={`config-rele-tabla-fila ${estaHabilitado ? "activo" : "inactivo"} ${estaExpandida ? "expandida" : ""}`}>
            <td className="config-rele-tabla-td-check">
               <input type="checkbox" checked={estaHabilitado} onChange={() => onToggle(funcId)} />
            </td>
            <td className="config-rele-tabla-td-nombre">
               <button type="button" className="config-rele-tabla-btn-expandir" onClick={() => onToggleExpandir(funcId)}>
                  <span className={`config-rele-tabla-chevron ${estaExpandida ? "expandido" : ""}`}>▶</span>
                  <span className="config-rele-tabla-nombre-texto">{plantillaFunc.nombre}</span>
               </button>
            </td>
            <td className="config-rele-tabla-td-registros">
               {!estaExpandida && <span className="config-rele-tabla-resumen">{resumenRegistros}</span>}
            </td>
            <td className="config-rele-tabla-td-ti-tv">
               {cantTransformadores > 1 ? (
                  <div className="config-rele-tabla-transformador">
                     <span className="config-rele-tabla-ti-tv-nombre">{cantTransformadores} diferentes</span>
                     <span className="config-rele-tabla-ti-tv-formula">(ver detalle)</span>
                  </div>
               ) : primerTransformador ? (
                  <div className="config-rele-tabla-transformador">
                     <span className="config-rele-tabla-ti-tv-nombre">{primerTransformador.nombre}</span>
                     <span className="config-rele-tabla-ti-tv-formula">{primerTransformador.formula}</span>
                  </div>
               ) : (
                  <span className="config-rele-tabla-sin-ti-tv">—</span>
               )}
            </td>
         </tr>
         {estaExpandida && (
            <tr className="config-rele-tabla-fila-expandida">
               <td colSpan={4}>
                  <div className="config-rele-tabla-expandido">
                     <table className="config-rele-subtabla">
                        <thead>
                           <tr>
                              <th>Etiqueta</th>
                              <th>Registro</th>
                              <th>TI / TV / Relación</th>
                           </tr>
                        </thead>
                        <tbody>
                           {registros.map((reg, index) => {
                              const transformadorReg = reg.transformadorId ? obtenerTransformadorPorId(reg.transformadorId) : null;
                              return (
                                 <tr key={index}>
                                    <td>{reg.etiqueta || `Reg ${index + 1}`}</td>
                                    <td>{reg.valor}</td>
                                    <td>
                                       {transformadorReg ? (
                                          <span className="config-rele-subtabla-transformador">
                                             {transformadorReg.nombre}
                                             <span className="config-rele-subtabla-formula">{transformadorReg.formula}</span>
                                          </span>
                                       ) : (
                                          <span className="config-rele-subtabla-sin-ti">—</span>
                                       )}
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </td>
            </tr>
         )}
      </React.Fragment>
   );
};

export default ConfiguracionRele;
