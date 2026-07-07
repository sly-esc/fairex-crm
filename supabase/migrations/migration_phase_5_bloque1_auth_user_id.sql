-- ======================================================================================
-- MIGRACIÓN FASE 5 - BLOQUE 1: Expansión del Esquema (auth_user_id)
-- ======================================================================================
-- Objetivo: Crear la columna auth_user_id en la tabla profiles para enlazarla con 
-- auth.users(id) sin romper la compatibilidad actual de profiles.id (BIGINT).
-- Esta migración es segura y no afecta el funcionamiento actual.
-- ======================================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) UNIQUE;
    END IF;
END $$;
