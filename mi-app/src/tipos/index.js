// src/tipos/index.js
// Definiciones de tipos centralizadas para el proyecto RelayWatch

/**
 * @typedef {Object} Alimentador
 * @property {string} id - UUID del alimentador
 * @property {string} nombre - Nombre descriptivo
 * @property {string} ip - Dirección IP del dispositivo
 * @property {number} puerto - Puerto Modbus (default 502)
 * @property {string} [color] - Color de la tarjeta
 * @property {Object} [card_design] - Diseño personalizado de la tarjeta
 * @property {number} orden - Orden de visualización
 * @property {string} puesto_id - ID del puesto al que pertenece
 */

/**
 * @typedef {Object} Puesto
 * @property {string} id - UUID del puesto
 * @property {string} nombre - Nombre del puesto
 * @property {string} color - Color del header
 * @property {string} [bgColor] - Color de fondo
 * @property {number} orden - Orden de visualización
 * @property {Alimentador[]} alimentadores - Lista de alimentadores
 */

/**
 * @typedef {Object} Workspace
 * @property {string} id - UUID del workspace
 * @property {string} nombre - Nombre del workspace
 * @property {string} [descripcion] - Descripción opcional
 * @property {string} creador_id - ID del usuario creador
 */

/**
 * @typedef {Object} LecturaModbus
 * @property {string} registrador_id - ID del registrador
 * @property {number[]} valores - Array de valores leídos
 * @property {string} timestamp - Fecha/hora de la lectura ISO
 * @property {number} indice_inicial - Registro inicial
 */

/**
 * @typedef {Object} ConfiguracionRele
 * @property {string} modeloId - ID del modelo (REF615, RET615)
 * @property {string} configuracionId - ID de la configuración
 * @property {number} ratioTI - Ratio del transformador de corriente
 * @property {number} [ratioTV] - Ratio del transformador de tensión
 */

/**
 * @typedef {Object} Registrador
 * @property {string} id - UUID del registrador
 * @property {string} nombre - Nombre descriptivo
 * @property {string} ip - Dirección IP
 * @property {number} puerto - Puerto Modbus
 * @property {number} unit_id - Unit ID Modbus
 * @property {number} indice_inicial - Registro inicial a leer
 * @property {number} cantidad_registros - Cantidad de registros a leer
 * @property {boolean} activo - Si está activo para polling
 */

/**
 * @typedef {Object} Agente
 * @property {string} id - UUID del agente
 * @property {string} nombre - Nombre del agente
 * @property {string} estado - Estado actual (conectado, desconectado)
 * @property {string} [ultimo_heartbeat] - Timestamp del último heartbeat
 * @property {Registrador[]} registradores - Lista de registradores
 */

/**
 * @typedef {Object} PreferenciasVisuales
 * @property {number} escala - Escala global de tarjetas
 * @property {number} gap - Gap horizontal entre tarjetas
 * @property {number} rowGap - Gap vertical entre filas
 * @property {Object.<string, number>} escalasPorPuesto - Escalas por puesto
 * @property {Object.<string, number>} gapsPorPuesto - Gaps por puesto
 */

/**
 * @typedef {Object} Usuario
 * @property {string} id - UUID del usuario
 * @property {string} email - Email del usuario
 * @property {string} [nombre] - Nombre opcional
 * @property {string} rol - Rol (usuario, admin, superadmin)
 * @property {string} [workspace_default] - Workspace por defecto
 */

export {};
