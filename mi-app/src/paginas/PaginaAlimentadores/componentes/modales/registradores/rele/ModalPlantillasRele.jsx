import { useState, useEffect } from "react";
import { SEVERIDADES_DISPONIBLES, PLANTILLAS_ETIQUETAS_LEDS } from "../../../../utilidades/interpreteRegistrosREF615";
import { useTransformadores } from "../../../../hooks/mediciones";
import { useEtiquetasBits, useFuncionalidadesPlantilla, CATEGORIAS_FUNCIONALIDADES } from "../../../../hooks/rele";
import DropdownTransformador from "../DropdownTransformador";
import "./ModalPlantillasRele.css";

/**
 * Modal para gestionar plantillas de relés de protección.
 * Permite crear funcionalidades personalizadas con registros individuales.
 * @param {Object} props
 * @param {boolean} props.abierto - Si el modal está abierto
 * @param {Function} props.onCerrar - Callback al cerrar
 * @param {Array} props.plantillas - Lista de plantillas
 * @param {Function} props.onCrear - Callback al crear
 * @param {Function} props.onActualizar - Callback al actualizar
 * @param {Function} props.onEliminar - Callback al eliminar
 * @param {Object} props.plantillaEditando - Plantilla en edición
 * @param {string} props.workspaceId - ID del workspace actual
 */
