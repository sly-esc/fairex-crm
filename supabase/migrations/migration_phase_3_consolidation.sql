-- ======================================================================================
-- MIGRACIÓN DE CONSOLIDACIÓN - FASE 3 (MULTIEMPRESA) - VERSIÓN DEFINITIVA
-- ======================================================================================
-- Objetivo: Sanear y blindar la base de datos tras las modificaciones manuales,
-- unificar los tipos de datos (bigint) para garantizar la integridad referencial,
-- transicionar de 'users' a 'profiles', y aplicar restricciones estrictas.
-- Es un script 100% idempotente, dinámico y que fallará explícitamente 
-- si existen inconsistencias críticas insalvables.
-- ======================================================================================

-- ======================================================================================
-- 1. ASEGURAR QUE LA COMPAÑÍA PRINCIPAL (ID=1) EXISTA (Inserción Dinámica)
-- ======================================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM companies WHERE id = 1) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='company_name') THEN
            EXECUTE 'INSERT INTO companies (id, company_name) VALUES (1, ''Fairex Default'')';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='name') THEN
            EXECUTE 'INSERT INTO companies (id, name) VALUES (1, ''Fairex Default'')';
        ELSE
            EXECUTE 'INSERT INTO companies (id) VALUES (1)';
        END IF;
    END IF;
END $$;

-- ======================================================================================
-- 2. TRANSICIÓN DE users A profiles (IDEMPOTENTE)
-- ======================================================================================
DO $$ 
BEGIN
    -- Si existe la tabla public.users
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Y no existe aún public.profiles
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
            ALTER TABLE public.users RENAME TO profiles;
        END IF;
    END IF;
END $$;


-- ======================================================================================
-- 4. SANEAMIENTO DE DATOS HISTÓRICOS (BACKFILL)
-- Reemplazar los valores NULL por 1 solo si las columnas existen.
-- ======================================================================================
DO $$
BEGIN
    -- profiles
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_id') THEN
            UPDATE profiles SET company_id = 1 WHERE company_id IS NULL;
        END IF;
    END IF;

    -- lead_memory
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lead_memory' AND column_name='company_id') THEN
        UPDATE lead_memory SET company_id = 1 WHERE company_id IS NULL;
    END IF;

    -- n8n_chat_histories
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='n8n_chat_histories' AND column_name='company_id') THEN
        UPDATE n8n_chat_histories SET company_id = 1 WHERE company_id IS NULL;
    END IF;
END $$;

-- ======================================================================================
-- 5. BLINDAJE ESTRUCTURAL: lead_memory
-- Nota: Sin bloques EXCEPTION para que los errores de FK sean explícitos.
-- ======================================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lead_memory' AND column_name='company_id') THEN
        ALTER TABLE lead_memory ALTER COLUMN company_id SET DEFAULT 1;
        ALTER TABLE lead_memory ALTER COLUMN company_id SET NOT NULL;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lead_memory_company') THEN
            ALTER TABLE lead_memory 
            ADD CONSTRAINT fk_lead_memory_company 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
        END IF;
    END IF;
END $$;

-- ======================================================================================
-- 6. BLINDAJE ESTRUCTURAL: n8n_chat_histories
-- ======================================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='n8n_chat_histories' AND column_name='company_id') THEN
        ALTER TABLE n8n_chat_histories ALTER COLUMN company_id SET DEFAULT 1;
        ALTER TABLE n8n_chat_histories ALTER COLUMN company_id SET NOT NULL;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_chat_company') THEN
            ALTER TABLE n8n_chat_histories 
            ADD CONSTRAINT fk_chat_company 
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
        END IF;
    END IF;
END $$;

-- ======================================================================================
-- 7. BLINDAJE ESTRUCTURAL: profiles
-- ======================================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_id') THEN
            ALTER TABLE profiles ALTER COLUMN company_id SET DEFAULT 1;
            ALTER TABLE profiles ALTER COLUMN company_id SET NOT NULL;

            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_company') THEN
                ALTER TABLE profiles 
                ADD CONSTRAINT fk_profiles_company 
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
            END IF;
        END IF;
    END IF;
END $$;
