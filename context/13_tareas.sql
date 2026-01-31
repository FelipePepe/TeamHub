-- ============================================================================
-- TABLA: tareas
-- Descripción: Tareas de proyectos con soporte para diagramas Gantt
-- ============================================================================

CREATE TABLE IF NOT EXISTS tareas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relación con proyecto (obligatoria)
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,

    -- Información básica
    titulo TEXT NOT NULL,
    descripcion TEXT,

    -- Estado y prioridad
    estado estado_tarea NOT NULL DEFAULT 'TODO',
    prioridad prioridad_tarea NOT NULL DEFAULT 'MEDIUM',

    -- Asignación (opcional)
    usuario_asignado_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Fechas para Gantt
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,

    -- Estimación de horas
    horas_estimadas TEXT,  -- Numeric como text para precisión
    horas_reales TEXT,     -- Numeric como text para precisión

    -- Orden para visualización en Gantt
    orden TEXT NOT NULL DEFAULT '0',

    -- Dependencia (tarea padre - auto-referencia para jerarquía)
    depende_de UUID REFERENCES tareas(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE  -- Soft delete
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_tareas_proyecto ON tareas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_usuario ON tareas(usuario_asignado_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_depende ON tareas(depende_de);
CREATE INDEX IF NOT EXISTS idx_tareas_deleted ON tareas(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRANSICIONES DE ESTADO VÁLIDAS:
-- TODO        → IN_PROGRESS, BLOCKED
-- IN_PROGRESS → REVIEW, BLOCKED, TODO
-- REVIEW      → DONE, IN_PROGRESS
-- DONE        → IN_PROGRESS (reabrir)
-- BLOCKED     → TODO, IN_PROGRESS
-- ============================================================================
