-- ======================================================================================
-- MIGRACIÓN FASE 13 — PARIDAD DE PRODUCCIÓN: BUSINESS PROFILE & COMPANY SERVICES
-- ======================================================================================
-- PROPÓSITO: Documentar en el repositorio el esquema REAL ya existente en producción.
-- Esta migración fue ejecutada manualmente en producción y validada el 2026-08-18.
--
-- REGLAS CRÍTICAS:
-- 1. NO ejecutar nuevamente en producción — ya está aplicada.
-- 2. Usar en entornos limpios (staging, local, CI) para alcanzar paridad.
-- 3. 100% idempotente: puede ejecutarse N veces sin errores ni pérdida de datos.
-- 4. NUNCA usa DROP TABLE, ALTER COLUMN, ni REVOKE sobre permisos ya otorgados.
-- 5. ON DELETE RESTRICT en company_services — NO CASCADE.
-- ======================================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 1: Columna business_profile en company_settings
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'company_settings'
      AND column_name  = 'business_profile'
  ) THEN
    ALTER TABLE public.company_settings
      ADD COLUMN business_profile JSONB NOT NULL DEFAULT '{}'::jsonb
      CONSTRAINT company_settings_business_profile_check
        CHECK (jsonb_typeof(business_profile) = 'object');
  END IF;
END $$;

-- Política UPDATE para business_profile (usa get_my_company_id() de producción)
DROP POLICY IF EXISTS "company_settings_update_company" ON public.company_settings;
CREATE POLICY "company_settings_update_company" ON public.company_settings
  FOR UPDATE
  TO authenticated
  USING  (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- Column-level grant: solo business_profile — no ai_identity, ai_business_rules, etc.
GRANT UPDATE (business_profile) ON public.company_settings TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTE 2: Tabla company_services
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.company_services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  BIGINT NOT NULL
              REFERENCES public.companies(id) ON DELETE RESTRICT,
  name        TEXT NOT NULL
              CONSTRAINT company_services_name_not_empty
                CHECK (char_length(trim(name)) > 0),
  description TEXT,
  price       NUMERIC(12,2)
              CONSTRAINT company_services_price_non_negative
                CHECK (price IS NULL OR price >= 0),
  currency    TEXT NOT NULL DEFAULT 'MXN',
  price_type  TEXT NOT NULL DEFAULT 'fixed'
              CHECK (price_type IN ('fixed', 'from', 'quote', 'free')),
  category    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb
              CONSTRAINT company_services_metadata_object
                CHECK (jsonb_typeof(metadata) = 'object'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT company_services_price_rules CHECK (
    (price_type IN ('fixed', 'from') AND price IS NOT NULL) OR
    (price_type IN ('quote', 'free')  AND price IS NULL)
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_company_services_company_active
  ON public.company_services(company_id, is_active);

CREATE INDEX IF NOT EXISTS idx_company_services_company_category
  ON public.company_services(company_id, category);

-- RLS
ALTER TABLE public.company_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_services_select_company" ON public.company_services;
CREATE POLICY "company_services_select_company" ON public.company_services
  FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "company_services_insert_company" ON public.company_services;
CREATE POLICY "company_services_insert_company" ON public.company_services
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "company_services_update_company" ON public.company_services;
CREATE POLICY "company_services_update_company" ON public.company_services
  FOR UPDATE TO authenticated
  USING  (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

-- Grants (SELECT, INSERT, UPDATE — sin DELETE)
REVOKE ALL ON TABLE public.company_services FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.company_services TO authenticated;

-- Función del trigger (nombre exacto de producción)
CREATE OR REPLACE FUNCTION public.handle_company_services_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger (nombre exacto de producción)
DROP TRIGGER IF EXISTS set_company_services_updated_at ON public.company_services;
CREATE TRIGGER set_company_services_updated_at
  BEFORE UPDATE ON public.company_services
  FOR EACH ROW EXECUTE FUNCTION public.handle_company_services_updated_at();

NOTIFY pgrst, 'reload schema';
