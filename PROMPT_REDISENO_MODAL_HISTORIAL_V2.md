# Rediseño Completo del Modal de Historial/Estadísticas

## Contexto del Problema

El modal de historial dejó de funcionar porque:
1. Usa la estructura antigua `card_design` pero el sistema migró a `config_tarjeta`
2. Solo soporta 2 zonas (superior/inferior) con promedios
3. No aprovecha todas las funcionalidades que un registrador puede medir
4. Las alertas de las tarjetas (BadgeAlarmas) se superponen a los modales

## Objetivo

Rediseñar el modal de historial para:
1. **Usar exclusivamente `config_tarjeta`** (abandonar `card_design`)
2. **Soportar múltiples funcionalidades** por registrador (no solo las mostradas en la tarjeta)
3. **Soportar múltiples registradores** por tarjeta (si superior e inferior usan registradores diferentes)
4. **Selector de funcionalidad** en lugar de selector de "zona"
5. **Corregir z-index** del sistema de alertas

---

## Arquitectura de Datos Actual

### Estructura `config_tarjeta` (NUEVA - usar esta)
```javascript
alimentador.config_tarjeta = {
  superior: {
    registrador_id: "uuid-registrador-1",
    funcionalidad_id: "corrientes",           // Solo la funcionalidad mostrada en la tarjeta
    funcionalidad_datos: {                     // Datos de la funcionalidad seleccionada
      id: "corrientes",
      nombre: "Corrientes de fase (IL1, IL2, IL3)",
      categoria: "mediciones",
      cantidad: 3,
      etiquetas: ["R", "S", "T"],
      registros: [137, 138, 139],
      formulas: ["x/1000", "x/1000", "x/1000"]
    },
    titulo_personalizado: "CORRIENTES DE FASE",
    etiquetas_personalizadas: ["R", "S", "T"],
    oculto: false
  },
  inferior: {
    registrador_id: "uuid-registrador-2",     // Puede ser diferente al superior
    funcionalidad_id: "tensiones",
    funcionalidad_datos: { ... },
    titulo_personalizado: "TENSIONES LINEA",
    etiquetas_personalizadas: null,
    oculto: false
  }
}
```

### Funcionalidades Disponibles (de un registrador)
```javascript
// La API /api/registradores/{id}/funcionalidades devuelve:
{
  registrador: { id, nombre, plantilla_id, ... },
  plantilla: { id, nombre, modelo, fabricante, ... },
  funcionalidades: [
    {
      id: "corrientes",
      nombre: "Corrientes de fase (IL1, IL2, IL3)",
      categoria: "mediciones",
      registroDefault: 137,
      cantidad: 3,
      etiquetas: ["IL1", "IL2", "IL3"],
      formulas: ["x/1000", "x/1000", "x/1000"],
      transformador_tipo: "TI"
    },
    {
      id: "tensiones",
      nombre: "Tensiones (VA, VB, VC, VAB, VBC, VCA)",
      categoria: "mediciones",
      registroDefault: 151,
      cantidad: 6,
      etiquetas: ["VA", "VB", "VC", "VAB", "VBC", "VCA"],
      ...
    },
    {
      id: "potencias",
      nombre: "Potencias (P, Q, S, FP)",
      categoria: "mediciones",
      registroDefault: 160,
      cantidad: 7,
      ...
    },
    // ... más funcionalidades
  ]
}
```

### Estructura de Lecturas Históricas
```javascript
// La API /api/registradores/{id}/lecturas/historico devuelve:
[
  {
    timestamp: "2026-01-15T10:30:00Z",
    valores: [58600, 59100, 57800, ...], // Array COMPLETO de valores del registrador
    indice_inicial: 137,                  // Desde qué registro empieza
    exito: true
  },
  // ... más lecturas
]
```

**IMPORTANTE**: Cada lectura contiene TODOS los valores que el agente lee del registrador, no solo los configurados para la tarjeta. Esto significa que ya tenemos los datos de todas las funcionalidades, solo hay que extraerlos correctamente.

---

## Cambios Requeridos

### 1. Hook `useVentanaHistorialLogica.js` - REESCRIBIR

