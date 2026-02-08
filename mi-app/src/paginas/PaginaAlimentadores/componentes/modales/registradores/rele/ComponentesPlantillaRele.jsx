// modales/registradores/rele/ComponentesPlantillaRele.jsx
// Componentes auxiliares para ModalPlantillasRele

import { useState } from "react";
import { SEVERIDADES_DISPONIBLES } from "../../../../utilidades/interpreteRegistrosREF615";
import { CATEGORIAS_FUNCIONALIDADES } from "../../../../hooks/rele";
import DropdownTransformador from "../DropdownTransformador";

export const ListaPlantillas = ({ plantillas, onCrear, onEditar, onEliminar, contarFuncionalidades }) => (
   <>
      <button className="modal-plantillas-btn-crear" onClick={onCrear}>+ Nueva Plantilla</button>
      {plantillas.length === 0 ? (
         <div className="modal-plantillas-vacio">
            <span className="modal-plantillas-vacio-icono">📋</span>
            <p>No hay plantillas creadas</p>
            <p className="modal-plantillas-hint">Crea una plantilla para empezar a configurar relés</p>
         </div>
      ) : (
         <div className="modal-plantillas-lista">
            {plantillas.map((plantilla) => (
               <div key={plantilla.id} className="modal-plantillas-item">
                  <div className="modal-plantillas-item-info">
                     <span className="modal-plantillas-item-nombre">📋 {plantilla.nombre}</span>
                     {plantilla.descripcion && <span className="modal-plantillas-item-desc">{plantilla.descripcion}</span>}
                     <span className="modal-plantillas-item-func">{contarFuncionalidades(plantilla)} funcionalidades</span>
                  </div>
                  <div className="modal-plantillas-item-acciones">
                     <button className="modal-plantillas-btn-editar" onClick={() => onEditar(plantilla)} title="Editar">Editar</button>
                     <button className="modal-plantillas-btn-eliminar" onClick={() => onEliminar(plantilla)} title="Eliminar">Eliminar</button>
                  </div>
               </div>
            ))}
         </div>
      )}
   </>
);

export const SeccionAgregarFuncionalidad = ({ nuevaFunc, setNuevaFunc, onAgregar }) => (
   <div className="modal-plantillas-seccion">
      <h4>Agregar Funcionalidad</h4>
      <div className="modal-plantillas-agregar-func">
         <div className="modal-plantillas-agregar-row">
            <div className="modal-plantillas-agregar-campo">
               <label>Nombre</label>
               <input type="text" value={nuevaFunc.nombre} onChange={(e) => setNuevaFunc((prev) => ({ ...prev, nombre: e.target.value }))} placeholder="Ej: Corrientes de Fase" />
            </div>
            <div className="modal-plantillas-agregar-campo modal-plantillas-agregar-campo--pequeño">
               <label>Cant. Reg.</label>
               <input type="number" value={nuevaFunc.cantidad} onChange={(e) => setNuevaFunc((prev) => ({ ...prev, cantidad: e.target.value }))} min={1} max={20} />
            </div>
            <div className="modal-plantillas-agregar-campo modal-plantillas-agregar-campo--categoria">
               <label>Categoría</label>
               <select value={nuevaFunc.categoria} onChange={(e) => setNuevaFunc((prev) => ({ ...prev, categoria: e.target.value }))}>
                  {Object.values(CATEGORIAS_FUNCIONALIDADES).map((cat) => (
                     <option key={cat.id} value={cat.id}>{cat.icono} {cat.nombre}</option>
                  ))}
               </select>
            </div>
            <button type="button" className="modal-plantillas-btn-agregar" onClick={onAgregar}>+ Agregar</button>
         </div>
      </div>
   </div>
);

