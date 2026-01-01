# Prompt: Simplificación del Sistema de Configuración de Relés de Protección

## Contexto del Proyecto

Estoy trabajando en **RelayWatch**, un sistema de monitoreo de relés de protección ABB Serie 615 (REF615/RET615). El proyecto tiene arquitectura de 3 repositorios:

- **Frontend**: React + Vite (proyecto-Lector-de-Mediciones)
- **Backend**: Node.js/Express
- **Agente Modbus**: Lee datos de los relés físicos

Actualmente existe un modal de configuración de agentes (`ModalConfigurarAgente.jsx`) que permite agregar "registradores" (dispositivos a monitorear). Cuando el usuario elige tipo "Relé de Protección", se muestra el componente `ConfiguracionRele.jsx` que es **demasiado complejo** y está diseñado con configuraciones genéricas ABB (FE03, FE06, TE02) que no reflejan la realidad de mi instalación.

---

## Problema Actual

El componente `ConfiguracionRele.jsx` actual:
1. Tiene estructuras de datos muy densas en `constantes/modelosRele.js`
2. Intenta mapear protecciones por bits específicos (PHLPTOC1, PHHPTOC1, etc.) que son complejos de configurar
3. No contempla que **el mismo modelo de relé** puede tener diferentes capacidades según si está en una **celda vieja o nueva**
4. La interpretación de datos (bitmasks) debería estar hardcodeada, no ser configurable por el usuario

---

## Diseño Nuevo Requerido

### Concepto Principal

Reemplazar el sistema actual por uno basado en **plantillas simples** que el usuario crea, y luego al configurar cada relé:
1. Elige una plantilla
2. Activa/desactiva funcionalidades con checkboxes
3. Puede ajustar el número de registro si difiere del default

### Flujo de Datos

```
[Agente Modbus] 
    → Lee registros X a Y del relé
    → Guarda array de valores en BD
    
[Backend]
    → Toma el array de valores
    → Según la configuración del relé, sabe qué índice corresponde a qué dato
    → Interpreta los valores (bitmasks para estados, valores directos para mediciones)
    → Genera alertas si corresponde
    
[Frontend]
    → Muestra el estado del relé con los datos procesados
```

---

## Estructuras de Datos

### 1. Plantilla (guardar en localStorage key: `rw-plantillas-rele`)

```javascript
{
  id: "uuid-generado",
  nombre: "FE03 - Feeder con Autorecierre",
  descripcion: "Alimentadores sin medición de tensión",
  fechaCreacion: "2026-01-01T10:00:00Z",
  
  funcionalidades: {
    corrientes: {
      nombre: "Corrientes de fase (IL1, IL2, IL3)",
      registroDefault: 137,
      cantidad: 3
    },
    tensiones: {
      nombre: "Tensiones (VA, VB, VC, VAB, VBC, VCA)",
      registroDefault: 151,
      cantidad: 6
    },
    corrienteResidual: {
      nombre: "Corriente residual Io",
      registroDefault: 141,
      cantidad: 1
    },
    potencias: {
      nombre: "Potencias (P, Q, S, FP)",
      registroDefault: 160,
      cantidad: 7
    },
    estadoRele: {
      nombre: "Estado del relé (Ready/Start/Trip)",
      registroDefault: 170,
      cantidad: 1
    },
    leds: {
      nombre: "LEDs del panel (alarmas visibles)",
      registroDefault: 172,
      cantidad: 1
    },
    posicionCB: {
      nombre: "Posición del interruptor (CB)",
      registroDefault: 175,
      cantidad: 1
    },
    saludDispositivo: {
      nombre: "Salud del dispositivo (SSR1 - Ready)",
      registroDefault: 127,
      cantidad: 1
    },
    heartbeat: {
      nombre: "Heartbeat (SSR5 - Alive counter)",
      registroDefault: 131,
      cantidad: 1
    }
  }
}
```

### 2. Configuración de Relé Individual (lo que se guarda cuando el usuario crea un registrador)

```javascript
{
  nombre: "Alimentador 1",
  tipo: "modbus",
  tipoDispositivo: "rele",
  ip: "172.16.0.1",
  puerto: "502",
  unitId: "1",
  registroInicial: "120",
  cantidadRegistros: "80",
  plantillaId: "uuid-de-la-plantilla",
  
  // Funcionalidades activas con su registro específico
  funcionalidadesActivas: {
    corrientes: { habilitado: true, registro: 137 },
    tensiones: { habilitado: false, registro: 151 },
    corrienteResidual: { habilitado: false, registro: 141 },
    potencias: { habilitado: false, registro: 160 },
    estadoRele: { habilitado: true, registro: 170 },
    leds: { habilitado: true, registro: 172 },
    posicionCB: { habilitado: false, registro: 175 },
    saludDispositivo: { habilitado: true, registro: 127 },
    heartbeat: { habilitado: true, registro: 131 }
  }
}
```

