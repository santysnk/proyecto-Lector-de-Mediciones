// src/paginas/PaginaAlimentadores/hooks/usarGrillaUnifilar.js

import { useState, useCallback, useEffect, useRef } from "react";
import {
   // Constantes
   COLORES_UNIFILAR,
   FUENTES_DISPONIBLES,
   TAMANOS_FUENTE,
   GROSORES_LINEA,
   TIPOS_BORNE,
   CONFIG_CHISPAS_DEFAULT,
   CONFIG_TEXTO_INICIAL,
   // Algoritmos
   obtenerCeldasConectadas as obtenerConectadas,
   calcularCeldasMovidas,
   calcularFloodFill,
   calcularBorradoArea,
   calcularPosicionLineaRecta,
   // Persistencia
   generarClave,
   cargarDatos,
   guardarDatosEnStorage,
   exportarAArchivo as exportarArchivo,
   importarDesdeArchivo as importarArchivo,
} from ".";

// Re-exportar constantes para uso externo
export { COLORES_UNIFILAR, FUENTES_DISPONIBLES, TAMANOS_FUENTE, GROSORES_LINEA, TIPOS_BORNE, CONFIG_CHISPAS_DEFAULT };

/**
 * Hook para manejar la grilla de dibujo unifiliar
 * @param {string} puestoId - ID del puesto actual
 * @param {string} workspaceId - ID del workspace actual
 */
