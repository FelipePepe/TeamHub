CREATE TABLE IF NOT EXISTS plantillas_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  nombre varchar(150) NOT NULL,
  descripcion text,
  departamento_id uuid REFERENCES departamentos(id) ON DELETE set null,
  rol_destino user_role,
  duracion_estimada_dias integer,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE restrict,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS plantillas_departamento_idx ON plantillas_onboarding (departamento_id);
CREATE INDEX IF NOT EXISTS plantillas_rol_destino_idx ON plantillas_onboarding (rol_destino);
CREATE INDEX IF NOT EXISTS plantillas_created_by_idx ON plantillas_onboarding (created_by);
CREATE INDEX IF NOT EXISTS plantillas_deleted_at_idx ON plantillas_onboarding (deleted_at);
