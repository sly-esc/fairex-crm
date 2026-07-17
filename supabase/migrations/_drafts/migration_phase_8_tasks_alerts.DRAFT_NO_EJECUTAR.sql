-- ======================================================================================
-- MIGRACIÓN FASE 8 — Extensión de Tasks y Alerts
-- ======================================================================================
-- Objetivo: Completar la estructura de las tablas `tasks` y `notifications` que ya
-- existen desde la migración 0001, añadiendo los campos necesarios para soportar
-- el modelo completo de tareas y alertas del sistema FAIREX SaaS.
--
-- REGLAS INAMOVIBLES:
-- 1. Solo ADD COLUMN IF NOT EXISTS — NUNCA ALTER COLUMN o DROP COLUMN.
-- 2. No se modifica ninguna política RLS existente.
-- 3. Migración 100% idempotente: puede ejecutarse N veces sin errores.
-- 4. Cero impacto sobre n8n, lead_memory o n8n_chat_histories.
-- 5. Cero impacto sobre el Dashboard del cliente actual.
-- ======================================================================================

DO $$
BEGIN

    -- ==================================================================================
    -- 1. EXTENSIÓN DE TABLA: tasks
    -- ==================================================================================
    -- Ya existe desde 0001_fairex_v2_init.sql con: id, company_id, title, description,
    -- assigned_to, lead_id, status, priority, due_date, created_at.
    -- Extendemos con los campos adicionales aprobados.
    -- ==================================================================================

    -- created_by: quién creó la tarea (agente o sistema)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE tasks ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- completed_at: timestamp exacto de completado (distinto de status='completed')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    -- updated_at: para tracking de ediciones
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- type: clasificación de la tarea ('followup', 'call', 'meeting', 'email', 'manual', 'system')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'type'
    ) THEN
        ALTER TABLE tasks ADD COLUMN type TEXT DEFAULT 'manual';
    END IF;

    -- notes: campo de texto libre para dejar observaciones en la tarea
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'notes'
    ) THEN
        ALTER TABLE tasks ADD COLUMN notes TEXT;
    END IF;

    -- metadata: JSONB flexible para futuros datos extendidos sin nuevas migraciones
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE tasks ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- ==================================================================================
    -- 2. EXTENSIÓN DE TABLA: notifications
    -- ==================================================================================
    -- Ya existe desde 0001 con: id, company_id, user_id, type, title, body, data,
    -- is_read, created_at.
    -- Renombramos conceptualmente a "alerts" en la lógica de la app pero mantenemos
    -- el nombre de tabla `notifications` para no romper nada existente.
    -- ==================================================================================

    -- source: origen de la alerta ('system', 'n8n', 'manual', 'webhook')
    -- n8n puede generar alertas vía service_role; el Dashboard solo las lee.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'source'
    ) THEN
        ALTER TABLE notifications ADD COLUMN source TEXT DEFAULT 'system';
    END IF;

    -- severity: nivel de urgencia ('info', 'warning', 'error', 'critical')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'severity'
    ) THEN
        ALTER TABLE notifications ADD COLUMN severity TEXT DEFAULT 'info';
    END IF;

    -- lead_id: referencia opcional al lead relacionado con la alerta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'lead_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN lead_id TEXT;
        -- TEXT en lugar de FK porque lead_memory puede usar int8 histórico o UUID según versión.
        -- La integridad referencial se mantiene en la capa de aplicación (Next.js).
    END IF;

    -- read_at: timestamp exacto de lectura (distinto del booleano is_read)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'read_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMPTZ;
    END IF;

    -- action_url: ruta interna a la que debe navegar el usuario al hacer click
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'action_url'
    ) THEN
        ALTER TABLE notifications ADD COLUMN action_url TEXT;
    END IF;

    -- expires_at: las alertas informativas pueden tener TTL automático
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;

END $$;


-- ======================================================================================
-- 3. ÍNDICES DE RENDIMIENTO (idempotentes)
-- ======================================================================================
-- Solo se crean si no existen. No afectan tablas existentes.

CREATE INDEX IF NOT EXISTS idx_tasks_company_id       ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to      ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id          ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status           ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date         ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_source     ON notifications(source);


-- ======================================================================================
-- 4. RLS — Solo sobre tablas nuevas / políticas no existentes
-- ======================================================================================
-- NOTA: No se altera ninguna política RLS previamente definida.
-- Se usa DROP POLICY IF EXISTS + CREATE POLICY para garantizar idempotencia.
-- ======================================================================================

-- 4.1 RLS tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select_company" ON tasks;
CREATE POLICY "tasks_select_company" ON tasks
    FOR SELECT TO authenticated
    USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "tasks_insert_company" ON tasks;
CREATE POLICY "tasks_insert_company" ON tasks
    FOR INSERT TO authenticated
    WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "tasks_update_company" ON tasks;
CREATE POLICY "tasks_update_company" ON tasks
    FOR UPDATE TO authenticated
    USING (company_id = public.get_my_company_id())
    WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "tasks_delete_company" ON tasks;
CREATE POLICY "tasks_delete_company" ON tasks
    FOR DELETE TO authenticated
    USING (company_id = public.get_my_company_id());


-- 4.2 RLS notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_company" ON notifications;
CREATE POLICY "notifications_select_company" ON notifications
    FOR SELECT TO authenticated
    USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "notifications_update_read" ON notifications;
CREATE POLICY "notifications_update_read" ON notifications
    FOR UPDATE TO authenticated
    USING (company_id = public.get_my_company_id())
    WITH CHECK (company_id = public.get_my_company_id());

-- INSERT solo por service_role (sistema y n8n). El Dashboard nunca crea alertas directamente.
-- No se define política INSERT para authenticated intencionalmente (Zero Trust).
