// modales/registradores/analizador/ModalPlantillasAnalizador.jsx
// Modal para gestionar plantillas de analizadores de redes

import { useState, useEffect } from "react";
import { useFuncionalidadesAnalizador } from "../../../../hooks/analizador";
import { ListaPlantillas, FormularioPlantilla } from "./ComponentesPlantillaAnalizador";
import "../rele/ModalPlantillasRele.css";

const ModalPlantillasAnalizador = ({
   abierto, onCerrar, plantillas, onCrear, onActualizar, onEliminar,
   plantillaEditando = null, obtenerTIs, obtenerTVs, obtenerRelaciones,
}) => {
   const funcionalidadesHook = useFuncionalidadesAnalizador();
   const [modo, setModo] = useState("lista");
   const [nombre, setNombre] = useState("");
   const [descripcion, setDescripcion] = useState("");
   const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
   const [error, setError] = useState("");

   useEffect(() => {
      if (plantillaEditando && abierto) {
         setModo("editar");
         setPlantillaSeleccionada(plantillaEditando);
         setNombre(plantillaEditando.nombre);
         setDescripcion(plantillaEditando.descripcion || "");
         funcionalidadesHook.cargarDesdeObjeto(plantillaEditando.funcionalidades);
      }
   }, [plantillaEditando, abierto]);

   useEffect(() => { if (!abierto) resetFormulario(); }, [abierto]);

   const resetFormulario = () => {
      setModo("lista");
      setNombre("");
      setDescripcion("");
      setPlantillaSeleccionada(null);
      setError("");
      funcionalidadesHook.resetear();
   };

   const iniciarEdicion = (plantilla) => {
      setPlantillaSeleccionada(plantilla);
      setNombre(plantilla.nombre);
      setDescripcion(plantilla.descripcion || "");
      funcionalidadesHook.cargarDesdeObjeto(plantilla.funcionalidades);
      setModo("editar");
   };

   const handleAgregarFuncionalidad = () => {
      if (!funcionalidadesHook.nuevaFunc.nombre.trim()) { setError("El nombre de la medición es requerido"); return; }
      funcionalidadesHook.agregarFuncionalidad();
      setError("");
   };

   const validarFormulario = () => {
      if (!nombre.trim()) { setError("El nombre de la plantilla es requerido"); return false; }
      if (funcionalidadesHook.funcionalidades.length === 0) { setError("Debes agregar al menos una medición"); return false; }
      if (!funcionalidadesHook.funcionalidades.some((f) => f.habilitado)) { setError("Debe habilitar al menos una medición"); return false; }
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
      if (modo === "crear") { if (onCrear(datos)) resetFormulario(); }
      else if (modo === "editar" && plantillaSeleccionada) { if (onActualizar(plantillaSeleccionada.id, datos)) resetFormulario(); }
   };

   const handleEliminar = (plantilla) => {
      if (window.confirm(`¿Eliminar la plantilla "${plantilla.nombre}"? Esta acción no se puede deshacer.`)) onEliminar(plantilla.id);
   };

   if (!abierto) return null;

   return (
      <div className="modal-plantillas-overlay">
         <div className="modal-plantillas-contenido">
            <div className="modal-plantillas-header">
               <h3>
                  {modo === "lista" && "Gestionar Plantillas de Analizador"}
                  {modo === "crear" && "Nueva Plantilla de Analizador"}
                  {modo === "editar" && "Editar Plantilla"}
               </h3>
               <button className="modal-plantillas-cerrar" onClick={onCerrar}>×</button>
            </div>

            <div className="modal-plantillas-body">
               {modo === "lista" && (
                  <ListaPlantillas
                     plantillas={plantillas}
                     onCrear={() => { resetFormulario(); setModo("crear"); }}
                     onEditar={iniciarEdicion}
                     onEliminar={handleEliminar}
                     contarFuncionalidades={funcionalidadesHook.contarFuncionalidades}
                  />
               )}
               {(modo === "crear" || modo === "editar") && (
                  <FormularioPlantilla
                     error={error} nombre={nombre} setNombre={setNombre}
                     descripcion={descripcion} setDescripcion={setDescripcion}
                     nuevaFunc={funcionalidadesHook.nuevaFunc} setNuevaFunc={funcionalidadesHook.setNuevaFunc}
                     onAgregarFuncionalidad={handleAgregarFuncionalidad}
                     funcionalidades={funcionalidadesHook.funcionalidades}
                     onToggleFuncionalidad={funcionalidadesHook.toggleFuncionalidad}
                     onMoverArriba={funcionalidadesHook.moverFuncionalidadArriba}
                     onMoverAbajo={funcionalidadesHook.moverFuncionalidadAbajo}
                     onEliminarFuncionalidad={funcionalidadesHook.eliminarFuncionalidad}
                     onCambiarEtiqueta={funcionalidadesHook.cambiarEtiquetaRegistro}
                     onCambiarValorRegistro={funcionalidadesHook.cambiarValorRegistro}
                     onCambiarTransformadorRegistro={funcionalidadesHook.cambiarTransformadorRegistro}
                     obtenerTIs={obtenerTIs} obtenerTVs={obtenerTVs} obtenerRelaciones={obtenerRelaciones}
                  />
               )}
            </div>

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

export default ModalPlantillasAnalizador;
