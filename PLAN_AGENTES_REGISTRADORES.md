# Plan de Implementacion: Sistema de Agentes y Registradores

> **Commit base:** `c8ba4e6` - feat(ui): agregar opcion Configurar Agente en menu workspace
> **Fecha:** 2025-12-14
> **Estado:** Planificacion completada, pendiente implementacion

---

## Resumen del Sistema

Implementar un sistema seguro donde:
- Cada **agente** (por empresa) tiene una clave secreta unica
- Los **registradores** (dispositivos Modbus) se vinculan a un agente
- Los **workspaces** se vinculan a un agente mediante codigo temporal
- Las **cards** muestran datos de tablas de lecturas vinculadas al agente

---

## Arquitectura de Seguridad

```
AGENTE (empresa)                    FRONTEND (usuario)
     |                                    |
     | clave_secreta                      | JWT usuario
     | (nunca sale)                       |
     v                                    v
+--------------------------------------------------+
|                    BACKEND                        |
|                                                   |
|  1. Agente se autentica con clave_secreta        |
|  2. Backend genera codigo temporal (5 min)        |
|  3. Usuario ingresa codigo en modal               |
|  4. Backend valida codigo + user_id               |
|  5. Vincula workspace.agente_id                   |
|  6. Frontend solo conoce agente_id (publico)      |
+--------------------------------------------------+
                      |
                      v
              SUPABASE (con RLS)
```

---

## FASE 1: Base de Datos (Supabase)

### 1.1 Crear tabla `agentes`

```sql
-- Verificar si existe, si no, crear
CREATE TABLE IF NOT EXISTS agentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  clave_hash VARCHAR(255) NOT NULL,  -- bcrypt hash de la clave secreta
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para busqueda por clave (el backend hashea y compara)
CREATE INDEX IF NOT EXISTS idx_agentes_activo ON agentes(activo);
```

### 1.2 Crear tabla `codigos_vinculacion`

```sql
CREATE TABLE IF NOT EXISTS codigos_vinculacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(12) NOT NULL UNIQUE,  -- Codigo alfanumerico (ej: "X7K9-M2P4")
  agente_id UUID NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  expira_at TIMESTAMPTZ NOT NULL,  -- NOW() + 5 minutos
  usado BOOLEAN DEFAULT false,
  intentos_fallidos INT DEFAULT 0,  -- Para rate limiting
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para busqueda rapida de codigo
CREATE INDEX IF NOT EXISTS idx_codigos_codigo ON codigos_vinculacion(codigo) WHERE usado = false;

-- Limpiar codigos expirados automaticamente (funcion + trigger o cron)
```

### 1.3 Crear tabla `registradores`

```sql
CREATE TABLE IF NOT EXISTS registradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id UUID NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,  -- 'rele', 'analizador', etc.
  ubicacion VARCHAR(255),
  ip VARCHAR(45) NOT NULL,
  puerto INT NOT NULL DEFAULT 502,
  unit_id INT DEFAULT 1,
  indice_inicial INT NOT NULL DEFAULT 0,
  cantidad_registros INT NOT NULL DEFAULT 10,
  intervalo_segundos INT NOT NULL DEFAULT 60,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registradores_agente ON registradores(agente_id);
```

### 1.4 Modificar tabla `workspaces`

```sql
-- Agregar columna agente_id si no existe
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS agente_id UUID REFERENCES agentes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_agente ON workspaces(agente_id);
```

### 1.5 Crear tablas de lecturas dinamicas

Cada registrador tendra su propia tabla de lecturas:

```sql
-- Funcion para crear tabla de lecturas al crear registrador
CREATE OR REPLACE FUNCTION crear_tabla_lecturas()
RETURNS TRIGGER AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS lecturas_%s (
      id BIGSERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      valores JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_lecturas_%s_timestamp
    ON lecturas_%s(timestamp DESC);
  ', NEW.id, NEW.id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_crear_tabla_lecturas
AFTER INSERT ON registradores
FOR EACH ROW EXECUTE FUNCTION crear_tabla_lecturas();
```

