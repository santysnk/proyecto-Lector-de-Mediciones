// hooks/useTarjetaAlimentador.js
// Hook para manejar el estado y lógica de TarjetaAlimentador

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook para manejar el estado y lógica de una tarjeta de alimentador
 * @param {Object} params
 * @param {boolean} params.mideRele - Si hay medición de relé activa
 * @param {boolean} params.mideAnalizador - Si hay medición de analizador activa
 * @param {boolean} params.estaPolling - Si hay polling activo
 * @param {number} params.contadorRele - Contador de lecturas de relé
 * @param {number} params.contadorAnalizador - Contador de lecturas de analizador
 * @param {number} params.contadorPolling - Contador de lecturas de polling
 * @param {number} params.escala - Escala actual de la tarjeta
 * @param {Function} params.onEscalaChange - Callback para cambiar escala
 * @param {number} params.ESCALA_MIN - Escala mínima permitida
 * @param {number} params.ESCALA_MAX - Escala máxima permitida
 */
export function useTarjetaAlimentador({
   mideRele,
   mideAnalizador,
   estaPolling,
   contadorRele,
   contadorAnalizador,
   contadorPolling,
   escala,
   onEscalaChange,
   ESCALA_MIN,
   ESCALA_MAX,
}) {
   // Control local de animaciones de borde: solo se activan tras recibir una lectura
   const [mostrarProgresoRele, setMostrarProgresoRele] = useState(false);
   const [mostrarProgresoAnalizador, setMostrarProgresoAnalizador] = useState(false);
   const [mostrarProgresoPolling, setMostrarProgresoPolling] = useState(false);
   const [cicloPolling, setCicloPolling] = useState(0);

   const ultimoContadorReleRef = useRef(contadorRele);
   const ultimoContadorAnalizadorRef = useRef(contadorAnalizador);
   const ultimoContadorPollingRef = useRef(contadorPolling);

   // Control del popover de escala
   const [mostrarPopoverEscala, setMostrarPopoverEscala] = useState(false);
   const [posicionPopover, setPosicionPopover] = useState({ top: 0, left: 0 });
   const [valorEscalaInput, setValorEscalaInput] = useState(escala.toString());
   const triangleRef = useRef(null);
   const popoverRef = useRef(null);

   // Control del menú desplegable de opciones
   const [menuAbierto, setMenuAbierto] = useState(false);
   const [posicionMenu, setPosicionMenu] = useState({ top: 0, left: 0, width: 0 });
   const menuRef = useRef(null);
   const cardRef = useRef(null);

   // Effect para medición de relé
   useEffect(() => {
      if (!mideRele) {
         setMostrarProgresoRele(false);
         ultimoContadorReleRef.current = contadorRele;
         return;
      }

      if (contadorRele !== ultimoContadorReleRef.current) {
         ultimoContadorReleRef.current = contadorRele;
         setMostrarProgresoRele(contadorRele > 0);
      }
   }, [contadorRele, mideRele]);

   // Effect para medición de analizador
   useEffect(() => {
      if (!mideAnalizador) {
         setMostrarProgresoAnalizador(false);
         ultimoContadorAnalizadorRef.current = contadorAnalizador;
         return;
      }

      if (contadorAnalizador !== ultimoContadorAnalizadorRef.current) {
         ultimoContadorAnalizadorRef.current = contadorAnalizador;
         setMostrarProgresoAnalizador(contadorAnalizador > 0);
      }
   }, [contadorAnalizador, mideAnalizador]);

   // Effect para polling
   useEffect(() => {
      if (!estaPolling) {
         setMostrarProgresoPolling(false);
         ultimoContadorPollingRef.current = contadorPolling;
         return;
      }

      if (contadorPolling !== ultimoContadorPollingRef.current) {
         ultimoContadorPollingRef.current = contadorPolling;
         setMostrarProgresoPolling(contadorPolling > 0);
         setCicloPolling((prev) => prev + 1);
      }
   }, [contadorPolling, estaPolling]);

   // Sincronizar input con escala cuando cambia externamente
   useEffect(() => {
      setValorEscalaInput(escala.toString());
   }, [escala]);

   // Toggle del popover de escala
   const togglePopoverEscala = useCallback(
      (e) => {
         e.stopPropagation();
         if (mostrarPopoverEscala) {
            setMostrarPopoverEscala(false);
            return;
         }
         if (triangleRef.current) {
            const rect = triangleRef.current.getBoundingClientRect();
            setPosicionPopover({
               top: rect.bottom + 8,
               left: rect.left + rect.width / 2 - 60,
            });
            setMostrarPopoverEscala(true);
         }
      },
      [mostrarPopoverEscala]
   );

   // Cerrar popover al hacer click fuera
   useEffect(() => {
      if (!mostrarPopoverEscala) return;
      const handleClickOutside = (event) => {
         if (
            popoverRef.current &&
            !popoverRef.current.contains(event.target) &&
            triangleRef.current &&
            !triangleRef.current.contains(event.target)
         ) {
            setMostrarPopoverEscala(false);
         }
      };
      const timeoutId = setTimeout(() => {
         document.addEventListener("mousedown", handleClickOutside);
      }, 10);
      return () => {
         clearTimeout(timeoutId);
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, [mostrarPopoverEscala]);

   // Cerrar menú desplegable al hacer click fuera o al hacer scroll
   useEffect(() => {
      if (!menuAbierto) return;
      const handleClickOutside = (event) => {
         if (
            menuRef.current &&
            !menuRef.current.contains(event.target) &&
            cardRef.current &&
            !cardRef.current.querySelector(".alim-card-menu-toggle")?.contains(event.target)
         ) {
            setMenuAbierto(false);
         }
      };
      const handleWheel = () => {
         setMenuAbierto(false);
      };
      const timeoutId = setTimeout(() => {
         document.addEventListener("mousedown", handleClickOutside);
         window.addEventListener("wheel", handleWheel, { passive: true });
      }, 10);
      return () => {
         clearTimeout(timeoutId);
         document.removeEventListener("mousedown", handleClickOutside);
         window.removeEventListener("wheel", handleWheel);
      };
   }, [menuAbierto]);

   // Toggle del menú desplegable
   const toggleMenu = useCallback(
      (e) => {
         e.stopPropagation();
         if (!menuAbierto && cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            const alturaMenu = 48;
            const separacion = 3;
            setPosicionMenu({
               top: rect.top - alturaMenu - separacion,
               left: rect.left,
               width: rect.width,
            });
         }
         setMenuAbierto(!menuAbierto);
      },
      [menuAbierto]
   );

   // Cerrar menú
   const cerrarMenu = useCallback(() => {
      setMenuAbierto(false);
   }, []);

   // Aplicar escala inmediatamente al cambiar el input
   const handleEscalaInputChange = useCallback(
      (e) => {
         const valorStr = e.target.value;
         setValorEscalaInput(valorStr);

         const valor = parseFloat(valorStr);
         if (!isNaN(valor) && valor >= ESCALA_MIN && valor <= ESCALA_MAX) {
            onEscalaChange?.(valor);
         }
      },
      [ESCALA_MIN, ESCALA_MAX, onEscalaChange]
   );

   // Cerrar con Escape
   const handleEscalaKeyDown = useCallback((e) => {
      if (e.key === "Escape") {
         setMostrarPopoverEscala(false);
      }
   }, []);

   // Incrementar escala
   const handleIncrementarEscala = useCallback(() => {
      const valorActual = parseFloat(valorEscalaInput) || escala;
      const nuevoValor = Math.min(ESCALA_MAX, Math.round((valorActual + 0.01) * 100) / 100);
      setValorEscalaInput(nuevoValor.toString());
      onEscalaChange?.(nuevoValor);
   }, [valorEscalaInput, escala, ESCALA_MAX, onEscalaChange]);

   // Decrementar escala
   const handleDecrementarEscala = useCallback(() => {
      const valorActual = parseFloat(valorEscalaInput) || escala;
      const nuevoValor = Math.max(ESCALA_MIN, Math.round((valorActual - 0.01) * 100) / 100);
      setValorEscalaInput(nuevoValor.toString());
      onEscalaChange?.(nuevoValor);
   }, [valorEscalaInput, escala, ESCALA_MIN, onEscalaChange]);

   // Resetear escala a 1.0
   const handleResetearEscala = useCallback(() => {
      setValorEscalaInput("1");
      onEscalaChange?.(1.0);
   }, [onEscalaChange]);

   return {
      // Refs
      triangleRef,
      popoverRef,
      menuRef,
      cardRef,

      // Estado de animaciones
      mostrarProgresoRele,
      mostrarProgresoAnalizador,
      mostrarProgresoPolling,
      cicloPolling,

      // Estado del popover de escala
      mostrarPopoverEscala,
      posicionPopover,
      valorEscalaInput,

      // Estado del menú
      menuAbierto,
      posicionMenu,

      // Funciones del popover de escala
      togglePopoverEscala,
      handleEscalaInputChange,
      handleEscalaKeyDown,
      handleIncrementarEscala,
      handleDecrementarEscala,
      handleResetearEscala,

      // Funciones del menú
      toggleMenu,
      cerrarMenu,
   };
}
