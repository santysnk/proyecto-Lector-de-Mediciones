# Plan de Implementación: Sistema de Detección de Fallas REF615

> **Fecha de creación**: 2025-12-28
> **Estado**: Planificación inicial
> **Rama de trabajo**: dev

---

## Resumen Ejecutivo

Implementar un sistema completo de detección, registro y notificación de fallas/disparos en relés de protección ABB REF615 (y compatibles) mediante protocolo Modbus TCP.

### Objetivos

1. Configurar registradores de tipo "relé" desde el frontend
2. Leer estados de protecciones via Modbus (registros 171-201)
3. Detectar fallas (START/OPERATE) y su estado (titilando/fijo)
4. Registrar eventos en historial
5. Notificar al frontend y dispositivos Android en tiempo real

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE DETECCIÓN DE FALLAS                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRONTEND                 BACKEND                 AGENTE                    │
│  (Config)                 (Lógica + Notif)        (Lectura)                 │
│                                                                              │
│  ┌──────────┐            ┌──────────────┐        ┌──────────────┐           │
│  │ Crear    │───────────►│ Guardar en   │───────►│ Obtener      │           │
│  │ Registra-│            │ Supabase     │        │ Config       │           │
│  │ dor RELÉ │            │              │        │              │           │
│  │ + config │            │ tipo: 'rele' │        │ Sabe que es  │           │
│  │ fallas   │            │ config_fallas│        │ relé y debe  │           │
│  └──────────┘            └──────────────┘        │ leer fallas  │           │
│                                                   └──────┬───────┘           │
│                                                          │                   │
│                                                          ▼                   │
│                                                   ┌──────────────┐           │
│                                                   │ Leer regs    │           │
│                                                   │ 171-201      │           │
│                                                   │ (protecciones)│          │
│                                                   └──────┬───────┘           │
│                                                          │                   │
│                                                          ▼                   │
│                          ┌──────────────┐        ┌──────────────┐           │
│  ┌──────────┐            │ Detectar     │◄───────│ POST /fallas │           │
│  │ UI:      │◄───────────│ falla nueva  │        │ {proteccion, │           │
│  │ Alerta   │            │              │        │  estado,     │           │
│  │ en card  │            │ Guardar en   │        │  titilando}  │           │
│  └──────────┘            │ historial    │        └──────────────┘           │
│                          │              │                                    │
│  ┌──────────┐            │ Enviar push  │                                    │
│  │ Android: │◄───────────│ notification │                                    │
│  │ Push     │            └──────────────┘                                    │
│  │ Notif    │                                                                │
│  └──────────┘                                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Contexto Técnico: Protecciones REF615

### Cómo funcionan las protecciones

Cada función de protección del REF615 tiene señales que se pueden leer via Modbus:

| Señal | Significado |
|-------|-------------|
| `START` | La protección arrancó (detectó condición anormal) |
| `START_MCD` | START sin reconocer (LED titilando) |
| `OPERATE` | La protección operó (ejecutó disparo) |
| `OPERATE_MCD` | OPERATE sin reconocer (LED titilando) |

### Interpretación del estado

```
START=0, OPERATE=0          → Normal (sin falla)
START=1, START_MCD=1        → Arrancó, titilando (sin reconocer)
START=1, START_MCD=0        → Arrancó, fijo (reconocido)
OPERATE=1, OPERATE_MCD=1    → Operó/Disparó, titilando (sin reconocer)
OPERATE=1, OPERATE_MCD=0    → Operó/Disparó, fijo (reconocido)
```

### Registros Modbus de protecciones

| Registro | Contenido |
|----------|-----------|
| 171 | Global Start/Trip (LEDPTRC1, TRPPTRC1) |
| 173 | LEDs programables (11 LEDs) |
| 180-181 | Sobrecorriente fase (PHLPTOC1, PHHPTOC1, PHHPTOC2) |
| 182-183 | Falla tierra direccional y no direccional |
| 184-185 | Secuencia negativa, térmica |
| 193-198 | Sobretensión, subtensión (requieren medición de tensión) |
| 200-201 | Frecuencia (solo algunas configuraciones) |

### Protecciones por tipo de configuración

