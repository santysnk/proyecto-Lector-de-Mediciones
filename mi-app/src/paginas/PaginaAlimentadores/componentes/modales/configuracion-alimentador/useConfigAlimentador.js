/**
 * Hook para gestionar la lógica de configuración de alimentador
 * Incluye: detección de duplicados, carga de registradores, gestión de card design
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { listarAgentesWorkspace, listarRegistradoresAgente } from "@/servicios/apiService";
import { crearCardDesignDefault, INTERVALO_CONSULTA_DEFAULT } from "./constantes";
import { COLORES_SISTEMA } from "../../../constantes/colores";

/**
 * Hook para gestionar la configuración de alimentador
 * @param {Object} params
 * @param {boolean} params.abierto - Si el modal está abierto
 * @param {string} params.workspaceId - ID del workspace
 * @param {Object} params.initialData - Datos iniciales del alimentador
 */
export const useConfigAlimentador = ({ abierto, workspaceId, initialData }) => {
   // Estado básico
   const [nombre, setNombre] = useState("");
   const [color, setColor] = useState(COLORES_SISTEMA[0]);
   const [intervaloConsultaSeg, setIntervaloConsultaSeg] = useState(INTERVALO_CONSULTA_DEFAULT);
   const [cardDesign, setCardDesign] = useState(crearCardDesignDefault());

   // Estado de registradores
   const [agentesVinculados, setAgentesVinculados] = useState([]);
   const [registradoresPorAgente, setRegistradoresPorAgente] = useState({});
   const [cargandoAgentes, setCargandoAgentes] = useState(false);

   // Cargar agentes vinculados
   useEffect(() => {
      if (!abierto || !workspaceId) return;

      const cargarAgentes = async () => {
         setCargandoAgentes(true);
         try {
            const agentes = await listarAgentesWorkspace(workspaceId);
            setAgentesVinculados(agentes || []);

            const registradoresMap = {};
            for (const agente of agentes || []) {
               try {
                  const regs = await listarRegistradoresAgente(agente.id);
                  registradoresMap[agente.id] = regs || [];
               } catch (err) {
                  console.error(`Error cargando registradores del agente ${agente.id}:`, err);
                  registradoresMap[agente.id] = [];
               }
            }
            setRegistradoresPorAgente(registradoresMap);
         } catch (err) {
            console.error("Error cargando agentes:", err);
         } finally {
            setCargandoAgentes(false);
         }
      };

      cargarAgentes();
   }, [abierto, workspaceId]);

   // Cargar datos iniciales
   useEffect(() => {
      if (!abierto) return;

      if (initialData) {
         setNombre(initialData.nombre || "");
         setColor(initialData.color || COLORES_SISTEMA[0]);
         const intervaloMs = initialData.intervalo_consulta_ms || 60000;
         setIntervaloConsultaSeg(Math.max(5, Math.round(intervaloMs / 1000)));

         let design = initialData.card_design || crearCardDesignDefault();

         // Migración: formato antiguo con registrador_id en raíz
         if (initialData.registrador_id && !design.superior?.registrador_id && !design.inferior?.registrador_id) {
            design = {
               ...design,
               superior: { ...design.superior, registrador_id: initialData.registrador_id },
               inferior: { ...design.inferior, registrador_id: initialData.registrador_id },
            };
         }

         setCardDesign(design);
      } else {
         setNombre("");
         setColor(COLORES_SISTEMA[0]);
         setIntervaloConsultaSeg(INTERVALO_CONSULTA_DEFAULT);
         setCardDesign(crearCardDesignDefault());
      }
   }, [abierto, initialData]);

   // Agrupar todos los registradores
   const todosRegistradores = useMemo(() => {
      const lista = [];
      for (const agente of agentesVinculados) {
         const regs = registradoresPorAgente[agente.id] || [];
         for (const reg of regs) {
            lista.push({ ...reg, agenteNombre: agente.nombre });
         }
      }
      return lista;
   }, [agentesVinculados, registradoresPorAgente]);

   // Buscar registrador por ID
   const buscarRegistrador = useCallback(
      (regId) => {
         if (!regId) return null;
         return todosRegistradores.find((r) => r.id === regId) || null;
      },
      [todosRegistradores]
   );

   // Obtener índices disponibles para una zona
   const obtenerIndicesZona = useCallback(
      (zona) => {
         const regId = cardDesign[zona]?.registrador_id;
         const reg = buscarRegistrador(regId);
         if (!reg) return [];
         return Array.from({ length: reg.cantidad_registros }, (_, i) => reg.indice_inicial + i);
      },
      [cardDesign, buscarRegistrador]
   );

   // Actualizar una propiedad de una zona
   const actualizarSide = useCallback((zona, campo, valor) => {
      setCardDesign((prev) => ({
         ...prev,
         [zona]: {
            ...prev[zona],
            [campo]: valor,
         },
      }));
   }, []);

   // Actualizar una propiedad de un box
   const actualizarBox = useCallback((zona, index, campo, valor) => {
      setCardDesign((prev) => {
         const newBoxes = [...prev[zona].boxes];
         newBoxes[index] = { ...newBoxes[index], [campo]: valor };
         return {
            ...prev,
            [zona]: {
               ...prev[zona],
               boxes: newBoxes,
            },
         };
      });
   }, []);

   return {
      // Estado básico
      nombre,
      setNombre,
      color,
      setColor,
      intervaloConsultaSeg,
      setIntervaloConsultaSeg,
      cardDesign,
      setCardDesign,

      // Registradores
      agentesVinculados,
      cargandoAgentes,
      todosRegistradores,
      buscarRegistrador,
      obtenerIndicesZona,

      // Acciones
      actualizarSide,
      actualizarBox,
   };
};

