// src/lib/Alimentadores/Alimentadores.jsx
import React, { useState, useEffect, useRef } from "react";
import "./Alimentadores.css";
import AlimentadorCard from "./AlimentadorCard.jsx";
import NuevoAlimentadorModal from "./NuevoAlimentadorModal.jsx";
import MapeoMedicionesModal from "./MapeoMedicionesModal.jsx";
import { leerRegistrosModbus } from "./modbusClient";

const STORAGE_KEY_PUESTOS = "rw-puestos";
const STORAGE_KEY_PUESTO_SEL = "rw-puesto-seleccionado";

const COLORES_PUESTO = [
   "#22c55e", // verde
   "#0ea5e9", // celeste
   "#3b82f6", // azul
   "#a855f7", // violeta
   "#ec4899", // rosa
   "#f97316", // naranja
   "#ef4444", // rojo
   "#eab308", // amarillo
   "#14b8a6", // turquesa
   "#10b981", // verde menta
   "#6366f1", // índigo
   "#64748b", // gris azulado
];

// ===== Helpers para cálculo de lecturas =====
const aplicarFormula = (formulaStr, x) => {
   const trimmed = (formulaStr || "").trim();
   if (!trimmed) return x;
   try {
      const fn = new Function("x", `return ${trimmed};`);
      const res = fn(x);
      return typeof res === "number" && !Number.isNaN(res) ? res : null;
   } catch {
      return null;
   }
};

const formatearValor = (valor) => {
   if (valor == null || Number.isNaN(valor)) return "ERROR";
   return valor.toFixed(2).replace(".", ",");
};

const calcularConsumoDesdeRegistros = (registros, mapeoMediciones) => {
   const salida = { R: "--,--", S: "--,--", T: "--,--" };
   if (!mapeoMediciones || !registros?.length) return salida;

   const corr = mapeoMediciones.corriente_linea || {};
   const mapFase = { L1: "R", L2: "S", L3: "T" };

   ["L1", "L2", "L3"].forEach((itemId) => {
      const cfg = corr[itemId];
      const faseCard = mapFase[itemId];

      if (!cfg?.enabled) return; // checkbox destildado → se queda "--,--"

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
      if (calculado == null || Number.isNaN(calculado)) {
         salida[faseCard] = "ERROR";
         return;
      }

      salida[faseCard] = formatearValor(calculado);
   });

   return salida;
};

const calcularTensionDesdeRegistros = (registros, mapeoMediciones) => {
   const salida = { R: "--,--", S: "--,--", T: "--,--" };
   if (!mapeoMediciones || !registros?.length) return salida;

   const tens = mapeoMediciones.tension_linea || {};
   const mapFase = { L1: "R", L2: "S", L3: "T" };

   ["L1", "L2", "L3"].forEach((itemId) => {
      const cfg = tens[itemId];
      const faseCard = mapFase[itemId];

      if (!cfg?.enabled) return;

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
      if (calculado == null || Number.isNaN(calculado)) {
         salida[faseCard] = "ERROR";
         return;
      }

      salida[faseCard] = formatearValor(calculado);
   });

   return salida;
};