**Solo corriente (FE01, FE02, FE03):**
- PHLPTOC1, PHHPTOC1, PHHPTOC2, PHIPTOC1 (Sobrecorriente fase)
- EFLPTOC1, EFLPTOC2, EFHPTOC1, EFIPTOC1 (Falla tierra)
- DEFLPDEF1, DEFLPDEF2, DEFHPDEF1 (Tierra direccional)
- NSPTOC1, NSPTOC2, PDNSPTOC1 (Secuencia negativa)
- T1PTTR1 (Térmica)
- CCBRBRF1 (Falla interruptor)

**Requieren tensión (FE04+):**
- PHPTOV1, PHPTOV2, PHPTOV3 (Sobretensión)
- PHPTUV1, PHPTUV2, PHPTUV3 (Subtensión)
- ROVPTOV1, ROVPTOV2, ROVPTOV3 (Tensión residual)

**Requieren frecuencia (FE08, FE09):**
- FRPFRQ1, FRPFRQ2, FRPFRQ3 (Frecuencia)

---

## Fases de Implementación

### FASE 1: Base de Datos (Supabase)

**Objetivo**: Preparar el esquema para soportar registradores de tipo relé y eventos de protección.

#### 1.1 Modificar tabla `registradores`

```sql
-- Agregar columna para distinguir tipo de registrador
ALTER TABLE registradores
ADD COLUMN IF NOT EXISTS tipo_dispositivo VARCHAR(20) DEFAULT 'medicion';
-- Valores: 'medicion', 'rele', 'ambos'

-- Agregar configuración específica para relés
ALTER TABLE registradores
ADD COLUMN IF NOT EXISTS config_protecciones JSONB DEFAULT NULL;

-- Ejemplo de config_protecciones:
-- {
--   "modelo": "REF615",
--   "configuracion": "FE01",  -- Solo corriente
--   "protecciones_habilitadas": ["PHLPTOC1", "PHHPTOC1", "EFHPTOC1", "T1PTTR1"],
--   "etiquetas_personalizadas": {
--     "PHLPTOC1": "Sobrecorriente Fase - Etapa 1",
--     "LED3": "Falla Tierra"
--   },
--   "intervalo_fallas_ms": 5000,  -- Polling más frecuente para fallas
--   "registros_protecciones": {
--     "inicio": 171,
--     "cantidad": 30
--   }
-- }
```

#### 1.2 Crear tabla `eventos_proteccion`

```sql
CREATE TABLE IF NOT EXISTS eventos_proteccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registrador_id UUID NOT NULL REFERENCES registradores(id) ON DELETE CASCADE,

  -- Identificación de la protección
  codigo_proteccion VARCHAR(20) NOT NULL,  -- Ej: 'PHLPTOC1', 'EFHPTOC1'
  nombre_proteccion VARCHAR(100),           -- Nombre legible
  etiqueta_personalizada VARCHAR(100),      -- Etiqueta del usuario

  -- Estado del evento
  tipo_evento VARCHAR(20) NOT NULL,         -- 'START', 'OPERATE', 'CLEAR'
  estado_anterior VARCHAR(20),              -- Estado previo
  estado_nuevo VARCHAR(20) NOT NULL,        -- 'ACTIVO_TITILANDO', 'ACTIVO_FIJO', 'NORMAL'

  -- Detalles adicionales
  fase VARCHAR(5),                          -- 'A', 'B', 'C', NULL (si es general)
  valor_registro INTEGER,                   -- Valor crudo del registro Modbus

  -- Timestamps
  timestamp_deteccion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  timestamp_reconocimiento TIMESTAMPTZ,     -- Cuando se reconoció (MCD=0)
  timestamp_normalizacion TIMESTAMPTZ,      -- Cuando volvió a normal

  -- Notificaciones
  notificacion_enviada BOOLEAN DEFAULT false,
  notificacion_timestamp TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_eventos_registrador ON eventos_proteccion(registrador_id);
CREATE INDEX idx_eventos_timestamp ON eventos_proteccion(timestamp_deteccion DESC);
CREATE INDEX idx_eventos_codigo ON eventos_proteccion(codigo_proteccion);
CREATE INDEX idx_eventos_tipo ON eventos_proteccion(tipo_evento);
CREATE INDEX idx_eventos_pendientes ON eventos_proteccion(estado_nuevo)
  WHERE estado_nuevo IN ('ACTIVO_TITILANDO', 'ACTIVO_FIJO');
```

