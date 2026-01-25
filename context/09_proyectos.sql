CREATE TABLE IF NOT EXISTS proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  nombre varchar(150) NOT NULL,
  codigo varchar(20) NOT NULL,
  descripcion text,
  cliente varchar(150),
  fecha_inicio date,
  fecha_fin_estimada date,
  fecha_fin_real date,
  estado project_status DEFAULT 'PLANIFICACION' NOT NULL,
  manager_id uuid NOT NULL REFERENCES users(id) ON DELETE restrict,
  presupuesto_horas numeric(10, 2),
  horas_consumidas numeric(10, 2) DEFAULT '0' NOT NULL,
  prioridad priority DEFAULT 'MEDIA' NOT NULL,
  color varchar(7),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone,
  CONSTRAINT proyectos_codigo_unique UNIQUE (codigo)
);

CREATE UNIQUE INDEX IF NOT EXISTS proyectos_codigo_idx ON proyectos (codigo);
CREATE INDEX IF NOT EXISTS proyectos_manager_idx ON proyectos (manager_id);
CREATE INDEX IF NOT EXISTS proyectos_estado_idx ON proyectos (estado);
CREATE INDEX IF NOT EXISTS proyectos_cliente_idx ON proyectos (cliente);
CREATE INDEX IF NOT EXISTS proyectos_deleted_at_idx ON proyectos (deleted_at);
