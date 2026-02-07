// Re-exports para mantener compatibilidad con imports existentes
export {
	interpretarRegistro,
	tieneInterpretacion,
	categoriaRequiereInterpretacion,
	obtenerClaseTipo,
} from "./interpretarRegistro";

export {
	SEVERIDADES_DISPONIBLES,
	PLANTILLAS_ETIQUETAS_LEDS,
} from "./constantesInterpretacion";

// Default export para compatibilidad
import { interpretarRegistro, tieneInterpretacion, categoriaRequiereInterpretacion, obtenerClaseTipo } from "./interpretarRegistro";
import { SEVERIDADES_DISPONIBLES, PLANTILLAS_ETIQUETAS_LEDS } from "./constantesInterpretacion";

export default {
	interpretarRegistro,
	tieneInterpretacion,
	categoriaRequiereInterpretacion,
	obtenerClaseTipo,
	SEVERIDADES_DISPONIBLES,
	PLANTILLAS_ETIQUETAS_LEDS
};
