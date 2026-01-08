// hooks/usePollingLecturas.js
// Hook para manejar el polling de lecturas de registradores

import { useState, useRef, useCallback } from "react";
import { obtenerUltimasLecturasPorRegistrador } from "../../../../servicios/apiService";

/**
 * Hook para manejar el polling de lecturas de registradores Modbus
 * @param {Object} params - Parámetros del hook
 * @returns {Object} Estado y funciones de polling
 */
export function usePollingLecturas({
   actualizarRegistros,
   guardarLecturaLocal,
   buscarAlimentador
}) {
   const [alimentadoresPolling, setAlimentadoresPolling] = useState({});
   const [lecturasPolling, setLecturasPolling] = useState({});
   const [contadoresPolling, setContadoresPolling] = useState({});
   const [contadoresErrorLectura, setContadoresErrorLectura] = useState({});
   const [contadoresErrorRed, setContadoresErrorRed] = useState({});
   const [hayProblemaConexion, setHayProblemaConexion] = useState(false);

   const pollingIntervalsRef = useRef({});
   const contadorIntervalsRef = useRef({});

   /**
    * Verifica si un alimentador está haciendo polling
    */
   const estaPolling = useCallback((alimId) => !!alimentadoresPolling[alimId], [alimentadoresPolling]);

   /**
    * Obtiene el contador de lecturas de polling
    */
   const obtenerContadorPolling = useCallback((alimId) => contadoresPolling[alimId] || 0, [contadoresPolling]);

   /**
    * Obtiene el estado de error de lectura por zona
    */
   const obtenerErrorPolling = useCallback((alimId) => {
      const contadorSuperior = contadoresErrorLectura[`${alimId}_superior`] || 0;
      const contadorInferior = contadoresErrorLectura[`${alimId}_inferior`] || 0;

      if (contadorSuperior === 0 && contadorInferior === 0) return null;

      return {
         superior: contadorSuperior >= 1,
         inferior: contadorInferior >= 1,
         superiorCritico: contadorSuperior >= 3,
         inferiorCritico: contadorInferior >= 3,
      };
   }, [contadoresErrorLectura]);

   /**
    * Obtiene lecturas de un registrador
    */
   const fetchLecturasRegistrador = useCallback(async (alimId, registradorId, zona = null) => {
      const claveError = zona ? `${alimId}_${zona}` : `${alimId}_superior`;

      try {
         const lecturas = await obtenerUltimasLecturasPorRegistrador(registradorId, 1);

         // Resetear errores de red si el fetch fue exitoso
         setContadoresErrorRed((prev) => {
            if (prev[claveError]) {
               const nuevo = { ...prev };
               delete nuevo[claveError];
               if (Object.keys(nuevo).length === 0) {
                  setHayProblemaConexion(false);
               }
               return nuevo;
            }
            return prev;
         });

         if (!lecturas || lecturas.length === 0) return;

         const lectura = lecturas[0];
         const clavePolling = zona ? `${alimId}_${zona}` : alimId;

         setLecturasPolling((prev) => ({
            ...prev,
            [clavePolling]: lectura,
         }));

         const tieneErrorLectura = lectura.exito === false;

         if (tieneErrorLectura) {
            setContadoresErrorLectura((prev) => ({
               ...prev,
               [claveError]: (prev[claveError] || 0) + 1,
            }));
            return;
         }

         // Resetear errores si la lectura es exitosa
         setContadoresErrorLectura((prev) => {
            if (prev[claveError]) {
               const nuevo = { ...prev };
               delete nuevo[claveError];
               return nuevo;
            }
            return prev;
         });

         // Transformar y actualizar registros
         if (lectura.valores && Array.isArray(lectura.valores)) {
            const indiceInicial = lectura.indice_inicial ?? 0;

            const registrosTransformados = lectura.valores.map((valor, idx) => ({
               index: idx,
               address: indiceInicial + idx,
               value: valor,
            }));

            actualizarRegistros(alimId, (prevRegistros) => {
               const registrosAnteriores = prevRegistros?.rele || [];
               const rangoNuevo = new Set(registrosTransformados.map(r => r.address));
               const registrosFiltrados = registrosAnteriores.filter(r => !rangoNuevo.has(r.address));
               return {
                  rele: [...registrosFiltrados, ...registrosTransformados]
               };
            });

            guardarLecturaLocal(alimId, registradorId, zona, {
               timestamp: lectura.timestamp ? new Date(lectura.timestamp).getTime() : Date.now(),
               valores: lectura.valores,
               indiceInicial: indiceInicial,
               exito: true,
            });
         }
      } catch (error) {
         console.error(`[Polling] Error de red para alimentador ${alimId}:`, error);
         setContadoresErrorRed((prev) => ({
            ...prev,
            [claveError]: (prev[claveError] || 0) + 1,
         }));
         setHayProblemaConexion(true);
      }
   }, [actualizarRegistros, guardarLecturaLocal]);

   /**
    * Extrae los registrador_id del card_design de un alimentador
    */
   const obtenerRegistradoresDeAlim = useCallback((alim) => {
      const registradores = [];
      const card_design = alim.card_design;

      const regSuperior = card_design?.superior?.registrador_id;
      const regInferior = card_design?.inferior?.registrador_id;

      if (regSuperior && regInferior) {
         if (regSuperior === regInferior) {
            registradores.push({ zona: "superior", zonas: ["superior", "inferior"], id: regSuperior });
         } else {
            registradores.push({ zona: "superior", id: regSuperior });
            registradores.push({ zona: "inferior", id: regInferior });
         }
      } else if (regSuperior) {
         registradores.push({ zona: "superior", zonas: ["superior", "inferior"], id: regSuperior });
      } else if (regInferior) {
         registradores.push({ zona: "inferior", zonas: ["superior", "inferior"], id: regInferior });
      }

      if (registradores.length === 0 && alim.registrador_id) {
         registradores.push({ zona: "legacy", zonas: ["superior", "inferior"], id: alim.registrador_id });
      }

      return registradores;
   }, []);

   /**
    * Inicia el polling para un alimentador
    */
   const iniciarPolling = useCallback((alim) => {
      const registradores = obtenerRegistradoresDeAlim(alim);

      if (registradores.length === 0) {
         console.warn(`[Polling] Alimentador ${alim.id} sin registradores`);
         return;
      }

      if (!alim.intervalo_consulta_ms) {
         console.warn(`[Polling] Alimentador ${alim.id} sin intervalo`);
         return;
      }

      // Limpiar intervalos existentes
      if (pollingIntervalsRef.current[alim.id]) {
         const intervalos = pollingIntervalsRef.current[alim.id];
         if (Array.isArray(intervalos)) {
            intervalos.forEach(clearInterval);
         } else {
            clearInterval(intervalos);
         }
      }
      if (contadorIntervalsRef.current[alim.id]) {
         clearInterval(contadorIntervalsRef.current[alim.id]);
      }

      const intervalos = [];

      registradores.forEach(({ zona, zonas, id: registradorId }) => {
         const zonasACubrir = zonas || [zona];

         zonasACubrir.forEach((z) => {
            fetchLecturasRegistrador(alim.id, registradorId, z);
         });

         const intervalId = setInterval(() => {
            zonasACubrir.forEach((z) => {
               fetchLecturasRegistrador(alim.id, registradorId, z);
            });
         }, alim.intervalo_consulta_ms);

         intervalos.push(intervalId);
      });

      pollingIntervalsRef.current[alim.id] = intervalos.length === 1 ? intervalos[0] : intervalos;

      setContadoresPolling((prev) => ({
         ...prev,
         [alim.id]: (prev[alim.id] || 0) + 1,
      }));

      const contadorIntervalId = setInterval(() => {
         setContadoresPolling((prev) => ({
            ...prev,
            [alim.id]: (prev[alim.id] || 0) + 1,
         }));
      }, alim.intervalo_consulta_ms);

      contadorIntervalsRef.current[alim.id] = contadorIntervalId;
   }, [fetchLecturasRegistrador, obtenerRegistradoresDeAlim]);

   /**
    * Detiene el polling para un alimentador
    */
   const detenerPolling = useCallback((alimId) => {
      if (pollingIntervalsRef.current[alimId]) {
         const intervalos = pollingIntervalsRef.current[alimId];
         if (Array.isArray(intervalos)) {
            intervalos.forEach(clearInterval);
         } else {
            clearInterval(intervalos);
         }
         delete pollingIntervalsRef.current[alimId];
      }

      if (contadorIntervalsRef.current[alimId]) {
         clearInterval(contadorIntervalsRef.current[alimId]);
         delete contadorIntervalsRef.current[alimId];
      }

      setLecturasPolling((prev) => {
         const nuevo = { ...prev };
         delete nuevo[alimId];
         delete nuevo[`${alimId}_superior`];
         delete nuevo[`${alimId}_inferior`];
         delete nuevo[`${alimId}_legacy`];
         return nuevo;
      });

      setContadoresPolling((prev) => {
         const nuevo = { ...prev };
         delete nuevo[alimId];
         return nuevo;
      });

      setContadoresErrorLectura((prev) => {
         const claveSup = `${alimId}_superior`;
         const claveInf = `${alimId}_inferior`;
         if (prev[claveSup] || prev[claveInf]) {
            const nuevo = { ...prev };
            delete nuevo[claveSup];
            delete nuevo[claveInf];
            return nuevo;
         }
         return prev;
      });

      setContadoresErrorRed((prev) => {
         const claveSup = `${alimId}_superior`;
         const claveInf = `${alimId}_inferior`;
         if (prev[claveSup] || prev[claveInf]) {
            const nuevo = { ...prev };
            delete nuevo[claveSup];
            delete nuevo[claveInf];
            if (Object.keys(nuevo).length === 0) {
               setHayProblemaConexion(false);
            }
            return nuevo;
         }
         return prev;
      });
   }, []);

   /**
    * Alterna el polling de un alimentador (play/stop)
    */
   const handlePlayStopClick = useCallback((alimId) => {
      const alimentador = buscarAlimentador(alimId);
      if (!alimentador) return;

      const estaActivo = alimentadoresPolling[alimId];

      if (estaActivo) {
         detenerPolling(alimId);
      } else {
         iniciarPolling(alimentador);
      }

      setAlimentadoresPolling((prev) => ({
         ...prev,
         [alimId]: !prev[alimId],
      }));
   }, [alimentadoresPolling, buscarAlimentador, detenerPolling, iniciarPolling]);

   /**
    * Limpia todos los intervalos
    */
   const limpiarTodosIntervalos = useCallback(() => {
      Object.values(pollingIntervalsRef.current).forEach((intervalos) => {
         if (Array.isArray(intervalos)) {
            intervalos.forEach(clearInterval);
         } else {
            clearInterval(intervalos);
         }
      });
      Object.values(contadorIntervalsRef.current).forEach(clearInterval);
   }, []);

   return {
      estaPolling,
      obtenerContadorPolling,
      obtenerErrorPolling,
      handlePlayStopClick,
      limpiarTodosIntervalos,
      hayProblemaConexion,
      lecturasPolling,
   };
}
