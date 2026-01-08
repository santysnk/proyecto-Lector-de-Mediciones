# REPORTE EXHAUSTIVO DE CÓDIGO MUERTO
## Frontend RelayWatch - Análisis Archivo por Archivo

**Fecha:** 2026-01-08
**Archivos analizados:** 23+ archivos de servicios, constantes, utilidades y hooks
**Método:** Verificación de cada export contra uso real (excluyendo definiciones y re-exports)

---

## RESUMEN EJECUTIVO

| Categoría | Elementos Muertos | Impacto |
|-----------|-------------------|---------|
| Funciones API | 12 | Alto |
| Constantes | 6 | Bajo |
| Utilidades | 5 | Medio |
| **TOTAL** | **23** | - |

---

## 1. SERVICIOS API - CÓDIGO MUERTO

### 1.1 `src/servicios/api/agentes.js`

| Función | Estado | Motivo |
|---------|--------|--------|
| `obtenerEstadoAgente` | ❌ MUERTO | Legacy, no se usa en ningún lado |
| `solicitarVinculacionAgente` | ❌ MUERTO | Legacy, reemplazada por `vincularAgenteWorkspace` |
| `desvincularAgente` | ❌ MUERTO | Legacy, hay función local en hook con mismo nombre |
| `rotarClaveAgente` | ❌ MUERTO | Legacy, reemplazada por `rotarClaveAgentePorId` |
| `actualizarAgente` | ❌ MUERTO | Nunca se llama, solo se exporta |

**Acción requerida:**
```javascript
// ELIMINAR estas funciones de api/agentes.js:
// - obtenerEstadoAgente (líneas ~32922-32928)
// - solicitarVinculacionAgente (líneas ~32930-32939)
// - desvincularAgente (líneas ~32941-32950)
// - rotarClaveAgente (líneas ~32952-32960)
// - actualizarAgente (líneas ~32985-32993)

// ELIMINAR del api/index.js los exports:
// - obtenerEstadoAgente
// - solicitarVinculacionAgente
// - desvincularAgente
// - rotarClaveAgente
// - actualizarAgente
```

---

### 1.2 `src/servicios/api/alimentadores.js`

| Función | Estado | Motivo |
|---------|--------|--------|
| `moverAlimentador` | ❌ MUERTO | Solo definición y export, nunca se llama |

**Acción requerida:**
```javascript
// ELIMINAR de api/alimentadores.js:
// - moverAlimentador (líneas ~33106-33110)

// ELIMINAR del api/index.js:
// - moverAlimentador
```

---

### 1.3 `src/servicios/api/lecturas.js`

| Función | Estado | Motivo |
|---------|--------|--------|
| `obtenerUltimasLecturas` | ❌ MUERTO | Solo export, nunca se llama |
| `obtenerLecturasHistoricas` | ❌ MUERTO | Solo export, nunca se llama |

**Nota:** Se usan las versiones `*PorRegistrador` de estas funciones.

**Acción requerida:**
```javascript
// ELIMINAR de api/lecturas.js:
// - obtenerUltimasLecturas (líneas ~33338-33347)
// - obtenerLecturasHistoricas (líneas ~33349-33360)

// ELIMINAR del api/index.js:
// - obtenerUltimasLecturas
// - obtenerLecturasHistoricas
```

---

### 1.4 `src/servicios/api/registradores.js`

| Función | Estado | Motivo |
|---------|--------|--------|
| `solicitarTestCoils` | ❌ MUERTO | Solo definición y export, nunca se llama |
| `testConexionModbus` | ❌ MUERTO | Solo definición y export, nunca se llama |

**Acción requerida:**
```javascript
// ELIMINAR de api/registradores.js:
// - solicitarTestCoils (líneas ~33593-33597)
// - testConexionModbus (líneas ~33607-33611)

// ELIMINAR del api/index.js:
// - solicitarTestCoils (NO está exportada, pero verificar)
// - testConexionModbus
```

---

### 1.5 `src/servicios/api/puestos.js`

| Función | Estado | Motivo |
|---------|--------|--------|
| `reordenarPuestos` | ❌ MUERTO | Solo definición y export, nunca se llama |

**Acción requerida:**
```javascript
// ELIMINAR de api/puestos.js:
// - reordenarPuestos (líneas ~33501-33505)

// ELIMINAR del api/index.js:
// - reordenarPuestos (verificar si está exportada)
```

---

### 1.6 `src/servicios/api/dispositivos.js`

| Función | Estado | Motivo |
|---------|--------|--------|
| `desregistrarTokenDispositivo` | ❌ MUERTO | Solo definición y export, nunca se llama |

