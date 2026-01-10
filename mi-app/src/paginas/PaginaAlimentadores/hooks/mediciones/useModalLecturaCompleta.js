// hooks/mediciones/useModalLecturaCompleta.js
// Hook para procesar y mostrar datos completos de lectura en modal expandido

import { useState, useCallback, useMemo, useEffect } from "react";
import { interpretarRegistro } from "../../utilidades/interpreteRegistrosREF615";
import { obtenerFuncionalidadesRegistrador } from "@/servicios/api/registradores";

/**
 * Combina registros High/Low de 32 bits en un solo valor
 * @param {number} high - Parte alta (bits 16-31)
 * @param {number} low - Parte baja (bits 0-15)
 * @returns {number} Valor combinado de 32 bits
 */
const combinarRegistros32Bits = (high, low) => {
   const valorHigh = high ?? 0;
   const valorLow = low ?? 0;
   return (valorHigh * 65536) + valorLow;
};

/**
 * Detecta si una etiqueta es parte de un par High/Low
 * @param {string} etiqueta - Etiqueta del registro
 * @returns {Object|null} { base, tipo } o null si no es par
 */
const detectarParHighLow = (etiqueta) => {
   if (!etiqueta || typeof etiqueta !== "string") return null;

   const matchHigh = etiqueta.match(/^(.+)_High$/i);
   if (matchHigh) {
      return { base: matchHigh[1], tipo: "high" };
   }

   const matchLow = etiqueta.match(/^(.+)_Low$/i);
   if (matchLow) {
      return { base: matchLow[1], tipo: "low" };
   }

   return null;
};

/**
 * Obtiene el nombre completo de una medición según su base
 * @param {string} base - Base de la etiqueta (P, Q, S, FP, etc.)
 * @returns {string} Nombre completo con abreviatura
 */
const obtenerNombreCompleto = (base) => {
   const nombres = {
      "P": "Potencia Activa (P)",
      "Q": "Potencia Reactiva (Q)",
      "S": "Potencia Aparente (S)",
      "FP": "Factor de Potencia (FP)",
      "PF": "Factor de Potencia (PF)",
      "E": "Energía (E)",
      "EA": "Energía Activa (EA)",
      "ER": "Energía Reactiva (ER)",
   };

   return nombres[base.toUpperCase()] || base;
};

/**
 * Agrupa registros High/Low y devuelve valores combinados
 * @param {Array} registros - Array de { etiqueta, registro, valor, transformadorId }
 * @returns {Array} Array procesado con valores combinados
 */
const procesarRegistrosConPares = (registros) => {
   if (!Array.isArray(registros) || registros.length === 0) {
      return [];
   }

   const paresEncontrados = {};
   const registrosSinPar = [];

   // Primera pasada: identificar pares High/Low
   registros.forEach((reg) => {
      const par = detectarParHighLow(reg.etiqueta);

      if (par) {
         if (!paresEncontrados[par.base]) {
            paresEncontrados[par.base] = { high: null, low: null, transformadorId: null };
         }
         paresEncontrados[par.base][par.tipo] = reg;
         // El transformadorId debe ser el mismo para High y Low
         if (reg.transformadorId) {
            paresEncontrados[par.base].transformadorId = reg.transformadorId;
         }
      } else {
         registrosSinPar.push(reg);
      }
   });

   // Segunda pasada: combinar pares y crear resultado
   const resultado = [];

   // Agregar pares combinados
   Object.entries(paresEncontrados).forEach(([base, par]) => {
      const valorHigh = par.high?.valor ?? 0;
      const valorLow = par.low?.valor ?? 0;
      const valorCombinado = combinarRegistros32Bits(valorHigh, valorLow);

      resultado.push({
         etiqueta: obtenerNombreCompleto(base),
         etiquetaCorta: base,
         valor: valorCombinado,
         esParCombinado: true,
         registroHigh: par.high?.registro,
         registroLow: par.low?.registro,
         valorOriginalHigh: valorHigh,
         valorOriginalLow: valorLow,
         transformadorId: par.transformadorId,
      });
   });

   // Agregar registros sin par
   registrosSinPar.forEach((reg) => {
      resultado.push({
         etiqueta: reg.etiqueta,
         etiquetaCorta: reg.etiqueta,
         valor: reg.valor,
         esParCombinado: false,
         registro: reg.registro,
         transformadorId: reg.transformadorId,
      });
   });

   return resultado;
};

