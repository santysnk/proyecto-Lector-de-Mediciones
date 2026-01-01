/**
 * Datos base de relés ABB Serie 615
 *
 * Este archivo contiene la configuración predeterminada para los relés ABB.
 * El sistema es extensible: se pueden agregar nuevos modelos y configuraciones
 * sin modificar código, solo agregando datos a estas estructuras.
 *
 * Referencia: Informe_Tecnico_Completo_Reles_CELTA1.md
 *             GUIA_REGISTROS_MODBUS_ABB615.md
 */

// ============================================================================
// MODELOS DE RELÉ
// ============================================================================

export const MODELOS_RELE_BASE = {
  REF615: {
    id: "REF615",
    nombre: "REF615",
    fabricante: "ABB",
    familia: "Relion 615",
    descripcion: "Feeder Protection Relay - Protección de Alimentadores",
    configuraciones: ["FE03", "FE06"],
    icono: "⚡"
  },
  RET615: {
    id: "RET615",
    nombre: "RET615",
    fabricante: "ABB",
    familia: "Relion 615",
    descripcion: "Transformer Protection Relay - Protección de Transformadores",
    configuraciones: ["TE02"],
    icono: "🔌"
  }
};

// ============================================================================
// CONFIGURACIONES POR MODELO
// ============================================================================

