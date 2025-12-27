// src/paginas/PaginaAlimentadores/componentes/modales/TabApariencia.jsx
// Pestaña de configuración de apariencia global de las tarjetas

import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FUENTES_DISPONIBLES,
  FUENTES_DIGITALES,
  LIMITES_TAMAÑO,
  COLORES_VALOR_PREDEFINIDOS,
  OPCIONES_DECIMALES,
  ESTILOS_GLOBALES_DEFAULT,
} from "../../constantes/estilosGlobalesTarjeta";
import { HexColorPicker } from "react-colorful";
import "./TabApariencia.css";

// Versión del formato de archivo para compatibilidad futura
const FORMATO_VERSION = 1;

/**
 * Genera un valor aleatorio con formato de medición
 * @param {number} decimales - Cantidad de decimales a mostrar (0, 1 o 2)
 */
const generarValorAleatorio = (decimales = 2) => {
  const valor = (Math.random() * 500).toFixed(decimales);
  return valor.replace(".", ",");
};

/**
 * Formatea un valor según la cantidad de decimales configurada
 * @param {string} valor - Valor original (puede ser "--,--" o número con coma)
 * @param {number} decimales - Cantidad de decimales a mostrar
 */
const formatearValorConDecimales = (valor, decimales) => {
  if (valor === "--,--" || valor === "--" || valor === "--,-") {
    if (decimales === 0) return "--";
    if (decimales === 1) return "--,-";
    return "--,--";
  }

  // Convertir coma a punto para parsear
  const numStr = valor.replace(",", ".");
  const num = parseFloat(numStr);
  if (isNaN(num)) return valor;

  return num.toFixed(decimales).replace(".", ",");
};

/**
 * Redondea un número para evitar errores de punto flotante
 * @param {number} valor - Valor a redondear
 * @param {number} decimales - Cantidad de decimales
 */
const redondear = (valor, decimales = 2) => {
  const factor = Math.pow(10, decimales);
  return Math.round(valor * factor) / factor;
};

/**
 * Selector de fuentes personalizado que muestra cada opción con su propia tipografía
 * - Auto-scroll a la fuente seleccionada al abrir
 * - Navegación con flechas arriba/abajo con preview en vivo
 * - Enter para confirmar, Escape para cancelar
 */