**Cambios principales:**
- Usar `useFuncionalidadesRegistrador` para cargar todas las funcionalidades del/los registrador(es)
- Cambiar selector de "zona" por selector de "funcionalidad"
- Soportar múltiples registradores (si superior e inferior son diferentes)
- Calcular valores individuales de la funcionalidad seleccionada

```javascript
// hooks/historial/useVentanaHistorialLogica.js

import { useState, useEffect, useMemo, useCallback } from "react";
import { useHistorialLocal } from "./useHistorialLocal";
import { useFuncionalidadesRegistrador } from "../useFuncionalidadesRegistrador";
import { RANGOS_TIEMPO } from "../../constantes/historialConfig";
import { 
  calcularEstadisticasGrafico, 
  calcularLimitesEscalaY,
  filtrarDatosPorIntervalo,
  generarTituloPeriodo 
} from "../../utilidades/calculosHistorial";
import { generarColoresBarras } from "../../utilidades/coloresGrafico";
import { generarOpcionesGrafico } from "../../utilidades/configGraficoHistorial";

/**
 * Extrae los registradores únicos de un alimentador
 */
const obtenerRegistradoresUnicos = (alimentador) => {
  const registradores = new Map();
  const configTarjeta = alimentador.config_tarjeta;
  
  if (!configTarjeta) return [];
  
  // Registrador de zona superior
  if (configTarjeta.superior?.registrador_id) {
    registradores.set(configTarjeta.superior.registrador_id, {
      id: configTarjeta.superior.registrador_id,
      zona: "superior",
      funcionalidadMostrada: configTarjeta.superior.funcionalidad_id
    });
  }
  
  // Registrador de zona inferior
  if (configTarjeta.inferior?.registrador_id) {
    const regId = configTarjeta.inferior.registrador_id;
    if (registradores.has(regId)) {
      // Mismo registrador en ambas zonas
      registradores.get(regId).zonas = ["superior", "inferior"];
    } else {
      registradores.set(regId, {
        id: regId,
        zona: "inferior",
        funcionalidadMostrada: configTarjeta.inferior.funcionalidad_id
      });
    }
  }
  
  // Fallback a registrador_id del alimentador
  if (registradores.size === 0 && alimentador.registrador_id) {
    registradores.set(alimentador.registrador_id, {
      id: alimentador.registrador_id,
      zona: null,
      funcionalidadMostrada: null
    });
  }
  
  return Array.from(registradores.values());
};

/**
 * Calcula el valor de una medición específica de una funcionalidad
 */
const calcularValorMedicion = (lectura, funcionalidad, indiceMedicion, transformador = null) => {
  if (!lectura?.valores || !funcionalidad) return null;
  
  const registroBase = funcionalidad.registroDefault || funcionalidad.registros?.[0];
  const indiceInicial = lectura.indiceInicial ?? lectura.indice_inicial ?? 0;
  
  // Calcular el índice en el array de valores
  const registroMedicion = funcionalidad.registros?.[indiceMedicion] 
    ?? (registroBase + indiceMedicion);
  const indiceEnArray = registroMedicion - indiceInicial;
  
  if (indiceEnArray < 0 || indiceEnArray >= lectura.valores.length) return null;
  
  let valor = lectura.valores[indiceEnArray];
  if (valor === null || valor === undefined) return null;
  
  // Aplicar fórmula de la funcionalidad
  const formula = funcionalidad.formulas?.[indiceMedicion] || "x";
  valor = aplicarFormula(formula, valor);
  
  // Aplicar transformador si existe
  if (transformador?.formula) {
    valor = aplicarFormula(transformador.formula, valor);
  }
  
  return valor;
};

/**
 * Aplica una fórmula simple al valor
 */
const aplicarFormula = (formula, valor) => {
  if (!formula || formula === "x") return valor;
  try {
    const x = valor;
    return eval(formula.replace(/x/g, x));
  } catch {
    return valor;
  }
};

export const useVentanaHistorialLogica = ({
  alimentadorInicial,
  minimizada,
  alimentadoresPuesto,
}) => {
  // Estado del alimentador actual
  const [alimentadorActual, setAlimentadorActual] = useState(alimentadorInicial);
  const alimentador = alimentadorActual;
  
  // Obtener registradores únicos del alimentador
  const registradoresUnicos = useMemo(
    () => obtenerRegistradoresUnicos(alimentador),
    [alimentador]
  );
  
  // Estado para el registrador seleccionado (si hay más de uno)
  const [registradorSeleccionadoId, setRegistradorSeleccionadoId] = useState(
    registradoresUnicos[0]?.id || null
  );
  
  // Cargar funcionalidades del registrador seleccionado
  const {
    funcionalidades,
    plantilla,
    cargando: cargandoFuncionalidades,
    error: errorFuncionalidades
  } = useFuncionalidadesRegistrador(registradorSeleccionadoId);
  
  // Estado de la funcionalidad seleccionada
  const [funcionalidadSeleccionadaId, setFuncionalidadSeleccionadaId] = useState(null);
  
  // Estado del índice de medición dentro de la funcionalidad (para funcionalidades con cantidad > 1)
  const [indiceMedicionSeleccionado, setIndiceMedicionSeleccionado] = useState(0);
  
  // Hook de historial (IndexedDB + API)
  const {
    obtenerDatosGrafico,
    cargando: cargandoHistorial,
    error: errorHistorial,
    precargarPuesto,
    resetearPrecarga,
    precargaProgreso,
    precargaCompleta,
    precargando,
    datosDeBD,
    limpiarCacheCompleto,
    dbLista,
  } = useHistorialLocal();
  
  // Estados de UI
  const [rangoSeleccionado, setRangoSeleccionado] = useState("24h");
  const [fechaRangoDesde, setFechaRangoDesde] = useState(null);
  const [fechaRangoHasta, setFechaRangoHasta] = useState(null);
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [fuenteDatos, setFuenteDatos] = useState(null);
  const [panelDatosAbierto, setPanelDatosAbierto] = useState(true);
  const [intervaloFiltro, setIntervaloFiltro] = useState(60);
  const [tipoGrafico, setTipoGrafico] = useState("line");
  const [modalInformeVisible, setModalInformeVisible] = useState(false);
  const [escalaYMax, setEscalaYMax] = useState(null);
  const [graficoVisible, setGraficoVisible] = useState(true);
  const [editandoEscalaY, setEditandoEscalaY] = useState(false);

  // Funcionalidad seleccionada
  const funcionalidadSeleccionada = useMemo(() => {
    if (!funcionalidadSeleccionadaId || !funcionalidades.length) return null;
    return funcionalidades.find(f => f.id === funcionalidadSeleccionadaId);
  }, [funcionalidades, funcionalidadSeleccionadaId]);
  
  // Agrupar funcionalidades por categoría para el selector
  const funcionalidadesPorCategoria = useMemo(() => {
    const grupos = {};
    funcionalidades.forEach(f => {
      const cat = f.categoria || "otros";
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(f);
    });
    return grupos;
  }, [funcionalidades]);
  
  // Título de la medición seleccionada
  const tituloMedicionActual = useMemo(() => {
    if (!funcionalidadSeleccionada) return "Sin selección";
    const cantidad = funcionalidadSeleccionada.cantidad || 1;
    if (cantidad === 1) {
      return funcionalidadSeleccionada.nombre;
    }
    const etiqueta = funcionalidadSeleccionada.etiquetas?.[indiceMedicionSeleccionado] 
      || `Medición ${indiceMedicionSeleccionado + 1}`;
    return `${funcionalidadSeleccionada.nombre} - ${etiqueta}`;
  }, [funcionalidadSeleccionada, indiceMedicionSeleccionado]);
  
  // Auto-seleccionar primera funcionalidad cuando se cargan
  useEffect(() => {
    if (funcionalidades.length > 0 && !funcionalidadSeleccionadaId) {
      // Priorizar funcionalidades de mediciones
      const mediciones = funcionalidades.filter(f => f.categoria === "mediciones");
      const primera = mediciones[0] || funcionalidades[0];
      setFuncionalidadSeleccionadaId(primera.id);
      setIndiceMedicionSeleccionado(0);
    }
  }, [funcionalidades, funcionalidadSeleccionadaId]);
  
  // Actualizar registrador seleccionado cuando cambia el alimentador
  useEffect(() => {
    if (registradoresUnicos.length > 0) {
      setRegistradorSeleccionadoId(registradoresUnicos[0].id);
    }
  }, [registradoresUnicos]);
  
  // Cargar datos del gráfico
  const cargarDatos = useCallback(async () => {
    if (!alimentador?.id || !registradorSeleccionadoId || !funcionalidadSeleccionada) {
      setDatosGrafico([]);
      setFuenteDatos(null);
      return;
    }
    
    const ahora = Date.now();
    const rango = RANGOS_TIEMPO.find(r => r.id === rangoSeleccionado);
    let desde, hasta;
    
    if (fechaRangoDesde && fechaRangoHasta) {
      const fDesde = new Date(fechaRangoDesde);
      const fHasta = new Date(fechaRangoHasta);
      desde = new Date(fDesde.getFullYear(), fDesde.getMonth(), fDesde.getDate(), 0, 0, 0, 0).getTime();
      hasta = new Date(fHasta.getFullYear(), fHasta.getMonth(), fHasta.getDate(), 23, 59, 59, 999).getTime();
    } else if (rango?.ms) {
      desde = ahora - rango.ms;
      hasta = ahora;
    } else {
      return;
    }
    
    const usandoRangoPredefinido = !fechaRangoDesde && !fechaRangoHasta;
    const forzarSoloLocal = precargaCompleta && usandoRangoPredefinido;
    
    // NOTA: La zona ya no importa tanto, usamos el registradorId directamente
    // Pero mantenemos compatibilidad con el sistema actual de cache
    const zonaCache = "datos"; // Zona genérica para el cache
    
    const { datos, fuente } = await obtenerDatosGrafico(
      alimentador.id,
      registradorSeleccionadoId,
      zonaCache,
      desde,
      hasta,
      forzarSoloLocal
    );
    
    // Transformar datos: extraer el valor de la medición específica
    const datosTransformados = datos
      .map(lectura => {
        const valor = calcularValorMedicion(
          lectura,
          funcionalidadSeleccionada,
          indiceMedicionSeleccionado
        );
        if (valor === null || Number.isNaN(valor)) return null;
        return { x: new Date(lectura.timestamp), y: valor };
      })
      .filter(d => d !== null);
    
    setDatosGrafico(datosTransformados);
    setFuenteDatos(fuente);
  }, [
    alimentador,
    registradorSeleccionadoId,
    funcionalidadSeleccionada,
    indiceMedicionSeleccionado,
    rangoSeleccionado,
    fechaRangoDesde,
    fechaRangoHasta,
    obtenerDatosGrafico,
    precargaCompleta
  ]);
  
  // Iniciar precarga al montar
  useEffect(() => {
    if (!alimentador?.id || !dbLista || alimentadoresPuesto.length === 0) return;
    precargarPuesto(alimentadoresPuesto);
    return () => resetearPrecarga();
  }, [alimentador?.id, dbLista, alimentadoresPuesto, precargarPuesto, resetearPrecarga]);
  
  // Cargar datos cuando cambia selección
  useEffect(() => {
    if (!minimizada && (precargaCompleta || !precargando)) {
      cargarDatos();
    }
  }, [cargarDatos, minimizada, precargaCompleta, precargando]);
  
  // Datos filtrados
  const datosFiltrados = useMemo(
    () => filtrarDatosPorIntervalo(datosGrafico, intervaloFiltro),
    [datosGrafico, intervaloFiltro]
  );
  
  // Límites escala Y
  const limitesEscalaY = useMemo(
    () => calcularLimitesEscalaY(datosFiltrados),
    [datosFiltrados]
  );
  
  // Colores barras
  const coloresBarras = useMemo(
    () => generarColoresBarras(datosFiltrados),
    [datosFiltrados]
  );
  
  // Opciones gráfico
  const opcionesGrafico = useMemo(
    () => generarOpcionesGrafico({
      alimentadorId: alimentador?.id,
      tipoGrafico,
      escalaYMax,
      coloresBarras,
    }),
    [alimentador?.id, tipoGrafico, escalaYMax, coloresBarras]
  );
  
  // Series gráfico
  const seriesGrafico = useMemo(
    () => [{ name: tituloMedicionActual, data: datosFiltrados }],
    [datosFiltrados, tituloMedicionActual]
  );
  
  // Estadísticas
  const estadisticasGrafico = useMemo(
    () => calcularEstadisticasGrafico(datosGrafico),
    [datosGrafico]
  );
  
  // Título panel
  const tituloPanelDatos = useMemo(
    () => generarTituloPeriodo(datosGrafico),
    [datosGrafico]
  );
  
  // Fuente efectiva
  const fuenteDatosEfectiva = useMemo(() => {
    if (fuenteDatos === "local" && datosDeBD) return "remoto";
    return fuenteDatos;
  }, [fuenteDatos, datosDeBD]);
  
  // Handlers
  const handleRangoChange = useCallback((rangoId) => {
    setRangoSeleccionado(rangoId);
    setFechaRangoDesde(null);
    setFechaRangoHasta(null);
  }, []);
  
  const handleFechaRangoChange = useCallback((desde, hasta) => {
    setFechaRangoDesde(desde);
    setFechaRangoHasta(hasta);
  }, []);
  
  const handleTipoGraficoChange = useCallback((nuevoTipo) => {
    setTipoGrafico(nuevoTipo);
    setEscalaYMax(null);
  }, []);
  
  const handleEscalaYManual = useCallback((valorInput) => {
    const valor = parseFloat(valorInput);
    if (isNaN(valor)) {
      setEditandoEscalaY(false);
      return;
    }
    const valorValidado = Math.min(Math.max(valor, limitesEscalaY.min), limitesEscalaY.max);
    setEscalaYMax(valorValidado);
    setEditandoEscalaY(false);
  }, [limitesEscalaY]);
  
  const handleLimpiarCache = useCallback(async () => {
    if (window.confirm("¿Limpiar cache local?")) {
      await limpiarCacheCompleto();
      precargarPuesto(alimentadoresPuesto);
    }
  }, [limpiarCacheCompleto, precargarPuesto, alimentadoresPuesto]);
  
  const handleAlimentadorChange = useCallback((nuevoId) => {
    const nuevoAlim = alimentadoresPuesto.find(a => a.id === nuevoId);
    if (nuevoAlim) {
      setAlimentadorActual(nuevoAlim);
      setFuncionalidadSeleccionadaId(null);
      setIndiceMedicionSeleccionado(0);
    }
  }, [alimentadoresPuesto]);
  
  const handleRegistradorChange = useCallback((nuevoId) => {
    setRegistradorSeleccionadoId(nuevoId);
    setFuncionalidadSeleccionadaId(null);
    setIndiceMedicionSeleccionado(0);
  }, []);
  
  const handleFuncionalidadChange = useCallback((funcId) => {
    setFuncionalidadSeleccionadaId(funcId);
    setIndiceMedicionSeleccionado(0);
  }, []);
  
  const handleMedicionChange = useCallback((indice) => {
    setIndiceMedicionSeleccionado(indice);
  }, []);

  return {
    // Alimentador
    alimentador,
    
    // Registradores (para selector si hay más de uno)
    registradoresUnicos,
    registradorSeleccionadoId,
    setRegistradorSeleccionadoId: handleRegistradorChange,
    
    // Funcionalidades
    funcionalidades,
    funcionalidadesPorCategoria,
    funcionalidadSeleccionada,
    funcionalidadSeleccionadaId,
    setFuncionalidadSeleccionadaId: handleFuncionalidadChange,
    cargandoFuncionalidades,
    
    // Medición específica (para funcionalidades con cantidad > 1)
    indiceMedicionSeleccionado,
    setIndiceMedicionSeleccionado: handleMedicionChange,
    tituloMedicionActual,
    
    // Estados de carga
    cargando: cargandoHistorial || cargandoFuncionalidades,
    error: errorHistorial || errorFuncionalidades,
    precargando,
    precargaProgreso,
    precargaCompleta,
    
    // Datos del gráfico
    datosGrafico,
    datosFiltrados,
    fuenteDatosEfectiva,
    
    // UI states
    panelDatosAbierto,
    setPanelDatosAbierto,
    graficoVisible,
    setGraficoVisible,
    modalInformeVisible,
    setModalInformeVisible,
    editandoEscalaY,
    setEditandoEscalaY,
    
    // Rango de tiempo
    rangoSeleccionado,
    handleRangoChange,
    fechaRangoDesde,
    fechaRangoHasta,
    handleFechaRangoChange,
    
    // Tipo de gráfico
    tipoGrafico,
    handleTipoGraficoChange,
    
    // Configuración del gráfico
    opcionesGrafico,
    seriesGrafico,
    escalaYMax,
    setEscalaYMax,
    handleEscalaYManual,
    limitesEscalaY,
    
    // Filtro de intervalo
    intervaloFiltro,
    setIntervaloFiltro,
    
    // Panel de datos
    tituloPanelDatos,
    
    // Estadísticas
    estadisticasGrafico,
    
    // Acciones
    cargarDatos,
    handleLimpiarCache,
    handleAlimentadorChange,
  };
};

export default useVentanaHistorialLogica;
```

