-- ============================================================================
-- TEAMHUB DATABASE TRIGGERS
-- ============================================================================
-- Este archivo contiene todos los triggers de la base de datos.
-- Ejecutar después de las migraciones de Drizzle.
-- ============================================================================

-- ============================================================================
-- 1. TRIGGER: updated_at automático
-- ============================================================================
-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_updated_at ON %I;
            CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_updated_at();
        ', t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. TRIGGER: Auditoría global
-- ============================================================================
-- Variable de sesión para el usuario actual (se establece desde la aplicación)
-- SET LOCAL app.current_user_id = 'uuid-del-usuario';
-- SET LOCAL app.current_user_email = 'email@example.com';
-- SET LOCAL app.client_ip = '192.168.1.1';
-- SET LOCAL app.user_agent = 'Mozilla/5.0...';

CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_data jsonb;
    new_data jsonb;
    changed_fields text[];
    record_id uuid;
    current_user_id uuid;
    current_user_email text;
    client_ip text;
    user_agent_val text;
    key text;
BEGIN
    -- Obtener contexto de la sesión (establecido por la aplicación)
    BEGIN
        current_user_id := current_setting('app.current_user_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;

    BEGIN
        current_user_email := current_setting('app.current_user_email', true);
    EXCEPTION WHEN OTHERS THEN
        current_user_email := NULL;
    END;

    BEGIN
        client_ip := current_setting('app.client_ip', true);
    EXCEPTION WHEN OTHERS THEN
        client_ip := NULL;
    END;

    BEGIN
        user_agent_val := current_setting('app.user_agent', true);
    EXCEPTION WHEN OTHERS THEN
        user_agent_val := NULL;
    END;

    -- Determinar datos según operación
    IF TG_OP = 'INSERT' THEN
        new_data := to_jsonb(NEW);
        old_data := NULL;
        record_id := NEW.id;
        changed_fields := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        record_id := NEW.id;

        -- Calcular campos cambiados
        changed_fields := ARRAY[]::text[];
        FOR key IN SELECT jsonb_object_keys(new_data)
        LOOP
            IF old_data->key IS DISTINCT FROM new_data->key THEN
                changed_fields := array_append(changed_fields, key);
            END IF;
        END LOOP;

        -- No auditar si solo cambió updated_at
        IF changed_fields = ARRAY['updated_at']::text[] THEN
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
        record_id := OLD.id;
        changed_fields := NULL;
    END IF;

    -- Excluir campos sensibles del log
    IF old_data IS NOT NULL THEN
        old_data := old_data - 'password_hash' - 'mfa_secret' - 'mfa_recovery_codes' - 'token_hash';
    END IF;
    IF new_data IS NOT NULL THEN
        new_data := new_data - 'password_hash' - 'mfa_secret' - 'mfa_recovery_codes' - 'token_hash';
    END IF;

    -- Insertar en audit_log
    INSERT INTO audit_log (
        table_name,
        record_id,
        operation,
        usuario_id,
        usuario_email,
        old_data,
        new_data,
        changed_fields,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME,
        record_id,
        TG_OP::audit_operation,
        current_user_id,
        current_user_email,
        old_data,
        new_data,
        changed_fields,
        client_ip,
        user_agent_val
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auditoría a todas las tablas (excepto audit_log)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != 'audit_log'
        AND table_name NOT LIKE 'drizzle%'  -- Excluir tablas internas de Drizzle
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS audit_trigger ON %I;
            CREATE TRIGGER audit_trigger
            AFTER INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION trigger_audit_log();
        ', t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. TRIGGER: Actualizar horas_consumidas en proyectos
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_update_proyecto_horas()
RETURNS TRIGGER AS $$
DECLARE
    proyecto_id_val uuid;
    total_horas decimal(10, 2);
BEGIN
    -- Determinar el proyecto afectado
    IF TG_OP = 'DELETE' THEN
        proyecto_id_val := OLD.proyecto_id;
    ELSE
        proyecto_id_val := NEW.proyecto_id;
    END IF;

    -- Si hubo cambio de proyecto en UPDATE, actualizar ambos
    IF TG_OP = 'UPDATE' AND OLD.proyecto_id != NEW.proyecto_id THEN
        -- Actualizar proyecto anterior
        SELECT COALESCE(SUM(horas), 0) INTO total_horas
        FROM timetracking
        WHERE proyecto_id = OLD.proyecto_id
        AND estado = 'APROBADO';

        UPDATE proyectos
        SET horas_consumidas = total_horas
        WHERE id = OLD.proyecto_id;
    END IF;

    -- Calcular total de horas aprobadas para el proyecto
    SELECT COALESCE(SUM(horas), 0) INTO total_horas
    FROM timetracking
    WHERE proyecto_id = proyecto_id_val
    AND estado = 'APROBADO';

    -- Actualizar el proyecto
    UPDATE proyectos
    SET horas_consumidas = total_horas
    WHERE id = proyecto_id_val;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a timetracking
DROP TRIGGER IF EXISTS update_proyecto_horas ON timetracking;
CREATE TRIGGER update_proyecto_horas
AFTER INSERT OR UPDATE OR DELETE ON timetracking
FOR EACH ROW
EXECUTE FUNCTION trigger_update_proyecto_horas();

-- ============================================================================
-- 4. TRIGGER: Calcular progreso de proceso de onboarding
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_update_proceso_progreso()
RETURNS TRIGGER AS $$
DECLARE
    proceso_id_val uuid;
    total_tareas integer;
    tareas_completadas integer;
    nuevo_progreso decimal(5, 2);
BEGIN
    -- Determinar el proceso afectado
    IF TG_OP = 'DELETE' THEN
        proceso_id_val := OLD.proceso_id;
    ELSE
        proceso_id_val := NEW.proceso_id;
    END IF;

    -- Contar tareas totales y completadas
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE estado = 'COMPLETADA')
    INTO total_tareas, tareas_completadas
    FROM tareas_onboarding
    WHERE proceso_id = proceso_id_val;

    -- Calcular progreso
    IF total_tareas > 0 THEN
        nuevo_progreso := (tareas_completadas::decimal / total_tareas::decimal) * 100;
    ELSE
        nuevo_progreso := 0;
    END IF;

    -- Actualizar proceso
    UPDATE procesos_onboarding
    SET
        progreso = nuevo_progreso,
        -- Auto-completar si todas las tareas están completadas
        estado = CASE
            WHEN nuevo_progreso = 100 AND estado = 'EN_CURSO' THEN 'COMPLETADO'::process_status
            ELSE estado
        END,
        fecha_fin_real = CASE
            WHEN nuevo_progreso = 100 AND estado = 'EN_CURSO' THEN CURRENT_DATE
            ELSE fecha_fin_real
        END
    WHERE id = proceso_id_val;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tareas_onboarding
DROP TRIGGER IF EXISTS update_proceso_progreso ON tareas_onboarding;
CREATE TRIGGER update_proceso_progreso
AFTER INSERT OR UPDATE OF estado OR DELETE ON tareas_onboarding
FOR EACH ROW
EXECUTE FUNCTION trigger_update_proceso_progreso();

-- ============================================================================
-- 5. CONSTRAINT: FK circular users.departamento_id -> departamentos
-- ============================================================================
-- Nota: Esta FK se añade después de crear ambas tablas
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
        ON DELETE SET NULL;
    END IF;
END;
$$;

-- ============================================================================
-- 6. CONSTRAINT: FK circular users.manager_id -> users
-- ============================================================================
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
        ON DELETE SET NULL;
    END IF;
END;
$$;

-- ============================================================================
-- 7. INDEX: Búsqueda de texto en descripción de timetracking
-- ============================================================================
-- Crear extensión para búsqueda de texto (si no existe)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice para búsqueda de texto en descripción
CREATE INDEX IF NOT EXISTS timetracking_descripcion_trgm_idx
ON timetracking USING gin (descripcion gin_trgm_ops);

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================
COMMENT ON FUNCTION trigger_set_updated_at() IS
'Actualiza automáticamente el campo updated_at antes de cada UPDATE';

COMMENT ON FUNCTION trigger_audit_log() IS
'Registra todas las operaciones (INSERT, UPDATE, DELETE) en la tabla audit_log.
Excluye campos sensibles como passwords y tokens.
Usa variables de sesión app.current_user_id, app.current_user_email, app.client_ip, app.user_agent';

COMMENT ON FUNCTION trigger_update_proyecto_horas() IS
'Actualiza automáticamente horas_consumidas en proyectos cuando cambian registros de timetracking';

COMMENT ON FUNCTION trigger_update_proceso_progreso() IS
'Calcula y actualiza el progreso del proceso de onboarding basado en tareas completadas.
Auto-completa el proceso cuando todas las tareas están completadas.';
