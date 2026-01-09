// componentes/modales/rele/SeccionTransformadores.jsx
// Componente compartido para mostrar transformadores (usado por relé y analizador)

import { useState, useEffect, useRef } from "react";

const TABS_TRANSFORMADORES = [
   { id: "ti", nombre: "T.I." },
   { id: "tv", nombre: "T.V." },
   { id: "relaciones", nombre: "Relaciones" },
];

/**
 * Sección de transformadores compartida entre ConfiguracionRele y ConfiguracionAnalizador
 */
const SeccionTransformadores = ({
   dropdownAbierto,
   setDropdownAbierto,
   dropdownRef,
   obtenerTIs,
   obtenerTVs,
   obtenerRelaciones,
   onAbrirModal,
}) => {
   const triggerRef = useRef(null);
   const menuRef = useRef(null);
   const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
   const [tabActivo, setTabActivo] = useState("ti");

   // Calcular posición del menú cuando se abre
   useEffect(() => {
      if (dropdownAbierto && triggerRef.current) {
         const rect = triggerRef.current.getBoundingClientRect();
         const menuHeight = 450;
         const viewportHeight = window.innerHeight;

         // Posición a la derecha del trigger
         let left = rect.right + 8;

         // Centrar verticalmente respecto al trigger
         let top = rect.top + rect.height / 2 - menuHeight / 2;

         // Ajustar si se sale por arriba
         if (top < 10) top = 10;

         // Ajustar si se sale por abajo
         if (top + menuHeight > viewportHeight - 10) {
            top = viewportHeight - menuHeight - 10;
         }

         // Si no cabe a la derecha, ponerlo a la izquierda
         if (left + 340 > window.innerWidth) {
            left = rect.left - 348;
         }

         setMenuPos({ top, left });
      }
   }, [dropdownAbierto]);

   const tis = obtenerTIs();
   const tvs = obtenerTVs();
   const relaciones = obtenerRelaciones();
   const total = tis.length + tvs.length + relaciones.length;

   // Filtrar items según tab activo
   const obtenerItemsFiltrados = () => {
      switch (tabActivo) {
         case "ti":
            return tis;
         case "tv":
            return tvs;
         case "relaciones":
            return relaciones;
         default:
            return [];
      }
   };

   const itemsFiltrados = obtenerItemsFiltrados();

   // Contar items por categoría para mostrar en tabs
   const conteos = {
      ti: tis.length,
      tv: tvs.length,
      relaciones: relaciones.length,
   };

   return (
      <div className="config-rele-seccion config-rele-seccion--transformadores">
         <h6>⚡ Relaciones de transformación</h6>
         <div className="config-rele-transformadores-compacto" ref={dropdownRef}>
            <div className="config-rele-campo-inline">
               <label>TI / TV / Relación [ x : y ]</label>
               <button
                  type="button"
                  className="config-rele-btn-ver-transformadores"
                  onClick={() => setDropdownAbierto(!dropdownAbierto)}
                  ref={triggerRef}
               >
                  <span>Ver disponibles ({total})</span>
                  <span className={`config-rele-dropdown-arrow ${dropdownAbierto ? "abierto" : ""}`}>▼</span>
               </button>
            </div>
            <button
               type="button"
               className="config-rele-btn-editar-transformador"
               onClick={onAbrirModal}
               title="Gestionar transformadores"
            >
               ⚙️
            </button>

            {dropdownAbierto && (
               <div
                  className="config-rele-transformadores-dropdown config-rele-transformadores-dropdown--fixed"
                  style={{ top: menuPos.top, left: menuPos.left }}
                  ref={menuRef}
               >
                  {/* Tabs */}
                  <div className="config-rele-dropdown-tabs">
                     {TABS_TRANSFORMADORES.map((tab) => (
                        <button
                           key={tab.id}
                           type="button"
                           className={`config-rele-dropdown-tab ${tabActivo === tab.id ? "activo" : ""} ${conteos[tab.id] === 0 ? "vacio" : ""}`}
                           onClick={() => setTabActivo(tab.id)}
                           disabled={conteos[tab.id] === 0}
                        >
                           {tab.nombre}
                           <span className="config-rele-dropdown-tab-count">{conteos[tab.id]}</span>
                        </button>
                     ))}
                  </div>

                  {/* Contenido */}
                  <div className="config-rele-dropdown-contenido">
                     {itemsFiltrados.length === 0 ? (
                        <div className="config-rele-dropdown-vacio">
                           {total === 0 ? "No hay transformadores configurados" : "No hay items en esta categoría"}
                        </div>
                     ) : (
                        itemsFiltrados.map((t) => (
                           <div key={t.id} className="config-rele-dropdown-item">
                              <span className="config-rele-dropdown-nombre">{t.nombre}</span>
                              <input
                                 type="text"
                                 className="config-rele-dropdown-formula-input"
                                 value={t.formula}
                                 readOnly
                                 tabIndex={-1}
                              />
                           </div>
                        ))
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default SeccionTransformadores;
