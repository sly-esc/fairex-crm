-- ======================================================================================
-- MIGRACIÓN FASE 4 - ROW LEVEL SECURITY (RLS) "ZERO TRUST" ENTERPRISE
-- ======================================================================================
-- Objetivo: Restringir el acceso a los datos de la base de datos a nivel de fila.
-- Ingesta: N8N mantiene plenos poderes vía 'service_role' (bypassa el RLS por defecto).
-- Permisos: Inserciones (INSERT) y Borrados (DELETE) quedan bloqueados explícitamente 
-- para todos los usuarios autenticados del dashboard.
-- ======================================================================================

-- ======================================================================================
-- 1. FUNCIÓN MAESTRA: OPTIMIZACIÓN Y AISLAMIENTO (SECURITY DEFINER)
-- Bypassa el RLS de 'profiles' temporalmente para obtener la compañía sin causar
-- recursividad. STABLE permite que PostgreSQL cachee el resultado por consulta.
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
    SELECT company_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_company_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO authenticated;


-- ======================================================================================
-- 2. HABILITAR SEGURIDAD A NIVEL DE FILA (RLS)
-- Nota: Una vez habilitado, el acceso por defecto (para 'anon' y 'authenticated') 
-- queda totalmente bloqueado hasta que se evalúan las políticas inferiores.
-- Orden de habilitación: companies -> profiles -> lead_memory -> n8n_chat_histories
-- ======================================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies FORCE ROW LEVEL SECURITY;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE lead_memory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE lead_memory FORCE ROW LEVEL SECURITY;

ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE n8n_chat_histories FORCE ROW LEVEL SECURITY;


-- ======================================================================================
-- 3. POLÍTICAS RLS: profiles
-- Condición: El ID del perfil debe coincidir con el token criptográfico JWT de Auth.
-- ======================================================================================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT 
    TO authenticated
    USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());


-- ======================================================================================
-- 4. POLÍTICAS RLS: lead_memory
-- Condición: Filtro cacheado por la función public.get_my_company_id().
-- ======================================================================================
DROP POLICY IF EXISTS "lead_memory_select_company" ON lead_memory;
CREATE POLICY "lead_memory_select_company" ON lead_memory
    FOR SELECT 
    TO authenticated
    USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "lead_memory_update_company" ON lead_memory;
CREATE POLICY "lead_memory_update_company" ON lead_memory
    FOR UPDATE 
    TO authenticated
    USING (company_id = public.get_my_company_id())
    WITH CHECK (company_id = public.get_my_company_id());


-- ======================================================================================
-- 5. POLÍTICAS RLS: n8n_chat_histories
-- Condición: Filtro cacheado por la función public.get_my_company_id().
-- Exclusivo Lectura: Chat inmutable.
-- ======================================================================================
DROP POLICY IF EXISTS "chat_histories_select_company" ON n8n_chat_histories;
CREATE POLICY "chat_histories_select_company" ON n8n_chat_histories
    FOR SELECT 
    TO authenticated
    USING (company_id = public.get_my_company_id());


-- ======================================================================================
-- 6. POLÍTICAS RLS: companies
-- Condición: Un usuario solo puede ver la existencia de su propia compañía.
-- Blindaje contra escaneo de base de clientes/competidores.
-- ======================================================================================
DROP POLICY IF EXISTS "companies_select_own" ON companies;
CREATE POLICY "companies_select_own" ON companies
    FOR SELECT 
    TO authenticated
    USING (id = public.get_my_company_id());