const TarjetaFuncionalidad = ({
   func, categoria, onToggle, onMoverArriba, onMoverAbajo, onEliminar,
   onCambiarEtiqueta, onCambiarValorRegistro, onCambiarTransformadorRegistro,
   onCambiarConfigHistorial, onCambiarEtiquetaBitFunc, onCambiarSeveridadBitFunc,
   onAgregarBitFunc, onQuitarBitFunc, onPegarEtiquetasBitsFunc,
   portapapelesEtiquetasBits, setPortapapelesEtiquetasBits, onGuardarSinCerrar,
   obtenerTIs, obtenerTVs, obtenerRelaciones,
}) => {
   const [etiquetasBitsAbierto, setEtiquetasBitsAbierto] = useState(false);
   const [guardando, setGuardando] = useState(false);
   const configHistorial = func.configHistorial || {};
   const tieneMultiplesRegistros = func.registros && func.registros.length > 1;
   const tieneTimelineBits = configHistorial.timelineBits === true;
   const etiquetasBits = func.etiquetasBits || {};
   const indicesBits = Object.keys(etiquetasBits).map(Number).sort((a, b) => a - b);
   const hayPortapapeles = portapapelesEtiquetasBits && Object.keys(portapapelesEtiquetasBits).length > 0;

   const handleGuardarEtiquetas = async () => {
      setGuardando(true);
      try { await onGuardarSinCerrar(); } finally { setGuardando(false); }
   };

   const handleCopiarEtiquetas = () => {
      const copia = {};
      Object.entries(etiquetasBits).forEach(([indice, config]) => { copia[indice] = { ...config }; });
      setPortapapelesEtiquetasBits(copia);
   };

   const handlePegarEtiquetas = () => {
      if (hayPortapapeles) onPegarEtiquetasBitsFunc(func.id, portapapelesEtiquetasBits);
   };

   return (
      <div className={`modal-plantillas-func-card ${func.habilitado ? "activo" : "inactivo"}`}>
         <div className="modal-plantillas-func-header">
            <label className="modal-plantillas-func-check">
               <input type="checkbox" checked={func.habilitado} onChange={() => onToggle(func.id)} />
               <span className="modal-plantillas-func-nombre">{func.nombre}</span>
            </label>
            <div className="modal-plantillas-func-acciones">
               <button type="button" className="modal-plantillas-func-mover" onClick={() => onMoverArriba(func.id)} title="Mover arriba">▲</button>
               <button type="button" className="modal-plantillas-func-mover" onClick={() => onMoverAbajo(func.id)} title="Mover abajo">▼</button>
               <button type="button" className="modal-plantillas-func-eliminar" onClick={() => onEliminar(func.id)} title="Eliminar funcionalidad">×</button>
            </div>
         </div>

         <div className="modal-plantillas-registros">
            {func.registros.map((reg, index) => (
               <div key={index} className="modal-plantillas-registro-item">
                  <input type="text" className="modal-plantillas-registro-etiqueta" value={reg.etiqueta} onChange={(e) => onCambiarEtiqueta(func.id, index, e.target.value)} placeholder={`Etiqueta ${index + 1}`} disabled={!func.habilitado} />
                  <span className="modal-plantillas-registro-separador">→</span>
                  <input type="number" className="modal-plantillas-registro-valor" value={reg.valor} onChange={(e) => onCambiarValorRegistro(func.id, index, e.target.value)} placeholder={`${137 + index}`} disabled={!func.habilitado} min={0} />
                  {categoria.id === "mediciones" && (
                     <DropdownTransformador value={reg.transformadorId || ""} onChange={(id) => onCambiarTransformadorRegistro(func.id, index, id)} disabled={!func.habilitado} tis={obtenerTIs()} tvs={obtenerTVs()} relaciones={obtenerRelaciones()} />
                  )}
               </div>
            ))}
         </div>

         {/* Configuración de Historial */}
         <div className="modal-plantillas-config-historial">
            <div className="modal-plantillas-config-historial-header">
               <span className="modal-plantillas-config-historial-icono">📈</span>
               <span>Historial</span>
            </div>
            <div className="modal-plantillas-config-historial-controles">
               <label className="modal-plantillas-config-check">
                  <input type="checkbox" checked={configHistorial.habilitado !== false} onChange={(e) => onCambiarConfigHistorial(func.id, "habilitado", e.target.checked)} disabled={!func.habilitado} />
                  <span>Mostrar</span>
               </label>
               {categoria.id === "mediciones" && tieneMultiplesRegistros && (
                  <label className="modal-plantillas-config-check" title="Agrega tab de promedio de todos los registros">
                     <input type="checkbox" checked={configHistorial.mostrarPromedio === true} onChange={(e) => onCambiarConfigHistorial(func.id, "mostrarPromedio", e.target.checked)} disabled={!func.habilitado || configHistorial.habilitado === false} />
                     <span>Promedio</span>
                  </label>
               )}
               {categoria.id === "mediciones" && (
                  <label className="modal-plantillas-config-check" title="Combina registros HIGH/LOW en valor de 32 bits: (HIGH << 16) | LOW">
                     <input type="checkbox" checked={configHistorial.combinar32bits === true} onChange={(e) => onCambiarConfigHistorial(func.id, "combinar32bits", e.target.checked)} disabled={!func.habilitado || configHistorial.habilitado === false} />
                     <span>32 bits</span>
                  </label>
               )}
               {(categoria.id === "estados" || categoria.id === "alarmas") && (
                  <label className="modal-plantillas-config-check" title="Muestra timeline visual de bits activos">
                     <input type="checkbox" checked={configHistorial.timelineBits === true} onChange={(e) => onCambiarConfigHistorial(func.id, "timelineBits", e.target.checked)} disabled={!func.habilitado || configHistorial.habilitado === false} />
                     <span>Timeline bits</span>
                  </label>
               )}
            </div>
         </div>

         {/* Etiquetas de bits */}
         {tieneTimelineBits && func.habilitado && (
            <div className="modal-plantillas-etiquetas-bits-func">
               <div className="modal-plantillas-etiquetas-bits-header" onClick={() => setEtiquetasBitsAbierto(!etiquetasBitsAbierto)}>
                  <span className={`modal-plantillas-chevron-small ${etiquetasBitsAbierto ? "abierto" : ""}`}>▶</span>
                  <span>Etiquetas de bits</span>
                  {indicesBits.length > 0 && <span className="modal-plantillas-badge-small">{indicesBits.length}</span>}
               </div>
               {etiquetasBitsAbierto && (
                  <div className="modal-plantillas-etiquetas-bits-contenido">
                     {indicesBits.length === 0 ? (
                        <div className="modal-plantillas-bits-vacio">No hay bits configurados. Usa el botón "+ Agregar bit" para comenzar.</div>
                     ) : (
                        indicesBits.map((bit) => (
                           <div key={bit} className="modal-plantillas-bit-item-func">
                              <span className="modal-plantillas-bit-numero-func">Bit {bit}:</span>
                              <input type="text" className="modal-plantillas-bit-etiqueta-func" value={etiquetasBits[bit]?.texto || ""} onChange={(e) => onCambiarEtiquetaBitFunc(func.id, bit, e.target.value)} placeholder="Sin etiqueta" />
                              <select className={`modal-plantillas-bit-severidad-func severidad-${etiquetasBits[bit]?.severidad || "info"}`} value={etiquetasBits[bit]?.severidad || "info"} onChange={(e) => onCambiarSeveridadBitFunc(func.id, bit, e.target.value)}>
                                 {SEVERIDADES_DISPONIBLES.map((sev) => (<option key={sev.id} value={sev.id}>{sev.nombre}</option>))}
                              </select>
                           </div>
                        ))
                     )}
                     <div className="modal-plantillas-bits-acciones">
                        <div className="modal-plantillas-bits-botones">
                           <button type="button" className="modal-plantillas-btn-bit modal-plantillas-btn-agregar-bit" onClick={() => onAgregarBitFunc(func.id)} title="Agregar un nuevo bit">+ Agregar bit</button>
                           <button type="button" className="modal-plantillas-btn-bit modal-plantillas-btn-quitar-bit" onClick={() => onQuitarBitFunc(func.id)} disabled={indicesBits.length === 0} title="Quitar el último bit">- Quitar bit</button>
                        </div>
                        <div className="modal-plantillas-bits-botones-derecha">
                           <button type="button" className="modal-plantillas-btn-bit modal-plantillas-btn-copiar-bits" onClick={handleCopiarEtiquetas} disabled={indicesBits.length === 0} title="Copiar etiquetas de bits">Copiar</button>
                           <button type="button" className="modal-plantillas-btn-bit modal-plantillas-btn-pegar-bits" onClick={handlePegarEtiquetas} disabled={!hayPortapapeles} title={hayPortapapeles ? `Pegar ${Object.keys(portapapelesEtiquetasBits).length} etiquetas` : "No hay etiquetas copiadas"}>Pegar</button>
                           <button type="button" className="modal-plantillas-btn-guardar-bits" onClick={handleGuardarEtiquetas} disabled={guardando} title="Guardar etiquetas sin cerrar el modal">{guardando ? "Guardando..." : "Guardar"}</button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export const SeccionFuncionalidades = ({
   funcionalidades, onToggle, onMoverArriba, onMoverAbajo, onEliminar,
   onCambiarEtiqueta, onCambiarValorRegistro, onCambiarTransformadorRegistro,
   onCambiarConfigHistorial, onCambiarEtiquetaBitFunc, onCambiarSeveridadBitFunc,
   onAgregarBitFunc, onQuitarBitFunc, onPegarEtiquetasBitsFunc,
   portapapelesEtiquetasBits, setPortapapelesEtiquetasBits, onGuardarSinCerrar,
   obtenerTIs, obtenerTVs, obtenerRelaciones,
}) => (
   <div className="modal-plantillas-seccion">
      <h4>Funcionalidades ({funcionalidades.length})</h4>
      {Object.values(CATEGORIAS_FUNCIONALIDADES).map((categoria) => {
         const funcsDeCategoria = funcionalidades.filter((f) => (f.categoria || "mediciones") === categoria.id);
         if (funcsDeCategoria.length === 0) return null;
         return (
            <div key={categoria.id} className="modal-plantillas-categoria">
               <h5>{categoria.icono} {categoria.nombre}</h5>
               <div className="modal-plantillas-func-lista">
                  {funcsDeCategoria.map((func) => (
                     <TarjetaFuncionalidad
                        key={func.id} func={func} categoria={categoria}
                        onToggle={onToggle} onMoverArriba={onMoverArriba} onMoverAbajo={onMoverAbajo} onEliminar={onEliminar}
                        onCambiarEtiqueta={onCambiarEtiqueta} onCambiarValorRegistro={onCambiarValorRegistro}
                        onCambiarTransformadorRegistro={onCambiarTransformadorRegistro} onCambiarConfigHistorial={onCambiarConfigHistorial}
                        onCambiarEtiquetaBitFunc={onCambiarEtiquetaBitFunc} onCambiarSeveridadBitFunc={onCambiarSeveridadBitFunc}
                        onAgregarBitFunc={onAgregarBitFunc} onQuitarBitFunc={onQuitarBitFunc}
                        onPegarEtiquetasBitsFunc={onPegarEtiquetasBitsFunc} portapapelesEtiquetasBits={portapapelesEtiquetasBits}
                        setPortapapelesEtiquetasBits={setPortapapelesEtiquetasBits} onGuardarSinCerrar={onGuardarSinCerrar}
                        obtenerTIs={obtenerTIs} obtenerTVs={obtenerTVs} obtenerRelaciones={obtenerRelaciones}
                     />
                  ))}
               </div>
            </div>
         );
      })}
   </div>
);

export const FormularioPlantilla = ({
   error, nombre, setNombre, descripcion, setDescripcion,
   nuevaFunc, setNuevaFunc, onAgregarFuncionalidad,
   funcionalidades, onToggleFuncionalidad, onMoverArriba, onMoverAbajo, onEliminarFuncionalidad,
   onCambiarEtiqueta, onCambiarValorRegistro, onCambiarTransformadorRegistro,
   onCambiarConfigHistorial, onCambiarEtiquetaBitFunc, onCambiarSeveridadBitFunc,
   onAgregarBitFunc, onQuitarBitFunc, onPegarEtiquetasBitsFunc,
   portapapelesEtiquetasBits, setPortapapelesEtiquetasBits, onGuardarSinCerrar,
   obtenerTIs, obtenerTVs, obtenerRelaciones,
}) => (
   <div className="modal-plantillas-formulario">
      {error && <div className="modal-plantillas-error">{error}</div>}
      <div className="modal-plantillas-campo">
         <label>Nombre de la plantilla *</label>
         <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: FE03 - Feeder con Autorecierre" />
      </div>
      <div className="modal-plantillas-campo">
         <label>Descripción (opcional)</label>
         <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Alimentadores sin medición de tensión" />
      </div>
      <SeccionAgregarFuncionalidad nuevaFunc={nuevaFunc} setNuevaFunc={setNuevaFunc} onAgregar={onAgregarFuncionalidad} />
      {funcionalidades.length > 0 ? (
         <SeccionFuncionalidades
            funcionalidades={funcionalidades} onToggle={onToggleFuncionalidad}
            onMoverArriba={onMoverArriba} onMoverAbajo={onMoverAbajo} onEliminar={onEliminarFuncionalidad}
            onCambiarEtiqueta={onCambiarEtiqueta} onCambiarValorRegistro={onCambiarValorRegistro}
            onCambiarTransformadorRegistro={onCambiarTransformadorRegistro} onCambiarConfigHistorial={onCambiarConfigHistorial}
            onCambiarEtiquetaBitFunc={onCambiarEtiquetaBitFunc} onCambiarSeveridadBitFunc={onCambiarSeveridadBitFunc}
            onAgregarBitFunc={onAgregarBitFunc} onQuitarBitFunc={onQuitarBitFunc}
            onPegarEtiquetasBitsFunc={onPegarEtiquetasBitsFunc} portapapelesEtiquetasBits={portapapelesEtiquetasBits}
            setPortapapelesEtiquetasBits={setPortapapelesEtiquetasBits} onGuardarSinCerrar={onGuardarSinCerrar}
            obtenerTIs={obtenerTIs} obtenerTVs={obtenerTVs} obtenerRelaciones={obtenerRelaciones}
         />
      ) : (
         <div className="modal-plantillas-vacio-func">
            <p>No hay funcionalidades agregadas</p>
            <p className="modal-plantillas-hint">Usa el formulario de arriba para agregar funcionalidades</p>
         </div>
      )}
   </div>
);