---

### 2. Modificar `VentanaHistorial.jsx`

**Cambios principales:**
- Eliminar `cardDesign` de las props (ya no se usa)
- Agregar selectores de registrador y funcionalidad
- Actualizar controles para el nuevo sistema

```jsx
// Cambios en props de VentanaHistorial
const VentanaHistorial = ({
  ventana,
  onCerrar,
  onMinimizar,
  onMaximizar,
  onEnfocar,
  onMover,
}) => {
  // ANTES: const { alimentador, cardDesign, minimizada, ... } = ventana;
  // AHORA: cardDesign ya no se usa
  const { alimentador: alimentadorInicial, minimizada, maximizada, posicion, zIndex } = ventana;

  // Hook actualizado (sin cardDesign)
  const {
    alimentador,
    registradoresUnicos,
    registradorSeleccionadoId,
    setRegistradorSeleccionadoId,
    funcionalidades,
    funcionalidadesPorCategoria,
    funcionalidadSeleccionada,
    funcionalidadSeleccionadaId,
    setFuncionalidadSeleccionadaId,
    indiceMedicionSeleccionado,
    setIndiceMedicionSeleccionado,
    tituloMedicionActual,
    // ... resto igual
  } = useVentanaHistorialLogica({
    alimentadorInicial,
    minimizada,
    alimentadoresPuesto,
  });
  
  // ... resto del componente
};
```

