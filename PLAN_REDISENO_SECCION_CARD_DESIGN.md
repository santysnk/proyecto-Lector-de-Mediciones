# Plan de Rediseño: Sección "Diseño de la tarjeta"

## Contexto del Proyecto

**Proyecto:** RelayWatch - Sistema de monitoreo industrial para relés de protección  
**Tecnologías:** React (frontend), Node.js/Express (backend), Supabase/PostgreSQL (BD)  
**Fecha:** Enero 2026

---

## Problema Actual

El modal de configuración de alimentadores tiene una sección "Diseño de la tarjeta" que es muy compleja y redundante:

1. El usuario debe seleccionar registrador
2. Arrastrar índices de registros uno por uno a cada box
3. Escribir manualmente las fórmulas de transformación (ej: `x * 200 / 1000`)
4. Escribir las etiquetas de cada box (R, S, T, etc.)
5. Seleccionar el título de un dropdown predefinido

**Problema:** Ya existe un sistema de **plantillas de dispositivo** (`plantillas_dispositivo`) que contiene toda esta información:
- Registros Modbus configurados
- Fórmulas de TI/TV asociadas
- Etiquetas predefinidas
- Funcionalidades organizadas (Corrientes de Fase, Tensiones, etc.)

**Resultado:** Configurar una tarjeta toma 2-3 minutos y es propenso a errores.

---

## Objetivo

Simplificar la configuración de tarjetas usando las plantillas existentes:
- Seleccionar registrador → Se cargan automáticamente sus funcionalidades
- Elegir qué funcionalidad mostrar → Los registros, fórmulas y etiquetas vienen de la plantilla
- Opcionalmente personalizar títulos y etiquetas

**Resultado esperado:** Configurar una tarjeta en ~10 segundos.

---

## Alcance

### ✅ Se modifica:
- Sección "Diseño de la tarjeta" dentro del modal de configuración de alimentador
- Componente `SeccionCardDesign.jsx`
- Estructura de datos guardada en la BD

### ❌ NO se modifica:
- Nombre del alimentador
- Selector de color
- Intervalo de consulta
- Checkboxes de "Ocultar parte superior/inferior"
- Ninguna otra parte del modal

---

## 1. Base de Datos

### 1.1 Modificar tabla `alimentadores`

Agregar nueva columna para la configuración simplificada:

```sql
-- ============================================================================
-- MIGRACIÓN: Nueva estructura config_tarjeta para alimentadores
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 1. Agregar nueva columna
ALTER TABLE alimentadores 
ADD COLUMN IF NOT EXISTS config_tarjeta JSONB DEFAULT '{}';

-- 2. Comentario explicativo de la estructura
COMMENT ON COLUMN alimentadores.config_tarjeta IS '
Estructura simplificada de configuración de tarjeta:
{
  "superior": {
    "registrador_id": "uuid-del-registrador",
    "funcionalidad_id": "func-corrientes-fase",
    "titulo_personalizado": null,
    "etiquetas_personalizadas": {
      "0": null,
      "1": "Fase S personalizada",
      "2": null
    },
    "oculto": false
  },
  "inferior": {
    "registrador_id": "uuid-del-registrador",
    "funcionalidad_id": "func-tensiones-linea",
    "titulo_personalizado": "MI TÍTULO PERSONALIZADO",
    "etiquetas_personalizadas": {},
    "oculto": false
  }
}

Notas:
- titulo_personalizado: null = usar el nombre de la funcionalidad de la plantilla
- etiquetas_personalizadas: objeto donde key=índice, value=etiqueta personalizada
  - null = usar etiqueta de la plantilla
  - string = usar etiqueta personalizada
';

-- 3. Índice para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_alimentadores_config_tarjeta 
ON alimentadores USING gin(config_tarjeta);
```

### 1.2 Estructura de datos

**Configuración anterior (compleja):**
```json
{
  "superior": {
    "tituloId": "corriente_132",
    "tituloCustom": "",
    "registrador_id": "uuid",
    "cantidad": 3,
    "oculto": false,
    "boxes": [
      { "enabled": true, "label": "R", "indice": 137, "formula": "x * 200 / 1000" },
      { "enabled": true, "label": "S", "indice": 138, "formula": "x * 200 / 1000" },
      { "enabled": true, "label": "T", "indice": 139, "formula": "x * 200 / 1000" }
    ]
  }
}
```

