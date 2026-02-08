// componentes/modales/registradores/analizador/FuncionalidadesAnalizador.jsx
// Tabla de funcionalidades y filas expandibles para ConfiguracionAnalizador

import React from "react";

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

const TablaFuncionalidades = ({
   funcionalidadesPlantilla,
   funcionalidadesActivas,
   filasExpandidas,
   onToggleFuncionalidad,
   onToggleFilaExpandida,
   obtenerTransformadorPorId,
}) => {
   if (funcionalidadesPlantilla.length === 0) {
      return <div className="config-rele-tab-vacio">No hay funcionalidades configuradas</div>;
   }

   return (
      <table className="config-rele-tabla">
         <thead>
            <tr>
               <th className="config-rele-tabla-th-check"></th>
               <th className="config-rele-tabla-th-nombre">Medición</th>
               <th className="config-rele-tabla-th-registros">Registros</th>
               <th className="config-rele-tabla-th-ti-tv">TI / TV</th>
            </tr>
         </thead>
         <tbody>
            {funcionalidadesPlantilla.map(([funcId, plantillaFunc]) => (
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

export const SeccionFuncionalidades = ({
   cantidadActivas,
   funcionalidadesPlantilla,
   funcionalidadesActivas,
   filasExpandidas,
   onToggleFuncionalidad,
   onToggleFilaExpandida,
   obtenerTransformadorPorId,
}) => (
   <div className="config-rele-seccion config-rele-seccion--funcionalidades">
      <h6>
         📊 Mediciones a Monitorear
         <span className="config-rele-contador">{cantidadActivas} activas</span>
      </h6>

      <div className="config-rele-tab-contenido">
         <TablaFuncionalidades
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
