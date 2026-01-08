// hooks/useConsolaTest.js
// Hook para manejar la consola de test Modbus

import { useState, useRef, useCallback } from "react";
import { solicitarTestRegistrador, consultarTestRegistrador } from "../../../servicios/apiService";

/**
 * Hook para manejar la consola de test Modbus
 * @param {Object} params - Parámetros del hook
 * @param {Object} params.config - Configuración actual del relé
 * @param {string} params.agenteId - ID del agente para ejecutar tests
 * @returns {Object} Estado y funciones de la consola
 */
export function useConsolaTest({ config, agenteId }) {
   const consolaRef = useRef(null);
   const containerRef = useRef(null);
   const resizerRef = useRef(null);

   const [consolaLogs, setConsolaLogs] = useState([]);
   const [ejecutandoTest, setEjecutandoTest] = useState(false);
   const [registrosCrudos, setRegistrosCrudos] = useState(null);
   const [consolaWidth, setConsolaWidth] = useState(60);

   /**
    * Agregar log a la consola
    */
   const agregarLog = useCallback((mensaje, tipo = "info") => {
      const timestamp = new Date().toLocaleTimeString();
      setConsolaLogs((prev) => [...prev, { timestamp, mensaje, tipo }]);
      setTimeout(() => {
         if (consolaRef.current) {
            consolaRef.current.scrollTop = consolaRef.current.scrollHeight;
         }
      }, 50);
   }, []);

   /**
    * Limpiar consola
    */
   const limpiarConsola = useCallback(() => {
      setConsolaLogs([]);
      setRegistrosCrudos(null);
   }, []);

   /**
    * Manejadores del resizer
    */
   const handleMouseDown = useCallback((e) => {
      e.preventDefault();

      const handleMouseMove = (e) => {
         if (!containerRef.current) return;
         const container = containerRef.current;
         const containerRect = container.getBoundingClientRect();
         const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
         const clampedWidth = Math.min(80, Math.max(30, newWidth));
         setConsolaWidth(clampedWidth);
      };

      const handleMouseUp = () => {
         document.removeEventListener("mousemove", handleMouseMove);
         document.removeEventListener("mouseup", handleMouseUp);
         document.body.style.cursor = "";
         document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
   }, []);

   /**
    * Ejecutar test Modbus real usando el agente
    */
   const ejecutarTest = useCallback(async () => {
      if (!config.conexion.ip) {
         agregarLog("Error: Debes ingresar una IP", "error");
         return;
      }

      if (!agenteId) {
         agregarLog("Error: No hay agente configurado para ejecutar el test", "error");
         agregarLog("El test requiere un agente conectado para comunicarse con el relé", "info");
         return;
      }

      setEjecutandoTest(true);
      setRegistrosCrudos(null);
      limpiarConsola();

      const indiceInicial = config.registroInicial || 0;
      const cantidad = config.cantidadRegistros || 20;

      agregarLog(`Iniciando test de conexión...`, "info");
      agregarLog(`IP: ${config.conexion.ip}:${config.conexion.puerto} (Unit ID: ${config.conexion.unitId})`, "info");
      agregarLog(`Registros: ${indiceInicial} - ${indiceInicial + cantidad - 1} (${cantidad} registros)`, "info");
      agregarLog(`Agente: ${agenteId}`, "info");

      try {
         agregarLog("Enviando solicitud al agente...", "info");

         const respuesta = await solicitarTestRegistrador(agenteId, {
            ip: config.conexion.ip,
            puerto: parseInt(config.conexion.puerto) || 502,
            unitId: parseInt(config.conexion.unitId) || 1,
            indiceInicial,
            cantidadRegistros: cantidad,
         });

         const testId = respuesta.testId;
         agregarLog(`Solicitud enviada (ID: ${testId})`, "success");
         agregarLog("Esperando respuesta del agente...", "info");

         const maxIntentos = 15;
         const intervaloMs = 2000;
         let intentos = 0;

         while (intentos < maxIntentos) {
            await new Promise((resolve) => setTimeout(resolve, intervaloMs));
            intentos++;

            const resultado = await consultarTestRegistrador(agenteId, testId);

            if (resultado.estado === "completado") {
               const registros = resultado.valores || [];
               const tiempoMs = resultado.tiempo_respuesta_ms || 0;

               agregarLog(`Conexión exitosa (${tiempoMs}ms)`, "success");
               agregarLog(`Registros leídos: ${registros.length}`, "success");

               for (let i = 0; i < registros.length; i++) {
                  const regNum = indiceInicial + i;
                  const valor = registros[i];
                  agregarLog(`  [${regNum}] = ${valor}`, "data");
               }

               setRegistrosCrudos({
                  valores: registros,
                  indiceInicial,
                  ip: config.conexion.ip,
                  puerto: config.conexion.puerto,
                  tiempoMs,
               });

               agregarLog("Test completado exitosamente", "success");
               return;

            } else if (resultado.estado === "error" || resultado.estado === "timeout") {
               agregarLog(`Error: ${resultado.error_mensaje || "Error de conexión"}`, "error");
               if (resultado.tiempo_respuesta_ms) {
                  agregarLog(`Tiempo transcurrido: ${resultado.tiempo_respuesta_ms}ms`, "info");
               }
               return;
            }

            agregarLog(`Esperando... (${intentos}/${maxIntentos})`, "info");
         }

         agregarLog("Timeout: El agente no respondió a tiempo", "error");
         agregarLog("Verifica que el agente esté conectado y el dispositivo sea accesible", "info");

      } catch (error) {
         agregarLog(`Error: ${error.message}`, "error");

         if (error.message?.includes("esperar")) {
            agregarLog("Debes esperar antes de ejecutar otro test", "info");
         } else if (error.message?.includes("agente")) {
            agregarLog("Verifica que el agente esté conectado", "info");
         }
      } finally {
         setEjecutandoTest(false);
      }
   }, [config, agenteId, agregarLog, limpiarConsola]);

   /**
    * Exportar registros a CSV
    */
   const exportarCSV = useCallback(() => {
      if (!registrosCrudos || !registrosCrudos.valores || registrosCrudos.valores.length === 0) {
         agregarLog("No hay registros para exportar. Ejecuta un test primero.", "error");
         return;
      }

      const { valores, indiceInicial, ip, puerto, tiempoMs } = registrosCrudos;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

      const cabecera = "Registro,Valor";
      const filas = valores.map((valor, idx) => {
         const registro = indiceInicial + idx;
         return `${registro},${valor}`;
      });

      const metadatos = [
         `# Test Modbus - RelayWatch`,
         `# Fecha: ${new Date().toLocaleString()}`,
         `# Dispositivo: ${ip}:${puerto}`,
         `# Registros: ${indiceInicial} - ${indiceInicial + valores.length - 1}`,
         `# Tiempo de respuesta: ${tiempoMs}ms`,
         `# Total registros: ${valores.length}`,
         "",
      ];

      const contenidoCSV = [...metadatos, cabecera, ...filas].join("\n");

      const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `registros_${ip}_${puerto}_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      agregarLog(`CSV exportado: registros_${ip}_${puerto}_${timestamp}.csv`, "success");
   }, [registrosCrudos, agregarLog]);

   return {
      // Refs
      consolaRef,
      containerRef,
      resizerRef,

      // Estado
      consolaLogs,
      ejecutandoTest,
      registrosCrudos,
      consolaWidth,

      // Funciones
      agregarLog,
      limpiarConsola,
      handleMouseDown,
      ejecutarTest,
      exportarCSV,
   };
}