**Configuración nueva (simplificada):**
```json
{
  "superior": {
    "registrador_id": "uuid-del-registrador",
    "funcionalidad_id": "func-corrientes-fase",
    "titulo_personalizado": null,
    "etiquetas_personalizadas": {},
    "oculto": false
  }
}
```

---

## 2. Backend

### 2.1 Nuevo endpoint: Obtener funcionalidades de un registrador

**Archivo:** `controllers/registradoresController.js`

**Endpoint:** `GET /api/registradores/:id/funcionalidades`

**Propósito:** Devolver las funcionalidades disponibles de un registrador basándose en su plantilla configurada.

```javascript
/**
 * Obtiene las funcionalidades disponibles de un registrador
 * basándose en su plantilla y configuración
 * 
 * GET /api/registradores/:id/funcionalidades
 */
async function obtenerFuncionalidadesRegistrador(req, res) {
  const { id } = req.params;
  
  try {
    // 1. Obtener registrador con su plantilla y transformadores
    const { data: registrador, error: errorReg } = await supabase
      .from('registradores')
      .select(`
        id,
        nombre,
        ip,
        puerto,
        plantilla_id,
        configuracion_completa,
        plantillas_dispositivo (
          id,
          nombre,
          tipo_dispositivo,
          funcionalidades
        )
      `)
      .eq('id', id)
      .single();
    
    if (errorReg || !registrador) {
      return res.status(404).json({ 
        error: 'Registrador no encontrado',
        details: errorReg?.message 
      });
    }
    
    // 2. Verificar que tiene plantilla
    const plantilla = registrador.plantillas_dispositivo;
    if (!plantilla) {
      return res.json({
        registrador: {
          id: registrador.id,
          nombre: registrador.nombre
        },
        plantilla: null,
        funcionalidades: [],
        mensaje: 'El registrador no tiene plantilla configurada'
      });
    }
    
    // 3. Obtener funcionalidades activas del registrador
    const funcionalidadesActivas = registrador.configuracion_completa?.funcionalidadesActivas || [];
    
    // 4. Obtener transformadores del workspace para resolver fórmulas
    const workspaceId = registrador.configuracion_completa?.workspaceId;
    let transformadores = {};
    
    if (workspaceId) {
      const { data: trafos } = await supabase
        .from('transformadores')
        .select('id, nombre, formula, tipo')
        .eq('workspace_id', workspaceId);
      
      if (trafos) {
        transformadores = trafos.reduce((acc, t) => {
          acc[t.id] = t;
          return acc;
        }, {});
      }
    }
    
    // 5. Filtrar y formatear funcionalidades habilitadas
    const funcionalidadesDisponibles = [];
    
    if (plantilla.funcionalidades) {
      for (const [funcId, func] of Object.entries(plantilla.funcionalidades)) {
        // Solo incluir si está habilitada en la plantilla Y activa en el registrador
        if (func.habilitado && funcionalidadesActivas.includes(funcId)) {
          funcionalidadesDisponibles.push({
            id: funcId,
            nombre: func.nombre,
            categoria: func.categoria || 'general',
            registros: (func.registros || []).map(reg => ({
              etiqueta: reg.etiqueta,
              registro: reg.valor,
              transformadorId: reg.transformadorId,
              formula: transformadores[reg.transformadorId]?.formula || 'x'
            }))
          });
        }
      }
    }
    
    // 6. Responder
    res.json({
      registrador: {
        id: registrador.id,
        nombre: registrador.nombre,
        ip: registrador.ip,
        puerto: registrador.puerto
      },
      plantilla: {
        id: plantilla.id,
        nombre: plantilla.nombre,
        tipo: plantilla.tipo_dispositivo
      },
      funcionalidades: funcionalidadesDisponibles
    });
    
  } catch (error) {
    console.error('Error obteniendo funcionalidades:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}

// Agregar al router
router.get('/:id/funcionalidades', verificarToken, obtenerFuncionalidadesRegistrador);
```

### 2.2 Actualizar endpoint de alimentadores