### 1.6 Crear tabla `agente_logs` (auditoria)

```sql
CREATE TABLE IF NOT EXISTS agente_logs (
  id BIGSERIAL PRIMARY KEY,
  agente_id UUID NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
  accion VARCHAR(50) NOT NULL,  -- 'autenticacion', 'lectura', 'error', 'vinculacion'
  ip VARCHAR(45),
  detalles JSONB,  -- Datos adicionales segun la accion
  exito BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agente_logs_agente ON agente_logs(agente_id);
CREATE INDEX IF NOT EXISTS idx_agente_logs_created ON agente_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agente_logs_accion ON agente_logs(accion) WHERE exito = false;
```

### 1.7 Agregar rotacion de claves a `agentes`

```sql
-- Agregar columnas para rotacion de claves
ALTER TABLE agentes
ADD COLUMN IF NOT EXISTS clave_anterior_hash VARCHAR(255),  -- Clave anterior (valida por 24h tras rotacion)
ADD COLUMN IF NOT EXISTS clave_rotada_at TIMESTAMPTZ;  -- Cuando se roto la clave

-- La clave anterior permite transicion suave: agente puede usar clave vieja hasta reiniciar
```

### 1.8 Configurar Row Level Security (RLS) - COMPLETO

```sql
-- =============================================
-- RLS para tabla: registradores
-- =============================================
ALTER TABLE registradores ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: usuarios solo ven registradores de su agente vinculado
CREATE POLICY registradores_select ON registradores
FOR SELECT USING (
  agente_id IN (
    SELECT w.agente_id FROM workspaces w
    JOIN permisos_configuracion p ON p.workspace_id = w.id
    WHERE p.usuario_id = auth.uid()
  )
);

-- Policy INSERT: solo pueden insertar si tienen workspace vinculado a ese agente
CREATE POLICY registradores_insert ON registradores
FOR INSERT WITH CHECK (
  agente_id IN (
    SELECT w.agente_id FROM workspaces w
    JOIN permisos_configuracion p ON p.workspace_id = w.id
    WHERE p.usuario_id = auth.uid() AND p.rol IN ('admin', 'editor')
  )
);

-- Policy UPDATE: mismo criterio que INSERT
CREATE POLICY registradores_update ON registradores
FOR UPDATE USING (
  agente_id IN (
    SELECT w.agente_id FROM workspaces w
    JOIN permisos_configuracion p ON p.workspace_id = w.id
    WHERE p.usuario_id = auth.uid() AND p.rol IN ('admin', 'editor')
  )
);

-- Policy DELETE: solo admins
CREATE POLICY registradores_delete ON registradores
FOR DELETE USING (
  agente_id IN (
    SELECT w.agente_id FROM workspaces w
    JOIN permisos_configuracion p ON p.workspace_id = w.id
    WHERE p.usuario_id = auth.uid() AND p.rol = 'admin'
  )
);

-- =============================================
-- RLS para tabla: codigos_vinculacion
-- =============================================
ALTER TABLE codigos_vinculacion ENABLE ROW LEVEL SECURITY;

-- Solo el usuario que solicito puede ver/usar su codigo
CREATE POLICY codigos_select ON codigos_vinculacion
FOR SELECT USING (usuario_id = auth.uid());

-- Solo backend puede insertar (via service role, bypassa RLS)

-- =============================================
-- RLS para tabla: workspaces (verificar si ya existe)
-- =============================================
-- Si no tiene RLS, habilitarlo:
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Policy: usuarios solo ven workspaces donde tienen permiso o son creadores
CREATE POLICY workspaces_select ON workspaces
FOR SELECT USING (
  creado_por = auth.uid() OR
  id IN (
    SELECT workspace_id FROM permisos_configuracion
    WHERE usuario_id = auth.uid()
  )
);

-- =============================================
-- RLS para tablas dinamicas: lecturas_*
-- =============================================
-- NOTA: Las tablas lecturas_<id> se crean dinamicamente.
-- Para cada una, aplicar RLS en el trigger o via funcion:

CREATE OR REPLACE FUNCTION aplicar_rls_lecturas(tabla_nombre TEXT, registrador_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Habilitar RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tabla_nombre);

  -- Policy SELECT: usuarios con acceso al registrador pueden leer
  EXECUTE format('
    CREATE POLICY %I_select ON %I
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM registradores r
        JOIN workspaces w ON w.agente_id = r.agente_id
        JOIN permisos_configuracion p ON p.workspace_id = w.id
        WHERE r.id = %L AND p.usuario_id = auth.uid()
      )
    )
  ', tabla_nombre, tabla_nombre, registrador_id);

  -- INSERT: solo via service role (agente usa service role)
END;
$$ LANGUAGE plpgsql;

-- Modificar trigger crear_tabla_lecturas para llamar a aplicar_rls_lecturas
```

