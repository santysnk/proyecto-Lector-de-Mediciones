// src/paginas/PaginaAlimentadores/componentes/modales/ModalEditarPuestos.jsx

import React, { useState, useEffect } from "react";
import "./ModalEditarPuestos.css";
import { ColorPickerSimple, TabApariencia } from "../comunes";
import { ESCALA_MIN, ESCALA_MAX } from "../../../constantes/escalas";
import InputEscala from "./InputEscala";

const ModalEditarPuestos = ({
   abierto,
   puestos,
   onCerrar,
   onGuardar,
   esCreador,
   rolEnWorkspace,
   obtenerEscalaPuesto,
   onEscalaPuestoChange,
   estilosGlobales,
   onGuardarEstilos,
}) => {
   const [puestosEditados, setPuestosEditados] = useState([]);
   const [tabActiva, setTabActiva] = useState("puestos");

   const puedeEditarNombre = esCreador || rolEnWorkspace === 'admin';

   useEffect(() => {
      if (abierto) {
         setPuestosEditados(puestos.map((p) => ({ ...p })));
      }
   }, [abierto, puestos]);

   const handleSubmit = () => {
      onGuardar(puestosEditados);
   };

   const cambiarNombre = (id, nombreNuevo) => {
      setPuestosEditados((prev) =>
         prev.map((p) => (p.id === id ? { ...p, nombre: nombreNuevo } : p))
      );
   };

   const cambiarColorBoton = (id, colorNuevo) => {
      setPuestosEditados((prev) =>
         prev.map((p) => (p.id === id ? { ...p, color: colorNuevo } : p))
      );
   };

   const cambiarColorFondo = (id, colorNuevo) => {
      setPuestosEditados((prev) =>
         prev.map((p) => (p.id === id ? { ...p, bgColor: colorNuevo } : p))
      );
   };

   const eliminar = (id) => {
      setPuestosEditados((prev) => prev.filter((p) => p.id !== id));
   };

   if (!abierto) return null;

   const clasesContenedor = `editar-contenedor${tabActiva === "apariencia" ? " editar-contenedor--apariencia" : ""}`;

   return (
      <div className="editar-fondo-oscuro">
         <div className={clasesContenedor}>
            <h2>Configuración</h2>

            {/* Sistema de tabs */}
            <div className="editar-tabs">
               <button
                  type="button"
                  className={`editar-tab ${tabActiva === "puestos" ? "editar-tab--activo" : ""}`}
                  onClick={() => setTabActiva("puestos")}
               >
                  Puestos
               </button>
               <button
                  type="button"
                  className={`editar-tab ${tabActiva === "apariencia" ? "editar-tab--activo" : ""}`}
                  onClick={() => setTabActiva("apariencia")}
               >
                  Apariencia
               </button>
            </div>

            {/* Contenido de la tab activa */}
            {tabActiva === "puestos" ? (
               <div className="editar-lista">
                  {puestosEditados.map((p) => (
                     <div key={p.id} className="editar-fila">
                        <input
                           type="text"
                           className="editar-nombre"
                           value={p.nombre}
                           onChange={(e) => cambiarNombre(p.id, e.target.value)}
                           disabled={!puedeEditarNombre}
                        />

                        <div className="editar-controles">
                           <ColorPickerSimple
                              color={p.color || "#22c55e"}
                              onChange={(newColor) => cambiarColorBoton(p.id, newColor)}
                              label="Botón"
                           />

                           <ColorPickerSimple
                              color={p.bgColor || "#e5e7eb"}
                              onChange={(newColor) => cambiarColorFondo(p.id, newColor)}
                              label="Fondo"
                           />

                           {obtenerEscalaPuesto && onEscalaPuestoChange && (
                              <div className="editar-escala">
                                 <label className="editar-escala-label">(0.5 - 2)</label>
                                 <InputEscala
                                    valor={obtenerEscalaPuesto(p.id) ?? 1.0}
                                    onChange={(nuevoValor) => onEscalaPuestoChange(p.id, nuevoValor)}
                                    min={ESCALA_MIN}
                                    max={ESCALA_MAX}
                                 />
                              </div>
                           )}

                           {puedeEditarNombre && (
                              <button
                                 type="button"
                                 className="editar-eliminar"
                                 onClick={() => eliminar(p.id)}
                              >
                                 Eliminar
                              </button>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               estilosGlobales && (
                  <TabApariencia
                     estilosIniciales={estilosGlobales}
                     onGuardar={(nuevosEstilos) => {
                        onGuardarEstilos(nuevosEstilos);
                        onCerrar();
                     }}
                     onCancelar={onCerrar}
                  />
               )
            )}

            {/* Solo mostrar botones para la pestaña de Puestos */}
            {tabActiva === "puestos" && (
               <div className="editar-acciones">
                  <button
                     type="button"
                     className="editar-boton editar-cancelar"
                     onClick={onCerrar}
                  >
                     Cancelar
                  </button>
                  <button
                     type="button"
                     className="editar-boton editar-guardar"
                     onClick={handleSubmit}
                  >
                     Guardar
                  </button>
               </div>
            )}
         </div>
      </div>
   );
};

export default ModalEditarPuestos;