---

## Cambios de UI Requeridos

### Ubicación en el código

El formulario está en:
- `mi-app/src/paginas/PaginaAlimentadores/componentes/modales/ModalConfigurarAgente.jsx`

El componente actual de configuración de relés (a reemplazar/simplificar):
- `mi-app/src/paginas/PaginaAlimentadores/componentes/modales/ConfiguracionRele.jsx`

Las constantes actuales (probablemente ya no se necesiten o se simplifiquen mucho):
- `mi-app/src/paginas/PaginaAlimentadores/constantes/modelosRele.js`

### Diseño del Formulario

Cuando el usuario selecciona `tipoDispositivo: "rele"`, debe mostrarse:

```
┌─────────────────────────────────────────────────────────────────┐
│ Nombre del Registrador                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Ej: Alimentador 1                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ═══════════════════════════════════════════════════════════════ │
│ PLANTILLA DE CONFIGURACIÓN                                      │
│ ═══════════════════════════════════════════════════════════════ │
│                                                                 │
│ Plantilla: [▼ Seleccionar plantilla...]  [+ Nueva] [Gestionar] │
│                                                                 │
│ (Si no hay plantillas creadas, mostrar mensaje:                │
│  "No hay plantillas. Crea una para continuar.")                │
│                                                                 │
│ ═══════════════════════════════════════════════════════════════ │
│ CONEXIÓN MODBUS TCP                                             │
│ ═══════════════════════════════════════════════════════════════ │
│                                                                 │
│ IP              Puerto          Unit ID                         │
│ ┌───────────┐   ┌─────────┐    ┌─────────┐                     │
│ │192.168.1.1│   │ 502     │    │ 1       │                     │
│ └───────────┘   └─────────┘    └─────────┘                     │
│                                                                 │
│ Registro Inicial    Cantidad de Registros                       │
│ ┌─────────┐         ┌─────────┐                                │
│ │ 120     │         │ 80      │                                │
│ └─────────┘         └─────────┘                                │
│                                                                 │
│ ═══════════════════════════════════════════════════════════════ │
│ FUNCIONALIDADES A MONITOREAR                                    │
│ ═══════════════════════════════════════════════════════════════ │
│ (Esta sección solo aparece cuando hay una plantilla             │
│  seleccionada. Muestra las funcionalidades de esa plantilla)    │
│                                                                 │
│ ☑ Corrientes de fase (IL1, IL2, IL3)        Registro: [137]    │
│ ☐ Tensiones (VA, VB, VC, VAB, VBC, VCA)     Registro: [151]    │
│ ☐ Corriente residual Io                      Registro: [141]    │
│ ☐ Potencias (P, Q, S, FP)                    Registro: [160]    │
│ ───────────────────────────────────────────────────────────────│
│ ☑ Estado del relé (Ready/Start/Trip)         Registro: [170]    │
│ ☑ LEDs del panel (alarmas visibles)          Registro: [172]    │
│ ☐ Posición del interruptor (CB)              Registro: [175]    │
│ ───────────────────────────────────────────────────────────────│
│ ☑ Salud del dispositivo (SSR1 - Ready)       Registro: [127]    │
│ ☑ Heartbeat (SSR5 - Alive counter)           Registro: [131]    │
│                                                                 │
│                                    [Cancelar]  [Guardar]        │
└─────────────────────────────────────────────────────────────────┘
```

### Notas sobre el diseño de UI:

1. **El input de registro** de cada funcionalidad debe estar deshabilitado (gris) cuando el checkbox no está marcado
2. **El valor por defecto** del input de registro viene de la plantilla seleccionada
3. **Cuando se cambia de plantilla**, se resetean los checkboxes y los valores de registro a los defaults de la nueva plantilla
4. **Los placeholders** de "Registro Inicial" y "Cantidad de Registros" deben ser 120 y 80 respectivamente

---

## Modal de Gestión de Plantillas

Debe haber un modal secundario (o sección expandible) para gestionar plantillas:

### Botón [+ Nueva] → Abre formulario de crear plantilla

