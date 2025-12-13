-- ============================================
-- MIGRACIÓN: Agregar columna gap_horizontal a alimentadores
-- Fecha: 2025-01-13
-- Descripción: Agrega campo gap_horizontal para el espaciado
--              a la derecha de cada tarjeta de alimentador
-- ============================================

-- Agregar columna gap_horizontal a la tabla alimentadores
ALTER TABLE alimentadores
ADD COLUMN IF NOT EXISTS gap_horizontal INTEGER DEFAULT 10;

-- Comentario para documentación
COMMENT ON COLUMN alimentadores.gap_horizontal IS 'Espaciado horizontal en píxeles a la derecha de esta tarjeta (default: 10)';

-- ============================================
-- NOTAS:
-- - El valor por defecto es 10px (mismo que GAP_DEFAULT en usarPreferenciasUI.js)
-- - IF NOT EXISTS previene errores si la columna ya existe
-- - Este valor se sincroniza con localStorage mediante el sistema de guardado diferido
-- ============================================
