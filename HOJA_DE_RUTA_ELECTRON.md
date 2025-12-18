# Hoja de Ruta: Migración del Agente a Electron

## Resumen Ejecutivo

Migrar el agente actual (Node.js CLI con blessed/web) a una aplicación de escritorio con Electron + React, manteniendo **todas** las funcionalidades existentes.

---

## Fase 1: Configuración del Proyecto Electron

### 1.1 Crear estructura base
- [ ] Crear nuevo proyecto con `electron-vite` o `electron-forge` + React
- [ ] Configurar estructura de carpetas:
  ```
  lector-mediciones-electron/
  ├── src/
  │   ├── main/           # Proceso principal (Node.js)
  │   │   ├── index.js    # Entry point Electron
  │   │   ├── modbus/     # Cliente Modbus (migrar)
  │   │   ├── servicios/  # REST service (migrar)
  │   │   └── polling/    # Lógica de polling (migrar)
  │   ├── preload/        # Bridge seguro main↔renderer
  │   │   └── index.js
  │   └── renderer/       # UI React
  │       ├── App.jsx
  │       ├── componentes/
  │       └── hooks/
  ├── electron.vite.config.js
  └── package.json
  ```
- [ ] Configurar scripts de desarrollo (`npm run dev`) y build (`npm run build`)
- [ ] Configurar empaquetado para Windows (electron-builder)

### 1.2 Configurar variables de entorno
- [ ] Migrar sistema de `.env` compatible con Electron
- [ ] Implementar pantalla de configuración inicial si no existe `.env`

---

## Fase 2: Migrar Proceso Principal (Main Process)

### 2.1 Migrar cliente Modbus
- [ ] Copiar `src/modbus/clienteModbus.js` al main process
- [ ] Verificar compatibilidad de `modbus-serial` con Electron
- [ ] Mantener funciones:
  - `leerRegistrosModbus()`
  - `testConexionModbus()`

### 2.2 Migrar servicio REST
- [ ] Copiar `src/servicios/restService.js` al main process
- [ ] Mantener todas las funciones:
  - `autenticar()` - POST `/api/agente/auth`
  - `enviarHeartbeat()` - cada 30s
  - `obtenerConfiguracion()` - polling cada 10s
  - `enviarLecturas()` - por cada lectura
  - `obtenerTestsPendientes()` - polling cada 5s
  - `reportarResultadoTest()` - por cada test
  - `enviarLog()` - on demand
  - `vincularWorkspace()` - on demand
- [ ] Mantener sistema de hash para detectar cambios de config
- [ ] Mantener retry automático de token expirado

### 2.3 Migrar lógica de polling
- [ ] Migrar sistema de intervalos por registrador
- [ ] Mantener escalonamiento por IP (staggering):
  ```javascript
  // Si 2 registradores comparten IP con intervalo 60s:
  // reg1: delay 0ms, luego cada 60s
  // reg2: delay 30s, luego cada 60s
  ```
- [ ] Mantener Maps:
  - `intervalosLectura` (registradorId → intervalId)
  - `contadoresProxLectura` (registradorId → segundos)
- [ ] Mantener funciones:
  - `iniciarPolling()`
  - `detenerPolling()`
  - `iniciarPollingRegistrador()`
  - `detenerPollingRegistrador()`
  - `actualizarRegistradoresGranular()`
  - `calcularDelayEscalonado()`

### 2.4 Migrar ejecución de tests
- [ ] Mantener `ejecutarTestConexion()`
- [ ] Mantener Set `testsEnProceso` para evitar duplicados

---

## Fase 3: Crear Preload Bridge (IPC)

### 3.1 Definir API de comunicación
- [ ] Crear `preload/index.js` con contextBridge:
  ```javascript
  contextBridge.exposeInMainWorld('electronAPI', {
    // Estado
    onEstadoConexion: (callback) => ipcRenderer.on('estado-conexion', callback),
    onAgenteDatos: (callback) => ipcRenderer.on('agente-datos', callback),
    onRegistradoresActualizados: (callback) => ipcRenderer.on('registradores', callback),
    onLogNuevo: (callback) => ipcRenderer.on('log', callback),
    onContadorActualizado: (callback) => ipcRenderer.on('contador', callback),

    // Acciones
    recargarRegistradores: () => ipcRenderer.invoke('recargar'),
    detenerPolling: () => ipcRenderer.invoke('detener'),
    iniciarPolling: () => ipcRenderer.invoke('iniciar'),

    // Configuración
    getConfig: () => ipcRenderer.invoke('get-config'),
    setConfig: (config) => ipcRenderer.invoke('set-config', config),
  });
  ```