#### 1.3 Crear tabla `lecturas_protecciones` (opcional, para historial detallado)

```sql
CREATE TABLE IF NOT EXISTS lecturas_protecciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registrador_id UUID NOT NULL REFERENCES registradores(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Valores crudos de los registros
  registros_raw JSONB NOT NULL,  -- { "171": 1234, "173": 5678, ... }

  -- Estados interpretados
  protecciones_activas JSONB,    -- [{ "codigo": "PHLPTOC1", "estado": "START", "mcd": true }, ...]

  -- Resumen
  hay_falla BOOLEAN DEFAULT false,
  cantidad_activas INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lecturas_prot_registrador ON lecturas_protecciones(registrador_id);
CREATE INDEX idx_lecturas_prot_timestamp ON lecturas_protecciones(timestamp DESC);
CREATE INDEX idx_lecturas_prot_falla ON lecturas_protecciones(hay_falla) WHERE hay_falla = true;
```

#### 1.4 Crear vista para estado actual de fallas

```sql
CREATE OR REPLACE VIEW v_fallas_activas AS
SELECT
  e.id,
  e.registrador_id,
  r.nombre AS nombre_registrador,
  r.ip,
  r.puerto,
  a.id AS alimentador_id,
  a.nombre AS nombre_alimentador,
  p.id AS puesto_id,
  p.nombre AS nombre_puesto,
  p.workspace_id,
  e.codigo_proteccion,
  e.nombre_proteccion,
  e.etiqueta_personalizada,
  e.tipo_evento,
  e.estado_nuevo,
  e.fase,
  e.timestamp_deteccion,
  e.notificacion_enviada
FROM eventos_proteccion e
JOIN registradores r ON e.registrador_id = r.id
LEFT JOIN alimentadores a ON r.id = ANY(
  SELECT (jsonb_array_elements(a2.card_design->'superior'->'boxes')->>'registrador_id')::uuid
  FROM alimentadores a2
  UNION
  SELECT (jsonb_array_elements(a2.card_design->'inferior'->'boxes')->>'registrador_id')::uuid
  FROM alimentadores a2
)
LEFT JOIN puestos p ON a.puesto_id = p.id
WHERE e.estado_nuevo IN ('ACTIVO_TITILANDO', 'ACTIVO_FIJO')
  AND e.timestamp_normalizacion IS NULL
ORDER BY e.timestamp_deteccion DESC;
```

**Entregables Fase 1:**
- [ ] Script SQL para modificar `registradores`
- [ ] Script SQL para crear `eventos_proteccion`
- [ ] Script SQL para crear `lecturas_protecciones`
- [ ] Script SQL para crear vista `v_fallas_activas`
- [ ] Ejecutar migraciones en Supabase

---

### FASE 2: Frontend - Configuración de Registradores Relé

**Objetivo**: Permitir al superadmin crear registradores de tipo "relé" con configuración de protecciones.

#### 2.1 Modificar formulario de nuevo registrador

**Archivo**: `mi-app/src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx`

Cambios:
- Agregar selector de tipo: "Medición" | "Relé" | "Ambos"
- Si tipo incluye "Relé":
  - Selector de modelo (REF615, REF620, etc.)
  - Selector de configuración (FE01-FE09)
  - Lista de protecciones disponibles (checkboxes)
  - Campo para etiquetas personalizadas
  - Intervalo de polling para fallas

#### 2.2 Crear componente de configuración de protecciones

**Nuevo archivo**: `mi-app/src/paginas/PaginaAlimentadores/componentes/modales/ConfiguracionProtecciones.jsx`

```jsx
// Props: modelo, configuracion, onProteccionesChange
// - Lista de protecciones disponibles según configuración
// - Checkbox para habilitar/deshabilitar cada una
// - Input para etiqueta personalizada
// - Preview de qué se va a monitorear
```

#### 2.3 Crear constantes de protecciones

**Nuevo archivo**: `mi-app/src/paginas/PaginaAlimentadores/constantes/proteccionesREF615.js`

