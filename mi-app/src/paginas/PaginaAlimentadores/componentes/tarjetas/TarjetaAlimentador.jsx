// src/paginas/PaginaAlimentadores/componentes/tarjetas/TarjetaAlimentador.jsx

import "./TarjetaAlimentador.css";
import CajaMedicion from "./CajaMedicion.jsx";
import GrupoMedidores from "./GrupoMedidores.jsx";
import { usarContextoConfiguracion } from "../../contexto/ContextoConfiguracion";
import { useTarjetaAlimentador } from "../../hooks/mediciones";
import { PopoverEscala, MenuFlotante } from "./componentes";

// ============================================================================
// Helper que prepara la estructura de un lado de la tarjeta (sup/inf)
// ============================================================================

const construirLado = (side, tituloDefault) => {
   const cajasPorDefecto = ["R", "S", "T"].map((label) => ({
      etiqueta: label,
      valor: "--,--",
      enabled: false,
      origen: null,
   }));

   if (!side) {
      return {
         titulo: tituloDefault,
         boxes: cajasPorDefecto,
         oculto: false,
      };
   }

   const titulo = (side.titulo && String(side.titulo).trim()) || tituloDefault;
   const oculto = !!side.oculto;

   let boxes = Array.isArray(side.boxes) ? side.boxes : [];
   boxes = boxes.slice(0, 4);

   if (boxes.length === 0) {
      boxes = cajasPorDefecto;
   } else {
      boxes = boxes.map((b, idx) => ({
         etiqueta: (b?.etiqueta && String(b.etiqueta).trim()) || `Box ${idx + 1}`,
         valor: b?.valor == null || b.valor === "" ? "--,--" : String(b.valor),
         enabled: !!b?.enabled,
         origen: b?.origen || null,
      }));
   }

   return { titulo, boxes, oculto };
};

// ============================================================================
// Componentes auxiliares inline
// ============================================================================

/**
 * Barra de progreso de polling animada
 */
const BarraProgresoPolling = ({ cicloPolling, periodoPolling }) => (
   <div className="alim-card-progress-track" key={cicloPolling}>
      <div
         className="alim-card-progress-fill"
         style={{ "--progress-duration": `${periodoPolling}s` }}
      >
         <div className="alim-card-progress-spark" />
      </div>
   </div>
);

/**
 * Overlay de error crítico
 */
const OverlayError = () => (
   <div className="alim-card-error-overlay alim-card-error-overlay--parpadeo">
      <div className="alim-card-error-content">
         <span className="alim-card-error-icon">⚠</span>
         <span className="alim-card-error-title">ATENCIÓN</span>
         <span className="alim-card-error-message">Posiblemente fuera de servicio</span>
         <span className="alim-card-error-detail">
            Las últimas 3 lecturas no fueron válidas o dieron error
         </span>
      </div>
   </div>
);

/**
 * Botón de escala (triángulo)
 */
const BotonEscala = ({ triangleRef, escala, escalaModificada, onClick }) => (
   <button
      ref={triangleRef}
      type="button"
      className={`alim-card-scale-btn${escalaModificada ? " alim-card-scale-btn--active" : ""}`}
      onClick={onClick}
      title={`Escala: ${escala}x (click para cambiar)`}
   >
      <span className="alim-card-scale-triangle">▼</span>
      {escalaModificada && <span className="alim-card-scale-value">{escala}x</span>}
   </button>
);

// ============================================================================
// Componente principal TarjetaAlimentador
// ============================================================================

