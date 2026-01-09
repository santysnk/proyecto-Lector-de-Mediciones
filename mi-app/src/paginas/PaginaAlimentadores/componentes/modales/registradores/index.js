// modales/registradores/index.js
// Re-exporta todos los componentes de registradores

// Componentes compartidos
export { default as ModalTransformadores } from "./ModalTransformadores";
export { default as DropdownTransformador } from "./DropdownTransformador";
export { default as SeccionTransformadores } from "./SeccionTransformadores";

// Componentes específicos de analizador
export { ConfiguracionAnalizador, ModalPlantillasAnalizador } from "./analizador";

// Componentes específicos de relé
export { ConfiguracionRele, ModalPlantillasRele } from "./rele";