---

### 3. Actualizar `BarraControlesHistorial.jsx`

Reemplazar el selector de zona por selectores de:
1. **Registrador** (si hay más de uno)
2. **Funcionalidad** (agrupada por categoría)
3. **Medición específica** (si la funcionalidad tiene cantidad > 1)

```jsx
// Ejemplo de nueva barra de controles
<div className="historial-controles">
  {/* Selector de Registrador (solo si hay más de uno) */}
  {registradoresUnicos.length > 1 && (
    <div className="historial-control-grupo">
      <label>Registrador:</label>
      <select 
        value={registradorSeleccionadoId || ""}
        onChange={(e) => setRegistradorSeleccionadoId(e.target.value)}
      >
        {registradoresUnicos.map(reg => (
          <option key={reg.id} value={reg.id}>
            {reg.zona ? `Zona ${reg.zona}` : "Principal"}
          </option>
        ))}
      </select>
    </div>
  )}
  
  {/* Selector de Funcionalidad */}
  <div className="historial-control-grupo">
    <label>Medición:</label>
    <select 
      value={funcionalidadSeleccionadaId || ""}
      onChange={(e) => setFuncionalidadSeleccionadaId(e.target.value)}
      disabled={cargandoFuncionalidades}
    >
      {Object.entries(funcionalidadesPorCategoria).map(([categoria, funcs]) => (
        <optgroup key={categoria} label={CATEGORIAS[categoria]?.nombre || categoria}>
          {funcs.map(f => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  </div>
  
  {/* Selector de Medición específica (si cantidad > 1) */}
  {funcionalidadSeleccionada?.cantidad > 1 && (
    <div className="historial-control-grupo">
      <label>Variable:</label>
      <select 
        value={indiceMedicionSeleccionado}
        onChange={(e) => setIndiceMedicionSeleccionado(Number(e.target.value))}
      >
        {Array.from({ length: funcionalidadSeleccionada.cantidad }).map((_, i) => (
          <option key={i} value={i}>
            {funcionalidadSeleccionada.etiquetas?.[i] || `Medición ${i + 1}`}
          </option>
        ))}
      </select>
    </div>
  )}
  
  {/* Resto de controles (rango, tipo gráfico, etc.) */}
</div>
```