**Archivo:** `controllers/alimentadoresController.js`

Modificar el endpoint `PUT /api/alimentadores/:id` para aceptar `config_tarjeta`:

```javascript
/**
 * Actualiza un alimentador
 * PUT /api/alimentadores/:id
 */
async function actualizarAlimentador(req, res) {
  const { id } = req.params;
  const { 
    nombre, 
    color, 
    config_tarjeta,      // Nueva estructura simplificada
    intervalo_consulta,
    // Mantener compatibilidad con campos legacy si es necesario
    configuracion        // Estructura anterior (deprecated)
  } = req.body;
  
  try {
    // Construir objeto de actualización
    const actualizacion = {
      updated_at: new Date().toISOString()
    };
    
    if (nombre !== undefined) actualizacion.nombre = nombre;
    if (color !== undefined) actualizacion.color = color;
    if (intervalo_consulta !== undefined) actualizacion.intervalo_consulta = intervalo_consulta;
    
    // Priorizar nueva estructura sobre la legacy
    if (config_tarjeta !== undefined) {
      actualizacion.config_tarjeta = config_tarjeta;
    } else if (configuracion !== undefined) {
      // Compatibilidad: si viene configuracion legacy, guardarla también
      actualizacion.configuracion = configuracion;
    }
    
    const { data, error } = await supabase
      .from('alimentadores')
      .update(actualizacion)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
    
  } catch (error) {
    console.error('Error actualizando alimentador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
```

### 2.3 Endpoint para resolver configuración de tarjeta

**Propósito:** Dado un alimentador, devuelve la configuración completa para renderizar (resolviendo plantillas).

```javascript
/**
 * Obtiene la configuración resuelta de una tarjeta
 * Combina config_tarjeta + datos de plantilla
 * 
 * GET /api/alimentadores/:id/config-resuelta
 */
async function obtenerConfigResuelta(req, res) {
  const { id } = req.params;
  
  try {
    // 1. Obtener alimentador
    const { data: alimentador, error } = await supabase
      .from('alimentadores')
      .select('id, nombre, color, config_tarjeta, intervalo_consulta')
      .eq('id', id)
      .single();
    
    if (error || !alimentador) {
      return res.status(404).json({ error: 'Alimentador no encontrado' });
    }
    
    const config = alimentador.config_tarjeta || {};
    const resultado = { superior: null, inferior: null };
    
    // 2. Resolver cada zona (superior/inferior)
    for (const zona of ['superior', 'inferior']) {
      const zonaConfig = config[zona];
      if (!zonaConfig || !zonaConfig.registrador_id || !zonaConfig.funcionalidad_id) {
        resultado[zona] = { configurado: false, oculto: zonaConfig?.oculto || false };
        continue;
      }
      
      // Obtener registrador con plantilla
      const { data: registrador } = await supabase
        .from('registradores')
        .select(`
          id, nombre, ip, puerto,
          plantillas_dispositivo (funcionalidades)
        `)
        .eq('id', zonaConfig.registrador_id)
        .single();
      
      if (!registrador?.plantillas_dispositivo) {
        resultado[zona] = { configurado: false, error: 'Registrador sin plantilla' };
        continue;
      }
      
      // Obtener funcionalidad de la plantilla
      const funcionalidad = registrador.plantillas_dispositivo.funcionalidades?.[zonaConfig.funcionalidad_id];
      
      if (!funcionalidad) {
        resultado[zona] = { configurado: false, error: 'Funcionalidad no encontrada' };
        continue;
      }
      
      // Resolver título
      const titulo = zonaConfig.titulo_personalizado || funcionalidad.nombre;
      
      // Resolver registros con etiquetas personalizadas
      const registros = (funcionalidad.registros || []).map((reg, idx) => ({
        etiqueta: zonaConfig.etiquetas_personalizadas?.[idx] || reg.etiqueta,
        registro: reg.valor,
        transformadorId: reg.transformadorId
      }));
      
      resultado[zona] = {
        configurado: true,
        oculto: zonaConfig.oculto || false,
        titulo,
        registrador: {
          id: registrador.id,
          nombre: registrador.nombre,
          ip: registrador.ip,
          puerto: registrador.puerto
        },
        registros
      };
    }
    
    res.json({
      alimentador: {
        id: alimentador.id,
        nombre: alimentador.nombre,
        color: alimentador.color,
        intervalo_consulta: alimentador.intervalo_consulta
      },
      tarjeta: resultado
    });
    
  } catch (error) {
    console.error('Error obteniendo config resuelta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
```

