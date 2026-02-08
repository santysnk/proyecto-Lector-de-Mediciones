/**
 * Hook para gestionar alarmas de la grilla de tarjetas
 * Maneja caché de etiquetasBits, detección de alarmas activas y estado de alarmas vistas
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { obtenerFuncionalidadesRegistrador } from "@/servicios/api/registradores";

// Clave para localStorage de alarmas vistas
const STORAGE_KEY_ALARMAS_VISTAS = "rw-alarmas-vistas";

/**
 * @param {Object} params
 * @param {Array} params.alimentadores - Lista de alimentadores
 * @param {Object} params.registrosEnVivo - Registros en vivo por alimentador
 */
export const useAlarmasGrilla = ({ alimentadores, registrosEnVivo }) => {
   // Estado de alarmas vistas por alimentador
   const [alarmasVistasPorAlimentador, setAlarmasVistasPorAlimentador] = useState(() => {
      try {
         const guardadas = localStorage.getItem(STORAGE_KEY_ALARMAS_VISTAS);
         return guardadas ? JSON.parse(guardadas) : {};
      } catch {
         return {};
      }
   });

   // Persistir alarmas vistas en localStorage
   useEffect(() => {
      try {
         localStorage.setItem(STORAGE_KEY_ALARMAS_VISTAS, JSON.stringify(alarmasVistasPorAlimentador));
      } catch (e) {
         console.warn("No se pudo guardar alarmas vistas en localStorage:", e);
      }
   }, [alarmasVistasPorAlimentador]);

   // Caché de etiquetasBits por registrador
   const [etiquetasBitsCache, setEtiquetasBitsCache] = useState({});

   // Obtener IDs únicos de registradores
   const registradoresIds = useMemo(() => {
      const ids = new Set();
      alimentadores.forEach(alim => {
         const regId = alim.config_tarjeta?.superior?.registrador_id
                    || alim.config_tarjeta?.inferior?.registrador_id
                    || alim.card_design?.superior?.registrador_id
                    || alim.card_design?.inferior?.registrador_id;
         if (regId) ids.add(regId);
      });
      return Array.from(ids);
   }, [alimentadores]);

   // Clave estable
   const registradoresIdsKey = useMemo(() => registradoresIds.join(","), [registradoresIds]);

   // Cargar etiquetasBits de registradores
   useEffect(() => {
      const cargarEtiquetas = async () => {
         if (registradoresIds.length === 0) return;

         const nuevoCache = {};

         for (const regId of registradoresIds) {
            try {
               const resultado = await obtenerFuncionalidadesRegistrador(regId);

               let etiquetasBitsEncontradas = null;

               if (resultado?.funcionalidades && Array.isArray(resultado.funcionalidades)) {
                  const funcLeds = resultado.funcionalidades.find(f =>
                     (f.categoria === "estados" || f.categoria === "alarmas") &&
                     f.habilitado !== false &&
                     f.registros?.some(r => r.valor === 172 || r.registro === 172)
                  );

                  if (funcLeds?.etiquetasBits && Object.keys(funcLeds.etiquetasBits).length > 0) {
                     etiquetasBitsEncontradas = funcLeds.etiquetasBits;
                  }
               }

               if (!etiquetasBitsEncontradas && resultado?.etiquetasBits) {
                  etiquetasBitsEncontradas = resultado.etiquetasBits;
               }

               if (etiquetasBitsEncontradas) {
                  nuevoCache[regId] = etiquetasBitsEncontradas;
               }
            } catch (error) {
               console.warn(`Error cargando etiquetasBits del registrador ${regId}:`, error);
            }
         }

         setEtiquetasBitsCache(nuevoCache);
      };

      cargarEtiquetas();
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [registradoresIdsKey]);

   // Obtener alarmas activas de un alimentador
   const obtenerAlarmasActivas = useCallback((alimentador) => {
      const registrosAlim = registrosEnVivo[alimentador.id];
      if (!registrosAlim?.rele || !Array.isArray(registrosAlim.rele)) return [];

      const registro172 = registrosAlim.rele.find(r => r.address === 172);
      if (!registro172) return [];

      const valorLeds = registro172.value || 0;

      const regId = alimentador.config_tarjeta?.superior?.registrador_id
                 || alimentador.config_tarjeta?.inferior?.registrador_id
                 || alimentador.card_design?.superior?.registrador_id
                 || alimentador.card_design?.inferior?.registrador_id;

      if (!regId) return [];

      const etiquetasBits = etiquetasBitsCache[regId];
      if (!etiquetasBits) return [];

      const alarmas = [];
      Object.entries(etiquetasBits).forEach(([bit, config]) => {
         const bitNum = parseInt(bit);
         const activo = (valorLeds >> bitNum) & 1;

         if (activo && (config.severidad === "warning" || config.severidad === "alarma")) {
            alarmas.push({
               id: `${alimentador.id}-bit-${bit}`,
               nombre: config.texto || config.nombre || `LED ${bitNum + 1}`,
               tipo: config.severidad
            });
         }
      });

      return alarmas;
   }, [registrosEnVivo, etiquetasBitsCache]);

   // Marcar/desmarcar una alarma como vista (toggle)
   const handleMarcarAlarmaVista = useCallback((alimentadorId, alarmaId) => {
      setAlarmasVistasPorAlimentador(prev => {
         const estadoActual = prev[alimentadorId]?.[alarmaId] || false;
         return {
            ...prev,
            [alimentadorId]: {
               ...prev[alimentadorId],
               [alarmaId]: !estadoActual
            }
         };
      });
   }, []);

   // Marcar todas las alarmas como vistas
   const handleMarcarTodasAlarmasVistas = useCallback((alimentadorId, alarmas) => {
      const vistas = {};
      alarmas.forEach(a => {
         vistas[a.id] = true;
      });

      setAlarmasVistasPorAlimentador(prev => ({
         ...prev,
         [alimentadorId]: {
            ...prev[alimentadorId],
            ...vistas
         }
      }));
   }, []);

   return {
      alarmasVistasPorAlimentador,
      obtenerAlarmasActivas,
      handleMarcarAlarmaVista,
      handleMarcarTodasAlarmasVistas,
   };
};
