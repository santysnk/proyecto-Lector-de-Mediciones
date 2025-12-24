# Plan de Mejoras - Sistema de Historial y Gráficos

> **Fecha de creación**: 2025-12-24
> **Rama de trabajo**: dev
> **Estado**: En progreso

---

## Resumen del Sistema

El sistema de Historial y Gráficos permite visualizar datos históricos de mediciones en ventanas flotantes con:
- Gráficos interactivos (ApexCharts)
- Caché híbrido (IndexedDB local + Supabase remoto)
- Exportación a Excel/CSV
- Selector de fechas con drill-down
- Sistema de ventanas flotantes (minimizar, maximizar, arrastrar)

---

## Archivos Principales Involucrados

| Archivo | Ubicación | Líneas | Descripción |
|---------|-----------|--------|-------------|
| VentanaHistorial.jsx | `src/paginas/PaginaAlimentadores/componentes/modales/` | 781 | Componente principal de ventana flotante |
| useHistorialLocal.js | `src/paginas/PaginaAlimentadores/hooks/` | ~200 | Hook de caché híbrido |
| useVentanasHistorial.js | `src/paginas/PaginaAlimentadores/hooks/` | ~100 | Hook gestión ventanas |
| indexedDBHelper.js | `src/paginas/PaginaAlimentadores/utilidades/` | 357 | Operaciones IndexedDB |
| exportarInformeExcel.js | `src/paginas/PaginaAlimentadores/utilidades/` | 631 | Exportación Excel |
| ModalConfigInforme.jsx | `src/paginas/PaginaAlimentadores/componentes/modales/` | 237 | Modal configuración informe |
| ApexChartWrapper.jsx | `src/componentes/comunes/` | 241 | Wrapper ApexCharts |
| SelectorFecha.jsx | `src/paginas/PaginaAlimentadores/componentes/comunes/` | ~300 | Selector de fechas |
| VentanaHistorial.css | `src/paginas/PaginaAlimentadores/componentes/modales/` | 726 | Estilos ventana |

---

## Checklist de Implementación

### Fase 1: Correcciones Críticas (Bugs)

- [x] **1.1** Corregir uso incorrecto de `useMemo` en ModalConfigInforme.jsx
  - Archivo: `ModalConfigInforme.jsx:85-92`
  - Cambiar `useMemo` por `useEffect` para el efecto secundario de `setIntervaloSeleccionado`
  - **Estado**: Completado (2024-12-24)

- [x] **1.2** Eliminar logs de debug en producción
  - Archivo: `indexedDBHelper.js:128-136`
  - Remover o condicionar `console.log` con variable de entorno
  - **Estado**: Completado (2024-12-24)

- [x] **1.3** Agregar cancelación a la precarga de 48h
  - Archivo: `usarHistorialLocal.js`
  - Ya existía `precargaAbortRef` y `cancelarPrecarga`
  - El cleanup del useEffect ya llama a `resetearPrecarga`
  - **Estado**: Completado (ya implementado)

- [x] **1.4** Prevenir memory leak en drag de ventanas
  - Archivo: `VentanaHistorial.jsx`
  - El cleanup del useEffect ya remueve los listeners correctamente
  - **Estado**: Completado (ya implementado)

### Fase 2: Refactorización de VentanaHistorial.jsx

- [x] **2.1** Crear archivo de constantes para historial
  - Crear: `src/paginas/PaginaAlimentadores/constantes/historialConfig.js`
  - Mover constantes: HORAS_PRECACHE, UMBRAL_COBERTURA, intervalos, etc.
  - **Estado**: Completado (2024-12-24)

- [x] **2.2** Extraer hook `useCalculosHistorial.js`
  - Crear: `src/paginas/PaginaAlimentadores/hooks/useCalculosHistorial.js`
  - Mover: `calcularPromedioZona`, formateo de datos para gráficos
  - **Estado**: Completado (2024-12-24)

- [x] **2.3** Extraer componente `PanelDatosHistorial.jsx`
  - Crear: `src/paginas/PaginaAlimentadores/componentes/historial/PanelDatosHistorial.jsx`
  - Mover: tabla de datos, filtros, ordenamiento
  - **Estado**: Completado (2024-12-24)

- [x] **2.4** Extraer componente `BarraTituloVentana.jsx`
  - Crear: `src/paginas/PaginaAlimentadores/componentes/historial/BarraTituloVentana.jsx`
  - Mover: título, botones minimizar/maximizar/cerrar
  - **Estado**: Completado (2024-12-24)

- [ ] **2.5** Extraer componente `ControlesGrafico.jsx`
  - Crear: `src/paginas/PaginaAlimentadores/componentes/historial/ControlesGrafico.jsx`
  - Mover: selector tipo gráfico, selector color, botones exportar
  - **Estado**: Pendiente (Opcional - la barra de controles es compleja)