const TarjetaAlimentador = ({
   nombre,
   color,
   onConfigClick,
   onHistorialClick,
   esObservador = false,
   topSide,
   bottomSide,
   draggable = false,
   isDragging = false,
   onDragStart,
   onDragOver,
   onDrop,
   onDragEnd,

   // Info de mediciones y periodos
   mideRele = false,
   mideAnalizador = false,
   periodoRele = 60,
   periodoAnalizador = 60,
   contadorRele = 0,
   contadorAnalizador = 0,

   // Play/Stop para polling de lecturas
   estaPolling = false,
   contadorPolling = 0,
   periodoPolling = 60,
   errorPolling = null,

   // Escala de la tarjeta
   escala = 1.0,
   onEscalaChange,
   ESCALA_MIN = 0.5,
   ESCALA_MAX = 2.0,
}) => {
   // Obtener estilos globales del contexto
   const { estilosGlobales } = usarContextoConfiguracion();

   // Hook para manejar estado y lógica de la tarjeta
   const {
      triangleRef,
      popoverRef,
      menuRef,
      cardRef,
      mostrarProgresoRele,
      mostrarProgresoAnalizador,
      mostrarProgresoPolling,
      cicloPolling,
      mostrarPopoverEscala,
      posicionPopover,
      valorEscalaInput,
      menuAbierto,
      posicionMenu,
      togglePopoverEscala,
      handleEscalaInputChange,
      handleEscalaKeyDown,
      handleIncrementarEscala,
      handleDecrementarEscala,
      handleResetearEscala,
      toggleMenu,
      cerrarMenu,
   } = useTarjetaAlimentador({
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
   });

   // Armar lados de la tarjeta con valores por defecto si no hay diseño
   const sup = construirLado(topSide, "CONSUMO (A)");
   const inf = construirLado(bottomSide, "TENSIÓN (kV)");

   // Detectar si algún lado tiene 4 boxes (para ensanchar la tarjeta)
   const maxBoxes = Math.max(sup.boxes.length, inf.boxes.length);
   const isWide = maxBoxes >= 4;

   // Determinar errores por zona
   const errorSuperior = errorPolling?.superior || false;
   const errorInferior = errorPolling?.inferior || false;
   const errorSuperiorCritico = errorPolling?.superiorCritico || false;
   const errorInferiorCritico = errorPolling?.inferiorCritico || false;
   const tieneErrorCritico = errorSuperiorCritico || errorInferiorCritico;

   // Armar clases de la card
   const clasesCard = ["alim-card"];
   if (isWide) clasesCard.push("alim-card-wide");
   if (isDragging) clasesCard.push("alim-card-dragging");
   if (tieneErrorCritico) clasesCard.push("alim-card-error");

   // Renderizar una caja de medición
   const renderizarCaja = (box, idx, zona) => {
      const zonaConError = zona === "sup" ? errorSuperior : errorInferior;
      return (
         <CajaMedicion
            key={`${zona}-${idx}`}
            box={box}
            indice={idx}
            zona={zona}
            mideRele={mideRele}
            mideAnalizador={mideAnalizador}
            mostrarProgresoRele={mostrarProgresoRele}
            mostrarProgresoAnalizador={mostrarProgresoAnalizador}
            periodoRele={periodoRele}
            periodoAnalizador={periodoAnalizador}
            contadorRele={contadorRele}
            contadorAnalizador={contadorAnalizador}
            estaPolling={estaPolling}
            mostrarProgresoPolling={mostrarProgresoPolling}
            periodoPolling={periodoPolling}
            contadorPolling={contadorPolling}
            tieneError={zonaConError}
            estilosBox={{
               tituloBox: {
                  fontFamily: estilosGlobales?.tituloBox?.fontFamily || "inherit",
                  fontSize: estilosGlobales?.tituloBox?.fontSize || "1rem",
               },
               valorBox: {
                  fontFamily:
                     estilosGlobales?.valorBox?.fontFamily ||
                     "'DS-Digital', 'Courier New', monospace",
                  fontSize: estilosGlobales?.valorBox?.fontSize || "1.5rem",
                  color: estilosGlobales?.valorBox?.color || "#ffff00",
                  decimales: estilosGlobales?.valorBox?.decimales ?? 2,
               },
               box: {
                  width: estilosGlobales?.box?.width || "80px",
                  height: estilosGlobales?.box?.height || "auto",
               },
            }}
         />
      );
   };

   // Escala modificada
   const escalaModificada = escala !== 1.0;
   const estiloEscala =
      escala !== 1.0
         ? {
              transform: `scale(${escala})`,
              transformOrigin: "top left",
           }
         : {};

   return (
      <div
         ref={cardRef}
         className={clasesCard.join(" ")}
         style={{
            cursor: draggable ? "grab" : "default",
            ...estiloEscala,
         }}
         draggable={draggable}
         onDragStart={onDragStart}
         onDragOver={onDragOver}
         onDrop={onDrop}
         onDragEnd={onDragEnd}
      >
         {/* Header con nombre y botones de acciones */}
         <div
            className="alim-card-header"
            style={{
               background: `linear-gradient(to right, ${color || "#0ea5e9"}, ${color || "#0ea5e9"}80)`,
            }}
         >
            {/* Flecha animada para desplegar menú */}
            <button
               type="button"
               className={`alim-card-menu-toggle ${menuAbierto ? "alim-card-menu-toggle--abierto" : ""}`}
               onClick={toggleMenu}
               title="Opciones"
            >
               <span className="alim-card-menu-arrow">▼</span>
            </button>

            <span
               className="alim-card-title"
               style={{
                  fontFamily: estilosGlobales?.header?.fontFamily || "inherit",
                  fontSize: estilosGlobales?.header?.fontSize || "1rem",
                  fontWeight: estilosGlobales?.header?.fontWeight || 700,
               }}
            >
               {nombre}
            </span>
         </div>

         {/* Barra de progreso de polling */}
         {estaPolling && mostrarProgresoPolling && (
            <BarraProgresoPolling cicloPolling={cicloPolling} periodoPolling={periodoPolling} />
         )}

         {/* Cuerpo con los 2 bloques (superior / inferior) */}
         <div className="alim-card-body">
            {/* Parte superior */}
            {!sup.oculto && (
               <GrupoMedidores
                  titulo={sup.titulo}
                  boxes={sup.boxes}
                  zona="sup"
                  renderizarCaja={renderizarCaja}
                  estiloTitulo={{
                     fontFamily: estilosGlobales?.tituloZona?.fontFamily || "inherit",
                     fontSize: estilosGlobales?.tituloZona?.fontSize || "0.8rem",
                  }}
                  gap={estilosGlobales?.box?.gap}
               />
            )}

            {/* Parte inferior */}
            {!inf.oculto && (
               <GrupoMedidores
                  titulo={inf.titulo}
                  boxes={inf.boxes}
                  zona="inf"
                  renderizarCaja={renderizarCaja}
                  estiloTitulo={{
                     fontFamily: estilosGlobales?.tituloZona?.fontFamily || "inherit",
                     fontSize: estilosGlobales?.tituloZona?.fontSize || "0.8rem",
                  }}
                  gap={estilosGlobales?.box?.gap}
               />
            )}

            {/* Overlay de error crítico */}
            {tieneErrorCritico && <OverlayError />}

            {/* Triángulo de escala */}
            {onEscalaChange && (
               <BotonEscala
                  triangleRef={triangleRef}
                  escala={escala}
                  escalaModificada={escalaModificada}
                  onClick={togglePopoverEscala}
               />
            )}
         </div>

         {/* Popover de escala (portal) */}
         {mostrarPopoverEscala && (
            <PopoverEscala
               popoverRef={popoverRef}
               posicion={posicionPopover}
               valorInput={valorEscalaInput}
               escalaMin={ESCALA_MIN}
               escalaMax={ESCALA_MAX}
               onInputChange={handleEscalaInputChange}
               onKeyDown={handleEscalaKeyDown}
               onIncrementar={handleIncrementarEscala}
               onDecrementar={handleDecrementarEscala}
               onResetear={handleResetearEscala}
            />
         )}

         {/* Menú flotante desplegable (portal) */}
         {menuAbierto && (
            <MenuFlotante
               menuRef={menuRef}
               posicion={posicionMenu}
               onConfigClick={onConfigClick}
               onHistorialClick={onHistorialClick}
               esObservador={esObservador}
               onCerrar={cerrarMenu}
            />
         )}
      </div>
   );
};

export default TarjetaAlimentador;
