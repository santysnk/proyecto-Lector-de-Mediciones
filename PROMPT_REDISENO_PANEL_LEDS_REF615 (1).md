# Rediseño: Panel de Estados/LEDs estilo REF615

## Objetivo

Modificar la visualización de estados y LEDs en el modal de lectura completa para que se asemeje al panel físico del relé ABB REF615.

## Diseño Actual (problema)

Actualmente los estados se muestran como una grilla plana de badges:

```
┌─────────────────────────────────────────────────────────────┐
│ ESTADO RELÉ (START/TRIP)                                    │
│ ○ Trip General  ○ Start General  ○ Trip 50  ○ Trip 51  ...  │
├─────────────────────────────────────────────────────────────┤
│ LEDS DEL PANEL                                              │
│ ○ Ready  ○ Start  ○ Trip  ○ Alarm  ○ Warning  ○ IR Fault    │
│ ○ Blocked  ○ Test Mode  ○ LED 9  ○ LED 10  ○ LED 11  ...    │
└─────────────────────────────────────────────────────────────┘
```

## Diseño Deseado (panel físico REF615)

El panel físico del REF615 tiene:
1. **LEDs de sistema** (Ready/Start/Trip) en fila horizontal arriba
2. **LEDs programables** en columna vertical a la derecha

```
┌────────────────────────────────────────────────────────────────┐
│                         PANEL REF615                           │
├────────────────────────────────────────────────────────────────┤
│  ● Ready    ● Start    ● Trip                                  │  ← LEDs sistema (fila)
│  (verde)   (amarillo)  (rojo)                                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────┐    ○ Sobreintensidad          │
│  │                             │    ○ Falla a tierra           │
│  │       [ZONA INFO]           │    ○ Sobre/sub tensión        │
│  │    Última lectura:          │    ○ Desbalance de fases      │ ← LEDs programables
│  │    10/01/2026 11:37         │    ○ Sobrecarga térmica       │   (columna vertical)
│  │                             │    ○ Fallo de interruptor     │
│  │    Estado: NORMAL           │    ○ Disparo reg. perturb     │
│  │                             │    ○ Monitorización int.      │
│  └─────────────────────────────┘    ○ Supervisión              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**NOTA:** NO hay sección de "Protecciones" visible en el panel físico. Los códigos ANSI (Trip 50, Trip 51, etc.) son internos y cuando actúan encienden los LEDs Start/Trip del sistema.

## Archivos a Modificar

### 1. Componente principal
**Archivo:** `src/paginas/PaginaAlimentadores/componentes/modales/lectura-completa/ModalLecturaCompleta.jsx`

### 2. Cambios específicos

#### A. Crear nuevo componente `PanelEstadosREF615`

Reemplazar `SeccionEstados` con un nuevo componente que renderice el panel estilo REF615:

```jsx
/**
 * Panel de estados estilo REF615
 * Simula el aspecto del panel frontal del relé ABB REF615
 */
