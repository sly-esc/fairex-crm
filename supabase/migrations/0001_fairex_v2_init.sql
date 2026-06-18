-- ============================================================================
-- FAIREX V2 INIT MIGRATION
-- Fecha: 2026-06-02
-- Descripción: Creación de tablas base multiempresa y actualización de esquema actual
-- ============================================================================

-- ============================================================================
-- 1. CREACIÓN DE TABLAS NUEVAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  industry          TEXT,
  plan              TEXT DEFAULT 'starter',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'vendedor',
  is_active         BOOLEAN DEFAULT true,
  joined_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  avatar_url        TEXT,
  phone             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  assigned_to       UUID REFERENCES company_members(id),
  lead_id           UUID,
  status            TEXT DEFAULT 'pending',
  priority          TEXT DEFAULT 'medium',
  due_date          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES company_members(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT,
  data              JSONB,
  is_read           BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  ai_config         JSONB DEFAULT '{"tone": "profesional", "auto_response": true}',
  pipeline_stages   JSONB DEFAULT '["interesado", "seguimiento", "caliente", "cerrado", "perdido"]',
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. MODIFICACIÓN A TABLAS EXISTENTES (ALTER TABLE)
-- Todas las columnas nuevas NO TIENEN restricción "NOT NULL" para no romper n8n
-- ============================================================================

-- Tabla: clientes
ALTER TABLE clientes 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES company_members(id),
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS valor_estimado DECIMAL(12,2);

-- Tabla: conversaciones
ALTER TABLE conversaciones 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES company_members(id),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Tabla: lead_memory
ALTER TABLE lead_memory 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Tabla: n8n_chat_history
ALTER TABLE n8n_chat_history 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
