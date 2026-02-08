// componentes/modales/registradores/analizador/ConsolaAnalizador.jsx
// Sección de consola de test y panel de valores para ConfiguracionAnalizador

import React from "react";

const PanelValoresFuncionalidades = ({
   registrosCrudos,
   funcionalidadesPlantilla,
   funcionalidadesActivas,
   obtenerTransformadorPorId,
   aplicarFormulaTransformador,
}) => (
   <div className="config-rele-funcionalidades-valores">
      {funcionalidadesPlantilla.map(([funcId, plantillaFunc]) => {
         const estadoActivo = funcionalidadesActivas[funcId];
         if (!estadoActivo?.habilitado) return null;

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

                     return (
                        <div key={index} className="config-rele-valores-registro">
                           {reg.etiqueta || `Reg ${index + 1}`} [{regNum}] = {valorLeido !== null ? valorLeido : "—"}
                           {valorTransformado !== null && (
                              <span className="config-rele-valor-transformado" title={`Transformado con ${transformador?.nombre}: ${transformador?.formula}`}>
                                 {" → "}{valorTransformado.toFixed(2)}
                              </span>
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>
         );
      })}
   </div>
);

export const SeccionConsola = ({
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
