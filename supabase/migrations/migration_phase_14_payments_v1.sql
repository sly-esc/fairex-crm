-- ======================================================================================
-- MIGRACIÓN FASE 14 — PAGOS V1
-- ======================================================================================
-- Propósito: Crear las tablas base para configuración bancaria por empresa (company_payment_settings)
--            y registro manual de pagos confirmados (payments).
--
-- REGLAS INAMOVIBLES:
-- 1. company_id BIGINT — coincide exactamente con companies.id en producción.
-- 2. lead_session_id TEXT — referencia natural al lead_memory.id (tipo int8 histórico/dinámico).
--    La FK real se mantiene en la capa de aplicación. Sin FK de DB deliberadamente.
-- 3. Migración 100% idempotente: puede ejecutarse N veces sin errores.
-- 4. Grants determinísticos: se revoca primero a anon y authenticated antes de conceder
--    permisos por columna, para neutralizar cualquier DEFAULT PRIVILEGE previo de Supabase.
-- 5. ON DELETE RESTRICT en company_payment_settings — nunca CASCADE.
-- 6. Pagos confirmados son inmutables: sin UPDATE general en authenticated.
-- 7. Sin DELETE para authenticated en ninguna de las dos tablas.
-- ======================================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 1: company_payment_settings
-- Configuración bancaria/de cobro por empresa. Relación 1:1 con companies.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.company_payment_settings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id     BIGINT NOT NULL
                   REFERENCES public.companies(id) ON DELETE RESTRICT,
    bank_name      TEXT NOT NULL
                   CONSTRAINT cps_bank_name_not_empty
                   CHECK (char_length(trim(bank_name)) > 0),
    account_holder TEXT NOT NULL
                   CONSTRAINT cps_account_holder_not_empty
                   CHECK (char_length(trim(account_holder)) > 0),
    clabe          TEXT,
    account_number TEXT,
    instructions   TEXT,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Una sola fila de configuración por empresa
    CONSTRAINT cps_unique_company UNIQUE (company_id),

    -- Cuando la configuración está activa, debe existir al menos CLABE o número de cuenta.
    -- Si está inactiva, no se exige (podría estar incompleta temporalmente).
    CONSTRAINT cps_active_requires_account CHECK (
        is_active = false
        OR (clabe IS NOT NULL AND char_length(trim(clabe)) > 0)
        OR (account_number IS NOT NULL AND char_length(trim(account_number)) > 0)
    )
);

