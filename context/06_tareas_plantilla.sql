CREATE TABLE IF NOT EXISTS tareas_plantilla (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  plantilla_id uuid NOT NULL REFERENCES plantillas_onboarding(id) ON DELETE cascade,
  titulo varchar(200) NOT NULL,
  descripcion text,
  categoria task_category NOT NULL,
  responsable_tipo responsible_type NOT NULL,
  responsable_id uuid REFERENCES users(id) ON DELETE set null,
  dias_desde_inicio integer DEFAULT 0 NOT NULL,
  duracion_estimada_horas numeric(5, 2),
  orden integer NOT NULL,
  obligatoria boolean DEFAULT true NOT NULL,
  requiere_evidencia boolean DEFAULT false NOT NULL,
  instrucciones text,
  recursos_url text[],
  dependencias uuid[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS tareas_plantilla_plantilla_idx ON tareas_plantilla (plantilla_id);
CREATE INDEX IF NOT EXISTS tareas_plantilla_categoria_idx ON tareas_plantilla (categoria);
CREATE INDEX IF NOT EXISTS tareas_plantilla_orden_idx ON tareas_plantilla (plantilla_id, orden);
