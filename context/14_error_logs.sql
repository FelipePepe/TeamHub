-- ============================================================================
-- ERROR_LOGS - Sistema de logging de errores
-- ============================================================================
-- Tabla para registrar todos los errores de la aplicación (frontend y backend)
-- Permite diagnóstico rápido sin depender del usuario
-- ============================================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario que experimentó el error (puede ser NULL si no está autenticado)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Origen del error: 'FRONTEND' o 'BACKEND'
  origen VARCHAR(10) NOT NULL CHECK (origen IN ('FRONTEND', 'BACKEND')),
  
  -- Nivel de severidad: 'INFO', 'WARN', 'ERROR', 'FATAL'
  nivel VARCHAR(10) NOT NULL CHECK (nivel IN ('INFO', 'WARN', 'ERROR', 'FATAL')),
  
  -- Mensaje de error legible
  mensaje TEXT NOT NULL,
  
  -- Stack trace completo (solo para debugging, nunca se muestra al usuario)
  stack_trace TEXT,
  
  -- Contexto completo del error (JSON)
  -- Frontend: { url, userAgent, viewport, route, component, props }
  -- Backend: { endpoint, method, params, query, headers, requestId }
  contexto JSONB,
  
  -- User agent del navegador
  user_agent TEXT,
  
  -- IP del cliente
  ip_address INET,
  
  -- Timestamp del error
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Flag para marcar como resuelto
  resuelto BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Notas del desarrollador sobre la solución
  notas TEXT,
  
  -- ID de Sentry para correlación (si se usa Sentry)
  sentry_event_id VARCHAR(100)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS error_logs_user_idx ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS error_logs_origen_idx ON error_logs(origen);
CREATE INDEX IF NOT EXISTS error_logs_nivel_idx ON error_logs(nivel);
CREATE INDEX IF NOT EXISTS error_logs_timestamp_idx ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS error_logs_resuelto_idx ON error_logs(resuelto);

-- Índice compuesto para búsquedas de errores no resueltos por usuario
CREATE INDEX IF NOT EXISTS error_logs_user_unresolved_idx 
  ON error_logs(user_id, resuelto, timestamp DESC) 
  WHERE resuelto = FALSE;

-- Comentarios
COMMENT ON TABLE error_logs IS 'Registro de todos los errores de la aplicación para diagnóstico rápido';
COMMENT ON COLUMN error_logs.origen IS 'Origen del error: FRONTEND o BACKEND';
COMMENT ON COLUMN error_logs.nivel IS 'Severidad: INFO, WARN, ERROR, FATAL';
COMMENT ON COLUMN error_logs.contexto IS 'Contexto completo del error en formato JSON';
COMMENT ON COLUMN error_logs.stack_trace IS 'Stack trace técnico, nunca se muestra al usuario';
COMMENT ON COLUMN error_logs.resuelto IS 'TRUE cuando el error ha sido corregido';
COMMENT ON COLUMN error_logs.sentry_event_id IS 'ID del evento en Sentry para correlación';