---

## FASE 2: Backend (lector-mediciones-backend)

### 2.1 Crear controlador de agentes

**Archivo:** `src/controllers/agentesController.js`

```javascript
// Funciones a implementar:

// 1. registrarAgente(clave_secreta)
//    - Verifica clave contra hash en BD
//    - Retorna agente_id si valido
//    - Usado por el agente al conectarse via WebSocket

// 2. solicitarVinculacion(workspace_id, user_id)
//    - Genera codigo temporal (8 chars, formato "XXXX-XXXX")
//    - Guarda en codigos_vinculacion con expira_at = NOW() + 5min
//    - Retorna codigo para mostrar en consola del agente

// 3. confirmarVinculacion(codigo, workspace_id, user_id)
//    - Valida codigo existe, no expirado, no usado
//    - Valida que user_id coincida con el que solicito
//    - Valida intentos_fallidos < 5
//    - Si valido: actualiza workspace.agente_id, marca codigo usado
//    - Si invalido: incrementa intentos_fallidos

// 4. desvincularAgente(workspace_id, user_id)
//    - Verifica que user_id sea admin del workspace
//    - Pone workspace.agente_id = NULL
```

### 2.2 Crear controlador de registradores

**Archivo:** `src/controllers/registradoresController.js`

```javascript
// Funciones a implementar:

// 1. listarRegistradores(workspace_id, user_id)
//    - Obtiene agente_id del workspace
//    - SELECT * FROM registradores WHERE agente_id = ?
//    - Retorna lista de registradores

// 2. crearRegistrador(workspace_id, user_id, datos)
//    - Obtiene agente_id del workspace
//    - INSERT con ese agente_id automaticamente
//    - Trigger crea tabla lecturas_<id>

// 3. actualizarRegistrador(registrador_id, user_id, datos)
//    - Verifica que registrador pertenece al agente del workspace del usuario
//    - UPDATE registradores

// 4. eliminarRegistrador(registrador_id, user_id)
//    - Verifica pertenencia
//    - DELETE (cascade elimina tabla lecturas_<id>)

// 5. obtenerTablasLecturas(workspace_id, user_id)
//    - Lista tablas lecturas_* vinculadas a registradores del agente
//    - Retorna nombres de tablas disponibles para las cards
```

### 2.3 Crear rutas API

**Archivo:** `src/routes/index.js` (agregar)

```javascript
// Agentes
router.post('/api/agentes/solicitar-vinculacion', auth, agentesController.solicitarVinculacion);
router.post('/api/agentes/confirmar-vinculacion', auth, agentesController.confirmarVinculacion);
router.post('/api/agentes/desvincular', auth, agentesController.desvincularAgente);
router.get('/api/workspaces/:workspaceId/agente', auth, agentesController.obtenerEstadoAgente);

// Registradores
router.get('/api/workspaces/:workspaceId/registradores', auth, registradoresController.listar);
router.post('/api/workspaces/:workspaceId/registradores', auth, registradoresController.crear);
router.put('/api/registradores/:id', auth, registradoresController.actualizar);
router.delete('/api/registradores/:id', auth, registradoresController.eliminar);

// Lecturas (para cards)
router.get('/api/workspaces/:workspaceId/tablas-lecturas', auth, registradoresController.obtenerTablasLecturas);
router.get('/api/lecturas/:tablaId/ultima', auth, lecturasController.obtenerUltimaLectura);
```