-- Índice de rendimiento
CREATE INDEX IF NOT EXISTS idx_cps_company_id
    ON public.company_payment_settings(company_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_company_payment_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_cps_updated_at ON public.company_payment_settings;
CREATE TRIGGER set_cps_updated_at
    BEFORE UPDATE ON public.company_payment_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_company_payment_settings_updated_at();

-- RLS
ALTER TABLE public.company_payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cps_select_company" ON public.company_payment_settings;
CREATE POLICY "cps_select_company" ON public.company_payment_settings
    FOR SELECT TO authenticated
    USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "cps_insert_company" ON public.company_payment_settings;
CREATE POLICY "cps_insert_company" ON public.company_payment_settings
    FOR INSERT TO authenticated
    WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "cps_update_company" ON public.company_payment_settings;
CREATE POLICY "cps_update_company" ON public.company_payment_settings
    FOR UPDATE TO authenticated
    USING  (company_id = public.get_my_company_id())
    WITH CHECK (company_id = public.get_my_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- GRANTS company_payment_settings
-- Revocar primero para neutralizar DEFAULT PRIVILEGES previos de Supabase.
-- Columnas de sistema excluidas del UPDATE (id, company_id, created_at, updated_at).
-- updated_at es responsabilidad del trigger set_cps_updated_at, nunca del cliente.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON TABLE public.company_payment_settings FROM anon;
REVOKE ALL ON TABLE public.company_payment_settings FROM authenticated;
REVOKE ALL ON TABLE public.company_payment_settings FROM service_role;

-- authenticated y service_role: solo columnas de negocio
GRANT SELECT ON TABLE public.company_payment_settings TO authenticated, service_role;
GRANT INSERT (company_id, bank_name, account_holder, clabe, account_number, instructions, is_active)
    ON TABLE public.company_payment_settings TO authenticated, service_role;
GRANT UPDATE (bank_name, account_holder, clabe, account_number, instructions, is_active)
    ON TABLE public.company_payment_settings TO authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 2: payments
-- Historial de pagos confirmados manualmente. Inmutables tras su registro.
-- La única transición permitida en V1 es confirmed → cancelled.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Multiempresa estricta
    company_id     BIGINT NOT NULL
                   REFERENCES public.companies(id) ON DELETE RESTRICT,

    -- lead_session_id TEXT — identificador funcional estable de la sesión/lead
    -- utilizado por el CRM y n8n.
    -- Se mantiene sin FK de base de datos deliberadamente para desacoplar
    -- payments de la estructura interna de lead_memory.
    lead_session_id TEXT NOT NULL
                   CONSTRAINT payments_lead_session_id_not_empty
                   CHECK (char_length(trim(lead_session_id)) > 0),

    -- Servicio relacionado (opcional — el pago puede ser por un concepto libre)
    service_id     UUID
                   REFERENCES public.company_services(id) ON DELETE SET NULL,

    -- Descripción del cobro
    concept        TEXT NOT NULL
                   CONSTRAINT payments_concept_not_empty
                   CHECK (char_length(trim(concept)) > 0),

    -- Monto positivo obligatorio
    amount         NUMERIC(12,2) NOT NULL
                   CONSTRAINT payments_amount_positive CHECK (amount > 0),

    currency       TEXT NOT NULL DEFAULT 'MXN'
                   CONSTRAINT payments_currency_not_empty
                   CHECK (char_length(trim(currency)) > 0),

    -- Solo dos estados en V1: confirmado o cancelado
    status         TEXT NOT NULL DEFAULT 'confirmed'
                   CONSTRAINT payments_status_valid
                   CHECK (status IN ('confirmed', 'cancelled')),

    -- Metadatos de confirmación (fijados en servidor, nunca desde formulario)
    confirmed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_by   UUID
                   REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Campos de cancelación (nulos mientras el pago esté confirmado)
    cancelled_at   TIMESTAMPTZ,
    cancelled_by   UUID
                   REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Notas opcionales del operador
    notes          TEXT,

    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    -- Sin updated_at: los pagos son inmutables tras su creación.
    -- La cancelación se refleja en status/cancelled_at, no en un UPDATE general.
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_company_lead
    ON public.payments(company_id, lead_session_id);

CREATE INDEX IF NOT EXISTS idx_payments_company_service
    ON public.payments(company_id, service_id);

CREATE INDEX IF NOT EXISTS idx_payments_company_status
    ON public.payments(company_id, status);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_company" ON public.payments;
CREATE POLICY "payments_select_company" ON public.payments
    FOR SELECT TO authenticated
    USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "payments_insert_company" ON public.payments;
CREATE POLICY "payments_insert_company" ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Tenant: solo puede insertar en su propia empresa
        company_id   = public.get_my_company_id()
        -- Estado inicial obligatorio: solo se pueden crear pagos confirmados
        AND status       = 'confirmed'
        -- El operador debe ser el propio usuario autenticado
        AND confirmed_by = auth.uid()
        -- Campos de cancelación deben estar vacíos al crear
        AND cancelled_at IS NULL
        AND cancelled_by IS NULL
        -- Anti cross-tenant: si se proporciona service_id, debe pertenecer
        -- exactamente a la misma empresa del pago. Nunca un servicio de otro tenant.
        AND (
            service_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.company_services cs
                WHERE cs.id         = service_id
                  AND cs.company_id = public.get_my_company_id()
            )
        )
    );

-- UPDATE restringido: solo permite la transición confirmed → cancelled.
-- USING:      el pago debe pertenecer al tenant Y estar actualmente confirmado.
-- WITH CHECK: la fila resultante debe estar cancelada, con cancelled_by = usuario actual,
--             cancelled_at rellenado, y el tenant no modificado.
-- Efectos garantizados:
--   confirmed → cancelled  ✅
--   cancelled → confirmed  ❌  (USING rechaza la fila porque status ≠ 'confirmed')
--   cancelled → cancelled  ❌  (USING rechaza la fila porque status ≠ 'confirmed')
--   otra empresa            ❌  (USING rechaza por company_id)
--   cancelled_by de otro    ❌  (WITH CHECK rechaza porque cancelled_by ≠ auth.uid())
DROP POLICY IF EXISTS "payments_cancel_company" ON public.payments;
CREATE POLICY "payments_cancel_company" ON public.payments
    FOR UPDATE TO authenticated
    USING (
        company_id = public.get_my_company_id()
        AND status = 'confirmed'
    )
    WITH CHECK (
        company_id   = public.get_my_company_id()
        AND status       = 'cancelled'
        AND cancelled_by = auth.uid()
        AND cancelled_at IS NOT NULL
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- GRANTS payments
-- Revocar primero para neutralizar DEFAULT PRIVILEGES previos de Supabase.
-- INSERT: solo columnas de negocio; los campos de sistema (id, status, confirmed_at,
--         cancelled_at, cancelled_by, created_at) se poblan vía DEFAULT.
-- UPDATE: únicamente las cuatro columnas del flujo de cancelación.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON TABLE public.payments FROM anon;
REVOKE ALL ON TABLE public.payments FROM authenticated;
REVOKE ALL ON TABLE public.payments FROM service_role;

-- authenticated y service_role: solo columnas de negocio
GRANT SELECT ON TABLE public.payments TO authenticated, service_role;
GRANT INSERT (company_id, lead_session_id, service_id, concept, amount, currency, confirmed_by, notes)
    ON TABLE public.payments TO authenticated, service_role;
GRANT UPDATE (status, cancelled_at, cancelled_by, notes) ON TABLE public.payments TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
