// componentes/layout/EstadoCarga.jsx
// Estados de carga y error para la vista principal

/**
 * Muestra estado de carga o error
 * @param {Object} props
 * @param {string|null} props.error - Mensaje de error (si hay)
 */
const EstadoCarga = ({ error = null }) => {
   if (error) {
      return (
         <div className="alim-page alim-page--error">
            <div className="alim-error">
               <p>Error: {error}</p>
               <button onClick={() => window.location.reload()}>Reintentar</button>
            </div>
         </div>
      );
   }

   return (
      <div className="alim-page alim-page--cargando">
         <div className="alim-loading">
            <div className="alim-loading__spinner"></div>
            <p>Cargando configuración...</p>
         </div>
      </div>
   );
};

export default EstadoCarga;
