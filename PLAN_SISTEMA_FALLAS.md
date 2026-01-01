# Plan de Implementación: Sistema de Detección de Fallas ABB 615 Series

> **Fecha de creación**: 2025-12-28
> **Última actualización**: 2025-12-29
> **Estado**: Planificación revisada
> **Rama de trabajo**: dev

---

## Resumen Ejecutivo

Implementar un sistema **extensible y dinámico** de detección, registro y notificación de fallas/disparos en relés de protección ABB Serie 615 (REF615, RET615) mediante protocolo Modbus TCP.

### Principio de Diseño: Configuración sobre Código

El sistema debe permitir agregar nuevos modelos de relés y configuraciones **sin modificar código**, mediante:
- Gestión de modelos de relé (REF615, RET615, REX615 futuro, etc.)
- Gestión de configuraciones por modelo (FE03, FE06, TE02, etc.)
- Mapeo dinámico de protecciones y registros Modbus

---

## Contexto Técnico: Subestación CELTA 1

### Inventario de Equipos

| # | Ubicación | Modelo | Config | IP | Características |
|---|-----------|--------|--------|-----|-----------------|
| 1 | ALIMENTADOR 1 | REF615 | FE03 | 172.16.0.1 | Solo corriente, autorecierre |
| 2 | ALIMENTADOR 2 | REF615 | FE03 | 172.16.0.2 | Solo corriente, autorecierre |
| 3 | ALIMENTADOR 3 | REF615 | FE03 | 172.16.0.3 | Solo corriente, autorecierre |
| 4 | ALIMENTADOR 4 | REF615 | FE03 | 172.16.0.4 | Solo corriente, autorecierre |
| 5 | ALIMENTADOR 8 | REF615 | FE03 | 172.16.0.8 | Solo corriente, autorecierre |
| 6 | TRAFO 1 (Dif) | RET615 | TE02 | 172.16.0.5 | Protección diferencial |
| 7 | TRAFO 1 (Salida) | REF615 | FE03 | 172.16.0.6 | Solo corriente |
| 8 | TRAFO 2 (Dif) | RET615 | TE02 | 172.16.0.7 | Protección diferencial |
| 9 | TRAFO 2 (Salida) | REF615 | FE03 | 172.16.0.9 | Solo corriente |
| 10 | TRAFO 3 | RET615 | TE02 | 172.16.0.10 | Diferencial (HW Rev C 2009) |
| 11 | TERNA 3 | REF615 | FE06 | 172.16.0.11 | **Con tensión**, direccional |
| 12 | TERNA 4 | REF615 | FE06 | 172.16.0.12 | **Con tensión**, direccional |

### Configuraciones de Software

| Config | Modelo | Descripción | Capacidades |
|--------|--------|-------------|-------------|
| **FE03** | REF615 | Feeder con Autorecierre | Corriente, Autorecierre, NO tensión |
| **FE06** | REF615 | Feeder con Tensión/Direccional | Corriente, Tensión, Direccional, Potencia |
| **TE02** | RET615 | Transformer Differential | Diferencial 87T, REF, Térmica |

---

## Registros Modbus Exactos

### Mediciones de Corriente (Todos los relés)

| Registro | Variable | Escala | Descripción |
|----------|----------|--------|-------------|
| **138** | IL1 | ÷1000 × In | Corriente Fase A |
| **139** | IL2 | ÷1000 × In | Corriente Fase B |
| **140** | IL3 | ÷1000 × In | Corriente Fase C |
| **141** | Io | ÷1000 × In | Corriente Residual |

### Mediciones de Tensión (Solo FE06 - Ternas)

| Registro | Variable | Escala | Descripción |
|----------|----------|--------|-------------|
| **152** | VA | ÷1000 × Un | Tensión Fase A-Tierra |
| **153** | VB | ÷1000 × Un | Tensión Fase B-Tierra |
| **154** | VC | ÷1000 × Un | Tensión Fase C-Tierra |
| **155** | VAB | ÷1000 × Un | Tensión Línea A-B |
| **156** | VBC | ÷1000 × Un | Tensión Línea B-C |
| **157** | VCA | ÷1000 × Un | Tensión Línea C-A |

### Estado del Interruptor

| Registro | Bit | Significado |
|----------|-----|-------------|
| **175** | Bit 4 | Cerrado (1 = Cerrado) |
| **175** | Bit 5 | Abierto (1 = Abierto) |
| **175** | Bit 6 | Error/Intermedio |