const useGrillaUnifilar = (puestoId, workspaceId) => {
   // Estado del dibujo
   const [celdas, setCeldas] = useState({});
   const [textos, setTextos] = useState([]);
   const [modoEdicion, setModoEdicion] = useState(false);
   const [colorSeleccionado, setColorSeleccionado] = useState(COLORES_UNIFILAR[0].color);
   const [herramienta, setHerramienta] = useState("pincel");
   const [grosorLinea, setGrosorLinea] = useState(GROSORES_LINEA[1].valor);
   const [estaPintando, setEstaPintando] = useState(false);

   // Referencias para líneas rectas con Shift
   const puntoInicialRef = useRef(null);
   const direccionBloqueadaRef = useRef(null);

   // Configuración de texto
   const [configTexto, setConfigTexto] = useState(CONFIG_TEXTO_INICIAL);
   const [textoSeleccionadoId, setTextoSeleccionadoId] = useState(null);

   // Sistema de bornes y chispas
   const [bornes, setBornes] = useState([]);
   const [chispasConfig, setChispasConfig] = useState(CONFIG_CHISPAS_DEFAULT);

   // Clave de localStorage
   const clave = generarClave(puestoId, workspaceId);

   // Cargar datos al montar o cambiar de puesto
   useEffect(() => {
      const datos = cargarDatos(clave);
      setCeldas(datos.celdas);
      setTextos(datos.textos);
      setGrosorLinea(datos.grosorLinea);
      setBornes(datos.bornes);
      setChispasConfig(datos.chispasConfig);
   }, [clave]);

   // Función de guardado
   const guardar = useCallback(
      (nuevasCeldas, nuevosTextos, nuevoGrosor = null, nuevosBornes = null, nuevaChispasConfig = null) => {
         guardarDatosEnStorage(clave, {
            celdas: nuevasCeldas,
            textos: nuevosTextos,
            grosorLinea: nuevoGrosor ?? grosorLinea,
            bornes: nuevosBornes ?? bornes,
            chispasConfig: nuevaChispasConfig ?? chispasConfig,
         });
      },
      [clave, grosorLinea, bornes, chispasConfig]
   );

   // ============================================================================
   // Acciones de pintado
   // ============================================================================

   const pintarCelda = useCallback(
      (x, y, shiftPresionado = false) => {
         const pos = shiftPresionado
            ? calcularPosicionLineaRecta(x, y, puntoInicialRef.current, direccionBloqueadaRef.current)
            : { x, y, direccion: null };

         if (shiftPresionado) {
            direccionBloqueadaRef.current = pos.direccion;
         }

         const claveCelda = `${pos.x},${pos.y}`;

         setCeldas((prev) => {
            let nuevasCeldas;
            if (herramienta === "borrador") {
               nuevasCeldas = { ...prev };
               delete nuevasCeldas[claveCelda];
            } else {
               nuevasCeldas = { ...prev, [claveCelda]: colorSeleccionado };
            }

            setTextos((currentTextos) => {
               guardar(nuevasCeldas, currentTextos);
               return currentTextos;
            });
            return nuevasCeldas;
         });
      },
      [colorSeleccionado, herramienta, guardar]
   );

   const limpiarTodo = useCallback(() => {
      setCeldas({});
      setTextos([]);
      guardar({}, []);
   }, [guardar]);

   const iniciarPintado = useCallback((x, y) => {
      setEstaPintando(true);
      puntoInicialRef.current = { x, y };
      direccionBloqueadaRef.current = null;
   }, []);

   const detenerPintado = useCallback(() => {
      setEstaPintando(false);
      puntoInicialRef.current = null;
      direccionBloqueadaRef.current = null;
   }, []);

   const rellenarConectadas = useCallback(
      (x, y) => {
         setCeldas((prev) => {
            const nuevasCeldas = calcularFloodFill(prev, x, y, colorSeleccionado);
            if (!nuevasCeldas) return prev;

            setTextos((currentTextos) => {
               guardar(nuevasCeldas, currentTextos);
               return currentTextos;
            });
            return nuevasCeldas;
         });
      },
      [colorSeleccionado, guardar]
   );

   const borrarArea = useCallback(
      (x1, y1, x2, y2) => {
         setCeldas((prev) => {
            const { celdas: nuevasCeldas, huboCambios } = calcularBorradoArea(prev, x1, y1, x2, y2);
            if (!huboCambios) return prev;

            setTextos((currentTextos) => {
               guardar(nuevasCeldas, currentTextos);
               return currentTextos;
            });
            return nuevasCeldas;
         });
      },
      [guardar]
   );

   // ============================================================================
   // Funciones para mover líneas conectadas
   // ============================================================================

   const obtenerCeldasConectadas = useCallback((x, y) => obtenerConectadas(x, y, celdas), [celdas]);

   const moverCeldasConectadas = useCallback(
      (celdasAMover, deltaX, deltaY) => {
         if (deltaX === 0 && deltaY === 0 || celdasAMover.length === 0) return;

         setCeldas((prev) => {
            const nuevasCeldas = calcularCeldasMovidas(prev, celdasAMover, deltaX, deltaY);

            setTextos((currentTextos) => {
               guardar(nuevasCeldas, currentTextos);
               return currentTextos;
            });
            return nuevasCeldas;
         });
      },
      [guardar]
   );

   // ============================================================================
   // Acciones de texto
   // ============================================================================

   const agregarTexto = useCallback(
      (x, y, contenido) => {
         if (!contenido.trim()) return;

         const nuevoTexto = {
            id: `texto-${Date.now()}`,
            x,
            y,
            texto: contenido,
            color: colorSeleccionado,
            fuente: configTexto.fuente,
            tamano: configTexto.tamano,
            negrita: configTexto.negrita,
            cursiva: configTexto.cursiva,
         };

         setTextos((prev) => {
            const nuevosTextos = [...prev, nuevoTexto];
            setCeldas((currentCeldas) => {
               guardar(currentCeldas, nuevosTextos);
               return currentCeldas;
            });
            return nuevosTextos;
         });
      },
      [colorSeleccionado, configTexto, guardar]
   );

   const actualizarTexto = useCallback(
      (id, cambios) => {
         setTextos((prev) => {
            const nuevosTextos = prev.map((t) => (t.id === id ? { ...t, ...cambios } : t));
            setCeldas((currentCeldas) => {
               guardar(currentCeldas, nuevosTextos);
               return currentCeldas;
            });
            return nuevosTextos;
         });
      },
      [guardar]
   );

   const eliminarTexto = useCallback(
      (id) => {
         setTextos((prev) => {
            const nuevosTextos = prev.filter((t) => t.id !== id);
            setCeldas((currentCeldas) => {
               guardar(currentCeldas, nuevosTextos);
               return currentCeldas;
            });
            return nuevosTextos;
         });
         setTextoSeleccionadoId(null);
      },
      [guardar]
   );

   // ============================================================================
   // Selección de herramientas
   // ============================================================================

   const activarEdicion = useCallback(() => setModoEdicion(true), []);
   const desactivarEdicion = useCallback(() => {
      setModoEdicion(false);
      setEstaPintando(false);
   }, []);
   const toggleEdicion = useCallback(
      () => (modoEdicion ? desactivarEdicion() : activarEdicion()),
      [modoEdicion, activarEdicion, desactivarEdicion]
   );

   const seleccionarPincel = useCallback(() => setHerramienta("pincel"), []);
   const seleccionarBorrador = useCallback(() => {
      setHerramienta("borrador");
      setTextoSeleccionadoId(null);
   }, []);
   const seleccionarTexto = useCallback(() => setHerramienta("texto"), []);
   const seleccionarBalde = useCallback(() => {
      setHerramienta("balde");
      setTextoSeleccionadoId(null);
   }, []);
   const seleccionarMover = useCallback(() => {
      setHerramienta("mover");
      setTextoSeleccionadoId(null);
   }, []);
   const seleccionarBorne = useCallback(() => setHerramienta("borne"), []);

   const cambiarGrosor = useCallback(
      (nuevoGrosor) => {
         setGrosorLinea(nuevoGrosor);
         setCeldas((currentCeldas) => {
            setTextos((currentTextos) => {
               guardar(currentCeldas, currentTextos, nuevoGrosor);
               return currentTextos;
            });
            return currentCeldas;
         });
      },
      [guardar]
   );

   // ============================================================================
   // Sistema de bornes
   // ============================================================================

   const agregarBorne = useCallback(
      (x, y, tipo) => {
         const claveCelda = `${x},${y}`;
         if (!celdas[claveCelda]) {
            console.warn("Solo se pueden colocar bornes sobre líneas pintadas");
            return false;
         }
         if (bornes.some((b) => b.x === x && b.y === y)) {
            console.warn("Ya existe un borne en esta posición");
            return false;
         }

         const contadorTipo = bornes.filter((b) => b.tipo === tipo).length + 1;
         const nuevoBorne = {
            id: `borne-${Date.now()}`,
            tipo,
            x,
            y,
            color: tipo === TIPOS_BORNE.EMISOR ? "#22d3ee" : "#f97316",
            activo: true,
            frecuenciaMs: chispasConfig.frecuenciaEmision,
            nombre: `${tipo === TIPOS_BORNE.EMISOR ? "E" : "R"}${contadorTipo}`,
         };

         const nuevosBornes = [...bornes, nuevoBorne];
         setBornes(nuevosBornes);

         setCeldas((currentCeldas) => {
            setTextos((currentTextos) => {
               guardar(currentCeldas, currentTextos, grosorLinea, nuevosBornes);
               return currentTextos;
            });
            return currentCeldas;
         });

         return true;
      },
      [celdas, bornes, chispasConfig.frecuenciaEmision, grosorLinea, guardar]
   );

   const eliminarBorne = useCallback(
      (borneId) => {
         const nuevosBornes = bornes.filter((b) => b.id !== borneId);
         setBornes(nuevosBornes);

         setCeldas((currentCeldas) => {
            setTextos((currentTextos) => {
               guardar(currentCeldas, currentTextos, grosorLinea, nuevosBornes);
               return currentTextos;
            });
            return currentCeldas;
         });
      },
      [bornes, grosorLinea, guardar]
   );

   const eliminarBorneEnPosicion = useCallback(
      (x, y) => {
         const borneEnPosicion = bornes.find((b) => b.x === x && b.y === y);
         if (borneEnPosicion) {
            eliminarBorne(borneEnPosicion.id);
            return true;
         }
         return false;
      },
      [bornes, eliminarBorne]
   );

   const actualizarBorne = useCallback(
      (borneId, cambios) => {
         const nuevosBornes = bornes.map((b) => (b.id === borneId ? { ...b, ...cambios } : b));
         setBornes(nuevosBornes);

         setCeldas((currentCeldas) => {
            setTextos((currentTextos) => {
               guardar(currentCeldas, currentTextos, grosorLinea, nuevosBornes);
               return currentTextos;
            });
            return currentCeldas;
         });
      },
      [bornes, grosorLinea, guardar]
   );

   const obtenerBorneEnPosicion = useCallback((x, y) => bornes.find((b) => b.x === x && b.y === y) || null, [bornes]);

   const actualizarChispasConfig = useCallback(
      (nuevaConfig) => {
         const configActualizada = { ...chispasConfig, ...nuevaConfig };
         setChispasConfig(configActualizada);

         setCeldas((currentCeldas) => {
            setTextos((currentTextos) => {
               guardar(currentCeldas, currentTextos, grosorLinea, bornes, configActualizada);
               return currentTextos;
            });
            return currentCeldas;
         });
      },
      [chispasConfig, grosorLinea, bornes, guardar]
   );

   // ============================================================================
   // Importar/Exportar
   // ============================================================================

   const exportarAArchivo = useCallback(() => {
      exportarArchivo({ celdas, textos, grosorLinea }, puestoId);
   }, [celdas, textos, grosorLinea, puestoId]);

   const importarDesdeArchivo = useCallback(
      async (archivo) => {
         const { exito, datos } = await importarArchivo(archivo);
         if (exito && datos) {
            setCeldas(datos.celdas);
            setTextos(datos.textos);
            setGrosorLinea(datos.grosorLinea);
            guardar(datos.celdas, datos.textos, datos.grosorLinea);
         }
         return exito;
      },
      [guardar]
   );

   // ============================================================================
   // Return
   // ============================================================================

   const tieneDibujo = Object.keys(celdas).length > 0 || textos.length > 0;

   return {
      // Estado
      celdas,
      textos,
      modoEdicion,
      colorSeleccionado,
      herramienta,
      estaPintando,
      tieneDibujo,
      grosorLinea,

      // Configuración de texto
      configTexto,
      setConfigTexto,
      textoSeleccionadoId,
      setTextoSeleccionadoId,

      // Colores, fuentes y grosores disponibles
      coloresDisponibles: COLORES_UNIFILAR,
      fuentesDisponibles: FUENTES_DISPONIBLES,
      tamanosDisponibles: TAMANOS_FUENTE,
      grosoresDisponibles: GROSORES_LINEA,

      // Acciones de edición
      toggleEdicion,
      activarEdicion,
      desactivarEdicion,

      // Acciones de pintado
      pintarCelda,
      limpiarTodo,
      iniciarPintado,
      detenerPintado,
      rellenarConectadas,
      borrarArea,

      // Acciones de texto
      agregarTexto,
      actualizarTexto,
      eliminarTexto,

      // Selección de herramientas
      setColorSeleccionado,
      seleccionarPincel,
      seleccionarBorrador,
      seleccionarTexto,
      seleccionarBalde,
      seleccionarMover,

      // Funciones para mover líneas conectadas
      obtenerCeldasConectadas,
      moverCeldasConectadas,

      // Grosor de línea
      cambiarGrosor,

      // Importar/Exportar archivo
      exportarAArchivo,
      importarDesdeArchivo,

      // Sistema de bornes y chispas
      bornes,
      chispasConfig,
      tiposBorne: TIPOS_BORNE,

      // Acciones de bornes
      seleccionarBorne,
      agregarBorne,
      eliminarBorne,
      eliminarBorneEnPosicion,
      actualizarBorne,
      obtenerBorneEnPosicion,

      // Configuración de chispas
      actualizarChispasConfig,
   };
};

export default useGrillaUnifilar;
