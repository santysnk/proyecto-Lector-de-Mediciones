// componentes/modales/puesto/InputEscala.jsx
// Input numérico con validación para escala por puesto

import { useState, useEffect } from "react";

const InputEscala = ({ valor, onChange, min, max }) => {
   const [valorLocal, setValorLocal] = useState(valor?.toString() ?? "1");

   // Sincronizar cuando cambia el valor externo
   useEffect(() => {
      setValorLocal(valor?.toString() ?? "1");
   }, [valor]);

   const aplicarCambio = () => {
      const valorNum = parseFloat(valorLocal);
      if (!isNaN(valorNum)) {
         const valorClamped = Math.max(min, Math.min(max, valorNum));
         onChange(valorClamped);
         setValorLocal(valorClamped.toString());
      } else {
         // Si no es válido, restaurar al valor original
         setValorLocal(valor?.toString() ?? "1");
      }
   };

   const handleKeyDown = (e) => {
      if (e.key === "Enter") {
         aplicarCambio();
         e.target.blur();
      }
   };

   return (
      <input
         type="number"
         step="0.1"
         min={min}
         max={max}
         value={valorLocal}
         onChange={(e) => setValorLocal(e.target.value)}
         onBlur={aplicarCambio}
         onKeyDown={handleKeyDown}
         className="editar-escala-input"
      />
   );
};

export default InputEscala;
