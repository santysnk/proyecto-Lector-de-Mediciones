// src/lib/Alimentadores/NuevoAlimentadorModal.jsx
import React, { useEffect, useState } from "react";
import "./Alimentadores.css";

const COLORES_ALIM = [
   "#22c55e",
   "#0ea5e9",
   "#3b82f6",
   "#a855f7",
   "#ec4899",
   "#f97316",
   "#ef4444",
   "#eab308",
   "#14b8a6",
   "#10b981",
   "#6366f1",
   "#64748b",
];

const NuevoAlimentadorModal = ({
   abierto,
   puestoNombre,
   modo = "crear",
   initialData,
   onCancelar,
   onConfirmar,
   onEliminar, // 👈 nueva prop
}) => {
   const [nombre, setNombre] = useState("");
   const [color, setColor] = useState(COLORES_ALIM[0]);
   const [tab, setTab] = useState("rele");

   const [rele, setRele] = useState({
      ip: "",
      puerto: "",
      indiceInicial: "",
      cantRegistros: "",
      relacionTI: "",
   });

   const [analizador, setAnalizador] = useState({
      ip: "",
      puerto: "502",
      indiceInicial: "",
      cantRegistros: "",
      relacionTI: "",
   });

   useEffect(() => {
      if (abierto) {
         if (initialData) {
            setNombre(initialData.nombre || "");
            setColor(initialData.color || COLORES_ALIM[0]);
            setTab("rele");

            setRele({
               ip: initialData.rele?.ip || "",
               puerto: String(initialData.rele?.puerto ?? ""),
               indiceInicial: initialData.rele?.indiceInicial ?? "",
               cantRegistros: initialData.rele?.cantRegistros ?? "",
               relacionTI: initialData.rele?.relacionTI ?? "",
            });

            setAnalizador({
               ip: initialData.analizador?.ip || "",
               puerto: String(initialData.analizador?.puerto ?? ""),
               indiceInicial: initialData.analizador?.indiceInicial ?? "",
               cantRegistros: initialData.analizador?.cantRegistros ?? "",
               relacionTI: initialData.analizador?.relacionTI ?? "",
            });
         } else {
            setNombre("");
            setColor(COLORES_ALIM[0]);
            setTab("rele");
            setRele({
               ip: "",
               puerto: "",
               indiceInicial: "",
               cantRegistros: "",
               relacionTI: "",
            });
            setAnalizador({
               ip: "",
               puerto: "",
               indiceInicial: "",
               cantRegistros: "",
               relacionTI: "",
            });
         }
      }
   }, [abierto, initialData]);

   if (!abierto) return null;

   const handleSubmit = (e) => {
      e.preventDefault();
      const limpioNombre = nombre.trim();
      if (!limpioNombre) return;

      const datos = {
         nombre: limpioNombre,
         color,
         rele: {
            ...rele,
            puerto: rele.puerto ? Number(rele.puerto) : null,
            indiceInicial: rele.indiceInicial
               ? Number(rele.indiceInicial)
               : null,
            cantRegistros: rele.cantRegistros
               ? Number(rele.cantRegistros)
               : null,
            relacionTI: rele.relacionTI ? Number(rele.relacionTI) : null,
         },
         analizador: {
            ...analizador,
            puerto: analizador.puerto ? Number(analizador.puerto) : null,
            indiceInicial: analizador.indiceInicial
               ? Number(analizador.indiceInicial)
               : null,
            cantRegistros: analizador.cantRegistros
               ? Number(analizador.cantRegistros)
               : null,
            relacionTI: analizador.relacionTI
               ? Number(analizador.relacionTI)
               : null,
         },
      };

      onConfirmar(datos);
   };

   const handleEliminarClick = () => {
      if (!onEliminar) return;
      const seguro = window.confirm(
         "¿Seguro que querés eliminar este registrador?"
      );
      if (seguro) {
         onEliminar();
      }
   };

   return (
      <div className="alim-modal-overlay">
         <div className="alim-modal">
            <h2>
               {modo === "editar"
                  ? "EDITAR REGISTRADOR: EN "
                  : "NUEVO REGISTRADOR: EN "}
               {puestoNombre}
            </h2>

            <form onSubmit={handleSubmit}>
               <label className="alim-modal-label">
                  Nombre
                  <input
                     type="text"
                     className="alim-modal-input"
                     value={nombre}
                     onChange={(e) => setNombre(e.target.value)}
                     placeholder="Ej: ALIMENTADOR 1"
                     autoFocus
                  />
               </label>

               <div className="alim-color-picker">
                  <div className="alim-color-grid">
                     {COLORES_ALIM.map((c) => (
                        <button
                           key={c}
                           type="button"
                           className={
                              "alim-color-swatch" +
                              (color === c ? " alim-color-swatch-selected" : "")
                           }
                           style={{ backgroundColor: c }}
                           onClick={() => setColor(c)}
                        />
                     ))}
                  </div>
               </div>

               <div className="alim-tabs">
                  <button
                     type="button"
                     className={
                        "alim-tab" + (tab === "rele" ? " alim-tab-active" : "")
                     }
                     onClick={() => setTab("rele")}
                  >
                     RELÉ
                  </button>
                  <button
                     type="button"
                     className={
                        "alim-tab" +
                        (tab === "analizador" ? " alim-tab-active" : "")
                     }
                     onClick={() => setTab("analizador")}
                  >
                     ANALIZADOR
                  </button>
               </div>

               {tab === "rele" && (
                  <div className="alim-modal-grid">
                     {/* campos RELÉ como ya los tenías */}
                     <label className="alim-field">
                        <span className="alim-field-label">Dirección IP</span>
                        <input
                           type="text"
                           className="alim-field-input"
                           value={rele.ip}
                           onChange={(e) =>
                              setRele({ ...rele, ip: e.target.value })
                           }
                           placeholder="Ej: 172.16.0.1"
                        />
                     </label>
                     <label className="alim-field">
                        <span className="alim-field-label">Puerto</span>
                        <input
                           type="number"
                           className="alim-field-input"
                           value={rele.puerto}
                           onChange={(e) =>
                              setRele({ ...rele, puerto: e.target.value })
                           }
                           placeholder="Ej: 502"
                        />
                     </label>
                     <label className="alim-field">
                        <span className="alim-field-label">Índice inicial</span>
                        <input
                           type="number"
                           className="alim-field-input"
                           value={rele.indiceInicial}
                           onChange={(e) =>
                              setRele({
                                 ...rele,
                                 indiceInicial: e.target.value,
                              })
                           }
                           placeholder="Ej: 137"
                        />
                     </label>
                     <label className="alim-field">
                        <span className="alim-field-label">
                           Cant. registros
                        </span>
                        <input
                           type="number"
                           className="alim-field-input"
                           value={rele.cantRegistros}
                           onChange={(e) =>
                              setRele({
                                 ...rele,
                                 cantRegistros: e.target.value,
                              })
                           }
                           placeholder="Ej: 3"
                        />
                     </label>
                     <label className="alim-field">
                        <span className="alim-field-label">Relación T.I</span>
                        <input
                           type="number"
                           className="alim-field-input"
                           value={rele.relacionTI}
                           onChange={(e) =>
                              setRele({
                                 ...rele,
                                 relacionTI: e.target.value,
                              })
                           }
                           placeholder="Ej: 250"
                        />
                     </label>
                  </div>
               )}

               {tab === "analizador" && (
                  <div className="alim-modal-grid">
                     {/* campos ANALIZADOR como ya los tenías */}
                     <label className="alim-field">
                        <span className="alim-field-label">Dirección IP</span>
                        <input
                           type="text"
                           className="alim-field-input"
                           value={analizador.ip}
                           onChange={(e) =>
                              setAnalizador({
                                 ...analizador,
                                 ip: e.target.value,
                              })
                           }
                           placeholder="Ej: 172.16.0.5"
                        />
                     </label>
                     <label className="alim-field">
                        <span className="alim-field-label">Puerto</span>
                        <input
                           type="number"
                           className="alim-field-input"
                           value={analizador.puerto}
                           onChange={(e) =>
                              setAnalizador({
                                 ...analizador,
                                 puerto: e.target.value,
                              })
                           }
                           placeholder="Ej: 502"
                        />
                     </label>
                     <label className="alim-field">
                        <span className="alim-field-label">Índice inicial</span>
                        <input
                           type="number"
                           className="alim-field-input"
                           value={analizador.indiceInicial}
                           onChange={(e) =>
                              setAnalizador({
                                 ...analizador,
                                 indiceInicial: e.target.value,
                              })
                           }
                           placeholder="Ej: 200"
                        />
                     </label>
                     <label className="alim-field">
                        <span className="alim-field-label">
                           Cant. registros
                        </span>
                        <input
                           type="number"
                           className="alim-field-input"
                           value={analizador.cantRegistros}
                           onChange={(e) =>
                              setAnalizador({
                                 ...analizador,
                                 cantRegistros: e.target.value,
                              })
                           }
                           placeholder="Ej: 10"
                        />
                     </label>
                     <label className="alim-field">
                        <span className="alim-field-label">Relación T.I</span>
                        <input
                           type="number"
                           className="alim-field-input"
                           value={analizador.relacionTI}
                           onChange={(e) =>
                              setAnalizador({
                                 ...analizador,
                                 relacionTI: e.target.value,
                              })
                           }
                           placeholder="Ej: 250"
                        />
                     </label>
                  </div>
               )}

               <div className="alim-modal-actions">
						{modo === "editar" && (
                     <button
                        type="button"
                        className="alim-modal-btn alim-modal-btn-eliminar"
                        onClick={handleEliminarClick}
                     >
                        Eliminar
                     </button>
                  )}

                  <button
                     type="button"
                     className="alim-modal-btn alim-modal-btn-cancelar"
                     onClick={onCancelar}
                  >
                     Cancelar
                  </button>

                  <button
                     type="submit"
                     className="alim-modal-btn alim-modal-btn-aceptar"
                  >
                     Aceptar
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

export default NuevoAlimentadorModal;