const SelectorFuente = ({ value, onChange, fuentes }) => {
  const [abierto, setAbierto] = useState(false);
  const [indiceResaltado, setIndiceResaltado] = useState(-1);
  const [valorOriginal, setValorOriginal] = useState(value);
  const contenedorRef = useRef(null);
  const dropdownRef = useRef(null);
  const opcionesRefs = useRef([]);

  // Índice de la fuente actualmente seleccionada
  const indiceSeleccionado = fuentes.findIndex((f) => f.id === value);

  // Al abrir el dropdown: guardar valor original, scroll a la opción seleccionada
  useEffect(() => {
    if (abierto) {
      setValorOriginal(value);
      setIndiceResaltado(indiceSeleccionado);

      // Scroll a la opción seleccionada después de que el DOM se actualice
      requestAnimationFrame(() => {
        const opcionActiva = opcionesRefs.current[indiceSeleccionado];
        if (opcionActiva && dropdownRef.current) {
          opcionActiva.scrollIntoView({ block: "center", behavior: "instant" });
        }
      });
    }
  }, [abierto, indiceSeleccionado, value]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        // Restaurar valor original si se cierra sin confirmar
        onChange(valorOriginal);
        setAbierto(false);
      }
    };
    if (abierto) {
      document.addEventListener("mousedown", handleClickFuera);
    }
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [abierto, valorOriginal, onChange]);

  // Manejo de teclado
  useEffect(() => {
    if (!abierto) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setIndiceResaltado((prev) => {
            const nuevoIndice = prev < fuentes.length - 1 ? prev + 1 : 0;
            // Aplicar preview de la fuente
            onChange(fuentes[nuevoIndice].id);
            // Scroll a la opción
            requestAnimationFrame(() => {
              opcionesRefs.current[nuevoIndice]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            });
            return nuevoIndice;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setIndiceResaltado((prev) => {
            const nuevoIndice = prev > 0 ? prev - 1 : fuentes.length - 1;
            // Aplicar preview de la fuente
            onChange(fuentes[nuevoIndice].id);
            // Scroll a la opción
            requestAnimationFrame(() => {
              opcionesRefs.current[nuevoIndice]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            });
            return nuevoIndice;
          });
          break;
        case "Enter":
          e.preventDefault();
          // Confirmar selección actual
          setAbierto(false);
          break;
        case "Escape":
          e.preventDefault();
          // Restaurar valor original y cerrar
          onChange(valorOriginal);
          setAbierto(false);
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [abierto, fuentes, onChange, valorOriginal]);

  // Encontrar la fuente seleccionada para mostrar en el botón
  const fuenteSeleccionada = fuentes.find((f) => f.id === value) || fuentes[0];

  return (
    <div className="selector-fuente" ref={contenedorRef}>
      <button
        type="button"
        className="selector-fuente-btn"
        onClick={() => setAbierto(!abierto)}
        style={{ fontFamily: fuenteSeleccionada.id !== "inherit" ? fuenteSeleccionada.id : undefined }}
      >
        <span className="selector-fuente-texto">{fuenteSeleccionada.label}</span>
        <span className="selector-fuente-flecha">{abierto ? "▲" : "▼"}</span>
      </button>
      {abierto && (
        <div className="selector-fuente-dropdown" ref={dropdownRef}>
          {fuentes.map((f, idx) => (
            <div
              key={f.id}
              ref={(el) => (opcionesRefs.current[idx] = el)}
              className={`selector-fuente-opcion ${f.id === value ? "selector-fuente-opcion--activa" : ""} ${idx === indiceResaltado ? "selector-fuente-opcion--resaltada" : ""}`}
              style={{ fontFamily: f.id !== "inherit" ? f.id : undefined }}
              onClick={() => {
                onChange(f.id);
                setAbierto(false);
              }}
              onMouseEnter={() => {
                // Solo resaltar visualmente, sin aplicar preview ni scroll
                setIndiceResaltado(idx);
              }}
            >
              {f.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Componente Slider con flechitas para incrementar/decrementar
 */
const SliderConFlechas = ({ value, onChange, min, max, step, valorDisplay }) => {
  // Calcular decimales del step para redondear correctamente
  const decimalesStep = step < 1 ? String(step).split('.')[1]?.length || 0 : 0;

  const incrementar = () => {
    const nuevoValor = redondear(Math.min(max, parseFloat(value) + step), decimalesStep);
    onChange(nuevoValor);
  };

  const decrementar = () => {
    const nuevoValor = redondear(Math.max(min, parseFloat(value) - step), decimalesStep);
    onChange(nuevoValor);
  };

  return (
    <div className="slider-con-flechas">
      <button
        type="button"
        className="slider-flecha slider-flecha--izq"
        onClick={decrementar}
        disabled={parseFloat(value) <= min}
      >
        ◀
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <button
        type="button"
        className="slider-flecha slider-flecha--der"
        onClick={incrementar}
        disabled={parseFloat(value) >= max}
      >
        ▶
      </button>
      <span className="apariencia-valor">{valorDisplay}</span>
    </div>
  );
};

/**
 * Botón de color con popover usando react-colorful
 */
const ColorPickerBoton = ({ color, onChange }) => {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const [valorHex, setValorHex] = useState(color);
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);

  // Sincronizar valor cuando cambia el color externo
  useEffect(() => {
    setValorHex(color);
  }, [color]);

  // Calcular posición del picker al abrirlo
  const togglePicker = (e) => {
    e.stopPropagation();
    if (abierto) {
      setAbierto(false);
      return;
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const alturaPopover = 260;
      const anchoPopover = 240;

      // Calcular posición vertical (preferir abajo)
      let top = rect.bottom + 8;
      if (top + alturaPopover > window.innerHeight - 10) {
        top = rect.top - alturaPopover - 8;
      }

      // Calcular posición horizontal centrada
      let left = rect.left + rect.width / 2 - anchoPopover / 2;
      if (left < 10) left = 10;
      if (left + anchoPopover > window.innerWidth - 10) {
        left = window.innerWidth - anchoPopover - 10;
      }

      setPosicion({ top, left });
      setAbierto(true);
    }
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;
    const handleClickFuera = (e) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setAbierto(false);
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickFuera);
    }, 10);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickFuera);
    };
  }, [abierto]);

  const handleColorChange = (nuevoColor) => {
    setValorHex(nuevoColor);
    onChange(nuevoColor);
  };

  const handleInputChange = (e) => {
    const valor = e.target.value;
    setValorHex(valor);
    if (/^#[0-9A-Fa-f]{6}$/.test(valor)) {
      onChange(valor);
    }
  };

  return (
    <div className="apariencia-colorpicker-wrapper">
      <button
        ref={buttonRef}
        type="button"
        className="apariencia-color-picker-btn"
        style={{ backgroundColor: color }}
        onClick={togglePicker}
        title="Color personalizado"
      />
      {abierto &&
        createPortal(
          <div
            ref={pickerRef}
            className="apariencia-colorpicker-popover"
            style={{ top: `${posicion.top}px`, left: `${posicion.left}px` }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <HexColorPicker color={color} onChange={handleColorChange} />
            <div className="apariencia-colorpicker-input-row">
              <input
                type="text"
                value={valorHex}
                onChange={handleInputChange}
                className="apariencia-colorpicker-hex-input"
                placeholder="#000000"
                maxLength={7}
              />
              <button
                type="button"
                className="apariencia-colorpicker-copy-btn"
                onClick={() => navigator.clipboard.writeText(valorHex)}
                title="Copiar color"
              >
                📋
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

/**
 * Componente de preview que muestra cómo quedan los estilos aplicados
 */
const PreviewTarjeta = ({ estilos, valores, onRandomizar, onResetearValores }) => {
  const decimales = estilos.valorBox.decimales ?? 2;

  return (
    <div className="preview-tarjeta">
      <div className="preview-header">
        <div className="preview-header-icons">
          <span className="preview-icon">▲</span>
        </div>
        <span
          className="preview-titulo"
          style={{
            fontFamily: estilos.header.fontFamily,
            fontSize: estilos.header.fontSize,
            fontWeight: estilos.header.fontWeight,
          }}
        >
          TRAFO 1
        </span>
      </div>

      <div className="preview-body">
        {/* Sección superior */}
        <div className="preview-seccion">
          <div
            className="preview-zona-titulo"
            style={{
              fontFamily: estilos.tituloZona.fontFamily,
              fontSize: estilos.tituloZona.fontSize,
            }}
          >
            CORRIENTE DE LÍNEA (A) (EN 33 KV)
          </div>
          <div className="preview-boxes" style={{ gap: estilos.box.gap }}>
            {["R", "S", "T"].map((fase, idx) => (
              <div
                key={fase}
                className="preview-box"
                style={{ width: estilos.box.width, flex: `0 0 ${estilos.box.width}` }}
              >
                <span
                  className="preview-box-titulo"
                  style={{
                    fontFamily: estilos.tituloBox.fontFamily,
                    fontSize: estilos.tituloBox.fontSize,
                  }}
                >
                  {fase}
                </span>
                <span
                  className="preview-box-valor"
                  style={{
                    fontFamily: estilos.valorBox.fontFamily,
                    fontSize: estilos.valorBox.fontSize,
                    color: estilos.valorBox.color,
                    width: "100%",
                    height: estilos.box.height !== "auto" ? estilos.box.height : undefined,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {formatearValorConDecimales(valores[idx], decimales)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sección inferior */}
        <div className="preview-seccion">
          <div
            className="preview-zona-titulo"
            style={{
              fontFamily: estilos.tituloZona.fontFamily,
              fontSize: estilos.tituloZona.fontSize,
            }}
          >
            CORRIENTE DE LÍNEA (A) (EN 13,2 KV)
          </div>
          <div className="preview-boxes" style={{ gap: estilos.box.gap }}>
            {["R", "S", "T"].map((fase, idx) => (
              <div
                key={`inf-${fase}`}
                className="preview-box"
                style={{ width: estilos.box.width, flex: `0 0 ${estilos.box.width}` }}
              >
                <span
                  className="preview-box-titulo"
                  style={{
                    fontFamily: estilos.tituloBox.fontFamily,
                    fontSize: estilos.tituloBox.fontSize,
                  }}
                >
                  {fase}
                </span>
                <span
                  className="preview-box-valor"
                  style={{
                    fontFamily: estilos.valorBox.fontFamily,
                    fontSize: estilos.valorBox.fontSize,
                    color: estilos.valorBox.color,
                    width: "100%",
                    height: estilos.box.height !== "auto" ? estilos.box.height : undefined,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {formatearValorConDecimales(valores[idx], decimales)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botones para controlar los valores del preview */}
      <div className="preview-acciones">
        <button
          type="button"
          className="preview-btn"
          onClick={onRandomizar}
          title="Poner valores aleatorios"
        >
          🎲
        </button>
        <button
          type="button"
          className="preview-btn"
          onClick={onResetearValores}
          title="Volver a --,--"
        >
          ⟲
        </button>
      </div>
    </div>
  );
};

// Valores por defecto para el preview
const VALORES_DEFAULT = ["--,--", "--,--", "--,--"];

/**
 * Componente para configurar la apariencia global de las tarjetas
 */
const TabApariencia = ({
  estilosIniciales,
  onGuardar,
  onCancelar,
}) => {
  // Ref para guardar los estilos iniciales y solo sincronizar una vez
  const estilosInicialesRef = useRef(null);

  // Estado local para los estilos (copia editable)
  const [estilos, setEstilos] = useState(() => ({
    header: { ...ESTILOS_GLOBALES_DEFAULT.header, ...estilosIniciales?.header },
    tituloZona: { ...ESTILOS_GLOBALES_DEFAULT.tituloZona, ...estilosIniciales?.tituloZona },
    tituloBox: { ...ESTILOS_GLOBALES_DEFAULT.tituloBox, ...estilosIniciales?.tituloBox },
    valorBox: { ...ESTILOS_GLOBALES_DEFAULT.valorBox, ...estilosIniciales?.valorBox },
    box: { ...ESTILOS_GLOBALES_DEFAULT.box, ...estilosIniciales?.box },
  }));

  // Estado para los valores del preview
  const [valoresPreview, setValoresPreview] = useState(VALORES_DEFAULT);

  // Reiniciar estado local solo cuando cambian los estilos iniciales realmente (al abrir el modal)
  useEffect(() => {
    // Solo actualizar si es la primera vez o si los estilos iniciales cambiaron de verdad
    const estilosStr = JSON.stringify(estilosIniciales);
    if (estilosIniciales && estilosInicialesRef.current !== estilosStr) {
      estilosInicialesRef.current = estilosStr;
      setEstilos({
        header: { ...ESTILOS_GLOBALES_DEFAULT.header, ...estilosIniciales.header },
        tituloZona: { ...ESTILOS_GLOBALES_DEFAULT.tituloZona, ...estilosIniciales.tituloZona },
        tituloBox: { ...ESTILOS_GLOBALES_DEFAULT.tituloBox, ...estilosIniciales.tituloBox },
        valorBox: { ...ESTILOS_GLOBALES_DEFAULT.valorBox, ...estilosIniciales.valorBox },
        box: { ...ESTILOS_GLOBALES_DEFAULT.box, ...estilosIniciales.box },
      });
    }
  }, [estilosIniciales]);

  // Funciones para actualizar cada sección
  const actualizarHeader = useCallback((cambios) => {
    setEstilos((prev) => ({
      ...prev,
      header: { ...prev.header, ...cambios },
    }));
  }, []);

  const actualizarTituloZona = useCallback((cambios) => {
    setEstilos((prev) => ({
      ...prev,
      tituloZona: { ...prev.tituloZona, ...cambios },
    }));
  }, []);

  const actualizarTituloBox = useCallback((cambios) => {
    setEstilos((prev) => ({
      ...prev,
      tituloBox: { ...prev.tituloBox, ...cambios },
    }));
  }, []);

  const actualizarValorBox = useCallback((cambios) => {
    setEstilos((prev) => ({
      ...prev,
      valorBox: { ...prev.valorBox, ...cambios },
    }));
  }, []);

  const actualizarBox = useCallback((cambios) => {
    setEstilos((prev) => ({
      ...prev,
      box: { ...prev.box, ...cambios },
    }));
  }, []);

  // Restaurar valores por defecto
  const restaurarDefecto = useCallback(() => {
    setEstilos(ESTILOS_GLOBALES_DEFAULT);
  }, []);

  // Funciones auxiliares
  const remANumero = (remStr) => {
    if (typeof remStr === "number") return remStr;
    return parseFloat(remStr) || 1;
  };

  const pxANumero = (pxStr) => {
    if (typeof pxStr === "number") return pxStr;
    return parseInt(pxStr) || 80;
  };

  const randomizarValores = useCallback(() => {
    const decimales = estilos.valorBox.decimales ?? 2;
    setValoresPreview([
      generarValorAleatorio(decimales),
      generarValorAleatorio(decimales),
      generarValorAleatorio(decimales),
    ]);
  }, [estilos.valorBox.decimales]);

  const resetearValoresPreview = useCallback(() => {
    setValoresPreview(VALORES_DEFAULT);
  }, []);

  // Guardar cambios
  const handleGuardar = () => {
    onGuardar(estilos);
  };

  // Referencia para el input de archivo oculto
  const inputArchivoRef = useRef(null);

  // Exportar configuración a archivo JSON
  const exportarConfiguracion = useCallback(async () => {
    const configuracion = {
      version: FORMATO_VERSION,
      fechaExportacion: new Date().toISOString(),
      estilos: estilos,
    };

    const contenidoJSON = JSON.stringify(configuracion, null, 2);
    const nombreArchivo = `apariencia-tarjetas-${new Date().toISOString().slice(0, 10)}.json`;

    // Intentar usar File System Access API (Chrome, Edge)
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: nombreArchivo,
          types: [
            {
              description: "Archivo JSON",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(contenidoJSON);
        await writable.close();
        return; // Éxito con File System Access API
      } catch (err) {
        // Si el usuario cancela, no hacer nada
        if (err.name === "AbortError") return;
        // Si hay otro error, usar el fallback
        console.warn("File System Access API falló, usando fallback:", err);
      }
    }

    // Fallback para navegadores sin soporte (Firefox, Safari, etc.)
    const blob = new Blob([contenidoJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [estilos]);

  // Importar configuración desde archivo JSON
  const importarConfiguracion = (evento) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (e) => {
      try {
        const contenido = JSON.parse(e.target.result);

        // Validar que tenga la estructura esperada
        if (!contenido.estilos) {
          alert("El archivo no tiene el formato correcto de configuración.");
          return;
        }

        // Aplicar los estilos importados
        setEstilos({
          header: { ...ESTILOS_GLOBALES_DEFAULT.header, ...contenido.estilos.header },
          tituloZona: { ...ESTILOS_GLOBALES_DEFAULT.tituloZona, ...contenido.estilos.tituloZona },
          tituloBox: { ...ESTILOS_GLOBALES_DEFAULT.tituloBox, ...contenido.estilos.tituloBox },
          valorBox: { ...ESTILOS_GLOBALES_DEFAULT.valorBox, ...contenido.estilos.valorBox },
          box: { ...ESTILOS_GLOBALES_DEFAULT.box, ...contenido.estilos.box },
        });
      } catch {
        alert("Error al leer el archivo. Asegúrate de que sea un archivo JSON válido.");
      }
    };
    lector.readAsText(archivo);

    // Limpiar el input para permitir reimportar el mismo archivo
    evento.target.value = "";
  };

  return (
    <div className="tab-apariencia">
      <div className="apariencia-layout">
        {/* Columna de controles - todo en un contenedor con separadores */}
        <div className="apariencia-controles-columna">
          <div className="apariencia-controles-unificado">
            {/* Header */}
            <div className="apariencia-grupo">
              <span className="apariencia-grupo-label">Header</span>
              <SelectorFuente
                value={estilos.header.fontFamily}
                onChange={(fontFamily) => actualizarHeader({ fontFamily })}
                fuentes={FUENTES_DISPONIBLES}
              />
              <SliderConFlechas
                value={remANumero(estilos.header.fontSize)}
                onChange={(val) => actualizarHeader({ fontSize: `${val}rem` })}
                min={LIMITES_TAMAÑO.header.min}
                max={LIMITES_TAMAÑO.header.max}
                step={LIMITES_TAMAÑO.header.step}
                valorDisplay={estilos.header.fontSize}
              />
            </div>

            <div className="apariencia-separador" />

            {/* Títulos zona */}
            <div className="apariencia-grupo">
              <span className="apariencia-grupo-label">Zona</span>
              <SelectorFuente
                value={estilos.tituloZona.fontFamily}
                onChange={(fontFamily) => actualizarTituloZona({ fontFamily })}
                fuentes={FUENTES_DISPONIBLES}
              />
              <SliderConFlechas
                value={remANumero(estilos.tituloZona.fontSize)}
                onChange={(val) => actualizarTituloZona({ fontSize: `${val}rem` })}
                min={LIMITES_TAMAÑO.tituloZona.min}
                max={LIMITES_TAMAÑO.tituloZona.max}
                step={LIMITES_TAMAÑO.tituloZona.step}
                valorDisplay={estilos.tituloZona.fontSize}
              />
            </div>

            <div className="apariencia-separador" />

            {/* Fases */}
            <div className="apariencia-grupo">
              <span className="apariencia-grupo-label">Fases</span>
              <SelectorFuente
                value={estilos.tituloBox.fontFamily}
                onChange={(fontFamily) => actualizarTituloBox({ fontFamily })}
                fuentes={FUENTES_DISPONIBLES}
              />
              <SliderConFlechas
                value={remANumero(estilos.tituloBox.fontSize)}
                onChange={(val) => actualizarTituloBox({ fontSize: `${val}rem` })}
                min={LIMITES_TAMAÑO.tituloBox.min}
                max={LIMITES_TAMAÑO.tituloBox.max}
                step={LIMITES_TAMAÑO.tituloBox.step}
                valorDisplay={estilos.tituloBox.fontSize}
              />
            </div>

            <div className="apariencia-separador" />

            {/* Valores */}
            <div className="apariencia-grupo">
              <span className="apariencia-grupo-label">Valores</span>
              <SelectorFuente
                value={estilos.valorBox.fontFamily}
                onChange={(fontFamily) => actualizarValorBox({ fontFamily })}
                fuentes={FUENTES_DISPONIBLES}
              />
              <SliderConFlechas
                value={remANumero(estilos.valorBox.fontSize)}
                onChange={(val) => actualizarValorBox({ fontSize: `${val}rem` })}
                min={LIMITES_TAMAÑO.valorBox.min}
                max={LIMITES_TAMAÑO.valorBox.max}
                step={LIMITES_TAMAÑO.valorBox.step}
                valorDisplay={estilos.valorBox.fontSize}
              />
            </div>

            {/* Colores y Decimales en una fila */}
            <div className="apariencia-colores-decimales">
              {/* Colores a la izquierda */}
              <div className="apariencia-colores-grupo">
                <span className="apariencia-mini-label">Color:</span>
                <div className="apariencia-colores-inline">
                  {COLORES_VALOR_PREDEFINIDOS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`apariencia-color-btn ${estilos.valorBox.color === color ? "apariencia-color-btn--activo" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => actualizarValorBox({ color })}
                      title={color}
                    />
                  ))}
                  <ColorPickerBoton
                    color={estilos.valorBox.color}
                    onChange={(color) => actualizarValorBox({ color })}
                  />
                </div>
              </div>

              {/* Decimales a la derecha */}
              <div className="apariencia-decimales-grupo">
                <span className="apariencia-mini-label">Decimales:</span>
                <div className="apariencia-decimales-inline">
                  {OPCIONES_DECIMALES.map((opcion) => (
                    <button
                      key={opcion.valor}
                      type="button"
                      className={`apariencia-decimal-btn ${(estilos.valorBox.decimales ?? 2) === opcion.valor ? "apariencia-decimal-btn--activo" : ""}`}
                      onClick={() => actualizarValorBox({ decimales: opcion.valor })}
                    >
                      {opcion.valor}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="apariencia-separador" />

            {/* Dimensiones - grid 2x2 */}
            <div className="apariencia-grupo apariencia-grupo--dimensiones">
              <span className="apariencia-grupo-label">Dimensiones</span>
              <div className="apariencia-dimensiones-fila">
                <div className="apariencia-dimension-item">
                  <label>Ancho</label>
                  <SliderConFlechas
                    value={pxANumero(estilos.box.width)}
                    onChange={(val) => actualizarBox({ width: `${val}px` })}
                    min={LIMITES_TAMAÑO.boxWidth.min}
                    max={LIMITES_TAMAÑO.boxWidth.max}
                    step={LIMITES_TAMAÑO.boxWidth.step}
                    valorDisplay={estilos.box.width}
                  />
                </div>
                <div className="apariencia-dimension-item">
                  <label>Espacio</label>
                  <SliderConFlechas
                    value={pxANumero(estilos.box.gap)}
                    onChange={(val) => actualizarBox({ gap: `${val}px` })}
                    min={LIMITES_TAMAÑO.gap.min}
                    max={LIMITES_TAMAÑO.gap.max}
                    step={LIMITES_TAMAÑO.gap.step}
                    valorDisplay={estilos.box.gap}
                  />
                </div>
                <div className="apariencia-dimension-item">
                  <label>Alto</label>
                  <SliderConFlechas
                    value={estilos.box.height === "auto" ? LIMITES_TAMAÑO.boxHeight.min : pxANumero(estilos.box.height)}
                    onChange={(val) => actualizarBox({ height: `${val}px` })}
                    min={LIMITES_TAMAÑO.boxHeight.min}
                    max={LIMITES_TAMAÑO.boxHeight.max}
                    step={LIMITES_TAMAÑO.boxHeight.step}
                    valorDisplay={estilos.box.height}
                  />
                </div>
              </div>
            </div>

            {/* Botones de configuración - solo visibles en móvil dentro del contenedor */}
            <div className="apariencia-separador apariencia-separador--mobile-only" />
            <div className="apariencia-botones-config-mobile">
              <button
                type="button"
                className="apariencia-btn apariencia-btn--reset"
                onClick={restaurarDefecto}
              >
                Restaurar
              </button>
              <button
                type="button"
                className="apariencia-btn apariencia-btn--importar"
                onClick={() => inputArchivoRef.current?.click()}
                title="Importar configuración desde archivo"
              >
                Importar
              </button>
              <button
                type="button"
                className="apariencia-btn apariencia-btn--exportar"
                onClick={exportarConfiguracion}
                title="Exportar configuración a archivo"
              >
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Columna de preview */}
        <div className="apariencia-preview-columna">
          <div className="apariencia-preview-label">Vista previa</div>
          <PreviewTarjeta
            estilos={estilos}
            valores={valoresPreview}
            onRandomizar={randomizarValores}
            onResetearValores={resetearValoresPreview}
          />
        </div>
      </div>

      {/* Footer con botones */}
      <div className="apariencia-footer">
        <div className="apariencia-footer-izquierda">
          <button
            type="button"
            className="apariencia-btn apariencia-btn--reset"
            onClick={restaurarDefecto}
          >
            Restaurar por defecto
          </button>
          <button
            type="button"
            className="apariencia-btn apariencia-btn--importar"
            onClick={() => inputArchivoRef.current?.click()}
            title="Importar configuración desde archivo"
          >
            Importar
          </button>
          <button
            type="button"
            className="apariencia-btn apariencia-btn--exportar"
            onClick={exportarConfiguracion}
            title="Exportar configuración a archivo"
          >
            Exportar
          </button>
          {/* Input oculto para importar archivo */}
          <input
            ref={inputArchivoRef}
            type="file"
            accept=".json"
            onChange={importarConfiguracion}
            style={{ display: "none" }}
          />
        </div>
        <div className="apariencia-footer-derecha">
          <button
            type="button"
            className="apariencia-btn apariencia-btn--cancelar"
            onClick={onCancelar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="apariencia-btn apariencia-btn--guardar"
            onClick={handleGuardar}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabApariencia;
