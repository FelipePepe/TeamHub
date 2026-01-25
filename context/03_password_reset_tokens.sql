CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  usuario_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
  token_hash varchar(255) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_usuario_idx ON password_reset_tokens (usuario_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_hash_idx ON password_reset_tokens (token_hash);