export const CONFIGURACIONES_RELE_BASE = {
  // -------------------------------------------------------------------------
  // FE03 - Feeder con Autorecierre (Alimentadores sin tensión)
  // -------------------------------------------------------------------------
  FE03: {
    id: "FE03",
    nombre: "FE03",
    descripcion: "Feeder con Autorecierre",
    descripcionLarga: "Protección de alimentadores con funciones de sobrecorriente, falla a tierra y autorecierre. Sin medición de tensión.",
    modeloId: "REF615",
    capacidades: {
      medicionCorriente: true,
      medicionTension: false,
      proteccionDireccional: false,
      autorecierre: true,
      proteccionDiferencial: false
    },
    registros: {
      corrientes: {
        inicio: 138,
        cantidad: 4,
        escala: 1000,
        variables: ["IL1", "IL2", "IL3", "Io"]
      },
      tensiones: null,
      estadoCB: {
        registro: 175,
        bitCerrado: 4,
        bitAbierto: 5,
        bitError: 6
      },
      protecciones: {
        inicio: 180,
        cantidad: 10
      }
    },
    protecciones: [
      {
        codigo: "PHLPTOC1",
        nombre: "Sobrecorriente Fase Baja",
        nombreCorto: "I> Fase",
        descripcion: "Phase Low-set Time Overcurrent (51P-1)",
        ansi: "51P-1",
        iec61850: "PHLPTOC",
        registroStart: 180,
        bitStart: 0,
        registroOperate: 180,
        bitOperate: 8,
        severidad: "media",
        categoria: "sobrecorriente"
      },
      {
        codigo: "PHHPTOC1",
        nombre: "Sobrecorriente Fase Alta",
        nombreCorto: "I>> Fase",
        descripcion: "Phase High-set Time Overcurrent (51P-2)",
        ansi: "51P-2",
        iec61850: "PHHPTOC",
        registroStart: 180,
        bitStart: 10,
        registroOperate: 181,
        bitOperate: 2,
        severidad: "alta",
        categoria: "sobrecorriente"
      },
      {
        codigo: "PHIPTOC1",
        nombre: "Sobrecorriente Instantánea",
        nombreCorto: "I>>> Inst",
        descripcion: "Phase Instantaneous Overcurrent (50P)",
        ansi: "50P",
        iec61850: "PHIPTOC",
        registroStart: 181,
        bitStart: 14,
        registroOperate: 182,
        bitOperate: 6,
        severidad: "critica",
        categoria: "sobrecorriente"
      },
      {
        codigo: "EFLPTOC1",
        nombre: "Falla a Tierra Baja",
        nombreCorto: "Io> Tierra",
        descripcion: "Earth Fault Low-set Time Overcurrent (51N-1)",
        ansi: "51N-1",
        iec61850: "EFLPTOC",
        registroStart: 183,
        bitStart: 4,
        registroOperate: 183,
        bitOperate: 6,
        severidad: "media",
        categoria: "falla_tierra"
      },
      {
        codigo: "EFHPTOC1",
        nombre: "Falla a Tierra Alta",
        nombreCorto: "Io>> Tierra",
        descripcion: "Earth Fault High-set Time Overcurrent (51N-2)",
        ansi: "51N-2",
        iec61850: "EFHPTOC",
        registroStart: 183,
        bitStart: 12,
        registroOperate: 183,
        bitOperate: 14,
        severidad: "alta",
        categoria: "falla_tierra"
      },
      {
        codigo: "EFIPTOC1",
        nombre: "Falla a Tierra Instantánea",
        nombreCorto: "Io>>> Inst",
        descripcion: "Earth Fault Instantaneous Overcurrent (50N)",
        ansi: "50N",
        iec61850: "EFIPTOC",
        registroStart: 184,
        bitStart: 0,
        registroOperate: 184,
        bitOperate: 2,
        severidad: "critica",
        categoria: "falla_tierra"
      },
      {
        codigo: "NSPTOC1",
        nombre: "Secuencia Negativa",
        nombreCorto: "I2 Sec.Neg",
        descripcion: "Negative Sequence Overcurrent (46)",
        ansi: "46",
        iec61850: "NSPTOC",
        registroStart: 184,
        bitStart: 8,
        registroOperate: 184,
        bitOperate: 10,
        severidad: "media",
        categoria: "desbalance"
      },
      {
        codigo: "T1PTTR1",
        nombre: "Sobrecarga Térmica",
        nombreCorto: "Térmica",
        descripcion: "Thermal Overload Protection (49F)",
        ansi: "49F",
        iec61850: "T1PTTR",
        registroStart: 185,
        bitStart: 0,
        registroOperate: 185,
        bitOperate: 2,
        severidad: "baja",
        categoria: "termica"
      },
      {
        codigo: "CCBRBRF1",
        nombre: "Fallo de Interruptor",
        nombreCorto: "BF",
        descripcion: "Breaker Failure Protection (50BF)",
        ansi: "50BF",
        iec61850: "CCBRBRF",
        registroStart: 186,
        bitStart: 0,
        registroOperate: 186,
        bitOperate: 2,
        severidad: "critica",
        categoria: "interruptor"
      },
      {
        codigo: "DARREC1",
        nombre: "Autorecierre",
        nombreCorto: "AR",
        descripcion: "Auto-Recloser (79)",
        ansi: "79",
        iec61850: "DARREC",
        registroStart: 187,
        bitStart: 0,
        registroOperate: 187,
        bitOperate: 2,
        severidad: "info",
        categoria: "autorecierre"
      }
    ]
  },

  // -------------------------------------------------------------------------
  // FE06 - Feeder con Tensión y Direccional (Ternas)
  // -------------------------------------------------------------------------
  FE06: {
    id: "FE06",
    nombre: "FE06",
    descripcion: "Feeder con Tensión y Direccional",
    descripcionLarga: "Protección de alimentadores/líneas con medición de tensión, protecciones direccionales, medición de potencia y frecuencia.",
    modeloId: "REF615",
    capacidades: {
      medicionCorriente: true,
      medicionTension: true,
      proteccionDireccional: true,
      autorecierre: true,
      proteccionDiferencial: false,
      medicionPotencia: true,
      medicionFrecuencia: true
    },
    registros: {
      corrientes: {
        inicio: 138,
        cantidad: 4,
        escala: 1000,
        variables: ["IL1", "IL2", "IL3", "Io"]
      },
      tensiones: {
        inicio: 152,
        cantidad: 6,
        escala: 1000,
        variables: ["VA", "VB", "VC", "VAB", "VBC", "VCA"]
      },
      frecuencia: {
        registro: 168,
        escala: 100
      },
      estadoCB: {
        registro: 175,
        bitCerrado: 4,
        bitAbierto: 5,
        bitError: 6
      },
      protecciones: {
        inicio: 180,
        cantidad: 20
      }
    },
    protecciones: [
      // Todas las protecciones de FE03
      {
        codigo: "PHLPTOC1",
        nombre: "Sobrecorriente Fase Baja",
        nombreCorto: "I> Fase",
        descripcion: "Phase Low-set Time Overcurrent (51P-1)",
        ansi: "51P-1",
        iec61850: "PHLPTOC",
        registroStart: 180,
        bitStart: 0,
        registroOperate: 180,
        bitOperate: 8,
        severidad: "media",
        categoria: "sobrecorriente"
      },
      {
        codigo: "PHHPTOC1",
        nombre: "Sobrecorriente Fase Alta",
        nombreCorto: "I>> Fase",
        descripcion: "Phase High-set Time Overcurrent (51P-2)",
        ansi: "51P-2",
        iec61850: "PHHPTOC",
        registroStart: 180,
        bitStart: 10,
        registroOperate: 181,
        bitOperate: 2,
        severidad: "alta",
        categoria: "sobrecorriente"
      },
      {
        codigo: "PHIPTOC1",
        nombre: "Sobrecorriente Instantánea",
        nombreCorto: "I>>> Inst",
        descripcion: "Phase Instantaneous Overcurrent (50P)",
        ansi: "50P",
        iec61850: "PHIPTOC",
        registroStart: 181,
        bitStart: 14,
        registroOperate: 182,
        bitOperate: 6,
        severidad: "critica",
        categoria: "sobrecorriente"
      },
      // Protecciones direccionales (específicas de FE06)
      {
        codigo: "DPHLPDOC1",
        nombre: "Sobrecorriente Direccional Baja",
        nombreCorto: "67 I> Dir",
        descripcion: "Directional Phase Overcurrent Low-set (67-1)",
        ansi: "67-1",
        iec61850: "DPHLPDOC",
        registroStart: 188,
        bitStart: 0,
        registroOperate: 188,
        bitOperate: 2,
        severidad: "media",
        categoria: "direccional"
      },
      {
        codigo: "DPHHPDOC1",
        nombre: "Sobrecorriente Direccional Alta",
        nombreCorto: "67 I>> Dir",
        descripcion: "Directional Phase Overcurrent High-set (67-2)",
        ansi: "67-2",
        iec61850: "DPHHPDOC",
        registroStart: 188,
        bitStart: 8,
        registroOperate: 188,
        bitOperate: 10,
        severidad: "alta",
        categoria: "direccional"
      },
      {
        codigo: "DEFLPDEF1",
        nombre: "Falla Tierra Direccional Baja",
        nombreCorto: "67N Io> Dir",
        descripcion: "Directional Earth Fault Low-set (67N-1)",
        ansi: "67N-1",
        iec61850: "DEFLPDEF",
        registroStart: 182,
        bitStart: 8,
        registroOperate: 182,
        bitOperate: 10,
        severidad: "media",
        categoria: "direccional"
      },
      {
        codigo: "DEFHPDEF1",
        nombre: "Falla Tierra Direccional Alta",
        nombreCorto: "67N Io>> Dir",
        descripcion: "Directional Earth Fault High-set (67N-2)",
        ansi: "67N-2",
        iec61850: "DEFHPDEF",
        registroStart: 189,
        bitStart: 0,
        registroOperate: 189,
        bitOperate: 2,
        severidad: "alta",
        categoria: "direccional"
      },
      // Falla a tierra no direccional
      {
        codigo: "EFLPTOC1",
        nombre: "Falla a Tierra Baja",
        nombreCorto: "Io> Tierra",
        descripcion: "Earth Fault Low-set Time Overcurrent (51N-1)",
        ansi: "51N-1",
        iec61850: "EFLPTOC",
        registroStart: 183,
        bitStart: 4,
        registroOperate: 183,
        bitOperate: 6,
        severidad: "media",
        categoria: "falla_tierra"
      },
      {
        codigo: "EFHPTOC1",
        nombre: "Falla a Tierra Alta",
        nombreCorto: "Io>> Tierra",
        descripcion: "Earth Fault High-set Time Overcurrent (51N-2)",
        ansi: "51N-2",
        iec61850: "EFHPTOC",
        registroStart: 183,
        bitStart: 12,
        registroOperate: 183,
        bitOperate: 14,
        severidad: "alta",
        categoria: "falla_tierra"
      },
      // Protecciones de tensión (específicas de FE06)
      {
        codigo: "PHPTUV1",
        nombre: "Subtensión Trifásica",
        nombreCorto: "27 U<",
        descripcion: "Three-phase Undervoltage (27)",
        ansi: "27",
        iec61850: "PHPTUV",
        registroStart: 193,
        bitStart: 0,
        registroOperate: 193,
        bitOperate: 2,
        severidad: "media",
        categoria: "tension"
      },
      {
        codigo: "PHPTOV1",
        nombre: "Sobretensión Trifásica",
        nombreCorto: "59 U>",
        descripcion: "Three-phase Overvoltage (59)",
        ansi: "59",
        iec61850: "PHPTOV",
        registroStart: 194,
        bitStart: 0,
        registroOperate: 194,
        bitOperate: 2,
        severidad: "media",
        categoria: "tension"
      },
      {
        codigo: "ROVPTOV1",
        nombre: "Sobretensión Residual",
        nombreCorto: "59G Uo>",
        descripcion: "Residual Overvoltage (59G)",
        ansi: "59G",
        iec61850: "ROVPTOV",
        registroStart: 195,
        bitStart: 0,
        registroOperate: 195,
        bitOperate: 2,
        severidad: "media",
        categoria: "tension"
      },
      // Otras protecciones
      {
        codigo: "NSPTOC1",
        nombre: "Secuencia Negativa",
        nombreCorto: "I2 Sec.Neg",
        descripcion: "Negative Sequence Overcurrent (46)",
        ansi: "46",
        iec61850: "NSPTOC",
        registroStart: 184,
        bitStart: 8,
        registroOperate: 184,
        bitOperate: 10,
        severidad: "media",
        categoria: "desbalance"
      },
      {
        codigo: "T1PTTR1",
        nombre: "Sobrecarga Térmica",
        nombreCorto: "Térmica",
        descripcion: "Thermal Overload Protection (49F)",
        ansi: "49F",
        iec61850: "T1PTTR",
        registroStart: 185,
        bitStart: 0,
        registroOperate: 185,
        bitOperate: 2,
        severidad: "baja",
        categoria: "termica"
      },
      {
        codigo: "CCBRBRF1",
        nombre: "Fallo de Interruptor",
        nombreCorto: "BF",
        descripcion: "Breaker Failure Protection (50BF)",
        ansi: "50BF",
        iec61850: "CCBRBRF",
        registroStart: 186,
        bitStart: 0,
        registroOperate: 186,
        bitOperate: 2,
        severidad: "critica",
        categoria: "interruptor"
      },
      {
        codigo: "SSCBR1",
        nombre: "Monitoreo de Interruptor",
        nombreCorto: "CBCM",
        descripcion: "Circuit Breaker Condition Monitoring",
        ansi: "CBCM",
        iec61850: "SSCBR",
        registroStart: 196,
        bitStart: 0,
        registroOperate: 196,
        bitOperate: 2,
        severidad: "info",
        categoria: "interruptor"
      }
    ]
  },

  // -------------------------------------------------------------------------
  // TE02 - Transformer Differential Protection
  // -------------------------------------------------------------------------
  TE02: {
    id: "TE02",
    nombre: "TE02",
    descripcion: "Protección Diferencial de Transformador",
    descripcionLarga: "Protección de transformadores de potencia con diferencial estabilizada, REF de baja impedancia, protección térmica y respaldos de sobrecorriente.",
    modeloId: "RET615",
    capacidades: {
      medicionCorriente: true,
      medicionTension: false,
      proteccionDireccional: false,
      autorecierre: false,
      proteccionDiferencial: true,
      ladosTransformador: 2
    },
    registros: {
      corrientes: {
        inicio: 138,
        cantidad: 7, // 4 lado AT + 3 lado BT
        escala: 1000,
        variables: ["IL1_AT", "IL2_AT", "IL3_AT", "Io_AT", "IL1_BT", "IL2_BT", "IL3_BT"]
      },
      tensiones: null,
      estadoCB: {
        registro: 175,
        bitCerrado: 4,
        bitAbierto: 5,
        bitError: 6
      },
      protecciones: {
        inicio: 180,
        cantidad: 10
      }
    },
    protecciones: [
      {
        codigo: "TR2PTDF1",
        nombre: "Diferencial Estabilizada",
        nombreCorto: "87T Dif",
        descripcion: "Transformer Differential Protection (87T)",
        ansi: "87T",
        iec61850: "TR2PTDF",
        registroStart: 180,
        bitStart: 0,
        registroOperate: 180,
        bitOperate: 2,
        severidad: "critica",
        categoria: "diferencial"
      },
      {
        codigo: "TR2PTDF_INST",
        nombre: "Diferencial Instantánea",
        nombreCorto: "87T Inst",
        descripcion: "Transformer Differential Instantaneous",
        ansi: "87T",
        iec61850: "TR2PTDF",
        registroStart: 180,
        bitStart: 4,
        registroOperate: 180,
        bitOperate: 6,
        severidad: "critica",
        categoria: "diferencial"
      },
      {
        codigo: "LREFPNDF1",
        nombre: "Falla Tierra Restringida",
        nombreCorto: "87N REF",
        descripcion: "Low Impedance Restricted Earth Fault (87N)",
        ansi: "87N",
        iec61850: "LREFPNDF",
        registroStart: 181,
        bitStart: 0,
        registroOperate: 181,
        bitOperate: 2,
        severidad: "critica",
        categoria: "diferencial"
      },
      {
        codigo: "PHLPTOC1_AT",
        nombre: "Sobrecorriente AT",
        nombreCorto: "51 AT",
        descripcion: "Phase Overcurrent High Voltage Side (51P AT)",
        ansi: "51P",
        iec61850: "PHLPTOC",
        registroStart: 182,
        bitStart: 0,
        registroOperate: 182,
        bitOperate: 2,
        severidad: "alta",
        categoria: "sobrecorriente"
      },
      {
        codigo: "PHLPTOC1_BT",
        nombre: "Sobrecorriente BT",
        nombreCorto: "51 BT",
        descripcion: "Phase Overcurrent Low Voltage Side (51P BT)",
        ansi: "51P",
        iec61850: "PHLPTOC",
        registroStart: 182,
        bitStart: 8,
        registroOperate: 182,
        bitOperate: 10,
        severidad: "alta",
        categoria: "sobrecorriente"
      },
      {
        codigo: "EFLPTOC1_AT",
        nombre: "Falla Tierra AT",
        nombreCorto: "51N AT",
        descripcion: "Earth Fault High Voltage Side (51N AT)",
        ansi: "51N",
        iec61850: "EFLPTOC",
        registroStart: 183,
        bitStart: 0,
        registroOperate: 183,
        bitOperate: 2,
        severidad: "alta",
        categoria: "falla_tierra"
      },
      {
        codigo: "EFLPTOC1_BT",
        nombre: "Falla Tierra BT",
        nombreCorto: "51N BT",
        descripcion: "Earth Fault Low Voltage Side (51N BT)",
        ansi: "51N",
        iec61850: "EFLPTOC",
        registroStart: 183,
        bitStart: 8,
        registroOperate: 183,
        bitOperate: 10,
        severidad: "alta",
        categoria: "falla_tierra"
      },
      {
        codigo: "T2PTTR1",
        nombre: "Térmica Transformador",
        nombreCorto: "49T",
        descripcion: "Transformer Thermal Overload (49T)",
        ansi: "49T",
        iec61850: "T2PTTR",
        registroStart: 184,
        bitStart: 0,
        registroOperate: 184,
        bitOperate: 2,
        severidad: "media",
        categoria: "termica"
      },
      {
        codigo: "NSPTOC1",
        nombre: "Secuencia Negativa",
        nombreCorto: "46",
        descripcion: "Negative Sequence Overcurrent (46)",
        ansi: "46",
        iec61850: "NSPTOC",
        registroStart: 184,
        bitStart: 8,
        registroOperate: 184,
        bitOperate: 10,
        severidad: "media",
        categoria: "desbalance"
      },
      {
        codigo: "CCBRBRF1",
        nombre: "Fallo de Interruptor",
        nombreCorto: "50BF",
        descripcion: "Breaker Failure Protection (50BF)",
        ansi: "50BF",
        iec61850: "CCBRBRF",
        registroStart: 185,
        bitStart: 0,
        registroOperate: 185,
        bitOperate: 2,
        severidad: "critica",
        categoria: "interruptor"
      }
    ]
  }
};

