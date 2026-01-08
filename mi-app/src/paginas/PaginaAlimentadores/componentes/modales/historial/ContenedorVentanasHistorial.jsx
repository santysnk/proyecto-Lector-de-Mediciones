/**
 * Contenedor para múltiples ventanas de historial flotantes
 * Incluye barra de tareas para ventanas minimizadas
 */

import VentanaHistorial from "./VentanaHistorial";
import "./VentanaHistorial.css";

const ContenedorVentanasHistorial = ({
  listaVentanas,
  ventanasMinimizadas,
  cerrarVentana,
  toggleMinimizar,
  toggleMaximizar,
  enfocarVentana,
  moverVentana,
}) => {
  return (
    <>
      {/* Renderizar ventanas abiertas (no minimizadas) */}
      {listaVentanas
        .filter((v) => !v.minimizada)
        .map((ventana) => (
          <VentanaHistorial
            key={ventana.id}
            ventana={ventana}
            onCerrar={() => cerrarVentana(ventana.id)}
            onMinimizar={() => toggleMinimizar(ventana.id)}
            onMaximizar={() => toggleMaximizar(ventana.id)}
            onEnfocar={() => enfocarVentana(ventana.id)}
            onMover={(pos) => moverVentana(ventana.id, pos)}
          />
        ))}

      {/* Barra de tareas para ventanas minimizadas */}
      {ventanasMinimizadas.length > 0 && (
        <div className="ventanas-barra-tareas">
          {ventanasMinimizadas.map((ventana) => (
            <div
              key={ventana.id}
              className="ventana-tarea"
              onClick={() => toggleMinimizar(ventana.id)}
            >
              <span className="ventana-tarea-icono">📊</span>
              <span className="ventana-tarea-nombre">
                {ventana.alimentador?.nombre}
              </span>
              <button
                type="button"
                className="ventana-tarea-cerrar"
                onClick={(e) => {
                  e.stopPropagation();
                  cerrarVentana(ventana.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default ContenedorVentanasHistorial;
