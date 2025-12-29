# Inventario de Relés ABB - RelayWatch

> **Fecha de creación**: 2025-12-28
> **Propósito**: Referencia para diseño de UI de configuración de registradores con detección de fallas
> **Ubicación**: Subestación monitoreada por el sistema RelayWatch

---

## Resumen de Equipos

| # | Ubicación | Modelo | Código Completo | Config | CT | Tipo Protección |
|---|-----------|--------|-----------------|--------|-----|-----------------|
| 1 | TERNA 3 | REF615E_D | HBFFAEAGNBC5ANA1XD | C5 | 5A | Alimentador |
| 2 | TERNA 4 | REF615E_D | HBFFAEAGNBC5ANA1XD | C5 | 5A | Alimentador |
| 3 | Alimentador 1 | REF615E_D | HBFCACAPNBC5AAN1XD | C5 | 1A | Alimentador |
| 4 | Alimentador 2 | REF615E_D | HBFCACABNBC5AAN1XD | C5 | 1A | Alimentador |
| 5 | Trafo 1 - 13,2kV (Salida) | **RET615E_D** | HBTBBABANBC5ANN1XD | C5 | 5A | **Transformador** |
| 6 | Trafo 1 - 33kV (Entrada) | REF615E_D | HBFCACABNBC5ANN1XD | C5 | 1A | Alimentador |
| 7 | Alimentador 3 | REF615E_D | HBFCACABNBC5AAN1XD | C5 | 1A | Alimentador |
| 8 | Trafo 2 - 13,2kV (Salida) | **RET615E_D** | HBTBBABANBC5ANN1XD | C5 | 5A | **Transformador** |
| 9 | Trafo 2 - 33kV (Entrada) | REF615E_D | HBFCACABNBC5ANN1XD | C5 | 1A | Alimentador |
| 10 | Alimentador 4 | REF615E_D | HBFCA2ABNBC5AAN1XD | C5 | 1A | Alimentador |
| 11 | Alimentador 8 | REF615E_D | HBFCACABNBC5AAN1XD | C5 | 1A | Alimentador |
| 12 | Trafo 3 (completo) | **RET615** | HBTF5AB4AFB5/BN1XC | **B5** | - | **Transformador** |

---

## Familias de Relés Identificadas

### REF615 - Protección de Alimentadores (Feeder Protection)
- **Función principal**: Protección de líneas de distribución/alimentadores
- **Protecciones típicas**: Sobrecorriente de fase, falla a tierra, sobretensión/subtensión
- **Cantidad en instalación**: 9 unidades

### RET615 - Protección de Transformadores (Transformer Protection)
- **Función principal**: Protección de transformadores de potencia
- **Protecciones adicionales**: Protección diferencial, térmica específica de transformador
- **Cantidad en instalación**: 3 unidades

---

## Configuración C5 - Detalle

Todos los relés identificados usan **Configuración C5** (Feeder with directional earth fault).

### Protecciones incluidas en C5:
| Código | Nombre | Descripción |
|--------|--------|-------------|
| PHLPTOC | Phase Low-set Overcurrent | Sobrecorriente de fase (umbral bajo) |
| PHIPTOC | Phase High-set Overcurrent | Sobrecorriente de fase (umbral alto) |
| EFHPTOC | Earth Fault High-set | Falla a tierra (umbral alto) |
| EFIPTOC | Earth Fault Instantaneous | Falla a tierra instantánea |
| DEFLPDEF | Directional Earth Fault | Falla a tierra direccional |
| PTOV | Overvoltage | Sobretensión |
| PTUV | Undervoltage | Subtensión |
| T1PTTR | Thermal Overload | Sobrecarga térmica |

---

## Configuración de LEDs por Equipo

### TERNA 3 y TERNA 4 (9 LEDs)
| # | Etiqueta | Función |
|---|----------|---------|
| 1 | Sobreintensidad | Sobrecorriente de fase |
| 2 | Falta a tierra | Earth fault |
| 3 | Sobre/sub tensión | Over/undervoltage |
| 4 | Desbalance de fases | Phase unbalance |
| 5 | Sobrecarga térmica | Thermal overload |
| 6 | Fallo de interruptor | Breaker failure |
| 7 | Disparo reg. perturb. | Disturbance recorder trip |
| 8 | Monitorización interruptor | Breaker monitoring |
| 9 | Supervisión | Supervision |