```
┌─────────────────────────────────────────────────────────────────┐
│ NUEVA PLANTILLA                                                 │
│ ═══════════════════════════════════════════════════════════════ │
│                                                                 │
│ Nombre de la plantilla                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Ej: FE03 - Feeder con Autorecierre                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Descripción (opcional)                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Alimentadores sin medición de tensión                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ═══════════════════════════════════════════════════════════════ │
│ FUNCIONALIDADES DISPONIBLES                                     │
│ ═══════════════════════════════════════════════════════════════ │
│ (Selecciona qué funcionalidades incluirá esta plantilla)        │
│                                                                 │
│ MEDICIONES:                                                     │
│ ☑ Corrientes de fase          Registro por defecto: [137]       │
│ ☐ Tensiones                   Registro por defecto: [151]       │
│ ☐ Corriente residual Io       Registro por defecto: [141]       │
│ ☐ Potencias                   Registro por defecto: [160]       │
│                                                                 │
│ ESTADOS Y ALARMAS:                                              │
│ ☑ Estado del relé             Registro por defecto: [170]       │
│ ☑ LEDs del panel              Registro por defecto: [172]       │
│ ☐ Posición del interruptor    Registro por defecto: [175]       │
│                                                                 │
│ SISTEMA:                                                        │
│ ☑ Salud del dispositivo       Registro por defecto: [127]       │
│ ☑ Heartbeat                   Registro por defecto: [131]       │
│                                                                 │
│                              [Cancelar]  [Crear Plantilla]      │
└─────────────────────────────────────────────────────────────────┘
```

### Botón [Gestionar] → Lista de plantillas existentes