### Fase 3: Mejoras de Calidad de Código

- [x] **3.1** Mejorar gestión de z-index
  - Archivo: `useVentanasHistorial.js`
  - Cambiar variable global por `useRef` dentro del hook
  - **Estado**: Completado (2024-12-24)

- [x] **3.2** Agregar variables CSS para colores repetidos
  - Archivo: `VentanaHistorial.css`
  - Crear variables en `:root` para colores del tema
  - **Estado**: Completado (2024-12-24) - Variables principales agregadas

- [ ] **3.3** Crear hook `useErrorHandler` para manejo consistente de errores
  - Crear: `src/hooks/useErrorHandler.js`
  - Implementar patrón consistente de notificación de errores
  - **Estado**: Pendiente (Opcional)

- [ ] **3.4** Corregir dependencias de useEffect en ApexChartWrapper
  - Archivo: `ApexChartWrapper.jsx:192`
  - Revisar array de dependencias vacío
  - **Estado**: Pendiente

### Fase 4: Mejoras Opcionales

- [ ] **4.1** Agregar PropTypes a componentes principales
  - Archivos: VentanaHistorial, ModalConfigInforme, SelectorFecha
  - **Estado**: Pendiente

- [ ] **4.2** Optimizar filtrado de datos en ModalConfigInforme
  - Archivo: `ModalConfigInforme.jsx:95-109`
  - Implementar muestreo más eficiente para datasets grandes
  - **Estado**: Pendiente

- [ ] **4.3** Considerar migrar drag a librería (react-draggable)
  - Evaluar beneficios vs complejidad añadida
  - **Estado**: Pendiente

---

## Orden de Implementación Recomendado

1. **Primero**: Fase 1 (correcciones críticas) - Evitar bugs en producción
2. **Segundo**: Fase 2.1 (constantes) - Base para refactorización
3. **Tercero**: Fase 2.2-2.5 (extracción componentes) - Mejorar mantenibilidad
4. **Cuarto**: Fase 3 (calidad) - Pulir código
5. **Último**: Fase 4 (opcional) - Nice to have

---

## Notas de Contexto para Continuación

### Estructura de Datos Clave

```javascript
// Estructura de una lectura en IndexedDB
{
  id: autoIncrement,
  alimentadorId: string,
  registradorId: string,
  zona: "superior" | "inferior",
  timestamp: number (ms),
  valores: number[],
  indiceInicial: number,
  exito: boolean,
  createdAt: number,
  fromCache: boolean // true si viene de Supabase
}

// Estructura de ventana en useVentanasHistorial
{
  id: alimentadorId,
  minimizada: boolean,
  maximizada: boolean,
  posicion: { x: number, y: number },
  zIndex: number
}

// Datos para gráfico (formato ApexCharts)
{
  x: Date | string, // timestamp
  y: number // valor promedio calculado
}
```

### Fórmulas Aplicadas

Las fórmulas se aplican en `calcularPromedioZona` usando `aplicarFormula(formula, valorCrudo)`.
Los valores 0 se excluyen del promedio.

### Lógica de Caché Híbrido

1. Al abrir ventana: precarga 48h en background
2. Si `precargaCompleta` y rango <= 48h: usa solo local
3. Si rango > 48h o cobertura < 85%: consulta remoto
4. Los datos remotos se cachean en local para futuras consultas

---

## Registro de Cambios

| Fecha | Tarea | Estado | Notas |
|-------|-------|--------|-------|
| 2024-12-24 | Creación del plan | Completado | Documento inicial |
| 2024-12-24 | 1.1 Corregir useMemo | Completado | Cambiado a useEffect |
| 2024-12-24 | 1.2 Eliminar logs debug | Completado | Bloque de debug removido |
| 2024-12-24 | 2.1 Crear historialConfig.js | Completado | Constantes centralizadas |
| 2024-12-24 | 2.2 Crear useCalculosHistorial.js | Completado | Hook de cálculos extraído |
| 2024-12-24 | 3.1 Mejorar z-index | Completado | Variable global → useRef |
| 2024-12-24 | 3.2 Variables CSS | Completado | Variables base agregadas |
| 2024-12-24 | Renombrar hooks usar* → use* | Completado | 10 hooks renombrados para cumplir convención React |
| 2024-12-24 | 2.3 Crear PanelDatosHistorial.jsx | Completado | Componente extraído con tabla y filtros |
| 2024-12-24 | 2.4 Crear BarraTituloVentana.jsx | Completado | Componente extraído con botones de ventana |

---

## Comandos Útiles

```bash
# Levantar entorno de desarrollo
cd mi-app
npm run dev      # Frontend (puerto 5173)
npm run db       # json-server (puerto 4000)
npm run backend  # Modbus server (puerto 5000)

# Verificar cambios
npm run lint
npm run build
```