```javascript
export const PROTECCIONES_REF615 = {
  PHLPTOC1: {
    nombre: 'Sobrecorriente Fase - Etapa Baja',
    registro: 180,
    requiere: 'corriente',
    // ... bits
  },
  // ... todas las protecciones
};

export const CONFIGURACIONES_REF615 = {
  FE01: { nombre: 'Alimentador básico', protecciones: [...] },
  // ...
};
```

**Entregables Fase 2:**
- [ ] Componente `ConfiguracionProtecciones.jsx`
- [ ] Constantes `proteccionesREF615.js`
- [ ] Modificar `ModalConfigurarAgente.jsx`
- [ ] Actualizar `apiService.js` con nuevos campos
- [ ] Tests manuales de creación de registrador tipo relé

---

### FASE 3: Agente Electron - Lectura de Fallas

**Objetivo**: El agente detecta registradores de tipo relé y lee sus protecciones.

#### 3.1 Crear módulo de protecciones

**Nuevo archivo**: `lector-mediciones-electron/src/main/modbus/proteccionesREF615.js`

```javascript
// - Mapa de protecciones con registros y bits
// - Función extraerBit(valor, posicion)
// - Función interpretarProteccion(registros, config)
// - Función leerTodasProtecciones(cliente, config)
```

#### 3.2 Modificar lógica de polling

**Archivo**: `lector-mediciones-electron/src/main/index.js`

Cambios:
- Detectar `tipo_dispositivo` del registrador
- Si es 'rele' o 'ambos': ejecutar polling de protecciones
- Comparar con estado anterior para detectar cambios
- Enviar eventos de cambio al backend

#### 3.3 Crear endpoint de envío de eventos

```javascript
// POST /api/agente/eventos-proteccion
// Body: {
//   registradorId: "uuid",
//   eventos: [
//     { codigo: "PHLPTOC1", tipo: "START", estado: "ACTIVO_TITILANDO", fase: "A" },
//     ...
//   ],
//   lecturaCompleta: { "171": 1234, "180": 5678, ... }
// }
```

**Entregables Fase 3:**
- [ ] Módulo `proteccionesREF615.js`
- [ ] Modificar `index.js` para detectar tipo de registrador
- [ ] Implementar polling de protecciones
- [ ] Implementar detección de cambios
- [ ] Implementar envío de eventos al backend
- [ ] Tests con relé real o simulado

---

### FASE 4: Backend - Lógica y Notificaciones

**Objetivo**: Procesar eventos de protección, guardar historial y enviar notificaciones.

#### 4.1 Crear controlador de eventos de protección

**Nuevo archivo**: `lector-mediciones-backend/src/controllers/eventosProteccionController.js`

```javascript
// - recibirEventos(req, res) - POST desde agente
// - obtenerEventosActivos(req, res) - GET para frontend
// - obtenerHistorial(req, res) - GET con filtros
// - reconocerEvento(req, res) - PUT para marcar como visto
```

#### 4.2 Crear servicio de notificaciones de fallas

**Nuevo archivo**: `lector-mediciones-backend/src/servicios/notificacionesFallasService.js`

```javascript
// - procesarNuevoEvento(evento)
// - determinarDestinatarios(evento) - usuarios del workspace
// - enviarPushNotification(usuarios, evento)
// - registrarNotificacionEnviada(eventoId)
```

#### 4.3 Agregar rutas

**Archivo**: `lector-mediciones-backend/src/routes/index.js`

```javascript
// Rutas para agente
router.post('/api/agente/eventos-proteccion', authAgente, eventosController.recibirEventos);

// Rutas para frontend
router.get('/api/workspaces/:id/fallas-activas', auth, eventosController.obtenerEventosActivos);
router.get('/api/registradores/:id/historial-fallas', auth, eventosController.obtenerHistorial);
router.put('/api/eventos-proteccion/:id/reconocer', auth, eventosController.reconocerEvento);
```

**Entregables Fase 4:**
- [ ] Controlador `eventosProteccionController.js`
- [ ] Servicio `notificacionesFallasService.js`
- [ ] Agregar rutas al backend
- [ ] Integrar con Firebase Cloud Messaging
- [ ] Tests de endpoints

---

### FASE 5: Frontend - Visualización de Fallas

**Objetivo**: Mostrar alertas de fallas en la UI y permitir ver historial.

#### 5.1 Indicador de falla en tarjetas