### 3.2 Implementar handlers en main
- [ ] Crear handlers IPC para cada acción
- [ ] Emitir eventos al renderer cuando cambie el estado

---

## Fase 4: Crear UI con React (Renderer Process)

### 4.1 Diseñar layout principal
- [ ] Header con:
  - Estado de conexión (indicador verde/rojo)
  - Nombre del agente
  - Workspace(s) vinculado(s)
  - Tiempo activo (HH:MM:SS)
- [ ] Panel de registradores (tabla/cards):
  - Nombre
  - IP:Puerto
  - Rango de registros
  - Intervalo
  - Próxima lectura (countdown)
  - Estado (activo/error/inactivo/leyendo)
  - Estadísticas (exitosas/fallidas)
- [ ] Panel de logs:
  - Timestamp
  - Tipo (éxito/error/warning/info)
  - Mensaje
  - Scroll automático
- [ ] Barra de acciones:
  - Botón recargar
  - Botón iniciar/detener polling
  - Menú de configuración

### 4.2 Crear componentes React
- [ ] `<Header />` - Info del agente y estado
- [ ] `<TablaRegistradores />` - Lista de registradores
- [ ] `<FilaRegistrador />` - Cada registrador individual
- [ ] `<BadgeEstado />` - Indicador visual de estado
- [ ] `<ContadorProximaLectura />` - Countdown animado
- [ ] `<PanelLogs />` - Lista de logs con filtros
- [ ] `<LineaLog />` - Cada entrada de log
- [ ] `<ModalConfiguracion />` - Editar .env
- [ ] `<ModalAyuda />` - Atajos y documentación

### 4.3 Crear hooks personalizados
- [ ] `useElectronAPI()` - Acceso al bridge
- [ ] `useEstadoAgente()` - Estado de conexión y datos
- [ ] `useRegistradores()` - Lista y actualizaciones
- [ ] `useLogs()` - Historial de logs
- [ ] `useTiempoActivo()` - Contador de uptime

### 4.4 Implementar estilos
- [ ] Tema oscuro (similar a terminal actual)
- [ ] Colores por estado:
  - Verde: activo/conectado/éxito
  - Rojo: error/desconectado
  - Amarillo: esperando/warning
  - Gris: inactivo
- [ ] Animaciones suaves en transiciones
- [ ] Responsive (mínimo 800x600)

---

## Fase 5: Funcionalidades de Ventana Electron

### 5.1 Configurar ventana principal
- [ ] Tamaño mínimo: 800x600
- [ ] Icono de aplicación personalizado
- [ ] Título dinámico: "Agente - [Nombre] - [Estado]"
- [ ] Menú de aplicación (Archivo, Ver, Ayuda)

### 5.2 System Tray (bandeja del sistema)
- [ ] Icono en bandeja del sistema
- [ ] Menú contextual:
  - Mostrar/Ocultar ventana
  - Estado: Conectado/Desconectado
  - Polling: Activo/Detenido
  - Salir
- [ ] Minimizar a bandeja en lugar de cerrar
- [ ] Notificaciones nativas:
  - Error de conexión
  - Registrador con errores repetidos
  - Reconexión exitosa

### 5.3 Auto-inicio (opcional)
- [ ] Opción para iniciar con Windows
- [ ] Iniciar minimizado en bandeja

---

## Fase 6: Migrar Scripts de Utilidad

### 6.1 Integrar funcionalidad de crear-agente.js
- [ ] Opción en menú o modal para crear nuevo agente
- [ ] Mostrar clave secreta generada
- [ ] Copiar al portapapeles

### 6.2 Integrar funcionalidad de check-lecturas.js
- [ ] Panel o modal para ver últimas lecturas
- [ ] Conexión directa a Supabase (opcional, modo debug)

---

## Fase 7: Testing y Validación

