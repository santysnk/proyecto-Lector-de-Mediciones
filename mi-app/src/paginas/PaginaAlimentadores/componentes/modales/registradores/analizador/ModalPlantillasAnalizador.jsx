// componentes/modales/registradores/analizador/ModalPlantillasAnalizador.jsx
// Modal para gestionar plantillas de analizadores de redes

import { useState, useEffect } from "react";
import { useFuncionalidadesAnalizador } from "../../../../hooks/analizador";
// Reutilizamos los estilos del modal de plantillas de relé
import "../rele/ModalPlantillasRele.css";

/**
 * Modal para gestionar plantillas de analizadores de redes.
 * Similar al de relés pero sin categorías ni etiquetas de bits.
 */
const ModalPlantillasAnalizador = ({
   abierto,
   onCerrar,
   plantillas,
   onCrear,
   onActualizar,
   onEliminar,
   plantillaEditando = null,
   obtenerTIs,
   obtenerTVs,
   obtenerRelaciones,
}) => {
   // Hook de funcionalidades
   const funcionalidadesHook = useFuncionalidadesAnalizador();

   // Estado del formulario
   const [modo, setModo] = useState("lista");
   const [nombre, setNombre] = useState("");
   const [descripcion, setDescripcion] = useState("");
   const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
   const [error, setError] = useState("");

   // Si se pasa una plantilla para editar, entrar en modo edición
   useEffect(() => {
      if (plantillaEditando && abierto) {
         setModo("editar");
         setPlantillaSeleccionada(plantillaEditando);
         setNombre(plantillaEditando.nombre);
         setDescripcion(plantillaEditando.descripcion || "");
         funcionalidadesHook.cargarDesdeObjeto(plantillaEditando.funcionalidades);
      }
   }, [plantillaEditando, abierto]);

   // Reset al cerrar
   useEffect(() => {
      if (!abierto) {
         resetFormulario();
      }
   }, [abierto]);

   const resetFormulario = () => {
      setModo("lista");
      setNombre("");
      setDescripcion("");
      setPlantillaSeleccionada(null);
      setError("");
      funcionalidadesHook.resetear();
   };

   const iniciarCreacion = () => {
      resetFormulario();
      setModo("crear");
   };

   const iniciarEdicion = (plantilla) => {
      setPlantillaSeleccionada(plantilla);
      setNombre(plantilla.nombre);
      setDescripcion(plantilla.descripcion || "");
      funcionalidadesHook.cargarDesdeObjeto(plantilla.funcionalidades);
      setModo("editar");
   };

   const handleAgregarFuncionalidad = () => {
      if (!funcionalidadesHook.nuevaFunc.nombre.trim()) {
         setError("El nombre de la medición es requerido");
         return;
      }
      funcionalidadesHook.agregarFuncionalidad();
      setError("");
   };

   const validarFormulario = () => {
      if (!nombre.trim()) {
         setError("El nombre de la plantilla es requerido");
         return false;
      }

      if (funcionalidadesHook.funcionalidades.length === 0) {
         setError("Debes agregar al menos una medición");
         return false;
      }

      const hayFuncionalidadActiva = funcionalidadesHook.funcionalidades.some((f) => f.habilitado);
      if (!hayFuncionalidadActiva) {
         setError("Debe habilitar al menos una medición");
         return false;
      }

      setError("");
      return true;
   };

   const handleGuardar = () => {
      if (!validarFormulario()) return;

      const datos = {
         nombre: nombre.trim(),
         descripcion: descripcion.trim(),
         funcionalidades: funcionalidadesHook.obtenerParaGuardar(),
      };

      if (modo === "crear") {
         const nueva = onCrear(datos);
         if (nueva) resetFormulario();
      } else if (modo === "editar" && plantillaSeleccionada) {
         const exito = onActualizar(plantillaSeleccionada.id, datos);
         if (exito) resetFormulario();
      }
   };

   const handleEliminar = (plantilla) => {
      if (window.confirm(`¿Eliminar la plantilla "${plantilla.nombre}"? Esta acción no se puede deshacer.`)) {
         onEliminar(plantilla.id);
      }
   };

   if (!abierto) return null;

   return (
      <div className="modal-plantillas-overlay">
         <div className="modal-plantillas-contenido">
            {/* Header */}
            <div className="modal-plantillas-header">
               <h3>
                  {modo === "lista" && "Gestionar Plantillas de Analizador"}
                  {modo === "crear" && "Nueva Plantilla de Analizador"}
                  {modo === "editar" && "Editar Plantilla"}
               </h3>
               <button className="modal-plantillas-cerrar" onClick={onCerrar}>×</button>
            </div>

            {/* Contenido */}
            <div className="modal-plantillas-body">
               {/* MODO LISTA */}
               {modo === "lista" && (
                  <ListaPlantillas
                     plantillas={plantillas}
                     onCrear={iniciarCreacion}
                     onEditar={iniciarEdicion}
                     onEliminar={handleEliminar}
                     contarFuncionalidades={funcionalidadesHook.contarFuncionalidades}
                  />
               )}

               {/* MODO CREAR/EDITAR */}
               {(modo === "crear" || modo === "editar") && (
                  <FormularioPlantilla
                     error={error}
                     nombre={nombre}
                     setNombre={setNombre}
                     descripcion={descripcion}
                     setDescripcion={setDescripcion}
                     nuevaFunc={funcionalidadesHook.nuevaFunc}
                     setNuevaFunc={funcionalidadesHook.setNuevaFunc}
                     onAgregarFuncionalidad={handleAgregarFuncionalidad}
                     funcionalidades={funcionalidadesHook.funcionalidades}
                     onToggleFuncionalidad={funcionalidadesHook.toggleFuncionalidad}
                     onMoverArriba={funcionalidadesHook.moverFuncionalidadArriba}
                     onMoverAbajo={funcionalidadesHook.moverFuncionalidadAbajo}
                     onEliminarFuncionalidad={funcionalidadesHook.eliminarFuncionalidad}
                     onCambiarEtiqueta={funcionalidadesHook.cambiarEtiquetaRegistro}
                     onCambiarValorRegistro={funcionalidadesHook.cambiarValorRegistro}
                     onCambiarTransformadorRegistro={funcionalidadesHook.cambiarTransformadorRegistro}
                     obtenerTIs={obtenerTIs}
                     obtenerTVs={obtenerTVs}
                     obtenerRelaciones={obtenerRelaciones}
                  />
               )}
            </div>

            {/* Footer */}
            <div className="modal-plantillas-footer">
               {modo === "lista" ? (
                  <button className="modal-plantillas-btn-cerrar" onClick={onCerrar}>Cerrar</button>
               ) : (
                  <>
                     <button className="modal-plantillas-btn-cancelar" onClick={resetFormulario}>Cancelar</button>
                     <button className="modal-plantillas-btn-guardar" onClick={handleGuardar}>
                        {modo === "crear" ? "Crear Plantilla" : "Guardar Cambios"}
                     </button>
                  </>
               )}
            </div>
         </div>
      </div>
   );
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

/**
 * Lista de plantillas existentes
 */
const ListaPlantillas = ({
   plantillas,
   onCrear,
   onEditar,
   onEliminar,
   contarFuncionalidades,
}) => (
   <>
      <button className="modal-plantillas-btn-crear" onClick={onCrear}>
         + Nueva Plantilla
      </button>

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
                     {plantilla.descripcion && (
                        <span className="modal-plantillas-item-desc">{plantilla.descripcion}</span>
                     )}
                     <span className="modal-plantillas-item-func">
                        {contarFuncionalidades(plantilla)} mediciones
                     </span>
                  </div>
                  <div className="modal-plantillas-item-acciones">
                     <button className="modal-plantillas-btn-editar" onClick={() => onEditar(plantilla)} title="Editar">
                        Editar
                     </button>
                     <button className="modal-plantillas-btn-eliminar" onClick={() => onEliminar(plantilla)} title="Eliminar">
                        Eliminar
                     </button>
                  </div>
               </div>
            ))}
         </div>
      )}
   </>
);