```
┌─────────────────────────────────────────────────────────────────┐
│ GESTIONAR PLANTILLAS                                            │
│ ═══════════════════════════════════════════════════════════════ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📋 FE03 - Feeder con Autorecierre                           │ │
│ │    Alimentadores sin medición de tensión                    │ │
│ │                                          [Editar] [Eliminar]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📋 FE06 - Feeder con Tensión                                │ │
│ │    Líneas con medición de tensión y potencia                │ │
│ │                                          [Editar] [Eliminar]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ (Si no hay plantillas: "No hay plantillas creadas")            │
│                                                                 │
│                                                      [Cerrar]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Funcionalidades Predefinidas (Lista Maestra)

Estas son TODAS las funcionalidades posibles que pueden incluirse en una plantilla. El código debe tener esta lista como referencia:

```javascript
const FUNCIONALIDADES_DISPONIBLES = {
  // MEDICIONES
  corrientes: {
    id: "corrientes",
    nombre: "Corrientes de fase (IL1, IL2, IL3)",
    categoria: "mediciones",
    registroDefault: 137,
    cantidad: 3
  },
  tensiones: {
    id: "tensiones",
    nombre: "Tensiones (VA, VB, VC, VAB, VBC, VCA)",
    categoria: "mediciones",
    registroDefault: 151,
    cantidad: 6
  },
  corrienteResidual: {
    id: "corrienteResidual",
    nombre: "Corriente residual Io",
    categoria: "mediciones",
    registroDefault: 141,
    cantidad: 1
  },
  potencias: {
    id: "potencias",
    nombre: "Potencias (P, Q, S, FP)",
    categoria: "mediciones",
    registroDefault: 160,
    cantidad: 7
  },
  
  // ESTADOS Y ALARMAS
  estadoRele: {
    id: "estadoRele",
    nombre: "Estado del relé (Ready/Start/Trip)",
    categoria: "estados",
    registroDefault: 170,
    cantidad: 1
  },
  leds: {
    id: "leds",
    nombre: "LEDs del panel (alarmas visibles)",
    categoria: "estados",
    registroDefault: 172,
    cantidad: 1
  },
  posicionCB: {
    id: "posicionCB",
    nombre: "Posición del interruptor (CB)",
    categoria: "estados",
    registroDefault: 175,
    cantidad: 1
  },
  
  // SISTEMA
  saludDispositivo: {
    id: "saludDispositivo",
    nombre: "Salud del dispositivo (SSR1 - Ready)",
    categoria: "sistema",
    registroDefault: 127,
    cantidad: 1
  },
  heartbeat: {
    id: "heartbeat",
    nombre: "Heartbeat (SSR5 - Alive counter)",
    categoria: "sistema",
    registroDefault: 131,
    cantidad: 1
  }
};
```

---

## LocalStorage Keys

- `rw-plantillas-rele`: Array de plantillas creadas por el usuario
- La configuración de cada registrador se sigue guardando donde se guardaba antes (en la estructura del agente/registrador)

---

## Archivos a Modificar/Crear

1. **`ModalConfigurarAgente.jsx`**
   - Modificar la sección del formulario de registrador tipo "rele"
   - Reemplazar el uso de `<ConfiguracionRele />` por el nuevo diseño simplificado
   - Agregar lógica para manejar plantillas

2. **`ConfiguracionRele.jsx`**
   - Reescribir completamente o reemplazar
   - El nuevo componente debe ser mucho más simple

3. **Crear nuevo archivo (sugerido): `PlantillasRele.jsx`**
   - Componente para el modal/sección de gestión de plantillas
   - CRUD de plantillas en localStorage

4. **Crear nuevo archivo (sugerido): `constantes/funcionalidadesRele.js`**
   - Contiene `FUNCIONALIDADES_DISPONIBLES`
   - Reemplaza o simplifica el actual `modelosRele.js`

5. **`useModelosRele.js`**
   - Probablemente se pueda simplificar mucho o reemplazar por un hook más simple como `usePlantillasRele.js`

---

## Comportamiento Esperado

### Al crear un nuevo registrador tipo relé:

1. Usuario ingresa nombre
2. Usuario selecciona o crea una plantilla
3. Usuario ingresa datos de conexión (IP, puerto, unit ID)
4. Usuario ingresa registro inicial (placeholder: 120) y cantidad (placeholder: 80)
5. Se muestran las funcionalidades de la plantilla seleccionada
6. Usuario activa/desactiva funcionalidades según su instalación
7. Usuario puede ajustar el número de registro si es necesario
8. Al guardar, se genera el objeto de configuración con `funcionalidadesActivas`

### Al editar un registrador existente:

1. Se carga la configuración guardada
2. Se selecciona automáticamente la plantilla que tenía
3. Se marcan los checkboxes según `funcionalidadesActivas`
4. Se cargan los números de registro guardados
5. Usuario puede modificar y guardar

### Al eliminar una plantilla:

1. Si hay registradores usando esa plantilla, mostrar advertencia
2. Confirmar eliminación
3. Los registradores que usaban esa plantilla quedan con `plantillaId` inválido (manejar este caso mostrando mensaje de "plantilla no encontrada")

---

## Datos Reales de Ejemplo

Para testing, estos son valores reales de registros de dos alimentadores:

**Alimentador 1 (celda vieja, sin retroalimentación CB):**
- Registro 137: 96 (corriente IL1)
- Registro 138: 92 (corriente IL2)
- Registro 139: 86 (corriente IL3)
- Registro 170: 0 (estado OK/Ready)
- Registro 172: 17 (LEDs: bits 0 y 4 activos = Arranque I> y Arranque Io>)
- Registro 175: 768 (sin retroalimentación de posición CB)

**Alimentador 2 (celda nueva, con retroalimentación CB):**
- Registro 137: 123 (corriente IL1)
- Registro 138: 127 (corriente IL2)
- Registro 139: 126 (corriente IL3)
- Registro 170: 0 (estado OK/Ready)
- Registro 172: 1041 (LEDs: bits 0, 4 y 10 activos = Arranque I>, Arranque Io>, Pos CB Cerrado)
- Registro 175: 769 (CB Cerrado)

---

## Consideraciones Adicionales

1. **Estilos**: Usar los estilos CSS existentes del modal (`ModalConfigurarAgente.css`) y adaptar según sea necesario

2. **Validaciones**:
   - Nombre de registrador requerido
   - IP válida
   - Puerto numérico
   - Debe haber al menos una plantilla seleccionada
   - Debe haber al menos una funcionalidad activa

3. **UX**:
   - Los inputs de registro deshabilitados deben verse claramente como no editables (gris/opacity)
   - Al cambiar de plantilla, pedir confirmación si hay cambios sin guardar
   - Feedback visual al guardar plantilla (toast o mensaje)

4. **No incluir en esta implementación**:
   - Interpretación de bits/bitmasks (eso va en backend después)
   - Lógica de alertas
   - Integración con backend/BD (todo en localStorage por ahora)

---

## Resumen de Tareas

1. ✅ Crear constante `FUNCIONALIDADES_DISPONIBLES`
2. ✅ Crear hook o funciones para CRUD de plantillas en localStorage
3. ✅ Crear componente de gestión de plantillas (crear, editar, eliminar, listar)
4. ✅ Modificar el formulario de registrador tipo relé para usar el nuevo diseño
5. ✅ Eliminar o simplificar código legacy (`ConfiguracionRele.jsx` actual, `modelosRele.js`, `useModelosRele.js`)
6. ✅ Probar flujo completo: crear plantilla → crear registrador → editar → eliminar
