# TAREA: Eliminar Código Muerto - Frontend RelayWatch

## IMPORTANTE
- Antes de eliminar cada función/constante, verificar que NO aparezca en ningún otro lugar
- Hacer commit después de cada archivo modificado
- Ejecutar `npm run build` al final para verificar

---

## FASE 1: SERVICIOS API

### Archivo: `src/servicios/api/agentes.js`

ELIMINAR estas 5 funciones (son legacy y no se usan):

```javascript
// ELIMINAR - obtenerEstadoAgente
export async function obtenerEstadoAgente(workspaceId) {
   return fetchConAuth(`/api/agentes/estado?workspaceId=${workspaceId}`);
}

// ELIMINAR - solicitarVinculacionAgente
export async function solicitarVinculacionAgente(workspaceId) {
   return fetchConAuth('/api/agentes/solicitar-vinculacion', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
   });
}

// ELIMINAR - desvincularAgente (la función del API, NO la del hook useAgentesConfig)
export async function desvincularAgente(workspaceId) {
   return fetchConAuth('/api/agentes/desvincular', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
   });
}

// ELIMINAR - rotarClaveAgente
export async function rotarClaveAgente(workspaceId) {
   return fetchConAuth('/api/agentes/rotar-clave', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
   });
}

// ELIMINAR - actualizarAgente (nunca se usa)
export async function actualizarAgente(agenteId, datos) {
   return fetchConAuth(`/api/admin/agentes/${agenteId}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
   });
}
```

También eliminar los comentarios `@deprecated` asociados y la sección "AGENTES (Legacy - mantener por compatibilidad)".

---

### Archivo: `src/servicios/api/alimentadores.js`

ELIMINAR:
```javascript
// ELIMINAR - moverAlimentador (nunca se usa)
export async function moverAlimentador(alimentadorId, nuevoPuestoId) {
   return fetchConAuth(`/api/alimentadores/${alimentadorId}/mover`, {
      method: 'PUT',
      body: JSON.stringify({ nuevo_puesto_id: nuevoPuestoId }),
   });
}
```

---

### Archivo: `src/servicios/api/lecturas.js`

ELIMINAR:
```javascript
// ELIMINAR - obtenerUltimasLecturas (se usa obtenerUltimasLecturasPorRegistrador)
export async function obtenerUltimasLecturas(alimentadorId, tipo = null, limite = 1) {
   // ...toda la función
}

// ELIMINAR - obtenerLecturasHistoricas (se usa obtenerLecturasHistoricasPorRegistrador)
export async function obtenerLecturasHistoricas(alimentadorId, desde, hasta, tipo = null) {
   // ...toda la función
}
```

---

### Archivo: `src/servicios/api/registradores.js`

ELIMINAR:
```javascript
// ELIMINAR - solicitarTestCoils (nunca se usa)
export async function solicitarTestCoils(agenteId, datos) {
   return fetchConAuth(`/api/agentes/${agenteId}/test-coils`, {
      method: 'POST',
      body: JSON.stringify(datos),
   });
}

// ELIMINAR - testConexionModbus (nunca se usa)
export async function testConexionModbus(ip, puerto, unitId = 1, indiceInicial = 0, cantRegistros = 10) {
   return fetchConAuth('/api/test-conexion', {
      method: 'POST',
      body: JSON.stringify({ ip, puerto, unitId, indiceInicial, cantRegistros }),
   });
}
```

---

### Archivo: `src/servicios/api/puestos.js`

ELIMINAR:
```javascript
// ELIMINAR - reordenarPuestos (nunca se usa)
export async function reordenarPuestos(workspaceId, ordenIds) {
   return fetchConAuth(`/api/workspaces/${workspaceId}/puestos/reordenar`, {
      method: 'PUT',
      body: JSON.stringify({ orden: ordenIds }),
   });
}
```

---

### Archivo: `src/servicios/api/dispositivos.js`

ELIMINAR:
```javascript
// ELIMINAR - desregistrarTokenDispositivo (nunca se usa)
export async function desregistrarTokenDispositivo(fcmToken) {
   return fetchConAuth('/api/dispositivos/desregistrar', {
      method: 'DELETE',
      body: JSON.stringify({ fcmToken }),
   });
}
```

---

### Archivo: `src/servicios/api/index.js`

ELIMINAR de los exports:
- `obtenerEstadoAgente`
- `solicitarVinculacionAgente`
- `desvincularAgente`
- `rotarClaveAgente`
- `actualizarAgente`
- `moverAlimentador`
- `obtenerUltimasLecturas`
- `obtenerLecturasHistoricas`
- `solicitarTestCoils` (si está)
- `testConexionModbus`
- `reordenarPuestos` (si está)
- `desregistrarTokenDispositivo`

---

## FASE 2: CONSTANTES

### Archivo: `src/paginas/PaginaAlimentadores/constantes/historialConfig.js`

ELIMINAR estas 4 constantes:
```javascript
// ELIMINAR - INTERVALOS_FILTRO
export const INTERVALOS_FILTRO = [
  { id: 5, label: "5 min" },
  { id: 15, label: "15 min" },
  { id: 30, label: "30 min" },
  { id: 60, label: "1 hora" },
];

