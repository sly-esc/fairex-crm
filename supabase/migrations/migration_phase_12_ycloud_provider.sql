-- ======================================================================================
-- MIGRACIÓN FASE 12: SOPORTE PARA PROVEEDOR YCLOUD Y UNICIDAD DE NÚMEROS
-- ======================================================================================

DO $$
BEGIN
    -- 1. Eliminar el constraint CHECK actual (si existe)
    ALTER TABLE public.company_integrations 
    DROP CONSTRAINT IF EXISTS company_integrations_provider_check;

    -- 2. Crear el constraint con 'ycloud' incluido
    ALTER TABLE public.company_integrations 
    ADD CONSTRAINT company_integrations_provider_check 
    CHECK (provider IN ('meta', 'rack', 'shopify', 'woocommerce', 'microsip', 'manual', 'google', 'tiktok', 'stripe', 'ycloud'));
END $$;

-- 3. Índice Único Parcial: Garantiza que un mismo número de YCloud 
-- no pueda registrarse en más de una empresa, evitando colisiones de webhooks.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_ycloud_provider_account 
ON public.company_integrations (provider_account_id) 
WHERE provider = 'ycloud';

NOTIFY pgrst, 'reload schema';
