import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./BadgeAlarmas.css";

/**
 * Badge de alarmas con globo expandible
 *
 * @param {Object} props
 * @param {string} props.nombreAlimentador - Nombre del alimentador para mostrar en el título
 * @param {Array} props.alarmasActivas - Array de alarmas activas [{id, nombre, tipo}]
 * @param {Object} props.alarmasVistas - Objeto {alarmaId: boolean} indicando cuales fueron vistas
 * @param {Function} props.onMarcarVista - Callback (alarmaId) => void
 * @param {Function} props.onMarcarTodasVistas - Callback () => void
 */
const BadgeAlarmas = ({
   nombreAlimentador = "",
   alarmasActivas = [],
   alarmasVistas = {},
   onMarcarVista,
   onMarcarTodasVistas,
}) => {
   const [globoExpandido, setGloboExpandido] = useState(false);
   const [abiertoPorUsuario, setAbiertoPorUsuario] = useState(false); // true = abierto manualmente
   const timerRef = useRef(null);
   const alarmasRefAnterior = useRef(null); // Para detectar nueva lectura por referencia
   const badgeRef = useRef(null);
   const [posicionGlobo, setPosicionGlobo] = useState({ top: 0, left: 0, width: 280, flechaRight: 50 });

   // Filtrar alarmas no vistas
   const alarmasNoVistas = alarmasActivas.filter(
      (alarma) => !alarmasVistas[alarma.id]
   );

   // Determinar severidad maxima (alarma > warning)
   const tieneAlarmaActiva = alarmasActivas.some(
      (a) => a.tipo === "alarma"
   );

   const severidad = tieneAlarmaActiva ? "critico" : "warning";
   const cantidadAlarmas = alarmasActivas.length;

   // Ref para el globo (para medir su altura real)
   const globoRef = useRef(null);

   // Calcular posicion del globo cuando se abre (arriba del badge, ancho de la tarjeta)
   useEffect(() => {
      if (globoExpandido && badgeRef.current) {
         // Buscar el elemento .alim-card padre
         const cardElement = badgeRef.current.closest(".alim-card");
         const badgeRect = badgeRef.current.getBoundingClientRect();

         if (cardElement) {
            const cardRect = cardElement.getBoundingClientRect();
            // Calcular posición de la flecha relativa al badge (desde el borde derecho de la card)
            const badgeCenterX = badgeRect.left + badgeRect.width / 2;
            const flechaRight = cardRect.right - badgeCenterX;

            // Usar requestAnimationFrame para obtener altura real del globo
            requestAnimationFrame(() => {
               const alturaGlobo = globoRef.current ? globoRef.current.offsetHeight : 150;

               setPosicionGlobo({
                  top: badgeRect.top - alturaGlobo - 10, // Arriba del badge
                  left: cardRect.left,
                  width: cardRect.width,
                  flechaRight: Math.max(20, flechaRight - 6), // -6 para centrar la flecha
               });
            });
         } else {
            // Fallback: usar posición del badge
            setPosicionGlobo({
               top: badgeRect.top - 150,
               left: badgeRect.left - 100,
               width: 280,
               flechaRight: 50,
            });
         }
      }
   }, [globoExpandido, cantidadAlarmas, alarmasNoVistas.length]);

   // Auto-abrir globo en cada lectura si hay alarmas no vistas
   // Auto-cerrar a 10s SOLO si se abrió automáticamente (no manualmente)
   useEffect(() => {
      // Si está abierto manualmente por el usuario, no hacer nada automático
      if (abiertoPorUsuario) {
         return;
      }

      // Detectar nueva lectura comparando referencia del array
      const esNuevaLectura = alarmasActivas !== alarmasRefAnterior.current;
      alarmasRefAnterior.current = alarmasActivas;

      if (!esNuevaLectura) {
         return;
      }

      // Si hay alarmas no vistas, abrir automáticamente
      if (alarmasNoVistas.length > 0 && alarmasActivas.length > 0) {
         setGloboExpandido(true);

         // Limpiar timer anterior si existe
         if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
         }

         // Auto-cerrar después de 10 segundos
         timerRef.current = setTimeout(() => {
            setGloboExpandido(false);
            timerRef.current = null;
         }, 10000);
      } else {
         // Todas las alarmas están vistas, no abrir
         // (pero no cerrar si ya está cerrado)
      }

      // NO limpiar el timer en cleanup - debe persistir entre renders
   }, [alarmasActivas, alarmasNoVistas.length, abiertoPorUsuario]);


   // Si no hay alarmas, mostrar check verde o nada
   if (cantidadAlarmas === 0) {
      return (
         <div className="badge-alarmas badge-alarmas--ok">
            <span className="badge-alarmas-icon-ok">✓</span>
         </div>
      );
   }

   // Toggle manual del globo
   const handleToggleGlobo = (e) => {
      e.stopPropagation();

      // Limpiar timer automatico
      if (timerRef.current) {
         clearTimeout(timerRef.current);
         timerRef.current = null;
      }

      setGloboExpandido((prev) => {
         if (!prev) {
            // Abriendo manualmente
            setAbiertoPorUsuario(true);
            return true;
         } else {
            // Cerrando manualmente
            setAbiertoPorUsuario(false);
            return false;
         }
      });
   };

   // Marcar alarma como vista
   const handleMarcarVista = (alarmaId, e) => {
      e.stopPropagation();
      onMarcarVista?.(alarmaId);
   };

   // Marcar todas como vistas
   const handleMarcarTodas = (e) => {
      e.stopPropagation();
      onMarcarTodasVistas?.();

      // Contraer el globo después de un breve delay
      setTimeout(() => {
         setGloboExpandido(false);
         setAbiertoPorUsuario(false);
         if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
         }
      }, 300);
   };

   // Renderizar globo como portal
   const renderGlobo = () => {
      if (!globoExpandido) return null;

      return createPortal(
         <div
            ref={globoRef}
            className="badge-alarmas-globo badge-alarmas-globo--arriba"
            style={{
               position: "fixed",
               top: Math.max(10, posicionGlobo.top), // Evitar que salga por arriba
               left: Math.max(10, posicionGlobo.left),
               width: posicionGlobo.width,
               zIndex: 100, // Menor que modales (1000+)
            }}
         >
            <div className="badge-alarmas-globo-contenido">
               {/* Titulo con botón cerrar */}
               <div className="badge-alarmas-globo-header">
                  <div className="badge-alarmas-globo-titulo">
                     {nombreAlimentador && `${nombreAlimentador} - `}Alarmas Activas ({cantidadAlarmas})
                  </div>
                  <button
                     type="button"
                     className="badge-alarmas-globo-cerrar"
                     onClick={(e) => {
                        e.stopPropagation();
                        setGloboExpandido(false);
                        setAbiertoPorUsuario(false);
                        if (timerRef.current) {
                           clearTimeout(timerRef.current);
                           timerRef.current = null;
                        }
                     }}
                     title="Cerrar"
                  >
                     ✕
                  </button>
               </div>

               {/* Lista de alarmas */}
               <ul className="badge-alarmas-lista">
                  {alarmasActivas.map((alarma) => (
                     <li
                        key={alarma.id}
                        className={`badge-alarmas-item badge-alarmas-item--${alarma.tipo || "warning"}`}
                     >
                        <span className="badge-alarmas-item-indicador">●</span>
                        <span className="badge-alarmas-item-nombre">{alarma.nombre}</span>
                        <label className="badge-alarmas-item-checkbox">
                           <input
                              type="checkbox"
                              checked={!!alarmasVistas[alarma.id]}
                              onChange={(e) => handleMarcarVista(alarma.id, e)}
                           />
                           <span className="badge-alarmas-item-checkbox-label">Visto</span>
                        </label>
                     </li>
                  ))}
               </ul>

               {/* Boton marcar todas */}
               {alarmasNoVistas.length > 0 && (
                  <button
                     type="button"
                     className="badge-alarmas-marcar-todas"
                     onClick={handleMarcarTodas}
                  >
                     Marcar todas como vistas
                  </button>
               )}
            </div>
            {/* Flecha apuntando hacia abajo (hacia el badge) */}
            <div
               className="badge-alarmas-globo-flecha badge-alarmas-globo-flecha--abajo"
               style={{ right: `${posicionGlobo.flechaRight}px` }}
            />
         </div>,
         document.body
      );
   };

   return (
      <div
         ref={badgeRef}
         className={`badge-alarmas badge-alarmas--${severidad}`}
      >
         {/* Badge clickeable */}
         <button
            type="button"
            className={`badge-alarmas-boton ${alarmasNoVistas.length > 0 ? "badge-alarmas-boton--pulsante" : ""} ${severidad === "critico" ? "badge-alarmas-boton--critico" : ""}`}
            onClick={handleToggleGlobo}
            title={`${cantidadAlarmas} alarma(s) activa(s)`}
         >
            <span className="badge-alarmas-icon">
               {severidad === "critico" ? "●" : "●"}
            </span>
            <span className="badge-alarmas-cantidad">{cantidadAlarmas}</span>
         </button>

         {/* Globo expandible (portal) */}
         {renderGlobo()}
      </div>
   );
};

export default BadgeAlarmas;
