/**
 * Modal para gestionar modelos de relé personalizados.
 * Permite crear, editar y eliminar modelos de diferentes fabricantes.
 */
import { useState, useEffect } from "react";
import { useModelosRele } from "../../hooks/useModelosRele";
import {
  CATEGORIAS_PROTECCION,
  SEVERIDADES,
} from "../../constantes/datosBaseReles";
import "./ModalGestionModelosRele.css";

const ModalGestionModelosRele = ({ abierto, onCerrar, onModeloCreado }) => {
  const {
    modelos,
    configuraciones,
    getModelos,
    getConfiguracionesDeModelo,
    agregarModelo,
    agregarConfiguracion,
    actualizarModelo,
    actualizarConfiguracion,
    eliminarModelo,
    eliminarConfiguracion,
  } = useModelosRele();

  // Estado de vista: 'lista' | 'crear' | 'editar'
  const [vista, setVista] = useState('lista');
  const [modeloEditandoId, setModeloEditandoId] = useState(null);
  const [configEditandoId, setConfigEditandoId] = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null); // { tipo: 'modelo'|'config', id: string }

  // Estado del wizard/formulario
  const [paso, setPaso] = useState(1); // 1: Info básica, 2: Protecciones
  const [error, setError] = useState(null);

  // Estado del nuevo modelo
  const [nuevoModelo, setNuevoModelo] = useState({
    id: "",
    nombre: "",
    fabricante: "",
    familia: "",
    descripcion: "",
    icono: "⚡",
  });

  // Estado de la nueva configuración
  const [nuevaConfig, setNuevaConfig] = useState({
    id: "",
    nombre: "",
    descripcion: "",
    // Capacidades
    medicionCorriente: true,
    medicionTension: false,
    proteccionDireccional: false,
    autorecierre: false,
    proteccionDiferencial: false,
    // Protecciones
    protecciones: [],
  });

  // Estado para agregar protección
  const [nuevaProteccion, setNuevaProteccion] = useState({
    codigo: "",
    nombre: "",
    nombreCorto: "",
    ansi: "",
    registroStart: "",
    bitStart: "",
    registroOperate: "",
    bitOperate: "",
    severidad: "media",
    categoria: "sobrecorriente",
  });

  const [mostrarFormProteccion, setMostrarFormProteccion] = useState(false);

  // Reset al cerrar
  useEffect(() => {
    if (!abierto) {
      setVista('lista');
      setModeloEditandoId(null);
      setConfigEditandoId(null);
      setConfirmandoEliminar(null);
      setPaso(1);
      setError(null);
      setNuevoModelo({
        id: "",
        nombre: "",
        fabricante: "",
        familia: "",
        descripcion: "",
        icono: "⚡",
      });
      setNuevaConfig({
        id: "",
        nombre: "",
        descripcion: "",
        medicionCorriente: true,
        medicionTension: false,
        proteccionDireccional: false,
        autorecierre: false,
        proteccionDiferencial: false,
        protecciones: [],
      });
      setNuevaProteccion({
        codigo: "",
        nombre: "",
        nombreCorto: "",
        ansi: "",
        registroStart: "",
        bitStart: "",
        registroOperate: "",
        bitOperate: "",
        severidad: "media",
        categoria: "sobrecorriente",
      });
      setMostrarFormProteccion(false);
    }
  }, [abierto]);

  // Validar paso actual
  const validarPaso = (numPaso) => {
    setError(null);

    if (numPaso === 1) {
      if (!nuevoModelo.nombre.trim()) {
        setError("El nombre del modelo es requerido");
        return false;
      }
      if (!nuevoModelo.fabricante.trim()) {
        setError("El fabricante es requerido");
        return false;
      }
      if (!nuevaConfig.nombre.trim()) {
        setError("El nombre de la configuración es requerido");
        return false;
      }
    }

    return true;
  };

  // Ir al siguiente paso
  const siguientePaso = () => {
    if (validarPaso(paso)) {
      setPaso(paso + 1);
    }
  };

  // Ir al paso anterior
  const pasoAnterior = () => {
    setPaso(paso - 1);
  };

  // Agregar protección a la lista
  const handleAgregarProteccion = () => {
    if (!nuevaProteccion.codigo.trim() || !nuevaProteccion.nombre.trim()) {
      setError("Código y nombre de protección son requeridos");
      return;
    }

    // Verificar que no exista
    if (nuevaConfig.protecciones.some(p => p.codigo === nuevaProteccion.codigo)) {
      setError("Ya existe una protección con ese código");
      return;
    }

    setNuevaConfig(prev => ({
      ...prev,
      protecciones: [...prev.protecciones, { ...nuevaProteccion }],
    }));

    // Reset form protección
    setNuevaProteccion({
      codigo: "",
      nombre: "",
      nombreCorto: "",
      ansi: "",
      registroStart: "",
      bitStart: "",
      registroOperate: "",
      bitOperate: "",
      severidad: "media",
      categoria: "sobrecorriente",
    });
    setMostrarFormProteccion(false);
    setError(null);
  };

  // Eliminar protección de la lista
  const handleEliminarProteccion = (codigo) => {
    setNuevaConfig(prev => ({
      ...prev,
      protecciones: prev.protecciones.filter(p => p.codigo !== codigo),
    }));
  };

  // Iniciar creación de nuevo modelo
  const handleNuevoModelo = () => {
    setVista('crear');
    setPaso(1);
    setNuevoModelo({
      id: "",
      nombre: "",
      fabricante: "",
      familia: "",
      descripcion: "",
      icono: "⚡",
    });
    setNuevaConfig({
      id: "",
      nombre: "",
      descripcion: "",
      medicionCorriente: true,
      medicionTension: false,
      proteccionDireccional: false,
      autorecierre: false,
      proteccionDiferencial: false,
      protecciones: [],
    });
  };

  // Iniciar edición de modelo
  const handleEditarModelo = (modeloId) => {
    const modelo = modelos[modeloId];
    if (!modelo) return;

    setModeloEditandoId(modeloId);
    setVista('editar');
    setPaso(1);
    setNuevoModelo({
      id: modelo.id,
      nombre: modelo.nombre,
      fabricante: modelo.fabricante,
      familia: modelo.familia || "",
      descripcion: modelo.descripcion || "",
      icono: modelo.icono || "⚡",
    });

    // Cargar primera configuración si existe
    const configsDelModelo = getConfiguracionesDeModelo(modeloId);
    if (configsDelModelo.length > 0) {
      const config = configsDelModelo[0];
      setConfigEditandoId(config.id);
      setNuevaConfig({
        id: config.id,
        nombre: config.nombre,
        descripcion: config.descripcion || "",
        medicionCorriente: config.capacidades?.medicionCorriente ?? true,
        medicionTension: config.capacidades?.medicionTension ?? false,
        proteccionDireccional: config.capacidades?.proteccionDireccional ?? false,
        autorecierre: config.capacidades?.autorecierre ?? false,
        proteccionDiferencial: config.capacidades?.proteccionDiferencial ?? false,
        protecciones: config.protecciones || [],
      });
    }
  };

  // Confirmar eliminación
  const handleConfirmarEliminar = (tipo, id) => {
    setConfirmandoEliminar({ tipo, id });
  };

  // Cancelar eliminación
  const handleCancelarEliminar = () => {
    setConfirmandoEliminar(null);
  };

  // Ejecutar eliminación
  const handleEliminar = () => {
    if (!confirmandoEliminar) return;

    try {
      if (confirmandoEliminar.tipo === 'modelo') {
        eliminarModelo(confirmandoEliminar.id);
      } else if (confirmandoEliminar.tipo === 'config') {
        eliminarConfiguracion(confirmandoEliminar.id);
      }
      setConfirmandoEliminar(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Volver a la lista
  const handleVolverALista = () => {
    setVista('lista');
    setModeloEditandoId(null);
    setConfigEditandoId(null);
    setPaso(1);
    setError(null);
  };

  // Guardar modelo y configuración
  const handleGuardar = () => {
    try {
      if (vista === 'editar') {
        // Actualizar modelo existente
        actualizarModelo(modeloEditandoId, {
          nombre: nuevoModelo.nombre,
          fabricante: nuevoModelo.fabricante,
          familia: nuevoModelo.familia || nuevoModelo.fabricante,
          descripcion: nuevoModelo.descripcion,
          icono: nuevoModelo.icono,
        });

        // Actualizar configuración
        if (configEditandoId) {
          actualizarConfiguracion(configEditandoId, {
            nombre: nuevaConfig.nombre,
            descripcion: nuevaConfig.descripcion,
            capacidades: {
              medicionCorriente: nuevaConfig.medicionCorriente,
              medicionTension: nuevaConfig.medicionTension,
              proteccionDireccional: nuevaConfig.proteccionDireccional,
              autorecierre: nuevaConfig.autorecierre,
              proteccionDiferencial: nuevaConfig.proteccionDiferencial,
            },
            protecciones: nuevaConfig.protecciones,
          });
        }

        handleVolverALista();
      } else {
        // Crear ID único para modelo
        const modeloId = `${nuevoModelo.fabricante.toUpperCase()}_${nuevoModelo.nombre.replace(/\s+/g, "_").toUpperCase()}`;
        const configId = `${modeloId}_${nuevaConfig.nombre.replace(/\s+/g, "_").toUpperCase()}`;

        // Crear modelo
        const modeloData = {
          id: modeloId,
          nombre: nuevoModelo.nombre,
          fabricante: nuevoModelo.fabricante,
          familia: nuevoModelo.familia || nuevoModelo.fabricante,
          descripcion: nuevoModelo.descripcion,
          icono: nuevoModelo.icono,
          configuraciones: [configId],
        };

        // Crear configuración con estructura correcta
        const configData = {
          id: configId,
          nombre: nuevaConfig.nombre,
          descripcion: nuevaConfig.descripcion,
          modeloId: modeloId,
          capacidades: {
            medicionCorriente: nuevaConfig.medicionCorriente,
            medicionTension: nuevaConfig.medicionTension,
            proteccionDireccional: nuevaConfig.proteccionDireccional,
            autorecierre: nuevaConfig.autorecierre,
            proteccionDiferencial: nuevaConfig.proteccionDiferencial,
          },
          protecciones: nuevaConfig.protecciones,
        };

        agregarModelo(modeloData);
        agregarConfiguracion(configData);

        if (onModeloCreado) {
          onModeloCreado(modeloId, configId);
        }

        onCerrar();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Lista de modelos
  const listaModelos = getModelos();

  if (!abierto) return null;

  // Título según la vista
  const getTitulo = () => {
    if (vista === 'lista') return 'Gestionar Modelos de Relé';
    if (vista === 'editar') return 'Editar Modelo';
    return 'Crear Modelo de Relé';
  };

  return (
    <div className="gestion-modelo-overlay" onClick={onCerrar}>
      <div className="gestion-modelo-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="gestion-modelo-header">
          <h2>{getTitulo()}</h2>
          <button className="gestion-modelo-cerrar" onClick={onCerrar}>×</button>
        </div>

        {/* Indicador de pasos - solo en crear/editar */}
        {vista !== 'lista' && (
          <div className="gestion-modelo-pasos">
            <div className={`gestion-modelo-paso ${paso >= 1 ? "activo" : ""} ${paso > 1 ? "completado" : ""}`}>
              <span className="paso-numero">1</span>
              <span className="paso-texto">Información</span>
            </div>
            <div className="paso-linea"></div>
            <div className={`gestion-modelo-paso ${paso >= 2 ? "activo" : ""}`}>
              <span className="paso-numero">2</span>
              <span className="paso-texto">Protecciones</span>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="gestion-modelo-contenido">
          {error && (
            <div className="gestion-modelo-error">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Modal de confirmación de eliminación */}
          {confirmandoEliminar && (
            <div className="gestion-modelo-confirmar-eliminar">
              <div className="confirmar-eliminar-contenido">
                <span className="confirmar-eliminar-icono">⚠️</span>
                <p>
                  {confirmandoEliminar.tipo === 'modelo'
                    ? '¿Eliminar este modelo y todas sus configuraciones?'
                    : '¿Eliminar esta configuración?'}
                </p>
                <div className="confirmar-eliminar-acciones">
                  <button className="btn-cancelar" onClick={handleCancelarEliminar}>
                    Cancelar
                  </button>
                  <button className="btn-eliminar" onClick={handleEliminar}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vista Lista de Modelos */}
          {vista === 'lista' && (
            <div className="gestion-modelo-lista">
              {listaModelos.length === 0 ? (
                <div className="lista-modelos-vacia">
                  <span className="lista-vacia-icono">📦</span>
                  <p>No hay modelos personalizados</p>
                  <p className="lista-vacia-hint">Crea tu primer modelo de relé para comenzar</p>
                </div>
              ) : (
                <div className="lista-modelos">
                  {listaModelos.map((modelo) => {
                    const configsModelo = getConfiguracionesDeModelo(modelo.id);
                    const primeraConfig = configsModelo[0];
                    const totalProtecciones = primeraConfig?.protecciones?.length || 0;
                    return (
                      <div key={modelo.id} className="lista-modelo-item">
                        <div className="lista-modelo-info">
                          <span className="lista-modelo-icono">{modelo.icono || '⚡'}</span>
                          <div className="lista-modelo-detalles">
                            <span className="lista-modelo-nombre">{modelo.nombre}</span>
                            <span className="lista-modelo-fabricante">{modelo.fabricante}</span>
                          </div>
                          <div className="lista-modelo-config-info">
                            {primeraConfig && (
                              <>
                                <span className="lista-modelo-config-nombre">{primeraConfig.nombre}</span>
                                <span className="lista-modelo-protecciones">
                                  {totalProtecciones} señal{totalProtecciones !== 1 ? 'es' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="lista-modelo-acciones">
                          <button
                            className="btn-lista-editar"
                            onClick={() => handleEditarModelo(modelo.id)}
                            title="Editar modelo"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-lista-eliminar"
                            onClick={() => handleConfirmarEliminar('modelo', modelo.id)}
                            title="Eliminar modelo"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Paso 1: Información básica */}
          {vista !== 'lista' && paso === 1 && (
            <div className="gestion-modelo-seccion">
              <h3>Información del Modelo</h3>
              <div className="gestion-modelo-grid">
                <div className="gestion-modelo-campo">
                  <label>Fabricante *</label>
                  <input
                    type="text"
                    value={nuevoModelo.fabricante}
                    onChange={(e) => setNuevoModelo(prev => ({ ...prev, fabricante: e.target.value }))}
                    placeholder="Ej: Siemens, Schneider, GE..."
                  />
                </div>
                <div className="gestion-modelo-campo">
                  <label>Modelo *</label>
                  <input
                    type="text"
                    value={nuevoModelo.nombre}
                    onChange={(e) => setNuevoModelo(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: 7SJ82, Sepam 80..."
                  />
                </div>
                <div className="gestion-modelo-campo">
                  <label>Familia/Serie</label>
                  <input
                    type="text"
                    value={nuevoModelo.familia}
                    onChange={(e) => setNuevoModelo(prev => ({ ...prev, familia: e.target.value }))}
                    placeholder="Ej: SIPROTEC 5, Sepam..."
                  />
                </div>
                <div className="gestion-modelo-campo">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={nuevoModelo.descripcion}
                    onChange={(e) => setNuevoModelo(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción breve del modelo"
                  />
                </div>
              </div>

              <h3 style={{ marginTop: "1.5rem" }}>Configuración</h3>
              <div className="gestion-modelo-grid">
                <div className="gestion-modelo-campo">
                  <label>Nombre de Configuración *</label>
                  <input
                    type="text"
                    value={nuevaConfig.nombre}
                    onChange={(e) => setNuevaConfig(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Protección Alimentador"
                  />
                </div>
                <div className="gestion-modelo-campo">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={nuevaConfig.descripcion}
                    onChange={(e) => setNuevaConfig(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción de la configuración"
                  />
                </div>
              </div>

              <h4>Capacidades</h4>
              <div className="gestion-modelo-capacidades">
                <label className="capacidad-check">
                  <input
                    type="checkbox"
                    checked={nuevaConfig.medicionCorriente}
                    onChange={(e) => setNuevaConfig(prev => ({ ...prev, medicionCorriente: e.target.checked }))}
                  />
                  Medición de Corriente
                </label>
                <label className="capacidad-check">
                  <input
                    type="checkbox"
                    checked={nuevaConfig.medicionTension}
                    onChange={(e) => setNuevaConfig(prev => ({
                      ...prev,
                      medicionTension: e.target.checked,
                      registros: {
                        ...prev.registros,
                        tensiones: { ...prev.registros.tensiones, habilitado: e.target.checked }
                      }
                    }))}
                  />
                  Medición de Tensión
                </label>
                <label className="capacidad-check">
                  <input
                    type="checkbox"
                    checked={nuevaConfig.proteccionDireccional}
                    onChange={(e) => setNuevaConfig(prev => ({ ...prev, proteccionDireccional: e.target.checked }))}
                  />
                  Protección Direccional
                </label>
                <label className="capacidad-check">
                  <input
                    type="checkbox"
                    checked={nuevaConfig.autorecierre}
                    onChange={(e) => setNuevaConfig(prev => ({ ...prev, autorecierre: e.target.checked }))}
                  />
                  Autorecierre
                </label>
                <label className="capacidad-check">
                  <input
                    type="checkbox"
                    checked={nuevaConfig.proteccionDiferencial}
                    onChange={(e) => setNuevaConfig(prev => ({ ...prev, proteccionDiferencial: e.target.checked }))}
                  />
                  Protección Diferencial
                </label>
              </div>
            </div>
          )}

          {/* Paso 2: Protecciones */}
          {vista !== 'lista' && paso === 2 && (
            <div className="gestion-modelo-seccion">
              <h3>Protecciones / Fallas</h3>
              <p className="gestion-modelo-hint">
                Define las protecciones que el relé puede reportar, con sus registros y bits asociados.
              </p>

              {/* Lista de protecciones agregadas */}
              <div className="protecciones-lista">
                {nuevaConfig.protecciones.length === 0 ? (
                  <div className="protecciones-vacio">
                    No hay protecciones definidas. Agrega al menos una.
                  </div>
                ) : (
                  nuevaConfig.protecciones.map((prot) => (
                    <div key={prot.codigo} className="proteccion-item">
                      <div className="proteccion-item-info">
                        <span
                          className="proteccion-severidad"
                          style={{ backgroundColor: SEVERIDADES[prot.severidad]?.color }}
                        ></span>
                        <span className="proteccion-codigo">{prot.codigo}</span>
                        <span className="proteccion-nombre">{prot.nombre}</span>
                        <span className="proteccion-ansi">ANSI {prot.ansi}</span>
                      </div>
                      <div className="proteccion-item-registros">
                        <span>Start: R{prot.registroStart}:B{prot.bitStart}</span>
                        <span>Operate: R{prot.registroOperate}:B{prot.bitOperate}</span>
                      </div>
                      <button
                        className="proteccion-eliminar"
                        onClick={() => handleEliminarProteccion(prot.codigo)}
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Botón para agregar */}
              {!mostrarFormProteccion ? (
                <button
                  className="btn-agregar-proteccion"
                  onClick={() => setMostrarFormProteccion(true)}
                >
                  + Agregar Protección
                </button>
              ) : (
                <div className="form-proteccion">
                  <h4>Nueva Protección</h4>

                  {/* Fila 1: Identificación */}
                  <div className="form-proteccion-row form-proteccion-row--identificacion">
                    <div className="registro-campo campo-codigo">
                      <label>Código *</label>
                      <input
                        type="text"
                        value={nuevaProteccion.codigo}
                        onChange={(e) => setNuevaProteccion(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                        placeholder="PHLPTOC1"
                      />
                    </div>
                    <div className="registro-campo campo-nombre">
                      <label>Nombre *</label>
                      <input
                        type="text"
                        value={nuevaProteccion.nombre}
                        onChange={(e) => setNuevaProteccion(prev => ({ ...prev, nombre: e.target.value }))}
                        placeholder="Sobrecorriente Fase Baja"
                      />
                    </div>
                    <div className="registro-campo campo-nombre-corto">
                      <label>Nombre Corto</label>
                      <input
                        type="text"
                        value={nuevaProteccion.nombreCorto}
                        onChange={(e) => setNuevaProteccion(prev => ({ ...prev, nombreCorto: e.target.value }))}
                        placeholder="I> Fase"
                      />
                    </div>
                    <div className="registro-campo campo-ansi">
                      <label>ANSI</label>
                      <input
                        type="text"
                        value={nuevaProteccion.ansi}
                        onChange={(e) => setNuevaProteccion(prev => ({ ...prev, ansi: e.target.value }))}
                        placeholder="51P"
                      />
                    </div>
                  </div>

                  {/* Fila 2: Registros y Clasificación */}
                  <div className="form-proteccion-row form-proteccion-row--registros">
                    <div className="registro-campo campo-registro">
                      <label>Reg. Start</label>
                      <input
                        type="number"
                        value={nuevaProteccion.registroStart}
                        onChange={(e) => setNuevaProteccion(prev => ({ ...prev, registroStart: e.target.value === "" ? "" : parseInt(e.target.value) || 0 }))}
                        placeholder="180"
                      />
                    </div>
                    <div className="registro-campo campo-bit">
                      <label>Bit Start</label>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={nuevaProteccion.bitStart}
                        onChange={(e) => setNuevaProteccion(prev => ({ ...prev, bitStart: e.target.value === "" ? "" : parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="registro-campo campo-registro">
                      <label>Reg. Oper.</label>
                      <input
                        type="number"
                        value={nuevaProteccion.registroOperate}
                        onChange={(e) => setNuevaProteccion(prev => ({ ...prev, registroOperate: e.target.value === "" ? "" : parseInt(e.target.value) || 0 }))}
                        placeholder="180"
                      />
                    </div>
                    <div className="registro-campo campo-bit">
                      <label>Bit Operate</label>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={nuevaProteccion.bitOperate}
                        onChange={(e) => setNuevaProteccion(prev => ({ ...prev, bitOperate: e.target.value === "" ? "" : parseInt(e.target.value) || 0 }))}
                        placeholder="8"
                      />
                    </div>
                    <div className="registro-campo campo-severidad">
                      <label>Severidad</label>
                      <select
                        value={nuevaProteccion.severidad}
                        onChange={(e) => setNuevaProteccion(prev => ({ ...prev, severidad: e.target.value }))}
                      >
                        {Object.entries(SEVERIDADES).map(([id, sev]) => (
                          <option key={id} value={id}>{sev.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="registro-campo campo-categoria">
                      <label>Categoría</label>
                      <select
                        value={nuevaProteccion.categoria}
                        onChange={(e) => setNuevaProteccion(prev => ({ ...prev, categoria: e.target.value }))}
                      >
                        {Object.entries(CATEGORIAS_PROTECCION).map(([id, cat]) => (
                          <option key={id} value={id}>{cat.icono} {cat.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-proteccion-acciones">
                    <button
                      className="btn-cancelar"
                      onClick={() => setMostrarFormProteccion(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-agregar"
                      onClick={handleAgregarProteccion}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con navegación */}
        <div className="gestion-modelo-footer">
          {vista === 'lista' ? (
            <>
              <div className="footer-espaciador"></div>
              <button className="btn-primario" onClick={handleNuevoModelo}>
                + Nuevo Modelo
              </button>
            </>
          ) : (
            <>
              {paso === 1 ? (
                <button className="btn-secundario" onClick={handleVolverALista}>
                  ← Volver
                </button>
              ) : (
                <button className="btn-secundario" onClick={pasoAnterior}>
                  ← Anterior
                </button>
              )}
              <div className="footer-espaciador"></div>
              {paso < 2 ? (
                <button className="btn-primario" onClick={siguientePaso}>
                  Siguiente →
                </button>
              ) : (
                <button
                  className="btn-primario btn-guardar"
                  onClick={handleGuardar}
                  disabled={nuevaConfig.protecciones.length === 0}
                >
                  {vista === 'editar' ? 'Guardar Cambios' : 'Crear Modelo'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalGestionModelosRele;
