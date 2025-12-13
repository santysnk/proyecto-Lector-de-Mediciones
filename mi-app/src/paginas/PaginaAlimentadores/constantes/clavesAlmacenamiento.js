// src/paginas/PaginaAlimentadores/constantes/clavesAlmacenamiento.js

/**
 * Claves para guardar datos en localStorage
 * Centralizadas acá para evitar typos y mantener consistencia.
 */
export const CLAVES_STORAGE = {
	PUESTOS: "rw-puestos",                    // lista completa de puestos configurados
	PUESTO_SELECCIONADO: "rw-puesto-seleccionado", // id del puesto que quedó seleccionado
	CONFIGURACION_SELECCIONADA: "rw-configuracion-seleccionada", // id del workspace activo
	USUARIOS_RECORDADOS: "usuariosRecordados",     // lista de usuarios recordados (login)
	GAP_TARJETAS: "rw-gap-tarjetas",          // espaciado horizontal entre tarjetas (en px)
	GAP_FILAS: "rw-gap-filas",                // espaciado vertical entre filas (en px)
};

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (clavesAlmacenamiento.js)

 - Acá defino todas las claves de `localStorage` que usa la pantalla de
   alimentadores (y algunas compartidas, como `USUARIOS_RECORDADOS`).

 - La idea es nunca escribir las strings a mano en el resto del código,
   sino importar `CLAVES_STORAGE` y usar `CLAVES_STORAGE.PUESTOS`, etc., para
   evitar errores de tipeo y poder cambiar el prefijo fácilmente si hace falta.
---------------------------------------------------------------------------*/}

