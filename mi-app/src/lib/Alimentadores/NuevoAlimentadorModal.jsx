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

// Secciones de mapeo de mediciones (panel derecho)
const SECCIONES_MAPEO = [
   {
      id: "tension_linea",
      titulo: "Tensión de línea (kV)",
      items: ["L1", "L2", "L3"],
   },
   {
      id: "tension_entre_lineas",
      titulo: "Tensión entre líneas (kV)",
      items: ["L1-L2", "L2-L3", "L1-L3"],
   },
   {
      id: "corriente_linea",
      titulo: "Corriente de línea (A)",
      items: ["L1", "L2", "L3"],
   },
   {
      id: "potencia_activa",
      titulo: "Potencia activa (kW)",
      items: ["L1", "L2", "L3", "Total"],
   },
   {
      id: "potencia_reactiva",
      titulo: "Potencia reactiva (kVAr)",
      items: ["L1", "L2", "L3", "Total"],
   },
   {
      id: "potencia_aparente",
      titulo: "Potencia aparente (kVA)",
      items: ["L1", "L2", "L3", "Total"],
   },
   {
      id: "factor_potencia",
      titulo: "Factor de Potencia",
      items: ["L1", "L2", "L3"],
   },
   {
      id: "frecuencia",
      titulo: "Frecuencia (Hz)",
      items: ["L1", "L2", "L3"],
   },
   {
      id: "corriente_neutro",
      titulo: "Corriente de Neutro (A)",
      items: ["N"],
   },
];