const PanelEstadosREF615 = ({ 
  estadoLeds,        // Datos del registro 172 (LEDs del panel)
  estadoSalud,       // Datos del registro 127 (SSR1)
  interpretarEstado,
  etiquetasPersonalizadas  // Etiquetas custom del usuario para los LEDs
}) => {
  // Interpretar registros
  const leds = estadoLeds ? interpretarEstado(172, estadoLeds.valor, etiquetasPersonalizadas) : null;
  const salud = estadoSalud ? interpretarEstado(127, estadoSalud.valor) : null;

  // Determinar estado de LEDs de sistema basándose en registro 172
  const valorLeds = estadoLeds?.valor || 0;
  const ledReady = !salud?.bitsActivos?.some(b => b.posicion === 0); // Ready si no hay error en SSR1
  const ledStart = (valorLeds >> 1) & 1;  // Bit 1 del registro 172
  const ledTrip = (valorLeds >> 2) & 1;   // Bit 2 del registro 172

  // LEDs programables: usar etiquetas personalizadas del usuario
  // Solo mostrar los que el usuario configuró
  const ledsProgramables = etiquetasPersonalizadas 
    ? Object.entries(etiquetasPersonalizadas)
        .filter(([bit]) => parseInt(bit) >= 3) // Excluir bits 0,1,2 que son sistema
        .map(([bit, config]) => ({
          posicion: parseInt(bit),
          nombre: config.texto || config.nombre || `LED ${parseInt(bit) + 1}`,
          activo: (valorLeds >> parseInt(bit)) & 1,
          tipo: config.severidad || "info"
        }))
        .sort((a, b) => a.posicion - b.posicion)
    : [];

  return (
    <div className="panel-ref615">
      {/* LEDs de Sistema - Fila superior */}
      <div className="panel-ref615-sistema">
        <LedSistema 
          nombre="Ready" 
          activo={ledReady} 
          color="verde" 
        />
        <LedSistema 
          nombre="Start" 
          activo={ledStart} 
          color="amarillo" 
        />
        <LedSistema 
          nombre="Trip" 
          activo={ledTrip} 
          color="rojo" 
        />
      </div>

      {/* Contenedor principal con info y LEDs programables */}
      <div className="panel-ref615-cuerpo">
        {/* Zona de información/resumen */}
        <div className="panel-ref615-info">
          <div className="panel-ref615-estado-general">
            {ledTrip ? (
              <span className="estado-critico">⚠ DISPARO ACTIVO</span>
            ) : ledStart ? (
              <span className="estado-warning">⚡ PROTECCIÓN EN ARRANQUE</span>
            ) : (
              <span className="estado-ok">✓ OPERACIÓN NORMAL</span>
            )}
          </div>
        </div>

        {/* LEDs Programables - Columna derecha */}
        {ledsProgramables.length > 0 && (
          <div className="panel-ref615-leds-programables">
            {ledsProgramables.map((led) => (
              <LedProgramable
                key={led.posicion}
                nombre={led.nombre}
                activo={led.activo}
                tipo={led.tipo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

    </div>
  );
};

/**
 * LED de sistema (Ready/Start/Trip)
 */
const LedSistema = ({ nombre, activo, color }) => {
  const colorClase = {
    verde: "led-sistema--verde",
    amarillo: "led-sistema--amarillo", 
    rojo: "led-sistema--rojo"
  }[color] || "led-sistema--gris";

  return (
    <div className={`led-sistema ${colorClase} ${activo ? "led-sistema--activo" : ""}`}>
      <span className="led-sistema-indicador">●</span>
      <span className="led-sistema-nombre">{nombre}</span>
    </div>
  );
};

/**
 * LED programable (columna derecha)
 */
const LedProgramable = ({ nombre, activo, tipo }) => {
  return (
    <div className={`led-programable ${activo ? "led-programable--activo" : ""} led-programable--${tipo}`}>
      <span className="led-programable-indicador">{activo ? "●" : "○"}</span>
      <span className="led-programable-nombre">{nombre}</span>
    </div>
  );
};
```

#### B. Estilos CSS

Agregar los siguientes estilos (pueden ir en el mismo archivo o en uno separado):

```css
/* ============================================
   PANEL REF615 - Estilo panel físico
   ============================================ */

.panel-ref615 {
  background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
  border: 2px solid #444;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

/* LEDs de Sistema - Fila superior */
.panel-ref615-sistema {
  display: flex;
  gap: 24px;
  justify-content: flex-start;
  padding: 12px 16px;
  background: #1a1a1a;
  border-radius: 6px;
  margin-bottom: 16px;
  border-bottom: 1px solid #333;
}

.led-sistema {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.led-sistema-indicador {
  font-size: 18px;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.led-sistema-nombre {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
}

/* Colores de LEDs de sistema */
.led-sistema--verde .led-sistema-indicador { color: #22c55e; }
.led-sistema--amarillo .led-sistema-indicador { color: #eab308; }
.led-sistema--rojo .led-sistema-indicador { color: #ef4444; }

.led-sistema--activo .led-sistema-indicador {
  opacity: 1;
  text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
}

.led-sistema--activo .led-sistema-nombre {
  color: #fff;
}

/* LED activo con parpadeo para alarmas */
.led-sistema--rojo.led-sistema--activo .led-sistema-indicador {
  animation: parpadeo-alarma 0.5s ease-in-out infinite;
}

@keyframes parpadeo-alarma {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Cuerpo del panel */
.panel-ref615-cuerpo {
  display: flex;
  gap: 16px;
  min-height: 200px;
}

/* Zona de información */
.panel-ref615-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 20px;
}

.panel-ref615-estado-general {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.estado-ok { color: #22c55e; }
.estado-warning { color: #eab308; }
.estado-critico { color: #ef4444; animation: parpadeo-alarma 0.5s ease-in-out infinite; }

/* LEDs Programables - Columna derecha */
.panel-ref615-leds-programables {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  min-width: 180px;
}

.led-programable {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.led-programable-indicador {
  font-size: 12px;
  color: #555;
  transition: all 0.3s ease;
}

.led-programable-nombre {
  font-size: 11px;
  color: #777;
  white-space: nowrap;
}

.led-programable--activo {
  background: rgba(255, 255, 255, 0.05);
}

.led-programable--activo .led-programable-indicador {
  color: #f59e0b;
  text-shadow: 0 0 8px #f59e0b;
}

.led-programable--activo .led-programable-nombre {
  color: #fff;
}

/* Tipos de LED programable */
.led-programable--alarma.led-programable--activo .led-programable-indicador {
  color: #ef4444;
  text-shadow: 0 0 8px #ef4444;
}

.led-programable--warning.led-programable--activo .led-programable-indicador {
  color: #eab308;
  text-shadow: 0 0 8px #eab308;
}

.led-programable--estado.led-programable--activo .led-programable-indicador {
  color: #22c55e;
  text-shadow: 0 0 8px #22c55e;
}

```

#### C. Modificar `ContenidoFuncionalidades`

En el componente `ContenidoFuncionalidades`, cambiar cómo se renderizan los estados para usar el nuevo panel:

```jsx
const ContenidoFuncionalidades = ({
  mediciones,
  estados,
  obtenerTransformador,
  interpretarEstado,
  etiquetasBits,
}) => {
  // Buscar estados relevantes para el panel
  const estadoLeds = estados.find(e => 
    e.registros?.[0]?.registro === 172 || 
    e.nombre?.toLowerCase().includes("led")
  );
  const estadoSalud = estados.find(e => 
    e.registros?.[0]?.registro === 127 || 
    e.nombre?.toLowerCase().includes("salud") ||
    e.nombre?.toLowerCase().includes("ssr1")
  );

  return (
    <>
      {/* Mediciones */}
      {mediciones.length > 0 ? (
        <ContenedorMediciones
          mediciones={mediciones}
          obtenerTransformador={obtenerTransformador}
        />
      ) : (
        <p className="modal-lectura-sin-datos">No hay mediciones configuradas</p>
      )}

      {/* Panel de Estados estilo REF615 */}
      {(estadoLeds || estadoSalud) && (
        <PanelEstadosREF615
          estadoLeds={estadoLeds?.registros?.[0]}
          estadoSalud={estadoSalud?.registros?.[0]}
          interpretarEstado={interpretarEstado}
          etiquetasPersonalizadas={etiquetasBits}
        />
      )}
    </>
  );
};
```

## Comportamiento Esperado

### LEDs de Sistema (fila superior)
| LED | Color | Condición para encender |
|-----|-------|------------------------|
| Ready | Verde | SSR1 bit 0 = 0 (sin error global) |
| Start | Amarillo | Registro 172 bit 1 = 1 (o cualquier protección en arranque) |
| Trip | Rojo + parpadeo | Registro 172 bit 2 = 1 (o cualquier protección disparada) |

### LEDs Programables (columna derecha)
- Se obtienen de las **etiquetas personalizadas** configuradas por el usuario para el registro 172
- Si no hay etiquetas personalizadas, NO mostrar LEDs genéricos (el usuario debe configurarlos)
- El estado se obtiene del valor del registro 172
- Cada LED programable tiene un nombre descriptivo configurado por el usuario (ej: "Sobreintensidad", "Falla a tierra")

### Zona de Información (centro)
- Mostrar estado general: "OPERACIÓN NORMAL", "PROTECCIÓN EN ARRANQUE" o "DISPARO ACTIVO"
- El color cambia según el estado (verde/amarillo/rojo)

## Notas de Implementación

1. **NO modificar** la lógica de interpretación de registros existente
2. **Reutilizar** la función `interpretarEstado` existente
3. **Mantener compatibilidad** con el sistema de etiquetas personalizadas
4. Los estilos usan CSS puro (no Tailwind) para consistencia con el resto del proyecto
5. El diseño debe ser **responsive** - en pantallas pequeñas los LEDs programables pueden ir debajo

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `ModalLecturaCompleta.jsx` | Agregar componentes: `PanelEstadosREF615`, `LedSistema`, `LedProgramable` |
| `ModalLecturaCompleta.jsx` | Modificar `ContenidoFuncionalidades` para usar el nuevo panel |
| CSS del modal | Agregar estilos del panel REF615 (`.panel-ref615-*`, `.led-sistema-*`, `.led-programable-*`) |

## Resultado Visual Esperado

El panel debe verse similar a la foto del relé físico:

```
┌────────────────────────────────────────────────────────────────┐
│  ● Ready    ● Start    ○ Trip                                  │
│  (verde)   (apagado)  (apagado)                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────┐    ○ Sobreintensidad              │
│  │                         │    ○ Falla a tierra               │
│  │    ✓ OPERACIÓN NORMAL   │    ○ Sobre/sub tensión            │
│  │                         │    ○ Desbalance de fases          │
│  │                         │    ○ Sobrecarga térmica           │
│  │                         │    ○ Fallo de interruptor         │
│  └─────────────────────────┘    ○ Disparo reg. perturb         │
│                                 ○ Monitorización int.          │
│                                 ○ Supervisión                  │
└────────────────────────────────────────────────────────────────┘
```

Características visuales:
- Fondo oscuro simulando el panel del relé
- LEDs de sistema en la parte superior con efecto de "encendido" (glow)
- LED Ready verde encendido cuando el relé está operativo
- LED Start amarillo parpadea cuando hay protección en arranque  
- LED Trip rojo parpadea cuando hay disparo activo
- LEDs programables en columna vertical con texto descriptivo
- Los LEDs programables solo se muestran si el usuario los configuró con etiquetas