**Acción requerida:**
```javascript
// ELIMINAR de api/dispositivos.js:
// - desregistrarTokenDispositivo (líneas ~33183-33187)

// ELIMINAR del api/index.js:
// - desregistrarTokenDispositivo
```

---

## 2. CONSTANTES - CÓDIGO MUERTO

### 2.1 `src/paginas/PaginaAlimentadores/constantes/historialConfig.js`

| Constante | Estado | Motivo |
|-----------|--------|--------|
| `INTERVALOS_FILTRO` | ❌ MUERTO | Solo definición, nunca se usa |
| `INDEXEDDB_CONFIG` | ❌ MUERTO | Solo definición, nunca se usa |
| `ESTILOS_GRAFICO_BASE` | ❌ MUERTO | Solo definición, nunca se usa |
| `ESTILOS_GRAFICO_EXPORT` | ❌ MUERTO | Solo definición, nunca se usa |

**Acción requerida:**
```javascript
// ELIMINAR de constantes/historialConfig.js:
// - INTERVALOS_FILTRO (líneas ~18531-18537)
// - INDEXEDDB_CONFIG (líneas ~18546-18551)
// - ESTILOS_GRAFICO_BASE (líneas ~18553-18559)
// - ESTILOS_GRAFICO_EXPORT (líneas ~18562-18572)
```

---

### 2.2 `src/paginas/PaginaAlimentadores/constantes/estilosGlobalesTarjeta.js`

| Constante | Estado | Motivo |
|-----------|--------|--------|
| `FUENTES_DIGITALES` | ❌ MUERTO | Es alias de FUENTES_DISPONIBLES, nunca se usa directamente |

**Acción requerida:**
```javascript
// ELIMINAR de constantes/estilosGlobalesTarjeta.js:
// - FUENTES_DIGITALES (línea ~18284)
// export const FUENTES_DIGITALES = FUENTES_DISPONIBLES;
```

---

### 2.3 `src/paginas/PaginaAlimentadores/constantes/funcionalidadesRele.js`

| Función | Estado | Motivo |
|---------|--------|--------|
| `getFuncionalidadesPorCategoria` | ❌ MUERTO | Solo definición, nunca se llama |

**Acción requerida:**
```javascript
// ELIMINAR de constantes/funcionalidadesRele.js:
// - getFuncionalidadesPorCategoria (líneas ~18458-18472)
```

---

## 3. UTILIDADES - CÓDIGO MUERTO

### 3.1 `src/paginas/PaginaAlimentadores/utilidades/calculadorRutas.js`

| Función | Estado | Motivo |
|---------|--------|--------|
| `precalcularTodasLasRutas` | ❌ MUERTO | Solo definición y export, nunca se llama |
| `obtenerSiguientePaso` | ❌ MUERTO | Solo definición y export, nunca se llama |

**Acción requerida:**
```javascript
// ELIMINAR de utilidades/calculadorRutas.js:
// - precalcularTodasLasRutas (líneas ~29436-29454)
// - obtenerSiguientePaso (líneas ~29457-29500)
```

---

### 3.2 `src/paginas/PaginaAlimentadores/utilidades/interpreteRegistrosREF615.js`

| Elemento | Estado | Motivo |
|----------|--------|--------|
| `obtenerDefinicionRegistro` | ❌ MUERTO | Solo export en default, nunca se llama |
| `obtenerEtiquetasDefecto` | ❌ MUERTO | Solo export en default, nunca se llama |
| `REGISTROS_INTERPRETABLES` | ❌ MUERTO | Solo export en default, nunca se usa |

**Acción requerida:**
```javascript
// ELIMINAR de utilidades/interpreteRegistrosREF615.js:
// - obtenerDefinicionRegistro (líneas ~32134-32141)
// - obtenerEtiquetasDefecto (líneas ~32170-32186)
// - REGISTROS_INTERPRETABLES (línea ~32251)

// ELIMINAR del export default:
// - obtenerDefinicionRegistro
// - obtenerEtiquetasDefecto
// - REGISTROS_INTERPRETABLES
```

---

### 3.3 `src/paginas/PaginaAlimentadores/utilidades/indexedDBHelper.js`

| Función | Estado | Motivo |
|---------|--------|--------|
| `contarLecturas` | ❌ MUERTO | Solo definición y export, nunca se llama |

**Acción requerida:**
```javascript
// ELIMINAR de utilidades/indexedDBHelper.js:
// - contarLecturas (líneas ~31538-31553)
```

---

### 3.4 `src/paginas/PaginaAlimentadores/utilidades/exportarCSV.js`

