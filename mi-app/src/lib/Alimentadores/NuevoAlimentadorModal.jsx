// src/lib/Alimentadores/NuevoAlimentadorModal.jsx
import React, { useEffect, useState } from "react";
import "./NuevoAlimentadorModal.css";
import { leerRegistrosModbus } from "./modbusClient";

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

   // NUEVO: estado/control por equipo
   isMeasuringRele = false,
   isMeasuringAnalizador = false,
   onToggleMedicionRele,
   onToggleMedicionAnalizador,
   registrosRele = [],
   registrosAnalizador = [],
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
   const [periodoSegundos, setPeriodoSegundos] = useState("60");

   // Config ANALIZADOR
   const [analizador, setAnalizador] = useState({
      ip: "",
      puerto: "",
      indiceInicial: "",
      cantRegistros: "",
   });
   const [periodoSegundosAnalizador, setPeriodoSegundosAnalizador] =
      useState("60");

   // Estado de TEST por equipo
   const [isTestingRele, setIsTestingRele] = useState(false);
   const [testErrorRele, setTestErrorRele] = useState("");
   const [testRowsRele, setTestRowsRele] = useState([]);

   const [isTestingAnalizador, setIsTestingAnalizador] = useState(false);
   const [testErrorAnalizador, setTestErrorAnalizador] = useState("");
   const [testRowsAnalizador, setTestRowsAnalizador] = useState([]);

   // === Cargar datos al abrir ===
   useEffect(() => {
      if (!abierto) return;

      if (initialData) {
         setNombre(initialData.nombre || "");
         setColor(initialData.color || COLORES_ALIM[0]);
         setTab("rele");

         setRele({
            ip: initialData.rele?.ip || "",
            puerto:
               initialData.rele?.puerto != null
                  ? String(initialData.rele.puerto)
                  : "",
            indiceInicial:
               initialData.rele?.indiceInicial != null
                  ? String(initialData.rele.indiceInicial)
                  : "",
            cantRegistros:
               initialData.rele?.cantRegistros != null
                  ? String(initialData.rele.cantRegistros)
                  : "",
         });

         setPeriodoSegundos(
            initialData.periodoSegundos != null
               ? String(initialData.periodoSegundos)
               : "60"
         );

         setAnalizador({
            ip: initialData.analizador?.ip || "",
            puerto:
               initialData.analizador?.puerto != null
                  ? String(initialData.analizador.puerto)
                  : "",
            indiceInicial:
               initialData.analizador?.indiceInicial != null
                  ? String(initialData.analizador.indiceInicial)
                  : "",
            cantRegistros:
               initialData.analizador?.cantRegistros != null
                  ? String(initialData.analizador.cantRegistros)
                  : "",
         });

         setPeriodoSegundosAnalizador(
            initialData.analizador?.periodoSegundos != null
               ? String(initialData.analizador.periodoSegundos)
               : "60"
         );
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
            puerto: "",
            indiceInicial: "",
            cantRegistros: "",
         });
         setPeriodoSegundosAnalizador("60");
      }

      // reset estado de tests
      setIsTestingRele(false);
      setTestErrorRele("");
      setTestRowsRele([]);

      setIsTestingAnalizador(false);
      setTestErrorAnalizador("");
      setTestRowsAnalizador([]);
   }, [abierto, initialData]);

   if (!abierto) return null;

   // === TEST CONEXIÓN RELÉ ===
   const handleTestConexionRele = async () => {
      const ip = rele.ip.trim();
      const puerto = Number(rele.puerto);
      const inicio = Number(rele.indiceInicial);
      const cantidad = Number(rele.cantRegistros);

      if (!ip || !puerto || isNaN(inicio) || isNaN(cantidad) || cantidad <= 0) {
         setTestErrorRele(
            "Completa IP, puerto, índice inicial y cantidad de registros antes de probar."
         );
         setTestRowsRele([]);
         return;
      }

      setIsTestingRele(true);
      setTestErrorRele("");
      setTestRowsRele([]);

      try {
         const fetched = await leerRegistrosModbus({
            ip,
            puerto,
            indiceInicial: inicio,
            cantRegistros: cantidad,
         });

         setTestRowsRele(fetched || []);
      } catch (err) {
         console.error(err);
         setTestErrorRele(
            err?.message || "Error de red o al intentar leer los registros."
         );
         setTestRowsRele([]);
      } finally {
         setIsTestingRele(false);
      }
   };

   // === TEST CONEXIÓN ANALIZADOR ===
   const handleTestConexionAnalizador = async () => {
      const ip = analizador.ip.trim();
      const puerto = Number(analizador.puerto);
      const inicio = Number(analizador.indiceInicial);
      const cantidad = Number(analizador.cantRegistros);

      if (!ip || !puerto || isNaN(inicio) || isNaN(cantidad) || cantidad <= 0) {
         setTestErrorAnalizador(
            "Completa IP, puerto, índice inicial y cantidad de registros antes de probar."
         );
         setTestRowsAnalizador([]);
         return;
      }

      setIsTestingAnalizador(true);
      setTestErrorAnalizador("");
      setTestRowsAnalizador([]);

      try {
         const fetched = await leerRegistrosModbus({
            ip,
            puerto,
            indiceInicial: inicio,
            cantRegistros: cantidad,
         });

         setTestRowsAnalizador(fetched || []);
      } catch (err) {
         console.error(err);
         setTestErrorAnalizador(
            err?.message || "Error de red o al intentar leer los registros."
         );
         setTestRowsAnalizador([]);
      } finally {
         setIsTestingAnalizador(false);
      }
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
            periodoSegundos: periodoSegundosAnalizador
               ? Number(periodoSegundosAnalizador)
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

   // Qué filas mostramos en cada tabla
   const rowsToShowRele =
      isMeasuringRele && registrosRele && registrosRele.length > 0
         ? registrosRele
         : testRowsRele;

   const rowsToShowAnalizador =
      isMeasuringAnalizador &&
      registrosAnalizador &&
      registrosAnalizador.length > 0
         ? registrosAnalizador
         : testRowsAnalizador;

   const mensajeTablaRele =
      isMeasuringRele && registrosRele && registrosRele.length > 0
         ? `Medición en curso. Registros en vivo: ${registrosRele.length}`
         : `Test correcto. Registros leídos: ${testRowsRele.length}`;

   const mensajeTablaAnalizador =
      isMeasuringAnalizador &&
      registrosAnalizador &&
      registrosAnalizador.length > 0
         ? `Medición en curso. Registros en vivo: ${registrosAnalizador.length}`
         : `Test correcto. Registros leídos: ${testRowsAnalizador.length}`;

   // Habilitación de botones de medición por tab
   const puedeMedirRele =
      !!onToggleMedicionRele && !!rele.ip.trim() && !!rele.puerto;

   const puedeMedirAnalizador =
      !!onToggleMedicionAnalizador &&
      !!analizador.ip.trim() &&
      !!analizador.puerto;

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

                           {/* Periodo actualización (usado por Alimentadores) */}
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

                           {/* Botones y tabla RELÉ */}
                           <div className="alim-test-row">
                              <button
                                 type="button"
                                 className="alim-test-btn"
                                 onClick={handleTestConexionRele}
                                 disabled={isTestingRele}
                              >
                                 {isTestingRele
                                    ? "Probando..."
                                    : "Test conexión"}
                              </button>

                              <button
                                 type="button"
                                 className={
                                    "alim-test-btn" +
                                    (isMeasuringRele
                                       ? " alim-test-btn-stop"
                                       : " alim-test-btn-secondary")
                                 }
                                 onClick={() =>
                                    onToggleMedicionRele &&
                                    onToggleMedicionRele()
                                 }
                                 disabled={isTestingRele || !puedeMedirRele}
                              >
                                 {isMeasuringRele
                                    ? "Detener medición"
                                    : "Iniciar medición"}
                              </button>
                           </div>

                           {testErrorRele && (
                              <div className="alim-test-message alim-test-error">
                                 {testErrorRele}
                              </div>
                           )}

                           {!testErrorRele && rowsToShowRele.length > 0 && (
                              <div className="alim-test-table">
                                 <div className="alim-test-message alim-test-ok">
                                    {mensajeTablaRele}
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
                                       {rowsToShowRele.map((r) => (
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
                                 Periodo actualización (s)
                              </span>
                              <input
                                 type="number"
                                 className="alim-field-input"
                                 value={periodoSegundosAnalizador}
                                 onChange={(e) =>
                                    setPeriodoSegundosAnalizador(e.target.value)
                                 }
                                 placeholder="Ej: 60"
                                 min={1}
                              />
                           </label>
									
                           {periodoSegundosAnalizador &&
                              Number(periodoSegundosAnalizador) > 0 &&
                              Number(periodoSegundosAnalizador) < 60 && (
                                 <p className="alim-warning">
                                    ⚠️ Periodos menores a 60&nbsp;s pueden
                                    recargar el sistema y la red de
                                    comunicaciones.
                                 </p>
                              )}

                           {/* Botones y tabla ANALIZADOR */}
                           <div className="alim-test-row">
                              <button
                                 type="button"
                                 className="alim-test-btn"
                                 onClick={handleTestConexionAnalizador}
                                 disabled={isTestingAnalizador}
                              >
                                 {isTestingAnalizador
                                    ? "Probando..."
                                    : "Test conexión"}
                              </button>

                              <button
                                 type="button"
                                 className={
                                    "alim-test-btn" +
                                    (isMeasuringAnalizador
                                       ? " alim-test-btn-stop"
                                       : " alim-test-btn-secondary")
                                 }
                                 onClick={() =>
                                    onToggleMedicionAnalizador &&
                                    onToggleMedicionAnalizador()
                                 }
                                 disabled={
                                    isTestingAnalizador || !puedeMedirAnalizador
                                 }
                              >
                                 {isMeasuringAnalizador
                                    ? "Detener medición"
                                    : "Iniciar medición"}
                              </button>
                           </div>

                           {testErrorAnalizador && (
                              <div className="alim-test-message alim-test-error">
                                 {testErrorAnalizador}
                              </div>
                           )}

                           {!testErrorAnalizador &&
                              rowsToShowAnalizador.length > 0 && (
                                 <div className="alim-test-table">
                                    <div className="alim-test-message alim-test-ok">
                                       {mensajeTablaAnalizador}
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
                                          {rowsToShowAnalizador.map((r) => (
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