/**
 * Formulario de creación/edición de plantilla
 */
const FormularioPlantilla = ({
   error,
   nombre,
   setNombre,
   descripcion,
   setDescripcion,
   nuevaFunc,
   setNuevaFunc,
   onAgregarFuncionalidad,
   funcionalidades,
   onToggleFuncionalidad,
   onMoverArriba,
   onMoverAbajo,
   onEliminarFuncionalidad,
   onCambiarEtiqueta,
   onCambiarValorRegistro,
   onCambiarTransformadorRegistro,
   obtenerTIs,
   obtenerTVs,
   obtenerRelaciones,
}) => (
   <div className="modal-plantillas-formulario">
      {error && <div className="modal-plantillas-error">{error}</div>}

      <div className="modal-plantillas-campo">
         <label>Nombre de la plantilla *</label>
         <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Power Meter PM5xxx"
         />
      </div>

      <div className="modal-plantillas-campo">
         <label>Descripción (opcional)</label>
         <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Medidor de energía trifásico"
         />
      </div>

      {/* Sección para agregar medición */}
      <SeccionAgregarMedicion
         nuevaFunc={nuevaFunc}
         setNuevaFunc={setNuevaFunc}
         onAgregar={onAgregarFuncionalidad}
      />

      {/* Lista de mediciones */}
      {funcionalidades.length > 0 ? (
         <SeccionMediciones
            funcionalidades={funcionalidades}
            onToggle={onToggleFuncionalidad}
            onMoverArriba={onMoverArriba}
            onMoverAbajo={onMoverAbajo}
            onEliminar={onEliminarFuncionalidad}
            onCambiarEtiqueta={onCambiarEtiqueta}
            onCambiarValorRegistro={onCambiarValorRegistro}
            onCambiarTransformadorRegistro={onCambiarTransformadorRegistro}
            obtenerTIs={obtenerTIs}
            obtenerTVs={obtenerTVs}
            obtenerRelaciones={obtenerRelaciones}
         />
      ) : (
         <div className="modal-plantillas-mediciones-vacio">
            <p>Agrega mediciones para configurar qué datos leer del analizador</p>
         </div>
      )}
   </div>
);

