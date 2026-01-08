// componentes/layout/EstadoVacio.jsx
// Estados vacíos para cuando no hay workspace o puestos

/**
 * Muestra estados vacíos según el tipo
 * @param {Object} props
 * @param {'sinWorkspace'|'sinPuestos'} props.tipo - Tipo de estado vacío
 * @param {Function} props.onSalir - Handler para botón de salir
 */
const EstadoVacio = ({ tipo, onSalir }) => {
   if (tipo === "sinWorkspace") {
      return (
         <div className="alim-sin-workspace">
            <h2>Sin acceso a workspaces</h2>
            <p>No tienes ningún workspace asignado.</p>
            <p>Contacta a un administrador para que te asigne acceso a un workspace.</p>
            <button onClick={onSalir}>Volver al inicio</button>
         </div>
      );
   }

   // sinPuestos
   return (
      <div className="alim-empty-state">
         <p>
            No hay puestos creados. Haz clic en el boton "+" para agregar
            uno.
         </p>
      </div>
   );
};

export default EstadoVacio;
