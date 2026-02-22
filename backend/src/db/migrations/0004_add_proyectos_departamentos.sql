-- Migration: Add proyectos_departamentos table (N:M Projects <-> Departments)
-- Run manually since drizzle-kit CLI has compatibility issues with Node.js 25

CREATE TABLE IF NOT EXISTS proyectos_departamentos (
  proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  departamento_id uuid NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (proyecto_id, departamento_id)
);

CREATE INDEX IF NOT EXISTS proyectos_departamentos_proyecto_idx
  ON proyectos_departamentos (proyecto_id);

CREATE INDEX IF NOT EXISTS proyectos_departamentos_departamento_idx
  ON proyectos_departamentos (departamento_id);