### 2.4 Modificar WebSocket para agentes

**Archivo:** `src/index.js` (modificar seccion WebSocket)

```javascript
// Eventos a agregar/modificar:

// 'agente:autenticar' - Agente envia clave_secreta
//   -> Backend verifica hash
//   -> Si valido: guarda socket.agente_id, emite 'agente:autenticado'
//   -> Si invalido: desconecta

// 'agente:solicitar-codigo' - Agente pide codigo de vinculacion
//   -> Backend genera codigo, lo guarda en BD
//   -> Emite 'agente:codigo-generado' con el codigo

// 'agente:sincronizar-config' - Agente pide config actualizada
//   -> Backend envia registradores del agente
//   -> Agente guarda en archivo local
```

---

## FASE 3: Agente (lector-mediciones-agente)

### 3.1 Modificar autenticacion

**Archivo:** `src/index.js`

```javascript
// Cambiar de CONFIGURACION_ID a AGENTE_CLAVE_SECRETA en .env
// Al conectar WebSocket:
// 1. Emitir 'agente:autenticar' con clave_secreta
// 2. Esperar 'agente:autenticado' antes de continuar
// 3. Si falla, reintentar con backoff exponencial
```

### 3.2 Implementar cache local de config

**Archivo:** `src/config/configLocal.js` (nuevo)

```javascript
// Funciones:
// - cargarConfigLocal() - Lee config.json si existe
// - guardarConfigLocal(config) - Escribe config.json
// - obtenerRegistradores() - Retorna registradores del cache

// El agente usa config local para operar
// Solo consulta BD cuando recibe comando 'sincronizar'
```

### 3.3 Modificar flujo de lecturas

```javascript
// Antes: leia de alimentadores en BD
// Ahora:
// 1. Lee registradores de config local (config.json)
// 2. Por cada registrador: consulta Modbus
// 3. Inserta en tabla lecturas_<registrador_id> via backend API
```

---

## FASE 4: Frontend (mi-app)

### 4.1 Implementar ModalConfigurarAgente

**Archivo:** `src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx`

Estados del modal:
1. **Sin vincular:** Muestra input para codigo + boton "Vincular"
2. **Vinculando:** Spinner mientras valida codigo
3. **Vinculado:** Muestra info del agente + boton "Desvincular"
4. **Error:** Mensaje de error (codigo invalido, expirado, etc.)

```jsx
// Estados:
// - estadoVinculacion: 'sin_vincular' | 'vinculando' | 'vinculado' | 'error'
// - codigoIngresado: string
// - infoAgente: { nombre, activo, registradoresCount }
// - error: string | null

// Al abrir modal:
// - GET /api/workspaces/:id/agente
// - Si tiene agente_id -> estadoVinculacion = 'vinculado'
// - Si no tiene -> estadoVinculacion = 'sin_vincular'

// Al vincular:
// - POST /api/agentes/confirmar-vinculacion { codigo }
// - Si exito -> recargar info, mostrar vinculado
// - Si error -> mostrar mensaje, incrementar contador local

// Al desvincular:
// - Modal de confirmacion
// - POST /api/agentes/desvincular
```

### 4.2 Crear pantalla de Registradores

**Nueva ruta:** `/registradores` o seccion dentro del modal

Funcionalidades:
- Listar registradores del agente vinculado
- Crear nuevo registrador (form con ip, puerto, etc.)
- Editar registrador existente
- Eliminar registrador (con confirmacion)
- Boton "Sincronizar Agente" -> envia comando via WebSocket

### 4.3 Modificar ModalConfiguracionAlimentador

**Archivo:** `src/paginas/PaginaAlimentadores/componentes/modales/ModalConfiguracionAlimentador.jsx`