// ELIMINAR - INDEXEDDB_CONFIG
export const INDEXEDDB_CONFIG = {
  dbName: "RelayWatchHistorial",
  version: 1,
  storeName: "lecturas",
};

// ELIMINAR - ESTILOS_GRAFICO_BASE
export const ESTILOS_GRAFICO_BASE = {
  background: "#0f172a",
  foreColor: "#e2e8f0",
  gridColor: "#334155",
  labelColor: "#94a3b8",
  borderColor: "#334155",
};

// ELIMINAR - ESTILOS_GRAFICO_EXPORT
export const ESTILOS_GRAFICO_EXPORT = {
  background: "#ffffff",
  foreColor: "#1a1a1a",
  gridColor: "#bbbbbb",
  labelColor: "#1a1a1a",
  borderColor: "#333333",
  fontSize: "16px",
  fontSizeTitle: "17px",
  fontWeight: 600,
  fontWeightTitle: 700,
};
```

---

### Archivo: `src/paginas/PaginaAlimentadores/constantes/estilosGlobalesTarjeta.js`

ELIMINAR:
```javascript
// ELIMINAR - FUENTES_DIGITALES (es solo un alias, no se usa)
export const FUENTES_DIGITALES = FUENTES_DISPONIBLES;
```

---

### Archivo: `src/paginas/PaginaAlimentadores/constantes/funcionalidadesRele.js`

ELIMINAR:
```javascript
// ELIMINAR - getFuncionalidadesPorCategoria (nunca se usa)
export const getFuncionalidadesPorCategoria = () => {
  const agrupadas = {};

  Object.values(FUNCIONALIDADES_DISPONIBLES).forEach((func) => {
    if (!agrupadas[func.categoria]) {
      agrupadas[func.categoria] = {
        ...CATEGORIAS_FUNCIONALIDADES[func.categoria],
        funcionalidades: [],
      };
    }
    agrupadas[func.categoria].funcionalidades.push(func);
  });

  return agrupadas;
};
```

---

## FASE 3: UTILIDADES

### Archivo: `src/paginas/PaginaAlimentadores/utilidades/calculadorRutas.js`

ELIMINAR:
```javascript
// ELIMINAR - precalcularTodasLasRutas (nunca se usa)
export function precalcularTodasLasRutas(bornes, celdas) {
  // ...toda la función
}

// ELIMINAR - obtenerSiguientePaso (nunca se usa)
export function obtenerSiguientePaso(chispa, grafo, bornes) {
  // ...toda la función
}
```

---

### Archivo: `src/paginas/PaginaAlimentadores/utilidades/interpreteRegistrosREF615.js`

ELIMINAR:
```javascript
// ELIMINAR - obtenerDefinicionRegistro
export function obtenerDefinicionRegistro(numeroRegistro) {
  return MAPA_REGISTROS[numeroRegistro] || null;
}

// ELIMINAR - obtenerEtiquetasDefecto
export function obtenerEtiquetasDefecto(numeroRegistro) {
  // ...toda la función
}

// ELIMINAR - REGISTROS_INTERPRETABLES
export const REGISTROS_INTERPRETABLES = MAPA_REGISTROS;
```

También eliminar del `export default` al final del archivo:
- `obtenerDefinicionRegistro`
- `obtenerEtiquetasDefecto`
- `REGISTROS_INTERPRETABLES`

---

### Archivo: `src/paginas/PaginaAlimentadores/utilidades/indexedDBHelper.js`

ELIMINAR:
```javascript
// ELIMINAR - contarLecturas (nunca se usa)
export const contarLecturas = async (db, alimentadorId) => {
  // ...toda la función
};
```

---

### Archivo: `src/paginas/PaginaAlimentadores/utilidades/exportarCSV.js`

ELIMINAR:
```javascript
// ELIMINAR - exportarSeriesCSV (nunca se usa)
export const exportarSeriesCSV = (series, nombreArchivo) => {
  // ...toda la función
};
```

---

## FASE 4: VERIFICACIÓN FINAL

```bash
# 1. Verificar lint
npm run lint

# 2. Verificar build
npm run build

# 3. Si todo OK, hacer commit final
git add -A
git commit -m "refactor: eliminar código muerto detectado en auditoría exhaustiva

- Eliminar 12 funciones API no utilizadas
- Eliminar 6 constantes no utilizadas
- Eliminar 5 funciones de utilidades no utilizadas
- Total: ~300-400 líneas de código muerto removidas"
```

---

## RESUMEN DE ELIMINACIONES

| Archivo | Elementos a Eliminar |
|---------|---------------------|
| api/agentes.js | 5 funciones |
| api/alimentadores.js | 1 función |
| api/lecturas.js | 2 funciones |
| api/registradores.js | 2 funciones |
| api/puestos.js | 1 función |
| api/dispositivos.js | 1 función |
| api/index.js | ~12 exports |
| historialConfig.js | 4 constantes |
| estilosGlobalesTarjeta.js | 1 constante |
| funcionalidadesRele.js | 1 función |
| calculadorRutas.js | 2 funciones |
| interpreteRegistrosREF615.js | 3 elementos |
| indexedDBHelper.js | 1 función |
| exportarCSV.js | 1 función |
| **TOTAL** | **~36 eliminaciones** |
