CREATE TABLE IF NOT EXISTS tareas_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  proceso_id uuid NOT NULL REFERENCES procesos_onboarding(id) ON DELETE cascade,
  tarea_plantilla_id uuid REFERENCES tareas_plantilla(id) ON DELETE set null,
  titulo varchar(200) NOT NULL,
  descripcion text,
  categoria task_category NOT NULL,
  responsable_id uuid NOT NULL REFERENCES users(id) ON DELETE restrict,
  fecha_limite date,
  estado task_status DEFAULT 'PENDIENTE' NOT NULL,
  prioridad priority DEFAULT 'MEDIA' NOT NULL,
  completada_at timestamp with time zone,
  completada_por uuid REFERENCES users(id) ON DELETE set null,
  notas text,
  evidencia_url varchar(500),
  comentarios_rechazo text,
  orden integer NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS tareas_onboarding_proceso_idx ON tareas_onboarding (proceso_id);
CREATE INDEX IF NOT EXISTS tareas_onboarding_responsable_idx ON tareas_onboarding (responsable_id);
CREATE INDEX IF NOT EXISTS tareas_onboarding_estado_idx ON tareas_onboarding (estado);
CREATE INDEX IF NOT EXISTS tareas_onboarding_fecha_limite_idx ON tareas_onboarding (fecha_limite);
CREATE INDEX IF NOT EXISTS tareas_onboarding_orden_idx ON tareas_onboarding (proceso_id, orden);
