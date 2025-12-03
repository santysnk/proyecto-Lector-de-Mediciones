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

// registrosPorOrigen: { rele?: [...], analizador?: [...] }
const obtenerListaRegistros = (registrosPorOrigen, origen) => {
   if (!registrosPorOrigen) return null;
   const key = origen === "analizador" ? "analizador" : "rele";
   const lista = registrosPorOrigen[key];
   return Array.isArray(lista) ? lista : null;
};

// Títulos que se verán en la tarjeta según el id elegido en el mapeo
const TITULOS_CARD = {
   tension_linea: "Tensión de línea (kV)",
   tension_entre_lineas: "Tensión entre líneas (kV)",
   corriente_132: "Corriente de línea (A) (en 13,2 kV)",
   corriente_33: "Corriente de línea (A) (en 33 kV)",
   potencia_activa: "Potencia activa (kW)",
   potencia_reactiva: "Potencia reactiva (kVAr)",
   potencia_aparente: "Potencia aparente (kVA)",
   factor_potencia: "Factor de Potencia",
   frecuencia: "Frecuencia (Hz)",
   corriente_neutro: "Corriente de Neutro (A)",
};

// para poner etiquetas razonables si el usuario no escribe nada
const ETIQUETAS_POR_DEFECTO = {
   corriente_132: ["R", "S", "T", "N"],
   corriente_33: ["R", "S", "T", "N"],
   tension_linea: ["R", "S", "T", "N"],
   tension_entre_lineas: ["L1-L2", "L2-L3", "L1-L3", ""],
   potencia_activa: ["L1", "L2", "L3", "Total"],
   potencia_reactiva: ["L1", "L2", "L3", "Total"],
   potencia_aparente: ["L1", "L2", "L3", "Total"],
   factor_potencia: ["L1", "L2", "L3", ""],
   frecuencia: ["L1", "L2", "L3", ""],
   corriente_neutro: ["N", "", "", ""],
};

const CARD_DESIGN_DEFAULT = {
   superior: {
      tituloId: "corriente_132",
      tituloCustom: "",
      cantidad: 3,
      boxes: [],
   },
   inferior: {
      tituloId: "tension_linea",
      tituloCustom: "",
      cantidad: 3,
      boxes: [],
   },
};

const getCardDesign = (mapeoMediciones) => {
   const cd = mapeoMediciones?.cardDesign;

   if (!cd) return CARD_DESIGN_DEFAULT;

   return {
      superior: {
         ...CARD_DESIGN_DEFAULT.superior,
         ...(cd.superior || {}),
      },
      inferior: {
         ...CARD_DESIGN_DEFAULT.inferior,
         ...(cd.inferior || {}),
      },
   };
};

const resolverTituloLado = (sideDesign) => {
   if (!sideDesign) return "";
   if (sideDesign.tituloId === "custom") {
      return (sideDesign.tituloCustom || "").trim();
   }
   return TITULOS_CARD[sideDesign.tituloId] || "";
};

