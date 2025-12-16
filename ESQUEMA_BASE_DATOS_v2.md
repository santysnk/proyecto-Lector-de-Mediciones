# Esquema de Base de Datos v2 - Arquitectura REST con Roles

## Resumen de Cambios

### Problemas del Esquema Anterior
1. **Violación 1NF**: `lecturas_terna_3_*` con columnas registro_137 a registro_156
2. **Violación 3NF**: `config_rele` y `config_analizador` como JSONB en alimentadores
3. **Limitación**: `workspaces.agente_id` limita a 1 agente por workspace
4. **Seguridad**: Agente conecta directamente a Supabase (expone credenciales)
5. **WebSocket**: Innecesario y agrega complejidad
6. **Roles limitados**: Solo un workspace por usuario, sin roles granulares

### Principios del Nuevo Diseño
- **Normalización completa** (3NF mínimo)
- **Seguridad por capas**: Agente → Backend → Supabase
- **Flexibilidad**: Múltiples agentes y registradores
- **Simplicidad**: REST API polling en lugar de WebSocket
- **Roles granulares**: Sistema de permisos por workspace
- **Preferencias personales**: Cada usuario tiene su configuración visual

---

## Sistema de Roles y Permisos

### Roles Disponibles

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| **superadmin** | 1 | Control total del sistema. Crea agentes, registradores, workspaces. Único que gestiona agentes. |
| **admin** | 2 | Administra sus workspaces. Vincula agentes, crea puestos/alimentadores, gestiona usuarios de su workspace. |
| **operador** | 3 | Monitorea el sistema. Ve lecturas, agentes vinculados, puede exportar datos. |
| **observador** | 4 | Solo ve el dashboard con lecturas en tiempo real. Rol por defecto al registrarse. |

### Matriz de Permisos

| Acción | superadmin | admin | operador | observador |
|--------|:----------:|:-----:|:--------:|:----------:|
| **Workspaces** |
| Crear workspaces | ✓ | ✓ | ✗ | ✗ |
| Eliminar workspaces (todos) | ✓ | ✗ | ✗ | ✗ |
| Eliminar workspaces (solo propios) | ✓ | ✓ | ✗ | ✗ |
| Ver todos los workspaces | ✓ | ✗ | ✗ | ✗ |
| Ver workspaces propios | ✓ | ✓ | ✗ | ✗ |
| Acceder a workspace asignado | ✓ | ✓ | ✓ | ✓ |
| **Usuarios** |
| Crear usuarios en cualquier workspace | ✓ | ✗ | ✗ | ✗ |
| Crear usuarios en su workspace | ✓ | ✓ | ✗ | ✗ |
| Cambiar roles (excepto superadmin) | ✓ | ✓ | ✗ | ✗ |
| **Agentes** |
| Crear/eliminar agentes | ✓ | ✗ | ✗ | ✗ |
| Configurar registradores del agente | ✓ | ✗ | ✗ | ✗ |
| Ver lista de agentes disponibles | ✓ | ✓ | ✗ | ✗ |
| Vincular/desvincular agente a workspace | ✓ | ✓ | ✗ | ✗ |
| Ver agentes vinculados a su workspace | ✓ | ✓ | ✓ | ✗ |
| **Registradores** |
| Crear/editar/eliminar | ✓ | ✗ | ✗ | ✗ |
| Ver (solo de agentes vinculados) | ✓ | ✓ | ✓ | ✗ |
| **Puestos/Alimentadores** |
| Crear/editar/eliminar | ✓ | ✓ | ✗ | ✗ |
| Ver | ✓ | ✓ | ✓ | ✓ |
| **Lecturas** |
| Ver en tiempo real | ✓ | ✓ | ✓ | ✓ |
| Exportar históricos | ✓ | ✓ | ✓ | ✗ |
| **Preferencias personales** (por usuario) |
| Colores de cards | ✓ | ✓ | ✓ | ✓ |
| Colores de botones de puestos | ✓ | ✓ | ✓ | ✓ |
| Color de fondo del puesto | ✓ | ✓ | ✓ | ✓ |
| Barras de gaps | ✓ | ✓ | ✓ | ✓ |
| Posición de cards (drag & drop) | ✓ | ✓ | ✓ | ✓ |

