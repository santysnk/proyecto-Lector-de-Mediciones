# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RelayWatch is an educational React + Vite web application for monitoring electrical feeders. It manages "puestos" (stations) containing "alimentadores" (feeders) with simulated/real Modbus readings for relays and analyzers.

## Development Commands

All commands run from `mi-app/` directory:

```bash
# Install dependencies
npm install

# Start development server (typically http://localhost:5174)
npm run dev

# Start json-server for user authentication (port 4000)
npm run db

# Start Modbus backend server (port 5000)
npm run backend

# Lint code
npm run lint

# Build for production
npm run build
```

**Full development setup requires 3 terminals:**
1. `npm run db` - User database API
2. `npm run backend` - Modbus server
3. `npm run dev` - React app

## Architecture

### State Management Pattern
Uses React Context + Custom Hooks (not Redux):
- `ContextoAlimentadores.jsx` - Main context combining puestos and mediciones hooks
- `usarPuestos.js` - CRUD for puestos/alimentadores, persists to localStorage
- `usarMediciones.js` - Modbus polling timers, live readings state

### Data Flow
```
Modbus (simulated/real) → clienteModbus.js → usarMediciones hook
    → registrosEnVivo state → calculosMediciones.js (formulas)
    → lecturasTarjetas → TarjetaAlimentador components
```

### Key Directories
- `src/paginas/PaginaAlimentadores/` - Main application logic
  - `contexto/` - React Context provider
  - `hooks/` - Custom hooks (usarPuestos, usarMediciones, usarArrastrarSoltar)
  - `utilidades/` - Modbus client, calculations, localStorage helpers
  - `constantes/` - Storage keys, colors, measurement labels
  - `componentes/` - UI components (tarjetas, modales, navegacion)

### Modbus Mode
In `src/paginas/PaginaAlimentadores/utilidades/clienteModbus.js`:
```javascript
export const MODO_MODBUS = "simulado"; // or "real"
```
- `"simulado"` - Generates random values (0-500) for testing
- `"real"` - Calls Express backend at port 5000

### Storage
- `localStorage` - Puestos, alimentadores config, selected puesto
- `db.json` + json-server - User authentication (port 4000)

### Routing
```
/                    → PaginaLogin
/registro            → PaginaRegistro
/recuperarContraseña → RecuperarContrasena
/alimentadores       → PaginaAlimentadores (main dashboard)
```

## Path Alias
`@/` maps to `src/` (configured in vite.config.js)

## Language
Code comments and variable names are in Spanish. User-facing text is in Spanish.
