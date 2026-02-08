-- Add unique constraints/indexes to enforce data integrity

-- Token hashes should be unique
DROP INDEX IF EXISTS refresh_tokens_hash_idx;
CREATE UNIQUE INDEX refresh_tokens_hash_idx ON refresh_tokens (token_hash);

DROP INDEX IF EXISTS password_reset_tokens_hash_idx;
CREATE UNIQUE INDEX password_reset_tokens_hash_idx ON password_reset_tokens (token_hash);

-- Enforce unique order within plantilla/proceso
DROP INDEX IF EXISTS tareas_plantilla_orden_idx;
CREATE UNIQUE INDEX tareas_plantilla_orden_idx ON tareas_plantilla (plantilla_id, orden);

DROP INDEX IF EXISTS tareas_onboarding_orden_idx;
CREATE UNIQUE INDEX tareas_onboarding_orden_idx ON tareas_onboarding (proceso_id, orden);

-- Plantillas: unique per (nombre, departamento, rol) while active
CREATE UNIQUE INDEX IF NOT EXISTS plantillas_nombre_departamento_rol_unique
  ON plantillas_onboarding (nombre, departamento_id, rol_destino)
  WHERE deleted_at IS NULL;

-- Procesos: avoid duplicating same plantilla/empleado/fecha when active
CREATE UNIQUE INDEX IF NOT EXISTS procesos_empleado_plantilla_fecha_unique
  ON procesos_onboarding (empleado_id, plantilla_id, fecha_inicio)
  WHERE deleted_at IS NULL;

-- Tareas: unique order within proyecto
CREATE UNIQUE INDEX IF NOT EXISTS tareas_proyecto_orden_unique
  ON tareas (proyecto_id, orden);

-- Timetracking: prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS timetracking_entry_unique
  ON timetracking (usuario_id, proyecto_id, fecha, descripcion, horas, estado, facturable);