### Estados de Protección (Fallas)

| Registro | Bit | Protección | Tipo |
|----------|-----|------------|------|
| **180** | 0 | PHLPTOC1 (Sobrecorriente baja) | Start |
| **180** | 8 | PHLPTOC1 | Operate |
| **180** | 10 | PHHPTOC1 (Sobrecorriente alta) | Start |
| **181** | 2 | PHHPTOC1 | Operate |
| **181** | 14 | PHIPTOC1 (Instantánea) | Start |
| **182** | 6 | PHIPTOC1 | Operate |
| **182** | 8 | DEFLPDEF1 (Falla tierra dir.) | Start |
| **182** | 10 | DEFLPDEF1 | Operate |
| **183** | 4 | EFLPTOC1 (Falla tierra baja) | Start |
| **183** | 6 | EFLPTOC1 | Operate |
| **183** | 12 | EFHPTOC1 (Falla tierra alta) | Start |
| **183** | 14 | EFHPTOC1 | Operate |

### Nota: Direccionamiento Base 0 vs Base 1

- **Documentación ABB**: Base 1 (registro 138 = registro 138)
- **modbus-serial**: Base 0 (registro 138 = leer dirección 137)
- **Siempre restar 1** al usar la librería

---

## Arquitectura del Sistema Extensible

### Modelo de Datos Dinámico