/**
 * Sección para agregar nueva medición
 */
const SeccionAgregarMedicion = ({ nuevaFunc, setNuevaFunc, onAgregar }) => (
   <div className="modal-plantillas-agregar">
      <h4>📊 Agregar Medición</h4>
      <div className="modal-plantillas-agregar-row">
         <input
            type="text"
            value={nuevaFunc.nombre}
            onChange={(e) => setNuevaFunc({ ...nuevaFunc, nombre: e.target.value })}
            placeholder="Nombre (ej: Corrientes de fase)"
         />
         <input
            type="number"
            value={nuevaFunc.cantidad}
            onChange={(e) => setNuevaFunc({ ...nuevaFunc, cantidad: e.target.value })}
            placeholder="Cant."
            min={1}
            style={{ width: "80px" }}
         />
         <button className="modal-plantillas-btn-agregar" onClick={onAgregar}>
            + Agregar
         </button>
      </div>
      <p className="modal-plantillas-agregar-hint">
         La cantidad define cuántos registros tiene esta medición (ej: 3 para IA, IB, IC)
      </p>
   </div>
);

/**
 * Sección que muestra todas las mediciones
 */
const SeccionMediciones = ({
   funcionalidades,
   onToggle,
   onMoverArriba,
   onMoverAbajo,
   onEliminar,
   onCambiarEtiqueta,
   onCambiarValorRegistro,
   onCambiarTransformadorRegistro,
   obtenerTIs,
   obtenerTVs,
   obtenerRelaciones,
}) => (
   <div className="modal-plantillas-funcionalidades">
      <h4>Mediciones configuradas ({funcionalidades.length})</h4>
      {funcionalidades.map((func, index) => (
         <TarjetaMedicion
            key={func.id}
            func={func}
            index={index}
            total={funcionalidades.length}
            onToggle={onToggle}
            onMoverArriba={onMoverArriba}
            onMoverAbajo={onMoverAbajo}
            onEliminar={onEliminar}
            onCambiarEtiqueta={onCambiarEtiqueta}
            onCambiarValorRegistro={onCambiarValorRegistro}
            onCambiarTransformadorRegistro={onCambiarTransformadorRegistro}
            obtenerTIs={obtenerTIs}
            obtenerTVs={obtenerTVs}
            obtenerRelaciones={obtenerRelaciones}
         />
      ))}
   </div>
);