### Alimentador 1 (8 LEDs)
| # | Etiqueta | Función |
|---|----------|---------|
| 1 | Sobreintensidad | Sobrecorriente de fase |
| 2 | Falta a tierra | Earth fault |
| 3 | Falta a tierra sensible | Sensitive earth fault |
| 4 | Desbalance de fases | Phase unbalance |
| 5 | Sobrecarga térmica | Thermal overload |
| 6 | Fallo de interruptor | Breaker failure |
| 7 | Disparo reg. perturb. | Disturbance recorder trip |
| 8 | Fallo circuito disparo | Trip circuit failure |

### Alimentador 2 (10 LEDs) - Con recierre automático
| # | Etiqueta | Función |
|---|----------|---------|
| 1 | Arranque I> | Start overcurrent low-set |
| 2 | Disparo I> | Trip overcurrent low-set |
| 3 | Disparo I>> | Trip overcurrent high-set |
| 4 | Arranque Io > | Start earth fault |
| 5 | Disparo Falla a Tierra | Trip earth fault |
| 6 | Desbalance de Fases | Phase unbalance |
| 7 | Recierre Habilitado | Auto-reclose enabled |
| 8 | Recierre en Progreso | Auto-reclose in progress |
| 9 | Pos CB Abierto | Circuit breaker open position |
| 10 | Pos CB Cerrado | Circuit breaker closed position |

### Trafo 1 - 33kV Entrada (8 LEDs)
| # | Etiqueta | Función |
|---|----------|---------|
| 1 | Sobreintensidad | Sobrecorriente de fase |
| 2 | Falta a tierra | Earth fault |
| 3 | Falta a tierra sensible | Sensitive earth fault |
| 4 | Desbalance de fases | Phase unbalance |
| 5 | Sobrecarga térmica | Thermal overload |
| 6 | Fallo de interruptor | Breaker failure |
| 7 | Disparo reg. perturb. | Disturbance recorder trip |
| 8 | Fallo circuito disparo | Trip circuit failure |

### Trafo 2 - 13,2kV Salida - RET615 (10 LEDs)
| # | Etiqueta | Función |
|---|----------|---------|
| 1 | Prot dif pol. etapa baja | Differential protection low stage |
| 2 | Prot dif pol. etapa alta | Differential protection high stage |
| 3 | Sobreintensidad | Sobrecorriente de fase |
| 4 | Falta a tierra restringida | Restricted earth fault |
| 5 | Falta a tierra | Earth fault |
| 6 | Fallo de interruptor | Breaker failure |
| 7 | F. sec. neg. / sobrecarga T° | Negative seq. / thermal overload |
| 8 | Disparo reg. perturb. | Disturbance recorder trip |
| 9 | Supervisión | Supervision |
| 10 | Disparo externo | External trip |

### Trafo 2 - 33kV Entrada (8 LEDs)
| # | Etiqueta | Función |
|---|----------|---------|
| 1 | Sobreintensidad | Sobrecorriente de fase |
| 2 | Falta a tierra | Earth fault |
| 3 | Falta a tierra sensible | Sensitive earth fault |
| 4 | Desbalance de fases | Phase unbalance |
| 5 | Sobrecarga térmica | Thermal overload |
| 6 | Fallo de interruptor | Breaker failure |
| 7 | Disparo reg. perturb. | Disturbance recorder trip |
| 8 | Fallo circuito disparo | Trip circuit failure |

### Alimentador 4 (11 LEDs) - Con recierre automático
| # | Etiqueta | Función |
|---|----------|---------|
| 1 | Arranque I> | Start overcurrent low-set |
| 2 | Disparo I> | Trip overcurrent low-set |
| 3 | Falla a Tierra sensible | Sensitive earth fault |
| 4 | Disparo I>> | Trip overcurrent high-set |
| 5 | Arranque Io > | Start earth fault |
| 6 | Disparo Falla a Tierra | Trip earth fault |
| 7 | Desbalance de Fase | Phase unbalance |
| 8 | Recierre Habilitado | Auto-reclose enabled |
| 9 | Recierre en Progreso | Auto-reclose in progress |
| 10 | Pos CB Abierto | Circuit breaker open position |
| 11 | Pos CB Cerrado | Circuit breaker closed position |