---

### 4. Actualizar `useVentanasHistorial.js`

Simplificar la creación de ventana (ya no necesita cardDesign):

```javascript
// ANTES
const abrirVentana = useCallback((alimentador, cardDesign) => {
  // ...
  return crearEstadoVentana(alimentador, cardDesign, posicionInicial);
}, []);

// AHORA
const abrirVentana = useCallback((alimentador) => {
  // cardDesign ya no se necesita
  setVentanas((prev) => {
    if (prev[alimentador.id]) {
      return {
        ...prev,
        [alimentador.id]: {
          ...prev[alimentador.id],
          minimizada: false,
          zIndex: getNextZIndex(),
        },
      };
    }
    
    const numVentanas = Object.keys(prev).length;
    const posicionInicial = {
      x: 50 + (numVentanas % 5) * 30,
      y: 50 + (numVentanas % 5) * 30,
    };
    
    return {
      ...prev,
      [alimentador.id]: {
        id: alimentador.id,
        alimentador,
        minimizada: false,
        maximizada: false,
        posicion: posicionInicial,
        tamaño: { width: 900, height: 600 },
        zIndex: getNextZIndex(),
      },
    };
  });
}, [getNextZIndex]);
```

---

### 5. Actualizar llamada en `VistaAlimentadores.jsx`