/**
 * Tarjeta de una medición individual
 */
const TarjetaMedicion = ({
   func,
   index,
   total,
   onToggle,
   onMoverArriba,
   onMoverAbajo,
   onEliminar,
   onCambiarEtiqueta,
   onCambiarValorRegistro,
   onCambiarTransformadorRegistro,
   obtenerTIs,
   obtenerTVs,
   obtenerRelaciones,
}) => {
   const tis = obtenerTIs();
   const tvs = obtenerTVs();
   const relaciones = obtenerRelaciones();
   const todosTransformadores = [...tis, ...tvs, ...relaciones];

   return (
      <div className={`modal-plantillas-func-card ${func.habilitado ? "activo" : "inactivo"}`}>
         <div className="modal-plantillas-func-header">
            <input
               type="checkbox"
               checked={func.habilitado}
               onChange={() => onToggle(func.id)}
            />
            <span className="modal-plantillas-func-nombre">{func.nombre}</span>
            <div className="modal-plantillas-func-acciones">
               <button
                  className="modal-plantillas-btn-mover"
                  onClick={() => onMoverArriba(func.id)}
                  disabled={index === 0}
                  title="Mover arriba"
               >
                  ▲
               </button>
               <button
                  className="modal-plantillas-btn-mover"
                  onClick={() => onMoverAbajo(func.id)}
                  disabled={index === total - 1}
                  title="Mover abajo"
               >
                  ▼
               </button>
               <button
                  className="modal-plantillas-btn-eliminar-func"
                  onClick={() => onEliminar(func.id)}
                  title="Eliminar"
               >
                  ×
               </button>
            </div>
         </div>

         {/* Registros de la medición */}
         <div className="modal-plantillas-func-registros">
            {func.registros.map((reg, regIndex) => (
               <div key={regIndex} className="modal-plantillas-registro">
                  <input
                     type="text"
                     value={reg.etiqueta}
                     onChange={(e) => onCambiarEtiqueta(func.id, regIndex, e.target.value)}
                     placeholder={`Etiqueta ${regIndex + 1}`}
                     className="modal-plantillas-registro-etiqueta"
                  />
                  <input
                     type="number"
                     value={reg.valor}
                     onChange={(e) => onCambiarValorRegistro(func.id, regIndex, e.target.value)}
                     placeholder="Reg"
                     className="modal-plantillas-registro-valor"
                  />
                  <select
                     value={reg.transformadorId || ""}
                     onChange={(e) => onCambiarTransformadorRegistro(func.id, regIndex, e.target.value)}
                     className="modal-plantillas-registro-transformador"
                  >
                     <option value="">Sin TI/TV</option>
                     {todosTransformadores.map((t) => (
                        <option key={t.id} value={t.id}>
                           {t.nombre}
                        </option>
                     ))}
                  </select>
               </div>
            ))}
         </div>
      </div>
   );
};

export default ModalPlantillasAnalizador;
