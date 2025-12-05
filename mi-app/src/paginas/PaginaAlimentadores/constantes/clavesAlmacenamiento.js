/**
 * ==============================================================================
 * CONSTANTE: clavesAlmacenamiento.js
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Define los nombres "clave" que usamos para guardar datos en el navegador.
 * 
 * ¿POR QUÉ ES ÚTIL?
 * Si escribimos "rw-puestos" en 10 archivos distintos, es fácil equivocarse
 * y escribir "rw-puesto" en uno, lo que causaría errores difíciles de encontrar.
 * Al usar estas constantes, si nos equivocamos el editor nos avisa.
 */

export const CLAVES_STORAGE = {
	PUESTOS: 'rw-puestos', 					// Lista de todos los puestos y alimentadores
	PUESTO_SELECCIONADO: 'rw-puesto-seleccionado', // ID del puesto que se está viendo ahora
	USUARIOS_RECORDADOS: 'usuariosRecordados', 	// (Si hubiera login) Lista de usuarios
};