/**
 * Determina la categoría de una funcionalidad basándose en su nombre
 */
const determinarCategoria = (nombreFunc) => {
   const nombre = (nombreFunc || "").toLowerCase();
   const esEstado = nombre.includes("estado") ||
      nombre.includes("led") ||
      nombre.includes("alarma") ||
      nombre.includes("interruptor") ||
      nombre.includes("ssr") ||
      nombre.includes("trip");

   return esEstado ? "estados" : "mediciones";
};

/**
 * Hook para manejar el modal de lectura completa
 * @returns {Object} Estado y funciones del modal
 */
export function useModalLecturaCompleta() {
   const [modalAbierto, setModalAbierto] = useState(false);
   const [alimentadorSeleccionado, setAlimentadorSeleccionado] = useState(null);
   const [registrosSeleccionados, setRegistrosSeleccionados] = useState(null);
   const [timestampLectura, setTimestampLectura] = useState(null);

   // Estado para funcionalidades de registradores
   const [funcionalidadesPorRegistrador, setFuncionalidadesPorRegistrador] = useState({});
   const [cargandoFuncionalidades, setCargandoFuncionalidades] = useState(false);
   const [tabActivo, setTabActivo] = useState(null);

   // Estado para etiquetas de bits (LEDs programables)
   const [etiquetasBitsPorRegistrador, setEtiquetasBitsPorRegistrador] = useState({});

   /**
    * Abre el modal con los datos de un alimentador
    * @param {Object} alimentador - Datos del alimentador
    * @param {Object} registros - Registros en vivo { rele: [...] }
    * @param {string|number} timestamp - Timestamp de la lectura
    */
   const abrirModal = useCallback((alimentador, registros, timestamp) => {
      setAlimentadorSeleccionado(alimentador);
      setRegistrosSeleccionados(registros);
      setTimestampLectura(timestamp);
      setModalAbierto(true);
      setFuncionalidadesPorRegistrador({});
      setEtiquetasBitsPorRegistrador({});
      setTabActivo(null);
   }, []);

   /**
    * Cierra el modal
    */
   const cerrarModal = useCallback(() => {
      setModalAbierto(false);
      setAlimentadorSeleccionado(null);
      setRegistrosSeleccionados(null);
      setTimestampLectura(null);
      setFuncionalidadesPorRegistrador({});
      setEtiquetasBitsPorRegistrador({});
      setTabActivo(null);
   }, []);

   /**
    * Obtiene los IDs únicos de registradores del alimentador
    * Busca en config_tarjeta (nueva estructura) y en card_design (estructura antigua) como fallback
    */
   const registradoresIds = useMemo(() => {
      if (!alimentadorSeleccionado) return [];

      const ids = new Set();

      // Buscar en config_tarjeta (nueva estructura)
      const configTarjeta = alimentadorSeleccionado.config_tarjeta;
      if (configTarjeta) {
         if (configTarjeta.superior?.registrador_id) {
            ids.add(configTarjeta.superior.registrador_id);
         }
         if (configTarjeta.inferior?.registrador_id) {
            ids.add(configTarjeta.inferior.registrador_id);
         }
      }

      // Buscar en card_design (estructura antigua) como fallback
      const cardDesign = alimentadorSeleccionado.card_design;
      if (cardDesign) {
         if (cardDesign.superior?.registrador_id) {
            ids.add(cardDesign.superior.registrador_id);
         }
         if (cardDesign.inferior?.registrador_id) {
            ids.add(cardDesign.inferior.registrador_id);
         }
      }

      // Último fallback: registrador_id en raíz (formato muy antiguo)
      if (alimentadorSeleccionado.registrador_id) {
         ids.add(alimentadorSeleccionado.registrador_id);
      }

      return Array.from(ids);
   }, [alimentadorSeleccionado]);

   /**
    * Cargar funcionalidades de cada registrador cuando se abre el modal
    */
   useEffect(() => {
      if (!modalAbierto || registradoresIds.length === 0) return;

      const cargarFuncionalidades = async () => {
         setCargandoFuncionalidades(true);
         const funcsPorReg = {};
         const etiquetasPorReg = {};

         for (const regId of registradoresIds) {
            try {
               const resultado = await obtenerFuncionalidadesRegistrador(regId);
               funcsPorReg[regId] = resultado;
               // Guardar etiquetas de bits si existen
               if (resultado.etiquetasBits) {
                  etiquetasPorReg[regId] = resultado.etiquetasBits;
               }
            } catch (error) {
               console.error(`Error cargando funcionalidades del registrador ${regId}:`, error);
               funcsPorReg[regId] = { error: true, mensaje: error.message };
            }
         }

         setFuncionalidadesPorRegistrador(funcsPorReg);
         setEtiquetasBitsPorRegistrador(etiquetasPorReg);

         // Establecer el primer tab activo
         if (registradoresIds.length > 0) {
            setTabActivo(registradoresIds[0]);
         }

         setCargandoFuncionalidades(false);
      };

      cargarFuncionalidades();
   }, [modalAbierto, registradoresIds]);

   /**
    * Procesa las funcionalidades activas para mostrar en el modal
    * Obtiene TODAS las funcionalidades habilitadas del registrador, no solo las de la tarjeta
    */
   const funcionalidadesProcesadas = useMemo(() => {
      if (!alimentadorSeleccionado || !registrosSeleccionados || cargandoFuncionalidades) {
         return { mediciones: [], estados: [], tabs: [] };
      }

      const registrosRele = registrosSeleccionados?.rele || [];
      const tabs = [];

      // Procesar cada registrador
      for (const regId of registradoresIds) {
         const datosRegistrador = funcionalidadesPorRegistrador[regId];
         if (!datosRegistrador || datosRegistrador.error) continue;

         const { registrador, funcionalidades } = datosRegistrador;
         const nombreRegistrador = registrador?.nombre || "Registrador";

         const funcionalidadesPorCategoria = {
            mediciones: [],
            estados: [],
         };

         // Procesar cada funcionalidad habilitada
         // El backend devuelve funcionalidades como ARRAY, no como objeto
         if (Array.isArray(funcionalidades)) {
            funcionalidades.forEach((func) => {
               const registrosFunc = func.registros || [];

               // Obtener valores de los registros en vivo
               const registrosConValor = registrosFunc.map((regConfig) => {
                  const direccion = Number(regConfig.registro ?? regConfig.valor);

                  // Buscar valor en registros en vivo
                  const regEncontrado = registrosRele.find(
                     (r) => r.address === direccion
                  );

                  return {
                     etiqueta: regConfig.etiqueta,
                     registro: direccion,
                     valor: regEncontrado?.value ?? null,
                     transformadorId: regConfig.transformadorId || null,
                  };
               });

               // Determinar categoría
               const categoria = determinarCategoria(func.nombre);

               // Procesar registros (combinar pares High/Low si existen)
               const registrosProcesados = procesarRegistrosConPares(registrosConValor);

               const funcionalidad = {
                  id: func.id,
                  nombre: func.nombre,
                  registros: registrosProcesados,
                  registradorId: regId,
               };

               if (categoria === "estados") {
                  funcionalidadesPorCategoria.estados.push(funcionalidad);
               } else {
                  funcionalidadesPorCategoria.mediciones.push(funcionalidad);
               }
            });
         }

         tabs.push({
            id: regId,
            nombre: nombreRegistrador,
            mediciones: funcionalidadesPorCategoria.mediciones,
            estados: funcionalidadesPorCategoria.estados,
         });
      }

      // Si solo hay un registrador, devolver directamente sus funcionalidades
      if (tabs.length === 1) {
         return {
            mediciones: tabs[0].mediciones,
            estados: tabs[0].estados,
            tabs: [],
         };
      }

      // Si hay múltiples registradores, devolver tabs
      return {
         mediciones: [],
         estados: [],
         tabs,
      };
   }, [alimentadorSeleccionado, registrosSeleccionados, funcionalidadesPorRegistrador, registradoresIds, cargandoFuncionalidades]);

   /**
    * Obtiene las funcionalidades del tab activo
    */
   const funcionalidadesTabActivo = useMemo(() => {
      if (funcionalidadesProcesadas.tabs.length === 0) {
         return {
            mediciones: funcionalidadesProcesadas.mediciones,
            estados: funcionalidadesProcesadas.estados,
         };
      }

      const tab = funcionalidadesProcesadas.tabs.find(t => t.id === tabActivo);
      if (!tab) {
         return { mediciones: [], estados: [] };
      }

      return {
         mediciones: tab.mediciones,
         estados: tab.estados,
      };
   }, [funcionalidadesProcesadas, tabActivo]);

   /**
    * Obtiene las etiquetas de bits del tab activo (o del único registrador válido)
    */
   const etiquetasBitsTabActivo = useMemo(() => {
      // Si hay tabs múltiples, usar el tab activo
      if (funcionalidadesProcesadas.tabs.length > 0 && tabActivo) {
         return etiquetasBitsPorRegistrador[tabActivo] || null;
      }

      // Obtener IDs de registradores que tienen datos válidos (no errores)
      const registradoresValidos = Object.keys(etiquetasBitsPorRegistrador);

      // Si solo hay un registrador válido con etiquetas, usar sus etiquetas
      if (registradoresValidos.length === 1) {
         return etiquetasBitsPorRegistrador[registradoresValidos[0]] || null;
      }

      // Si hay múltiples registradores válidos pero no hay tabs (se combinaron),
      // usar el primero que tenga etiquetas
      if (registradoresValidos.length > 0) {
         return etiquetasBitsPorRegistrador[registradoresValidos[0]] || null;
      }

      return null;
   }, [funcionalidadesProcesadas.tabs, tabActivo, etiquetasBitsPorRegistrador]);

   /**
    * Interpreta los bits de un registro de estado/LEDs
    */
   const interpretarEstado = useCallback((registro, valor, etiquetasPersonalizadas = null) => {
      return interpretarRegistro(registro, valor, etiquetasPersonalizadas);
   }, []);

   /**
    * Formatea el timestamp de la lectura
    */
   const timestampFormateado = useMemo(() => {
      if (!timestampLectura) return null;

      try {
         const fecha = new Date(timestampLectura);
         return fecha.toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
         });
      } catch {
         return null;
      }
   }, [timestampLectura]);

   /**
    * Exporta los datos a CSV
    */
   const exportarCSV = useCallback(() => {
      if (!alimentadorSeleccionado) return;

      const lineas = [
         `# Lectura completa - ${alimentadorSeleccionado.nombre}`,
         `# Fecha: ${timestampFormateado || "N/A"}`,
         "",
         "Funcionalidad,Medición,Valor,Registro(s),Transformador",
      ];

      // Función auxiliar para exportar funcionalidades
      const exportarFuncionalidades = (funcs, nombreTab = null) => {
         funcs.forEach((func) => {
            func.registros.forEach((reg) => {
               const registros = reg.esParCombinado
                  ? `${reg.registroHigh}/${reg.registroLow}`
                  : reg.registro;
               const transformador = reg.transformadorId || "-";
               const prefijo = nombreTab ? `[${nombreTab}] ` : "";
               lineas.push(`"${prefijo}${func.nombre}","${reg.etiqueta}",${reg.valor ?? "N/A"},${registros},${transformador}`);
            });
         });
      };

      // Exportar según estructura (tabs o directa)
      if (funcionalidadesProcesadas.tabs.length > 0) {
         funcionalidadesProcesadas.tabs.forEach((tab) => {
            exportarFuncionalidades(tab.mediciones, tab.nombre);
            exportarFuncionalidades(tab.estados, tab.nombre);
         });
      } else {
         exportarFuncionalidades(funcionalidadesProcesadas.mediciones);
         exportarFuncionalidades(funcionalidadesProcesadas.estados);
      }

      const contenido = lineas.join("\n");
      const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lectura_${alimentadorSeleccionado.nombre.replace(/\s+/g, "_")}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
   }, [alimentadorSeleccionado, funcionalidadesProcesadas, timestampFormateado]);

   return {
      // Estado
      modalAbierto,
      alimentadorSeleccionado,
      timestampFormateado,
      funcionalidadesProcesadas,
      funcionalidadesTabActivo,
      cargandoFuncionalidades,

      // Tabs
      tabs: funcionalidadesProcesadas.tabs,
      tabActivo,
      setTabActivo,

      // Etiquetas de bits (LEDs programables)
      etiquetasBitsTabActivo,

      // Funciones
      abrirModal,
      cerrarModal,
      interpretarEstado,
      exportarCSV,
   };
}