| Función | Estado | Motivo |
|---------|--------|--------|
| `exportarSeriesCSV` | ❌ MUERTO | Solo definición y export, nunca se llama |

**Acción requerida:**
```javascript
// ELIMINAR de utilidades/exportarCSV.js:
// - exportarSeriesCSV (líneas ~30621-...)
```

---

## 4. PROMPT PARA EL AGENTE

Copia y pega este prompt al agente Claude Code:

```
# TAREA: Eliminar Código Muerto del Frontend RelayWatch

## INSTRUCCIONES
Por cada archivo listado, eliminar las funciones/constantes indicadas.
Después de cada eliminación, verificar que no haya errores de compilación.

## ARCHIVOS A MODIFICAR

### 1. src/servicios/api/agentes.js
ELIMINAR:
- función obtenerEstadoAgente
- función solicitarVinculacionAgente  
- función desvincularAgente (la legacy, NO la del hook)
- función rotarClaveAgente
- función actualizarAgente

### 2. src/servicios/api/index.js
ELIMINAR de los exports:
- obtenerEstadoAgente
- solicitarVinculacionAgente
- desvincularAgente
- rotarClaveAgente
- actualizarAgente
- moverAlimentador
- obtenerUltimasLecturas
- obtenerLecturasHistoricas
- testConexionModbus
- desregistrarTokenDispositivo

### 3. src/servicios/api/alimentadores.js
ELIMINAR:
- función moverAlimentador

### 4. src/servicios/api/lecturas.js
ELIMINAR:
- función obtenerUltimasLecturas
- función obtenerLecturasHistoricas

### 5. src/servicios/api/registradores.js
ELIMINAR:
- función solicitarTestCoils
- función testConexionModbus

### 6. src/servicios/api/puestos.js
ELIMINAR:
- función reordenarPuestos

### 7. src/servicios/api/dispositivos.js
ELIMINAR:
- función desregistrarTokenDispositivo

### 8. src/paginas/PaginaAlimentadores/constantes/historialConfig.js
ELIMINAR:
- INTERVALOS_FILTRO
- INDEXEDDB_CONFIG
- ESTILOS_GRAFICO_BASE
- ESTILOS_GRAFICO_EXPORT

### 9. src/paginas/PaginaAlimentadores/constantes/estilosGlobalesTarjeta.js
ELIMINAR:
- FUENTES_DIGITALES (el alias)

### 10. src/paginas/PaginaAlimentadores/constantes/funcionalidadesRele.js
ELIMINAR:
- función getFuncionalidadesPorCategoria

### 11. src/paginas/PaginaAlimentadores/utilidades/calculadorRutas.js
ELIMINAR:
- función precalcularTodasLasRutas
- función obtenerSiguientePaso

### 12. src/paginas/PaginaAlimentadores/utilidades/interpreteRegistrosREF615.js
ELIMINAR:
- función obtenerDefinicionRegistro
- función obtenerEtiquetasDefecto
- constante REGISTROS_INTERPRETABLES
- Y eliminar del export default estas 3

### 13. src/paginas/PaginaAlimentadores/utilidades/indexedDBHelper.js
ELIMINAR:
- función contarLecturas

### 14. src/paginas/PaginaAlimentadores/utilidades/exportarCSV.js
ELIMINAR:
- función exportarSeriesCSV

## VERIFICACIÓN FINAL
Después de todas las eliminaciones:
1. Ejecutar: npm run lint
2. Ejecutar: npm run build
3. Si hay errores, revertir la eliminación problemática y reportar
```

---

## 5. NOTAS ADICIONALES

### Componentes con nombres duplicados (NO SON CÓDIGO MUERTO)

Los siguientes componentes tienen el mismo nombre pero son diferentes:

1. **EstadoVacio**
   - `layout/EstadoVacio.jsx` - Props: `{tipo, onSalir}` - Para app general
   - `ModalConfigurarAgente` (interno) - Props: `{icono, mensaje, children}` - Específico del modal
   
2. **OverlayGuardando**
   - `layout/OverlayGuardando.jsx` - Props: `{visible, texto}` - Exportado
   - `BotonGuardarCambios.jsx` (interno) - Sin props - Específico del botón

**Decisión:** Mantener separados, son componentes diferentes con el mismo nombre en diferentes contextos.

---

## 6. ESTADÍSTICAS FINALES

- **Funciones API eliminables:** 12
- **Constantes eliminables:** 6
- **Utilidades eliminables:** 5
- **Líneas de código aprox. a eliminar:** ~300-400
- **Tiempo estimado:** 30-45 minutos