```javascript
// ANTES (línea ~2697)
onAbrirHistorial={(puestoId, alim) => abrirVentana(alim, alim.card_design)}

// AHORA
onAbrirHistorial={(puestoId, alim) => abrirVentana(alim)}
```

---

### 6. Corregir Z-Index de `BadgeAlarmas.jsx`

El z-index del globo de alarmas debe ser menor que los modales:

```css
/* BadgeAlarmas.css */

/* ANTES */
.badge-alarmas-globo {
  z-index: 1000;  /* Conflicto con modales */
}

/* AHORA */
.badge-alarmas-globo {
  z-index: 100;   /* Menor que modales (1000+) */
}

/* Asegurar que las tarjetas tienen z-index base bajo */
.alim-card {
  position: relative;
  z-index: 1;
}

/* El badge se posiciona relativo a la tarjeta */
.badge-alarmas {
  position: relative;
  z-index: 10;
}

.badge-alarmas-globo {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;  /* Suficiente para estar encima de otras tarjetas */
}

/* Constantes de z-index para referencia:
 * Tarjetas: 1
 * Badge alarmas: 10
 * Globo alarmas: 100
 * Menú flotante tarjeta: 500
 * Modales/Ventanas historial: 1000+
 * Overlays críticos: 9000+
 */
```

