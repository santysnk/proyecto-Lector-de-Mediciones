// hooks/mediciones/usePollingLecturas.js
// Hook para manejar el polling de lecturas de registradores

import { useState, useRef, useCallback } from "react";
import { obtenerUltimasLecturasPorRegistrador } from "../../../../servicios/apiService";
import { obtenerRegistradoresDeAlim, transformarLecturaARegistros } from "./pollingLecturasUtils";

export function usePollingLecturas({ actualizarRegistros, guardarLecturaLocal, buscarAlimentador }) {
   const [alimentadoresPolling, setAlimentadoresPolling] = useState({});
   const [lecturasPolling, setLecturasPolling] = useState({});
   const [contadoresPolling, setContadoresPolling] = useState({});
   const [contadoresErrorLectura, setContadoresErrorLectura] = useState({});
   // eslint-disable-next-line no-unused-vars
   const [contadoresErrorRed, setContadoresErrorRed] = useState({});
   const [hayProblemaConexion, setHayProblemaConexion] = useState(false);

   const pollingIntervalsRef = useRef({});
   const contadorIntervalsRef = useRef({});

   const estaPolling = useCallback((alimId) => !!alimentadoresPolling[alimId], [alimentadoresPolling]);
   const obtenerContadorPolling = useCallback((alimId) => contadoresPolling[alimId] || 0, [contadoresPolling]);

   const obtenerErrorPolling = useCallback((alimId) => {
      const contadorSuperior = contadoresErrorLectura[`${alimId}_superior`] || 0;
      const contadorInferior = contadoresErrorLectura[`${alimId}_inferior`] || 0;
      if (contadorSuperior === 0 && contadorInferior === 0) return null;
      return {
         superior: contadorSuperior >= 1, inferior: contadorInferior >= 1,
         superiorCritico: contadorSuperior >= 3, inferiorCritico: contadorInferior >= 3,
      };
   }, [contadoresErrorLectura]);

   const fetchLecturasRegistrador = useCallback(async (alimId, registradorId, zona = null) => {
      const claveError = zona ? `${alimId}_${zona}` : `${alimId}_superior`;
      try {
         const lecturas = await obtenerUltimasLecturasPorRegistrador(registradorId, 1);

         setContadoresErrorRed((prev) => {
            if (!prev[claveError]) return prev;
            const nuevo = { ...prev };
            delete nuevo[claveError];
            if (Object.keys(nuevo).length === 0) setHayProblemaConexion(false);
            return nuevo;
         });

         if (!lecturas || lecturas.length === 0) return;
         const lectura = lecturas[0];
         const clavePolling = zona ? `${alimId}_${zona}` : alimId;
         setLecturasPolling((prev) => ({ ...prev, [clavePolling]: lectura }));

         if (lectura.exito === false) {
            setContadoresErrorLectura((prev) => ({ ...prev, [claveError]: (prev[claveError] || 0) + 1 }));
            return;
         }

         setContadoresErrorLectura((prev) => {
            if (!prev[claveError]) return prev;
            const nuevo = { ...prev };
            delete nuevo[claveError];
            return nuevo;
         });

         const registrosTransformados = transformarLecturaARegistros(lectura, registradorId);
         const timestampLectura = lectura.timestamp ? new Date(lectura.timestamp).getTime() : null;
         if (registrosTransformados) {
            actualizarRegistros(alimId, (prevRegistros) => {
               const registrosAnteriores = prevRegistros?.rele || [];
               const registrosFiltrados = registrosAnteriores.filter(r => r.registradorId !== registradorId);
               return { rele: [...registrosFiltrados, ...registrosTransformados], timestamp: timestampLectura };
            });
            guardarLecturaLocal(alimId, registradorId, zona, {
               timestamp: timestampLectura,
               valores: lectura.valores,
               indiceInicial: lectura.indice_inicial ?? 0,
               exito: true,
            });
         }
      } catch (error) {
         console.error(`[Polling] Error de red para alimentador ${alimId}:`, error);
         setContadoresErrorRed((prev) => ({ ...prev, [claveError]: (prev[claveError] || 0) + 1 }));
         setHayProblemaConexion(true);
      }
   }, [actualizarRegistros, guardarLecturaLocal]);

   const iniciarPolling = useCallback((alim) => {
      const registradores = obtenerRegistradoresDeAlim(alim);
      if (registradores.length === 0 || !alim.intervalo_consulta_ms) return;

      if (pollingIntervalsRef.current[alim.id]) {
         const intervalos = pollingIntervalsRef.current[alim.id];
         (Array.isArray(intervalos) ? intervalos : [intervalos]).forEach(clearInterval);
      }
      if (contadorIntervalsRef.current[alim.id]) clearInterval(contadorIntervalsRef.current[alim.id]);

      const intervalos = [];
      registradores.forEach(({ zona, zonas, id: registradorId }) => {
         const zonasACubrir = zonas || [zona];
         zonasACubrir.forEach((z) => fetchLecturasRegistrador(alim.id, registradorId, z));
         intervalos.push(setInterval(() => {
            zonasACubrir.forEach((z) => fetchLecturasRegistrador(alim.id, registradorId, z));
         }, alim.intervalo_consulta_ms));
      });

      pollingIntervalsRef.current[alim.id] = intervalos.length === 1 ? intervalos[0] : intervalos;
      setContadoresPolling((prev) => ({ ...prev, [alim.id]: (prev[alim.id] || 0) + 1 }));
      contadorIntervalsRef.current[alim.id] = setInterval(() => {
         setContadoresPolling((prev) => ({ ...prev, [alim.id]: (prev[alim.id] || 0) + 1 }));
      }, alim.intervalo_consulta_ms);
   }, [fetchLecturasRegistrador]);

   const detenerPolling = useCallback((alimId) => {
      if (pollingIntervalsRef.current[alimId]) {
         const intervalos = pollingIntervalsRef.current[alimId];
         (Array.isArray(intervalos) ? intervalos : [intervalos]).forEach(clearInterval);
         delete pollingIntervalsRef.current[alimId];
      }
      if (contadorIntervalsRef.current[alimId]) {
         clearInterval(contadorIntervalsRef.current[alimId]);
         delete contadorIntervalsRef.current[alimId];
      }
      setLecturasPolling((prev) => {
         const nuevo = { ...prev };
         delete nuevo[alimId]; delete nuevo[`${alimId}_superior`]; delete nuevo[`${alimId}_inferior`]; delete nuevo[`${alimId}_legacy`];
         return nuevo;
      });
      setContadoresPolling((prev) => { const nuevo = { ...prev }; delete nuevo[alimId]; return nuevo; });
      setContadoresErrorLectura((prev) => {
         if (!prev[`${alimId}_superior`] && !prev[`${alimId}_inferior`]) return prev;
         const nuevo = { ...prev }; delete nuevo[`${alimId}_superior`]; delete nuevo[`${alimId}_inferior`]; return nuevo;
      });
      setContadoresErrorRed((prev) => {
         if (!prev[`${alimId}_superior`] && !prev[`${alimId}_inferior`]) return prev;
         const nuevo = { ...prev }; delete nuevo[`${alimId}_superior`]; delete nuevo[`${alimId}_inferior`];
         if (Object.keys(nuevo).length === 0) setHayProblemaConexion(false);
         return nuevo;
      });
   }, []);

   const handlePlayStopClick = useCallback((alimId) => {
      const alimentador = buscarAlimentador(alimId);
      if (!alimentador) return;
      if (alimentadoresPolling[alimId]) { detenerPolling(alimId); } else { iniciarPolling(alimentador); }
      setAlimentadoresPolling((prev) => ({ ...prev, [alimId]: !prev[alimId] }));
   }, [alimentadoresPolling, buscarAlimentador, detenerPolling, iniciarPolling]);

   const limpiarTodosIntervalos = useCallback(() => {
      Object.values(pollingIntervalsRef.current).forEach((intervalos) => {
         (Array.isArray(intervalos) ? intervalos : [intervalos]).forEach(clearInterval);
      });
      Object.values(contadorIntervalsRef.current).forEach(clearInterval);
   }, []);

   return {
      estaPolling, obtenerContadorPolling, obtenerErrorPolling,
      handlePlayStopClick, limpiarTodosIntervalos, hayProblemaConexion, lecturasPolling,
   };
}
