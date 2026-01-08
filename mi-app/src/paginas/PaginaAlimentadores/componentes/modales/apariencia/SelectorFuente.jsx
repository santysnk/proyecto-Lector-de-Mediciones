// componentes/modales/apariencia/SelectorFuente.jsx
// Selector de fuentes personalizado con auto-scroll y navegación por teclado

import { useState, useEffect, useRef } from "react";

/**
 * Selector de fuentes personalizado que muestra cada opción con su propia tipografía
 * - Auto-scroll a la fuente seleccionada al abrir
 * - Navegación con flechas arriba/abajo con preview en vivo
 * - Enter para confirmar, Escape para cancelar
 *
 * @param {Object} props
 * @param {string} props.value - ID de la fuente seleccionada
 * @param {Function} props.onChange - Callback cuando cambia la fuente
 * @param {Array<{id: string, label: string}>} props.fuentes - Lista de fuentes disponibles
 */
export function SelectorFuente({ value, onChange, fuentes }) {
   const [abierto, setAbierto] = useState(false);
   const [indiceResaltado, setIndiceResaltado] = useState(-1);
   const [valorOriginal, setValorOriginal] = useState(value);
   const contenedorRef = useRef(null);
   const dropdownRef = useRef(null);
   const opcionesRefs = useRef([]);

   // Índice de la fuente actualmente seleccionada
   const indiceSeleccionado = fuentes.findIndex((f) => f.id === value);

   // Al abrir el dropdown: guardar valor original, scroll a la opción seleccionada
   useEffect(() => {
      if (abierto) {
         setValorOriginal(value);
         setIndiceResaltado(indiceSeleccionado);

         // Scroll a la opción seleccionada después de que el DOM se actualice
         requestAnimationFrame(() => {
            const opcionActiva = opcionesRefs.current[indiceSeleccionado];
            if (opcionActiva && dropdownRef.current) {
               opcionActiva.scrollIntoView({ block: "center", behavior: "instant" });
            }
         });
      }
   }, [abierto, indiceSeleccionado, value]);

   // Cerrar dropdown al hacer clic fuera
   useEffect(() => {
      const handleClickFuera = (e) => {
         if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
            // Restaurar valor original si se cierra sin confirmar
            onChange(valorOriginal);
            setAbierto(false);
         }
      };
      if (abierto) {
         document.addEventListener("mousedown", handleClickFuera);
      }
      return () => document.removeEventListener("mousedown", handleClickFuera);
   }, [abierto, valorOriginal, onChange]);

   // Manejo de teclado
   useEffect(() => {
      if (!abierto) return;

      const handleKeyDown = (e) => {
         switch (e.key) {
            case "ArrowDown":
               e.preventDefault();
               setIndiceResaltado((prev) => {
                  const nuevoIndice = prev < fuentes.length - 1 ? prev + 1 : 0;
                  // Aplicar preview de la fuente
                  onChange(fuentes[nuevoIndice].id);
                  // Scroll a la opción
                  requestAnimationFrame(() => {
                     opcionesRefs.current[nuevoIndice]?.scrollIntoView({
                        block: "nearest",
                        behavior: "smooth",
                     });
                  });
                  return nuevoIndice;
               });
               break;
            case "ArrowUp":
               e.preventDefault();
               setIndiceResaltado((prev) => {
                  const nuevoIndice = prev > 0 ? prev - 1 : fuentes.length - 1;
                  // Aplicar preview de la fuente
                  onChange(fuentes[nuevoIndice].id);
                  // Scroll a la opción
                  requestAnimationFrame(() => {
                     opcionesRefs.current[nuevoIndice]?.scrollIntoView({
                        block: "nearest",
                        behavior: "smooth",
                     });
                  });
                  return nuevoIndice;
               });
               break;
            case "Enter":
               e.preventDefault();
               // Confirmar selección actual
               setAbierto(false);
               break;
            case "Escape":
               e.preventDefault();
               // Restaurar valor original y cerrar
               onChange(valorOriginal);
               setAbierto(false);
               break;
            default:
               break;
         }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [abierto, fuentes, onChange, valorOriginal]);

   // Encontrar la fuente seleccionada para mostrar en el botón
   const fuenteSeleccionada = fuentes.find((f) => f.id === value) || fuentes[0];

   return (
      <div className="selector-fuente" ref={contenedorRef}>
         <button
            type="button"
            className="selector-fuente-btn"
            onClick={() => setAbierto(!abierto)}
            style={{
               fontFamily: fuenteSeleccionada.id !== "inherit" ? fuenteSeleccionada.id : undefined,
            }}
         >
            <span className="selector-fuente-texto">{fuenteSeleccionada.label}</span>
            <span className="selector-fuente-flecha">{abierto ? "▲" : "▼"}</span>
         </button>
         {abierto && (
            <div className="selector-fuente-dropdown" ref={dropdownRef}>
               {fuentes.map((f, idx) => (
                  <div
                     key={f.id}
                     ref={(el) => (opcionesRefs.current[idx] = el)}
                     className={`selector-fuente-opcion ${f.id === value ? "selector-fuente-opcion--activa" : ""} ${idx === indiceResaltado ? "selector-fuente-opcion--resaltada" : ""}`}
                     style={{ fontFamily: f.id !== "inherit" ? f.id : undefined }}
                     onClick={() => {
                        onChange(f.id);
                        setAbierto(false);
                     }}
                     onMouseEnter={() => {
                        // Solo resaltar visualmente, sin aplicar preview ni scroll
                        setIndiceResaltado(idx);
                     }}
                  >
                     {f.label}
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
