CREATE TABLE IF NOT EXISTS departamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  nombre varchar(100) NOT NULL,
  codigo varchar(20) NOT NULL,
  descripcion text,
  responsable_id uuid REFERENCES users(id) ON DELETE set null,
  color varchar(7),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone,
  CONSTRAINT departamentos_nombre_unique UNIQUE (nombre),
  CONSTRAINT departamentos_codigo_unique UNIQUE (codigo)
);

CREATE UNIQUE INDEX IF NOT EXISTS departamentos_nombre_idx ON departamentos (nombre);
CREATE UNIQUE INDEX IF NOT EXISTS departamentos_codigo_idx ON departamentos (codigo);
CREATE INDEX IF NOT EXISTS departamentos_responsable_idx ON departamentos (responsable_id);
CREATE INDEX IF NOT EXISTS departamentos_deleted_at_idx ON departamentos (deleted_at);
