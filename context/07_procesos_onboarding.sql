CREATE TABLE IF NOT EXISTS procesos_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  empleado_id uuid NOT NULL REFERENCES users(id) ON DELETE restrict,
  plantilla_id uuid NOT NULL REFERENCES plantillas_onboarding(id) ON DELETE restrict,
  fecha_inicio date NOT NULL,
  fecha_fin_esperada date,
  fecha_fin_real date,
  estado process_status DEFAULT 'EN_CURSO' NOT NULL,
  progreso numeric(5, 2) DEFAULT '0' NOT NULL,
  notas text,
  iniciado_por uuid REFERENCES users(id) ON DELETE set null,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS procesos_empleado_idx ON procesos_onboarding (empleado_id);
CREATE INDEX IF NOT EXISTS procesos_plantilla_idx ON procesos_onboarding (plantilla_id);
CREATE INDEX IF NOT EXISTS procesos_estado_idx ON procesos_onboarding (estado);
CREATE INDEX IF NOT EXISTS procesos_fecha_inicio_idx ON procesos_onboarding (fecha_inicio);
CREATE INDEX IF NOT EXISTS procesos_iniciado_por_idx ON procesos_onboarding (iniciado_por);
CREATE INDEX IF NOT EXISTS procesos_deleted_at_idx ON procesos_onboarding (deleted_at);