---

## 3. Frontend

### 3.1 Nuevo servicio API

**Archivo:** `src/servicios/api/registradores.js`

Agregar función para obtener funcionalidades:

```javascript
/**
 * Obtiene las funcionalidades disponibles de un registrador
 * @param {string} registradorId - UUID del registrador
 * @returns {Promise<{registrador, plantilla, funcionalidades}>}
 */
export async function obtenerFuncionalidadesRegistrador(registradorId) {
  return fetchConAuth(`/api/registradores/${registradorId}/funcionalidades`);
}
```

### 3.2 Nuevo hook

**Archivo:** `src/paginas/PaginaAlimentadores/hooks/useFuncionalidadesRegistrador.js`

```javascript
/**
 * Hook para obtener funcionalidades de un registrador
 * Se usa en la configuración de tarjetas
 */
import { useState, useEffect } from 'react';
import { obtenerFuncionalidadesRegistrador } from '../../../servicios/api/registradores';

export function useFuncionalidadesRegistrador(registradorId) {
  const [funcionalidades, setFuncionalidades] = useState([]);
  const [plantilla, setPlantilla] = useState(null);
  const [registrador, setRegistrador] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset si no hay registrador
    if (!registradorId) {
      setFuncionalidades([]);
      setPlantilla(null);
      setRegistrador(null);
      setError(null);
      return;
    }

    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      setError(null);
      
      try {
        const data = await obtenerFuncionalidadesRegistrador(registradorId);
        
        if (cancelado) return;
        
        setFuncionalidades(data.funcionalidades || []);
        setPlantilla(data.plantilla || null);
        setRegistrador(data.registrador || null);
        
        if (data.mensaje) {
          setError(data.mensaje);
        }
      } catch (err) {
        if (cancelado) return;
        setError(err.message || 'Error al cargar funcionalidades');
        setFuncionalidades([]);
        setPlantilla(null);
      }
      
      setCargando(false);
    };

    cargar();

    return () => {
      cancelado = true;
    };
  }, [registradorId]);

  return { 
    funcionalidades, 
    plantilla, 
    registrador,
    cargando, 
    error,
    tienePlantilla: plantilla !== null
  };
}

export default useFuncionalidadesRegistrador;
```

### 3.3 Nuevo componente: SeccionCardDesignV2

**Archivo:** `src/paginas/PaginaAlimentadores/componentes/modales/configuracion-alimentador/SeccionCardDesignV2.jsx`