### 7.1 Validar funcionalidades core
- [ ] Autenticación con backend
- [ ] Polling de configuración (detecta cambios)
- [ ] Heartbeat cada 30s
- [ ] Lectura Modbus TCP
- [ ] Escalonamiento por IP funciona
- [ ] Tests de conexión desde frontend
- [ ] Actualización granular sin reiniciar todo
- [ ] Manejo de errores (timeout, desconexión)
- [ ] Retry de token expirado

### 7.2 Validar UI
- [ ] Countdown de próxima lectura preciso
- [ ] Estados visuales correctos
- [ ] Logs se actualizan en tiempo real
- [ ] Scroll funciona en todos los paneles
- [ ] Responsive en diferentes tamaños

### 7.3 Validar Electron
- [ ] Minimizar a bandeja funciona
- [ ] Notificaciones aparecen
- [ ] Menú contextual funciona
- [ ] Auto-inicio funciona (si se implementa)

---

## Fase 8: Build y Distribución

### 8.1 Configurar electron-builder
- [ ] Configurar para Windows (NSIS installer)
- [ ] Icono de aplicación (.ico)
- [ ] Metadata (nombre, versión, autor)
- [ ] Asociar con extensión .env (opcional)

### 8.2 Optimizar bundle
- [ ] Excluir devDependencies
- [ ] Minificar código renderer
- [ ] Verificar tamaño final (~100-150MB esperado)

### 8.3 Crear instalador
- [ ] Generar .exe instalador
- [ ] Probar instalación limpia
- [ ] Probar actualización
- [ ] Probar desinstalación

---

## Fase 9: Documentación

### 9.1 Actualizar README
- [ ] Instrucciones de instalación
- [ ] Requisitos del sistema
- [ ] Configuración inicial
- [ ] Troubleshooting común

### 9.2 Documentar desarrollo
- [ ] Cómo clonar y ejecutar en desarrollo
- [ ] Cómo hacer build
- [ ] Arquitectura del proyecto

---

## Resumen de Funcionalidades a Mantener

| Funcionalidad | Origen | Destino |
|---------------|--------|---------|
| Autenticación con clave secreta | restService.js | main/servicios/ |
| Polling de config cada 10s | restService.js | main/servicios/ |
| Hash para detectar cambios | restService.js | main/servicios/ |
| Polling de tests cada 5s | restService.js | main/servicios/ |
| Heartbeat cada 30s | restService.js | main/servicios/ |
| Envío de lecturas | restService.js | main/servicios/ |
| Lectura Modbus TCP | clienteModbus.js | main/modbus/ |
| Test de conexión Modbus | clienteModbus.js | main/modbus/ |
| Escalonamiento por IP | index.js | main/polling/ |
| Actualización granular | index.js | main/polling/ |
| Contadores de próxima lectura | index.js | main/polling/ |
| Prevención de tests duplicados | index.js | main/polling/ |
| UI con estado en tiempo real | terminal.js/webServer.js | renderer/React |
| Logs con tipos y colores | terminal.js | renderer/componentes/ |
| Tiempo activo | terminal.js | renderer/hooks/ |

---

## Dependencias Nuevas

```json
{
  "dependencies": {
    "electron": "^28.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "modbus-serial": "^8.0.23",
    "dotenv": "^17.2.3"
  },
  "devDependencies": {
    "electron-vite": "^2.0.0",
    "electron-builder": "^24.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

---

## Notas Importantes

1. **No perder funcionalidad**: Cada fase debe validarse contra el agente actual
2. **Compatibilidad**: El backend NO requiere cambios, la API REST es la misma
3. **Datos existentes**: Los registradores y lecturas existentes siguen funcionando
4. **Migración gradual**: Puedes mantener el agente CLI mientras desarrollas Electron
5. **Tamaño del instalador**: Electron agrega ~100MB, considera si es aceptable

---

## Alternativa: Tauri (Más Ligero)

Si el tamaño del instalador (~150MB) es un problema, considera Tauri:
- Instalador: ~3-10MB
- Memoria: ~50% menos que Electron
- Requiere: Aprender Rust para lógica del main process
- O: Mantener Node.js separado y comunicar via HTTP local

---

*Documento generado para planificación. No es un compromiso de implementación.*
