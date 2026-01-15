// hooks/useFuncionalidadesRegistrador.js
// Hook para obtener funcionalidades de un registrador basándose en su plantilla

import { useState, useEffect } from 'react';
import { obtenerFuncionalidadesRegistrador } from '../../../servicios/api/registradores';

/**
 * Hook para obtener funcionalidades de un registrador
 * Se usa en la configuración de tarjetas
 *
 * @param {string} registradorId - UUID del registrador
 * @returns {Object} Estado y datos de funcionalidades
 */
export function useFuncionalidadesRegistrador(registradorId) {
   const [funcionalidades, setFuncionalidades] = useState([]);
   const [plantilla, setPlantilla] = useState(null);
   const [registrador, setRegistrador] = useState(null);
   const [etiquetasBits, setEtiquetasBits] = useState({});
   const [cargando, setCargando] = useState(false);
   const [error, setError] = useState(null);

   useEffect(() => {
      // Reset si no hay registrador
      if (!registradorId) {
         setFuncionalidades([]);
         setPlantilla(null);
         setRegistrador(null);
         setEtiquetasBits({});
         setError(null);
         return;
      }

      let cancelado = false;

      const cargar = async () => {
         setCargando(true);
         setError(null);

         try {
            const data = await obtenerFuncionalidadesRegistrador(registradorId);

            if (cancelado) return;

            setFuncionalidades(data.funcionalidades || []);
            setPlantilla(data.plantilla || null);
            setRegistrador(data.registrador || null);
            setEtiquetasBits(data.etiquetasBits || {});

            if (data.mensaje) {
               setError(data.mensaje);
            }
         } catch (err) {
            if (cancelado) return;
            setError(err.message || 'Error al cargar funcionalidades');
            setFuncionalidades([]);
            setPlantilla(null);
         }

         setCargando(false);
      };

      cargar();

      return () => {
         cancelado = true;
      };
   }, [registradorId]);

   return {
      funcionalidades,
      plantilla,
      registrador,
      etiquetasBits,
      cargando,
      error,
      tienePlantilla: plantilla !== null
   };
}

export default useFuncionalidadesRegistrador;
