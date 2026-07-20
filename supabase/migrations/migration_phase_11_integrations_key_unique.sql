-- ======================================================================================
-- MIGRACIÓN FASE 11: UNIQUE(company_id, integration_key) en company_integrations
-- ======================================================================================
-- Objetivo: Garantizar que cada empresa tenga como máximo una configuración
--           por canal lógico (integration_key), sin importar cuántas veces cambie
--           el provider_account_id. Resuelve la estrategia de upsert atómico.
--
-- REGLAS INAMOVIBLES:
-- 1. Solo ADD CONSTRAINT mediante bloque DO — NUNCA ALTER COLUMN ni DROP.
-- 2. Aborta con mensaje claro si existen duplicados previos.
-- 3. No elimina el constraint histórico: UNIQUE(company_id, provider, provider_account_id).
-- 4. Idempotente: puede ejecutarse N veces sin errores si el constraint ya existe.
-- 5. No cambia tipos ni elimina columnas.
-- ======================================================================================

DO $$
BEGIN

  -- ──────────────────────────────────────────────────────────────────────────────────────
  -- PASO 1: Verificar ausencia de duplicados (company_id, integration_key)
  -- Si los hay, abortar con mensaje explicativo antes de intentar ADD CONSTRAINT.
  -- ──────────────────────────────────────────────────────────────────────────────────────
  IF EXISTS (
    SELECT company_id, integration_key
    FROM   public.company_integrations
    GROUP  BY company_id, integration_key
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'FAIREX ERROR: Existen filas duplicadas en public.company_integrations '
      'por (company_id, integration_key). Limpia los duplicados antes de ejecutar '
      'esta migración.';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────────────────────
  -- PASO 2: Agregar constraint UNIQUE solo si no existe todavía
  -- Se consulta pg_constraint para garantizar idempotencia completa.
  -- ──────────────────────────────────────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_class      t ON t.oid = c.conrelid
    JOIN   pg_namespace  n ON n.oid = t.relnamespace
    WHERE  n.nspname = 'public'
      AND  t.relname = 'company_integrations'
      AND  c.conname = 'uq_company_integration_key'
      AND  c.contype = 'u'
  ) THEN
    ALTER TABLE public.company_integrations
      ADD CONSTRAINT uq_company_integration_key
      UNIQUE (company_id, integration_key);
  END IF;

END $$;

-- Recargar schema de PostgREST para que el constraint sea visible inmediatamente
NOTIFY pgrst, 'reload schema';
