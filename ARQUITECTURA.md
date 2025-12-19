# ARQUITECTURA.md - RelayWatch

> **Documento de contexto para Claude Code**
> Este archivo sirve para dar contexto correcto cuando se comprime automáticamente el contexto de la conversación.
> Siempre comunicarnos en **español**.

---

## 1. VISIÓN GENERAL DEL PROYECTO

### 1.1 Los tres componentes y cómo se despliegan

**El proyecto tiene 3 partes:**

1. **Frontend (mi-app):** Es la interfaz web desde donde el usuario interactúa. Se ejecuta localmente durante desarrollo (`npm run dev`) y puede desplegarse en Vercel para producción.

2. **Backend (lector-mediciones-backend):**
   - El código está en `C:\Users\santi\OneDrive\Escritorio\lector-mediciones-backend`
   - El backend **en producción está en Render**, no local
   - **Proceso de actualización:**
     1. Se modifican los archivos localmente
     2. Se hace commit y push al repositorio en GitHub
     3. Manualmente se hace deploy del último commit desde el dashboard de Render
   - El código local es solo para desarrollo, el backend real que usa la app está en Render

3. **Agente (lector-mediciones-electron):**
   - El código está en `C:\Users\santi\OneDrive\Escritorio\lector-mediciones-electron`
   - El agente debe correr en una **PC remota dentro de una red restringida** donde están los dispositivos Modbus
   - Desde local no se puede acceder a los dispositivos de medición (están en red aislada)
   - **Proceso de actualización:**
     1. Se modifican los archivos localmente
     2. Se hace commit y push al repositorio en GitHub
     3. Desde la PC remota (acceso por escritorio remoto) se hace `git pull`
     4. Se ejecuta y prueba el agente desde la PC remota
   - El agente lleva funcionando más de un día con casi nulas fallas

---

### 1.2 Diagrama de arquitectura

RelayWatch es un sistema de monitoreo de alimentadores eléctricos compuesto por **3 componentes** principales:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARQUITECTURA                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐       │
│   │   FRONTEND   │◄───────►│   BACKEND    │◄───────►│    AGENTE    │       │
│   │   (React)    │   API   │  (Express)   │   REST  │  (Electron)  │       │
│   │ localhost o  │         │   Render     │         │  PC Remota   │       │
│   │   Vercel     │         │              │         │              │       │
│   └──────┬───────┘         └──────┬───────┘         └──────┬───────┘       │
│          │                        │                        │               │
│          │                        │                        │               │
│          └────────┬───────────────┴───────────────┬────────┘               │
│                   │                               │                        │
│                   ▼                               ▼                        │
│           ┌──────────────┐               ┌──────────────┐                  │
│           │   SUPABASE   │               │   MODBUS     │                  │
│           │  (Auth + DB) │               │  Dispositivos│                  │
│           └──────────────┘               └──────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPONENTES Y RUTAS

### 2.1 FRONTEND (mi-app)
- **Ruta local:** `c:\Users\santi\OneDrive\Escritorio\proyecto-Lector-de-Mediciones\mi-app`
- **Tecnología:** React 19 + Vite + TailwindCSS 4
- **Puerto desarrollo:** `http://localhost:5173` o `5174`

#### Estructura de carpetas principales:
```
mi-app/src/
├── App.jsx                    # Enrutador principal
├── main.jsx                   # Punto de entrada
├── index.css                  # Estilos globales
├── lib/
│   └── supabase.js           # Cliente Supabase (ANON_KEY)
├── servicios/
│   ├── apiService.js         # Comunicación con Backend API
│   └── authService.js        # Autenticación Supabase
├── contextos/
│   └── AuthContext.jsx       # Contexto de autenticación
└── paginas/
    ├── PaginaLogin/          # Ruta: /
    ├── PaginaRegistro/       # Ruta: /registro
    ├── PaginaRecuperar/      # Ruta: /recuperarContraseña
    └── PaginaAlimentadores/  # Ruta: /alimentadores (dashboard principal)
        ├── contexto/         # ContextoAlimentadoresSupabase
        ├── hooks/            # usarPuestosSupabase, usarMediciones, etc.
        ├── componentes/      # Tarjetas, modales, navegación
        ├── utilidades/       # Cálculos, almacenamiento
        └── constantes/       # Colores, etiquetas
```

#### Variables de entorno (.env):
```env
VITE_SUPABASE_URL=https://pgxjkbqpkbusnozyndft.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_URL=https://lector-mediciones-backend.onrender.com  # Backend en producción
# VITE_API_URL=http://localhost:3001  # Para desarrollo local
```

