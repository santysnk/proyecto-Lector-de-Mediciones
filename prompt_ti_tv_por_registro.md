# Prompt: Modificar sistema de plantillas para TI/TV por registro individual

## Contexto del problema

Actualmente, en el sistema de configuración de plantillas de RelayWatch, la relación TI/TV se configura **por funcionalidad** (grupo de registros). Por ejemplo:

```javascript
{
  nombre: "Corrientes de Fase",
  registros: [
    { etiqueta: "R", registro: 137 },
    { etiqueta: "S", registro: 138 },
    { etiqueta: "T", registro: 139 }
  ],
  relacion: { nombre: "TI (Terna 3 y 4)", formula: "x * 200 / 1000" }  // ← Una relación para todo el grupo
}
```

## Problema real encontrado

En los relés RET615 de protección diferencial de transformadores, el relé mide corrientes de **ambos lados** del transformador con TIs diferentes:

| Registros | Lado | TRAFO 1 | TRAFO 2 | TRAFO 3 |
|-----------|------|---------|---------|---------|
| 137-139 | 33kV (HV) | TI = 250 | TI = 100 | TI = 200 |
| 151-153 | 13.2kV (LV) | TI = 250 | TI = 250 | TI = 500 |

Con el sistema actual, si agrupo "Corrientes de Fase" con registros 137-139, solo puedo asignar UN TI, pero necesito que cada TRAFO pueda tener su propio TI.

## Solución propuesta

Modificar la estructura para que la relación TI/TV se asigne **por cada registro individual** en lugar de por grupo:

```javascript
{
  nombre: "Corrientes Lado 33kV (HV)",
  registros: [
    { etiqueta: "R", registro: 137, relacion: { nombre: "TI 33kV", formula: "x * 250 / 1000" } },
    { etiqueta: "S", registro: 138, relacion: { nombre: "TI 33kV", formula: "x * 250 / 1000" } },
    { etiqueta: "T", registro: 139, relacion: { nombre: "TI 33kV", formula: "x * 250 / 1000" } }
  ]
  // Ya no hay relación a nivel de grupo
}
```

O alternativamente, mantener ambas opciones (relación por grupo como default, pero permitir override por registro):

```javascript
{
  nombre: "Corrientes Lado 33kV (HV)",
  registros: [
    { etiqueta: "R", registro: 137 },  // Usa relación del grupo
    { etiqueta: "S", registro: 138 },  // Usa relación del grupo
    { etiqueta: "T", registro: 139, relacion: { ... } }  // Override individual
  ],
  relacion: { nombre: "TI Default", formula: "x * 200 / 1000" }  // Default para el grupo
}
```

## Cambios requeridos

### 1. Estructura de datos (modelo de plantilla)

Modificar el esquema de funcionalidad para que cada registro tenga su propia relación:

```javascript
// Antes
const funcionalidad = {
  nombre: String,
  registros: [{ etiqueta: String, registro: Number }],
  relacion: { nombre: String, formula: String } | null
}

// Después
const funcionalidad = {
  nombre: String,
  registros: [{
    etiqueta: String,
    registro: Number,
    relacion: { nombre: String, formula: String } | null  // ← Nuevo: relación por registro
  }]
  // Eliminar relación a nivel de grupo, o mantenerla como fallback
}
```

### 2. UI del modal de edición de plantillas

Modificar el formulario para que el selector de TI/TV aparezca **al lado de cada registro** en lugar de al lado del grupo:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ☑ Corrientes Lado 33kV (HV)                                       × │
├─────────────────────────────────────────────────────────────────────────┤
│   R  →  [137]  │  TI/TV: [TI TRAFO 1 (250)    ▼] │  x * 250 / 1000    │
│   S  →  [138]  │  TI/TV: [TI TRAFO 1 (250)    ▼] │  x * 250 / 1000    │
│   T  →  [139]  │  TI/TV: [TI TRAFO 1 (250)    ▼] │  x * 250 / 1000    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. Lógica de cálculo de valores reales

Donde se aplica la fórmula de conversión, ahora debe buscar la relación en cada registro individual:

```javascript
// Antes
const valorReal = aplicarFormula(valorCrudo, funcionalidad.relacion?.formula);

// Después
const valorReal = aplicarFormula(valorCrudo, registro.relacion?.formula);
```

### 4. Migración de datos existentes

Las plantillas existentes que tienen relación a nivel de grupo deben migrarse para copiar esa relación a cada registro:

```javascript
// Migración
funcionalidad.registros = funcionalidad.registros.map(reg => ({
  ...reg,
  relacion: reg.relacion || funcionalidad.relacion  // Copiar del grupo si no existe
}));
```

## Archivos a modificar (probables)

1. **Modelo/esquema de plantilla** - donde se define la estructura de datos
2. **Modal de edición de plantillas** - UI para configurar funcionalidades
3. **Componente de visualización de mediciones** - donde se calculan valores reales
4. **localStorage o backend** - migración de plantillas existentes

## Beneficios

1. **Flexibilidad total**: Cada registro puede tener su propia relación
2. **Soporte para diferenciales**: Permite TIs diferentes para lado HV y LV
3. **Compatibilidad**: Los casos simples (mismo TI para todo el grupo) solo repiten el valor
4. **Sin breaking changes**: Si se mantiene el fallback a nivel de grupo

## Ejemplo de uso final

Para TRAFO 2 que tiene TI=100 en 33kV y TI=250 en 13.2kV:

```javascript
{
  funcionalidades: [
    {
      nombre: "Corrientes Lado 33kV (HV)",
      registros: [
        { etiqueta: "R", registro: 137, relacion: { nombre: "TI 33kV T2", formula: "x * 100 / 1000" } },
        { etiqueta: "S", registro: 138, relacion: { nombre: "TI 33kV T2", formula: "x * 100 / 1000" } },
        { etiqueta: "T", registro: 139, relacion: { nombre: "TI 33kV T2", formula: "x * 100 / 1000" } }
      ]
    },
    {
      nombre: "Corrientes Lado 13.2kV (LV)",
      registros: [
        { etiqueta: "R", registro: 151, relacion: { nombre: "TI 13.2kV T2", formula: "x * 250 / 1000" } },
        { etiqueta: "S", registro: 152, relacion: { nombre: "TI 13.2kV T2", formula: "x * 250 / 1000" } },
        { etiqueta: "T", registro: 153, relacion: { nombre: "TI 13.2kV T2", formula: "x * 250 / 1000" } }
      ]
    }
  ]
}
```

## Notas adicionales

- La UI puede ofrecer un botón "Aplicar a todos los registros" para no tener que seleccionar uno por uno cuando son iguales
- Considerar agregar presets de TI/TV comunes (100, 200, 250, 500) para selección rápida
- El selector puede mostrar la fórmula resultante al lado para verificación visual
