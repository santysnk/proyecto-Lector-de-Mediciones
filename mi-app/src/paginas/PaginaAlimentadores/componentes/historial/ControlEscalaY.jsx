// componentes/historial/ControlEscalaY.jsx
// Control slider vertical para ajustar la escala Y del gráfico

/**
 * Control de escala Y con slider vertical y edición manual
 * @param {Object} props
 * @param {boolean} props.visible - Si mostrar el control
 * @param {number|null} props.escalaYMax - Valor actual de escala (null = auto)
 * @param {Function} props.setEscalaYMax - Setter para escala
 * @param {{min: number, max: number}} props.limitesEscalaY - Límites del slider
 * @param {boolean} props.editandoEscalaY - Si está en modo edición manual
 * @param {Function} props.setEditandoEscalaY - Setter para modo edición
 * @param {Function} props.handleEscalaYManual - Handler para valor manual
 */
const ControlEscalaY = ({
   visible,
   escalaYMax,
   setEscalaYMax,
   limitesEscalaY,
   editandoEscalaY,
   setEditandoEscalaY,
   handleEscalaYManual,
}) => {
   if (!visible) return null;

   const handleSubirEscala = () => {
      const valorActual = escalaYMax ?? limitesEscalaY.min;
      const redondeado = Math.ceil(valorActual / 10) * 10;
      const nuevoValor = redondeado === valorActual ? valorActual + 10 : redondeado;
      setEscalaYMax(Math.min(nuevoValor, limitesEscalaY.max));
   };

   const handleBajarEscala = () => {
      const valorActual = escalaYMax ?? limitesEscalaY.min;
      const redondeado = Math.floor(valorActual / 10) * 10;
      const nuevoValor = redondeado === valorActual ? valorActual - 10 : redondeado;
      setEscalaYMax(Math.max(nuevoValor, limitesEscalaY.min));
   };

   return (
      <div className="ventana-escala-y">
         {/* Botón subir escala */}
         <button
            type="button"
            className="ventana-escala-y-btn ventana-escala-y-btn--arriba"
            onClick={handleSubirEscala}
            title="Aumentar escala +10"
         >
            ▲
         </button>

         {/* Valor editable o label */}
         {editandoEscalaY ? (
            <input
               type="number"
               className="ventana-escala-y-input"
               defaultValue={escalaYMax ?? limitesEscalaY.min}
               autoFocus
               onBlur={(e) => handleEscalaYManual(e.target.value)}
               onKeyDown={(e) => {
                  if (e.key === "Enter") handleEscalaYManual(e.target.value);
                  if (e.key === "Escape") setEditandoEscalaY(false);
               }}
            />
         ) : (
            <span
               className="ventana-escala-y-label ventana-escala-y-label--editable"
               onDoubleClick={() => setEditandoEscalaY(true)}
               title="Doble click para editar"
            >
               {escalaYMax ?? limitesEscalaY.min}
            </span>
         )}

         {/* Slider */}
         <input
            type="range"
            className="ventana-escala-y-slider"
            min={limitesEscalaY.min}
            max={limitesEscalaY.max}
            step={0.5}
            value={escalaYMax ?? limitesEscalaY.min}
            onChange={(e) => setEscalaYMax(Number(e.target.value))}
            title={`Escala Y: 0 - ${escalaYMax ?? limitesEscalaY.min}`}
         />

         <span className="ventana-escala-y-label">0</span>

         {/* Botón bajar escala */}
         <button
            type="button"
            className="ventana-escala-y-btn ventana-escala-y-btn--abajo"
            onClick={handleBajarEscala}
            title="Disminuir escala -10"
         >
            ▼
         </button>

         {/* Botón auto */}
         <button
            type="button"
            className="ventana-escala-y-reset"
            onClick={() => setEscalaYMax(null)}
            title="Restaurar escala automática"
            disabled={!escalaYMax}
         >
            Auto
         </button>
      </div>
   );
};

export default ControlEscalaY;