```jsx
/**
 * SeccionCardDesignV2 - Versión simplificada usando plantillas
 * 
 * IMPORTANTE: Este componente REEMPLAZA a SeccionCardDesign.jsx
 * 
 * Cambios respecto a la versión anterior:
 * - Ya no se arrastran índices manualmente
 * - Ya no se escriben fórmulas manualmente
 * - Se selecciona una funcionalidad de la plantilla
 * - Opcionalmente se personalizan títulos y etiquetas
 */

import { useState, useMemo } from "react";
import { useFuncionalidadesRegistrador } from "../../../hooks/useFuncionalidadesRegistrador";
import "./SeccionCardDesignV2.css";

const SeccionCardDesignV2 = ({
  titulo,           // "Parte superior" o "Parte inferior"
  zona,             // "superior" o "inferior"
  config,           // { registrador_id, funcionalidad_id, titulo_personalizado, etiquetas_personalizadas, oculto }
  registradores,    // Lista de registradores disponibles en el workspace
  onChangeConfig,   // Callback: (nuevaConfig) => void
}) => {
  const [expandido, setExpandido] = useState(false);
  
  // Obtener funcionalidades del registrador seleccionado
  const { 
    funcionalidades, 
    plantilla, 
    cargando,
    tienePlantilla 
  } = useFuncionalidadesRegistrador(config?.registrador_id);

  // Funcionalidad actualmente seleccionada
  const funcionalidadSeleccionada = useMemo(() => {
    if (!config?.funcionalidad_id || !funcionalidades.length) return null;
    return funcionalidades.find(f => f.id === config.funcionalidad_id);
  }, [funcionalidades, config?.funcionalidad_id]);

  // Registrador actualmente seleccionado
  const registradorActual = useMemo(() => {
    if (!config?.registrador_id || !registradores?.length) return null;
    return registradores.find(r => r.id === config.registrador_id);
  }, [registradores, config?.registrador_id]);

  // ============ HANDLERS ============

  const handleChangeRegistrador = (registradorId) => {
    onChangeConfig({
      registrador_id: registradorId || null,
      funcionalidad_id: null,  // Reset al cambiar registrador
      titulo_personalizado: null,
      etiquetas_personalizadas: {},
      oculto: config?.oculto || false
    });
  };

  const handleChangeFuncionalidad = (funcionalidadId) => {
    onChangeConfig({
      ...config,
      funcionalidad_id: funcionalidadId || null,
      titulo_personalizado: null,  // Reset al cambiar funcionalidad
      etiquetas_personalizadas: {}
    });
  };

  const handleChangeTitulo = (valor) => {
    onChangeConfig({
      ...config,
      titulo_personalizado: valor.trim() || null  // null = usar plantilla
    });
  };

  const handleChangeEtiqueta = (indice, valor) => {
    const nuevasEtiquetas = { ...config.etiquetas_personalizadas };
    
    if (valor.trim()) {
      nuevasEtiquetas[indice] = valor.trim();
    } else {
      delete nuevasEtiquetas[indice];  // Eliminar = usar plantilla
    }
    
    onChangeConfig({
      ...config,
      etiquetas_personalizadas: nuevasEtiquetas
    });
  };

  // ============ RENDER ============

  const estaOculto = config?.oculto || false;

  return (
    <div
      className={`card-design-section ${expandido ? "card-design-section--expandido" : ""} ${estaOculto ? "card-design-section--oculto" : ""}`}
    >
      {/* Header colapsable */}
      <button
        type="button"
        className="card-design-section-header"
        onClick={() => setExpandido(!expandido)}
      >
        <span className={`card-design-section-arrow ${expandido ? "card-design-section-arrow--expandido" : ""}`}>
          ▶
        </span>
        <span className="card-design-section-titulo">{titulo}</span>
        
        {/* Badge con info del registrador/funcionalidad seleccionada */}
        {registradorActual && funcionalidadSeleccionada && !estaOculto && (
          <span className="card-design-section-info">
            {funcionalidadSeleccionada.nombre}
          </span>
        )}
        
        {estaOculto && (
          <span className="card-design-section-oculto-badge">OCULTO</span>
        )}
      </button>

      {/* Contenido expandible */}
      {expandido && (
        <div className="card-design-section-content">
          
          {/* ====== SELECTOR DE REGISTRADOR ====== */}
          <div className="card-design-campo">
            <label>Registrador</label>
            <select
              className="card-design-select"
              value={config?.registrador_id || ""}
              onChange={(e) => handleChangeRegistrador(e.target.value)}
            >
              <option value="">-- Sin registrador --</option>
              {registradores?.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.nombre} - {reg.ip}:{reg.puerto}
                </option>
              ))}
            </select>
          </div>

          {/* Info de plantilla */}
          {config?.registrador_id && plantilla && (
            <div className="card-design-plantilla-info">
              📋 Plantilla: <strong>{plantilla.nombre}</strong>
            </div>
          )}

          {/* Mensaje si no tiene plantilla */}
          {config?.registrador_id && !cargando && !tienePlantilla && (
            <div className="card-design-warning">
              ⚠️ Este registrador no tiene plantilla configurada.
              Configura una plantilla en el modal de agentes.
            </div>
          )}

          {/* ====== SELECTOR DE FUNCIONALIDAD ====== */}
          {config?.registrador_id && tienePlantilla && (
            <div className="card-design-campo">
              <label>Mostrar</label>
              {cargando ? (
                <div className="card-design-cargando">Cargando funcionalidades...</div>
              ) : funcionalidades.length === 0 ? (
                <div className="card-design-warning">
                  No hay funcionalidades habilitadas en esta plantilla.
                </div>
              ) : (
                <select
                  className="card-design-select"
                  value={config.funcionalidad_id || ""}
                  onChange={(e) => handleChangeFuncionalidad(e.target.value)}
                >
                  <option value="">-- Seleccionar funcionalidad --</option>
                  {funcionalidades.map((func) => (
                    <option key={func.id} value={func.id}>
                      {func.nombre} ({func.registros?.length || 0} valores)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* ====== PERSONALIZACIÓN ====== */}
          {funcionalidadSeleccionada && (
            <div className="card-design-personalizacion">
              <div className="card-design-personalizacion-header">
                ✏️ Personalización (opcional)
              </div>

              {/* Título personalizado */}
              <div className="card-design-campo">
                <label>Título de la sección</label>
                <input
                  type="text"
                  className="card-design-input"
                  placeholder={funcionalidadSeleccionada.nombre}
                  value={config.titulo_personalizado || ""}
                  onChange={(e) => handleChangeTitulo(e.target.value)}
                />
                <span className="card-design-hint">
                  Dejar vacío para usar: "{funcionalidadSeleccionada.nombre}"
                </span>
              </div>

              {/* Etiquetas de los boxes */}
              <div className="card-design-campo">
                <label>Etiquetas de los valores</label>
                <div className="card-design-etiquetas-grid">
                  {funcionalidadSeleccionada.registros?.map((reg, idx) => (
                    <div key={idx} className="card-design-etiqueta-item">
                      <span className="card-design-etiqueta-numero">Box {idx + 1}</span>
                      <input
                        type="text"
                        className="card-design-input card-design-input--small"
                        placeholder={reg.etiqueta}
                        value={config.etiquetas_personalizadas?.[idx] || ""}
                        onChange={(e) => handleChangeEtiqueta(idx, e.target.value)}
                      />
                      <span className="card-design-hint-small">
                        Reg: {reg.registro}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeccionCardDesignV2;
```

