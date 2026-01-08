// componentes/SeccionPuestos.jsx
// Sección de puestos del menú lateral

/**
 * Sección de puestos en el menú lateral
 * @param {Object} props
 * @param {Array} props.puestos - Lista de puestos
 * @param {Object} props.puestoSeleccionado - Puesto actualmente seleccionado
 * @param {Function} props.onSeleccionarPuesto - Handler para seleccionar puesto
 * @param {Function} props.obtenerColorPuesto - Función para obtener color del puesto
 * @param {Array} props.coloresSistema - Colores de fallback
 */
const SeccionPuestos = ({
   puestos,
   puestoSeleccionado,
   onSeleccionarPuesto,
   obtenerColorPuesto,
   coloresSistema,
}) => {
   return (
      <section className="alim-drawer-section">
         <h3 className="alim-drawer-section-title">Puestos</h3>
         <div className="alim-drawer-puestos">
            {puestos.map((p) => (
               <button
                  key={p.id}
                  className={
                     "alim-btn alim-drawer-btn-puesto" +
                     (puestoSeleccionado && puestoSeleccionado.id === p.id
                        ? " alim-btn-active"
                        : "")
                  }
                  style={{
                     backgroundColor: obtenerColorPuesto(p.id) || coloresSistema[0],
                  }}
                  onClick={() => onSeleccionarPuesto(p.id)}
               >
                  {p.nombre}
               </button>
            ))}
         </div>
      </section>
   );
};

export default SeccionPuestos;