Cambios:
- Remover campos de IP, puerto, indice, cantidad
- Agregar selector "Tabla de lecturas" (dropdown)
- Agregar selector "Columna/Registro" (dropdown, depende de tabla)
- Agregar campo "Intervalo de actualizacion" (cada cuanto leer de la tabla)

```jsx
// Al abrir:
// - GET /api/workspaces/:id/tablas-lecturas
// - Poblar dropdown con nombres de tablas

// Al seleccionar tabla:
// - Mostrar columnas disponibles (reg_0, reg_1, etc.)

// Al guardar:
// - Guardar referencia: { tabla_id, columna, intervalo }
```

---

## FASE 5: Mitigaciones de Seguridad

### 5.1 Rate Limiting en vinculacion

```javascript
// En confirmarVinculacion():
// - Si intentos_fallidos >= 5: rechazar, pedir nuevo codigo
// - Incrementar intentos_fallidos en cada fallo
// - Loggear IP + user_id de intentos fallidos
```

### 5.2 Codigos robustos

```javascript
// Generar codigos de 8 caracteres: "XXXX-XXXX"
// Caracteres: A-Z, 0-9 (sin O, 0, I, 1 para evitar confusion)
// = 32^8 = 1 trillon de combinaciones
// Expiracion: 5 minutos
```

### 5.3 Validacion de propiedad

```javascript
// Al solicitar vinculacion:
// - Guardar user_id que solicito
// Al confirmar:
// - Verificar que user_id coincida
// - Evita que alguien use codigo ajeno
```

### 5.4 Monitoreo de agentes

```javascript
// Tabla: agente_logs
// - agente_id, accion, ip, timestamp
// - Registrar: autenticaciones, lecturas, errores
// - Alertar si: muchas autenticaciones fallidas, IP inusual
```

---

## Orden de Implementacion Sugerido

1. **BD:** Crear tablas agentes, codigos_vinculacion, registradores
2. **BD:** Modificar workspaces (agregar agente_id)
3. **BD:** Configurar RLS basico
4. **Backend:** Controlador agentes (autenticar, vincular)
5. **Backend:** Rutas API de agentes
6. **Frontend:** ModalConfigurarAgente (vincular/desvincular)
7. **Agente:** Modificar autenticacion con clave
8. **Backend:** Controlador registradores
9. **Frontend:** Pantalla/modal de registradores
10. **BD:** Funcion crear_tabla_lecturas + trigger
11. **Agente:** Cache local + nuevo flujo lecturas
12. **Frontend:** Modificar ModalConfiguracionAlimentador
13. **Seguridad:** Rate limiting, logs, monitoreo

---

## Verificaciones Pre-Implementacion

Antes de cada paso, verificar:

- [ ] Tabla/columna ya existe? -> Solo modificar si necesario
- [ ] Endpoint ya existe? -> Verificar firma y comportamiento
- [ ] Componente ya existe? -> Extender, no recrear
- [ ] Tests existentes? -> No romperlos

---

## Notas Adicionales

- El agente actual usa `CONFIGURACION_ID` en .env -> Migrar a `AGENTE_CLAVE_SECRETA`
- La tabla `lecturas` actual puede coexistir con las nuevas `lecturas_<id>`
- Mantener retrocompatibilidad durante migracion
- El modal ModalConfigurarAgente.jsx ya existe (vacio) -> Implementar contenido

---

## Referencias de Archivos

**Frontend (mi-app):**
- `src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx`
- `src/paginas/PaginaAlimentadores/componentes/modales/ModalConfiguracionAlimentador.jsx`
- `src/paginas/PaginaAlimentadores/contexto/ContextoAlimentadoresSupabase.jsx`

**Backend (lector-mediciones-backend):**
- `src/controllers/` (crear agentesController.js, registradoresController.js)
- `src/routes/index.js`
- `src/index.js` (WebSocket)

**Agente (lector-mediciones-agente):**
- `src/index.js`
- `src/servicios/websocketService.js`
- `.env` (cambiar CONFIGURACION_ID por AGENTE_CLAVE_SECRETA)
