// hooks/useRegistradoresConfig.js
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

const REGISTRADOR_INICIAL = {
   nombre: '',
   tipo: 'modbus',
   tipoDispositivo: 'analizador',
   ip: '',
   puerto: '',
   unitId: '',
   indiceInicial: '',
   cantidadRegistros: '',
   intervaloSegundos: '',
   configuracionRele: null,
};

/**
 * Hook para manejar CRUD de registradores
 * @returns {Object} Estado y funciones de registradores
 */
export function useRegistradoresConfig() {
   // Cache de registradores por agente
   const [registradoresAgente, setRegistradoresAgente] = useState({});

   // Estado del formulario
   const [mostrarFormRegistrador, setMostrarFormRegistrador] = useState(null);
   const [registradorEditando, setRegistradorEditando] = useState(null);
   const [nuevoRegistrador, setNuevoRegistrador] = useState(REGISTRADOR_INICIAL);
   const [guardandoRegistrador, setGuardandoRegistrador] = useState(false);
   const [registradorProcesando, setRegistradorProcesando] = useState(null);

   // Estado de test
   const [testEnCurso, setTestEnCurso] = useState(null);
   const [resultadoTest, setResultadoTest] = useState(null);

   /**
    * Reset del formulario de registrador
    */
   const resetFormRegistrador = useCallback(() => {
      setNuevoRegistrador(REGISTRADOR_INICIAL);
      setRegistradorEditando(null);
   }, []);

   /**
    * Cargar registradores de un agente
    */
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

   /**
    * Recargar registradores de un agente
    */
   const recargarRegistradores = useCallback(async (agenteId) => {
      return cargarRegistradores(agenteId);
   }, [cargarRegistradores]);

   /**
    * Preparar datos para guardar registrador
    */
   const prepararDatosRegistrador = useCallback((formData) => {
      const esRele = formData.tipoDispositivo === 'rele';

      if (esRele) {
         const configRele = formData.configuracionRele;
         return {
            nombre: formData.nombre,
            tipo: 'modbus',
            tipoDispositivo: 'rele',
            ip: configRele.conexion.ip,
            puerto: String(configRele.conexion.puerto || 502),
            unitId: String(configRele.conexion.unitId || 1),
            indiceInicial: String(configRele.registroInicial || 120),
            cantidadRegistros: String(configRele.cantidadRegistros || 80),
            intervaloSegundos: '60',
            configuracionRele: configRele,
         };
      }

      return {
         ...formData,
         tipoDispositivo: 'analizador',
         unitId: formData.unitId || '1',
         intervaloSegundos: formData.intervaloSegundos || '60',
      };
   }, []);

   /**
    * Guardar registrador (crear o editar)
    */
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
   }, [prepararDatosRegistrador, recargarRegistradores, resetFormRegistrador]);

   /**
    * Editar registrador - poblar formulario
    */
   const editarRegistrador = useCallback((reg) => {
      setRegistradorEditando(reg);
      setNuevoRegistrador({
         nombre: reg.nombre || '',
         tipo: reg.tipo || 'modbus',
         tipoDispositivo: reg.tipo_dispositivo || 'analizador',
         ip: reg.ip || '',
         puerto: String(reg.puerto || '502'),
         unitId: String(reg.unit_id || '1'),
         indiceInicial: String(reg.indice_inicial || '0'),
         cantidadRegistros: String(reg.cantidad_registros || '10'),
         intervaloSegundos: String(reg.intervalo_segundos || '60'),
         configuracionRele: reg.configuracion_rele || null,
      });
      setMostrarFormRegistrador(reg.agente_id);
   }, []);

   /**
    * Eliminar registrador
    */
   const eliminarRegistrador = useCallback(async (agenteId, registradorId) => {
      await eliminarRegistradorAgente(agenteId, registradorId);
      await recargarRegistradores(agenteId);
   }, [recargarRegistradores]);

   /**
    * Toggle activo de registrador
    */
   const toggleRegistrador = useCallback(async (agenteId, registradorId) => {
      setRegistradorProcesando(registradorId);
      try {
         await toggleRegistradorAgente(agenteId, registradorId);
         await recargarRegistradores(agenteId);
      } finally {
         setRegistradorProcesando(null);
      }
   }, [recargarRegistradores]);

   /**
    * Toggle todos los registradores de un agente
    */
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

   /**
    * Test de conexión de registrador
    */
   const testRegistrador = useCallback(async (agenteId, datosForm) => {
      if (testEnCurso) return;

      const datosTest = {
         nombre: datosForm.nombre || 'Test',
         ip: datosForm.ip,
         puerto: parseInt(datosForm.puerto),
         unit_id: parseInt(datosForm.unitId) || 1,
         indice_inicial: parseInt(datosForm.indiceInicial),
         cantidad_registros: parseInt(datosForm.cantidadRegistros),
      };

      setTestEnCurso({
         agenteId,
         registradorId: 'form',
         testId: null,
         estado: 'solicitando',
         progreso: 0,
      });
      setResultadoTest(null);

      try {
         const respuesta = await solicitarTestRegistrador(agenteId, {
            ip: datosTest.ip,
            puerto: datosTest.puerto,
            unitId: datosTest.unit_id,
            indiceInicial: datosTest.indice_inicial,
            cantidadRegistros: datosTest.cantidad_registros,
         });

         const { testId, timeoutSegundos } = respuesta;

         setTestEnCurso(prev => ({
            ...prev,
            testId,
            estado: 'esperando',
            progreso: 0,
         }));

         // Polling del resultado
         const tiempoInicio = Date.now();
         const tiempoMaximo = (timeoutSegundos || 30) * 1000;
         const intervalo = 1000;

         const poll = async () => {
            const tiempoTranscurrido = Date.now() - tiempoInicio;

            if (tiempoTranscurrido > tiempoMaximo) {
               setTestEnCurso(null);
               setResultadoTest({
                  exito: false,
                  estado: 'timeout',
                  error_mensaje: 'El agente no respondió a tiempo',
                  registrador: datosTest,
               });
               return;
            }

            try {
               const resultado = await consultarTestRegistrador(agenteId, testId);
               const progreso = Math.min((tiempoTranscurrido / tiempoMaximo) * 100, 95);
               setTestEnCurso(prev => prev ? { ...prev, progreso } : null);

               if (resultado.estado === 'completado' || resultado.estado === 'error' || resultado.estado === 'timeout') {
                  setTestEnCurso(prev => prev ? { ...prev, progreso: 100 } : null);

                  setTimeout(() => {
                     setTestEnCurso(null);
                     setResultadoTest({
                        ...resultado,
                        exito: resultado.estado === 'completado',
                        registrador: datosTest,
                     });
                  }, 400);
               } else {
                  setTimeout(poll, intervalo);
               }
            } catch (err) {
               setTestEnCurso(null);
               setResultadoTest({
                  exito: false,
                  estado: 'error',
                  error_mensaje: err.message,
                  registrador: datosTest,
               });
            }
         };

         setTimeout(poll, intervalo);

      } catch (err) {
         setTestEnCurso(null);

         if (err.message?.includes('esperar')) {
            setResultadoTest({
               exito: false,
               estado: 'cooldown',
               error_mensaje: err.message,
               registrador: datosTest,
            });
         } else {
            throw err;
         }
      }
   }, [testEnCurso]);

   /**
    * Limpiar estado de test
    */
   const limpiarResultadoTest = useCallback(() => {
      setResultadoTest(null);
   }, []);

   /**
    * Resetear todo el estado
    */
   const resetearEstado = useCallback(() => {
      setMostrarFormRegistrador(null);
      setRegistradorEditando(null);
      resetFormRegistrador();
      setTestEnCurso(null);
      setResultadoTest(null);
   }, [resetFormRegistrador]);

   return {
      // Estado
      registradoresAgente,
      mostrarFormRegistrador,
      registradorEditando,
      nuevoRegistrador,
      guardandoRegistrador,
      registradorProcesando,
      testEnCurso,
      resultadoTest,

      // Setters
      setMostrarFormRegistrador,
      setNuevoRegistrador,

      // Funciones
      resetFormRegistrador,
      cargarRegistradores,
      recargarRegistradores,
      guardarRegistrador,
      editarRegistrador,
      eliminarRegistrador,
      toggleRegistrador,
      toggleTodosRegistradores,
      testRegistrador,
      limpiarResultadoTest,
      resetearEstado,
   };
}
