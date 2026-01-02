# Prompt: Corregir Interpretación de LEDs en Consola de Test

## Problema Actual

En la consola de test del registrador de relés, la sección "Estado LEDs" muestra badges genéricos ("Ready", "Warning") que no son útiles. 

Ejemplo actual:
```
* Estado LEDs
  Alarma [172] = 17
  [Ready] [Warning]
```

Esto no me dice nada. Necesito ver **qué bits están activos** y **qué significan según las etiquetas del panel físico del relé**.

---

## Comportamiento Esperado

Si el valor del registro 172 es **17**, que en binario es `00000010001`:
- Bit 0 está activo (valor & 1)
- Bit 4 está activo (valor & 16)

La consola debería mostrar:

```
* Estado LEDs
  Alarma [172] = 17 (binario: 00000010001)
  
  Bits activos:
  • Bit 0: Arranque I>
  • Bit 4: Arranque Io>
```

O en un formato más visual con badges/chips:

```
* Estado LEDs
  Alarma [172] = 17
  
  [Bit 0: Arranque I>] [Bit 4: Arranque Io>]
```

---

## Etiquetas de LEDs por Tipo de Plantilla

Las etiquetas de los bits del registro 172 **dependen del tipo de equipo**. Cada plantilla debería tener definidas sus etiquetas de LEDs.

### Para plantillas tipo "Alimentador" (FE03):

```javascript
const ETIQUETAS_LEDS_ALIMENTADOR = {
  0: "Arranque I>",
  1: "Disparo I>",
  2: "Falla a Tierra sensible / Disparo I>>",
  3: "Disparo I>>",
  4: "Arranque Io>",
  5: "Disparo Falla a Tierra",
  6: "Desbalance de Fases",
  7: "Recierre Habilitado",
  8: "Recierre en Progreso",
  9: "Pos CB Abierto",
  10: "Pos CB Cerrado"
};
```

### Para plantillas tipo "TERNA" (FE06):

```javascript
const ETIQUETAS_LEDS_TERNA = {
  0: "Sobreintensidad",
  1: "Falta a tierra",
  2: "Sobre/sub tensión",
  3: "Desbalance de fases",
  4: "Sobrecarga térmica",
  5: "Fallo de interruptor",
  6: "Disparo reg. perturb.",
  7: "Monitorización interruptor",
  8: "Supervisión"
};
```

### Para plantillas tipo "TRAFO Diferencial" (TE02):

```javascript
const ETIQUETAS_LEDS_TRAFO_DIF = {
  0: "Prot dif pol. etapa baja",
  1: "Prot. dif. etapa alta",
  2: "Sobreintensidad",
  3: "Falta a tierra restringida",
  4: "Falta a tierra",
  5: "Fallo de interruptor",
  6: "F. sec. neg. / sobrecarga 1°",
  7: "Disparo reg. perturb.",
  8: "Supervisión",
  9: "Disparo externo"
};
```

---

## Implementación Requerida

### Opción A: Etiquetas hardcodeadas por tipo de plantilla

1. Agregar un campo `tipoEquipo` a la plantilla: `"alimentador"`, `"terna"`, `"trafoDif"`
2. Tener las etiquetas hardcodeadas en el código según el tipo
3. Al mostrar los LEDs en la consola, buscar las etiquetas según el tipo de plantilla

### Opción B: Etiquetas configurables en la plantilla (más flexible)

1. Agregar a la estructura de plantilla un campo `etiquetasLeds`:

```javascript
{
  id: "uuid",
  nombre: "FE03 - Feeder Alimentadores",
  descripcion: "...",
  funcionalidades: { ... },
  
  // NUEVO: Etiquetas para los bits del registro de LEDs
  etiquetasLeds: {
    0: "Arranque I>",
    1: "Disparo I>",
    2: "Falla a Tierra sensible / Disparo I>>",
    3: "Disparo I>>",
    4: "Arranque Io>",
    5: "Disparo Falla a Tierra",
    6: "Desbalance de Fases",
    7: "Recierre Habilitado",
    8: "Recierre en Progreso",
    9: "Pos CB Abierto",
    10: "Pos CB Cerrado"
  }
}
```

2. En el formulario de crear/editar plantilla, agregar una sección para definir las etiquetas de LEDs (11 campos, uno por cada bit del 0 al 10)

3. Al mostrar en la consola de test, usar las etiquetas de la plantilla seleccionada

**Recomiendo Opción B** porque permite que el usuario personalice las etiquetas si algún relé tiene configuración diferente.