### 3.4 Estilos CSS

**Archivo:** `src/paginas/PaginaAlimentadores/componentes/modales/configuracion-alimentador/SeccionCardDesignV2.css`

```css
/* SeccionCardDesignV2 - Estilos */

.card-design-section {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.card-design-section--oculto {
  opacity: 0.5;
}

.card-design-section--expandido {
  border-color: rgba(100, 200, 255, 0.3);
}

/* Header */
.card-design-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
}

.card-design-section-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.card-design-section-arrow {
  font-size: 10px;
  transition: transform 0.2s;
  color: #888;
}

.card-design-section-arrow--expandido {
  transform: rotate(90deg);
}

.card-design-section-titulo {
  font-weight: 600;
}

.card-design-section-info {
  margin-left: auto;
  font-size: 12px;
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.card-design-section-oculto-badge {
  margin-left: auto;
  font-size: 11px;
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

/* Contenido */
.card-design-section-content {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* Campos */
.card-design-campo {
  margin-bottom: 16px;
}

.card-design-campo label {
  display: block;
  font-size: 12px;
  color: #aaa;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-design-select,
.card-design-input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}

.card-design-select:focus,
.card-design-input:focus {
  outline: none;
  border-color: rgba(100, 200, 255, 0.5);
}

.card-design-input--small {
  padding: 8px 10px;
  font-size: 13px;
}

/* Hints */
.card-design-hint {
  display: block;
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  font-style: italic;
}

.card-design-hint-small {
  font-size: 10px;
  color: #555;
}

/* Info plantilla */
.card-design-plantilla-info {
  font-size: 12px;
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

/* Warnings */
.card-design-warning {
  font-size: 12px;
  color: #ffaa00;
  background: rgba(255, 170, 0, 0.1);
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

/* Cargando */
.card-design-cargando {
  font-size: 13px;
  color: #888;
  padding: 10px 0;
}

/* Personalización */
.card-design-personalizacion {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.card-design-personalizacion-header {
  font-size: 13px;
  color: #888;
  margin-bottom: 16px;
}

/* Grid de etiquetas */
.card-design-etiquetas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.card-design-etiqueta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-design-etiqueta-numero {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
}
```

### 3.5 Actualizar constantes

