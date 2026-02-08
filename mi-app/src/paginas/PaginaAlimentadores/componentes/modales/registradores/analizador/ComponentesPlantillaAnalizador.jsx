// modales/registradores/analizador/ComponentesPlantillaAnalizador.jsx
// Componentes auxiliares para ModalPlantillasAnalizador

import React from "react";

export const ListaPlantillas = ({ plantillas, onCrear, onEditar, onEliminar, contarFuncionalidades }) => (
   <>
      <button className="modal-plantillas-btn-crear" onClick={onCrear}>+ Nueva Plantilla</button>
      {plantillas.length === 0 ? (
         <div className="modal-plantillas-vacio">
            <span className="modal-plantillas-vacio-icono">📊</span>
            <p>No hay plantillas creadas</p>
            <p className="modal-plantillas-hint">Crea una plantilla para empezar a configurar analizadores</p>
         </div>
      ) : (
         <div className="modal-plantillas-lista">
            {plantillas.map((plantilla) => (
               <div key={plantilla.id} className="modal-plantillas-item">
                  <div className="modal-plantillas-item-info">
                     <span className="modal-plantillas-item-nombre">📊 {plantilla.nombre}</span>
                     {plantilla.descripcion && <span className="modal-plantillas-item-desc">{plantilla.descripcion}</span>}
                     <span className="modal-plantillas-item-func">{contarFuncionalidades(plantilla)} mediciones</span>
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

export const SeccionAgregarMedicion = ({ nuevaFunc, setNuevaFunc, onAgregar }) => (
   <div className="modal-plantillas-agregar">
      <h4>📊 Agregar Medición</h4>
      <div className="modal-plantillas-agregar-row">
         <input type="text" value={nuevaFunc.nombre} onChange={(e) => setNuevaFunc({ ...nuevaFunc, nombre: e.target.value })} placeholder="Nombre (ej: Corrientes de fase)" />
         <input type="number" value={nuevaFunc.cantidad} onChange={(e) => setNuevaFunc({ ...nuevaFunc, cantidad: e.target.value })} placeholder="Cant." min={1} style={{ width: "80px" }} />
         <button className="modal-plantillas-btn-agregar" onClick={onAgregar}>+ Agregar</button>
      </div>
      <p className="modal-plantillas-agregar-hint">La cantidad define cuántos registros tiene esta medición (ej: 3 para IA, IB, IC)</p>
   </div>
);

export const TarjetaMedicion = ({
   func, index, total, onToggle, onMoverArriba, onMoverAbajo, onEliminar,
   onCambiarEtiqueta, onCambiarValorRegistro, onCambiarTransformadorRegistro,
   obtenerTIs, obtenerTVs, obtenerRelaciones,
}) => {
   const tis = obtenerTIs();
   const tvs = obtenerTVs();
   const relaciones = obtenerRelaciones();
   const todosTransformadores = [...tis, ...tvs, ...relaciones];

   return (
      <div className={`modal-plantillas-func-card ${func.habilitado ? "activo" : "inactivo"}`}>
         <div className="modal-plantillas-func-header">
            <input type="checkbox" checked={func.habilitado} onChange={() => onToggle(func.id)} />
            <span className="modal-plantillas-func-nombre">{func.nombre}</span>
            <div className="modal-plantillas-func-acciones">
               <button className="modal-plantillas-btn-mover" onClick={() => onMoverArriba(func.id)} disabled={index === 0} title="Mover arriba">▲</button>
               <button className="modal-plantillas-btn-mover" onClick={() => onMoverAbajo(func.id)} disabled={index === total - 1} title="Mover abajo">▼</button>
               <button className="modal-plantillas-btn-eliminar-func" onClick={() => onEliminar(func.id)} title="Eliminar">×</button>
            </div>
         </div>
         <div className="modal-plantillas-func-registros">
            {func.registros.map((reg, regIndex) => (
               <div key={regIndex} className="modal-plantillas-registro">
                  <input type="text" value={reg.etiqueta} onChange={(e) => onCambiarEtiqueta(func.id, regIndex, e.target.value)} placeholder={`Etiqueta ${regIndex + 1}`} className="modal-plantillas-registro-etiqueta" />
                  <input type="number" value={reg.valor} onChange={(e) => onCambiarValorRegistro(func.id, regIndex, e.target.value)} placeholder="Reg" className="modal-plantillas-registro-valor" />
                  <select value={reg.transformadorId || ""} onChange={(e) => onCambiarTransformadorRegistro(func.id, regIndex, e.target.value)} className="modal-plantillas-registro-transformador">
                     <option value="">Sin TI/TV</option>
                     {todosTransformadores.map((t) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
                  </select>
               </div>
            ))}
         </div>
      </div>
   );
};

export const SeccionMediciones = ({
   funcionalidades, onToggle, onMoverArriba, onMoverAbajo, onEliminar,
   onCambiarEtiqueta, onCambiarValorRegistro, onCambiarTransformadorRegistro,
   obtenerTIs, obtenerTVs, obtenerRelaciones,
}) => (
   <div className="modal-plantillas-funcionalidades">
      <h4>Mediciones configuradas ({funcionalidades.length})</h4>
      {funcionalidades.map((func, index) => (
         <TarjetaMedicion
            key={func.id} func={func} index={index} total={funcionalidades.length}
            onToggle={onToggle} onMoverArriba={onMoverArriba} onMoverAbajo={onMoverAbajo} onEliminar={onEliminar}
            onCambiarEtiqueta={onCambiarEtiqueta} onCambiarValorRegistro={onCambiarValorRegistro}
            onCambiarTransformadorRegistro={onCambiarTransformadorRegistro}
            obtenerTIs={obtenerTIs} obtenerTVs={obtenerTVs} obtenerRelaciones={obtenerRelaciones}
         />
      ))}
   </div>
);

export const FormularioPlantilla = ({
   error, nombre, setNombre, descripcion, setDescripcion,
   nuevaFunc, setNuevaFunc, onAgregarFuncionalidad,
   funcionalidades, onToggleFuncionalidad, onMoverArriba, onMoverAbajo, onEliminarFuncionalidad,
   onCambiarEtiqueta, onCambiarValorRegistro, onCambiarTransformadorRegistro,
   obtenerTIs, obtenerTVs, obtenerRelaciones,
}) => (
   <div className="modal-plantillas-formulario">
      {error && <div className="modal-plantillas-error">{error}</div>}
      <div className="modal-plantillas-campo">
         <label>Nombre de la plantilla *</label>
         <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Power Meter PM5xxx" />
      </div>
      <div className="modal-plantillas-campo">
         <label>Descripción (opcional)</label>
         <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Medidor de energía trifásico" />
      </div>
      <SeccionAgregarMedicion nuevaFunc={nuevaFunc} setNuevaFunc={setNuevaFunc} onAgregar={onAgregarFuncionalidad} />
      {funcionalidades.length > 0 ? (
         <SeccionMediciones
            funcionalidades={funcionalidades} onToggle={onToggleFuncionalidad}
            onMoverArriba={onMoverArriba} onMoverAbajo={onMoverAbajo} onEliminar={onEliminarFuncionalidad}
            onCambiarEtiqueta={onCambiarEtiqueta} onCambiarValorRegistro={onCambiarValorRegistro}
            onCambiarTransformadorRegistro={onCambiarTransformadorRegistro}
            obtenerTIs={obtenerTIs} obtenerTVs={obtenerTVs} obtenerRelaciones={obtenerRelaciones}
         />
      ) : (
         <div className="modal-plantillas-mediciones-vacio">
            <p>Agrega mediciones para configurar qué datos leer del analizador</p>
         </div>
      )}
   </div>
);