/**
 * Hook para detectar índices duplicados en el card design
 * @param {Object} cardDesign - Diseño de la card
 */
export const useDeteccionDuplicados = (cardDesign) => {
   return useMemo(() => {
      const indicesUsados = [];
      const duplicados = [];

      // Recolectar índices de ambas zonas
      const procesarZona = (zona, boxes) => {
         boxes.forEach((box, idx) => {
            if (box.indice !== null && box.indice !== undefined && box.indice !== "") {
               const clave = String(box.indice);
               const info = { zona, boxNum: idx + 1, indice: box.indice };

               const existente = indicesUsados.find((r) => r.clave === clave);
               if (existente) {
                  duplicados.push({ ...info, duplicadoCon: existente.info });
               } else {
                  indicesUsados.push({ clave, info });
               }
            }
         });
      };

      procesarZona("superior", cardDesign.superior?.boxes || []);
      procesarZona("inferior", cardDesign.inferior?.boxes || []);

      // Crear set de claves duplicadas
      const clavesDuplicadas = new Set();
      duplicados.forEach((dup) => {
         clavesDuplicadas.add(`${dup.zona}-${dup.boxNum - 1}-${dup.indice}`);
         clavesDuplicadas.add(`${dup.duplicadoCon.zona}-${dup.duplicadoCon.boxNum - 1}-${dup.duplicadoCon.indice}`);
      });

      // Funciones de utilidad
      const estaIndiceDuplicado = (zona, index, indice) => {
         if (indice === null || indice === undefined || indice === "") return false;
         return clavesDuplicadas.has(`${zona}-${index}-${indice}`);
      };

      const obtenerMensajeDuplicado = (zona, index, indice) => {
         if (indice === null || indice === undefined || indice === "") return "";

         const dup = duplicados.find((d) => d.zona === zona && d.boxNum === index + 1 && d.indice === indice);
         if (dup) {
            const zonaLabel = dup.duplicadoCon.zona === "superior" ? "Parte superior" : "Parte inferior";
            return `Este índice ya está usado en ${zonaLabel} Box ${dup.duplicadoCon.boxNum}`;
         }

         const original = duplicados.find(
            (d) => d.duplicadoCon.zona === zona && d.duplicadoCon.boxNum === index + 1 && d.duplicadoCon.indice === indice
         );
         if (original) {
            const zonaLabel = original.zona === "superior" ? "Parte superior" : "Parte inferior";
            return `Este índice también se usa en ${zonaLabel} Box ${original.boxNum}`;
         }

         return "";
      };

      return {
         duplicados,
         estaIndiceDuplicado,
         obtenerMensajeDuplicado,
      };
   }, [cardDesign]);
};
