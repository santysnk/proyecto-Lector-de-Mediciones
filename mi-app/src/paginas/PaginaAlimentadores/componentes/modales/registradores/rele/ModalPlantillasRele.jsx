import { useState, useEffect } from "react";
import { SEVERIDADES_DISPONIBLES } from "../../../../utilidades/interpreteRegistrosREF615";
import { useTransformadores } from "../../../../hooks/mediciones";
import { useFuncionalidadesPlantilla, CATEGORIAS_FUNCIONALIDADES } from "../../../../hooks/rele";
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

   // Hook de funcionalidades
   const funcionalidadesHook = useFuncionalidadesPlantilla();

   // Estado del formulario
   const [modo, setModo] = useState("lista");
   const [nombre, setNombre] = useState("");
   const [descripcion, setDescripcion] = useState("");
   const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
   const [error, setError] = useState("");

   // Portapapeles para copiar/pegar etiquetas de bits entre funcionalidades
   const [portapapelesEtiquetasBits, setPortapapelesEtiquetasBits] = useState(null);

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
      const resultado = funcionalidadesHook.agregarFuncionalidad();
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
      };

      if (modo === "crear") {
         const nueva = onCrear(datos);
         if (nueva) resetFormulario();
      } else if (modo === "editar" && plantillaSeleccionada) {
         const exito = onActualizar(plantillaSeleccionada.id, datos);
         if (exito) resetFormulario();
      }
   };

   /**
    * Guardar sin cerrar el modal (para botones de guardado parcial como etiquetas de bits)
    * Retorna true si se guardó exitosamente
    */
   const handleGuardarSinCerrar = async () => {
      if (!validarFormulario()) return false;

      const datos = {
         nombre: nombre.trim(),
         descripcion: descripcion.trim(),
         funcionalidades: funcionalidadesHook.obtenerParaGuardar(),
      };

      if (modo === "editar" && plantillaSeleccionada) {
         // Llamar a onActualizar pero NO resetear el formulario
         const exito = onActualizar(plantillaSeleccionada.id, datos);
         return exito;
      }
      return false;
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
                     onCambiarEtiquetaBitFunc={funcionalidadesHook.cambiarEtiquetaBitFunc}
                     onCambiarSeveridadBitFunc={funcionalidadesHook.cambiarSeveridadBitFunc}
                     onAgregarBitFunc={funcionalidadesHook.agregarBitFunc}
                     onQuitarBitFunc={funcionalidadesHook.quitarBitFunc}
                     onPegarEtiquetasBitsFunc={funcionalidadesHook.pegarEtiquetasBitsFunc}
                     portapapelesEtiquetasBits={portapapelesEtiquetasBits}
                     setPortapapelesEtiquetasBits={setPortapapelesEtiquetasBits}
                     onGuardarSinCerrar={handleGuardarSinCerrar}
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
   onCambiarEtiquetaBitFunc,
   onCambiarSeveridadBitFunc,
   onAgregarBitFunc,
   onQuitarBitFunc,
   onPegarEtiquetasBitsFunc,
   portapapelesEtiquetasBits,
   setPortapapelesEtiquetasBits,
   onGuardarSinCerrar,
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
            onCambiarEtiquetaBitFunc={onCambiarEtiquetaBitFunc}
            onCambiarSeveridadBitFunc={onCambiarSeveridadBitFunc}
            onAgregarBitFunc={onAgregarBitFunc}
            onQuitarBitFunc={onQuitarBitFunc}
            onPegarEtiquetasBitsFunc={onPegarEtiquetasBitsFunc}
            portapapelesEtiquetasBits={portapapelesEtiquetasBits}
            setPortapapelesEtiquetasBits={setPortapapelesEtiquetasBits}
            onGuardarSinCerrar={onGuardarSinCerrar}
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
   onCambiarEtiquetaBitFunc,
   onCambiarSeveridadBitFunc,
   onAgregarBitFunc,
   onQuitarBitFunc,
   onPegarEtiquetasBitsFunc,
   portapapelesEtiquetasBits,
   setPortapapelesEtiquetasBits,
   onGuardarSinCerrar,
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
                        onCambiarEtiquetaBitFunc={onCambiarEtiquetaBitFunc}
                        onCambiarSeveridadBitFunc={onCambiarSeveridadBitFunc}
                        onAgregarBitFunc={onAgregarBitFunc}
                        onQuitarBitFunc={onQuitarBitFunc}
                        onPegarEtiquetasBitsFunc={onPegarEtiquetasBitsFunc}
                        portapapelesEtiquetasBits={portapapelesEtiquetasBits}
                        setPortapapelesEtiquetasBits={setPortapapelesEtiquetasBits}
                        onGuardarSinCerrar={onGuardarSinCerrar}
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
   onCambiarEtiquetaBitFunc,
   onCambiarSeveridadBitFunc,
   onAgregarBitFunc,
   onQuitarBitFunc,
   onPegarEtiquetasBitsFunc,
   portapapelesEtiquetasBits,
   setPortapapelesEtiquetasBits,
   onGuardarSinCerrar,
   obtenerTIs,
   obtenerTVs,
   obtenerRelaciones,
}) => {
   const [etiquetasBitsAbierto, setEtiquetasBitsAbierto] = useState(false);
   const [guardando, setGuardando] = useState(false);
   const configHistorial = func.configHistorial || {};
   const tieneMultiplesRegistros = func.registros && func.registros.length > 1;
   const tieneTimelineBits = configHistorial.timelineBits === true;
   const etiquetasBits = func.etiquetasBits || {};
   // Obtener los índices de bits existentes, ordenados numéricamente
   const indicesBits = Object.keys(etiquetasBits).map(Number).sort((a, b) => a - b);
   const cantidadEtiquetasConfiguradas = indicesBits.filter(k => etiquetasBits[k]?.texto).length;
   // Verificar si hay algo en el portapapeles
   const hayPortapapeles = portapapelesEtiquetasBits && Object.keys(portapapelesEtiquetasBits).length > 0;

   const handleGuardarEtiquetas = async () => {
      setGuardando(true);
      try {
         await onGuardarSinCerrar();
      } finally {
         setGuardando(false);
      }
   };

   const handleCopiarEtiquetas = () => {
      // Copiar profundamente las etiquetas actuales
      const copia = {};
      Object.entries(etiquetasBits).forEach(([indice, config]) => {
         copia[indice] = { ...config };
      });
      setPortapapelesEtiquetasBits(copia);
   };

   const handlePegarEtiquetas = () => {
      if (hayPortapapeles) {
         onPegarEtiquetasBitsFunc(func.id, portapapelesEtiquetasBits);
      }
   };

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

         {/* Sección de etiquetas de bits (solo si timelineBits está activo) */}
         {tieneTimelineBits && func.habilitado && (
            <div className="modal-plantillas-etiquetas-bits-func">
               <div
                  className="modal-plantillas-etiquetas-bits-header"
                  onClick={() => setEtiquetasBitsAbierto(!etiquetasBitsAbierto)}
               >
                  <span className={`modal-plantillas-chevron-small ${etiquetasBitsAbierto ? "abierto" : ""}`}>▶</span>
                  <span>Etiquetas de bits</span>
                  {indicesBits.length > 0 && (
                     <span className="modal-plantillas-badge-small">{indicesBits.length}</span>
                  )}
               </div>

               {etiquetasBitsAbierto && (
                  <div className="modal-plantillas-etiquetas-bits-contenido">
                     {indicesBits.length === 0 ? (
                        <div className="modal-plantillas-bits-vacio">
                           No hay bits configurados. Usa el botón "+ Agregar bit" para comenzar.
                        </div>
                     ) : (
                        indicesBits.map((bit) => (
                           <div key={bit} className="modal-plantillas-bit-item-func">
                              <span className="modal-plantillas-bit-numero-func">Bit {bit}:</span>
                              <input
                                 type="text"
                                 className="modal-plantillas-bit-etiqueta-func"
                                 value={etiquetasBits[bit]?.texto || ""}
                                 onChange={(e) => onCambiarEtiquetaBitFunc(func.id, bit, e.target.value)}
                                 placeholder={`Sin etiqueta`}
                              />
                              <select
                                 className={`modal-plantillas-bit-severidad-func severidad-${etiquetasBits[bit]?.severidad || "info"}`}
                                 value={etiquetasBits[bit]?.severidad || "info"}
                                 onChange={(e) => onCambiarSeveridadBitFunc(func.id, bit, e.target.value)}
                              >
                                 {SEVERIDADES_DISPONIBLES.map((sev) => (
                                    <option key={sev.id} value={sev.id}>{sev.nombre}</option>
                                 ))}
                              </select>
                           </div>
                        ))
                     )}

                     {/* Botones de agregar/quitar bit y guardar */}
                     <div className="modal-plantillas-bits-acciones">
                        <div className="modal-plantillas-bits-botones">
                           <button
                              type="button"
                              className="modal-plantillas-btn-bit modal-plantillas-btn-agregar-bit"
                              onClick={() => onAgregarBitFunc(func.id)}
                              title="Agregar un nuevo bit"
                           >
                              + Agregar bit
                           </button>
                           <button
                              type="button"
                              className="modal-plantillas-btn-bit modal-plantillas-btn-quitar-bit"
                              onClick={() => onQuitarBitFunc(func.id)}
                              disabled={indicesBits.length === 0}
                              title="Quitar el último bit"
                           >
                              - Quitar bit
                           </button>
                        </div>
                        <div className="modal-plantillas-bits-botones-derecha">
                           <button
                              type="button"
                              className="modal-plantillas-btn-bit modal-plantillas-btn-copiar-bits"
                              onClick={handleCopiarEtiquetas}
                              disabled={indicesBits.length === 0}
                              title="Copiar etiquetas de bits"
                           >
                              Copiar
                           </button>
                           <button
                              type="button"
                              className="modal-plantillas-btn-bit modal-plantillas-btn-pegar-bits"
                              onClick={handlePegarEtiquetas}
                              disabled={!hayPortapapeles}
                              title={hayPortapapeles ? `Pegar ${Object.keys(portapapelesEtiquetasBits).length} etiquetas` : "No hay etiquetas copiadas"}
                           >
                              Pegar
                           </button>
                           <button
                              type="button"
                              className="modal-plantillas-btn-guardar-bits"
                              onClick={handleGuardarEtiquetas}
                              disabled={guardando}
                              title="Guardar etiquetas sin cerrar el modal"
                           >
                              {guardando ? "Guardando..." : "Guardar"}
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export default ModalPlantillasRele;