const Alimentadores = () => {
   const DEFAULT_MAIN_BG = "#e5e7eb";

   // ===== PUESTOS (barra superior) =====
   const [puestos, setPuestos] = useState(() => {
      try {
         const guardado = localStorage.getItem(STORAGE_KEY_PUESTOS);
         if (!guardado) return [];
         const parsed = JSON.parse(guardado);
         return Array.isArray(parsed) ? parsed : [];
      } catch {
         return [];
      }
   });

   const [puestoSeleccionadoId, setPuestoSeleccionadoId] = useState(() => {
      try {
         const raw = localStorage.getItem(STORAGE_KEY_PUESTO_SEL);
         return raw ? Number(raw) : null;
      } catch {
         return null;
      }
   });

   const [colorPuesto, setColorPuesto] = useState(COLORES_PUESTO[0]);
   const [mostrarModalNuevoPuesto, setMostrarModalNuevoPuesto] =
      useState(false);
   const [mostrarModalEditarPuestos, setMostrarModalEditarPuestos] =
      useState(false);
   const [nuevoNombrePuesto, setNuevoNombrePuesto] = useState("");
   const [puestosEditados, setPuestosEditados] = useState([]);

   // ===== TARJETAS DE ALIMENTADORES =====
   const [mostrarModalNuevoAlim, setMostrarModalNuevoAlim] = useState(false);
   const [modoAlim, setModoAlim] = useState("crear"); // "crear" | "editar"
   const [dragAlimId, setDragAlimId] = useState(null);
   const [alimentadorEnEdicion, setAlimentadorEnEdicion] = useState(null);

   // ===== LECTURAS EN TIEMPO REAL (por alimentador) =====
   // estructura: { [alimId]: { consumo: { R,S,T }, tensionLinea: { R,S,T } } }
   const [lecturas, setLecturas] = useState({});

   const handleUpdateLecturasAlim = (alimId, dataParcial) => {
      if (!alimId) return;
      setLecturas((prev) => ({
         ...prev,
         [alimId]: {
            ...(prev[alimId] || {}),
            ...dataParcial,
         },
      }));
   };

   // NUEVO: registros crudos por alimentador
   // { [alimId]: [{ index, address, value }, ...] }
   const [registrosEnVivo, setRegistrosEnVivo] = useState({});

   // Medición activa por alimentador  { [alimId]: true/false }
   const [medicionesActivas, setMedicionesActivas] = useState({});

   // Timers de setInterval por alimentador
   const timersRef = useRef({});

   // Puesto actualmente activo (si el id no existe, toma el primero)
   const puestoSeleccionado =
      puestos.find((p) => p.id === puestoSeleccionadoId) || puestos[0] || null;

   // ===== MODAL MAPEO MEDICIONES =====
   const [mostrarModalMapeo, setMostrarModalMapeo] = useState(false);
   const [alimentadorMapeo, setAlimentadorMapeo] = useState(null); // {puestoId, alimId}

   const alimMapeoObj = alimentadorMapeo
      ? (() => {
           const p = puestos.find((px) => px.id === alimentadorMapeo.puestoId);
           if (!p) return null;
           return (
              p.alimentadores.find((a) => a.id === alimentadorMapeo.alimId) ||
              null
           );
        })()
      : null;

   // ---------- DRAG & DROP DE ALIMENTADORES ----------
   const handleDragStartAlim = (alimId) => {
      setDragAlimId(alimId);
   };

   const handleDragEndAlim = () => {
      setDragAlimId(null);
   };

   const handleDragOverAlim = (e) => {
      e.preventDefault();
   };

   const handleDropAlim = (targetAlimId) => {
      if (!puestoSeleccionado || dragAlimId == null) return;
      if (dragAlimId === targetAlimId) return;

      setPuestos((prev) =>
         prev.map((p) => {
            if (p.id !== puestoSeleccionado.id) return p;

            const nuevoOrden = [...p.alimentadores];
            const fromIndex = nuevoOrden.findIndex((a) => a.id === dragAlimId);
            const toIndex = nuevoOrden.findIndex((a) => a.id === targetAlimId);

            if (fromIndex === -1 || toIndex === -1) return p;

            const [movido] = nuevoOrden.splice(fromIndex, 1);
            nuevoOrden.splice(toIndex, 0, movido);

            return { ...p, alimentadores: nuevoOrden };
         })
      );

      setDragAlimId(null);
   };

   const handleDropAlimAlFinal = () => {
      if (!puestoSeleccionado || dragAlimId == null) return;

      setPuestos((prev) =>
         prev.map((p) => {
            if (p.id !== puestoSeleccionado.id) return p;

            const nuevoOrden = [...p.alimentadores];
            const fromIndex = nuevoOrden.findIndex((a) => a.id === dragAlimId);
            if (fromIndex === -1) return p;

            const [movido] = nuevoOrden.splice(fromIndex, 1);
            nuevoOrden.push(movido);

            return { ...p, alimentadores: nuevoOrden };
         })
      );

      setDragAlimId(null);
   };

   // ====== EFECTOS PARA PERSISTENCIA ======
   useEffect(() => {
      try {
         localStorage.setItem(STORAGE_KEY_PUESTOS, JSON.stringify(puestos));
      } catch (err) {
         console.error("Error guardando puestos", err);
      }
   }, [puestos]);

   useEffect(() => {
      try {
         if (puestoSeleccionadoId != null) {
            localStorage.setItem(
               STORAGE_KEY_PUESTO_SEL,
               String(puestoSeleccionadoId)
            );
         } else {
            localStorage.removeItem(STORAGE_KEY_PUESTO_SEL);
         }
      } catch (err) {
         console.error("Error guardando puesto seleccionado", err);
      }
   }, [puestoSeleccionadoId]);

   useEffect(() => {
      if (!puestos.length) return;

      if (
         puestoSeleccionadoId == null ||
         !puestos.some((p) => p.id === puestoSeleccionadoId)
      ) {
         setPuestoSeleccionadoId(puestos[0].id);
      }
   }, [puestos, puestoSeleccionadoId]);

   // Cleanup global de timers al desmontar el componente
   useEffect(() => {
      return () => {
         Object.values(timersRef.current).forEach((id) => clearInterval(id));
         timersRef.current = {};
      };
   }, []);

   // ---------- LÓGICA DE MEDICIÓN POR ALIMENTADOR ----------
   const tickMedicionAlim = async (alim) => {
      const registros = await leerRegistrosModbus({
         ip: alim.rele?.ip?.trim(),
         puerto: alim.rele?.puerto,
         indiceInicial: alim.rele?.indiceInicial,
         cantRegistros: alim.rele?.cantRegistros,
      });

      if (!registros) return;

      setRegistrosEnVivo((prev) => ({
         ...prev,
         [alim.id]: registros,
      }));

      const mapeo = alim.mapeoMediciones || null;
      const consumo = calcularConsumoDesdeRegistros(registros, mapeo);
      const tensionLinea = calcularTensionDesdeRegistros(registros, mapeo);

      handleUpdateLecturasAlim(alim.id, { consumo, tensionLinea });
   };

   const startMedicionAlim = (alimId) => {
      if (!puestoSeleccionado) return;
      const alim = puestoSeleccionado.alimentadores.find(
         (a) => a.id === alimId
      );
      if (!alim) return;

      // Tick inmediato
      tickMedicionAlim(alim);

      const periodo =
         alim.periodoSegundos && alim.periodoSegundos > 0
            ? alim.periodoSegundos
            : 60;

      const timerId = setInterval(() => {
         // usamos la misma config con la que se inició la medición
         tickMedicionAlim(alim);
      }, periodo * 1000);

      timersRef.current[alimId] = timerId;
      setMedicionesActivas((prev) => ({ ...prev, [alimId]: true }));
   };

   const stopMedicionAlim = (alimId) => {
      const timerId = timersRef.current[alimId];
      if (timerId) {
         clearInterval(timerId);
         delete timersRef.current[alimId];
      }
      setMedicionesActivas((prev) => ({ ...prev, [alimId]: false }));
   };

   const toggleMedicionAlim = (alimId) => {
      const activa = !!medicionesActivas[alimId];
      if (activa) stopMedicionAlim(alimId);
      else startMedicionAlim(alimId);
   };

   // ---------- AGREGAR PUESTO ----------
   const abrirModalNuevoPuesto = () => {
      setNuevoNombrePuesto("");
      setColorPuesto(COLORES_PUESTO[0]);
      setMostrarModalNuevoPuesto(true);
   };

   const cerrarModalNuevoPuesto = () => {
      setMostrarModalNuevoPuesto(false);
      setNuevoNombrePuesto("");
      setColorPuesto(COLORES_PUESTO[0]);
   };

   const handleCrearPuesto = (e) => {
      e.preventDefault();
      const nombre = nuevoNombrePuesto.trim();
      if (!nombre) return;

      const nuevoPuesto = {
         id: Date.now(),
         nombre,
         color: colorPuesto,
         bgColor: DEFAULT_MAIN_BG,
         alimentadores: [],
      };

      setPuestos((prev) => [...prev, nuevoPuesto]);
      setPuestoSeleccionadoId(nuevoPuesto.id);
      cerrarModalNuevoPuesto();
   };

   // ---------- EDITAR / ELIMINAR PUESTOS ----------
   const abrirModalEditarPuestos = () => {
      setPuestosEditados(puestos.map((p) => ({ ...p })));
      setMostrarModalEditarPuestos(true);
   };

   const cerrarModalEditarPuestos = () => {
      setMostrarModalEditarPuestos(false);
      setPuestosEditados([]);
   };

   const cambiarNombreEditado = (id, nombreNuevo) => {
      setPuestosEditados((prev) =>
         prev.map((p) => (p.id === id ? { ...p, nombre: nombreNuevo } : p))
      );
   };

   const eliminarEditado = (id) => {
      setPuestosEditados((prev) => prev.filter((p) => p.id !== id));
   };

   const guardarCambiosPuestos = () => {
      const sinVacios = puestosEditados.filter((p) => p.nombre.trim() !== "");
      setPuestos(sinVacios);
      setMostrarModalEditarPuestos(false);
      setPuestosEditados([]);

      if (!sinVacios.length) {
         setPuestoSeleccionadoId(null);
         return;
      }

      if (!sinVacios.some((p) => p.id === puestoSeleccionadoId)) {
         setPuestoSeleccionadoId(sinVacios[0].id);
      }
   };

   // ---------- AGREGAR / EDITAR TARJETA DE ALIMENTADOR ----------
   const abrirModalNuevoAlim = () => {
      setModoAlim("crear");
      setAlimentadorEnEdicion(null);
      setMostrarModalNuevoAlim(true);
   };

   const abrirModalEditarAlim = (puestoId, alimentador) => {
      setModoAlim("editar");
      setAlimentadorEnEdicion({ puestoId, alimId: alimentador.id });
      setMostrarModalNuevoAlim(true);
   };

   const cerrarModalNuevoAlim = () => {
      setMostrarModalNuevoAlim(false);
      setAlimentadorEnEdicion(null);
   };

   // datos viene desde el modal: { nombre, color, rele: {...}, analizador: {...}, periodoSegundos, mapeoMediciones? }
   const handleGuardarAlimentador = (datos) => {
      if (!datos || !datos.nombre) return;

      if (modoAlim === "crear") {
         if (!puestoSeleccionado) return;

         const nuevoAlim = { id: Date.now(), ...datos };

         setPuestos((prev) =>
            prev.map((p) =>
               p.id === puestoSeleccionado.id
                  ? { ...p, alimentadores: [...p.alimentadores, nuevoAlim] }
                  : p
            )
         );
      } else if (modoAlim === "editar" && alimentadorEnEdicion) {
         const { puestoId, alimId } = alimentadorEnEdicion;

         setPuestos((prev) =>
            prev.map((p) =>
               p.id === puestoId
                  ? {
                       ...p,
                       alimentadores: p.alimentadores.map((a) =>
                          a.id === alimId ? { ...a, ...datos } : a
                       ),
                    }
                  : p
            )
         );
      }

      cerrarModalNuevoAlim();
   };

   // ELIMINAR ALIMENTADOR (usado por el botón del modal)
   const handleEliminarAlimentador = () => {
      if (!alimentadorEnEdicion) return;

      const { puestoId, alimId } = alimentadorEnEdicion;

      // si estaba midiendo, detenemos su medición
      stopMedicionAlim(alimId);

      setPuestos((prev) =>
         prev.map((p) =>
            p.id === puestoId
               ? {
                    ...p,
                    alimentadores: p.alimentadores.filter(
                       (a) => a.id !== alimId
                    ),
                 }
               : p
         )
      );

      cerrarModalNuevoAlim();
   };

   // ---------- MAPEO DE MEDICIONES ----------
   const abrirModalMapeo = (puestoId, alimentador) => {
      setAlimentadorMapeo({ puestoId, alimId: alimentador.id });
      setMostrarModalMapeo(true);
   };

   const cerrarModalMapeo = () => {
      setMostrarModalMapeo(false);
      setAlimentadorMapeo(null);
   };

   const handleGuardarMapeo = (nuevoMapeo) => {
      if (!alimentadorMapeo) return;
      const { puestoId, alimId } = alimentadorMapeo;

      setPuestos((prev) =>
         prev.map((p) =>
            p.id === puestoId
               ? {
                    ...p,
                    alimentadores: p.alimentadores.map((a) =>
                       a.id === alimId
                          ? { ...a, mapeoMediciones: nuevoMapeo }
                          : a
                    ),
                 }
               : p
         )
      );

      cerrarModalMapeo();
   };

   // Alimentador completo en edición (para pasar al modal como initialData)
   const alimEnEdicion =
      modoAlim === "editar" && alimentadorEnEdicion && puestoSeleccionado
         ? puestoSeleccionado.alimentadores.find(
              (a) => a.id === alimentadorEnEdicion.alimId
           ) || null
         : null;

   return (
      <div className="alim-page">
         {/* ===== NAV SUPERIOR ===== */}
         <nav className="alim-navbar">
            <div className="alim-navbar-left">
               <h1 className="alim-title">Panel de Alimentadores</h1>

               {puestoSeleccionado && (
                  <div className="alim-current-puesto">
                     {puestoSeleccionado.nombre}
                  </div>
               )}
            </div>

            <div className="alim-nav-buttons">
               {puestos.map((p) => (
                  <button
                     key={p.id}
                     className={
                        "alim-btn" +
                        (puestoSeleccionado && puestoSeleccionado.id === p.id
                           ? " alim-btn-active"
                           : "")
                     }
                     onClick={() => setPuestoSeleccionadoId(p.id)}
                     style={{ backgroundColor: p.color || "#22c55e" }}
                  >
                     {p.nombre}
                  </button>
               ))}

               <button
                  type="button"
                  className="alim-btn alim-btn-add"
                  onClick={abrirModalNuevoPuesto}
               >
                  <span className="alim-btn-add-icon">+</span>
               </button>

               <button
                  type="button"
                  className="alim-btn alim-btn-edit"
                  onClick={abrirModalEditarPuestos}
                  disabled={puestos.length === 0}
               >
                  ✎
               </button>
            </div>
         </nav>

         {/* ===== MAIN ===== */}
         <main
            className="alim-main"
            style={{
               backgroundColor: puestoSeleccionado?.bgColor || DEFAULT_MAIN_BG,
            }}
         >
            {!puestos.length ? (
               <div className="alim-empty">
                  <p>
                     No hay puestos configurados. Crea un <b>puesto</b> con el
                     botón <b>+</b> de la barra superior para empezar a agregar
                     alimentadores.
                  </p>
               </div>
            ) : (
               <div className="alim-cards-grid">
                  {puestoSeleccionado?.alimentadores.map((a) => (
                     <AlimentadorCard
                        key={a.id}
                        nombre={a.nombre}
                        color={a.color}
                        onConfigClick={() =>
                           abrirModalEditarAlim(puestoSeleccionado.id, a)
                        }
                        onMapClick={() =>
                           abrirModalMapeo(puestoSeleccionado.id, a)
                        }
                        consumo={lecturas[a.id]?.consumo}
                        tensionLinea={lecturas[a.id]?.tensionLinea}
                        draggable={true}
                        isDragging={dragAlimId === a.id}
                        onDragStart={() => handleDragStartAlim(a.id)}
                        onDragOver={handleDragOverAlim}
                        onDrop={() => handleDropAlim(a.id)}
                        onDragEnd={handleDragEndAlim}
                     />
                  ))}

                  <button
                     type="button"
                     className="alim-card alim-card-add"
                     onClick={abrirModalNuevoAlim}
                     onDragOver={handleDragOverAlim}
                     onDrop={handleDropAlimAlFinal}
                  >
                     <span className="alim-card-add-plus">+</span>
                     <span className="alim-card-add-text">
                        Agregar Registrador
                     </span>
                  </button>
               </div>
            )}
         </main>

         {/* ===== MODAL NUEVO PUESTO ===== */}
         {mostrarModalNuevoPuesto && (
            <div className="alim-modal-overlay">
               <div className="alim-modal">
                  <h2>Nuevo puesto</h2>

                  <form onSubmit={handleCrearPuesto}>
                     <label className="alim-modal-label">
                        <input
                           type="text"
                           className="alim-modal-input"
                           value={nuevoNombrePuesto}
                           onChange={(e) =>
                              setNuevoNombrePuesto(e.target.value)
                           }
                           placeholder="PUESTO 1"
                           autoFocus
                        />
                     </label>

                     <div className="alim-color-picker">
                        <div className="alim-color-grid">
                           {COLORES_PUESTO.map((color) => (
                              <button
                                 key={color}
                                 type="button"
                                 className={
                                    "alim-color-swatch" +
                                    (colorPuesto === color
                                       ? " alim-color-swatch-selected"
                                       : "")
                                 }
                                 style={{ backgroundColor: color }}
                                 onClick={() => setColorPuesto(color)}
                              />
                           ))}
                        </div>
                     </div>

                     <div className="alim-modal-actions">
                        <button
                           type="button"
                           className="alim-modal-btn alim-modal-btn-cancelar"
                           onClick={cerrarModalNuevoPuesto}
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
         )}

         {/* ===== MODAL NUEVO / EDITAR ALIMENTADOR ===== */}
         <NuevoAlimentadorModal
            abierto={mostrarModalNuevoAlim && !!puestoSeleccionado}
            puestoNombre={puestoSeleccionado?.nombre ?? ""}
            modo={modoAlim}
            initialData={alimEnEdicion}
            onCancelar={cerrarModalNuevoAlim}
            onConfirmar={handleGuardarAlimentador}
            onEliminar={
               modoAlim === "editar" ? handleEliminarAlimentador : undefined
            }
            // Estado de medición solo para el alimentador en edición
            isMeasuring={
               modoAlim === "editar" &&
               alimentadorEnEdicion &&
               !!medicionesActivas[alimentadorEnEdicion.alimId]
            }
            onToggleMedicion={
               modoAlim === "editar" && alimentadorEnEdicion
                  ? () => toggleMedicionAlim(alimentadorEnEdicion.alimId)
                  : undefined
            }
            // NUEVO: registros crudos para mostrar en la tabla del modal
            registros={
               alimEnEdicion ? registrosEnVivo[alimEnEdicion.id] || [] : []
            }
         />

         {/* ===== MODAL EDITAR PUESTOS ===== */}
         {mostrarModalEditarPuestos && (
            <div className="alim-modal-overlay">
               <div className="alim-modal">
                  <h2>Editar puestos</h2>

                  {puestosEditados.map((p) => (
                     <div key={p.id} className="alim-edit-row">
                        {/* Nombre del puesto */}
                        <input
                           type="text"
                           className="alim-edit-input"
                           value={p.nombre}
                           onChange={(e) =>
                              cambiarNombreEditado(p.id, e.target.value)
                           }
                        />

                        {/* Color del botón */}
                        <input
                           type="color"
                           className="alim-edit-color-input"
                           title="Color del botón"
                           value={p.color || COLORES_PUESTO[0]}
                           onChange={(e) =>
                              setPuestosEditados((prev) =>
                                 prev.map((px) =>
                                    px.id === p.id
                                       ? { ...px, color: e.target.value }
                                       : px
                                 )
                              )
                           }
                        />

                        {/* Color de fondo del área de tarjetas */}
                        <input
                           type="color"
                           className="alim-edit-color-input"
                           title="Color de fondo del panel"
                           value={p.bgColor || DEFAULT_MAIN_BG}
                           onChange={(e) =>
                              setPuestosEditados((prev) =>
                                 prev.map((px) =>
                                    px.id === p.id
                                       ? { ...px, bgColor: e.target.value }
                                       : px
                                 )
                              )
                           }
                        />

                        {/* Botón eliminar */}
                        <button
                           type="button"
                           className="alim-edit-delete"
                           onClick={() => eliminarEditado(p.id)}
                        >
                           Eliminar
                        </button>
                     </div>
                  ))}

                  <div className="alim-modal-actions">
                     <button
                        type="button"
                        className="alim-modal-btn alim-modal-btn-cancelar"
                        onClick={cerrarModalEditarPuestos}
                     >
                        Cancelar
                     </button>
                     <button
                        type="button"
                        className="alim-modal-btn alim-modal-btn-aceptar"
                        onClick={guardarCambiosPuestos}
                     >
                        Guardar cambios
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* ===== MODAL MAPEO MEDICIONES ===== */}
         <MapeoMedicionesModal
            abierto={mostrarModalMapeo && !!alimMapeoObj}
            nombreAlimentador={alimMapeoObj?.nombre || ""}
            initialMapeo={alimMapeoObj?.mapeoMediciones || null}
            onCancelar={cerrarModalMapeo}
            onGuardar={handleGuardarMapeo}
         />
      </div>
   );
};

export default Alimentadores;
