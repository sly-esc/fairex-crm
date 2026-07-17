-- ======================================================================================
-- MIGRACIÓN FASE 7 — SUPER ADMIN & ONBOARDING
-- ======================================================================================
-- Objetivo: Agregar campos a la tabla `companies` para el flujo de onboarding
--           y routing. Extiende la Fase 6 sin modificarla.
--
-- REGLAS INAMOVIBLES:
-- 1. Solo ADD COLUMN IF NOT EXISTS — NUNCA ALTER COLUMN o DROP COLUMN.
-- 2. Los constraints se crean solo si no existen (idempotente).
-- 3. Migración 100% idempotente: puede ejecutarse N veces sin errores.
-- 4. No modifica ninguna tabla ni política RLS previamente definida.
-- 5. Fase 6 ya fue ejecutada en producción — este archivo NO toca nada de Fase 6.
-- ======================================================================================

DO $$
BEGIN

    -- ==================================================================================
    -- 1. COLUMNA: companies.slug
    -- ==================================================================================
    -- Identificador URL único por empresa (ej. "comercial-norte").
    -- Se agrega primero la columna, luego el constraint UNIQUE por separado
    -- para garantizar idempotencia incluso si la columna ya existía sin constraint.
    -- ==================================================================================

    -- 1.a Agregar columna slug si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'companies'
          AND column_name  = 'slug'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN slug TEXT;
    END IF;

    -- 1.b Crear constraint UNIQUE sobre slug solo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name        = 'companies'
          AND constraint_name   = 'unique_company_slug'
    ) THEN
        ALTER TABLE public.companies
            ADD CONSTRAINT unique_company_slug UNIQUE (slug);
    END IF;

    -- ==================================================================================
    -- 2. COLUMNA: companies.onboarding_completed_at
    -- ==================================================================================
    -- Timestamp exacto en que el onboarding fue marcado como completado.
    -- NULL = onboarding todavía en proceso.
    -- ==================================================================================

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'companies'
          AND column_name  = 'onboarding_completed_at'
    ) THEN
        ALTER TABLE public.companies
            ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
    END IF;

    -- ==================================================================================
    -- 3. COLUMNA: companies.onboarding_status
    -- ==================================================================================
    -- Estado del proceso de onboarding.
    -- Valores válidos: 'pending' | 'in_progress' | 'completed' | 'suspended'
    -- Default 'pending' para empresas nuevas.
    -- ==================================================================================

    -- 3.a Agregar columna onboarding_status si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'companies'
          AND column_name  = 'onboarding_status'
    ) THEN
        ALTER TABLE public.companies
            ADD COLUMN onboarding_status TEXT DEFAULT 'pending';
    END IF;

    -- 3.b CHECK constraint sobre onboarding_status — idempotente
    -- Protege la integridad del campo sin necesitar un tipo ENUM
    -- (los ENUMs en Postgres son difíciles de extender sin migraciones adicionales).
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name        = 'companies'
          AND constraint_name   = 'chk_onboarding_status'
    ) THEN
        ALTER TABLE public.companies
            ADD CONSTRAINT chk_onboarding_status
            CHECK (onboarding_status IN ('pending', 'in_progress', 'completed', 'suspended'));
    END IF;

END $$;
