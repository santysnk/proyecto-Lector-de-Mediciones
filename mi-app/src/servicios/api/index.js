// servicios/api/index.js
// Exportaciones centralizadas de todas las APIs

// Base
export { API_URL, obtenerToken, fetchConAuth } from './base';

// Usuarios
export {
   obtenerPerfil,
   crearPerfilUsuario,
   actualizarWorkspaceDefault,
} from './usuarios';

// Workspaces
export {
   obtenerWorkspaces,
   crearWorkspace,
   actualizarWorkspace,
   eliminarWorkspace,
} from './workspaces';

// Puestos
export {
   obtenerPuestos,
   crearPuesto,
   actualizarPuesto,
   eliminarPuesto,
   reordenarPuestos,
} from './puestos';

// Alimentadores
export {
   obtenerAlimentadores,
   crearAlimentador,
   actualizarAlimentadorAPI,
   eliminarAlimentadorAPI,
   reordenarAlimentadores,
   moverAlimentador,
} from './alimentadores';

// Lecturas
export {
   obtenerUltimasLecturas,
   obtenerLecturasHistoricas,
   obtenerUltimasLecturasPorRegistrador,
   obtenerLecturasHistoricasPorRegistrador,
} from './lecturas';

// Preferencias
export {
   obtenerPreferencias,
   guardarPreferencias,
} from './preferencias';

// Agentes
export {
   // Legacy
   obtenerEstadoAgente,
   solicitarVinculacionAgente,
   desvincularAgente,
   rotarClaveAgente,
   // Nueva arquitectura
   listarTodosLosAgentes,
   crearAgente,
   actualizarAgente,
   eliminarAgente,
   rotarClaveAgentePorId,
   listarAgentesDisponibles,
   listarAgentesWorkspace,
   vincularAgenteWorkspace,
   desvincularAgenteWorkspace,
} from './agentes';

// Registradores
export {
   listarRegistradoresAgente,
   crearRegistradorAgente,
   actualizarRegistradorAgente,
   eliminarRegistradorAgente,
   toggleRegistradorAgente,
   solicitarTestRegistrador,
   consultarTestRegistrador,
   solicitarTestCoils,
   testConexionModbus,
} from './registradores';

// Permisos
export {
   obtenerPermisosWorkspace,
   agregarPermisoWorkspace,
   actualizarPermisoWorkspace,
   eliminarPermisoWorkspace,
} from './permisos';

// Admin (superadmin)
export {
   listarUsuariosAdmin,
   cambiarRolUsuarioAdmin,
   actualizarAgentesUsuarioAdmin,
   listarAgentesParaPermisos,
   obtenerDetallesUsuarioAdmin,
} from './admin';

// Dispositivos
export {
   registrarTokenDispositivo,
   desregistrarTokenDispositivo,
} from './dispositivos';

// Default export para compatibilidad con: import apiService from '...'
import * as usuarios from './usuarios';
import * as workspaces from './workspaces';
import * as puestos from './puestos';
import * as alimentadores from './alimentadores';
import * as lecturas from './lecturas';
import * as preferencias from './preferencias';
import * as agentes from './agentes';
import * as registradores from './registradores';
import * as permisos from './permisos';
import * as admin from './admin';
import * as dispositivos from './dispositivos';

export default {
   ...usuarios,
   ...workspaces,
   ...puestos,
   ...alimentadores,
   ...lecturas,
   ...preferencias,
   ...agentes,
   ...registradores,
   ...permisos,
   ...admin,
   ...dispositivos,
};
