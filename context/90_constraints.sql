DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_departamento_id_fkey'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_departamento_id_fkey
      FOREIGN KEY (departamento_id)
      REFERENCES departamentos(id)
      ON DELETE set null;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_manager_id_fkey'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_manager_id_fkey
      FOREIGN KEY (manager_id)
      REFERENCES users(id)
      ON DELETE set null;
  END IF;
END;
$$;
