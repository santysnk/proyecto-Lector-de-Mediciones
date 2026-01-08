// componentes/SeccionEscala.jsx
// Sección de control de escala global del menú lateral

/**
 * Sección de escala global
 * @param {Object} props
 * @param {number} props.escalaGlobal - Valor actual de escala
 * @param {Function} props.onEscalaChange - Handler para cambio de escala
 * @param {number} props.ESCALA_MIN - Valor mínimo
 * @param {number} props.ESCALA_MAX - Valor máximo
 */
const SeccionEscala = ({ escalaGlobal, onEscalaChange, ESCALA_MIN, ESCALA_MAX }) => {
   if (!onEscalaChange) return null;

   const handleInputChange = (e) => {
      const valor = parseFloat(e.target.value);
      if (!isNaN(valor) && valor >= ESCALA_MIN && valor <= ESCALA_MAX) {
         onEscalaChange(valor);
      }
   };

   return (
      <section className="alim-drawer-section">
         <h3 className="alim-drawer-section-title">Escala Global</h3>
         <div className="alim-drawer-escala">
            <input
               type="range"
               min={ESCALA_MIN}
               max={ESCALA_MAX}
               step="0.1"
               value={escalaGlobal ?? 1.0}
               onChange={(e) => onEscalaChange(parseFloat(e.target.value))}
               className="alim-drawer-escala-slider"
            />
            <div className="alim-drawer-escala-valor">
               <input
                  type="number"
                  step="0.1"
                  min={ESCALA_MIN}
                  max={ESCALA_MAX}
                  value={escalaGlobal ?? 1.0}
                  onChange={handleInputChange}
                  className="alim-drawer-escala-input"
               />
               <span className="alim-drawer-escala-x">x</span>
            </div>
            <button
               type="button"
               className="alim-drawer-escala-reset"
               onClick={() => onEscalaChange(1.0)}
               disabled={escalaGlobal === 1.0}
            >
               Reset
            </button>
         </div>
      </section>
   );
};

export default SeccionEscala;