---

### 7. Actualizar `indexedDBHelper.js` (Opcional - Mejora futura)

Actualmente el IndexedDB guarda datos por "zona" (superior/inferior). Para soportar mejor múltiples funcionalidades, se podría cambiar a guardar por registrador_id directamente sin zona:

```javascript
// SUGERENCIA: Cambiar esquema de índices
// Índice actual: ["alimentadorId", "zona", "timestamp"]
// Índice nuevo:  ["registradorId", "timestamp"]

// Esto permitiría consultar datos de cualquier funcionalidad
// del registrador sin depender de la "zona"

// Por ahora, como workaround, usar zona="datos" como valor genérico
```

---

## Resumen de Archivos a Modificar

| Archivo | Acción | Prioridad |
|---------|--------|-----------|
| `useVentanaHistorialLogica.js` | **REESCRIBIR** | Alta |
| `VentanaHistorial.jsx` | Modificar props y controles | Alta |
| `BarraControlesHistorial.jsx` | Reemplazar selector zona | Alta |
| `useVentanasHistorial.js` | Simplificar (quitar cardDesign) | Alta |
| `VistaAlimentadores.jsx` | Actualizar llamada | Alta |
| `BadgeAlarmas.css` | Corregir z-index | Alta |
| `calculosHistorial.js` | Eliminar funciones obsoletas (obtenerTituloZona, calcularPromedioZona) | Media |
| `indexedDBHelper.js` | Mejora futura (cambiar índices) | Baja |

