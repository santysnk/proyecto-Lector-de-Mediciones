# Migraciones de Base de Datos

Este directorio contiene las migraciones SQL para la base de datos del proyecto Lector de Mediciones.

## Orden de ejecución

Las migraciones deben ejecutarse en orden numérico:

1. `001_add_color_columns_to_puestos.sql` - Agrega columnas de color a la tabla puestos

## Cómo ejecutar migraciones en Supabase

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a la sección "SQL Editor" en el menú lateral
4. Crear una nueva query
5. Copiar y pegar el contenido del archivo de migración
6. Ejecutar la query con el botón "Run" o `Ctrl+Enter`

### Opción 2: Desde la CLI de Supabase

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login a Supabase
supabase login

# Ejecutar migración
supabase db push migrations/001_add_color_columns_to_puestos.sql
```

### Opción 3: Usando psql (si tienes acceso directo)

```bash
psql -h <tu-host>.supabase.co -U postgres -d postgres -f migrations/001_add_color_columns_to_puestos.sql
```

## Verificar que la migración se ejecutó correctamente

Después de ejecutar la migración, verifica que las columnas se crearon:

```sql
-- Ver la estructura de la tabla puestos
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'puestos'
AND column_name IN ('color', 'bg_color');
```

Deberías ver algo como:

```
 column_name | data_type | column_default
-------------+-----------+----------------
 color       | varchar   | '#22c55e'
 bg_color    | varchar   | '#e5e7eb'
```

## Rollback (si necesitas revertir)

Si necesitas revertir la migración `001_add_color_columns_to_puestos.sql`:

```sql
ALTER TABLE puestos
DROP COLUMN IF EXISTS color,
DROP COLUMN IF EXISTS bg_color;

DROP INDEX IF EXISTS idx_puestos_color;
```

## Notas importantes

- Siempre haz un backup antes de ejecutar migraciones en producción
- Las migraciones usan `IF NOT EXISTS` para evitar errores si ya fueron ejecutadas
- Los valores por defecto son:
  - `color`: `#22c55e` (verde Tailwind)
  - `bg_color`: `#e5e7eb` (gris claro Tailwind)