const ModalPlantillasRele = ({
   abierto,
   onCerrar,
   plantillas,
   onCrear,
   onActualizar,
   onEliminar,
   plantillaEditando = null,
   workspaceId,
}) => {
   // Hook de transformadores
   const { obtenerTIs, obtenerTVs, obtenerRelaciones, recargar: recargarTransformadores } = useTransformadores(workspaceId);

   // Hook de etiquetas de bits
   const etiquetasHook = useEtiquetasBits();

   // Hook de funcionalidades
   const funcionalidadesHook = useFuncionalidadesPlantilla();

   // Estado del formulario
   const [modo, setModo] = useState("lista");
   const [nombre, setNombre] = useState("");
   const [descripcion, setDescripcion] = useState("");
   const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
   const [error, setError] = useState("");

   // Recargar transformadores cuando el modal se abre
   useEffect(() => {
      if (abierto) {
         recargarTransformadores();
      }
   }, [abierto, recargarTransformadores]);

   // Si se pasa una plantilla para editar, entrar en modo edición
   useEffect(() => {
      if (plantillaEditando && abierto) {
         setModo("editar");
         setPlantillaSeleccionada(plantillaEditando);
         setNombre(plantillaEditando.nombre);
         setDescripcion(plantillaEditando.descripcion || "");
         funcionalidadesHook.cargarDesdeObjeto(plantillaEditando.funcionalidades);
         etiquetasHook.cargarDesdeObjeto(
            plantillaEditando.etiquetasBits,
            plantillaEditando.plantillaEtiquetasId
         );
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
      etiquetasHook.resetear();
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
      etiquetasHook.cargarDesdeObjeto(
         plantilla.etiquetasBits,
         plantilla.plantillaEtiquetasId
      );
      setModo("editar");
   };

   const handleAgregarFuncionalidad = () => {
      const resultado = funcionalidadesHook.agregarFuncionalidad();
      if (!resultado.exito) {
         setError(resultado.error);
      } else {
         setError("");
      }
   };

   const handleGuardarPlantillaEtiquetas = () => {
      const resultado = etiquetasHook.guardarPlantillaPersonalizada();
      if (!resultado.exito) {
         setError(resultado.error);
      } else {
         setError("");
      }
   };

   const validarFormulario = () => {
      if (!nombre.trim()) {
         setError("El nombre de la plantilla es requerido");
         return false;
      }

      if (funcionalidadesHook.funcionalidades.length === 0) {
         setError("Debes agregar al menos una funcionalidad");
         return false;
      }

      const hayFuncionalidadActiva = funcionalidadesHook.funcionalidades.some((f) => f.habilitado);
      if (!hayFuncionalidadActiva) {
         setError("Debe habilitar al menos una funcionalidad");
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
         etiquetasBits: etiquetasHook.obtenerEtiquetasLimpias(),
         plantillaEtiquetasId: etiquetasHook.plantillaSeleccionada || null,
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
                  {modo === "lista" && "Gestionar Plantillas"}
                  {modo === "crear" && "Nueva Plantilla"}
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
                     obtenerNombrePlantillaEtiquetas={etiquetasHook.obtenerNombrePlantilla}
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
                     onCambiarConfigHistorial={funcionalidadesHook.cambiarConfigHistorial}
                     obtenerTIs={obtenerTIs}
                     obtenerTVs={obtenerTVs}
                     obtenerRelaciones={obtenerRelaciones}
                     etiquetasHook={etiquetasHook}
                     onGuardarPlantillaEtiquetas={handleGuardarPlantillaEtiquetas}
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
   obtenerNombrePlantillaEtiquetas
}) => (
   <>
      <button className="modal-plantillas-btn-crear" onClick={onCrear}>
         + Nueva Plantilla
      </button>

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
                     {plantilla.descripcion && (
                        <span className="modal-plantillas-item-desc">{plantilla.descripcion}</span>
                     )}
                     <span className="modal-plantillas-item-func">
                        {contarFuncionalidades(plantilla)} funcionalidades
                        {obtenerNombrePlantillaEtiquetas(plantilla.plantillaEtiquetasId) && (
                           <> · Panel: {obtenerNombrePlantillaEtiquetas(plantilla.plantillaEtiquetasId)}</>
                        )}
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
   onCambiarConfigHistorial,
   obtenerTIs,
   obtenerTVs,
   obtenerRelaciones,
   etiquetasHook,
   onGuardarPlantillaEtiquetas,
}) => (
   <div className="modal-plantillas-formulario">
      {error && <div className="modal-plantillas-error">{error}</div>}

      <div className="modal-plantillas-campo">
         <label>Nombre de la plantilla *</label>
         <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: FE03 - Feeder con Autorecierre"
         />
      </div>

      <div className="modal-plantillas-campo">
         <label>Descripción (opcional)</label>
         <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Alimentadores sin medición de tensión"
         />
      </div>

      {/* Sección para agregar funcionalidad */}
      <SeccionAgregarFuncionalidad
         nuevaFunc={nuevaFunc}
         setNuevaFunc={setNuevaFunc}
         onAgregar={onAgregarFuncionalidad}
      />

      {/* Lista de funcionalidades */}
      {funcionalidades.length > 0 ? (
         <SeccionFuncionalidades
            funcionalidades={funcionalidades}
            onToggle={onToggleFuncionalidad}
            onMoverArriba={onMoverArriba}
            onMoverAbajo={onMoverAbajo}
            onEliminar={onEliminarFuncionalidad}
            onCambiarEtiqueta={onCambiarEtiqueta}
            onCambiarValorRegistro={onCambiarValorRegistro}
            onCambiarTransformadorRegistro={onCambiarTransformadorRegistro}
            onCambiarConfigHistorial={onCambiarConfigHistorial}
            obtenerTIs={obtenerTIs}
            obtenerTVs={obtenerTVs}
            obtenerRelaciones={obtenerRelaciones}
         />
      ) : (
         <div className="modal-plantillas-vacio-func">
            <p>No hay funcionalidades agregadas</p>
            <p className="modal-plantillas-hint">Usa el formulario de arriba para agregar funcionalidades</p>
         </div>
      )}

      {/* Sección de Etiquetas de Bits (LEDs) */}
      <SeccionEtiquetasBits
         etiquetasHook={etiquetasHook}
         onGuardarPlantilla={onGuardarPlantillaEtiquetas}
      />
   </div>
);

/**
 * Sección para agregar nueva funcionalidad
 */
const SeccionAgregarFuncionalidad = ({ nuevaFunc, setNuevaFunc, onAgregar }) => (
   <div className="modal-plantillas-seccion">
      <h4>Agregar Funcionalidad</h4>
      <div className="modal-plantillas-agregar-func">
         <div className="modal-plantillas-agregar-row">
            <div className="modal-plantillas-agregar-campo">
               <label>Nombre</label>
               <input
                  type="text"
                  value={nuevaFunc.nombre}
                  onChange={(e) => setNuevaFunc((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Corrientes de Fase"
               />
            </div>
            <div className="modal-plantillas-agregar-campo modal-plantillas-agregar-campo--pequeño">
               <label>Cant. Reg.</label>
               <input
                  type="number"
                  value={nuevaFunc.cantidad}
                  onChange={(e) => setNuevaFunc((prev) => ({ ...prev, cantidad: e.target.value }))}
                  min={1}
                  max={20}
               />
            </div>
            <div className="modal-plantillas-agregar-campo modal-plantillas-agregar-campo--categoria">
               <label>Categoría</label>
               <select
                  value={nuevaFunc.categoria}
                  onChange={(e) => setNuevaFunc((prev) => ({ ...prev, categoria: e.target.value }))}
               >
                  {Object.values(CATEGORIAS_FUNCIONALIDADES).map((cat) => (
                     <option key={cat.id} value={cat.id}>{cat.icono} {cat.nombre}</option>
                  ))}
               </select>
            </div>
            <button type="button" className="modal-plantillas-btn-agregar" onClick={onAgregar}>
               + Agregar
            </button>
         </div>
      </div>
   </div>
);

/**
 * Lista de funcionalidades agrupadas por categoría
 */
const SeccionFuncionalidades = ({
   funcionalidades,
   onToggle,
   onMoverArriba,
   onMoverAbajo,
   onEliminar,
   onCambiarEtiqueta,
   onCambiarValorRegistro,
   onCambiarTransformadorRegistro,
   onCambiarConfigHistorial,
   obtenerTIs,
   obtenerTVs,
   obtenerRelaciones,
}) => (
   <div className="modal-plantillas-seccion">
      <h4>Funcionalidades ({funcionalidades.length})</h4>

      {Object.values(CATEGORIAS_FUNCIONALIDADES).map((categoria) => {
         const funcsDeCategoria = funcionalidades.filter(
            (f) => (f.categoria || "mediciones") === categoria.id
         );

         if (funcsDeCategoria.length === 0) return null;

         return (
            <div key={categoria.id} className="modal-plantillas-categoria">
               <h5>{categoria.icono} {categoria.nombre}</h5>
               <div className="modal-plantillas-func-lista">
                  {funcsDeCategoria.map((func) => (
                     <TarjetaFuncionalidad
                        key={func.id}
                        func={func}
                        categoria={categoria}
                        onToggle={onToggle}
                        onMoverArriba={onMoverArriba}
                        onMoverAbajo={onMoverAbajo}
                        onEliminar={onEliminar}
                        onCambiarEtiqueta={onCambiarEtiqueta}
                        onCambiarValorRegistro={onCambiarValorRegistro}
                        onCambiarTransformadorRegistro={onCambiarTransformadorRegistro}
                        onCambiarConfigHistorial={onCambiarConfigHistorial}
                        obtenerTIs={obtenerTIs}
                        obtenerTVs={obtenerTVs}
                        obtenerRelaciones={obtenerRelaciones}
                     />
                  ))}
               </div>
            </div>
         );
      })}
   </div>
);

/**
 * Tarjeta de una funcionalidad individual
 */
const TarjetaFuncionalidad = ({
   func,
   categoria,
   onToggle,
   onMoverArriba,
   onMoverAbajo,
   onEliminar,
   onCambiarEtiqueta,
   onCambiarValorRegistro,
   onCambiarTransformadorRegistro,
   onCambiarConfigHistorial,
   obtenerTIs,
   obtenerTVs,
   obtenerRelaciones,
}) => {
   const configHistorial = func.configHistorial || {};
   const tieneMultiplesRegistros = func.registros && func.registros.length > 1;

   return (
      <div className={`modal-plantillas-func-card ${func.habilitado ? "activo" : "inactivo"}`}>
         <div className="modal-plantillas-func-header">
            <label className="modal-plantillas-func-check">
               <input
                  type="checkbox"
                  checked={func.habilitado}
                  onChange={() => onToggle(func.id)}
               />
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
                  <input
                     type="text"
                     className="modal-plantillas-registro-etiqueta"
                     value={reg.etiqueta}
                     onChange={(e) => onCambiarEtiqueta(func.id, index, e.target.value)}
                     placeholder={`Etiqueta ${index + 1}`}
                     disabled={!func.habilitado}
                  />
                  <span className="modal-plantillas-registro-separador">→</span>
                  <input
                     type="number"
                     className="modal-plantillas-registro-valor"
                     value={reg.valor}
                     onChange={(e) => onCambiarValorRegistro(func.id, index, e.target.value)}
                     placeholder={`${137 + index}`}
                     disabled={!func.habilitado}
                     min={0}
                  />
                  {categoria.id === "mediciones" && (
                     <DropdownTransformador
                        value={reg.transformadorId || ""}
                        onChange={(id) => onCambiarTransformadorRegistro(func.id, index, id)}
                        disabled={!func.habilitado}
                        tis={obtenerTIs()}
                        tvs={obtenerTVs()}
                        relaciones={obtenerRelaciones()}
                     />
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
               {/* Checkbox: Mostrar en historial */}
               <label className="modal-plantillas-config-check">
                  <input
                     type="checkbox"
                     checked={configHistorial.habilitado !== false}
                     onChange={(e) => onCambiarConfigHistorial(func.id, "habilitado", e.target.checked)}
                     disabled={!func.habilitado}
                  />
                  <span>Mostrar</span>
               </label>

               {/* Checkbox: Promedio (solo para mediciones con múltiples registros) */}
               {categoria.id === "mediciones" && tieneMultiplesRegistros && (
                  <label className="modal-plantillas-config-check" title="Agrega tab de promedio de todos los registros">
                     <input
                        type="checkbox"
                        checked={configHistorial.mostrarPromedio === true}
                        onChange={(e) => onCambiarConfigHistorial(func.id, "mostrarPromedio", e.target.checked)}
                        disabled={!func.habilitado || configHistorial.habilitado === false}
                     />
                     <span>Promedio</span>
                  </label>
               )}

               {/* Checkbox: Combinar 32 bits (solo para mediciones) */}
               {categoria.id === "mediciones" && (
                  <label className="modal-plantillas-config-check" title="Combina registros HIGH/LOW en valor de 32 bits: (HIGH &lt;&lt; 16) | LOW">
                     <input
                        type="checkbox"
                        checked={configHistorial.combinar32bits === true}
                        onChange={(e) => onCambiarConfigHistorial(func.id, "combinar32bits", e.target.checked)}
                        disabled={!func.habilitado || configHistorial.habilitado === false}
                     />
                     <span>32 bits</span>
                  </label>
               )}

               {/* Checkbox: Timeline de bits (solo para estados/alarmas) */}
               {(categoria.id === "estados" || categoria.id === "alarmas") && (
                  <label className="modal-plantillas-config-check" title="Muestra timeline visual de bits activos">
                     <input
                        type="checkbox"
                        checked={configHistorial.timelineBits === true}
                        onChange={(e) => onCambiarConfigHistorial(func.id, "timelineBits", e.target.checked)}
                        disabled={!func.habilitado || configHistorial.habilitado === false}
                     />
                     <span>Timeline bits</span>
                  </label>
               )}
            </div>
         </div>
      </div>
   );
};

/**
 * Sección de etiquetas de bits (LEDs)
 */
const SeccionEtiquetasBits = ({ etiquetasHook, onGuardarPlantilla }) => (
   <div className="modal-plantillas-seccion modal-plantillas-seccion-etiquetas">
      <div
         className="modal-plantillas-seccion-header-colapsable"
         onClick={() => etiquetasHook.setSeccionAbierta(!etiquetasHook.seccionAbierta)}
      >
         <h4>
            <span className={`modal-plantillas-chevron ${etiquetasHook.seccionAbierta ? "abierto" : ""}`}>▶</span>
            Etiquetas de LEDs (Registro 172)
            {etiquetasHook.contarEtiquetasConfiguradas() > 0 && (
               <span className="modal-plantillas-badge">{etiquetasHook.contarEtiquetasConfiguradas()}</span>
            )}
         </h4>
         <span className="modal-plantillas-hint-inline">Define qué significa cada LED del panel frontal</span>
      </div>

      {etiquetasHook.seccionAbierta && (
         <div className="modal-plantillas-etiquetas-contenido">
            {/* Selector de plantilla */}
            <div className="modal-plantillas-etiquetas-acciones">
               <label>Plantilla:</label>
               <select
                  onChange={(e) => {
                     if (e.target.value === "__nueva__") {
                        etiquetasHook.iniciarNuevaPlantilla();
                     } else if (e.target.value) {
                        etiquetasHook.aplicarPlantilla(e.target.value);
                     } else {
                        etiquetasHook.limpiarEtiquetas();
                     }
                  }}
                  value={etiquetasHook.modoNuevaPlantilla ? "__nueva__" : etiquetasHook.plantillaSeleccionada}
               >
                  <option value="">Seleccionar...</option>
                  <option value="__nueva__">+ Nueva plantilla...</option>
                  <optgroup label="Predefinidas">
                     {Object.entries(PLANTILLAS_ETIQUETAS_LEDS).map(([key, plantilla]) => (
                        <option key={key} value={key}>{plantilla.nombre}</option>
                     ))}
                  </optgroup>
                  {Object.keys(etiquetasHook.plantillasPersonalizadas).length > 0 && (
                     <optgroup label="Mis plantillas">
                        {Object.entries(etiquetasHook.plantillasPersonalizadas).map(([key, plantilla]) => (
                           <option key={key} value={key}>{plantilla.nombre}</option>
                        ))}
                     </optgroup>
                  )}
               </select>
               {etiquetasHook.contarEtiquetasConfiguradas() > 0 && !etiquetasHook.modoNuevaPlantilla && (
                  <button type="button" className="modal-plantillas-btn-limpiar" onClick={etiquetasHook.limpiarEtiquetas}>
                     Limpiar
                  </button>
               )}
            </div>

            {/* Formulario para nueva plantilla */}
            {etiquetasHook.modoNuevaPlantilla && (
               <div className="modal-plantillas-nueva-plantilla-etiquetas">
                  <div className="modal-plantillas-nueva-plantilla-header">
                     <input
                        type="text"
                        className="modal-plantillas-nueva-plantilla-nombre"
                        value={etiquetasHook.nombreNuevaPlantilla}
                        onChange={(e) => etiquetasHook.setNombreNuevaPlantilla(e.target.value)}
                        placeholder="Nombre de la plantilla..."
                     />
                     <div className="modal-plantillas-nueva-plantilla-botones">
                        <button type="button" className="modal-plantillas-btn-guardar-etiquetas" onClick={onGuardarPlantilla} title="Guardar plantilla">
                           Guardar
                        </button>
                        <button type="button" className="modal-plantillas-btn-cancelar-etiquetas" onClick={etiquetasHook.cancelarNuevaPlantilla} title="Cancelar">
                           Cancelar
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* Lista de bits */}
            <div className="modal-plantillas-bits-lista">
               {Array.from({ length: etiquetasHook.cantidadBits }, (_, bit) => (
                  <div key={bit} className="modal-plantillas-bit-item">
                     <span className="modal-plantillas-bit-numero">Bit {bit}:</span>
                     <input
                        type="text"
                        className="modal-plantillas-bit-etiqueta"
                        value={etiquetasHook.etiquetasBits[bit]?.texto || ""}
                        onChange={(e) => etiquetasHook.cambiarEtiquetaBit(bit, e.target.value)}
                        placeholder={`LED ${bit + 1} (sin etiqueta)`}
                     />
                     <select
                        className={`modal-plantillas-bit-severidad severidad-${etiquetasHook.etiquetasBits[bit]?.severidad || "info"}`}
                        value={etiquetasHook.etiquetasBits[bit]?.severidad || "info"}
                        onChange={(e) => etiquetasHook.cambiarSeveridadBit(bit, e.target.value)}
                     >
                        {SEVERIDADES_DISPONIBLES.map((sev) => (
                           <option key={sev.id} value={sev.id}>{sev.nombre}</option>
                        ))}
                     </select>
                  </div>
               ))}
            </div>

            {/* Botones agregar/quitar bits */}
            {(etiquetasHook.modoNuevaPlantilla || etiquetasHook.contarEtiquetasConfiguradas() > 0) && (
               <div className="modal-plantillas-bits-acciones">
                  <button type="button" className="modal-plantillas-btn-agregar-bit" onClick={etiquetasHook.agregarFilaBit} title="Agregar fila">
                     + Agregar bit
                  </button>
                  {etiquetasHook.cantidadBits > 1 && (
                     <button type="button" className="modal-plantillas-btn-quitar-bit" onClick={etiquetasHook.quitarFilaBit} title="Quitar última fila">
                        − Quitar bit
                     </button>
                  )}
               </div>
            )}

            {/* Plantillas personalizadas guardadas */}
            {Object.keys(etiquetasHook.plantillasPersonalizadas).length > 0 && !etiquetasHook.modoNuevaPlantilla && (
               <div className="modal-plantillas-etiquetas-guardadas">
                  <span className="modal-plantillas-etiquetas-guardadas-label">Mis plantillas guardadas:</span>
                  <div className="modal-plantillas-etiquetas-guardadas-lista">
                     {Object.entries(etiquetasHook.plantillasPersonalizadas).map(([key, plantilla]) => (
                        <div key={key} className="modal-plantillas-etiqueta-guardada">
                           <span>{plantilla.nombre}</span>
                           <button
                              type="button"
                              className="modal-plantillas-btn-eliminar-etiqueta"
                              onClick={() => etiquetasHook.eliminarPlantillaPersonalizada(key)}
                              title="Eliminar plantilla"
                           >
                              ×
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>
      )}
   </div>
);

export default ModalPlantillasRele;