---

## Flujo de Datos Nuevo

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODAL DE HISTORIAL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Usuario abre historial de alimentador                       │
│     └─> abrirVentana(alimentador)                              │
│                                                                 │
│  2. Se detectan registradores únicos                            │
│     └─> obtenerRegistradoresUnicos(alimentador.config_tarjeta) │
│         ├─> registrador_superior                                │
│         └─> registrador_inferior (si es diferente)             │
│                                                                 │
│  3. Se cargan funcionalidades del registrador seleccionado      │
│     └─> useFuncionalidadesRegistrador(registradorId)           │
│         └─> API: /api/registradores/{id}/funcionalidades       │
│             └─> [corrientes, tensiones, potencias, leds, ...]  │
│                                                                 │
│  4. Usuario selecciona funcionalidad y medición                 │
│     └─> Ej: "Corrientes de fase" → "IL1"                       │
│                                                                 │
│  5. Se cargan datos históricos                                  │
│     └─> API: /api/registradores/{id}/lecturas/historico        │
│         └─> Cada lectura tiene TODOS los valores               │
│                                                                 │
│  6. Se extrae el valor específico de cada lectura               │
│     └─> calcularValorMedicion(lectura, funcionalidad, indice)  │
│         └─> registro = funcionalidad.registros[indice]         │
│         └─> valor = lectura.valores[registro - indiceInicial]  │
│         └─> aplicar fórmula y transformador                    │
│                                                                 │
│  7. Se renderiza el gráfico                                     │
│     └─> [{ x: timestamp, y: valorCalculado }, ...]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ejemplo Visual del Nuevo Selector

```
┌─────────────────────────────────────────────────────────────────┐
│ Historial de ALIMENTADOR 8                            _ □ ✕    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Registrador: [Zona Superior ▼]  (solo si hay 2 diferentes)    │
│                                                                 │
│  Medición:    [▼ Seleccionar...                              ] │
│               ├─ 📊 Mediciones ─────────────────────────────── │
│               │   ├─ Corrientes de fase (IL1, IL2, IL3)        │
│               │   ├─ Tensiones (VA, VB, VC, VAB, VBC, VCA)     │
│               │   ├─ Corriente residual Io                      │
│               │   └─ Potencias (P, Q, S, FP)                    │
│               ├─ 🚦 Estados y Alarmas ──────────────────────── │
│               │   ├─ Estado del relé (Ready/Start/Trip)        │
│               │   ├─ LEDs del panel                             │
│               │   └─ Posición del interruptor (CB)             │
│               └─ ⚙️ Sistema ────────────────────────────────── │
│                   ├─ Salud del dispositivo                      │
│                   └─ Heartbeat                                  │
│                                                                 │
│  Variable:    [IL1 ▼] [IL2] [IL3]  (solo si cantidad > 1)      │
│                                                                 │
│  Rango:       [1h] [2h] [6h] [12h] [24h●] [48h] [7d] [Custom]  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │              📈 GRÁFICO DE CORRIENTE IL1               │   │
│  │                                                         │   │
│  │    60A ─┬─────────────────────────────────────────     │   │
│  │         │    ╱╲    ╱╲                                   │   │
│  │    40A ─┼───╱──╲──╱──╲──────────────────────────────    │   │
│  │         │  ╱    ╲╱    ╲                                 │   │
│  │    20A ─┼─╱────────────╲────────────────────────────    │   │
│  │         │                                               │   │
│  │     0A ─┴─────────────────────────────────────────     │   │
│  │         00:00    06:00    12:00    18:00    24:00      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📊 Estadísticas: Min: 28.5A | Max: 62.1A | Prom: 45.3A        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
