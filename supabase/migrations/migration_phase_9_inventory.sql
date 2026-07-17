-- ======================================================================================
-- MIGRACIÓN FASE 9 — INVENTARIO / PRODUCTOS
-- ======================================================================================
-- Objetivo: Crear la tabla base de productos para el manejo de inventario,
--           asegurando la compatibilidad con BIGINT en company_id.
--
-- REGLAS:
-- 1. company_id es BIGINT para coincidir con el schema real de producción.
-- 2. Estructura 100% idempotente (CREATE TABLE IF NOT EXISTS).
-- 3. RLS: SELECT, INSERT, UPDATE restringidos por company_id = public.get_my_company_id().
-- 4. DELETE intencionalmente bloqueado para authenticated (se usará is_active).
-- ======================================================================================

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2),
    cost_price NUMERIC(12,2),
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    unit TEXT,
    category TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    source TEXT DEFAULT 'csv',
    external_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_company_sku UNIQUE(company_id, sku),
    CONSTRAINT price_non_negative CHECK (price IS NULL OR price >= 0),
    CONSTRAINT cost_price_non_negative CHECK (cost_price IS NULL OR cost_price >= 0),
    CONSTRAINT stock_non_negative CHECK (stock >= 0),
    CONSTRAINT min_stock_non_negative CHECK (min_stock >= 0)
);

-- ======================================================================================
-- ÍNDICES DE RENDIMIENTO (Idempotentes)
-- ======================================================================================
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- ======================================================================================
-- TRIGGER UPDATED_AT (Idempotente)
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.handle_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_products_updated_at();

-- ======================================================================================
-- SEGURIDAD Y PERMISOS
-- ======================================================================================

-- 1. GRANTS explícitos
GRANT SELECT, INSERT, UPDATE ON public.products TO authenticated;
-- No se otorga DELETE a authenticated

-- 2. Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. SELECT: Solo ver productos de tu empresa
DROP POLICY IF EXISTS "products_select_company" ON public.products;
CREATE POLICY "products_select_company" ON public.products
    FOR SELECT 
    TO authenticated
    USING (company_id = public.get_my_company_id());

-- 4. INSERT: Solo crear productos en tu empresa
DROP POLICY IF EXISTS "products_insert_company" ON public.products;
CREATE POLICY "products_insert_company" ON public.products
    FOR INSERT 
    TO authenticated
    WITH CHECK (company_id = public.get_my_company_id());

-- 5. UPDATE: Solo actualizar productos de tu empresa
DROP POLICY IF EXISTS "products_update_company" ON public.products;
CREATE POLICY "products_update_company" ON public.products
    FOR UPDATE 
    TO authenticated
    USING (company_id = public.get_my_company_id())
    WITH CHECK (company_id = public.get_my_company_id());

-- NOTA: DELETE masivo intencionalmente no definido para el rol authenticated.
