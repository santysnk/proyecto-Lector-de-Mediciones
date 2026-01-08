// componentes/ListaUsuarios.jsx
// Lista de usuarios con búsqueda y filtrado

/**
 * Lista de usuarios del panel de permisos
 * @param {Object} props
 * @param {Array} props.usuarios - Lista de usuarios
 * @param {Array} props.usuariosFiltrados - Lista filtrada
 * @param {boolean} props.cargando - Si está cargando
 * @param {string} props.error - Error si existe
 * @param {string} props.busqueda - Término de búsqueda
 * @param {string} props.filtroRol - Filtro de rol activo
 * @param {Object} props.usuarioSeleccionado - Usuario seleccionado
 * @param {Function} props.onBusquedaChange - Handler para cambio de búsqueda
 * @param {Function} props.onFiltroRolChange - Handler para cambio de filtro
 * @param {Function} props.onSeleccionarUsuario - Handler para seleccionar usuario
 * @param {Function} props.onRecargar - Handler para recargar datos
 */
const ListaUsuarios = ({
   usuarios,
   usuariosFiltrados,
   cargando,
   error,
   busqueda,
   filtroRol,
   usuarioSeleccionado,
   onBusquedaChange,
   onFiltroRolChange,
   onSeleccionarUsuario,
   onRecargar,
}) => {
   return (
      <div className="permisos-master">
         {/* Búsqueda y filtros */}
         <div className="permisos-master-toolbar">
            <input
               type="text"
               placeholder="Buscar usuario..."
               value={busqueda}
               onChange={(e) => onBusquedaChange(e.target.value)}
               className="permisos-input-busqueda"
            />
            <select
               value={filtroRol}
               onChange={(e) => onFiltroRolChange(e.target.value)}
               className="permisos-select-filtro"
            >
               <option value="todos">Todos</option>
               <option value="admin">Admin</option>
               <option value="operador">Operador</option>
               <option value="observador">Observador</option>
            </select>
         </div>

         {/* Lista de usuarios */}
         <div className="permisos-usuarios-lista">
            {cargando ? (
               <div className="permisos-estado">
                  <div className="permisos-spinner"></div>
                  <span>Cargando...</span>
               </div>
            ) : error ? (
               <div className="permisos-estado permisos-estado--error">
                  <span>{error}</span>
                  <button onClick={onRecargar}>Reintentar</button>
               </div>
            ) : usuariosFiltrados.length === 0 ? (
               <div className="permisos-estado">
                  <span>No hay usuarios</span>
               </div>
            ) : (
               usuariosFiltrados.map((usuario) => (
                  <div
                     key={usuario.id}
                     className={`permisos-usuario-item ${
                        usuarioSeleccionado?.id === usuario.id
                           ? "permisos-usuario-item--activo"
                           : ""
                     }`}
                     onClick={() => onSeleccionarUsuario(usuario)}
                  >
                     <div className="permisos-usuario-info">
                        <span className="permisos-usuario-nombre">
                           {usuario.nombre || "Sin nombre"}
                        </span>
                        <span className="permisos-usuario-email">{usuario.email}</span>
                     </div>
                     <span
                        className={`permisos-badge-small permisos-badge-small--${usuario.rolGlobal}`}
                     >
                        {usuario.rolGlobal?.substring(0, 3).toUpperCase()}
                     </span>
                  </div>
               ))
            )}
         </div>

         {/* Contador */}
         <div className="permisos-master-footer">
            {usuariosFiltrados.length} de {usuarios.length} usuarios
         </div>
      </div>
   );
};

export default ListaUsuarios;