**Archivo:** `src/paginas/PaginaAlimentadores/componentes/modales/configuracion-alimentador/constantes.js`

Agregar la nueva estructura por defecto:

```javascript
// ... constantes existentes ...

/**
 * Configuración por defecto para una zona de tarjeta (nuevo formato)
 */
export const crearZonaConfigDefault = () => ({
  registrador_id: null,
  funcionalidad_id: null,
  titulo_personalizado: null,
  etiquetas_personalizadas: {},
  oculto: false
});

/**
 * Configuración por defecto para toda la tarjeta (nuevo formato)
 */
export const crearConfigTarjetaDefault = () => ({
  superior: crearZonaConfigDefault(),
  inferior: crearZonaConfigDefault()
});
```

### 3.6 Actualizar ModalConfiguracionAlimentador

**Archivo:** `src/paginas/PaginaAlimentadores/componentes/modales/ModalConfiguracionAlimentador.jsx`

Cambios necesarios:

1. Importar `SeccionCardDesignV2` en lugar de `SeccionCardDesign`
2. Usar `config_tarjeta` en lugar de la estructura legacy
3. Adaptar los handlers para la nueva estructura

```jsx
// Cambiar import
import SeccionCardDesignV2 from "./configuracion-alimentador/SeccionCardDesignV2";
import { crearConfigTarjetaDefault } from "./configuracion-alimentador/constantes";

// En el componente, usar la nueva estructura:
const [configTarjeta, setConfigTarjeta] = useState(() => {
  // Si existe config_tarjeta en el alimentador, usarla
  // Si no, intentar migrar de la estructura legacy o usar default
  return alimentador?.config_tarjeta || crearConfigTarjetaDefault();
});

// Handler para actualizar zona
const handleChangeConfigZona = (zona) => (nuevaConfig) => {
  setConfigTarjeta(prev => ({
    ...prev,
    [zona]: nuevaConfig
  }));
};

// En el render, reemplazar SeccionCardDesign por:
<SeccionCardDesignV2
  titulo="Parte superior"
  zona="superior"
  config={configTarjeta.superior}
  registradores={registradoresWorkspace}
  onChangeConfig={handleChangeConfigZona('superior')}
/>

<SeccionCardDesignV2
  titulo="Parte inferior"
  zona="inferior"
  config={configTarjeta.inferior}
  registradores={registradoresWorkspace}
  onChangeConfig={handleChangeConfigZona('inferior')}
/>

// Al guardar, incluir config_tarjeta:
const datosGuardar = {
  nombre,
  color,
  config_tarjeta: configTarjeta,
  intervalo_consulta: intervaloConsulta
};
```

### 3.7 Actualizar TarjetaAlimentador

**Archivo:** `src/paginas/PaginaAlimentadores/componentes/tarjetas/TarjetaAlimentador.jsx`

La tarjeta debe poder leer tanto la estructura nueva como la legacy para compatibilidad:

```javascript
// Función helper para obtener configuración de una zona
const obtenerConfigZona = (alimentador, zona) => {
  // Priorizar nueva estructura
  if (alimentador.config_tarjeta?.[zona]?.funcionalidad_id) {
    return {
      tipo: 'nuevo',
      config: alimentador.config_tarjeta[zona]
    };
  }
  
  // Fallback a estructura legacy
  if (alimentador.configuracion?.[zona]?.boxes) {
    return {
      tipo: 'legacy',
      config: alimentador.configuracion[zona]
    };
  }
  
  return { tipo: 'vacio', config: null };
};
```

---