---

## Esquema de Tablas

### 1. roles (NUEVA - Catálogo)
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,  -- 'superadmin', 'admin', 'operador', 'observador'
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel INTEGER NOT NULL,  -- 1=superadmin, 2=admin, 3=operador, 4=observador
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO roles (codigo, nombre, descripcion, nivel) VALUES
('superadmin', 'Super Administrador', 'Control total del sistema', 1),
('admin', 'Administrador', 'Administra workspaces propios', 2),
('operador', 'Operador', 'Monitorea y opera el sistema', 3),
('observador', 'Observador', 'Solo lectura del dashboard', 4);
```

### 2. usuarios (MODIFICADA)
```sql
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    rol_id UUID NOT NULL REFERENCES roles(id),  -- Rol global del usuario
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- NOTA: password_hash removido - Supabase Auth lo maneja
-- NOTA: workspace_id removido - ahora es N:M via usuario_workspaces
```

### 3. workspaces (MODIFICADA)
```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    creado_por UUID NOT NULL REFERENCES usuarios(id),  -- Quién lo creó
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. usuario_workspaces (NUEVA - Relación N:M con rol por workspace)
```sql
CREATE TABLE usuario_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    rol_id UUID NOT NULL REFERENCES roles(id),  -- Rol en ESTE workspace específico
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, workspace_id)
);
-- Permite que un usuario sea 'admin' en un workspace y 'observador' en otro
```

### 5. preferencias_usuario (NUEVA)
```sql
CREATE TABLE preferencias_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    preferencias JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, workspace_id)
);
-- Ejemplo de preferencias:
-- {
--   "tema": "oscuro",
--   "colorFondoPuesto": "#1a1a1a",
--   "cards": {
--     "card-uuid-1": {"color": "#00ff00", "posicion": 1},
--     "card-uuid-2": {"color": "#ff0000", "posicion": 2}
--   },
--   "botonesPuestos": {
--     "puesto-uuid-1": {"color": "#3498db"}
--   }
-- }
```

