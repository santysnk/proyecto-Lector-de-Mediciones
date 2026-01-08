# PROMPT: Auditoría y Limpieza del Frontend RelayWatch

## Contexto
El frontend de RelayWatch ha sido refactorizado recientemente. Necesito una auditoría exhaustiva para:
1. Detectar y eliminar código muerto
2. Corregir inconsistencias de nomenclatura
3. Consolidar código duplicado
4. Mejorar la estructura donde sea necesario

---

## TAREA 1: Verificar y Eliminar Código Muerto

### 1.1 Archivo `apiService.js` - Posible redundancia

**Ubicación:** `src/servicios/apiService.js`

**Contenido actual:**
```javascript
export * from './api';
export { default } from './api/index';
```

**Acción:**
1. Buscar en TODO el proyecto imports de `apiService` o `apiService.js`
2. Si todos los imports pueden usar `./api` o `./api/index`, eliminar `apiService.js`
3. Si hay imports legacy, migrarlos a usar directamente `./api`

**Comando para buscar:**
```bash
grep -r "apiService" src/ --include="*.js" --include="*.jsx"
```

### 1.2 Buscar exports no utilizados

Ejecutar análisis de imports no usados en estos archivos:

```bash
# Instalar herramienta si no existe
npm install -g unimported

# Ejecutar análisis
npx unimported
```

### 1.3 Funciones Legacy en `registradores.js`

**Ubicación:** `src/servicios/api/registradores.js`

Hay dos grupos de funciones que parecen hacer lo mismo:

**Grupo 1 - Nueva arquitectura (mantener):**
- `listarRegistradoresAgente()`
- `crearRegistradorAgente()`
- `actualizarRegistradorAgente()`
- `eliminarRegistradorAgente()`
- `toggleRegistradorAgente()`

**Grupo 2 - Legacy (verificar si se usan):**
- `obtenerRegistradores()` - marcada como "Legacy"
- `crearRegistrador()` - marcada como "Legacy"
- `actualizarRegistrador()` - marcada como "Legacy"
- `eliminarRegistrador()` - marcada como "Legacy"
- `toggleActivoRegistrador()` - marcada como "Legacy"
- `testConexionRegistrador()` - marcada como "Legacy"

**Acción:**
1. Buscar uso de cada función legacy
2. Si no se usan, eliminarlas
3. Si se usan, migrar a las nuevas y luego eliminar

### 1.4 Verificar hooks de preferencias - Posible sobre-fragmentación

**Ubicación:** `src/paginas/PaginaAlimentadores/hooks/preferencias/`

Hay 8 hooks de preferencias:
```
useColoresPuesto.js
useEscalasCombinadas.js
useEstilosApariencia.js
useEstilosGlobales.js
useGapsCombinados.js
usePreferenciasUI.js
usePreferenciasVisuales.js
useSincronizacionCambios.js
```

**Acción:**
1. Analizar dependencias entre estos hooks
2. Si `useEscalasCombinadas` y `useGapsCombinados` solo son usados por `usePreferenciasUI`, considerar fusionarlos
3. Documentar la decisión en un comentario si se decide mantener separados

---

## TAREA 2: Corregir Inconsistencias de Nomenclatura

### 2.1 Archivos con nombres incorrectos

| Archivo actual | Nombre correcto | Razón |
|----------------|-----------------|-------|
| `recuperarContraseña.jsx` | `RecuperarContrasena.jsx` | Componentes deben ser PascalCase, evitar ñ |
| `recuperarContraseña.css` | `RecuperarContrasena.css` | Consistencia con el componente |

**Acción:**
```bash
# En src/paginas/PaginaRecuperar/
mv recuperarContraseña.jsx RecuperarContrasena.jsx
mv recuperarContraseña.css RecuperarContrasena.css

# Actualizar import en App.jsx
# Cambiar: import RecuperarContrasena from "./paginas/PaginaRecuperar/recuperarContraseña.jsx"
# Por: import RecuperarContrasena from "./paginas/PaginaRecuperar/RecuperarContrasena.jsx"
```

### 2.2 Verificar consistencia en nombres de hooks