// ============================================================================
// CATEGORÍAS DE PROTECCIÓN (para agrupar en UI)
// ============================================================================

export const CATEGORIAS_PROTECCION = {
  sobrecorriente: {
    id: "sobrecorriente",
    nombre: "Sobrecorriente de Fase",
    icono: "⚡",
    color: "#f59e0b"
  },
  falla_tierra: {
    id: "falla_tierra",
    nombre: "Falla a Tierra",
    icono: "🌍",
    color: "#10b981"
  },
  direccional: {
    id: "direccional",
    nombre: "Direccional",
    icono: "➡️",
    color: "#6366f1"
  },
  diferencial: {
    id: "diferencial",
    nombre: "Diferencial",
    icono: "🔄",
    color: "#ef4444"
  },
  tension: {
    id: "tension",
    nombre: "Tensión",
    icono: "🔌",
    color: "#8b5cf6"
  },
  termica: {
    id: "termica",
    nombre: "Térmica",
    icono: "🌡️",
    color: "#f97316"
  },
  desbalance: {
    id: "desbalance",
    nombre: "Desbalance/Secuencia",
    icono: "⚖️",
    color: "#06b6d4"
  },
  interruptor: {
    id: "interruptor",
    nombre: "Interruptor",
    icono: "🔲",
    color: "#64748b"
  },
  autorecierre: {
    id: "autorecierre",
    nombre: "Autorecierre",
    icono: "🔁",
    color: "#22c55e"
  }
};

