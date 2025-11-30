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
   onEliminar,
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

   // ===== ESTADO DEL TEST MODBUS =====
   const [testEstado, setTestEstado] = useState("idle"); // idle | cargando | ok | error
   const [testError, setTestError] = useState("");
   const [testRegistros, setTestRegistros] = useState([]);

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

         // cada vez que abrís el modal, reseteo el test
         setTestEstado("idle");
         setTestError("");
         setTestRegistros([]);
      }
   }, [abierto, initialData]);

   if (!abierto) return null;

   // ========= GUARDAR =========
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

   // ========= ELIMINAR =========
   const handleEliminarClick = () => {
      if (!onEliminar) return;
      const seguro = window.confirm(
         "¿Seguro que querés eliminar este registrador?"
      );
      if (seguro) {
         onEliminar();
      }
   };

   // ========= TEST MODBUS =========
   const handleTestConexion = async () => {
      // uso la config de la pestaña actual
      const cfg = tab === "rele" ? rele : analizador;

      const ip = cfg.ip.trim();
      const puerto = Number(cfg.puerto);
      const indiceInicial = Number(cfg.indiceInicial);
      const cantRegistros = Number(cfg.cantRegistros);

      if (!ip || !puerto || !Number.isFinite(indiceInicial) || !Number.isFinite(cantRegistros)) {
         setTestEstado("error");
         setTestError(
            "Completá IP, puerto, índice inicial y cantidad de registros antes de probar."
         );
         setTestRegistros([]);
         return;
      }

      setTestEstado("cargando");
      setTestError("");
      setTestRegistros([]);

      try {
         // ⚠️ Cambiá esta URL por la de tu backend Modbus
         const resp = await fetch("http://localhost:5000/api/modbus/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               tipo: tab,        // "rele" o "analizador" (por si lo querés distinguir)
               ip,
               puerto,
               indiceInicial,
               cantRegistros,
            }),
         });

         if (!resp.ok) {
            throw new Error(`Error HTTP ${resp.status}`);
         }

         const data = await resp.json();
         const regs = Array.isArray(data.registros) ? data.registros : [];

         setTestRegistros(regs);
         setTestEstado("ok");
      } catch (err) {
         console.error(err);
         setTestEstado("error");
         setTestError(
            err.message || "Error al conectar o leer los registros."
         );
      }
   };

   // índice base para mostrar en la tabla
   const indiceBase =
      tab === "rele"
         ? Number(rele.indiceInicial || 0)
         : Number(analizador.indiceInicial || 0);

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
               {/* ===== NOMBRE ===== */}
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

               {/* ===== COLORES ===== */}
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

               {/* ===== TABS ===== */}
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

               {/* ===== CAMPOS RELÉ ===== */}
               {tab === "rele" && (
                  <>
                     <div className="alim-modal-grid">
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
                           <span className="alim-field-label">
                              Índice inicial
                           </span>
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

                     {/* BOTÓN TEST PARA RELÉ */}
                     <div className="alim-test-row">
                        <button
                           type="button"
                           className="alim-test-btn"
                           onClick={handleTestConexion}
                           disabled={testEstado === "cargando"}
                        >
                           {testEstado === "cargando"
                              ? "Probando..."
                              : "Test conexión"}
                        </button>
                     </div>
                  </>
               )}

               {/* ===== CAMPOS ANALIZADOR ===== */}
               {tab === "analizador" && (
                  <>
                     <div className="alim-modal-grid">
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
                           <span className="alim-field-label">
                              Índice inicial
                           </span>
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

                     {/* BOTÓN TEST PARA ANALIZADOR */}
                     <div className="alim-test-row">
                        <button
                           type="button"
                           className="alim-test-btn"
                           onClick={handleTestConexion}
                           disabled={testEstado === "cargando"}
                        >
                           {testEstado === "cargando"
                              ? "Probando..."
                              : "Test conexión"}
                        </button>
                     </div>
                  </>
               )}

               {/* ===== RESULTADO DEL TEST (tabla) ===== */}
               {testEstado !== "idle" && (
                  <div className="alim-test-panel">
                     {testEstado === "cargando" && (
                        <p className="alim-test-info">
                           Probando conexión Modbus...
                        </p>
                     )}

                     {testEstado === "error" && (
                        <p className="alim-test-error">{testError}</p>
                     )}

                     {testEstado === "ok" && (
                        <>
                           <p className="alim-test-ok">
                              Test correcto. Registros leídos:{" "}
                              {testRegistros.length}
                           </p>
                           <table className="alim-test-table">
                              <thead>
                                 <tr>
                                    <th>#</th>
                                    <th>Dirección</th>
                                    <th>Valor</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {testRegistros.map((valor, i) => (
                                    <tr key={i}>
                                       <td>{i}</td>
                                       <td>{indiceBase + i}</td>
                                       <td>{valor}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </>
                     )}
                  </div>
               )}

               {/* ===== BOTONES FINALES ===== */}
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
