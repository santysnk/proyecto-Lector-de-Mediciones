// src/lib/Alimentadores/Alimentadores.jsx
import React, { useState } from "react";
import "./Alimentadores.css";
import AlimentadorCard from "./AlimentadorCard.jsx";

const Alimentadores = () => {
  // ===== PUESTOS (barra superior) =====
  const [puestos, setPuestos] = useState([]);
  const [mostrarModalNuevoPuesto, setMostrarModalNuevoPuesto] = useState(false);
  const [mostrarModalEditarPuestos, setMostrarModalEditarPuestos] =
    useState(false);
  const [nuevoNombrePuesto, setNuevoNombrePuesto] = useState("");
  const [puestosEditados, setPuestosEditados] = useState([]);

  // ===== TARJETAS DE ALIMENTADORES =====
  const [alimentadores, setAlimentadores] = useState([]);
  const [mostrarModalNuevoAlim, setMostrarModalNuevoAlim] = useState(false);
  const [nuevoNombreAlim, setNuevoNombreAlim] = useState("");

  // ---------- AGREGAR PUESTO ----------
  const abrirModalNuevoPuesto = () => {
    setNuevoNombrePuesto("");
    setMostrarModalNuevoPuesto(true);
  };
  const cerrarModalNuevoPuesto = () => {
    setMostrarModalNuevoPuesto(false);
    setNuevoNombrePuesto("");
  };
  const handleCrearPuesto = (e) => {
    e.preventDefault();
    const nombre = nuevoNombrePuesto.trim();
    if (!nombre) return;
    setPuestos((prev) => [...prev, { id: Date.now(), nombre }]);
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
    const sinVacios = puestosEditados.filter(
      (p) => p.nombre.trim() !== ""
    );
    setPuestos(sinVacios);
    cerrarModalEditarPuestos();
  };

  // ---------- AGREGAR TARJETA DE ALIMENTADOR ----------
  const abrirModalNuevoAlim = () => {
    setNuevoNombreAlim("");
    setMostrarModalNuevoAlim(true);
  };
  const cerrarModalNuevoAlim = () => {
    setMostrarModalNuevoAlim(false);
    setNuevoNombreAlim("");
  };
  const handleCrearAlimentador = (e) => {
    e.preventDefault();
    const nombre = nuevoNombreAlim.trim();
    if (!nombre) return;
    setAlimentadores((prev) => [...prev, { id: Date.now(), nombre }]);
    cerrarModalNuevoAlim();
  };

  return (
    <div className="alim-page">
      {/* ===== NAV SUPERIOR ===== */}
      <nav className="alim-navbar">
        <h1 className="alim-title">Panel de Alimentadores</h1>

        <div className="alim-nav-buttons">
          {puestos.map((p) => (
            <button key={p.id} className="alim-btn">
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

      {/* ===== MAIN: GRID DE TARJETAS ===== */}
      <main className="alim-main">
        <div className="alim-cards-grid">
          {/* Tarjetas creadas */}
          {alimentadores.map((a) => (
            <AlimentadorCard key={a.id} nombre={a.nombre} />
          ))}

          {/* Tarjeta con "+" para crear nueva */}
          <button
            type="button"
            className="alim-card alim-card-add"
            onClick={abrirModalNuevoAlim}
          >
            <span className="alim-card-add-plus">+</span>
            <span className="alim-card-add-text">Agregar alimentador</span>
          </button>
        </div>
      </main>

      {/* ===== MODAL NUEVO PUESTO ===== */}
      {mostrarModalNuevoPuesto && (
        <div className="alim-modal-overlay">
          <div className="alim-modal">
            <h2>Nuevo puesto</h2>
            <form onSubmit={handleCrearPuesto}>
              <label className="alim-modal-label">
                Nombre del botón
                <input
                  type="text"
                  className="alim-modal-input"
                  value={nuevoNombrePuesto}
                  onChange={(e) => setNuevoNombrePuesto(e.target.value)}
                  placeholder="Ej: PUESTO 1"
                  autoFocus
                />
              </label>

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

      {/* ===== MODAL EDITAR PUESTOS ===== */}
      {mostrarModalEditarPuestos && (
        <div className="alim-modal-overlay">
          <div className="alim-modal">
            <h2>Editar puestos</h2>

            {puestosEditados.length === 0 ? (
              <p>No hay puestos para editar.</p>
            ) : (
              <div className="alim-edit-list">
                {puestosEditados.map((p) => (
                  <div key={p.id} className="alim-edit-row">
                    <input
                      type="text"
                      className="alim-edit-input"
                      value={p.nombre}
                      onChange={(e) =>
                        cambiarNombreEditado(p.id, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="alim-edit-delete"
                      onClick={() => eliminarEditado(p.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}

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

      {/* ===== MODAL NUEVA TARJETA ALIMENTADOR ===== */}
      {mostrarModalNuevoAlim && (
        <div className="alim-modal-overlay">
          <div className="alim-modal">
            <h2>Nuevo alimentador</h2>
            <form onSubmit={handleCrearAlimentador}>
              <label className="alim-modal-label">
                Nombre del alimentador
                <input
                  type="text"
                  className="alim-modal-input"
                  value={nuevoNombreAlim}
                  onChange={(e) => setNuevoNombreAlim(e.target.value)}
                  placeholder="Ej: ALIMENTADOR 5"
                  autoFocus
                />
              </label>

              <div className="alim-modal-actions">
                <button
                  type="button"
                  className="alim-modal-btn alim-modal-btn-cancelar"
                  onClick={cerrarModalNuevoAlim}
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
    </div>
  );
};

export default Alimentadores;
