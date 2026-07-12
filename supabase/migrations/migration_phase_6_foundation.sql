-- ======================================================================================
-- MIGRACIÓN FASE 6 - FUNDACIÓN SaaS (Bloque A)
-- ======================================================================================
-- Objetivo: Sentar las bases de la plataforma SaaS (módulos e integraciones)
-- sin afectar workflows de n8n, tablas existentes ni políticas RLS actuales.
-- ======================================================================================

-- ======================================================================================
-- 1. FUNDACIÓN SaaS: company_modules y company_integrations
-- ======================================================================================

-- 1.1 company_modules (Feature Flags por empresa)
-- RESPONSABILIDAD ARQUITECTÓNICA: 
-- Esta tabla responde únicamente a la pregunta: "¿Tiene la empresa X acceso al módulo Y?".
-- DECISIÓN DE DISEÑO:
-- Intencionalmente NO almacena configuración visual (nombres, iconos, orden). La 
-- presentación del Dashboard debe estar completamente desacoplada del modelo de datos 
-- para permitir flexibilidad en el frontend y evitar actualizaciones masivas.
CREATE TABLE IF NOT EXISTS company_modules (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id        BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_key        TEXT NOT NULL,
    is_active         BOOLEAN DEFAULT true,
    activated_at      TIMESTAMPTZ DEFAULT now(),
    config            JSONB DEFAULT '{}'::jsonb,
    plan_required     TEXT DEFAULT 'starter',
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, module_key)
);

-- Índices de Rendimiento
CREATE INDEX idx_company_modules_company_id ON company_modules(company_id);

-- RLS company_modules
ALTER TABLE company_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_modules_select_company" ON company_modules;
CREATE POLICY "company_modules_select_company" ON company_modules
    FOR SELECT TO authenticated
    USING (company_id = public.get_my_company_id());


-- 1.2 company_integrations (Gestión de terceros)
-- RESPONSABILIDAD ARQUITECTÓNICA:
-- Administra todas las conexiones hacia servicios externos (Meta, Rack, Shopify, etc.).
-- DECISIÓN DE DISEÑO:
-- 1. Se utiliza `provider` y `provider_account_id` en lugar de una clave única global 
--    para permitir la gestión de múltiples cuentas del mismo proveedor (ej. 3 fanpages).
-- 2. ZERO TRUST: No hay políticas RLS de `SELECT` para el rol `authenticated`. La 
--    columna `credentials` contiene secretos (tokens, API keys) que NUNCA deben llegar 
--    al cliente JS. El acceso es exclusivamente vía Server Actions (`service_role`).
CREATE TABLE IF NOT EXISTS company_integrations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    provider            TEXT NOT NULL CHECK (provider IN ('meta', 'rack', 'shopify', 'woocommerce', 'microsip', 'manual', 'google', 'tiktok', 'stripe')), -- Proveedor maestro
    integration_key     TEXT NOT NULL,                           -- Identificador interno de FAIREX
    provider_account_id TEXT,                                    -- ID externo (ej. Facebook Page ID, WhatsApp Phone ID)
    display_name        TEXT,                                    -- Nombre amigable (ej. "Línea Ventas Norte")
    connection_type     TEXT DEFAULT 'oauth' CHECK (connection_type IN ('oauth', 'api_key', 'webhook', 'manual')), -- Modo de conexión
    is_active           BOOLEAN DEFAULT true,
    status              TEXT DEFAULT 'disconnected',
    credentials         JSONB,                                   -- Secretos, NUNCA expuestos al cliente
    config              JSONB DEFAULT '{}'::jsonb,               -- Configuración pública
    last_sync_at        TIMESTAMPTZ,
    last_error          TEXT,
    sync_frequency      TEXT DEFAULT 'manual',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, provider, provider_account_id)            -- Permite multi-cuenta por empresa
);

-- Índices de Rendimiento
CREATE INDEX idx_company_integrations_company_id ON company_integrations(company_id);
CREATE INDEX idx_company_integrations_provider ON company_integrations(provider);

-- RLS company_integrations (Seguridad Crítica)
ALTER TABLE company_integrations ENABLE ROW LEVEL SECURITY;

-- Nota de seguridad: La tabla carece intencionalmente de políticas para authenticated.
