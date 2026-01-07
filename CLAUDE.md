# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RelayWatch** es un sistema de monitoreo para relés de protección ABB Serie 615 (REF615/RET615) en la subestación CELTA 1. El sistema permite supervisar remotamente corrientes, tensiones, estados de interruptores y alarmas vía protocolo Modbus TCP.

### Ecosistema de Repositorios

El proyecto se compone de **3 repositorios independientes**:

| Repositorio | Ubicación | Propósito |
|-------------|-----------|-----------|
| **Frontend** | `C:\Users\santi\OneDrive\Escritorio\proyecto-Lector-de-Mediciones\mi-app` | Aplicación React + Vite para visualización |
| **Backend** | `C:\Users\santi\OneDrive\Escritorio\lector-mediciones-backend` | API REST Express + Supabase |
| **Agente** | `C:\Users\santi\OneDrive\Escritorio\lector-mediciones-electron` | App Electron que lee Modbus y envía al backend |

---

## Stack & Conventions

### Obligatorias

- **Package manager:** npm (nunca pnpm ni yarn)
- **Framework frontend:** React 18 + Vite
- **Estilos:** CSS vanilla con archivos `.css` por componente
- **Backend:** Express.js + Supabase
- **Agente:** Electron + modbus-serial
- **Lenguaje:** JavaScript con JSDoc para tipos. Migración gradual a TypeScript es bienvenida.
- **Idioma del código:** Variables, funciones y comentarios en español

### Convenciones de Código

```javascript
// ✅ CORRECTO - Nombres descriptivos en español
const alimentadoresActivos = obtenerAlimentadoresConLectura();
const esAlimentadorValido = validarConfiguracion(alimentador);

// ❌ INCORRECTO - Mezcla de idiomas o nombres genéricos
const activeItems = getItems();
const data = fetch();
```

### Imports

```javascript
// ✅ CORRECTO - Imports explícitos
import { IconBolt, IconSettings } from '@tabler/icons-react';

// ❌ INCORRECTO - Barrel imports
import * as Icons from '@tabler/icons-react';
```

---

## Development Commands

### Frontend (`mi-app/`)

```bash
npm install           # Instalar dependencias
npm run dev           # Servidor desarrollo (http://localhost:5173)
npm run build         # Build producción
npm run lint          # Verificar código
npm run preview       # Preview del build
```

### Backend (`lector-mediciones-backend/`)

```bash
npm install           # Instalar dependencias
npm run dev           # Servidor desarrollo con nodemon (puerto 3001)
npm start             # Servidor producción
```

### Agente Electron (`lector-mediciones-electron/`)

```bash
npm install           # Instalar dependencias
npm run dev           # Modo desarrollo con hot-reload
npm run build         # Build para distribución
npm run build:win     # Build Windows .exe
```

### Setup Completo (requiere 3 terminales)

```bash
# Terminal 1 - Backend
cd lector-mediciones-backend && npm run dev

# Terminal 2 - Frontend
cd proyecto-Lector-de-Mediciones/mi-app && npm run dev

# Terminal 3 - Agente (opcional, para lecturas reales)
cd lector-mediciones-electron && npm run dev
```

---

## Architecture

### Frontend - State Management

Usa **React Context + Custom Hooks** (NO Redux):

```
src/
├── paginas/
│   └── PaginaAlimentadores/
│       ├── contexto/
│       │   └── ContextoAlimentadores.jsx   # Provider principal
│       ├── hooks/
│       │   ├── usarPuestos.js              # CRUD puestos/alimentadores
│       │   ├── usarMediciones.js           # Polling Modbus, lecturas en vivo
│       │   └── usarArrastrarSoltar.js      # Drag & drop
│       ├── utilidades/
│       │   ├── clienteModbus.js            # Cliente Modbus (sim/real)
│       │   └── calculosMediciones.js       # Fórmulas de conversión
│       └── componentes/                     # UI components
```

### Backend - API Structure

```
src/
├── config/
│   └── supabase.js                # Cliente Supabase
├── middleware/
│   ├── auth.js                    # JWT usuarios (Supabase Auth)
│   └── authAgente.js              # JWT agentes
├── controladores/
│   ├── alimentadoresController.js
│   ├── puestosController.js
│   ├── workspacesController.js
│   ├── agenteApiController.js     # Endpoints para el agente
│   └── ...
├── servicios/
│   └── notificacionesService.js   # Firebase Cloud Messaging
└── routes.js                      # Definición de rutas
```

### Agente Electron - Architecture