```
┌─────────────────────────────────────────────────────────────────┐
│                    JERARQUÍA DE CONFIGURACIÓN                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │ MODELOS DE RELÉ  │  (Nivel más alto - definido por admin)    │
│  │ ────────────────  │                                           │
│  │ • REF615         │                                           │
│  │ • RET615         │                                           │
│  │ • REX615 (fut.)  │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ CONFIGURACIONES  │  (Por modelo - define capacidades)        │
│  │ ────────────────  │                                           │
│  │ REF615:          │                                           │
│  │  • FE03          │ ─► Solo corriente, autorecierre           │
│  │  • FE06          │ ─► Corriente + tensión + direccional      │
│  │ RET615:          │                                           │
│  │  • TE02          │ ─► Diferencial + respaldo                 │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  PROTECCIONES    │  (Por configuración - bits específicos)   │
│  │ ────────────────  │                                           │
│  │ FE03:            │                                           │
│  │  • PHLPTOC1      │ ─► Reg 180, Start bit 0, Operate bit 8    │
│  │  • PHHPTOC1      │ ─► Reg 180/181, bits específicos          │
│  │  • EFHPTOC1      │ ─► Reg 183, Start bit 12, Operate bit 14  │
│  │  • ...           │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │   ALIMENTADOR    │  (Instancia específica)                   │
│  │ ────────────────  │                                           │
│  │ • Modelo: REF615 │                                           │
│  │ • Config: FE03   │                                           │
│  │ • IP: 172.16.0.1 │                                           │
│  │ • CT: 600/1A     │                                           │
│  │ • Protecciones   │                                           │
│  │   monitoreadas:  │                                           │
│  │   [PHLPTOC1 ✓]   │                                           │
│  │   [PHHPTOC1 ✓]   │                                           │
│  │   [EFHPTOC1 ✓]   │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO DE DETECCIÓN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RELÉ ABB          AGENTE              BACKEND         FRONTEND │
│  (Modbus)          (Electron)          (Node)          (React)  │
│                                                                  │
│  ┌─────────┐      ┌──────────┐       ┌─────────┐     ┌─────────┐│
│  │Registros│      │ Obtener  │       │         │     │         ││
│  │180-183  │─────►│ config   │       │         │     │ Config  ││
│  │         │      │ del relé │       │         │     │ Modelos ││
│  └─────────┘      │ (modelo, │       │         │     │ y Prots ││
│                   │ config)  │       │         │     │         ││
│                   └────┬─────┘       │         │     └─────────┘│
│                        │             │         │                 │
│                        ▼             │         │                 │
│                   ┌──────────┐       │         │                 │
│                   │ Leer     │       │         │                 │
│                   │ registros│       │         │                 │
│                   │ según    │       │         │                 │
│                   │ config   │       │         │                 │
│                   └────┬─────┘       │         │                 │
│                        │             │         │                 │
│                        ▼             │         │                 │
│                   ┌──────────┐       │         │                 │
│                   │ Extraer  │       │         │                 │
│                   │ bits de  │       │         │                 │
│                   │ protec-  │       │         │                 │
│                   │ ciones   │       │         │                 │
│                   └────┬─────┘       │         │                 │
│                        │             │         │                 │
│                        ▼             │         │                 │
│                   ┌──────────┐  POST ┌─────────┐     ┌─────────┐│
│                   │ Detectar │──────►│ Guardar │────►│ Alertas ││
│                   │ cambios  │       │ evento  │     │ en UI   ││
│                   │ (START/  │       │         │     │         ││
│                   │  OPERATE)│       │ Enviar  │     │ Push    ││
│                   └──────────┘       │ notif   │────►│ Android ││
│                                      └─────────┘     └─────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fases de Implementación

### FASE 0: Diseño de UI (Actual)

**Objetivo**: Definir la interfaz de usuario para gestión de modelos, configuraciones y asignación a alimentadores.

#### 0.1 UI - Gestión de Modelos de Relé

Panel para agregar/editar modelos de relé:
- Nombre del modelo (REF615, RET615, etc.)
- Fabricante
- Familia
- Lista de configuraciones disponibles

#### 0.2 UI - Gestión de Configuraciones

Panel para definir cada configuración:
- Nombre (FE03, FE06, TE02)
- Descripción
- Capacidades (checkboxes): Corriente, Tensión, Direccional, Autorecierre
- Registros Modbus: Inicio corrientes, inicio tensiones, estado CB, protecciones
- Lista de protecciones con sus bits específicos

#### 0.3 UI - Configuración del Alimentador

Formulario cuando se selecciona "Relé de Protección":
- Selector de modelo (de los definidos)
- Selector de configuración (según modelo)
- Parámetros de conexión: IP, Puerto, Unit ID, Timeout
- Parámetros de escala: CT primario, CT secundario (1A/5A), VT primario (si aplica)
- Checkboxes de protecciones a monitorear (según configuración)
- Opciones de notificación por protección

**Entregables Fase 0:**
- [ ] Mockups de UI aprobados
- [ ] Estructura de datos JSON definida
- [ ] Plan actualizado (este documento)

---

### FASE 1: Base de Datos

**Objetivo**: Crear el esquema extensible en Supabase/localStorage.

#### 1.1 Tabla/JSON `modelos_rele`

```javascript
{
  "REF615": {
    id: "ref615",
    nombre: "REF615",
    fabricante: "ABB",
    familia: "Relion 615",
    descripcion: "Feeder Protection Relay",
    configuraciones: ["FE03", "FE06"]
  },
  "RET615": {
    id: "ret615",
    nombre: "RET615",
    fabricante: "ABB",
    familia: "Relion 615",
    descripcion: "Transformer Protection Relay",
    configuraciones: ["TE02"]
  }
}
```

#### 1.2 Tabla/JSON `configuraciones_rele`

```javascript
{
  "FE03": {
    id: "fe03",
    nombre: "FE03",
    descripcion: "Feeder con Autorecierre",
    modeloId: "ref615",
    capacidades: {
      medicionCorriente: true,
      medicionTension: false,
      proteccionDireccional: false,
      autorecierre: true
    },
    registros: {
      corrientes: { inicio: 138, cantidad: 4, escala: 1000 },
      tensiones: null,
      estadoCB: { registro: 175, bitCerrado: 4, bitAbierto: 5, bitError: 6 },
      protecciones: { inicio: 180, cantidad: 4 }
    },
    protecciones: [
      {
        codigo: "PHLPTOC1",
        nombre: "Sobrecorriente Fase Baja",
        descripcion: "Phase Low-set Time Overcurrent",
        registroStart: 180,
        bitStart: 0,
        registroOperate: 180,
        bitOperate: 8
      },
      {
        codigo: "PHHPTOC1",
        nombre: "Sobrecorriente Fase Alta",
        descripcion: "Phase High-set Time Overcurrent",
        registroStart: 180,
        bitStart: 10,
        registroOperate: 181,
        bitOperate: 2
      },
      {
        codigo: "PHIPTOC1",
        nombre: "Sobrecorriente Instantánea",
        descripcion: "Phase Instantaneous Overcurrent",
        registroStart: 181,
        bitStart: 14,
        registroOperate: 182,
        bitOperate: 6
      },
      {
        codigo: "EFLPTOC1",
        nombre: "Falla a Tierra Baja",
        descripcion: "Earth Fault Low-set Time Overcurrent",
        registroStart: 183,
        bitStart: 4,
        registroOperate: 183,
        bitOperate: 6
      },
      {
        codigo: "EFHPTOC1",
        nombre: "Falla a Tierra Alta",
        descripcion: "Earth Fault High-set Time Overcurrent",
        registroStart: 183,
        bitStart: 12,
        registroOperate: 183,
        bitOperate: 14
      },
      {
        codigo: "NSPTOC1",
        nombre: "Secuencia Negativa",
        descripcion: "Negative Sequence Overcurrent",
        registroStart: 184,
        bitStart: 0,
        registroOperate: 184,
        bitOperate: 2
      },
      {
        codigo: "T1PTTR1",
        nombre: "Sobrecarga Térmica",
        descripcion: "Thermal Overload",
        registroStart: 185,
        bitStart: 0,
        registroOperate: 185,
        bitOperate: 2
      },
      {
        codigo: "CCBRBRF1",
        nombre: "Fallo de Interruptor",
        descripcion: "Breaker Failure",
        registroStart: 186,
        bitStart: 0,
        registroOperate: 186,
        bitOperate: 2
      }
    ]
  },
  "FE06": {
    id: "fe06",
    nombre: "FE06",
    descripcion: "Feeder con Tensión y Direccional",
    modeloId: "ref615",
    capacidades: {
      medicionCorriente: true,
      medicionTension: true,
      proteccionDireccional: true,
      autorecierre: true
    },
    registros: {
      corrientes: { inicio: 138, cantidad: 4, escala: 1000 },
      tensiones: { inicio: 152, cantidad: 6, escala: 1000 },
      estadoCB: { registro: 175, bitCerrado: 4, bitAbierto: 5, bitError: 6 },
      protecciones: { inicio: 180, cantidad: 20 }
    },
    protecciones: [
      // Todas las de FE03 más:
      {
        codigo: "DEFLPDEF1",
        nombre: "Falla Tierra Direccional Baja",
        descripcion: "Directional Earth Fault Low-set",
        registroStart: 182,
        bitStart: 8,
        registroOperate: 182,
        bitOperate: 10
      },
      {
        codigo: "PHPTUV1",
        nombre: "Subtensión",
        descripcion: "Three-phase Undervoltage",
        registroStart: 193,
        bitStart: 0,
        registroOperate: 193,
        bitOperate: 2
      },
      {
        codigo: "PHPTOV1",
        nombre: "Sobretensión",
        descripcion: "Three-phase Overvoltage",
        registroStart: 194,
        bitStart: 0,
        registroOperate: 194,
        bitOperate: 2
      }
      // ... más protecciones de tensión
    ]
  },
  "TE02": {
    id: "te02",
    nombre: "TE02",
    descripcion: "Transformer Differential Protection",
    modeloId: "ret615",
    capacidades: {
      medicionCorriente: true,
      medicionTension: false,
      proteccionDireccional: false,
      autorecierre: false,
      proteccionDiferencial: true
    },
    registros: {
      corrientes: { inicio: 138, cantidad: 7, escala: 1000 }, // 4 AT + 3 BT
      tensiones: null,
      estadoCB: { registro: 175, bitCerrado: 4, bitAbierto: 5, bitError: 6 },
      protecciones: { inicio: 180, cantidad: 10 }
    },
    protecciones: [
      {
        codigo: "TR2PTDF1",
        nombre: "Diferencial Estabilizada",
        descripcion: "Transformer Differential (87T)",
        registroStart: 180,
        bitStart: 0,
        registroOperate: 180,
        bitOperate: 2
      },
      {
        codigo: "LREFPNDF1",
        nombre: "Falla Tierra Restringida",
        descripcion: "Low Impedance REF (87N)",
        registroStart: 181,
        bitStart: 0,
        registroOperate: 181,
        bitOperate: 2
      },
      {
        codigo: "T2PTTR1",
        nombre: "Térmica Transformador",
        descripcion: "Transformer Thermal Overload",
        registroStart: 182,
        bitStart: 0,
        registroOperate: 182,
        bitOperate: 2
      }
      // ... más protecciones de transformador
    ]
  }
}
```

#### 1.3 Configuración de Alimentador (en localStorage o Supabase)

```javascript
{
  id: "alimentador-1",
  nombre: "Alimentador 1",
  tipoRegistrador: "rele", // "analizador" | "rele"

  // Solo si tipoRegistrador === "rele"
  configRele: {
    modeloId: "ref615",
    configuracionId: "fe03",
    conexion: {
      ip: "172.16.0.1",
      puerto: 502,
      unitId: 1,
      timeout: 3000
    },
    escala: {
      ctPrimario: 600,
      ctSecundario: 1, // 1 o 5
      vtPrimario: null, // Solo si config tiene tensión
      vtSecundario: null
    },
    proteccionesMonitoreadas: [
      { codigo: "PHLPTOC1", habilitado: true, notificar: true, etiquetaPersonalizada: null },
      { codigo: "PHHPTOC1", habilitado: true, notificar: true, etiquetaPersonalizada: "Sobrecorriente Alta" },
      { codigo: "EFHPTOC1", habilitado: true, notificar: true, etiquetaPersonalizada: null },
      { codigo: "T1PTTR1", habilitado: false, notificar: false, etiquetaPersonalizada: null }
    ],
    intervaloPollingMs: 5000
  }
}
```

#### 1.4 Tabla `eventos_proteccion` (Supabase)

```sql
CREATE TABLE eventos_proteccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alimentador_id UUID NOT NULL,
  registrador_ip VARCHAR(15) NOT NULL,

  -- Identificación
  codigo_proteccion VARCHAR(20) NOT NULL,
  nombre_proteccion VARCHAR(100),
  etiqueta_personalizada VARCHAR(100),

  -- Estado
  tipo_evento VARCHAR(10) NOT NULL, -- 'START', 'OPERATE', 'CLEAR'
  valor_registro INTEGER,

  -- Timestamps
  timestamp_deteccion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  timestamp_normalizacion TIMESTAMPTZ,

  -- Notificación
  notificacion_enviada BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eventos_alimentador ON eventos_proteccion(alimentador_id);