### Alimentador 8 (11 LEDs) - Con recierre automático
| # | Etiqueta | Función |
|---|----------|---------|
| 1 | Arranque I> | Start overcurrent low-set |
| 2 | Disparo I> | Trip overcurrent low-set |
| 3 | Falla Secuencia Negativa | Negative sequence fault |
| 4 | Disparo I>> | Trip overcurrent high-set |
| 5 | Arranque Io > | Start earth fault |
| 6 | Disparo Falla a Tierra | Trip earth fault |
| 7 | Desbalance de Fases | Phase unbalance |
| 8 | Recierre Habilitado | Auto-reclose enabled |
| 9 | Recierre en Progreso | Auto-reclose in progress |
| 10 | Pos CB Abierto | Circuit breaker open position |
| 11 | Pos CB Cerrado | Circuit breaker closed position |

### Trafo 3 - RET615 Config B5 (10 LEDs) - Monitoreo dual 13.2kV/33kV
| # | Etiqueta | Función |
|---|----------|---------|
| 1 | Prot dif etapa baja | Differential protection low stage |
| 2 | Prot dif etapa alta | Differential protection high stage |
| 3 | Arranque I máx | Start overcurrent max |
| 4 | Disparo I máx | Trip overcurrent max |
| 5 | Arranque máx I | Start max current |
| 6 | Disparo I máx | Trip max current |
| 7 | PTI | Transformer thermal image |
| 8 | Disp reg. perturb. | Disturbance recorder trip |
| 9 | Supervisión | Supervision |
| 10 | Open / Close | CB position |

> **NOTA**: Este relé tiene configuración **B5** (diferente a C5) y monitorea ambos lados del transformador (13.2kV y 33kV) en un solo equipo, sin necesidad de un REF615 adicional.

---

## Observaciones Importantes

### 1. Variabilidad de LEDs programables
Aunque todos los relés son configuración C5, **los LEDs son programables** y cada instalación puede tenerlos configurados de manera diferente. Esto implica que:
- No podemos asumir qué LED representa qué protección solo por la configuración
- **Se necesita una forma de mapear los LEDs** al configurar cada registrador en la UI

### 2. Diferencias en hardware
- **CT de 5A vs 1A**: Los TERNAs usan 5A, los alimentadores 1A (importante para cálculos)
- **Binary I/O**: Varían entre equipos (E, C, etc.)
- **Protocolo adicional**: Algunos tienen (P), otros no (N)

### 3. Funciones especiales detectadas
- **Recierre automático**: Alimentador 2 tiene LEDs específicos para auto-reclose
- **Posición de interruptor**: Alimentador 2 muestra estado del CB (abierto/cerrado)
- **Falla a tierra sensible**: Algunos equipos tienen protección SEFPTOC adicional

### 4. Implicaciones para la UI
1. **Selector de familia**: REF615 vs RET615 (diferentes funciones disponibles)
2. **Selector de configuración**: C5 u otras (A, B, D, etc. si aparecen)
3. **Mapeo de LEDs personalizable**: Cada equipo puede tener diferente asignación
4. **Campo para CT**: 1A o 5A (afecta factor de escala en mediciones)

---

## Registros Modbus Relevantes (REF615)

| Registro | Descripción |
|----------|-------------|
| 137-156 | Mediciones de corriente/voltaje (20 registros) |
| 151-153 | Mediciones reducidas (3 registros) |
| 171 | Inicio de registros de protección |
| 173 | Estado de LEDs programables (11 bits) |
| 171-201 | Bloque completo de protecciones |

### Estructura del registro 173 (LEDs)
```
Bit 0: LED 1 (usualmente Sobreintensidad)
Bit 1: LED 2 (usualmente Falta a tierra)
...
Bit 10: LED 11
```
> **Nota**: El mapeo real depende de la programación de cada relé

---

## Pendientes de Identificar

- [ ] Trafo 1 - 13,2kV: Falta foto del panel frontal con etiquetas de LEDs
- [ ] Trafo 2 y Trafo 3: Faltan fotos de identificación
- [ ] Verificar si hay más alimentadores o ternas

---

## Historial de Actualizaciones

| Fecha | Cambio |
|-------|--------|
| 2025-12-28 | Documento inicial con 6 relés identificados |
| 2025-12-28 | Agregado detalle de LEDs por equipo |
| 2025-12-28 | Identificada familia RET615 (transformador) |
| 2025-12-28 | Agregado Alimentador 3 (REF615E_D) |
| 2025-12-28 | Agregado Trafo 2 completo (RET615 + REF615) con LEDs |
| 2025-12-28 | Agregado Alimentador 4 (REF615E_D con recierre) |
| 2025-12-28 | Agregado Alimentador 8 (REF615E_D con recierre) |
| 2025-12-28 | Agregado Trafo 3 - RET615 Config B5 (monitoreo dual) |
