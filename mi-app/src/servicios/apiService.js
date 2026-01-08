// src/servicios/apiService.js
// Re-exporta todas las funciones de API desde los módulos organizados
// Mantiene compatibilidad con imports existentes

export * from './api';

// Export default para compatibilidad con imports como: import apiService from '...'
export { default } from './api/index';
