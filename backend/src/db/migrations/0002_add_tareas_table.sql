-- Create enums for tareas
DO $$ BEGIN
  CREATE TYPE "estado_tarea" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "prioridad_tarea" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create tareas table
CREATE TABLE IF NOT EXISTS "tareas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "proyecto_id" uuid NOT NULL REFERENCES "proyectos"("id") ON DELETE CASCADE,
  "titulo" text NOT NULL,
  "descripcion" text,
  "estado" "estado_tarea" DEFAULT 'TODO' NOT NULL,
  "prioridad" "prioridad_tarea" DEFAULT 'MEDIUM' NOT NULL,
  "usuario_asignado_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "fecha_inicio" timestamp with time zone,
  "fecha_fin" timestamp with time zone,
  "horas_estimadas" text,
  "horas_reales" text,
  "orden" text DEFAULT '0' NOT NULL,
  "depende_de" uuid REFERENCES "tareas"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_tareas_proyecto" ON "tareas"("proyecto_id");
CREATE INDEX IF NOT EXISTS "idx_tareas_usuario" ON "tareas"("usuario_asignado_id");
CREATE INDEX IF NOT EXISTS "idx_tareas_estado" ON "tareas"("estado");
CREATE INDEX IF NOT EXISTS "idx_tareas_deleted" ON "tareas"("deleted_at");
