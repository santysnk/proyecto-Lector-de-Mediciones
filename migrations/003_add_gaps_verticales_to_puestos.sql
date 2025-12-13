-- ============================================
-- MIGRACIÓN: Agregar columna gaps_verticales a puestos
-- Fecha: 2025-01-13
-- Descripción: Agrega campo JSONB gaps_verticales para el espaciado
--              vertical por fila dentro de cada puesto
-- ============================================

-- Agregar columna gaps_verticales a la tabla puestos
ALTER TABLE puestos
ADD COLUMN IF NOT EXISTS gaps_verticales JSONB DEFAULT '{"0": 40}';

-- Comentario para documentación
COMMENT ON COLUMN puestos.gaps_verticales IS 'Espaciado vertical por fila en formato JSON: {"0": 40, "1": 50, ...}. El índice 0 es la separación del navbar a la primera fila.';

-- ============================================
-- NOTAS:
-- - El valor por defecto {"0": 40} define 40px de separación inicial
-- - Formato: {"índice_fila": pixels, ...}
-- - Mínimo siempre existe el índice "0" (separación navbar)
-- - JSONB permite consultas indexadas sobre el contenido JSON
-- - IF NOT EXISTS previene errores si la columna ya existe
-- ============================================