// Calcula los valores para 1-4 boxes de un lado de la tarjeta
// Devuelve: { titulo: string, boxes: [{ etiqueta, valor }] }
const calcularValoresLadoTarjeta = (registrosPorOrigen, sideDesign) => {
   if (!sideDesign) {
      return {
         titulo: "",
         boxes: [],
      };
   }

   const titulo = resolverTituloLado(sideDesign);
   const cantidad = Math.min(4, Math.max(1, Number(sideDesign.cantidad) || 1));
   const boxesSalida = [];

   const etiquetasDefault = ETIQUETAS_POR_DEFECTO[sideDesign.tituloId] || [];

   for (let i = 0; i < cantidad; i++) {
      const cfg = sideDesign.boxes?.[i] || {};
      const etiqueta =
         (cfg.label || "").trim() || etiquetasDefault[i] || `Box ${i + 1}`;

      let valorMostrado = "--,--";

      if (cfg.enabled) {
         const regNum = Number(cfg.registro);

         // si no hay registro configurado, dejamos "--,--"
         if ((Number.isFinite(regNum) || regNum === 0) && cfg.registro !== "") {
            const origen = cfg.origen || "rele";
            const lista = obtenerListaRegistros(registrosPorOrigen, origen);

            if (lista && lista.length > 0) {
               const row = lista.find((r) => r.address === regNum);

               if (!row) {
                  valorMostrado = "ERROR";
               } else {
                  const calculado = aplicarFormula(
                     cfg.formula || "x",
                     row.value
                  );
                  if (calculado == null || Number.isNaN(calculado)) {
                     valorMostrado = "ERROR";
                  } else {
                     valorMostrado = formatearValor(calculado);
                  }
               }
            }
         }
      }

      boxesSalida.push({ etiqueta, valor: valorMostrado });
   }

   return { titulo, boxes: boxesSalida };
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
   // { [alimId]: { consumo: {R,S,T}, tensionLinea: {R,S,T} } }
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

   // NUEVO: registros crudos por alimentador y origen
   // { [alimId]: { rele?: [{index, address, value}], analizador?: [...] } }
   const [registrosEnVivo, setRegistrosEnVivo] = useState({});

   // Medición activa por alimentador y equipo:
   // { [alimId]: { rele: bool, analizador: bool } }
   const [medicionesActivas, setMedicionesActivas] = useState({});

   // Timers de setInterval por alimentador y equipo:
   // { [alimId]: { rele: timerId, analizador: timerId } }
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
         Object.values(timersRef.current).forEach((timersPorAlim) => {
            if (timersPorAlim?.rele) clearInterval(timersPorAlim.rele);
            if (timersPorAlim?.analizador)
               clearInterval(timersPorAlim.analizador);
         });
         timersRef.current = {};
      };
   }, []);

   // ---------- LÓGICA DE MEDICIÓN POR ALIMENTADOR Y EQUIPO ----------
   // origen: "rele" | "analizador"
   const tickMedicionAlim = async (alim, origen) => {
      if (!alim) return;

      const cfg = origen === "analizador" ? alim.analizador : alim.rele;

      if (!cfg?.ip || !cfg?.puerto || !cfg?.cantRegistros) {
         // configuración incompleta → no se intenta leer
         return;
      }

      const registros = await leerRegistrosModbus({
         ip: cfg.ip?.trim(),
         puerto: cfg.puerto,
         indiceInicial: cfg.indiceInicial,
         cantRegistros: cfg.cantRegistros,
      });

      if (!registros) return;

      // Usamos actualización funcional para no pisar al otro origen
      setRegistrosEnVivo((prev) => {
         const prevAlim = prev[alim.id] || {};
         const combinados = {
            ...prevAlim,
            [origen]: registros,
         };

         // recalculo lecturas usando ambos orígenes
         const mapeo = alim.mapeoMediciones || null;
         const cardDesign = getCardDesign(mapeo);

         const parteSuperior = calcularValoresLadoTarjeta(
            combinados,
            cardDesign.superior
         );
         const parteInferior = calcularValoresLadoTarjeta(
            combinados,
            cardDesign.inferior
         );

         handleUpdateLecturasAlim(alim.id, {
            parteSuperior,
            parteInferior,
         });

         return {
            ...prev,
            [alim.id]: combinados,
         };
      });
   };

   const startMedicionAlim = (alimId, equipo) => {
      if (!puestoSeleccionado) return;
      const alim = puestoSeleccionado.alimentadores.find(
         (a) => a.id === alimId
      );
      if (!alim) return;

      // Tick inmediato
      tickMedicionAlim(alim, equipo);

      const periodo =
         equipo === "rele"
            ? alim.periodoSegundos && alim.periodoSegundos > 0
               ? alim.periodoSegundos
               : 60
            : alim.analizador?.periodoSegundos &&
              alim.analizador.periodoSegundos > 0
            ? alim.analizador.periodoSegundos
            : 60;

      const timerId = setInterval(() => {
         tickMedicionAlim(alim, equipo);
      }, periodo * 1000);

      timersRef.current[alimId] = {
         ...(timersRef.current[alimId] || {}),
         [equipo]: timerId,
      };

      setMedicionesActivas((prev) => ({
         ...prev,
         [alimId]: { ...(prev[alimId] || {}), [equipo]: true },
      }));
   };

   const stopMedicionAlim = (alimId, equipo) => {
      const timers = timersRef.current[alimId];
      if (timers && timers[equipo]) {
         clearInterval(timers[equipo]);
         delete timers[equipo];
      }
      if (timers && Object.keys(timers).length === 0) {
         delete timersRef.current[alimId];
      }

      setMedicionesActivas((prev) => ({
         ...prev,
         [alimId]: {
            ...(prev[alimId] || {}),
            [equipo]: false,
         },
      }));
   };

   const toggleMedicionAlim = (alimId, equipo) => {
      const activa = !!medicionesActivas[alimId]?.[equipo];
      if (activa) stopMedicionAlim(alimId, equipo);
      else startMedicionAlim(alimId, equipo);
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

      // si estaba midiendo, detenemos sus mediciones
      stopMedicionAlim(alimId, "rele");
      stopMedicionAlim(alimId, "analizador");

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

      // >>> PREVIEW EN LA CARD AUN SIN MEDICIÓN <<<
      const cardDesign = getCardDesign(nuevoMapeo);

      setLecturas((prev) => ({
         ...prev,
         [alimId]: {
            ...(prev[alimId] || {}),
            // Como no pasamos registros, calcularValoresLadoTarjeta
            // devuelve todos los valores en "--,--", pero con
            // la cantidad de boxes y títulos correctos.
            parteSuperior: calcularValoresLadoTarjeta(
               null,
               cardDesign.superior
            ),
            parteInferior: calcularValoresLadoTarjeta(
               null,
               cardDesign.inferior
            ),
         },
      }));

      cerrarModalMapeo();
   };

   // Alimentador completo en edición (para pasar al modal como initialData)
   const alimEnEdicion =
      modoAlim === "editar" && alimentadorEnEdicion && puestoSeleccionado
         ? puestoSeleccionado.alimentadores.find(
              (a) => a.id === alimentadorEnEdicion.alimId
           ) || null
         : null;

   // Estados de medición y registros por equipo para el alim en edición
   const isMeasuringRele =
      modoAlim === "editar" && alimentadorEnEdicion
         ? !!medicionesActivas[alimentadorEnEdicion.alimId]?.rele
         : false;

   const isMeasuringAnalizador =
      modoAlim === "editar" && alimentadorEnEdicion
         ? !!medicionesActivas[alimentadorEnEdicion.alimId]?.analizador
         : false;

   const regsRele =
      alimEnEdicion && registrosEnVivo[alimEnEdicion.id]
         ? registrosEnVivo[alimEnEdicion.id].rele || []
         : [];

   const regsAnalizador =
      alimEnEdicion && registrosEnVivo[alimEnEdicion.id]
         ? registrosEnVivo[alimEnEdicion.id].analizador || []
         : [];

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
                        topSide={lecturas[a.id]?.parteSuperior}
                        bottomSide={lecturas[a.id]?.parteInferior}
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
            // Estado de medición por equipo para el alimentador en edición
            isMeasuringRele={isMeasuringRele}
            isMeasuringAnalizador={isMeasuringAnalizador}
            onToggleMedicionRele={
               modoAlim === "editar" && alimentadorEnEdicion
                  ? () =>
                       toggleMedicionAlim(alimentadorEnEdicion.alimId, "rele")
                  : undefined
            }
            onToggleMedicionAnalizador={
               modoAlim === "editar" && alimentadorEnEdicion
                  ? () =>
                       toggleMedicionAlim(
                          alimentadorEnEdicion.alimId,
                          "analizador"
                       )
                  : undefined
            }
            registrosRele={regsRele}
            registrosAnalizador={regsAnalizador}
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