function crearMapeoVacio() {
   const base = {};
   SECCIONES_MAPEO.forEach((sec) => {
      base[sec.id] = {};
      sec.items.forEach((item) => {
         base[sec.id][item] = {
            enabled: false,
            registro: "",
            formula: "",
         };
      });
   });
   return base;
}

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

   // Config RELÉ
   const [rele, setRele] = useState({
      ip: "",
      puerto: "",
      indiceInicial: "",
      cantRegistros: "",
   });

   // Periodo de actualización (s) – antes estaba Relación T.I
   const [periodoSegundos, setPeriodoSegundos] = useState("60");

   // Config ANALIZADOR
   const [analizador, setAnalizador] = useState({
      ip: "",
      puerto: "502",
      indiceInicial: "",
      cantRegistros: "",
      relacionTI: "",
   });

   // Estado del test
   const [isTesting, setIsTesting] = useState(false);
   const [testError, setTestError] = useState("");
   const [testRows, setTestRows] = useState([]); // [{index, address, value}]

   // Panel de mapeo
   const [mostrarMapeo, setMostrarMapeo] = useState(false);
   const [mapeoMediciones, setMapeoMediciones] = useState(crearMapeoVacio);

   // === Cargar datos al abrir ===
   useEffect(() => {
      if (!abierto) return;

      if (initialData) {
         setNombre(initialData.nombre || "");
         setColor(initialData.color || COLORES_ALIM[0]);
         setTab("rele");

         setRele({
            ip: initialData.rele?.ip || "",
            puerto: String(initialData.rele?.puerto ?? ""),
            indiceInicial: initialData.rele?.indiceInicial ?? "",
            cantRegistros: initialData.rele?.cantRegistros ?? "",
         });

         setPeriodoSegundos(
            initialData.periodoSegundos != null
               ? String(initialData.periodoSegundos)
               : "60"
         );

         setAnalizador({
            ip: initialData.analizador?.ip || "",
            puerto: String(initialData.analizador?.puerto ?? "502"),
            indiceInicial: initialData.analizador?.indiceInicial ?? "",
            cantRegistros: initialData.analizador?.cantRegistros ?? "",
            relacionTI: initialData.analizador?.relacionTI ?? "",
         });

         // Cargar mapeo si existe, si no, uno vacío
         if (initialData.mapeoMediciones) {
            // Mezclamos con un esqueleto vacío por si faltan claves
            const base = crearMapeoVacio();
            const guardado = initialData.mapeoMediciones;
            const combinado = { ...base };

            SECCIONES_MAPEO.forEach((sec) => {
               sec.items.forEach((item) => {
                  combinado[sec.id][item] = {
                     ...base[sec.id][item],
                     ...(guardado[sec.id]?.[item] || {}),
                  };
               });
            });

            setMapeoMediciones(combinado);
         } else {
            setMapeoMediciones(crearMapeoVacio());
         }
      } else {
         // Nuevo alimentador
         setNombre("");
         setColor(COLORES_ALIM[0]);
         setTab("rele");
         setRele({
            ip: "",
            puerto: "",
            indiceInicial: "",
            cantRegistros: "",
         });
         setPeriodoSegundos("60");
         setAnalizador({
            ip: "",
            puerto: "502",
            indiceInicial: "",
            cantRegistros: "",
            relacionTI: "",
         });
         setMapeoMediciones(crearMapeoVacio());
      }

      // Reset de estado de test y mapeo al abrir
      setIsTesting(false);
      setTestError("");
      setTestRows([]);
      setMostrarMapeo(false);
   }, [abierto, initialData]);

   if (!abierto) return null;

   // === TEST CONEXIÓN (simulado / o backend real) ===
   const handleTestConexion = async () => {
      const ip = rele.ip.trim();
      const puerto = Number(rele.puerto);
      const inicio = Number(rele.indiceInicial);
      const cantidad = Number(rele.cantRegistros);

      if (!ip || !puerto || isNaN(inicio) || isNaN(cantidad) || cantidad <= 0) {
         setTestError(
            "Completa IP, puerto, índice inicial y cantidad de registros antes de probar."
         );
         setTestRows([]);
         return;
      }

      setIsTesting(true);
      setTestError("");
      setTestRows([]);

      try {
         // 👉 Aquí va TU lógica real:
         //    - llamar a tu backend que consulta Modbus
         //    - o a tu API fake
         //
         // Ejemplo de datos de prueba (BORRÁ ESTO cuando uses los reales):
         const registros = Array.from({ length: cantidad }, (_, i) => ({
            index: i,
            address: inicio + i,
            value: 100 + i * 5, // valor ficticio
         }));

         // Simulamos pequeña demora
         await new Promise((res) => setTimeout(res, 300));

         setTestRows(registros);
      } catch (err) {
         console.error(err);
         setTestError(
            err?.message || "Error de red o al intentar leer los registros."
         );
         setTestRows([]);
      } finally {
         setIsTesting(false);
      }
   };

   const puedeConfigurarMapeo = testRows.length > 0 && !testError && !isTesting;

   // === SUBMIT GENERAL ===
   const handleSubmit = (e) => {
      e.preventDefault();
      const limpioNombre = nombre.trim();
      if (!limpioNombre) return;

      const datos = {
         nombre: limpioNombre,
         color,
         periodoSegundos: periodoSegundos ? Number(periodoSegundos) : null,

         rele: {
            ...rele,
            puerto: rele.puerto ? Number(rele.puerto) : null,
            indiceInicial: rele.indiceInicial
               ? Number(rele.indiceInicial)
               : null,
            cantRegistros: rele.cantRegistros
               ? Number(rele.cantRegistros)
               : null,
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

         // Mandamos el mapeo hacia arriba (aunque todavía no lo uses)
         mapeoMediciones,
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

   // === Helpers mapeo ===
   const actualizarMapeo = (secId, itemId, campo, valor) => {
      setMapeoMediciones((prev) => ({
         ...prev,
         [secId]: {
            ...prev[secId],
            [itemId]: {
               ...prev[secId][itemId],
               [campo]: valor,
            },
         },
      }));
   };

   const toggleItemMapeo = (secId, itemId, enabled) => {
      actualizarMapeo(secId, itemId, "enabled", enabled);
   };

   return (
      <div className="alim-modal-overlay">
         <div className={`alim-modal ${mostrarMapeo ? "alim-modal-wide" : ""}`}>
            <h2>
               {modo === "editar"
                  ? "EDITAR REGISTRADOR: EN "
                  : "NUEVO REGISTRADOR: EN "}
               {puestoNombre}
            </h2>

            <form onSubmit={handleSubmit}>
               <div className="alim-modal-layout">
                  {/* === COLUMNA IZQUIERDA: CONFIG BÁSICA === */}
                  <div className="alim-modal-left">
                     {/* Nombre */}
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

                     {/* Paleta de colores */}
                     <div className="alim-color-picker">
                        <div className="alim-color-grid">
                           {COLORES_ALIM.map((c) => (
                              <button
                                 key={c}
                                 type="button"
                                 className={
                                    "alim-color-swatch" +
                                    (color === c
                                       ? " alim-color-swatch-selected"
                                       : "")
                                 }
                                 style={{ backgroundColor: c }}
                                 onClick={() => setColor(c)}
                              />
                           ))}
                        </div>
                     </div>

                     {/* Tabs RELÉ / ANALIZADOR */}
                     <div className="alim-tabs">
                        <button
                           type="button"
                           className={
                              "alim-tab" +
                              (tab === "rele" ? " alim-tab-active" : "")
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

                     {/* === TAB RELÉ === */}
                     {tab === "rele" && (
                        <div className="alim-modal-grid">
                           <label className="alim-field">
                              <span className="alim-field-label">
                                 Dirección IP
                              </span>
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
                                 placeholder="Ej: 20"
                              />
                           </label>

                           {/* Nuevo: Periodo actualización */}
                           <label className="alim-field">
                              <span className="alim-field-label">
                                 Periodo actualización (s)
                              </span>
                              <input
                                 type="number"
                                 className="alim-field-input"
                                 value={periodoSegundos}
                                 onChange={(e) =>
                                    setPeriodoSegundos(e.target.value)
                                 }
                                 placeholder="Ej: 60"
                                 min={1}
                              />
                           </label>

                           {periodoSegundos &&
                              Number(periodoSegundos) > 0 &&
                              Number(periodoSegundos) < 60 && (
                                 <p className="alim-warning">
                                    ⚠️ Periodos menores a 60&nbsp;s pueden
                                    recargar el sistema y la red de
                                    comunicaciones.
                                 </p>
                              )}
                        </div>
                     )}

                     {/* === TAB ANALIZADOR === */}
                     {tab === "analizador" && (
                        <div className="alim-modal-grid">
                           <label className="alim-field">
                              <span className="alim-field-label">
                                 Dirección IP
                              </span>
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
                              <span className="alim-field-label">
                                 Relación T.I
                              </span>
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

                     {/* Botones Test + Configurar mapeo */}
                     <div className="alim-test-row">
                        <button
                           type="button"
                           className="alim-test-btn"
                           onClick={handleTestConexion}
                           disabled={isTesting}
                        >
                           {isTesting ? "Probando..." : "Test conexión"}
                        </button>

                        <button
                           type="button"
                           className="alim-map-btn"
                           disabled={!puedeConfigurarMapeo}
                           onClick={() => setMostrarMapeo((v) => !v)}
                        >
                           {mostrarMapeo ? "Ocultar mapeo" : "Configurar mapeo"}
                        </button>
                     </div>

                     {/* Resultado test / tabla registros */}
                     {testError && (
                        <div className="alim-test-message alim-test-error">
                           {testError}
                        </div>
                     )}

                     {!testError && testRows.length > 0 && (
                        <div className="alim-test-table">
                           <div className="alim-test-message alim-test-ok">
                              Test correcto. Registros leídos: {testRows.length}
                           </div>

                           <table>
                              <thead>
                                 <tr>
                                    <th>#</th>
                                    <th>Dirección</th>
                                    <th>Valor</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {testRows.map((r) => (
                                    <tr key={r.index}>
                                       <td>{r.index}</td>
                                       <td>{r.address}</td>
                                       <td>{r.value}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                  </div>

                  {/* === COLUMNA DERECHA: MAPEO DE MEDICIONES === */}
                  {mostrarMapeo && (
                     <div className="alim-modal-right">
                        {SECCIONES_MAPEO.map((sec) => (
                           <div key={sec.id} className="alim-map-section">
                              <h4 className="alim-map-section-title">
                                 {sec.titulo}
                              </h4>

                              {sec.items.map((itemId) => {
                                 const cfg = mapeoMediciones[sec.id][itemId];
                                 return (
                                    <div key={itemId} className="alim-map-row">
                                       <label className="alim-map-check">
                                          <input
                                             type="checkbox"
                                             checked={cfg.enabled}
                                             onChange={(e) =>
                                                toggleItemMapeo(
                                                   sec.id,
                                                   itemId,
                                                   e.target.checked
                                                )
                                             }
                                          />
                                          <span>{itemId}</span>
                                       </label>

                                       <input
                                          type="number"
                                          className="alim-map-input"
                                          placeholder="Registro"
                                          disabled={!cfg.enabled}
                                          value={cfg.registro}
                                          onChange={(e) =>
                                             actualizarMapeo(
                                                sec.id,
                                                itemId,
                                                "registro",
                                                e.target.value
                                             )
                                          }
                                       />

                                       <input
                                          type="text"
                                          className="alim-map-input alim-map-formula"
                                          placeholder="Fórmula (ej: x * 500 / 1000)"
                                          disabled={!cfg.enabled}
                                          value={cfg.formula}
                                          onChange={(e) =>
                                             actualizarMapeo(
                                                sec.id,
                                                itemId,
                                                "formula",
                                                e.target.value
                                             )
                                          }
                                       />
                                    </div>
                                 );
                              })}
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* Botones inferiores */}
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
