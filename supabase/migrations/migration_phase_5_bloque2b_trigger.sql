-- ======================================================================================
-- MIGRACIÓN FASE 5 - BLOQUE 2B: Trigger Onboarding (auth.users -> profiles)
-- ======================================================================================
-- Objetivo: Crear la identidad del usuario en profiles de forma automática.
-- REGLA DE ARQUITECTURA (INAMOVIBLE): 
-- Este trigger tiene la responsabilidad ÚNICA de crear el registro en profiles.
-- Toda la lógica de onboarding (empresas, módulos, IA, inventario, etc.) DEBE
-- permanecer fuera de este trigger y gestionarse en servicios independientes.
--
-- Restricciones adicionales:
-- 1. Idempotente (CREATE OR REPLACE / DROP IF EXISTS)
-- 2. Extensible (v_meta JSONB)
-- 3. Validación explícita de FK y parseo de tipos con errores personalizados
-- ======================================================================================

-- 1. Limpieza de funciones y triggers anteriores para garantizar idempotencia y evitar conflictos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- 2. Crear o reemplazar la función manejadora de forma idempotente
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Mejor práctica de seguridad para funciones definer
SET search_path = public, pg_temp
AS $$
DECLARE
  v_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_company_id BIGINT;
BEGIN
  -- Bloque seguro de conversión de tipos
  BEGIN
    v_company_id := (v_meta->>'company_id')::BIGINT;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'FAIREX ERROR: El company_id proporcionado en la metadata del usuario no es un numero valido.';
  END;

  -- Validación de nulidad
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'FAIREX ERROR: company_id es obligatorio en raw_user_meta_data para crear un usuario.';
  END IF;

  -- Validación explícita de existencia (en lugar de delegar al constraint FK genérico)
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = v_company_id) THEN
    RAISE EXCEPTION 'FAIREX ERROR: El company_id % proporcionado en la metadata no existe en la tabla companies.', v_company_id;
  END IF;

  -- Insertamos el perfil respetando la responsabilidad única
  INSERT INTO public.profiles (
    auth_user_id,
    company_id,
    role
  )
  VALUES (
    NEW.id,
    v_company_id,
    COALESCE(v_meta->>'role', 'agent') -- Rol por defecto si no se especifica
  )
  -- Si el perfil ya fue creado por otra vía (ej. script manual), ignoramos silenciosamente
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 3. Instalar el trigger automático en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
