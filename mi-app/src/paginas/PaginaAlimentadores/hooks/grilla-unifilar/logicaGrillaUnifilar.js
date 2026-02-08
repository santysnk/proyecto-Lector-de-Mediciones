/**
 * Hook principal para manejar la grilla de dibujo unifiliar
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
   COLORES_UNIFILAR,
   FUENTES_DISPONIBLES,
   TAMANOS_FUENTE,
   GROSORES_LINEA,
   TIPOS_BORNE,
   CONFIG_CHISPAS_DEFAULT,
   CONFIG_TEXTO_INICIAL,
   obtenerCeldasConectadas as obtenerConectadas,
   calcularCeldasMovidas,
   calcularFloodFill,
   calcularBorradoArea,
   calcularPosicionLineaRecta,
   generarClave,
   cargarDatos,
   guardarDatosEnStorage,
   exportarAArchivo as exportarArchivo,
   importarDesdeArchivo as importarArchivo,
} from ".";
import { useBornesYChispas } from "./useBornesYChispas";

// Re-exportar constantes para uso externo
export { COLORES_UNIFILAR, FUENTES_DISPONIBLES, TAMANOS_FUENTE, GROSORES_LINEA, TIPOS_BORNE, CONFIG_CHISPAS_DEFAULT };

/**
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

   // Clave de localStorage
   const clave = generarClave(puestoId, workspaceId);

   // Cargar datos al montar o cambiar de puesto
   useEffect(() => {
      const datos = cargarDatos(clave);
      setCeldas(datos.celdas);
      setTextos(datos.textos);
      setGrosorLinea(datos.grosorLinea);
      bornesChispas.setBornes(datos.bornes);
      bornesChispas.setChispasConfig(datos.chispasConfig);
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [clave]);

   // Función de guardado
   const guardar = useCallback(
      (nuevasCeldas, nuevosTextos, nuevoGrosor = null, nuevosBornes = null, nuevaChispasConfig = null) => {
         guardarDatosEnStorage(clave, {
            celdas: nuevasCeldas,
            textos: nuevosTextos,
            grosorLinea: nuevoGrosor ?? grosorLinea,
            bornes: nuevosBornes ?? bornesChispas.bornes,
            chispasConfig: nuevaChispasConfig ?? bornesChispas.chispasConfig,
         });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [clave, grosorLinea]
   );

   // Función bridge para bornesYChispas: guarda con celdas/textos actuales
   const guardarConBornes = useCallback(
      (nuevoGrosor, nuevosBornes, nuevaChispasConfig) => {
         setCeldas((currentCeldas) => {
            setTextos((currentTextos) => {
               guardarDatosEnStorage(clave, {
                  celdas: currentCeldas,
                  textos: currentTextos,
                  grosorLinea: nuevoGrosor ?? grosorLinea,
                  bornes: nuevosBornes,
                  chispasConfig: nuevaChispasConfig,
               });
               return currentTextos;
            });
            return currentCeldas;
         });
      },
      [clave, grosorLinea]
   );

   // Hook de bornes y chispas
   const bornesChispas = useBornesYChispas({
      celdas,
      grosorLinea,
      chispasConfigInicial: CONFIG_CHISPAS_DEFAULT,
      bornesIniciales: [],
      guardarConBornes,
   });

   // ===== Acciones de pintado =====

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

   // ===== Mover líneas conectadas =====

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

   // ===== Acciones de texto =====

   const agregarTexto = useCallback(
      (x, y, contenido) => {
         if (!contenido.trim()) return;

         const nuevoTexto = {
            id: `texto-${Date.now()}`,
            x, y,
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

   // ===== Selección de herramientas =====

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

   // ===== Importar/Exportar =====

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

   // ===== Return =====

   const tieneDibujo = Object.keys(celdas).length > 0 || textos.length > 0;

   return {
      celdas, textos, modoEdicion, colorSeleccionado, herramienta, estaPintando, tieneDibujo, grosorLinea,
      configTexto, setConfigTexto, textoSeleccionadoId, setTextoSeleccionadoId,
      coloresDisponibles: COLORES_UNIFILAR,
      fuentesDisponibles: FUENTES_DISPONIBLES,
      tamanosDisponibles: TAMANOS_FUENTE,
      grosoresDisponibles: GROSORES_LINEA,
      toggleEdicion, activarEdicion, desactivarEdicion,
      pintarCelda, limpiarTodo, iniciarPintado, detenerPintado, rellenarConectadas, borrarArea,
      agregarTexto, actualizarTexto, eliminarTexto,
      setColorSeleccionado, seleccionarPincel, seleccionarBorrador, seleccionarTexto, seleccionarBalde, seleccionarMover,
      obtenerCeldasConectadas, moverCeldasConectadas,
      cambiarGrosor,
      exportarAArchivo, importarDesdeArchivo,
      bornes: bornesChispas.bornes,
      chispasConfig: bornesChispas.chispasConfig,
      tiposBorne: TIPOS_BORNE,
      seleccionarBorne,
      agregarBorne: bornesChispas.agregarBorne,
      eliminarBorne: bornesChispas.eliminarBorne,
      eliminarBorneEnPosicion: bornesChispas.eliminarBorneEnPosicion,
      actualizarBorne: bornesChispas.actualizarBorne,
      obtenerBorneEnPosicion: bornesChispas.obtenerBorneEnPosicion,
      actualizarChispasConfig: bornesChispas.actualizarChispasConfig,
   };
};

export default useGrillaUnifilar;
