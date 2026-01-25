CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  table_name varchar(100) NOT NULL,
  record_id uuid NOT NULL,
  operation audit_operation NOT NULL,
  usuario_id uuid,
  usuario_email varchar(255),
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  ip_address varchar(45),
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_log_table_name_idx ON audit_log (table_name);
CREATE INDEX IF NOT EXISTS audit_log_record_id_idx ON audit_log (record_id);
CREATE INDEX IF NOT EXISTS audit_log_operation_idx ON audit_log (operation);
CREATE INDEX IF NOT EXISTS audit_log_usuario_id_idx ON audit_log (usuario_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at);
CREATE INDEX IF NOT EXISTS audit_log_table_record_idx ON audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS audit_log_usuario_created_idx ON audit_log (usuario_id, created_at);
