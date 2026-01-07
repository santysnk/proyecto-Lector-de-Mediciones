# Prompt: Corregir interpretación SSR1 y mejorar visualización Heartbeat

## Problema 1: SSR1 (Registro 127) muestra "Alarm" incorrectamente

### Situación actual

El registro 127 (SSR1 - Salud del dispositivo) muestra:

```
* Salud Dispositivo (SSR1)
Estado [127] = 4
Alarm
```

Pero el valor 4 (bit 2 activo) **NO es una alarma real**. El relé está funcionando correctamente.

### Causa del problema

El código probablemente interpreta cualquier valor > 0 como alarma, pero según el manual ABB:

| Bit | Significado | Acción |
|-----|-------------|--------|
| **Bit 0** | Device global error | ⛔ ERROR - Crítico |
| **Bit 1** | Device global warning | ⚠️ WARNING |
| **Bits 2-15** | Reservados | ✅ Ignorar |

El valor 4 = bit 2 activo = **reservado**, no indica ningún problema.

### Solución requerida

Modificar la lógica de interpretación del SSR1:

```javascript
function interpretarSSR1(valor) {
  const error = (valor & 0x01) !== 0;    // Bit 0
  const warning = (valor & 0x02) !== 0;  // Bit 1
  
  if (error) {
    return {
      estado: 'ERROR',
      icono: '⛔',
      color: 'red',
      mensaje: 'Error global del dispositivo - Requiere atención inmediata'
    };
  } else if (warning) {
    return {
      estado: 'WARNING',
      icono: '⚠️',
      color: 'yellow',
      mensaje: 'Advertencia del dispositivo - Revisar cuando sea posible'
    };
  } else {
    return {
      estado: 'OK',
      icono: '✅',
      color: 'green',
      mensaje: 'Dispositivo funcionando correctamente'
    };
  }
}
```

### Visualización esperada

**Antes (incorrecto):**
```
* Salud Dispositivo (SSR1)
Estado [127] = 4
Alarm                        ← Incorrecto
```

**Después (correcto):**
```
* Salud Dispositivo (SSR1)
✅ Dispositivo OK
```

O si hay error real (valor = 1):
```
* Salud Dispositivo (SSR1)
⛔ ERROR - Requiere atención inmediata
```

---

## Problema 2: Heartbeat (SSR5) muestra información confusa

### Situación actual

```
* Heartbeat (SSR5)
Alive [131] = 11203
Bit 0Bit 1Bit 6Bit 7Bit 8Bit 9Bit 11Bit 13
```

Esto no significa nada para un operador.

### ¿Qué es el Heartbeat?

El registro 131 (SSR5) es un **contador que incrementa constantemente** mientras el relé está vivo. Si el valor deja de cambiar entre lecturas, significa que el relé se colgó o perdió comunicación.

### Solución requerida

En lugar de mostrar el valor crudo y bits, mostrar:

1. **Indicador visual de "vivo"** - basado en si el valor cambió desde la última lectura
2. **Tiempo desde última actualización** (opcional)

```javascript
// Guardar el valor anterior por dispositivo
const heartbeatAnterior = {};

function interpretarHeartbeat(deviceId, valorActual) {
  const anterior = heartbeatAnterior[deviceId];
  heartbeatAnterior[deviceId] = valorActual;
  
  if (anterior === undefined) {
    // Primera lectura
    return {
      estado: 'CONECTADO',
      icono: '💚',
      color: 'green',
      mensaje: 'Dispositivo conectado'
    };
  } else if (valorActual !== anterior) {
    // Valor cambió = dispositivo vivo
    return {
      estado: 'VIVO',
      icono: '💚',
      color: 'green',
      mensaje: 'Comunicación activa'
    };
  } else {
    // Valor NO cambió = posible problema
    return {
      estado: 'SIN RESPUESTA',
      icono: '💔',
      color: 'red',
      mensaje: 'Sin cambio en heartbeat - Verificar comunicación'
    };
  }
}
```

### Visualización esperada

**Antes (confuso):**
```
* Heartbeat (SSR5)
Alive [131] = 11203
Bit 0Bit 1Bit 6Bit 7Bit 8Bit 9Bit 11Bit 13
```

**Después (claro):**
```
* Heartbeat (SSR5)
💚 Comunicación activa
```

O si hay problema:
```
* Heartbeat (SSR5)
💔 Sin respuesta - Verificar comunicación
```

### Alternativa más simple (sin tracking de cambios)

Si no querés trackear el valor anterior, al menos mostrar algo más amigable:

```javascript
function interpretarHeartbeatSimple(valor) {
  if (valor > 0) {
    return {
      estado: 'CONECTADO',
      icono: '💚',
      color: 'green',
      mensaje: `Dispositivo activo (contador: ${valor})`
    };
  } else {
    return {
      estado: 'VERIFICAR',
      icono: '❓',
      color: 'yellow',
      mensaje: 'Heartbeat en cero - Verificar conexión'
    };
  }
}
```

Resultado:
```
* Heartbeat (SSR5)
💚 Dispositivo activo
```

---

## Resumen de cambios

| Funcionalidad | Problema | Solución |
|---------------|----------|----------|
| SSR1 (Reg 127) | Muestra "Alarm" con valor 4 | Solo evaluar bits 0 y 1, ignorar el resto |
| Heartbeat (Reg 131) | Muestra bits confusos | Mostrar estado de conexión amigable |

## Archivos a modificar

Buscar donde se renderiza/interpreta:
1. La funcionalidad "Salud Dispositivo (SSR1)" 
2. La funcionalidad "Heartbeat (SSR5)"

Probablemente en el componente que muestra el detalle de mediciones del dispositivo.

## Consideración adicional

Estas dos funcionalidades (SSR1 y Heartbeat) podrían tener una **interpretación especial hardcodeada** basada en su nombre o en los registros 127 y 131, ya que su significado es estándar en todos los relés ABB Serie 615. No dependen de la configuración del usuario.