**Modificar**: `TarjetaAlimentador.jsx`

- Si el alimentador tiene registrador con falla activa: mostrar indicador visual
- Icono de alerta (triángulo amarillo/rojo)
- Tooltip con detalle de la falla
- Click para ver más información

#### 5.2 Panel de fallas activas

**Nuevo componente**: `PanelFallasActivas.jsx`

- Lista de fallas activas en el workspace
- Filtros por puesto/alimentador
- Botón para reconocer falla
- Link al historial

#### 5.3 Modal de historial de fallas

**Nuevo componente**: `ModalHistorialFallas.jsx`

- Tabla con historial de eventos
- Filtros por fecha, protección, estado
- Exportar a CSV/Excel
- Gráfico de frecuencia de fallas

#### 5.4 Notificaciones en tiempo real

- Polling periódico de fallas activas
- O implementar WebSocket/SSE para tiempo real
- Toast notification cuando hay nueva falla

**Entregables Fase 5:**
- [ ] Indicador visual en `TarjetaAlimentador.jsx`
- [ ] Componente `PanelFallasActivas.jsx`
- [ ] Componente `ModalHistorialFallas.jsx`
- [ ] Hook `useFallasActivas.js`
- [ ] Integración con sistema de notificaciones
- [ ] Tests de UI

---

## Preguntas Pendientes de Definir

1. **¿Un registrador puede ser de mediciones Y de fallas simultáneamente?**
   - Opción A: Dos registradores separados (uno medición, uno fallas)
   - Opción B: Un registrador con ambas funciones

2. **¿Qué hacer cuando se detecta una falla?**
   - Solo registrar y notificar
   - Pausar mediciones normales
   - Aumentar frecuencia de polling

3. **¿Cómo se "reconoce" una falla?**
   - Automáticamente cuando MCD cambia a 0
   - Manualmente desde el frontend
   - Ambos

4. **¿Retención de historial?**
   - ¿Cuánto tiempo guardar eventos?
   - ¿Agrupar eventos repetidos?

5. **¿Prioridad de notificaciones?**
   - ¿Todas las fallas notifican igual?
   - ¿Diferenciar START vs OPERATE?
   - ¿Configurar qué protecciones notifican?

---

## Archivos a Crear/Modificar

### Base de Datos
- `migrations/004_sistema_fallas.sql` (nuevo)

### Frontend (mi-app)
- `src/paginas/PaginaAlimentadores/constantes/proteccionesREF615.js` (nuevo)
- `src/paginas/PaginaAlimentadores/componentes/modales/ConfiguracionProtecciones.jsx` (nuevo)
- `src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx` (modificar)
- `src/paginas/PaginaAlimentadores/componentes/modales/PanelFallasActivas.jsx` (nuevo)
- `src/paginas/PaginaAlimentadores/componentes/modales/ModalHistorialFallas.jsx` (nuevo)
- `src/paginas/PaginaAlimentadores/componentes/tarjetas/TarjetaAlimentador.jsx` (modificar)
- `src/paginas/PaginaAlimentadores/hooks/useFallasActivas.js` (nuevo)
- `src/servicios/apiService.js` (modificar)

### Backend (lector-mediciones-backend)
- `src/controllers/eventosProteccionController.js` (nuevo)
- `src/servicios/notificacionesFallasService.js` (nuevo)
- `src/routes/index.js` (modificar)

### Agente (lector-mediciones-electron)
- `src/main/modbus/proteccionesREF615.js` (nuevo)
- `src/main/index.js` (modificar)

---

## Registro de Cambios

| Fecha | Cambio | Estado |
|-------|--------|--------|
| 2025-12-28 | Creación del plan | Completado |
| | Fase 1: Base de datos | Pendiente |
| | Fase 2: Frontend config | Pendiente |
| | Fase 3: Agente lectura | Pendiente |
| | Fase 4: Backend lógica | Pendiente |
| | Fase 5: Frontend visualización | Pendiente |

---

## Referencias

- Manual Modbus REF615: `REF615_Modbuspoint-756581-ENe.pdf`
- Documentación ABB: Application Manual, Technical Manual
- Código actual del agente: `lector-mediciones-electron/src/main/index.js`
- Código actual del modal: `ModalConfigurarAgente.jsx`
