-- ============================================
-- MIGRACIÓN: Agregar columnas de color a puestos
-- Fecha: 2025-01-12
-- Descripción: Agrega campos color y bg_color a la tabla puestos
--              para persistir los colores del botón y del fondo
-- ============================================

-- Agregar columnas de color a la tabla puestos
ALTER TABLE puestos
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#22c55e',
ADD COLUMN IF NOT EXISTS bg_color VARCHAR(7) DEFAULT '#e5e7eb';

-- Crear índice para búsquedas por color (opcional, por si se necesita filtrar)
CREATE INDEX IF NOT EXISTS idx_puestos_color ON puestos(color);

-- Comentarios para documentación
COMMENT ON COLUMN puestos.color IS 'Color del botón del puesto en formato hexadecimal (#rrggbb)';
COMMENT ON COLUMN puestos.bg_color IS 'Color de fondo del puesto en formato hexadecimal (#rrggbb)';

-- ============================================
-- NOTAS:
-- - El color por defecto '#22c55e' es verde (Tailwind green-500)
-- - El bg_color por defecto '#e5e7eb' es gris claro (Tailwind gray-200)
-- - IF NOT EXISTS previene errores si la columna ya existe
-- ============================================