Todos los hooks deben seguir el patrón `use[NombreDescriptivo].js` (camelCase con prefijo "use"):

```bash
# Buscar hooks que no sigan el patrón
find src/ -name "*.js" -path "*/hooks/*" | grep -v "use" | grep -v "index"
```

### 2.3 Verificar imports con rutas relativas largas

Buscar imports con muchos `../`:

```bash
grep -r "from '\.\./\.\./\.\./\.\." src/ --include="*.js" --include="*.jsx"
```

Si hay muchos, considerar usar el alias `@/` configurado en Vite.

---

## TAREA 3: Eliminar Comentarios Extensos Redundantes

### 3.1 Comentarios tipo "NOTA PERSONAL"

**Ejemplo encontrado en `App.jsx` y `recuperarContraseña.jsx`:**
```javascript
// ---------------------------------------------------------------------------
// NOTA PERSONAL SOBRE ESTE ARCHIVO (App.jsx)
// - Este componente define el enrutado de alto nivel de la aplicación.
// ... (30+ líneas de comentarios)
```

**Acción:**
1. Estos comentarios son útiles para aprendizaje pero no para producción
2. Moverlos a un archivo `README.md` en cada carpeta si se quieren conservar
3. O eliminarlos si el código es autoexplicativo

**Archivos a revisar:**
- `src/App.jsx`
- `src/paginas/PaginaRecuperar/recuperarContraseña.jsx`
- Cualquier otro archivo con bloques de comentarios > 20 líneas

---

## TAREA 4: Crear Carpeta de Tipos

### 4.1 Crear `src/tipos/index.js`

**Acción:** Crear archivo con JSDoc typedefs centralizados:

```javascript
// src/tipos/index.js
// Definiciones de tipos centralizadas para el proyecto

/**
 * @typedef {Object} Alimentador
 * @property {string} id - UUID del alimentador
 * @property {string} nombre - Nombre descriptivo
 * @property {string} ip - Dirección IP del dispositivo
 * @property {number} puerto - Puerto Modbus (default 502)
 * @property {string} [color] - Color de la tarjeta
 * @property {Object} [card_design] - Diseño personalizado de la tarjeta
 */

/**
 * @typedef {Object} Puesto
 * @property {string} id - UUID del puesto
 * @property {string} nombre - Nombre del puesto
 * @property {string} color - Color del header
 * @property {string} [bgColor] - Color de fondo
 * @property {number} orden - Orden de visualización
 * @property {Alimentador[]} alimentadores - Lista de alimentadores
 */

/**
 * @typedef {Object} Workspace
 * @property {string} id - UUID del workspace
 * @property {string} nombre - Nombre del workspace
 * @property {string} [descripcion] - Descripción opcional
 * @property {string} creador_id - ID del usuario creador
 */

/**
 * @typedef {Object} LecturaModbus
 * @property {string} registrador_id - ID del registrador
 * @property {number[]} valores - Array de valores leídos
 * @property {string} timestamp - Fecha/hora de la lectura ISO
 * @property {number} indice_inicial - Registro inicial
 */

/**
 * @typedef {Object} ConfiguracionRele
 * @property {string} modeloId - ID del modelo (REF615, RET615)
 * @property {string} configuracionId - ID de la configuración
 * @property {number} ratioTI - Ratio del transformador de corriente
 * @property {number} [ratioTV] - Ratio del transformador de tensión
 */

export {};
```

---

## TAREA 5: Verificar Archivos CSS Huérfanos

### 5.1 Buscar CSS sin componente asociado

```bash
# Listar todos los archivos CSS
find src/ -name "*.css" | while read css; do
  # Buscar si el CSS es importado en algún lado
  basename=$(basename "$css")
  if ! grep -r "$basename" src/ --include="*.js" --include="*.jsx" -q; then
    echo "CSS posiblemente huérfano: $css"
  fi
done
```

---

## TAREA 6: Consolidar Constantes Duplicadas

### 6.1 Verificar constantes de escala

Buscar definiciones duplicadas de `ESCALA_MIN`, `ESCALA_MAX`, `ESCALA_DEFAULT`:

