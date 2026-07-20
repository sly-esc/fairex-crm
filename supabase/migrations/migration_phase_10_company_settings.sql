-- ======================================================================================
-- MIGRACIÓN FASE 10: COMPANY SETTINGS (IA & CONFIGURACIÓN GLOBAL)
-- ======================================================================================

-- 1. Crear la tabla (Idempotente)
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    UNIQUE(company_id),
    
    -- Configuración IA
    ai_identity TEXT,
    ai_business_rules TEXT,
    ai_commercial_style TEXT,
    ai_constraints TEXT,
    ai_knowledge_sources JSONB NOT NULL DEFAULT '[]'::jsonb 
        CHECK (jsonb_typeof(ai_knowledge_sources) = 'array'),
    
    -- Metadatos
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para authenticated (usuarios normales del Dashboard Cliente)
-- SELECT: Solo ver settings de su empresa
DROP POLICY IF EXISTS "company_settings_select_company" ON public.company_settings;
CREATE POLICY "company_settings_select_company" ON public.company_settings
    FOR SELECT 
    TO authenticated
    USING (company_id = public.get_my_company_id());

-- 4. Permisos explícitos (Grants y Revocaciones)
REVOKE ALL PRIVILEGES ON TABLE public.company_settings FROM authenticated;
GRANT SELECT ON TABLE public.company_settings TO authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.company_settings FROM anon;

-- 5. Trigger y Función autosuficiente para updated_at
CREATE OR REPLACE FUNCTION public.handle_company_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_company_settings_updated_at ON public.company_settings;
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_company_settings_updated_at();

-- 6. Recarga del schema de PostgREST
NOTIFY pgrst, 'reload schema';
