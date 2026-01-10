// SeccionCardDesignV2.jsx
// Versión simplificada usando plantillas de registradores

import { useState, useMemo } from "react";
import { useFuncionalidadesRegistrador } from "../../../hooks/useFuncionalidadesRegistrador";
import "./SeccionCardDesignV2.css";

/**
 * SeccionCardDesignV2 - Versión simplificada usando plantillas
 *
 * Cambios respecto a la versión anterior:
 * - Ya no se arrastran índices manualmente
 * - Ya no se escriben fórmulas manualmente
 * - Se selecciona una funcionalidad de la plantilla
 * - Opcionalmente se personalizan títulos y etiquetas
 */
const SeccionCardDesignV2 = ({
   titulo,           // "Parte superior" o "Parte inferior"
   zona,             // "superior" o "inferior"
   config,           // { registrador_id, funcionalidad_id, titulo_personalizado, etiquetas_personalizadas, oculto }
   registradores,    // Lista de registradores disponibles en el workspace
   onChangeConfig,   // Callback: (nuevaConfig) => void
}) => {
   const [expandido, setExpandido] = useState(false);

   // Obtener funcionalidades del registrador seleccionado
   const {
      funcionalidades,
      plantilla,
      cargando,
      tienePlantilla
   } = useFuncionalidadesRegistrador(config?.registrador_id);

   // Funcionalidad actualmente seleccionada
   const funcionalidadSeleccionada = useMemo(() => {
      if (!config?.funcionalidad_id || !funcionalidades.length) return null;
      return funcionalidades.find(f => f.id === config.funcionalidad_id);
   }, [funcionalidades, config?.funcionalidad_id]);

   // Registrador actualmente seleccionado
   const registradorActual = useMemo(() => {
      if (!config?.registrador_id || !registradores?.length) return null;
      return registradores.find(r => r.id === config.registrador_id);
   }, [registradores, config?.registrador_id]);

   // ============ HANDLERS ============

   const handleChangeRegistrador = (registradorId) => {
      onChangeConfig({
         registrador_id: registradorId || null,
         funcionalidad_id: null,  // Reset al cambiar registrador
         titulo_personalizado: null,
         etiquetas_personalizadas: {},
         oculto: config?.oculto || false
      });
   };

   const handleChangeFuncionalidad = (funcionalidadId) => {
      // Buscar la funcionalidad seleccionada para guardar sus datos
      const funcionalidad = funcionalidadId
         ? funcionalidades.find(f => f.id === funcionalidadId)
         : null;

      onChangeConfig({
         ...config,
         funcionalidad_id: funcionalidadId || null,
         titulo_personalizado: null,  // Reset al cambiar funcionalidad
         etiquetas_personalizadas: {},
         // Guardar datos de la funcionalidad para renderizado sin necesidad de cargar plantilla
         funcionalidad_datos: funcionalidad ? {
            nombre: funcionalidad.nombre,
            registros: funcionalidad.registros || []
         } : null
      });
   };

   const handleChangeTitulo = (valor) => {
      onChangeConfig({
         ...config,
         titulo_personalizado: valor.trim() || null  // null = usar plantilla
      });
   };

   const handleChangeEtiqueta = (indice, valor) => {
      const nuevasEtiquetas = { ...config.etiquetas_personalizadas };

      if (valor.trim()) {
         nuevasEtiquetas[indice] = valor.trim();
      } else {
         delete nuevasEtiquetas[indice];  // Eliminar = usar plantilla
      }

      onChangeConfig({
         ...config,
         etiquetas_personalizadas: nuevasEtiquetas
      });
   };

   // ============ RENDER ============

   const estaOculto = config?.oculto || false;

   return (
      <div
         className={`card-design-section ${expandido ? "card-design-section--expandido" : ""} ${estaOculto ? "card-design-section--oculto" : ""}`}
      >
         {/* Header colapsable */}
         <button
            type="button"
            className="card-design-section-header"
            onClick={() => setExpandido(!expandido)}
         >
            <span className={`card-design-section-arrow ${expandido ? "card-design-section-arrow--expandido" : ""}`}>
               ▶
            </span>
            <span className="card-design-section-titulo">{titulo}</span>

            {/* Badge con info del registrador/funcionalidad seleccionada */}
            {registradorActual && funcionalidadSeleccionada && !estaOculto && (
               <span className="card-design-section-info">
                  {funcionalidadSeleccionada.nombre}
               </span>
            )}

            {estaOculto && (
               <span className="card-design-section-oculto-badge">OCULTO</span>
            )}
         </button>

         {/* Contenido expandible */}
         {expandido && (
            <div className="card-design-section-content">
               {!estaOculto && (
                  <>
                     {/* ====== SELECTOR DE REGISTRADOR ====== */}
                     <div className="card-design-campo">
                        <label>Registrador</label>
                        <select
                           className="card-design-select"
                           value={config?.registrador_id || ""}
                           onChange={(e) => handleChangeRegistrador(e.target.value)}
                        >
                           <option value="">-- Sin registrador --</option>
                           {registradores?.map((reg) => (
                              <option key={reg.id} value={reg.id}>
                                 {reg.nombre}
                              </option>
                           ))}
                        </select>
                     </div>

                     {/* Info de plantilla */}
                     {config?.registrador_id && plantilla && (
                        <div className="card-design-plantilla-info">
                           Plantilla: <strong>{plantilla.nombre}</strong>
                        </div>
                     )}

                     {/* Mensaje si no tiene plantilla */}
                     {config?.registrador_id && !cargando && !tienePlantilla && (
                        <div className="card-design-warning">
                           Este registrador no tiene plantilla configurada.
                           Configura una plantilla en el modal de agentes.
                        </div>
                     )}

                     {/* ====== SELECTOR DE FUNCIONALIDAD ====== */}
                     {config?.registrador_id && tienePlantilla && (
                        <div className="card-design-campo">
                           <label>Mostrar</label>
                           {cargando ? (
                              <div className="card-design-cargando">Cargando funcionalidades...</div>
                           ) : funcionalidades.length === 0 ? (
                              <div className="card-design-warning">
                                 No hay funcionalidades habilitadas en esta plantilla.
                              </div>
                           ) : (
                              <select
                                 className="card-design-select"
                                 value={config.funcionalidad_id || ""}
                                 onChange={(e) => handleChangeFuncionalidad(e.target.value)}
                              >
                                 <option value="">-- Seleccionar funcionalidad --</option>
                                 {funcionalidades.map((func) => (
                                    <option key={func.id} value={func.id}>
                                       {func.nombre} ({func.registros?.length || 0} valores)
                                    </option>
                                 ))}
                              </select>
                           )}
                        </div>
                     )}

                     {/* ====== PERSONALIZACIÓN ====== */}
                     {funcionalidadSeleccionada && (
                        <div className="card-design-personalizacion">
                           <div className="card-design-personalizacion-header">
                              Personalización (opcional)
                           </div>

                           {/* Título personalizado */}
                           <div className="card-design-campo">
                              <label>Título de la sección</label>
                              <input
                                 type="text"
                                 className="card-design-input"
                                 placeholder={funcionalidadSeleccionada.nombre}
                                 value={config.titulo_personalizado || ""}
                                 onChange={(e) => handleChangeTitulo(e.target.value)}
                              />
                              <span className="card-design-hint">
                                 Dejar vacío para usar: "{funcionalidadSeleccionada.nombre}"
                              </span>
                           </div>

                           {/* Etiquetas de los boxes */}
                           <div className="card-design-campo">
                              <label>Etiquetas de los valores</label>
                              <div className="card-design-etiquetas-grid">
                                 {funcionalidadSeleccionada.registros?.map((reg, idx) => (
                                    <div key={idx} className="card-design-etiqueta-item">
                                       <span className="card-design-etiqueta-numero">Box {idx + 1}</span>
                                       <input
                                          type="text"
                                          className="card-design-input card-design-input--small"
                                          placeholder={reg.etiqueta}
                                          value={config.etiquetas_personalizadas?.[idx] || ""}
                                          onChange={(e) => handleChangeEtiqueta(idx, e.target.value)}
                                       />
                                       <span className="card-design-hint-small">
                                          Reg: {reg.registro}
                                       </span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}
                  </>
               )}
            </div>
         )}
      </div>
   );
};

export default SeccionCardDesignV2;
