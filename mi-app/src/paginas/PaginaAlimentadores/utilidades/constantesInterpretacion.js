// @ts-check
/**
 * Constantes exportadas para uso en UI de configuración de etiquetas y plantillas
 */

/** Lista de severidades disponibles para etiquetas */
export const SEVERIDADES_DISPONIBLES = [
  { id: "info", nombre: "Info", color: "#93c5fd" },
  { id: "estado", nombre: "Estado", color: "#93c5fd" },
  { id: "warning", nombre: "Advertencia", color: "#fde68a" },
  { id: "alarma", nombre: "Alarma", color: "#fca5a5" },
  { id: "error", nombre: "Error", color: "#fca5a5" }
];

/**
 * Plantillas predefinidas de etiquetas para diferentes tipos de relés
 * El usuario puede seleccionar una de estas como base
 */
export const PLANTILLAS_ETIQUETAS_LEDS = {
  alimentador: {
    nombre: "Alimentador (FE03)",
    etiquetas: {
      0: { texto: "Arranque I>", severidad: "warning" },
      1: { texto: "Disparo I>", severidad: "alarma" },
      2: { texto: "Falla a Tierra / Disparo I>>", severidad: "alarma" },
      3: { texto: "Disparo I>>", severidad: "alarma" },
      4: { texto: "Arranque Io>", severidad: "warning" },
      5: { texto: "Disparo Falla a Tierra", severidad: "alarma" },
      6: { texto: "Desbalance de Fases", severidad: "warning" },
      7: { texto: "Recierre Habilitado", severidad: "info" },
      8: { texto: "Recierre en Progreso", severidad: "info" },
      9: { texto: "Pos CB Abierto", severidad: "estado" },
      10: { texto: "Pos CB Cerrado", severidad: "estado" }
    }
  },
  terna: {
    nombre: "TERNA (FE06)",
    etiquetas: {
      0: { texto: "Sobreintensidad", severidad: "warning" },
      1: { texto: "Falta a tierra", severidad: "alarma" },
      2: { texto: "Sobre/sub tensión", severidad: "warning" },
      3: { texto: "Desbalance de fases", severidad: "warning" },
      4: { texto: "Sobrecarga térmica", severidad: "warning" },
      5: { texto: "Fallo de interruptor", severidad: "error" },
      6: { texto: "Disparo reg. perturb.", severidad: "info" },
      7: { texto: "Monitorización interruptor", severidad: "info" },
      8: { texto: "Supervisión", severidad: "info" }
    }
  },
  trafoDif: {
    nombre: "TRAFO Diferencial (TE02)",
    etiquetas: {
      0: { texto: "Prot dif pol. etapa baja", severidad: "warning" },
      1: { texto: "Prot. dif. etapa alta", severidad: "alarma" },
      2: { texto: "Sobreintensidad", severidad: "warning" },
      3: { texto: "Falta a tierra restringida", severidad: "alarma" },
      4: { texto: "Falta a tierra", severidad: "alarma" },
      5: { texto: "Fallo de interruptor", severidad: "error" },
      6: { texto: "F. sec. neg. / sobrecarga 1°", severidad: "warning" },
      7: { texto: "Disparo reg. perturb.", severidad: "info" },
      8: { texto: "Supervisión", severidad: "info" },
      9: { texto: "Disparo externo", severidad: "alarma" }
    }
  }
};