```bash
grep -r "ESCALA_MIN\|ESCALA_MAX\|ESCALA_DEFAULT" src/ --include="*.js" --include="*.jsx"
```

Si hay múltiples definiciones, consolidar en `src/paginas/PaginaAlimentadores/constantes/escalas.js`

### 6.2 Verificar constantes de GAP

```bash
grep -r "GAP_MIN\|GAP_MAX\|GAP_DEFAULT\|ROW_GAP" src/ --include="*.js" --include="*.jsx"
```

Consolidar en un solo archivo de constantes si hay duplicación.

---

## TAREA 7: Verificar Index Files

### 7.1 Asegurar que todas las carpetas de componentes tengan index.js

Carpetas que deben tener `index.js` para exports limpios:

```
src/componentes/comunes/           ✓ o ✗
src/servicios/api/                 ✓ (ya existe)
src/paginas/PaginaAlimentadores/componentes/historial/     ✓ (ya existe)
src/paginas/PaginaAlimentadores/componentes/layout/        ¿?
src/paginas/PaginaAlimentadores/componentes/navegacion/    ¿?
src/paginas/PaginaAlimentadores/componentes/tarjetas/      ¿?
src/paginas/PaginaAlimentadores/hooks/                     ¿?
src/paginas/PaginaAlimentadores/utilidades/                ¿?
src/paginas/PaginaAlimentadores/constantes/                ¿?
```

**Acción:** Crear `index.js` en carpetas que no lo tengan para facilitar imports.

---

## TAREA 8: Documentación Inline

### 8.1 Verificar JSDoc en funciones públicas

Las siguientes funciones exportadas deben tener JSDoc completo:

**Prioridad Alta (APIs):**
- Todas las funciones en `src/servicios/api/*.js`

**Prioridad Media (Hooks):**
- Todos los hooks custom en `src/paginas/PaginaAlimentadores/hooks/`

**Formato esperado:**
```javascript
/**
 * Descripción breve de la función
 * @param {string} parametro1 - Descripción del parámetro
 * @param {Object} opciones - Opciones adicionales
 * @param {boolean} [opciones.opcional] - Parámetro opcional
 * @returns {Promise<TipoRetorno>} Descripción del retorno
 * @throws {Error} Cuándo puede fallar
 */
```

---

## TAREA 9: Limpieza Final

### 9.1 Ejecutar linter y corregir errores

```bash
npm run lint
npm run lint -- --fix  # Auto-fix donde sea posible
```

### 9.2 Verificar build

```bash
npm run build
```

Asegurar que no haya warnings de:
- Imports no usados
- Variables no usadas
- Dependencias faltantes en useEffect/useCallback

---

## Resumen de Archivos a Modificar/Eliminar

### Eliminar (después de verificar que no se usan):
- [ ] `src/servicios/apiService.js` (si es redundante)
- [ ] Funciones legacy en `src/servicios/api/registradores.js`

### Renombrar:
- [ ] `recuperarContraseña.jsx` → `RecuperarContrasena.jsx`
- [ ] `recuperarContraseña.css` → `RecuperarContrasena.css`

### Crear:
- [ ] `src/tipos/index.js`
- [ ] `index.js` en carpetas que falten

### Modificar:
- [ ] `src/App.jsx` - Actualizar import de RecuperarContrasena
- [ ] Remover comentarios extensos tipo "NOTA PERSONAL"
- [ ] Consolidar constantes duplicadas

---

## Orden de Ejecución Recomendado

1. **Primero:** Ejecutar búsquedas de código muerto (no modifica nada)
2. **Segundo:** Renombrar archivos (cambio simple)
3. **Tercero:** Crear archivos nuevos (tipos, index.js)
4. **Cuarto:** Eliminar código muerto confirmado
5. **Quinto:** Limpiar comentarios
6. **Sexto:** Ejecutar lint y build para verificar

---

## Notas Importantes

- **NO eliminar nada sin verificar primero** que no se usa
- **Hacer commits pequeños** después de cada grupo de cambios
- **Ejecutar `npm run dev`** después de cada cambio importante para verificar que la app funciona
- Si encuentras algo que no está en esta lista pero parece código muerto, **pregunta antes de eliminar**
