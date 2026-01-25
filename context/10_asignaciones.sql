CREATE TABLE IF NOT EXISTS asignaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE cascade,
  usuario_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
  rol varchar(100),
  dedicacion_porcentaje numeric(5, 2),
  horas_semanales numeric(5, 2),
  fecha_inicio date NOT NULL,
  fecha_fin date,
  notas text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone,
  CONSTRAINT asignaciones_proyecto_usuario_fecha_unique UNIQUE (proyecto_id, usuario_id, fecha_inicio)
);

CREATE INDEX IF NOT EXISTS asignaciones_proyecto_idx ON asignaciones (proyecto_id);
CREATE INDEX IF NOT EXISTS asignaciones_usuario_idx ON asignaciones (usuario_id);
CREATE INDEX IF NOT EXISTS asignaciones_fecha_inicio_idx ON asignaciones (fecha_inicio);
CREATE INDEX IF NOT EXISTS asignaciones_deleted_at_idx ON asignaciones (deleted_at);
