// componentes/modales/apariencia/PreviewTarjeta.jsx
// Componente de preview que muestra cómo quedan los estilos aplicados

/**
 * Formatea un valor según la cantidad de decimales configurada
 * @param {string} valor - Valor original (puede ser "--,--" o número con coma)
 * @param {number} decimales - Cantidad de decimales a mostrar
 */
const formatearValorConDecimales = (valor, decimales) => {
   if (valor === "--,--" || valor === "--" || valor === "--,-") {
      if (decimales === 0) return "--";
      if (decimales === 1) return "--,-";
      return "--,--";
   }

   // Convertir coma a punto para parsear
   const numStr = valor.replace(",", ".");
   const num = parseFloat(numStr);
   if (isNaN(num)) return valor;

   return num.toFixed(decimales).replace(".", ",");
};

/**
 * Componente de preview que muestra cómo quedan los estilos aplicados
 *
 * @param {Object} props
 * @param {Object} props.estilos - Estilos de la tarjeta
 * @param {Array<string>} props.valores - Valores a mostrar en el preview
 * @param {Function} props.onRandomizar - Callback para randomizar valores
 * @param {Function} props.onResetearValores - Callback para resetear valores a "--,--"
 */
export function PreviewTarjeta({ estilos, valores, onRandomizar, onResetearValores }) {
   const decimales = estilos.valorBox.decimales ?? 2;

   return (
      <div className="preview-tarjeta">
         <div className="preview-header">
            <div className="preview-header-icons">
               <span className="preview-icon">▲</span>
            </div>
            <span
               className="preview-titulo"
               style={{
                  fontFamily: estilos.header.fontFamily,
                  fontSize: estilos.header.fontSize,
                  fontWeight: estilos.header.fontWeight,
               }}
            >
               TRAFO 1
            </span>
         </div>

         <div className="preview-body">
            {/* Sección superior */}
            <div className="preview-seccion">
               <div
                  className="preview-zona-titulo"
                  style={{
                     fontFamily: estilos.tituloZona.fontFamily,
                     fontSize: estilos.tituloZona.fontSize,
                  }}
               >
                  CORRIENTE DE LÍNEA (A) (EN 33 KV)
               </div>
               <div className="preview-boxes" style={{ gap: estilos.box.gap }}>
                  {["R", "S", "T"].map((fase, idx) => (
                     <div
                        key={fase}
                        className="preview-box"
                        style={{ width: estilos.box.width, flex: `0 0 ${estilos.box.width}` }}
                     >
                        <span
                           className="preview-box-titulo"
                           style={{
                              fontFamily: estilos.tituloBox.fontFamily,
                              fontSize: estilos.tituloBox.fontSize,
                           }}
                        >
                           {fase}
                        </span>
                        <span
                           className="preview-box-valor"
                           style={{
                              fontFamily: estilos.valorBox.fontFamily,
                              fontSize: estilos.valorBox.fontSize,
                              color: estilos.valorBox.color,
                              width: "100%",
                              height:
                                 estilos.box.height !== "auto" ? estilos.box.height : undefined,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                           }}
                        >
                           {formatearValorConDecimales(valores[idx], decimales)}
                        </span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Sección inferior */}
            <div className="preview-seccion">
               <div
                  className="preview-zona-titulo"
                  style={{
                     fontFamily: estilos.tituloZona.fontFamily,
                     fontSize: estilos.tituloZona.fontSize,
                  }}
               >
                  CORRIENTE DE LÍNEA (A) (EN 13,2 KV)
               </div>
               <div className="preview-boxes" style={{ gap: estilos.box.gap }}>
                  {["R", "S", "T"].map((fase, idx) => (
                     <div
                        key={`inf-${fase}`}
                        className="preview-box"
                        style={{ width: estilos.box.width, flex: `0 0 ${estilos.box.width}` }}
                     >
                        <span
                           className="preview-box-titulo"
                           style={{
                              fontFamily: estilos.tituloBox.fontFamily,
                              fontSize: estilos.tituloBox.fontSize,
                           }}
                        >
                           {fase}
                        </span>
                        <span
                           className="preview-box-valor"
                           style={{
                              fontFamily: estilos.valorBox.fontFamily,
                              fontSize: estilos.valorBox.fontSize,
                              color: estilos.valorBox.color,
                              width: "100%",
                              height:
                                 estilos.box.height !== "auto" ? estilos.box.height : undefined,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                           }}
                        >
                           {formatearValorConDecimales(valores[idx], decimales)}
                        </span>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Botones para controlar los valores del preview */}
         <div className="preview-acciones">
            <button
               type="button"
               className="preview-btn"
               onClick={onRandomizar}
               title="Poner valores aleatorios"
            >
               🎲
            </button>
            <button
               type="button"
               className="preview-btn"
               onClick={onResetearValores}
               title="Volver a --,--"
            >
               ⟲
            </button>
         </div>
      </div>
   );
}