CREATE INDEX idx_eventos_timestamp ON eventos_proteccion(timestamp_deteccion DESC);
CREATE INDEX idx_eventos_activos ON eventos_proteccion(tipo_evento)
  WHERE timestamp_normalizacion IS NULL;
```

**Entregables Fase 1:**
- [ ] Estructura JSON para modelos y configuraciones
- [ ] Migración SQL para eventos_proteccion
- [ ] Funciones CRUD para modelos/configuraciones
- [ ] Tests de estructura de datos

---

### FASE 2: Frontend - UI de Configuración

**Objetivo**: Implementar la UI extensible para gestión de relés.

#### 2.1 Componente `GestionModelosRele.jsx`

Panel para administrar modelos de relé:
- Lista de modelos existentes
- Botón agregar nuevo modelo
- Edición de modelo (nombre, fabricante, configuraciones asociadas)
- Eliminación con confirmación

#### 2.2 Componente `GestionConfiguraciones.jsx`

Panel para administrar configuraciones:
- Lista de configuraciones por modelo
- Editor de capacidades (checkboxes)
- Editor de registros Modbus
- Editor de protecciones (agregar, editar, eliminar)

#### 2.3 Modificar `ModalConfigurarAgente.jsx`

Agregar pestaña/sección para tipo "Relé":
- Selector de modelo (combobox dinámico)
- Selector de configuración (filtrado por modelo)
- Campos de conexión Modbus
- Campos de escala CT/VT
- Lista de protecciones (checkboxes según configuración)
- Opciones de notificación

#### 2.4 Constantes Base `datosBaseReles.js`

Datos precargados para ABB 615 Series:
- REF615 con FE03 y FE06
- RET615 con TE02
- Protecciones con sus bits exactos

**Entregables Fase 2:**
- [ ] Componente `GestionModelosRele.jsx`
- [ ] Componente `GestionConfiguraciones.jsx`
- [ ] Modificación de `ModalConfigurarAgente.jsx`
- [ ] Archivo `datosBaseReles.js`
- [ ] Hook `useModelosRele.js`
- [ ] Tests de UI

---

### FASE 3: Agente Electron - Lectura Dinámica

**Objetivo**: El agente lee protecciones según la configuración del relé.

#### 3.1 Módulo `lectorProtecciones.js`

```javascript
// Funciones:
// - obtenerConfiguracionRele(alimentadorId)
// - leerRegistrosProteccion(cliente, config)
// - extraerBit(valor, posicion)
// - interpretarEstadoProteccion(registros, proteccion)
// - detectarCambios(estadoAnterior, estadoActual)
// - enviarEventos(eventos)
```

#### 3.2 Modificar Loop de Polling

- Detectar si alimentador es tipo "rele"
- Obtener configuración del relé (modelo, config, protecciones habilitadas)
- Leer solo los registros necesarios según configuración
- Extraer bits de cada protección monitoreada
- Comparar con estado anterior
- Enviar eventos de cambio al backend

#### 3.3 Manejo de Errores de Conexión

- Timeout configurable por relé
- Reintentos automáticos
- Log de errores de comunicación
- Alerta si relé no responde

**Entregables Fase 3:**
- [ ] Módulo `lectorProtecciones.js`
- [ ] Modificación del loop principal
- [ ] Tests con datos simulados
- [ ] Tests con relé real

---

### FASE 4: Backend - Eventos y Notificaciones

**Objetivo**: Procesar eventos y enviar notificaciones.

#### 4.1 Controlador `eventosProteccionController.js`

- `POST /api/eventos-proteccion` - Recibir eventos del agente
- `GET /api/alimentadores/:id/fallas-activas` - Fallas activas
- `GET /api/alimentadores/:id/historial-fallas` - Historial con filtros
- `PUT /api/eventos/:id/reconocer` - Marcar como reconocido

#### 4.2 Servicio de Notificaciones

- Determinar usuarios a notificar (workspace)
- Enviar push notification (Firebase)
- Registrar notificación enviada

**Entregables Fase 4:**
- [ ] Controlador de eventos
- [ ] Servicio de notificaciones
- [ ] Integración Firebase
- [ ] Tests de endpoints

---

### FASE 5: Frontend - Visualización de Fallas

**Objetivo**: Mostrar alertas y historial en la UI.

#### 5.1 Indicador en Tarjetas

- Icono de alerta si hay falla activa
- Color según severidad (START amarillo, OPERATE rojo)
- Tooltip con detalle

#### 5.2 Panel de Fallas Activas

- Lista de fallas en el workspace
- Filtros por puesto/alimentador
- Botón reconocer
- Link a historial

#### 5.3 Modal Historial de Fallas

- Tabla con eventos
- Filtros por fecha, protección, tipo
- Exportar CSV

**Entregables Fase 5:**
- [ ] Indicador en tarjetas
- [ ] Panel de fallas activas
- [ ] Modal historial
- [ ] Hook `useFallasActivas.js`

---

## Archivos a Crear/Modificar

### Frontend (mi-app/src)

**Nuevos:**
- `constantes/datosBaseReles.js` - Datos precargados ABB 615
- `componentes/configuracion/GestionModelosRele.jsx`
- `componentes/configuracion/GestionConfiguraciones.jsx`
- `componentes/configuracion/EditorProtecciones.jsx`
- `componentes/fallas/PanelFallasActivas.jsx`
- `componentes/fallas/ModalHistorialFallas.jsx`
- `hooks/useModelosRele.js`
- `hooks/useFallasActivas.js`

**Modificar:**
- `componentes/modales/ModalConfigurarAgente.jsx`
- `componentes/tarjetas/TarjetaAlimentador.jsx`
- `servicios/apiService.js`

### Backend (lector-mediciones-backend/src)

**Nuevos:**
- `controllers/eventosProteccionController.js`
- `services/notificacionesFallasService.js`
- `models/eventoProteccion.js`

**Modificar:**
- `routes/index.js`

### Agente (lector-mediciones-electron/src/main)

**Nuevos:**
- `modbus/lectorProtecciones.js`
- `modbus/configuracionesRele.js`

**Modificar:**
- `index.js` (loop de polling)

---

## Referencias Técnicas

- **Informe Técnico Completo**: `Informe_Tecnico_Completo_Reles_CELTA1.md`
- **Inventario de Relés**: `INVENTARIO_RELES_ABB.md`
- **Guía Registros Modbus**: `GUIA_REGISTROS_MODBUS_ABB615.md`
- **Manual Modbus ABB**: `REF615_Modbuspoint-756581-ENe.pdf`

---

## Registro de Cambios

| Fecha | Cambio |
|-------|--------|
| 2025-12-28 | Creación inicial del plan |
| 2025-12-29 | **Revisión completa** con información de: |
| | - Informe técnico CELTA 1 (configs reales: FE03, FE06, TE02) |
| | - Guía registros Modbus (bits exactos de protecciones) |
| | - Inventario de 12 relés con IPs |
| | - Rediseño hacia sistema extensible (configuración sobre código) |
