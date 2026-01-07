# Prompt: Corregir visualización Heartbeat y LEDs

## Problema 1: Heartbeat muestra bits innecesarios

### Actual:
```
* Heartbeat (SSR5)
Alive [131] = 25692
CONECTADO
Bit 2Bit 3Bit 4Bit 6Bit 10Bit 13Bit 14    ← SOBRA
```

### Esperado:
```
* Heartbeat (SSR5)
💚 CONECTADO
```

### Solución:
Para la funcionalidad Heartbeat (registro 131 / SSR5), NO mostrar desglose de bits. Solo mostrar el estado de conexión.

---

## Problema 2: LEDs muestra bits no configurados

### Actual:
```
* LEDs del Panel
Alarma [172] = 20480
Bit 12  Bit 14                ← Estos bits NO están en la plantilla
```

La plantilla solo tiene configurados Bit 0 a Bit 9, pero el código muestra Bit 12 y Bit 14 que están activos en el registro.

### Esperado:
```
* LEDs del Panel
Alarma [172] = 20480
Sin señales activas           ← Porque ningún bit configurado (0-9) está activo
```

### Solución:
Al mostrar los bits activos del registro de LEDs, **filtrar solo los bits que están definidos en la configuración de etiquetas de la plantilla**.

```javascript
// Pseudocódigo
const bitsConfigurados = plantilla.etiquetasLeds.map(led => led.bit); // [0,1,2,3,4,5,6,7,8,9]
const bitsActivos = obtenerBitsActivos(valor); // [12, 14]

// Filtrar solo los configurados
const bitsAMostrar = bitsActivos.filter(bit => bitsConfigurados.includes(bit));

if (bitsAMostrar.length === 0) {
  mostrar("Sin señales activas");
} else {
  mostrar(bitsAMostrar.map(bit => etiquetasLeds[bit].nombre));
}
```

---

## Resumen

| Problema | Solución |
|----------|----------|
| Heartbeat muestra bits | No mostrar bits, solo estado CONECTADO/DESCONECTADO |
| LEDs muestra bits no configurados | Filtrar y mostrar solo bits definidos en plantilla |
