/**
 * Hook para manejo consistente de errores en la aplicación
 * Proporciona funciones para capturar, mostrar y reportar errores
 */

import { useState, useCallback, useRef } from "react";

/**
 * Niveles de severidad de errores
 */
export const ERROR_LEVELS = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
};

/**
 * Códigos de error predefinidos
 */
export const ERROR_CODES = {
  NETWORK: "NETWORK_ERROR",
  DATABASE: "DATABASE_ERROR",
  VALIDATION: "VALIDATION_ERROR",
  AUTH: "AUTH_ERROR",
  MODBUS: "MODBUS_ERROR",
  UNKNOWN: "UNKNOWN_ERROR",
};

/**
 * Hook para manejar errores de forma consistente
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.logToConsole - Si debe loggear a consola (default: true en dev)
 * @param {number} options.maxErrors - Máximo de errores a mantener en historial (default: 50)
 * @param {number} options.autoCleanupMs - Tiempo en ms para limpiar errores viejos (default: 300000 = 5 min)
 * @returns {Object} - Funciones y estado del manejador de errores
 */
const useErrorHandler = (options = {}) => {
  const {
    logToConsole = import.meta.env.DEV,
    maxErrors = 50,
    autoCleanupMs = 5 * 60 * 1000,
  } = options;

  // Estado de errores actuales
  const [errors, setErrors] = useState([]);
  const [lastError, setLastError] = useState(null);

  // Ref para el timer de auto-cleanup
  const cleanupTimerRef = useRef(null);

  /**
   * Genera un ID único para cada error
   */
  const generateErrorId = useCallback(() => {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Formatea un error para almacenamiento consistente
   */
  const formatError = useCallback((error, context = {}) => {
    const errorObj = {
      id: generateErrorId(),
      timestamp: new Date().toISOString(),
      message: "",
      code: ERROR_CODES.UNKNOWN,
      level: ERROR_LEVELS.ERROR,
      stack: null,
      context: {},
      originalError: null,
    };

    // Si es un Error nativo
    if (error instanceof Error) {
      errorObj.message = error.message;
      errorObj.stack = error.stack;
      errorObj.originalError = error;

      // Detectar tipo de error por mensaje
      if (error.message.includes("fetch") || error.message.includes("network")) {
        errorObj.code = ERROR_CODES.NETWORK;
      } else if (error.message.includes("IndexedDB") || error.message.includes("database")) {
        errorObj.code = ERROR_CODES.DATABASE;
      } else if (error.message.includes("Modbus") || error.message.includes("modbus")) {
        errorObj.code = ERROR_CODES.MODBUS;
      }
    }
    // Si es un string
    else if (typeof error === "string") {
      errorObj.message = error;
    }
    // Si es un objeto con propiedades de error
    else if (typeof error === "object" && error !== null) {
      errorObj.message = error.message || JSON.stringify(error);
      errorObj.code = error.code || ERROR_CODES.UNKNOWN;
      errorObj.level = error.level || ERROR_LEVELS.ERROR;
    }

    // Merge con contexto proporcionado
    errorObj.context = {
      ...context,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    };

    // Override con valores del contexto si existen
    if (context.code) errorObj.code = context.code;
    if (context.level) errorObj.level = context.level;

    return errorObj;
  }, [generateErrorId]);

  /**
   * Captura y registra un error
   * @param {Error|string|Object} error - El error a capturar
   * @param {Object} context - Contexto adicional (código, nivel, metadata)
   * @returns {Object} - El error formateado
   */
  const captureError = useCallback((error, context = {}) => {
    const formattedError = formatError(error, context);

    // Log a consola si está habilitado
    if (logToConsole) {
      const logMethod = formattedError.level === ERROR_LEVELS.WARNING ? console.warn : console.error;
      logMethod(`[${formattedError.code}] ${formattedError.message}`, {
        context: formattedError.context,
        stack: formattedError.stack,
      });
    }

    // Agregar al estado
    setErrors((prev) => {
      const updated = [formattedError, ...prev];
      // Limitar tamaño del historial
      return updated.slice(0, maxErrors);
    });

    setLastError(formattedError);

    // Programar auto-limpieza
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
    }
    cleanupTimerRef.current = setTimeout(() => {
      setErrors((prev) => {
        const cutoffTime = Date.now() - autoCleanupMs;
        return prev.filter((err) => new Date(err.timestamp).getTime() > cutoffTime);
      });
    }, autoCleanupMs);

    return formattedError;
  }, [formatError, logToConsole, maxErrors, autoCleanupMs]);

  /**
   * Captura un error de nivel warning
   */
  const captureWarning = useCallback((message, context = {}) => {
    return captureError(message, { ...context, level: ERROR_LEVELS.WARNING });
  }, [captureError]);

  /**
   * Captura un error de nivel info
   */
  const captureInfo = useCallback((message, context = {}) => {
    return captureError(message, { ...context, level: ERROR_LEVELS.INFO });
  }, [captureError]);

  /**
   * Limpia un error específico por ID
   */
  const dismissError = useCallback((errorId) => {
    setErrors((prev) => prev.filter((err) => err.id !== errorId));
    setLastError((prev) => (prev?.id === errorId ? null : prev));
  }, []);

  /**
   * Limpia todos los errores
   */
  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setLastError(null);
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
    }
  }, []);

  /**
   * Obtiene errores filtrados por nivel
   */
  const getErrorsByLevel = useCallback((level) => {
    return errors.filter((err) => err.level === level);
  }, [errors]);

  /**
   * Obtiene errores filtrados por código
   */
  const getErrorsByCode = useCallback((code) => {
    return errors.filter((err) => err.code === code);
  }, [errors]);

  /**
   * Wrapper para funciones async que captura errores automáticamente
   * @param {Function} asyncFn - Función async a ejecutar
   * @param {Object} context - Contexto para el error si ocurre
   * @returns {Promise<[result, error]>} - Tupla [resultado, error]
   */
  const withErrorCapture = useCallback((asyncFn, context = {}) => {
    return async (...args) => {
      try {
        const result = await asyncFn(...args);
        return [result, null];
      } catch (error) {
        const captured = captureError(error, context);
        return [null, captured];
      }
    };
  }, [captureError]);

  /**
   * Ejecuta una función y captura errores automáticamente
   * @param {Function} fn - Función a ejecutar
   * @param {Object} context - Contexto para el error si ocurre
   * @returns {Promise<[result, error]>} - Tupla [resultado, error]
   */
  const tryCatch = useCallback(async (fn, context = {}) => {
    try {
      const result = await fn();
      return [result, null];
    } catch (error) {
      const captured = captureError(error, context);
      return [null, captured];
    }
  }, [captureError]);

  return {
    // Estado
    errors,
    lastError,
    hasErrors: errors.length > 0,
    errorCount: errors.length,

    // Funciones de captura
    captureError,
    captureWarning,
    captureInfo,

    // Funciones de limpieza
    dismissError,
    clearAllErrors,

    // Funciones de filtrado
    getErrorsByLevel,
    getErrorsByCode,

    // Utilidades
    withErrorCapture,
    tryCatch,

    // Constantes exportadas
    ERROR_LEVELS,
    ERROR_CODES,
  };
};

export default useErrorHandler;
