CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  email varchar(255) NOT NULL,
  password_hash varchar(255) NOT NULL,
  nombre varchar(100) NOT NULL,
  apellidos varchar(100),
  rol user_role DEFAULT 'EMPLEADO' NOT NULL,
  departamento_id uuid,
  manager_id uuid,
  avatar_url varchar(500),
  ultimo_acceso timestamp with time zone,
  password_temporal boolean DEFAULT false NOT NULL,
  mfa_enabled boolean DEFAULT false NOT NULL,
  mfa_secret varchar(255),
  mfa_recovery_codes text[],
  failed_login_attempts integer DEFAULT 0 NOT NULL,
  locked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone,
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_departamento_idx ON users (departamento_id);
CREATE INDEX IF NOT EXISTS users_manager_idx ON users (manager_id);
CREATE INDEX IF NOT EXISTS users_rol_idx ON users (rol);
CREATE INDEX IF NOT EXISTS users_deleted_at_idx ON users (deleted_at);
