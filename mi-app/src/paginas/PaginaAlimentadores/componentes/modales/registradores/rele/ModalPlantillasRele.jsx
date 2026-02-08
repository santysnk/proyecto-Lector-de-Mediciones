import { useState, useEffect } from "react";
import { useTransformadores } from "../../../../hooks/mediciones";
import { useFuncionalidadesPlantilla } from "../../../../hooks/rele";
import { ListaPlantillas, FormularioPlantilla } from "./ComponentesPlantillaRele";
import "./ModalPlantillasRele.css";

const ModalPlantillasRele = ({
   abierto, onCerrar, plantillas, onCrear, onActualizar, onEliminar,
   plantillaEditando = null, workspaceId,
}) => {
   const { obtenerTIs, obtenerTVs, obtenerRelaciones, recargar: recargarTransformadores } = useTransformadores(workspaceId);
   const funcionalidadesHook = useFuncionalidadesPlantilla();

   const [modo, setModo] = useState("lista");
   const [nombre, setNombre] = useState("");
   const [descripcion, setDescripcion] = useState("");
   const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
   const [error, setError] = useState("");
   const [portapapelesEtiquetasBits, setPortapapelesEtiquetasBits] = useState(null);

   useEffect(() => { if (abierto) recargarTransformadores(); }, [abierto, recargarTransformadores]);

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
      setModo("lista"); setNombre(""); setDescripcion("");
      setPlantillaSeleccionada(null); setError(""); funcionalidadesHook.resetear();
   };

   const iniciarCreacion = () => { resetFormulario(); setModo("crear"); };

   const iniciarEdicion = (plantilla) => {
      setPlantillaSeleccionada(plantilla); setNombre(plantilla.nombre);
      setDescripcion(plantilla.descripcion || "");
      funcionalidadesHook.cargarDesdeObjeto(plantilla.funcionalidades); setModo("editar");
   };

   const handleAgregarFuncionalidad = () => {
      const resultado = funcionalidadesHook.agregarFuncionalidad();
      setError(resultado.exito ? "" : resultado.error);
   };

   const validarFormulario = () => {
      if (!nombre.trim()) { setError("El nombre de la plantilla es requerido"); return false; }
      if (funcionalidadesHook.funcionalidades.length === 0) { setError("Debes agregar al menos una funcionalidad"); return false; }
      if (!funcionalidadesHook.funcionalidades.some((f) => f.habilitado)) { setError("Debe habilitar al menos una funcionalidad"); return false; }
      setError(""); return true;
   };

   const construirDatos = () => ({
      nombre: nombre.trim(), descripcion: descripcion.trim(),
      funcionalidades: funcionalidadesHook.obtenerParaGuardar(),
   });

   const handleGuardar = () => {
      if (!validarFormulario()) return;
      const datos = construirDatos();
      if (modo === "crear") { if (onCrear(datos)) resetFormulario(); }
      else if (modo === "editar" && plantillaSeleccionada) { if (onActualizar(plantillaSeleccionada.id, datos)) resetFormulario(); }
   };

   const handleGuardarSinCerrar = async () => {
      if (!validarFormulario()) return false;
      if (modo === "editar" && plantillaSeleccionada) return onActualizar(plantillaSeleccionada.id, construirDatos());
      return false;
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
                  {modo === "lista" && "Gestionar Plantillas"}
                  {modo === "crear" && "Nueva Plantilla"}
                  {modo === "editar" && "Editar Plantilla"}
               </h3>
               <button className="modal-plantillas-cerrar" onClick={onCerrar}>×</button>
            </div>
            <div className="modal-plantillas-body">
               {modo === "lista" && (
                  <ListaPlantillas plantillas={plantillas} onCrear={iniciarCreacion} onEditar={iniciarEdicion} onEliminar={handleEliminar} contarFuncionalidades={funcionalidadesHook.contarFuncionalidades} />
               )}
               {(modo === "crear" || modo === "editar") && (
                  <FormularioPlantilla
                     error={error} nombre={nombre} setNombre={setNombre} descripcion={descripcion} setDescripcion={setDescripcion}
                     nuevaFunc={funcionalidadesHook.nuevaFunc} setNuevaFunc={funcionalidadesHook.setNuevaFunc}
                     onAgregarFuncionalidad={handleAgregarFuncionalidad} funcionalidades={funcionalidadesHook.funcionalidades}
                     onToggleFuncionalidad={funcionalidadesHook.toggleFuncionalidad}
                     onMoverArriba={funcionalidadesHook.moverFuncionalidadArriba} onMoverAbajo={funcionalidadesHook.moverFuncionalidadAbajo}
                     onEliminarFuncionalidad={funcionalidadesHook.eliminarFuncionalidad}
                     onCambiarEtiqueta={funcionalidadesHook.cambiarEtiquetaRegistro} onCambiarValorRegistro={funcionalidadesHook.cambiarValorRegistro}
                     onCambiarTransformadorRegistro={funcionalidadesHook.cambiarTransformadorRegistro}
                     onCambiarConfigHistorial={funcionalidadesHook.cambiarConfigHistorial}
                     onCambiarEtiquetaBitFunc={funcionalidadesHook.cambiarEtiquetaBitFunc} onCambiarSeveridadBitFunc={funcionalidadesHook.cambiarSeveridadBitFunc}
                     onAgregarBitFunc={funcionalidadesHook.agregarBitFunc} onQuitarBitFunc={funcionalidadesHook.quitarBitFunc}
                     onPegarEtiquetasBitsFunc={funcionalidadesHook.pegarEtiquetasBitsFunc}
                     portapapelesEtiquetasBits={portapapelesEtiquetasBits} setPortapapelesEtiquetasBits={setPortapapelesEtiquetasBits}
                     onGuardarSinCerrar={handleGuardarSinCerrar}
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

export default ModalPlantillasRele;
