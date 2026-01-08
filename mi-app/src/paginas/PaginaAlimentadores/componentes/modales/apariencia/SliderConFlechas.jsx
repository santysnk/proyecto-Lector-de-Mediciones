// componentes/modales/apariencia/SliderConFlechas.jsx
// Slider con botones de incrementar/decrementar

/**
 * Redondea un número para evitar errores de punto flotante
 * @param {number} valor - Valor a redondear
 * @param {number} decimales - Cantidad de decimales
 */
const redondear = (valor, decimales = 2) => {
   const factor = Math.pow(10, decimales);
   return Math.round(valor * factor) / factor;
};

/**
 * Componente Slider con flechitas para incrementar/decrementar
 *
 * @param {Object} props
 * @param {number} props.value - Valor actual
 * @param {Function} props.onChange - Callback cuando cambia el valor
 * @param {number} props.min - Valor mínimo
 * @param {number} props.max - Valor máximo
 * @param {number} props.step - Incremento por paso
 * @param {string} props.valorDisplay - Texto a mostrar como valor
 */
export function SliderConFlechas({ value, onChange, min, max, step, valorDisplay }) {
   // Calcular decimales del step para redondear correctamente
   const decimalesStep = step < 1 ? String(step).split(".")[1]?.length || 0 : 0;

   const incrementar = () => {
      const nuevoValor = redondear(Math.min(max, parseFloat(value) + step), decimalesStep);
      onChange(nuevoValor);
   };

   const decrementar = () => {
      const nuevoValor = redondear(Math.max(min, parseFloat(value) - step), decimalesStep);
      onChange(nuevoValor);
   };

   return (
      <div className="slider-con-flechas">
         <button
            type="button"
            className="slider-flecha slider-flecha--izq"
            onClick={decrementar}
            disabled={parseFloat(value) <= min}
         >
            ◀
         </button>
         <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
         />
         <button
            type="button"
            className="slider-flecha slider-flecha--der"
            onClick={incrementar}
            disabled={parseFloat(value) >= max}
         >
            ▶
         </button>
         <span className="apariencia-valor">{valorDisplay}</span>
      </div>
   );
}
