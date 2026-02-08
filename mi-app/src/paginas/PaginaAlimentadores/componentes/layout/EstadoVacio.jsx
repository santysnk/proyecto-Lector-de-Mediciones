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
         <div className="alim-empty-state">
            <div className="alim-empty-state-card">
               <div className="alim-empty-state-icono">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                     <circle cx="12" cy="12" r="10" />
                     <line x1="12" y1="8" x2="12" y2="12" />
                     <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
               </div>
               <h3 className="alim-empty-state-titulo">Sin acceso a workspaces</h3>
               <p className="alim-empty-state-texto">
                  No tenés ningún workspace asignado. Contactá a un administrador para que te asigne acceso.
               </p>
               <button className="alim-empty-state-btn" onClick={onSalir}>Volver al inicio</button>
            </div>
         </div>
      );
   }

   // sinPuestos
   return (
      <div className="alim-empty-state">
         <div className="alim-empty-state-card">
            <div className="alim-empty-state-icono">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="2" />
                  <line x1="12" y1="9" x2="12" y2="15" />
                  <line x1="9" y1="12" x2="15" y2="12" />
               </svg>
            </div>
            <h3 className="alim-empty-state-titulo">No hay puestos creados</h3>
            <p className="alim-empty-state-texto">
               Creá tu primer puesto desde la opción <strong>Nuevo puesto</strong> en el menú desplegable para comenzar a configurar alimentadores.
            </p>
         </div>
      </div>
   );
};

export default EstadoVacio;