### 6. agentes
```sql
CREATE TABLE agentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave_hash VARCHAR(255) NOT NULL,  -- Hash bcrypt de la clave
    clave_anterior_hash VARCHAR(255),  -- Para rotación de claves
    clave_rotada_at TIMESTAMPTZ,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    ultimo_heartbeat TIMESTAMPTZ,
    version_software VARCHAR(50),
    ip_ultima_conexion INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. workspace_agentes (Relación N:M)
```sql
CREATE TABLE workspace_agentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    agente_id UUID NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, agente_id)
);
-- Admin vincula su workspace a agentes existentes
-- No puede modificar el agente, solo vincularse para ver sus lecturas
```

### 8. puestos
```sql
CREATE TABLE puestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9. alimentadores
```sql
CREATE TABLE alimentadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puesto_id UUID NOT NULL REFERENCES puestos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10. tipos_registrador (Catálogo)
```sql
CREATE TABLE tipos_registrador (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    esquema_registros JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO tipos_registrador (codigo, nombre, descripcion, esquema_registros) VALUES
('rele', 'Relé de Protección', 'Relé de protección eléctrica', '{
    "registros": [
        {"indice": 0, "nombre": "corriente_fase_a", "unidad": "A", "factor": 0.1},
        {"indice": 1, "nombre": "corriente_fase_b", "unidad": "A", "factor": 0.1},
        {"indice": 2, "nombre": "corriente_fase_c", "unidad": "A", "factor": 0.1}
    ]
}'),
('analizador', 'Analizador de Redes', 'Analizador de calidad de energía', '{
    "registros": [
        {"indice": 0, "nombre": "tension_l1_n", "unidad": "V", "factor": 0.1},
        {"indice": 1, "nombre": "tension_l2_n", "unidad": "V", "factor": 0.1},
        {"indice": 2, "nombre": "tension_l3_n", "unidad": "V", "factor": 0.1},
        {"indice": 3, "nombre": "potencia_activa", "unidad": "kW", "factor": 0.01}
    ]
}');
```

### 11. registradores
```sql
CREATE TABLE registradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
    alimentador_id UUID REFERENCES alimentadores(id) ON DELETE SET NULL,
    tipo_registrador_id UUID NOT NULL REFERENCES tipos_registrador(id),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,

    -- Configuración Modbus
    ip VARCHAR(45) NOT NULL,
    puerto INTEGER NOT NULL DEFAULT 502,
    unit_id INTEGER NOT NULL DEFAULT 1,
    indice_inicial INTEGER NOT NULL DEFAULT 0,
    cantidad_registros INTEGER NOT NULL DEFAULT 10,
    intervalo_segundos INTEGER NOT NULL DEFAULT 60,
    timeout_ms INTEGER DEFAULT 5000,

    -- Estado
    activo BOOLEAN DEFAULT true,
    ultimo_error TEXT,
    ultima_lectura_exitosa TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_registradores_agente ON registradores(agente_id);
CREATE INDEX idx_registradores_alimentador ON registradores(alimentador_id);
CREATE INDEX idx_registradores_activo ON registradores(activo) WHERE activo = true;
```

### 12. lecturas
```sql
CREATE TABLE lecturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registrador_id UUID NOT NULL REFERENCES registradores(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valores SMALLINT[] NOT NULL,
    tiempo_respuesta_ms INTEGER,
    exito BOOLEAN DEFAULT true,
    error_mensaje TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lecturas_registrador_timestamp ON lecturas(registrador_id, timestamp DESC);
CREATE INDEX idx_lecturas_timestamp ON lecturas(timestamp DESC);
```

### 13. agente_logs
```sql
CREATE TABLE agente_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
    accion VARCHAR(100) NOT NULL,
    ip INET,
    detalles JSONB,
    exito BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agente_logs_agente_time ON agente_logs(agente_id, created_at DESC);
```

---

## Diagrama de Relaciones

```
                         roles (catálogo)
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
     usuarios ─────── usuario_workspaces ─────── workspaces
          │                                        │
          │                                        ├── creado_por → usuarios
          │                                        │
          └────── preferencias_usuario ────────────┘
                                                   │
                                                   │
     workspaces ──────── workspace_agentes ──────── agentes
          │                                           │
          │                                           │
       puestos                                   registradores ──── tipos_registrador
          │                                           │
          │                                           │
     alimentadores ◄──────────────────────────────────┘
                                                      │
                                                      │
                                                  lecturas
```

---

## Flujo de Registro y Asignación de Roles

### Primer Login (Usuario Nuevo)

```
1. Usuario se registra con email/password
   │
   ▼
2. Supabase Auth crea el usuario
   │
   ▼
3. Trigger crea registro en tabla 'usuarios' con rol = 'observador'
   │
   ▼
4. Usuario NO tiene acceso a ningún workspace
   │
   ▼
5. Para obtener acceso:
   ├── Un admin lo invita a su workspace (como operador u observador)
   ├── Un superadmin lo promueve a 'admin' (puede crear workspaces)
   └── Superadmin lo agrega directamente a un workspace
```

### Promoción de Roles

```
Solo superadmin puede:
├── Cambiar rol global de cualquier usuario
├── Promover a admin
└── Crear otros superadmins (con precaución)

Admin puede:
├── Invitar usuarios a SU workspace
└── Asignar rol 'operador' u 'observador' en SU workspace
```

---

## API REST del Backend

### Endpoints para el Agente (IMPLEMENTADOS)

```
POST   /api/agente/auth          - Autenticar con clave_secreta, obtener JWT
POST   /api/agente/heartbeat     - Reportar que está vivo
GET    /api/agente/config        - Obtener registradores asignados
POST   /api/agente/lecturas      - Enviar batch de lecturas
POST   /api/agente/log           - Enviar log
POST   /api/agente/vincular      - Vincular con workspace via código
```

### Endpoints para el Frontend

```
# Autenticación (via Supabase Auth)
POST   /auth/login               - Login
POST   /auth/register            - Registro (rol por defecto: observador)
POST   /auth/logout              - Logout

# Workspaces
GET    /api/workspaces           - Listar workspaces del usuario
POST   /api/workspaces           - Crear workspace (admin+)
DELETE /api/workspaces/:id       - Eliminar workspace (solo propios o superadmin)

# Usuarios en Workspace
GET    /api/workspaces/:id/usuarios     - Listar usuarios del workspace
POST   /api/workspaces/:id/usuarios     - Invitar usuario al workspace
PUT    /api/workspaces/:id/usuarios/:uid - Cambiar rol en workspace
DELETE /api/workspaces/:id/usuarios/:uid - Remover usuario del workspace

# Agentes (vincular)
GET    /api/agentes                     - Listar agentes disponibles (admin+)
GET    /api/workspaces/:id/agentes      - Listar agentes vinculados
POST   /api/workspaces/:id/agentes      - Vincular agente
DELETE /api/workspaces/:id/agentes/:aid - Desvincular agente

# Puestos y Alimentadores
GET    /api/workspaces/:id/puestos      - Listar puestos
POST   /api/workspaces/:id/puestos      - Crear puesto
PUT    /api/puestos/:id                 - Editar puesto
DELETE /api/puestos/:id                 - Eliminar puesto

# Registradores (solo lectura para admin)
GET    /api/agentes/:id/registradores   - Ver registradores de un agente

# Lecturas
GET    /api/registradores/:id/lecturas  - Obtener lecturas recientes

# Preferencias
GET    /api/preferencias/:workspaceId   - Obtener preferencias del usuario
PUT    /api/preferencias/:workspaceId   - Guardar preferencias del usuario

# Panel Superadmin
GET    /api/admin/usuarios              - Listar todos los usuarios
PUT    /api/admin/usuarios/:id/rol      - Cambiar rol global
POST   /api/admin/agentes               - Crear agente
PUT    /api/admin/agentes/:id           - Editar agente
DELETE /api/admin/agentes/:id           - Eliminar agente
POST   /api/admin/registradores         - Crear registrador
PUT    /api/admin/registradores/:id     - Editar registrador
DELETE /api/admin/registradores/:id     - Eliminar registrador
```

---

## Interfaces de Usuario por Rol

### Panel Superadmin
- Gestión global de usuarios (cambiar roles)
- CRUD completo de agentes
- CRUD completo de registradores
- Ver todos los workspaces
- Acceso a logs del sistema

### Panel Admin (en su workspace)
- Ver/vincular agentes disponibles
- Gestionar usuarios de su workspace
- CRUD de puestos y alimentadores
- Ver lecturas de agentes vinculados

### Vista Operador
- Ver dashboard con lecturas
- Ver agentes vinculados (solo lectura)
- Exportar datos
- Configurar preferencias personales

### Vista Observador
- Ver dashboard con lecturas en tiempo real
- Configurar preferencias personales (colores, posiciones)
- Nada más

---

## Consideraciones de Seguridad

1. **Rol por defecto**: `observador` (sin acceso hasta invitación)
2. **Tokens JWT**: 24h de expiración
3. **RLS en Supabase**: Políticas por rol y workspace
4. **Validación en backend**: Verificar permisos antes de cada operación
5. **Auditoría**: Registrar cambios de roles y accesos sensibles

---

## Configuración del Agente

```javascript
// .env del agente
CLAVE_SECRETA=mi-clave-secreta-generada
BACKEND_URL=https://lector-mediciones-backend.onrender.com
CONFIG_POLL_INTERVAL_MS=30000
```

El agente NO necesita credenciales de Supabase. Solo conoce el backend.
