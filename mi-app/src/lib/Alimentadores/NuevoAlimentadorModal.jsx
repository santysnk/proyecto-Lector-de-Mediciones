// src/lib/Alimentadores/NuevoAlimentadorModal.jsx
import React, { useEffect, useState, useRef } from "react";
import "./NuevoAlimentadorModal.css";

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
   onUpdateLecturas, // 👈 nuevo, opcional
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

   // Periodo de actualización (s)
   const [periodoSegundos, setPeriodoSegundos] = useState("60");

   // Config ANALIZADOR
   const [analizador, setAnalizador] = useState({
      ip: "",
      puerto: "502",
      indiceInicial: "",
      cantRegistros: "",
      relacionTI: "",
   });

   // Estado del test de conexión (solo informativo)
   const [isTesting, setIsTesting] = useState(false);
   const [testError, setTestError] = useState("");
   const [testRows, setTestRows] = useState([]); // [{index, address, value}]

   const [mapeoMediciones, setMapeoMediciones] = useState(null);

   // estado de medición periódica
   const [isMeasuring, setIsMeasuring] = useState(false);
   const medicionIntervalRef = useRef(null);

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

         setMapeoMediciones(initialData.mapeoMediciones || null);
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

         setMapeoMediciones(null);
      }

      // ✅ Reset SOLO del test (no de la medición periódica)
      setIsTesting(false);
      setTestError("");
      setTestRows([]);
   }, [abierto, initialData]);

   // 👇 VOLVER A PONER ESTE GUARD
   if (!abierto) return null;

   const aplicarFormula = (formulaStr, x) => {
      const trimmed = (formulaStr || "").trim();
      if (!trimmed) return x; // si no hay fórmula, usamos el valor crudo

      try {
         const fn = new Function("x", `return ${trimmed};`);
         const res = fn(x);
         if (typeof res === "number" && !Number.isNaN(res)) return res;
         return null;
      } catch {
         return null;
      }
   };

   const formatearValor = (valor) => {
      if (valor == null || Number.isNaN(valor)) return "ERROR";
      return valor.toFixed(2).replace(".", ",");
   };

   const calcularConsumoDesdeRegistros = (registros) => {
      const salida = { R: "ERROR", S: "ERROR", T: "ERROR" };

      if (!mapeoMediciones || !registros?.length) return salida;

      const corr = mapeoMediciones.corriente_linea || {};
      const mapFase = { L1: "R", L2: "S", L3: "T" };

      ["L1", "L2", "L3"].forEach((itemId) => {
         const cfg = corr[itemId];
         const faseCard = mapFase[itemId];

         if (!cfg?.enabled) {
            salida[faseCard] = "--,--";
            return;
         }

         const regNum = Number(cfg.registro);
         if (!regNum && regNum !== 0) {
            salida[faseCard] = "ERROR";
            return;
         }

         const row = registros.find((r) => r.address === regNum);
         if (!row) {
            salida[faseCard] = "ERROR";
            return;
         }

         const calculado = aplicarFormula(cfg.formula || "x", row.value);
         salida[faseCard] = formatearValor(calculado);
      });

      return salida;
   };

   const dispararTickMedicion = async () => {
      if (!onUpdateLecturas) return;

      // lee registros, actualiza tabla y errores si el modal está abierto
      const registros = await leerRegistrosDesdeRele({
         rele,
         setTestError,
         setTestRows,
      });

      if (!registros) return;

      const consumo = calcularConsumoDesdeRegistros(registros);
      onUpdateLecturas({ consumo });
   };

   // Lee registros desde el relé (por ahora simulado 0–500) y opcionalmente
   // actualiza el mensaje de error y las filas de la tabla de test.
   const leerRegistrosDesdeRele = async ({
      rele,
      setTestError,
      setTestRows,
   }) => {
      const ip = rele.ip.trim();
      const puerto = Number(rele.puerto);
      const inicio = Number(rele.indiceInicial);
      const cantidad = Number(rele.cantRegistros);

      if (!ip || !puerto || isNaN(inicio) || isNaN(cantidad) || cantidad <= 0) {
         setTestError?.(
            "Completa IP, puerto, índice inicial y cantidad de registros antes de probar."
         );
         setTestRows?.([]);
         return null;
      }

      try {
         // 🔁 ACÁ IRÍA LA LLAMADA REAL AL BACKEND MODBUS
         // Por ahora simulamos valores aleatorios 0–500:
         const registros = Array.from({ length: cantidad }, (_, i) => ({
            index: i,
            address: inicio + i,
            value: Math.floor(Math.random() * 501),
         }));

         setTestError?.("");
         setTestRows?.(registros);
         return registros;
      } catch (err) {
         console.error(err);
         setTestError?.(
            err?.message || "Error de red o al intentar leer los registros."
         );
         setTestRows?.([]);
         return null;
      }
   };

   // === TEST CONEXIÓN (simulado / o backend real) ===
   const handleTestConexion = async () => {
      setIsTesting(true);
      await leerRegistrosDesdeRele({ rele, setTestError, setTestRows });
      setIsTesting(false);
   };

   const handleToggleMedicion = () => {
      // si ya está midiendo, detenemos
      if (isMeasuring) {
         if (medicionIntervalRef.current) {
            clearInterval(medicionIntervalRef.current);
            medicionIntervalRef.current = null;
         }
         setIsMeasuring(false);
         return;
      }

      // para iniciar: al menos necesitamos una config válida
      const periodo =
         Number(periodoSegundos) > 0 ? Number(periodoSegundos) : 60;

      // tick inmediato
      dispararTickMedicion();

      // y luego periódico
      medicionIntervalRef.current = setInterval(() => {
         // no hace falta await dentro del setInterval
         dispararTickMedicion();
      }, periodo * 1000);

      setIsMeasuring(true);
   };

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

                           {/* Periodo actualización */}
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

                     {/* Botones Test conexión + Iniciar/Detener medición */}
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
                           className={
                              "alim-test-btn" +
                              (isMeasuring
                                 ? " alim-test-btn-stop"
                                 : " alim-test-btn-secondary")
                           }
                           onClick={handleToggleMedicion}
                           disabled={isTesting}
                        >
                           {isMeasuring
                              ? "Detener medición"
                              : "Iniciar medición"}
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