// ============================================================================
// SEVERIDADES (para colores de alerta)
// ============================================================================

export const SEVERIDADES = {
  critica: {
    id: "critica",
    nombre: "Crítica",
    color: "#ef4444",
    colorBg: "#fef2f2",
    prioridad: 1
  },
  alta: {
    id: "alta",
    nombre: "Alta",
    color: "#f97316",
    colorBg: "#fff7ed",
    prioridad: 2
  },
  media: {
    id: "media",
    nombre: "Media",
    color: "#f59e0b",
    colorBg: "#fffbeb",
    prioridad: 3
  },
  baja: {
    id: "baja",
    nombre: "Baja",
    color: "#22c55e",
    colorBg: "#f0fdf4",
    prioridad: 4
  },
  info: {
    id: "info",
    nombre: "Información",
    color: "#6366f1",
    colorBg: "#eef2ff",
    prioridad: 5
  }
};

// ============================================================================
// CONFIGURACIÓN DE CONEXIÓN POR DEFECTO
// ============================================================================

export const CONEXION_MODBUS_DEFAULT = {
  puerto: 502,
  unitId: 1,
  timeout: 3000,
  reintentos: 3
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene las configuraciones disponibles para un modelo de relé
 */
export const getConfiguracionesPorModelo = (modeloId) => {
  const modelo = MODELOS_RELE_BASE[modeloId];
  if (!modelo) return [];

  return modelo.configuraciones.map(configId => CONFIGURACIONES_RELE_BASE[configId]);
};

/**
 * Obtiene las protecciones de una configuración
 */
export const getProteccionesPorConfiguracion = (configuracionId) => {
  const config = CONFIGURACIONES_RELE_BASE[configuracionId];
  if (!config) return [];

  return config.protecciones;
};

/**
 * Obtiene las protecciones agrupadas por categoría
 */
export const getProteccionesAgrupadasPorCategoria = (configuracionId) => {
  const protecciones = getProteccionesPorConfiguracion(configuracionId);

  return protecciones.reduce((acc, prot) => {
    const categoria = prot.categoria || "otros";
    if (!acc[categoria]) {
      acc[categoria] = {
        ...CATEGORIAS_PROTECCION[categoria],
        protecciones: []
      };
    }
    acc[categoria].protecciones.push(prot);
    return acc;
  }, {});
};

/**
 * Obtiene una protección por su código
 */
export const getProteccionPorCodigo = (configuracionId, codigoProteccion) => {
  const protecciones = getProteccionesPorConfiguracion(configuracionId);
  return protecciones.find(p => p.codigo === codigoProteccion);
};

/**
 * Verifica si una configuración tiene capacidad específica
 */
export const tieneCapacidad = (configuracionId, capacidad) => {
  const config = CONFIGURACIONES_RELE_BASE[configuracionId];
  if (!config) return false;

  return config.capacidades[capacidad] === true;
};

/**
 * Obtiene todos los modelos como array para selects
 */
export const getModelosArray = () => {
  return Object.values(MODELOS_RELE_BASE);
};

/**
 * Obtiene todas las configuraciones como array para selects
 */
export const getConfiguracionesArray = () => {
  return Object.values(CONFIGURACIONES_RELE_BASE);
};