---

## Lógica de Decodificación de Bits

```javascript
/**
 * Decodifica el valor del registro de LEDs y retorna los bits activos con sus etiquetas
 * @param {number} valor - Valor leído del registro (ej: 17)
 * @param {object} etiquetas - Mapa de bit -> etiqueta (ej: {0: "Arranque I>", ...})
 * @returns {array} - Array de objetos {bit, etiqueta}
 */
function decodificarLeds(valor, etiquetas = {}) {
  const bitsActivos = [];
  
  for (let bit = 0; bit < 16; bit++) {
    if ((valor >> bit) & 1) {
      bitsActivos.push({
        bit: bit,
        etiqueta: etiquetas[bit] || `LED ${bit + 1} (sin etiqueta)`
      });
    }
  }
  
  return bitsActivos;
}

// Ejemplo de uso:
const valor = 17;
const etiquetas = {
  0: "Arranque I>",
  4: "Arranque Io>",
  // ...
};

const resultado = decodificarLeds(valor, etiquetas);
// resultado = [
//   { bit: 0, etiqueta: "Arranque I>" },
//   { bit: 4, etiqueta: "Arranque Io>" }
// ]
```

---

## Cambios en la UI

### 1. Formulario de Plantilla - Agregar sección de etiquetas de LEDs

Cuando el usuario crea o edita una plantilla, mostrar una sección adicional:

```
═══════════════════════════════════════════════════════════════
ETIQUETAS DE LEDs (Registro 172)
═══════════════════════════════════════════════════════════════
Define qué significa cada LED del panel frontal del relé.

Bit 0:  [Arranque I>_________________]
Bit 1:  [Disparo I>__________________]
Bit 2:  [Falla a Tierra sensible_____]
Bit 3:  [Disparo I>>_________________]
Bit 4:  [Arranque Io>________________]
Bit 5:  [Disparo Falla a Tierra______]
Bit 6:  [Desbalance de Fases_________]
Bit 7:  [Recierre Habilitado_________]
Bit 8:  [Recierre en Progreso________]
Bit 9:  [Pos CB Abierto______________]
Bit 10: [Pos CB Cerrado______________]

(Los campos vacíos mostrarán "LED X" por defecto)
```

### 2. Consola de Test - Sección Estado LEDs

Reemplazar los badges genéricos por la lista de bits activos con sus etiquetas:

```
* Estado LEDs
  Registro [172] = 17

  ┌──────────────────────────────────────┐
  │ ⚡ Bit 0: Arranque I>                │
  │ ⚡ Bit 4: Arranque Io>               │
  └──────────────────────────────────────┘
  
  (Si valor = 0, mostrar: "Sin alarmas activas")
```

O con chips/badges individuales:

```
* Estado LEDs
  Registro [172] = 17

  [⚡ Arranque I>] [⚡ Arranque Io>]
```

### 3. Colores según severidad (opcional, mejora futura)

Podríamos agregar un campo de severidad a cada etiqueta:

```javascript
etiquetasLeds: {
  0: { texto: "Arranque I>", severidad: "warning" },      // amarillo
  1: { texto: "Disparo I>", severidad: "danger" },        // rojo
  5: { texto: "Disparo Falla a Tierra", severidad: "danger" },
  10: { texto: "Pos CB Cerrado", severidad: "info" },     // azul/gris
}
```

Pero esto lo podemos dejar para una segunda iteración. Por ahora, solo mostrar las etiquetas es suficiente.

---

## Archivos a Modificar

1. **Estructura de plantilla** - Agregar campo `etiquetasLeds`

2. **Formulario de crear/editar plantilla** - Agregar sección para definir etiquetas de los 11 LEDs

3. **Consola de test** - Modificar la sección "Estado LEDs" para:
   - Decodificar el valor en bits
   - Obtener las etiquetas de la plantilla del registrador
   - Mostrar cada bit activo con su etiqueta

4. **Función helper** - Crear `decodificarLeds(valor, etiquetas)` si no existe

---

## Resultado Final Esperado

Cuando el test de conexión lee el registro 172 con valor 17:

**Antes (actual):**
```
* Estado LEDs
  Alarma [172] = 17
  [Ready] [Warning]
```

**Después (esperado):**
```
* Estado LEDs
  Registro [172] = 17

  Bits activos:
  • Bit 0: Arranque I>
  • Bit 4: Arranque Io>
```

Y si el valor fuera 0:
```
* Estado LEDs
  Registro [172] = 0

  ✓ Sin alarmas activas
```
