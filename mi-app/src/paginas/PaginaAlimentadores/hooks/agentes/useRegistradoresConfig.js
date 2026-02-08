// hooks/agentes/useRegistradoresConfig.js
// Hook para manejar CRUD de registradores de agentes

import { useState, useCallback } from "react";
import {
   listarRegistradoresAgente,
   crearRegistradorAgente,
   actualizarRegistradorAgente,
   eliminarRegistradorAgente,
   toggleRegistradorAgente,
   solicitarTestRegistrador,
   consultarTestRegistrador,
} from "../../../../servicios/apiService";
import {
   REGISTRADOR_INICIAL, prepararDatosRegistrador,
   mapearRegistradorAFormulario, construirDatosTest,
} from "./registradoresConfigUtils";

export function useRegistradoresConfig() {
   const [registradoresAgente, setRegistradoresAgente] = useState({});
   const [mostrarFormRegistrador, setMostrarFormRegistrador] = useState(null);
   const [registradorEditando, setRegistradorEditando] = useState(null);
   const [nuevoRegistrador, setNuevoRegistrador] = useState(REGISTRADOR_INICIAL);
   const [guardandoRegistrador, setGuardandoRegistrador] = useState(false);
   const [registradorProcesando, setRegistradorProcesando] = useState(null);
   const [testEnCurso, setTestEnCurso] = useState(null);
   const [resultadoTest, setResultadoTest] = useState(null);

   const resetFormRegistrador = useCallback(() => {
      setNuevoRegistrador(REGISTRADOR_INICIAL);
      setRegistradorEditando(null);
   }, []);

   const cargarRegistradores = useCallback(async (agenteId) => {
      try {
         const regs = await listarRegistradoresAgente(agenteId);
         setRegistradoresAgente(prev => ({ ...prev, [agenteId]: regs }));
         return regs;
      } catch (err) {
         console.error('Error cargando registradores:', err);
         throw err;
      }
   }, []);

   const recargarRegistradores = useCallback(async (agenteId) => {
      return cargarRegistradores(agenteId);
   }, [cargarRegistradores]);

   const guardarRegistrador = useCallback(async (agenteId, formData, registradorId = null) => {
      const datos = prepararDatosRegistrador(formData);
      setGuardandoRegistrador(true);
      try {
         if (registradorId) {
            await actualizarRegistradorAgente(agenteId, registradorId, datos);
         } else {
            await crearRegistradorAgente(agenteId, datos);
         }
         await recargarRegistradores(agenteId);
         setMostrarFormRegistrador(null);
         resetFormRegistrador();
      } finally {
         setGuardandoRegistrador(false);
      }
   }, [recargarRegistradores, resetFormRegistrador]);

   const editarRegistrador = useCallback((reg) => {
      setRegistradorEditando(reg);
      setNuevoRegistrador(mapearRegistradorAFormulario(reg));
      setMostrarFormRegistrador(reg.agente_id);
   }, []);

   const eliminarRegistrador = useCallback(async (agenteId, registradorId) => {
      await eliminarRegistradorAgente(agenteId, registradorId);
      await recargarRegistradores(agenteId);
   }, [recargarRegistradores]);

   const toggleRegistrador = useCallback(async (agenteId, registradorId) => {
      setRegistradorProcesando(registradorId);
      try {
         await toggleRegistradorAgente(agenteId, registradorId);
         await recargarRegistradores(agenteId);
      } finally {
         setRegistradorProcesando(null);
      }
   }, [recargarRegistradores]);

   const toggleTodosRegistradores = useCallback(async (agenteId, iniciar) => {
      const regs = registradoresAgente[agenteId] || [];
      const registrosAToggle = regs.filter(r => iniciar ? !r.activo : r.activo);
      if (registrosAToggle.length === 0) return;
      setRegistradorProcesando('todos');
      try {
         for (const reg of registrosAToggle) {
            await toggleRegistradorAgente(agenteId, reg.id);
         }
         await recargarRegistradores(agenteId);
      } finally {
         setRegistradorProcesando(null);
      }
   }, [registradoresAgente, recargarRegistradores]);

   const testRegistrador = useCallback(async (agenteId, datosForm) => {
      if (testEnCurso) return;
      const datosTest = construirDatosTest(datosForm);

      setTestEnCurso({ agenteId, registradorId: 'form', testId: null, estado: 'solicitando', progreso: 0 });
      setResultadoTest(null);

      try {
         const respuesta = await solicitarTestRegistrador(agenteId, {
            ip: datosTest.ip, puerto: datosTest.puerto, unitId: datosTest.unit_id,
            indiceInicial: datosTest.indice_inicial, cantidadRegistros: datosTest.cantidad_registros,
         });
         const { testId, timeoutSegundos } = respuesta;
         setTestEnCurso(prev => ({ ...prev, testId, estado: 'esperando', progreso: 0 }));

         const tiempoInicio = Date.now();
         const tiempoMaximo = (timeoutSegundos || 30) * 1000;

         const poll = async () => {
            const tiempoTranscurrido = Date.now() - tiempoInicio;
            if (tiempoTranscurrido > tiempoMaximo) {
               setTestEnCurso(null);
               setResultadoTest({ exito: false, estado: 'timeout', error_mensaje: 'El agente no respondió a tiempo', registrador: datosTest });
               return;
            }
            try {
               const resultado = await consultarTestRegistrador(agenteId, testId);
               setTestEnCurso(prev => prev ? { ...prev, progreso: Math.min((tiempoTranscurrido / tiempoMaximo) * 100, 95) } : null);
               if (resultado.estado === 'completado' || resultado.estado === 'error' || resultado.estado === 'timeout') {
                  setTestEnCurso(prev => prev ? { ...prev, progreso: 100 } : null);
                  setTimeout(() => {
                     setTestEnCurso(null);
                     setResultadoTest({ ...resultado, exito: resultado.estado === 'completado', registrador: datosTest });
                  }, 400);
               } else {
                  setTimeout(poll, 1000);
               }
            } catch (err) {
               setTestEnCurso(null);
               setResultadoTest({ exito: false, estado: 'error', error_mensaje: err.message, registrador: datosTest });
            }
         };
         setTimeout(poll, 1000);
      } catch (err) {
         setTestEnCurso(null);
         if (err.message?.includes('esperar')) {
            setResultadoTest({ exito: false, estado: 'cooldown', error_mensaje: err.message, registrador: datosTest });
         } else {
            throw err;
         }
      }
   }, [testEnCurso]);

   const limpiarResultadoTest = useCallback(() => { setResultadoTest(null); }, []);

   const resetearEstado = useCallback(() => {
      setMostrarFormRegistrador(null);
      setRegistradorEditando(null);
      resetFormRegistrador();
      setTestEnCurso(null);
      setResultadoTest(null);
   }, [resetFormRegistrador]);

   return {
      registradoresAgente, mostrarFormRegistrador, registradorEditando,
      nuevoRegistrador, guardandoRegistrador, registradorProcesando, testEnCurso, resultadoTest,
      setMostrarFormRegistrador, setNuevoRegistrador,
      resetFormRegistrador, cargarRegistradores, recargarRegistradores, guardarRegistrador,
      editarRegistrador, eliminarRegistrador, toggleRegistrador, toggleTodosRegistradores,
      testRegistrador, limpiarResultadoTest, resetearEstado,
   };
}