---

### 2.2 BACKEND (lector-mediciones-backend)
- **Ruta local:** `C:\Users\santi\OneDrive\Escritorio\lector-mediciones-backend`
- **Producción:** Desplegado en **Render** (https://lector-mediciones-backend.onrender.com)
- **Tecnología:** Express 5 + Socket.IO + Supabase (SERVICE_ROLE)
- **Puerto local:** `3001`

#### Proceso de deployment:
1. Modificar código localmente
2. `git add . && git commit -m "mensaje" && git push`
3. En Render Dashboard: Deploy manual del último commit

#### Estructura de carpetas:
```
lector-mediciones-backend/src/
├── index.js                 # Punto de entrada (Express + Socket.IO + CORS)
├── config/
│   └── supabase.js         # Cliente Supabase (SERVICE_ROLE - acceso total)
├── middleware/
│   ├── auth.js             # Verificar token JWT de usuario (Supabase)
│   └── authAgente.js       # Verificar token JWT de agente (generado por backend)
├── routes/
│   └── index.js            # Todas las rutas de la API
└── controllers/
    ├── usuariosController.js
    ├── workspacesController.js
    ├── puestosController.js
    ├── alimentadoresController.js
    ├── registradoresController.js
    ├── lecturasController.js
    ├── permisosController.js
    ├── preferenciasController.js
    ├── agentesController.js          # Legacy - WebSocket
    ├── adminAgentesController.js     # Nueva arquitectura N:M
    ├── agenteApiController.js        # API REST para agentes
    ├── testConexionController.js
    └── testRegistradorController.js
```

#### Variables de entorno (.env):
```env
SUPABASE_URL=https://pgxjkbqpkbusnozyndft.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
PORT=3001
FRONTEND_URL=http://localhost:5173
CORS_ALLOW_ALL=true  # Solo para desarrollo
```

#### Configuración CORS (importante):
El backend tiene lista de orígenes permitidos. En Render, configurar:
- `FRONTEND_URL=https://tu-frontend.vercel.app` (producción)
- `CORS_ALLOW_ALL=true` (solo desarrollo)

---

### 2.3 AGENTE (lector-mediciones-electron)
- **Ruta local:** `C:\Users\santi\OneDrive\Escritorio\lector-mediciones-electron`
- **Tecnología:** Electron 30 + React + modbus-serial
- **Función:** Lee dispositivos Modbus TCP y envía lecturas al Backend

#### Proceso de deployment:
1. Modificar código localmente
2. `git add . && git commit -m "mensaje" && git push`
3. En la PC remota (con acceso a la red de dispositivos): `git pull`
4. Ejecutar agente en la PC remota

#### ¿Por qué PC remota?
Los dispositivos Modbus están en una **red restringida**. El agente debe correr en una PC dentro de esa red para poder comunicarse con los dispositivos. Se accede a esa PC por escritorio remoto.

#### Estado actual:
El agente lleva **más de un día corriendo** con casi nulas fallas. ¡Cumple su rol exitosamente!

#### Estructura de carpetas:
```
lector-mediciones-electron/src/
├── main/
│   ├── index.js              # Proceso principal (todo consolidado)
│   ├── modbus/
│   │   └── clienteModbus.js  # Cliente Modbus TCP
│   ├── polling/
│   │   └── pollingManager.js # Gestión de ciclos de lectura
│   └── servicios/
│       └── restService.js    # Comunicación REST con Backend
├── preload/
│   └── index.js              # Bridge IPC seguro
└── renderer/
    └── src/
        ├── App.jsx           # UI del agente
        ├── components/       # Header, Footer, LogsList, RegistradoresList
        └── styles/           # CSS global
```

#### Variables de entorno (.env):
```env
BACKEND_URL=https://lector-mediciones-backend.onrender.com
CLAVE_SECRETA=clave-del-agente-generada-por-superadmin
```

#### Flujo del Agente:
```
1. Autenticación
   Agente → POST /api/agente/auth (claveSecreta) → Backend
   Backend valida hash → Devuelve JWT + workspaces vinculados

2. Obtener configuración
   Agente → GET /api/agente/config (JWT) → Backend
   Backend devuelve lista de registradores activos

3. Polling de lecturas
   Por cada registrador activo:
   ├── Conectar Modbus TCP a IP:Puerto
   ├── Leer registros (indiceInicial, cantidad)
   ├── POST /api/agente/lecturas → Backend
   └── Backend guarda en tabla "lecturas"

4. Heartbeat (cada 30s)
   Agente → POST /api/agente/heartbeat → Backend
   Actualiza ultimo_heartbeat en tabla "agentes"

5. Polling de configuración (cada 10s)
   Agente detecta cambios en registradores y actualiza polling
```

---

## 3. BASE DE DATOS (SUPABASE)

**URL:** `https://pgxjkbqpkbusnozyndft.supabase.co`

### 3.1 Tablas (estructura exacta verificada):

#### `roles` - Catálogo de roles del sistema
```
id          UUID PRIMARY KEY
codigo      VARCHAR ('superadmin', 'admin', 'operador', 'observador')
nombre      VARCHAR ('Super Administrador', 'Administrador', 'Operador', 'Observador')
descripcion TEXT
nivel       INTEGER (1=superadmin, 2=admin, 3=operador, 4=observador)
created_at  TIMESTAMPTZ
```

#### `usuarios` - Perfiles de usuarios (vinculados a auth.users)
```
id          UUID PRIMARY KEY (= auth.users.id)
email       VARCHAR
nombre      VARCHAR
activo      BOOLEAN DEFAULT true
rol_id      UUID FK → roles(id)
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

#### `workspaces` - Espacios de trabajo
```
id          UUID PRIMARY KEY
nombre      VARCHAR
descripcion TEXT
creado_por  UUID FK → usuarios(id)
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

#### `usuario_workspaces` - Permisos usuario↔workspace (N:M)
```
id           UUID PRIMARY KEY
usuario_id   UUID FK → usuarios(id)
workspace_id UUID FK → workspaces(id)
rol_id       UUID FK → roles(id)  -- rol dentro del workspace
created_at   TIMESTAMPTZ
```

#### `puestos` - Contenedores de alimentadores
```
id             UUID PRIMARY KEY
workspace_id   UUID FK → workspaces(id)
nombre         VARCHAR
descripcion    TEXT
orden          INTEGER
color          VARCHAR (ej: '#eab308')
bg_color       VARCHAR (ej: '#588181')
gaps_verticales JSONB (ej: {"0": 50, "1": 121, "2": 127})
created_at     TIMESTAMPTZ
updated_at     TIMESTAMPTZ
```

#### `alimentadores` - Tarjetas de medición
```
id                  UUID PRIMARY KEY
puesto_id           UUID FK → puestos(id)
nombre              VARCHAR
color               VARCHAR (ej: '#14b8a6')
orden               INTEGER
registrador_id      UUID FK → registradores(id) -- puede ser NULL
intervalo_consulta_ms INTEGER DEFAULT 60000
card_design         JSONB (ver estructura abajo)
gap_horizontal      INTEGER DEFAULT 0 (px)
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

**Estructura de `card_design` (JSONB):**
```json
{
  "superior": {
    "tituloId": "corriente_132",
    "tituloCustom": "",
    "cantidad": 3,
    "registrador_id": "uuid-del-registrador",
    "boxes": [
      {"enabled": true, "label": "R", "indice": 137, "formula": "x * 500 / 1000"},
      {"enabled": true, "label": "S", "indice": 138, "formula": "x * 500 / 1000"},
      {"enabled": true, "label": "T", "indice": 139, "formula": "x * 500 / 1000"},
      {"enabled": false, "label": "", "indice": null, "formula": ""}
    ]
  },
  "inferior": {
    "tituloId": "tension_linea",
    "tituloCustom": "",
    "cantidad": 3,
    "registrador_id": null,
    "boxes": [...]
  }
}
```

#### `agentes` - Aplicaciones de escritorio que leen Modbus
```
id                   UUID PRIMARY KEY
nombre               VARCHAR (ej: 'PC-REMOTA')
descripcion          TEXT
activo               BOOLEAN DEFAULT true
clave_hash           VARCHAR (bcrypt hash de la clave secreta)
clave_anterior_hash  VARCHAR (para rotación de claves - 24h validez)
clave_rotada_at      TIMESTAMPTZ
ultimo_ping          TIMESTAMPTZ (deprecated)
ultimo_heartbeat     TIMESTAMPTZ
version_software     VARCHAR (ej: '1.0.0')
ip_ultima_conexion   VARCHAR (ej: '::1')
created_at           TIMESTAMPTZ
updated_at           TIMESTAMPTZ
```

#### `workspace_agentes` - Relación N:M workspace↔agente
```
id           UUID PRIMARY KEY
workspace_id UUID FK → workspaces(id)
agente_id    UUID FK → agentes(id)
created_at   TIMESTAMPTZ
```

#### `tipos_registrador` - Catálogo de tipos
```
id               UUID PRIMARY KEY
codigo           VARCHAR ('rele', 'analizador', 'plc')
nombre           VARCHAR ('Relé de Protección', 'Analizador de Redes', 'PLC/RTU')
descripcion      TEXT
esquema_registros JSONB (para futuro uso)
created_at       TIMESTAMPTZ
```

#### `registradores` - Dispositivos Modbus configurados
```
id                    UUID PRIMARY KEY
agente_id             UUID FK → agentes(id)
nombre                VARCHAR (ej: 'TRAFO 3 (13,2kv) - CELTA 1')
tipo                  VARCHAR ('modbus')
ubicacion             VARCHAR
ip                    VARCHAR (ej: '172.16.0.10')
puerto                INTEGER (ej: 502)
unit_id               INTEGER DEFAULT 1
indice_inicial        INTEGER (ej: 151)
cantidad_registros    INTEGER (ej: 3)
intervalo_segundos    INTEGER DEFAULT 60
timeout_ms            INTEGER DEFAULT 5000
activo                BOOLEAN DEFAULT true
alimentador_id        UUID FK → alimentadores(id) (legacy, no usar)
tipo_registrador_id   UUID FK → tipos_registrador(id)
ultima_lectura_exitosa TIMESTAMPTZ
ultimo_error          TEXT
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

#### `lecturas` - Valores leídos por los agentes
```
id                 UUID PRIMARY KEY
registrador_id     UUID FK → registradores(id)
timestamp          TIMESTAMPTZ
valores            INTEGER[] (array de registros Modbus, ej: [321, 309, 314])
tiempo_respuesta_ms INTEGER (ej: 11)
exito              BOOLEAN DEFAULT true
error_mensaje      TEXT
created_at         TIMESTAMPTZ
```

#### `test_registrador` - Tests de conexión solicitados
```
id                 UUID PRIMARY KEY
agente_id          UUID FK → agentes(id)
ip                 VARCHAR
puerto             INTEGER
unit_id            INTEGER
indice_inicial     INTEGER
cantidad_registros INTEGER
estado             VARCHAR ('pendiente', 'procesando', 'completado', 'error', 'timeout')
tiempo_respuesta_ms INTEGER
valores            INTEGER[]
error_mensaje      TEXT
solicitado_por     UUID FK → usuarios(id)
created_at         TIMESTAMPTZ
completado_at      TIMESTAMPTZ
```

#### `agente_logs` - Logs de actividad de agentes
```
id         SERIAL PRIMARY KEY
agente_id  UUID FK → agentes(id)
accion     VARCHAR (ej: 'autenticacion_rest')
ip         VARCHAR
detalles   JSONB (ej: {"usoClavePrincipal": true})
exito      BOOLEAN
created_at TIMESTAMPTZ
```

#### `preferencias_usuario` - Preferencias por usuario+workspace
```
id                     UUID PRIMARY KEY
usuario_id             UUID FK → usuarios(id)
workspace_id           UUID FK → workspaces(id)
puesto_seleccionado_id UUID FK → puestos(id)
preferencias           JSONB
created_at             TIMESTAMPTZ
updated_at             TIMESTAMPTZ
```

### 3.2 Vista
- `v_agentes_estado` - Vista que muestra estado de conexión de agentes

### 3.3 Función RPC
- `actualizar_heartbeat` - Procedimiento para actualizar heartbeat de agente

---

## 4. FLUJO DE DATOS

### 4.1 Autenticación de Usuario
```
Frontend                    Supabase                   Backend
   │                           │                          │
   ├── Login ─────────────────►│                          │
   │◄── JWT (access_token) ────┤                          │
   │                           │                          │
   ├── GET /api/workspaces ────┼──────────────────────────►
   │   (Authorization: Bearer JWT)                        │
   │                           │◄─── Valida JWT ──────────┤
   │◄── Lista workspaces ──────┼──────────────────────────┤
```

### 4.2 Lectura de Mediciones
```
Agente                      Backend                   Supabase              Frontend
   │                           │                          │                     │
   ├── Conectar Modbus ────────┤                          │                     │
   │◄── Valores registros ─────┤                          │                     │
   │                           │                          │                     │
   ├── POST /api/agente/lecturas ──────────────────────────►                    │
   │                           │──── INSERT lecturas ─────►                     │
   │◄── OK ────────────────────┤                          │                     │
   │                           │                          │                     │
   │                           │                          │    (polling)        │
   │                           │◄── GET lecturas ─────────┼────────────────────┤
   │                           │                          │◄── Últimas lecturas ┤
```

---

## 5. ROLES Y PERMISOS

### Roles globales (tabla usuarios.rol_global):
- **usuario** - Sin permisos especiales
- **admin** - Puede crear workspaces
- **superadmin** - Acceso total (CRUD agentes, registradores)

### Roles por workspace (tabla permisos.rol):
- **owner** - Dueño del workspace
- **admin** - Administrador
- **editor** - Puede editar
- **viewer** - Solo lectura

---

## 6. COMANDOS DE DESARROLLO

### Frontend (desde mi-app/):
```bash
npm install          # Instalar dependencias
npm run dev          # Servidor desarrollo (puerto 5173/5174)
npm run build        # Build producción
npm run lint         # Linter
```

### Backend (desde lector-mediciones-backend/):
```bash
npm install          # Instalar dependencias
npm run dev          # Desarrollo con nodemon (puerto 3001)
npm start            # Producción
```

### Agente (desde lector-mediciones-electron/):
```bash
npm install          # Instalar dependencias
npm run dev          # Desarrollo con electron-vite
npm run build        # Build
npm run build:win    # Build instalador Windows
```

---

## 7. ENDPOINTS API PRINCIPALES

### Usuarios
- `GET /api/usuarios/perfil` - Perfil del usuario autenticado

### Workspaces
- `GET /api/workspaces` - Listar workspaces del usuario
- `POST /api/workspaces` - Crear workspace
- `PUT /api/workspaces/:id` - Actualizar
- `DELETE /api/workspaces/:id` - Eliminar

### Puestos
- `GET /api/workspaces/:id/puestos` - Listar puestos
- `POST /api/workspaces/:id/puestos` - Crear puesto
- `PUT /api/puestos/:id` - Actualizar
- `DELETE /api/puestos/:id` - Eliminar
- `PUT /api/workspaces/:id/puestos/reordenar` - Reordenar

### Alimentadores
- `GET /api/puestos/:id/alimentadores` - Listar
- `POST /api/puestos/:id/alimentadores` - Crear
- `PUT /api/alimentadores/:id` - Actualizar
- `DELETE /api/alimentadores/:id` - Eliminar
- `PUT /api/puestos/:id/alimentadores/reordenar` - Reordenar
- `PUT /api/alimentadores/:id/mover` - Mover a otro puesto

### Lecturas
- `GET /api/alimentadores/:id/lecturas` - Últimas lecturas
- `GET /api/registradores/:id/lecturas` - Lecturas por registrador

### Agentes (Admin)
- `GET /api/admin/agentes` - Listar todos (superadmin)
- `POST /api/admin/agentes` - Crear agente
- `POST /api/admin/agentes/:id/rotar-clave` - Rotar clave

### Agentes (API para el agente Electron)
- `POST /api/agente/auth` - Autenticar con clave secreta
- `POST /api/agente/heartbeat` - Heartbeat
- `GET /api/agente/config` - Obtener registradores
- `POST /api/agente/lecturas` - Enviar lecturas
- `GET /api/agente/tests-pendientes` - Tests pendientes
- `POST /api/agente/tests/:id/resultado` - Reportar resultado test

---

## 8. ISSUES CONOCIDOS Y SOLUCIONES

### CORS desde localhost a Render
**Problema:** Frontend en localhost hace requests al backend en Render y recibe error CORS.
**Solución:** En Render, agregar variable `CORS_ALLOW_ALL=true` o `FRONTEND_URL=http://localhost:5173`

### Modo desarrollo vs producción
- **Desarrollo:** Frontend usa `VITE_API_URL=http://localhost:3001`
- **Producción:** Frontend usa `VITE_API_URL=https://lector-mediciones-backend.onrender.com`

---

## 9. SEGURIDAD Y AUTENTICACIÓN

### 9.1 Arquitectura de Autenticación

El sistema usa **dos tipos de autenticación** diferentes:

#### A) Usuarios (Frontend → Backend)
```
Frontend                    Supabase Auth                Backend
   │                              │                          │
   ├── signInWithPassword ───────►│                          │
   │◄── access_token (JWT) ───────┤                          │
   │                              │                          │
   ├── Request + Bearer token ────┼──────────────────────────►
   │                              │   middleware/auth.js     │
   │                              │◄── verifyIdToken ────────┤
   │◄── Response ─────────────────┼──────────────────────────┤
```

- Token generado por **Supabase Auth**
- Validado con `supabase.auth.getUser(token)` en el backend
- Contiene: `user.id`, `email`, metadata

#### B) Agentes (Electron → Backend)
```
Agente                         Backend
   │                              │
   ├── POST /api/agente/auth ────►│
   │   {claveSecreta: "xxx"}      │
   │                              │── bcrypt.compare()
   │◄── JWT (generado por backend)│
   │                              │
   ├── Request + Bearer token ───►│
   │                              │── jwt.verify()
   │◄── Response ─────────────────┤
```

- Token generado por el **Backend** (no Supabase)
- Validado con `jwt.verify()` usando `JWT_SECRET` del backend
- Contiene: `agenteId`, `nombre`, `tipo: 'agente'`
- Expira en 24 horas

### 9.2 Claves y Tokens

| Clave | Ubicación | Propósito |
|-------|-----------|-----------|
| `SUPABASE_ANON_KEY` | Frontend | Acceso limitado a Supabase (solo auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Acceso total a Supabase (bypass RLS) |
| `JWT_SECRET` | Backend | Firmar tokens de agentes |
| `clave_hash` | DB (agentes) | Hash bcrypt de clave secreta del agente |

### 9.3 Comunicación Frontend → Base de Datos (Arquitectura actual)

El frontend tiene **dos caminos** para comunicarse con Supabase:

#### A) Operaciones DIRECTAS a Supabase (solo autenticación):

| Archivo | Operación | Tabla/Servicio | Estado |
|---------|-----------|----------------|--------|
| `authService.js:13` | `signInWithPassword()` | Auth | ✅ Correcto |
| `authService.js:37` | `signUp()` | Auth | ✅ Correcto |
| `authService.js:71` | `signOut()` | Auth | ✅ Correcto |
| `authService.js:80` | `getSession()` | Auth | ✅ Correcto |
| `authService.js:93` | `getUser()` | Auth | ✅ Correcto |
| `authService.js:115` | `resetPasswordForEmail()` | Auth | ✅ Correcto |

**Todas las operaciones de `supabase.auth.*` van directas a Supabase Auth (esto es correcto y recomendado).**

#### B) Operaciones vía BACKEND (todos los datos):

| Operación | Endpoint | Controlador |
|-----------|----------|-------------|
| Crear perfil usuario | `POST /api/usuarios/perfil` | `usuariosController.crearPerfil` |
| Obtener perfil | `GET /api/usuarios/perfil` | `usuariosController.obtenerPerfil` |
| CRUD Workspaces | `/api/workspaces/*` | `workspacesController` |
| CRUD Puestos | `/api/puestos/*` | `puestosController` |
| CRUD Alimentadores | `/api/alimentadores/*` | `alimentadoresController` |
| Lecturas | `/api/registradores/*/lecturas` | `lecturasController` |
| CRUD Agentes | `/api/admin/agentes/*` | `adminAgentesController` |
| CRUD Registradores | `/api/agentes/*/registradores/*` | `adminAgentesController` |

**Diagrama simplificado:**
```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND                                                         │
├─────────────────────────────────────────────────────────────────┤
│ authService.js ──► supabase.auth.* ──► SUPABASE AUTH (directo)  │
│                                                                  │
│ apiService.js ───► fetchConAuth() ───► BACKEND ───► SUPABASE DB │
│   (TODOS los datos)  (Bearer token)     (SERVICE_ROLE)          │
└─────────────────────────────────────────────────────────────────┘
```

**Nota:** Desde 2025-12-19, todas las operaciones de datos (incluyendo usuarios) pasan por el backend.

### 9.4 Row Level Security (RLS)

Supabase tiene RLS habilitado en algunas tablas, pero el backend usa `SERVICE_ROLE_KEY` que **bypasea** RLS.

**Flujo de seguridad actual:**
```
Usuario → Frontend → Backend (valida permisos) → Supabase (SERVICE_ROLE)
```

El backend verifica permisos manualmente en cada endpoint:
1. Extrae `user.id` del token JWT
2. Consulta `usuario_workspaces` para verificar acceso
3. Verifica rol para operaciones específicas

**Ejemplo en código:**
```javascript
// controllers/workspacesController.js
const { data: permiso } = await supabase
  .from('usuario_workspaces')
  .select('rol_id, roles(codigo)')
  .eq('usuario_id', userId)
  .eq('workspace_id', workspaceId)
  .single();

if (!permiso) {
  return res.status(403).json({ error: 'Sin acceso al workspace' });
}
```

#### Verificación de acceso en Puestos y Alimentadores (fix 2025-12-19)

Los endpoints de puestos y alimentadores verifican que el usuario tenga acceso al workspace correspondiente antes de realizar cualquier operación. Esto evita que usuarios sin asignación a un workspace puedan ver o modificar datos de otros workspaces.

**Funciones auxiliares implementadas:**

```javascript
// controllers/puestosController.js y alimentadoresController.js

// Verifica si el usuario tiene acceso a un workspace
async function verificarAccesoWorkspace(workspaceId, userId) {
  const { data: asignacion } = await supabase
    .from('usuario_workspaces')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('usuario_id', userId)
    .single();
  return !!asignacion;
}

// Obtiene el workspace_id de un puesto
async function obtenerWorkspaceIdDePuesto(puestoId) {
  const { data: puesto } = await supabase
    .from('puestos')
    .select('workspace_id')
    .eq('id', puestoId)
    .single();
  return puesto?.workspace_id || null;
}

// Obtiene el workspace_id de un alimentador (via su puesto)
async function obtenerWorkspaceIdDeAlimentador(alimentadorId) {
  const { data: alimentador } = await supabase
    .from('alimentadores')
    .select('puesto_id')
    .eq('id', alimentadorId)
    .single();
  if (!alimentador?.puesto_id) return null;
  return obtenerWorkspaceIdDePuesto(alimentador.puesto_id);
}
```

**Endpoints protegidos:**

| Controlador | Endpoint | Verificación |
|-------------|----------|--------------|
| `puestosController` | `GET /workspaces/:id/puestos` | Verifica acceso al workspace |
| `puestosController` | `POST /workspaces/:id/puestos` | Verifica acceso al workspace |
| `puestosController` | `PUT /puestos/:id` | Obtiene workspace del puesto → verifica acceso |
| `puestosController` | `DELETE /puestos/:id` | Obtiene workspace del puesto → verifica acceso |
| `puestosController` | `PUT /workspaces/:id/puestos/reordenar` | Verifica acceso al workspace |
| `alimentadoresController` | `GET /puestos/:id/alimentadores` | Obtiene workspace del puesto → verifica acceso |
| `alimentadoresController` | `POST /puestos/:id/alimentadores` | Obtiene workspace del puesto → verifica acceso |
| `alimentadoresController` | `PUT /alimentadores/:id` | Obtiene workspace del alimentador → verifica acceso |
| `alimentadoresController` | `DELETE /alimentadores/:id` | Obtiene workspace del alimentador → verifica acceso |
| `alimentadoresController` | `PUT /puestos/:id/alimentadores/reordenar` | Obtiene workspace del puesto → verifica acceso |
| `alimentadoresController` | `PUT /alimentadores/:id/mover` | Verifica acceso a workspace origen Y destino |

**Respuestas de error:**
- `403 Forbidden`: "No tienes acceso a este workspace/puesto/alimentador"
- `404 Not Found`: "Puesto/Alimentador no encontrado"

### 9.5 Limpieza de Sesión al Cerrar Sesión (fix 2025-12-19)

Cuando un usuario cierra sesión, se limpia tanto la sesión de Supabase como los datos de localStorage relacionados con workspaces. Esto evita que al loguearse otro usuario se intente acceder a workspaces del usuario anterior.

**Problema original:**
Al hacer logout con usuario A y login con usuario B, el frontend mostraba error "No tienes acceso a este workspace" porque el ID del workspace de A quedaba guardado en localStorage.

**Solución implementada:**

1. **`cerrarSesion()` en `authService.js`** limpia las claves de localStorage:
```javascript
export async function cerrarSesion() {
  // Limpiar datos de sesión del localStorage
  localStorage.removeItem('rw-configuracion-seleccionada');
  localStorage.removeItem('rw-puesto-seleccionado');
  localStorage.removeItem('rw-gap-tarjetas');
  localStorage.removeItem('rw-gap-filas');

  const { error } = await supabase.auth.signOut();
  return { error: error ? traducirError(error.message) : null };
}
```

2. **`handleSalir()` en `VistaAlimentadores.jsx`** ahora llama a `logout()`:
```javascript
const handleSalir = async () => {
  limpiarPreferenciasUI();  // Limpia gaps de localStorage
  await logout();           // Llama a cerrarSesion() que limpia localStorage + Supabase
  navigate("/");
};
```

**Flujo corregido:**
```
Usuario A hace click en "Salir"
    ↓
limpiarPreferenciasUI() - limpia gaps
    ↓
logout() → cerrarSesion() - limpia localStorage de configuración + cierra sesión Supabase
    ↓
navigate("/") - redirige al login
    ↓
Usuario B hace login → navega a /alimentadores
    ↓
Hooks se inicializan con localStorage limpio → no hay datos del usuario anterior
```

**Claves de localStorage afectadas:**

| Clave | Descripción | Limpiado en |
|-------|-------------|-------------|
| `rw-configuracion-seleccionada` | ID del workspace activo | `cerrarSesion()` |
| `rw-puesto-seleccionado` | ID del puesto activo | `cerrarSesion()` |
| `rw-gap-tarjetas` | Gaps horizontales | `cerrarSesion()` + `limpiarPreferenciasUI()` |
| `rw-gap-filas` | Gaps verticales | `cerrarSesion()` + `limpiarPreferenciasUI()` |

### 9.6 UI para Usuarios sin Workspace Asignado (fix 2025-12-19)

Cuando un usuario no tiene workspaces asignados (por ejemplo, un observador recién creado), el frontend muestra una pantalla amigable en lugar de un error.

**Componente:** `VistaAlimentadores.jsx`

**Comportamiento:**
- La barra de navegación siempre se muestra (para que cuando se asigne un workspace, el usuario pueda seleccionarlo)
- En el área principal (`<main>`) se muestra un mensaje informativo con un botón para volver al inicio

**Código:**
```jsx
{/* En VistaAlimentadores.jsx - dentro de <main> */}
{!configuracionSeleccionada ? (
  <div className="alim-sin-workspace">
    <h2>Sin acceso a workspaces</h2>
    <p>No tienes ningún workspace asignado.</p>
    <p>Contacta a un administrador para que te asigne acceso a un workspace.</p>
    <button onClick={handleSalir}>Volver al inicio</button>
  </div>
) : !puestoSeleccionado ? (
  /* Caso 2: Tiene workspace pero sin puestos */
  <div className="alim-empty-state">...</div>
) : (
  /* Caso 3: Tiene workspace y puestos - mostrar grilla de tarjetas */
  <GrillaTarjetas ... />
)}
```

**Estilos:** `VistaAlimentadores.css`
```css
.alim-sin-workspace {
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   height: 100%;
   min-height: 300px;
   text-align: center;
   padding: 2rem;
}

.alim-sin-workspace button {
   margin-top: 1rem;
   padding: 10px 20px;
   background: #3b82f6;
   color: white;
   border: none;
   border-radius: 6px;
   cursor: pointer;
   font-weight: 500;
}
```

**Hook `usarConfiguracion`:** También se modificó para limpiar `configuracionSeleccionadaId` cuando el usuario no tiene workspaces:
```javascript
if (workspacesData.length > 0) {
  // Validar selección guardada
  const seleccionValida = workspacesData.some((c) => c.id === configuracionSeleccionadaId);
  if (!seleccionValida) {
    setConfiguracionSeleccionadaId(workspacesData[0].id);
  }
} else {
  // Sin workspaces → limpiar selección
  setConfiguracionSeleccionadaId(null);
}
```

### 9.7 Rotación de Claves de Agente

Los agentes soportan rotación de claves sin downtime:

1. SuperAdmin genera nueva clave → se guarda nuevo `clave_hash`
2. Clave anterior se mueve a `clave_anterior_hash` con timestamp
3. Durante 24h, ambas claves son válidas
4. Agente actualiza su `.env` con nueva clave
5. Después de 24h, solo la nueva clave funciona

---

## 10. NOTAS PARA CLAUDE

- Siempre comunicarse en **español**
- El backend en Render requiere deploy manual después de push
- El agente en PC remota requiere `git pull` después de push
- Las credenciales de Supabase son sensibles (SERVICE_ROLE_KEY)
- El agente está funcionando establemente (no tocar innecesariamente)
- Las migraciones SQL están en `lector-mediciones-backend/migrations/`

---

## 11. MIGRACIONES SQL

Las migraciones están en `lector-mediciones-backend/migrations/`:

| Archivo | Descripción |
|---------|-------------|
| `001_inicial.sql` | Estructura base (roles, usuarios, workspaces, puestos, alimentadores) |
| `002_rename_configuraciones_to_workspaces.sql` | Renombra "configuraciones" a "workspaces" |
| `003_alimentadores_config_fields.sql` | Agrega campos: color, registrador_id, intervalo_consulta_ms, card_design, gap_horizontal |

**Para ejecutar una migración:**
Copiar y pegar el SQL en el editor SQL de Supabase Dashboard.

---

*Última actualización: 2025-12-19 (fix seguridad acceso puestos/alimentadores, limpieza de sesión al logout, UI para usuarios sin workspace)*
