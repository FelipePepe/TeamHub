CREATE TABLE IF NOT EXISTS timetracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  usuario_id uuid NOT NULL REFERENCES users(id) ON DELETE restrict,
  proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE restrict,
  asignacion_id uuid REFERENCES asignaciones(id) ON DELETE set null,
  fecha date NOT NULL,
  horas numeric(4, 2) NOT NULL,
  descripcion text NOT NULL,
  facturable boolean DEFAULT true NOT NULL,
  estado time_entry_status DEFAULT 'PENDIENTE' NOT NULL,
  aprobado_por uuid REFERENCES users(id) ON DELETE set null,
  aprobado_at timestamp with time zone,
  rechazado_por uuid REFERENCES users(id) ON DELETE set null,
  rechazado_at timestamp with time zone,
  comentario_rechazo text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT timetracking_horas_check CHECK (horas > 0 AND horas <= 24)
);

CREATE INDEX IF NOT EXISTS timetracking_usuario_idx ON timetracking (usuario_id);
CREATE INDEX IF NOT EXISTS timetracking_proyecto_idx ON timetracking (proyecto_id);
CREATE INDEX IF NOT EXISTS timetracking_asignacion_idx ON timetracking (asignacion_id);
CREATE INDEX IF NOT EXISTS timetracking_fecha_idx ON timetracking (fecha);
CREATE INDEX IF NOT EXISTS timetracking_estado_idx ON timetracking (estado);
CREATE INDEX IF NOT EXISTS timetracking_usuario_fecha_idx ON timetracking (usuario_id, fecha);
CREATE INDEX IF NOT EXISTS timetracking_proyecto_fecha_idx ON timetracking (proyecto_id, fecha);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS timetracking_descripcion_trgm_idx
  ON timetracking USING gin (descripcion gin_trgm_ops);