```
src/
├── main/
│   └── index.js                   # Proceso principal Electron
├── preload/
│   └── index.js                   # Bridge IPC seguro
├── renderer/                      # UI del agente
└── servicios/
    ├── backendRest.js             # Cliente REST hacia backend
    └── modbus.js                  # Lectura Modbus TCP
```

### Data Flow

```
┌─────────────────┐    Modbus TCP    ┌─────────────────┐
│  Relés ABB 615  │ ◄──────────────► │  Agente Electron │
│  (172.16.0.x)   │    Puerto 502    │                  │
└─────────────────┘                  └────────┬─────────┘
                                              │
                                     REST API │ JWT
                                              ▼
                                    ┌─────────────────┐
                                    │    Backend      │
                                    │  Express:3001   │
                                    └────────┬────────┘
                                              │
                                    Supabase  │
                                              ▼
                                    ┌─────────────────┐
                                    │   PostgreSQL    │
                                    │   (Supabase)    │
                                    └────────┬────────┘
                                              │
                                     REST API │ JWT
                                              ▼
                                    ┌─────────────────┐
                                    │    Frontend     │
                                    │  React:5174     │
                                    └─────────────────┘
```

---

## Modbus & Relay Configuration

### Parámetros de Conexión

| Parámetro | Valor |
|-----------|-------|
| Protocolo | Modbus TCP |
| Puerto | 502 |
| Red | 172.16.0.x |
| Función lectura | 03 (Read Holding Registers) |
| **Offset** | Manual ABB - 1 = Código Modbus |

⚠️ **CRÍTICO:** Siempre restar 1 al número de registro del manual ABB.
- Manual dice 173 → usar 172 en código

### Inventario de Equipos CELTA 1

| Ubicación | Modelo | IP | CT | Mide Tensión |
|-----------|--------|-----|-----|--------------|
| Alimentador 1-4, 8 | REF615 | 172.16.0.1-4, 8 | 1A | No |
| TERNA 3 | REF615 | 172.16.0.11 | 5A | Sí |
| TERNA 4 | REF615 | 172.16.0.12 | 5A | Sí |
| TRAFO 1 Salida 33kV | REF615 | 172.16.0.6 | 5A | No |
| TRAFO 1 Dif 13.2kV | RET615 | 172.16.0.5 | 5A | Sí |
| TRAFO 2 Salida 33kV | REF615 | 172.16.0.9 | 5A | No |
| TRAFO 2 Dif 13.2kV | RET615 | 172.16.0.7 | 5A | Sí |
| TRAFO 3 Dual | RET615 | 172.16.0.10 | 5A | Sí |

### Registros Clave (Base 0 - listos para código)

```javascript
// Monitoreo básico (todos los equipos)
const REGISTROS = {
  SSR1_READY: 127,        // Estado Ready
  SSR3_EVENTOS: 129,      // Eventos/fallas pendientes
  SSR5_ALIVE: 131,        // Heartbeat del relé
  START_TRIP: 170,        // Detección de disparos
  LEDS_STATUS: 172,       // Alarmas visibles (LEDs)
  
  // Corrientes (CMMXU1)
  IL1: 137,               // Corriente fase L1
  IL2: 138,               // Corriente fase L2
  IL3: 139,               // Corriente fase L3
  IO: 141,                // Corriente residual (solo RET615)
  
  // Tensiones (solo equipos con TV)
  UL1: 151,
  UL2: 152,
  UL3: 153,
  
  // Potencias (TERNAs)
  P_TOTAL: 160,
  Q_TOTAL: 161,
  S_TOTAL: 162,
  FP: 166,
};
```

### Ratios TI/TV por Equipo

Los valores Modbus vienen multiplicados por 1000. La fórmula es:
```javascript
const corrienteReal = (valorModbus / 1000) * ratioTI;
```

| Equipo | Ratio TI (CT) | Ratio TV (VT) |
|--------|---------------|---------------|
| Alimentadores 1-4, 8 | 400/1 | N/A |
| TERNAs | 100/5 | 33000/110 |
| TRAFO 1 HV (33kV) | 250/5 | N/A |
| TRAFO 1 MV (13.2kV) | 250/5 | 13200/110 |
| TRAFO 2 HV | 100/5 | N/A |
| TRAFO 2 MV | 250/5 | 13200/110 |
| TRAFO 3 HV | 200/5 | N/A |
| TRAFO 3 MV | 500/5 | 13200/110 |

---

## Refactoring Guidelines

### ⚠️ ESTADO ACTUAL: Código que necesita refactorización

El código actual tiene archivos muy extensos y funciones con múltiples responsabilidades. El objetivo es:

1. **Modularizar** - Dividir archivos grandes en módulos pequeños
2. **Single Responsibility** - Cada función/componente hace UNA cosa
3. **Eliminar código muerto** - Remover código no utilizado
4. **Documentar** - JSDoc en funciones públicas

### Reglas de Tamaño

| Elemento | Máximo Recomendado |
|----------|-------------------|
| Archivo JS/JSX | 200 líneas |
| Función | 30 líneas |
| Componente React | 100 líneas |
| Parámetros de función | 3 (usar objeto si más) |

### Estructura de Carpetas Objetivo

```
src/
├── componentes/
│   ├── comunes/              # Componentes reutilizables
│   │   ├── Boton/
│   │   │   ├── Boton.jsx
│   │   │   ├── Boton.test.js
│   │   │   └── index.js
│   │   ├── Modal/
│   │   └── Tarjeta/
│   └── dominio/              # Componentes específicos del negocio
│       ├── alimentadores/
│       ├── puestos/
│       └── mediciones/
├── hooks/                    # Custom hooks globales
├── servicios/                # Llamadas API, Modbus
├── utilidades/               # Helpers puros (sin side effects)
├── constantes/               # Valores fijos, enums
├── tipos/                    # JSDoc typedefs o .d.ts
└── paginas/                  # Componentes de página (rutas)
```

### Patrón de Componentes

```jsx
// ✅ CORRECTO - Componente pequeño, single responsibility
// TarjetaAlimentador.jsx
export function TarjetaAlimentador({ alimentador, lecturas, onClick }) {
  const { nombre, id } = alimentador;
  const corriente = lecturas?.IL1 ?? 0;
  
  return (
    <div className="p-4 bg-white rounded-lg shadow" onClick={() => onClick(id)}>
      <h3 className="font-semibold">{nombre}</h3>
      <ValorCorriente valor={corriente} />
    </div>
  );
}

// ❌ INCORRECTO - Componente haciendo demasiado
export function TarjetaAlimentador({ alimentador }) {
  const [lecturas, setLecturas] = useState(null);
  const [editando, setEditando] = useState(false);
  const [historial, setHistorial] = useState([]);
  // ... 200 líneas más de lógica
}
```

### Patrón de Hooks

```javascript
// ✅ CORRECTO - Hook con responsabilidad única
// usarLecturasAlimentador.js
export function usarLecturasAlimentador(alimentadorId) {
  const [lecturas, setLecturas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Solo lógica de fetching
  }, [alimentadorId]);

  return { lecturas, cargando, error };
}
```

### Detección de Código Muerto

Antes de refactorizar, verificar código no usado:

```bash
# Buscar exports no importados
npx unimported

# Buscar funciones no llamadas (manual)
grep -r "function nombreFuncion" src/
grep -r "nombreFuncion(" src/
```

---

## Code Quality

### ESLint

El proyecto usa ESLint. Antes de commitear:

```bash
npm run lint
```

### Naming Conventions

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase | `TarjetaAlimentador` |
| Funciones | camelCase, verbo | `obtenerLecturas()` |
| Hooks | camelCase, "usar" | `usarMediciones()` |
| Constantes | SCREAMING_SNAKE | `MAX_REINTENTOS` |
| Archivos componentes | PascalCase.jsx | `TarjetaAlimentador.jsx` |
| Archivos utils | camelCase.js | `calculosMediciones.js` |

### JSDoc para Tipos

```javascript
/**
 * @typedef {Object} Alimentador
 * @property {string} id - UUID del alimentador
 * @property {string} nombre - Nombre descriptivo
 * @property {string} ip - Dirección IP del relé
 * @property {number} puerto - Puerto Modbus (usualmente 502)
 * @property {number} ratioTI - Ratio del transformador de corriente
 */

/**
 * Obtiene las lecturas de un alimentador
 * @param {string} alimentadorId - ID del alimentador
 * @returns {Promise<{corrientes: number[], tensiones: number[]}>}
 */
async function obtenerLecturas(alimentadorId) {
  // ...
}
```

### Accesibilidad

- HTML semántico (`<button>` no `<div onClick>`)
- Atributos `aria-*` cuando aplique
- Gestión de foco en modales
- Contraste de colores suficiente

---

## Routing (Frontend)

```javascript
// App.jsx
<Routes>
  <Route path="/" element={<PaginaLogin />} />
  <Route path="/registro" element={<PaginaRegistro />} />
  <Route path="/recuperarContraseña" element={<RecuperarContrasena />} />
  <Route path="/alimentadores" element={<PaginaAlimentadores />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

---

## API Endpoints (Backend)

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/agente/auth` | Login del agente (clave secreta) |
| POST | `/api/agente/heartbeat` | Keep-alive del agente |