## 4. Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONFIGURAR TARJETA (NUEVO FLUJO)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PASO 1: Usuario abre modal de configuración de alimentador             │
│                                                                         │
│  PASO 2: Usuario selecciona Registrador                                 │
│    └─→ Frontend: useFuncionalidadesRegistrador(registradorId)           │
│        └─→ GET /api/registradores/:id/funcionalidades                   │
│            └─→ Backend: Busca plantilla del registrador                 │
│                └─→ Filtra funcionalidades habilitadas                   │
│                    └─→ Retorna: { registrador, plantilla, funcionalidades }│
│                                                                         │
│  PASO 3: Usuario selecciona Funcionalidad del dropdown                  │
│    └─→ Se muestran campos de personalización                            │
│        - Input título (placeholder: nombre de funcionalidad)            │
│        - Inputs etiquetas (placeholders: etiquetas de plantilla)        │
│                                                                         │
│  PASO 4: Usuario personaliza (opcional)                                 │
│    └─→ Título personalizado o vacío (usar plantilla)                    │
│    └─→ Etiquetas personalizadas o vacías (usar plantilla)               │
│                                                                         │
│  PASO 5: Usuario guarda                                                 │
│    └─→ PUT /api/alimentadores/:id                                       │
│        └─→ Body: { config_tarjeta: { superior: {...}, inferior: {...} } }│
│                                                                         │
│  PASO 6: Al renderizar tarjeta                                          │
│    └─→ GET /api/alimentadores/:id/config-resuelta (o resolver en frontend)│
│        └─→ Combina config_tarjeta + datos de plantilla                  │
│            └─→ Aplica títulos/etiquetas personalizados si existen       │
│            └─→ Usa valores de plantilla como fallback                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Checklist de Implementación

### Base de Datos
- [ ] Ejecutar SQL para agregar columna `config_tarjeta` a `alimentadores`
- [ ] Verificar que no hay errores

### Backend
- [ ] Crear endpoint `GET /api/registradores/:id/funcionalidades`
- [ ] Actualizar endpoint `PUT /api/alimentadores/:id` para aceptar `config_tarjeta`
- [ ] (Opcional) Crear endpoint `GET /api/alimentadores/:id/config-resuelta`
- [ ] Probar endpoints con Postman/curl

### Frontend
- [ ] Crear hook `useFuncionalidadesRegistrador.js`
- [ ] Crear componente `SeccionCardDesignV2.jsx`
- [ ] Crear estilos `SeccionCardDesignV2.css`
- [ ] Actualizar `constantes.js` con nuevas estructuras
- [ ] Actualizar `ModalConfiguracionAlimentador.jsx`
- [ ] Actualizar `TarjetaAlimentador.jsx` para leer nueva estructura
- [ ] Actualizar exportaciones en `index.js`

### Testing
- [ ] Probar crear nueva tarjeta con nuevo sistema
- [ ] Probar editar tarjeta existente (compatibilidad legacy)
- [ ] Probar personalización de títulos
- [ ] Probar personalización de etiquetas
- [ ] Verificar que valores por defecto vienen de plantilla

### Limpieza (después de verificar que todo funciona)
- [ ] Eliminar `SeccionCardDesign.jsx` (versión vieja)
- [ ] Eliminar constantes no usadas
- [ ] Documentar cambios

---

## 6. Notas Importantes

### Compatibilidad
- La estructura legacy (`configuracion.superior.boxes`) debe seguir funcionando
- Priorizar `config_tarjeta` sobre `configuracion` cuando ambas existan
- No migrar datos automáticamente, dejar que los usuarios actualicen manualmente

### Comportamiento de valores null
- `titulo_personalizado: null` → Usar `funcionalidad.nombre` de la plantilla
- `etiquetas_personalizadas: {}` o `etiquetas_personalizadas[i]: null` → Usar `registro.etiqueta` de la plantilla

### Validaciones
- No permitir guardar si `registrador_id` está seleccionado pero `funcionalidad_id` no
- Mostrar warning si el registrador no tiene plantilla
- Mostrar warning si la plantilla no tiene funcionalidades habilitadas

---

## 7. Archivos Afectados

| Archivo | Acción |
|---------|--------|
| `SQL` | Ejecutar migración |
| `controllers/registradoresController.js` | Agregar endpoint |
| `controllers/alimentadoresController.js` | Modificar PUT |
| `routes/registradores.js` | Agregar ruta |
| `servicios/api/registradores.js` | Agregar función |
| `hooks/useFuncionalidadesRegistrador.js` | Crear |
| `SeccionCardDesignV2.jsx` | Crear |
| `SeccionCardDesignV2.css` | Crear |
| `constantes.js` | Modificar |
| `ModalConfiguracionAlimentador.jsx` | Modificar |
| `TarjetaAlimentador.jsx` | Modificar |
| `index.js` (varios) | Actualizar exports |
