// hooks/useModoMobile.js
// Hook para detectar modo móvil basado en ancho de ventana

import { useState, useEffect } from "react";
import { BREAKPOINT_MOBILE } from "../utilidades";

/**
 * Hook para detectar si estamos en modo móvil
 * @returns {boolean} Si estamos en modo móvil
 */
export const useModoMobile = () => {
   const [esModoMobile, setEsModoMobile] = useState(() =>
      typeof window !== "undefined" ? window.innerWidth < BREAKPOINT_MOBILE : false
   );

   useEffect(() => {
      const handleResize = () => {
         setEsModoMobile(window.innerWidth < BREAKPOINT_MOBILE);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   return esModoMobile;
};