### Usuarios y Workspaces

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/usuarios/perfil` | JWT | Obtener perfil |
| GET | `/api/workspaces` | JWT | Listar workspaces |
| POST | `/api/workspaces` | JWT | Crear workspace |

### Alimentadores

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/puestos/:puestoId/alimentadores` | JWT | Listar |
| POST | `/api/puestos/:puestoId/alimentadores` | JWT | Crear |
| PUT | `/api/alimentadores/:id` | JWT | Actualizar |
| DELETE | `/api/alimentadores/:id` | JWT | Eliminar |

### Lecturas

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/alimentadores/:id/lecturas` | JWT | Últimas lecturas |
| GET | `/api/alimentadores/:id/lecturas/historico` | JWT | Historial |
| POST | `/api/agente/lecturas` | JWT Agente | Enviar lecturas (desde agente) |

---

## Environment Variables

### Frontend (`.env`)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (`.env`)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=tu-secreto-jwt
PORT=3001

# Firebase (opcional, para push notifications)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Agente (`.env`)

```env
BACKEND_URL=http://localhost:3001
CLAVE_SECRETA=clave-del-agente
```

---

## Agent Behavior Rules

### Antes de Ejecutar Código

1. **Si la petición no está clara** → Hacer preguntas concretas
2. **Tareas simples** → Ejecutar directamente
3. **Cambios complejos** (refactors, nuevas features) → Confirmar entendimiento antes

### Antes de Commitear

```bash
npm run lint          # Sin errores
npm run build         # Build exitoso
```

### Pull Requests

- Título: `[repo] Descripción clara y concisa`
- PRs pequeños y enfocados
- Explicar qué cambió, por qué, y cómo se verificó

### No Asumir

- No asumir requisitos implícitos
- Si falta información, preguntar
- No adivinar rendimiento → medir
- Validar cambios pequeños antes de escalar

---

## Common Tasks

### Agregar un nuevo tipo de relé

1. Agregar configuración en `constantes/tiposRele.js`
2. Definir registros Modbus específicos
3. Crear template de configuración
4. Agregar al selector en UI

### Agregar una nueva medición

1. Identificar registro Modbus en manual ABB
2. Restar 1 para obtener dirección real
3. Agregar a `REGISTROS` en constantes
4. Implementar fórmula de conversión en `calculosMediciones.js`
5. Agregar visualización en componentes

### Depurar conexión Modbus

```javascript
// En el agente, habilitar logs detallados
console.log(`[Modbus] Conectando a ${ip}:${puerto}`);
console.log(`[Modbus] Leyendo registros ${inicio} a ${inicio + cantidad}`);
console.log(`[Modbus] Respuesta:`, data);
```

---

## Documentation References

### Documentación General
- [Documentación Relés ABB Serie 615](./docs/Documentación%20Relés%20ABB%20Serie%20615.pdf)
- [Especificación Modbus CELTA 1](./docs/Especificacion_Modbus_CELTA1.pdf)

### Manuales Modbus - REF615 (Alimentadores y Ternas)
- [REF615 Modbus Point List v3.0 Rev C](./docs/Manual%20modbus%20para%20Reles%20alimentadores%20y%20ternas/REF615_modbuspoint_756581_ENc%20(3.0%20(Rev%20C)).pdf)
- [REF615 Modbus Point List v5.0 FP1 Rev L](./docs/Manual%20modbus%20para%20Reles%20alimentadores%20y%20ternas/REF615_modbuspoint_756581_ENl__5.0%20FP1%20IEC%20(Rev%20L).pdf)

### Manuales Modbus - RET615 (Trafos)
- [RET615 Modbus Point List v3.0 Rev C](./docs/Manual%20modbus%20para%20Reles%20Trafos/RET615_modbuspoint_756878_ENc_3.0%20(Rev%20C).pdf)
- [RET615 Modbus Point List v5.0 FP1 Rev H](./docs/Manual%20modbus%20para%20Reles%20Trafos/RET615_modbuspoint_756878_ENh_5.0%20FP1%20IEC%20(Rev%20H)%20.pdf)

### Documentación Adicional RET615
- [RET615 Application Manual](./docs/Documentación%20Adicional%20Útil/RET615%20Application%20Manual_756886_ENa.pdf)
- [RET615 Product Guide](./docs/Documentación%20Adicional%20Útil/RET615%20Product%20Guide_756891_ENm.pdf)
